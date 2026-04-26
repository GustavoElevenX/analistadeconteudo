import { ApifyClient } from 'apify-client';
import { parseStringPromise } from 'xml2js';
import { config } from './config.js';

const DEFAULT_SEARCH_QUERIES = [
  '"gestao comercial" vendas B2B Brasil',
  '"diretor comercial" vendas B2B',
  '"time de vendas" lideranca comercial',
  '"funil de vendas" CRM pipeline',
  '"processo comercial" forecast vendas',
  '"CRM" "WhatsApp Business" vendas',
  '"Sebrae" "vendas B2B"',
  '"inteligencia artificial" "vendas B2B"'
];

const REQUIRED_SOURCE_TERMS = [
  'b2b',
  'gestao comercial',
  'gestão comercial',
  'diretor comercial',
  'lideranca comercial',
  'liderança comercial',
  'time de vendas',
  'funil de vendas',
  'processo comercial',
  'pipeline',
  'forecast',
  'crm',
  'whatsapp business',
  'sdr',
  'closer'
];

const BLOCKED_SOURCE_TERMS = [
  'msc',
  'itinerario',
  'itinerário',
  'temporada',
  'imobiliaria',
  'imobiliária',
  'collab',
  'consumidores',
  'turismo',
  'viagem'
];

const BLOCKED_SOCIAL_TERMS = [
  '[vaga]',
  'oportunidade',
  'processo seletivo',
  'envia teu currículo',
  'envie seu currículo',
  'recrutando',
  'contratando',
  'mapa -',
  'pind',
  'planejamento estratégico -',
  'trabalho acadêmico'
];

const MIN_SOURCES_BY_WINDOW = 12;

export async function scrapeAllSources() {
  if (config.apifyToken) {
    const apifySources = await scrapeApifySources();
    if (apifySources.length) return selectSourcesByFreshness(apifySources);
  }

  const rssSources = await scrapeGoogleNewsRss();
  if (!rssSources.length) {
    throw new Error('Nenhuma fonte real relevante foi coletada. Ajuste Apify/RSS antes de gerar conteudo.');
  }
  return selectSourcesByFreshness(rssSources);
}

async function scrapeApifySources() {
  const client = new ApifyClient({ token: config.apifyToken });
  const jobs = [
    scrapeGoogleSearchActor(client),
    scrapeInstagramActor(client),
    scrapeLinkedInSearchActor(client),
    scrapeLinkedInActor(client)
  ];

  const settled = await Promise.allSettled(jobs);
  const sources = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      sources.push(...result.value);
    } else {
      console.warn('Fonte Apify falhou:', result.reason.message);
    }
  }

  return dedupe(sources).filter(isRelevantSource).slice(0, 60);
}

async function scrapeGoogleSearchActor(client) {
  const actorId = process.env.APIFY_ACTOR_GOOGLE_SEARCH || 'apify/google-search-scraper';
  const queries = envList('APIFY_GOOGLE_QUERIES', DEFAULT_SEARCH_QUERIES);
  if (!queries.length) return [];

  const items = await runActor(client, actorId, {
    queries: queries.join('\n'),
    resultsPerPage: Number(process.env.APIFY_GOOGLE_RESULTS_LIMIT || 20),
    maxPagesPerQuery: 1,
    countryCode: 'br',
    languageCode: 'pt-BR',
    searchLanguage: 'pt',
    includeUnfilteredResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
    includeIcons: false
  }, 100);

  return flattenGoogleResults(items).map(item => ({
    platform: 'google_search',
    headline: item.title || item.name || item.headline || '',
    url: item.url || item.link || '',
    summary: item.description || item.snippet || item.text || '',
    publishedAt: normalizePublishedAt(item.date || item.publishedAt || ''),
    relevance: null
  })).filter(item => item.headline);
}

async function scrapeInstagramActor(client) {
  const actorId = process.env.APIFY_ACTOR_INSTAGRAM || 'apify/instagram-scraper';
  const directUrls = [
    ...envList('APIFY_INSTAGRAM_URLS'),
    ...envList('APIFY_INSTAGRAM_HASHTAGS').map(tag => `https://www.instagram.com/explore/tags/${tag.replace(/^#/, '')}/`)
  ];
  if (!directUrls.length) {
    console.warn('Instagram Apify pulado: configure APIFY_INSTAGRAM_URLS ou APIFY_INSTAGRAM_HASHTAGS.');
    return [];
  }

  const items = await runActor(client, actorId, {
    directUrls,
    resultsType: 'posts',
    resultsLimit: Number(process.env.APIFY_INSTAGRAM_RESULTS_LIMIT || 20),
    searchType: 'hashtag',
    searchLimit: 1
  }, Number(process.env.APIFY_INSTAGRAM_RESULTS_LIMIT || 20) + 20);

  return items.map(item => ({
    platform: 'instagram',
    headline: instagramHeadline(item),
    url: item.url || (item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : ''),
    summary: [
      item.caption,
      item.ownerUsername ? `Perfil: @${item.ownerUsername}` : '',
      item.likesCount != null ? `Curtidas: ${item.likesCount}` : '',
      item.commentsCount != null ? `Comentarios: ${item.commentsCount}` : ''
    ].filter(Boolean).join(' | '),
    publishedAt: normalizePublishedAt(item.timestamp || item.takenAtTimestamp || ''),
    relevance: null
  })).filter(item => item.headline);
}

async function scrapeLinkedInActor(client) {
  const actorId = process.env.APIFY_ACTOR_LINKEDIN || 'harvestapi/postagens-de-perfil-do-linkedin';
  const targetUrls = envList('APIFY_LINKEDIN_PROFILE_URLS');
  if (!targetUrls.length) {
    console.warn('LinkedIn Apify pulado: configure APIFY_LINKEDIN_PROFILE_URLS com perfis ou empresas.');
    return [];
  }

  const maxPosts = Number(process.env.APIFY_LINKEDIN_POSTS_LIMIT || 10);
  const items = await runActor(client, actorId, {
    targetUrls,
    postedLimit: 'month',
    maxPosts,
    includeQuotePosts: true
  }, maxPosts * targetUrls.length + 10);

  return items.map(item => ({
    platform: 'linkedin',
    headline: linkedinHeadline(item),
    url: linkedinUrl(item),
    summary: [
      linkedinText(item),
      linkedinAuthorName(item) ? `Autor: ${linkedinAuthorName(item)}` : '',
      linkedinLikes(item) != null ? `Reacoes: ${linkedinLikes(item)}` : '',
      linkedinComments(item) != null ? `Comentarios: ${linkedinComments(item)}` : ''
    ].filter(Boolean).join(' | '),
    publishedAt: normalizePublishedAt(linkedinPublishedAt(item)),
    relevance: null
  })).filter(item => item.headline && !isBlockedSocialPost(item));
}

async function scrapeLinkedInSearchActor(client) {
  const actorId = process.env.APIFY_ACTOR_LINKEDIN_SEARCH || 'harvestapi/linkedin-post-search';
  const searchQueries = envList('APIFY_LINKEDIN_SEARCH_QUERIES', [
    'gestao comercial',
    'vendas B2B',
    'lideranca comercial',
    'forecast vendas',
    'pipeline de vendas',
    'CRM vendas',
    'funil de vendas'
  ]);
  if (!searchQueries.length) {
    console.warn('LinkedIn Search Apify pulado: configure APIFY_LINKEDIN_SEARCH_QUERIES.');
    return [];
  }

  const maxPosts = Number(process.env.APIFY_LINKEDIN_SEARCH_POSTS_LIMIT || 10);
  const items = await runActor(client, actorId, {
    searchQueries,
    maxPosts,
    postedLimit: 'month',
    sortBy: 'date',
    contentType: 'all',
    scrapeComments: false,
    postNestedReactions: false,
    postNestedComments: false
  }, maxPosts * searchQueries.length + 10);

  return items.map(item => ({
    platform: 'linkedin_search',
    headline: linkedinHeadline(item),
    url: linkedinUrl(item),
    summary: [
      linkedinText(item),
      linkedinAuthorName(item) ? `Autor: ${linkedinAuthorName(item)}` : '',
      linkedinAuthorTitle(item) ? `Cargo: ${linkedinAuthorTitle(item)}` : '',
      linkedinLikes(item) != null ? `Reacoes: ${linkedinLikes(item)}` : '',
      linkedinComments(item) != null ? `Comentarios: ${linkedinComments(item)}` : ''
    ].filter(Boolean).join(' | '),
    publishedAt: normalizePublishedAt(linkedinPublishedAt(item)),
    relevance: null
  })).filter(item => item.headline && !isBlockedSocialPost(item));
}

async function runActor(client, actorId, input, limit) {
  const run = await client.actor(actorId).call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit });
  return items;
}

async function scrapeGoogleNewsRss() {
  const results = [];
  for (const query of DEFAULT_SEARCH_QUERIES.slice(0, 6)) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const xml = await resp.text();
      const parsed = await parseStringPromise(xml);
      const items = parsed?.rss?.channel?.[0]?.item || [];
      for (const item of items.slice(0, 6)) {
        results.push({
          platform: 'google_news',
          headline: item.title?.[0] || query,
          url: item.link?.[0] || '',
          summary: stripHtml(item.description?.[0] || ''),
          publishedAt: normalizePublishedAt(item.pubDate?.[0] || ''),
          relevance: null
        });
      }
    } catch (error) {
      console.warn(`RSS falhou para "${query}":`, error.message);
    }
  }
  return dedupe(results).filter(isRelevantSource).slice(0, 30);
}

function stripHtml(value) {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.url || item.headline;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isRelevantSource(item) {
  const text = `${item.headline || ''} ${item.summary || ''}`.toLowerCase();
  if (item.platform === 'instagram' || item.platform === 'linkedin' || item.platform === 'linkedin_search') {
    if (BLOCKED_SOCIAL_TERMS.some(term => text.includes(term))) return false;
    return REQUIRED_SOURCE_TERMS.some(term => text.includes(term));
  }
  if (BLOCKED_SOURCE_TERMS.some(term => text.includes(term))) return false;
  return REQUIRED_SOURCE_TERMS.some(term => text.includes(term));
}

function flattenGoogleResults(items) {
  const flattened = [];
  for (const item of items) {
    if (Array.isArray(item.organicResults)) flattened.push(...item.organicResults);
    else if (Array.isArray(item.organic_results)) flattened.push(...item.organic_results);
    else flattened.push(item);
  }
  return flattened;
}

function instagramHeadline(item) {
  const caption = String(item.caption || '').replace(/\s+/g, ' ').trim();
  if (caption) return caption.slice(0, 120);
  if (item.ownerUsername) return `Post Instagram de @${item.ownerUsername}`;
  return item.url || item.shortCode || '';
}

function linkedinHeadline(item) {
  const text = linkedinText(item);
  if (text) return text.slice(0, 120);
  const authorName = linkedinAuthorName(item);
  if (authorName) return `Post LinkedIn de ${authorName}`;
  return linkedinUrl(item);
}

function linkedinText(item) {
  return String(item.text || item.content || item.commentary || item.postText || '').replace(/\s+/g, ' ').trim();
}

function linkedinUrl(item) {
  return item.linkedinUrl || item.url || item.postUrl || item.postUrlWithAnalytics || item.activityUrl || item.socialContent?.shareUrl || '';
}

function linkedinAuthorName(item) {
  return item.authorName || item.author?.name || '';
}

function linkedinAuthorTitle(item) {
  return item.authorTitle || item.author?.info || '';
}

function linkedinLikes(item) {
  return item.numLikes ?? item.engagement?.likes ?? null;
}

function linkedinComments(item) {
  return item.numComments ?? item.engagement?.comments ?? null;
}

function linkedinPublishedAt(item) {
  return item.postedAt?.date || item.postedAt || item.date || item.publishedAt || '';
}

function isBlockedSocialPost(item) {
  const text = `${item.headline || ''} ${item.summary || ''}`.toLowerCase();
  return BLOCKED_SOCIAL_TERMS.some(term => text.includes(term));
}

function envList(name, fallback = []) {
  const value = process.env[name];
  if (!value) return fallback;
  return value
    .split('|')
    .map(item => item.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

function selectSourcesByFreshness(sources) {
  const dated = sources.map(source => ({
    ...source,
    publishedAt: normalizePublishedAt(source.publishedAt)
  }));

  for (const days of [1, 3, 7]) {
    const fresh = dated.filter(source => isWithinDays(source.publishedAt, days));
    if (fresh.length >= MIN_SOURCES_BY_WINDOW) {
      return fresh.slice(0, 60).map(source => ({ ...source, freshness_window_days: days }));
    }
  }

  const withDates = dated.filter(source => source.publishedAt);
  if (withDates.length) {
    const undated = dated.filter(source => !source.publishedAt);
    return [...withDates, ...undated]
      .slice(0, 60)
      .map(source => ({ ...source, freshness_window_days: source.publishedAt ? 7 : null }));
  }

  return dated.slice(0, 60).map(source => ({ ...source, freshness_window_days: null }));
}

function isWithinDays(value, days) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const ageMs = Date.now() - date.getTime();
  return ageMs >= 0 && ageMs <= days * 24 * 60 * 60 * 1000;
}

function normalizePublishedAt(value) {
  if (!value) return '';
  if (typeof value === 'number') {
    const timestamp = value > 100000000000 ? value : value * 1000;
    return new Date(timestamp).toISOString();
  }
  const text = String(value);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
}
