import { config } from './config.js';
import { db } from './database.js';

export async function syncRecentMetrics() {
  ensureInstagramConfig();
  const mediaPath = config.instagram.userId === 'me' ? '/me/media' : `/${config.instagram.userId}/media`;
  const media = await graphGet(mediaPath, {
    fields: 'id,caption,media_type,timestamp,permalink',
    limit: '20'
  });

  const items = media.data || [];
  for (const item of items) {
    const insights = await fetchInsights(item);
    upsertMetric(item, insights);
  }
  return { synced: items.length };
}

export async function testInstagramConnection() {
  ensureInstagramConfig();
  return graphGet('/me', { fields: 'id,username' });
}

async function fetchInsights(media) {
  const metricSets = media.media_type === 'REEL'
    ? [
        ['reach', 'plays', 'likes', 'comments', 'shares', 'saved'],
        ['views', 'likes', 'comments', 'shares', 'saved'],
        ['reach', 'likes', 'comments', 'shares', 'saved']
      ]
    : [
        ['reach', 'likes', 'comments', 'shares', 'saved'],
        ['views', 'likes', 'comments', 'shares', 'saved']
      ];

  for (const metrics of metricSets) {
    try {
      const response = await graphGet(`/${media.id}/insights`, { metric: metrics.join(',') });
      return Object.fromEntries((response.data || []).map(row => [normalizeMetricName(row.name), row.values?.[0]?.value || 0]));
    } catch (error) {
      media.lastInsightError = error.message;
    }
  }

  console.warn(`Falha ao buscar insights de ${media.id}: ${media.lastInsightError}`);
  return {};
}

function upsertMetric(media, metrics) {
  const existing = db.prepare('SELECT link_clicks, leads_generated FROM post_metrics WHERE instagram_post_id = ?').get(media.id) || {};
  const reach = Number(metrics.reach || 0);
  const engagement = Number(metrics.likes || 0) + Number(metrics.comments || 0) + Number(metrics.shares || 0) + Number(metrics.saves || 0);
  const engagementRate = reach ? (engagement / reach) * 100 : 0;
  const retentionScore = reach ? (Number(metrics.plays || 0) / reach) * 100 : 0;
  const leadActions = Number(metrics.profile_visits || 0)
    + (Number(existing.link_clicks || 0) * 2)
    + (Number(existing.leads_generated || 0) * 8);
  const leadScore = reach ? (leadActions / reach) * 100 : 0;

  db.prepare(`
    INSERT INTO post_metrics (
      instagram_post_id, permalink, posted_at, media_type, caption_snippet, reach, impressions, plays,
      likes, comments, shares, saves, link_clicks, leads_generated, profile_visits, engagement_rate, retention_score,
      lead_score, sync_count
    ) VALUES (
      @instagram_post_id, @permalink, @posted_at, @media_type, @caption_snippet, @reach, @impressions, @plays,
      @likes, @comments, @shares, @saves, @link_clicks, @leads_generated, @profile_visits, @engagement_rate, @retention_score,
      @lead_score, 1
    )
    ON CONFLICT(instagram_post_id) DO UPDATE SET
      permalink = excluded.permalink,
      reach = excluded.reach,
      impressions = excluded.impressions,
      plays = excluded.plays,
      likes = excluded.likes,
      comments = excluded.comments,
      shares = excluded.shares,
      saves = excluded.saves,
      link_clicks = post_metrics.link_clicks,
      leads_generated = post_metrics.leads_generated,
      profile_visits = excluded.profile_visits,
      engagement_rate = excluded.engagement_rate,
      retention_score = excluded.retention_score,
      lead_score = excluded.lead_score,
      last_synced_at = CURRENT_TIMESTAMP,
      sync_count = sync_count + 1
  `).run({
    instagram_post_id: media.id,
    permalink: media.permalink || '',
    posted_at: media.timestamp,
    media_type: media.media_type,
    caption_snippet: String(media.caption || '').slice(0, 100),
    reach,
    impressions: Number(metrics.impressions || 0),
    plays: Number(metrics.plays || 0),
    likes: Number(metrics.likes || 0),
    comments: Number(metrics.comments || 0),
    shares: Number(metrics.shares || 0),
    saves: Number(metrics.saves || metrics.saved || 0),
    link_clicks: Number(existing.link_clicks || 0),
    leads_generated: Number(existing.leads_generated || 0),
    profile_visits: Number(metrics.profile_visits || 0),
    engagement_rate: engagementRate,
    retention_score: retentionScore,
    lead_score: leadScore
  });
}

async function graphGet(path, params = {}) {
  const url = new URL(`https://graph.instagram.com${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('access_token', config.instagram.accessToken);
  const resp = await fetch(url);
  const json = await resp.json();
  if (!resp.ok || json.error) throw new Error(json.error?.message || `Instagram API HTTP ${resp.status}`);
  return json;
}

function normalizeMetricName(name) {
  if (name === 'views') return 'plays';
  return name === 'saved' ? 'saves' : name;
}

function ensureInstagramConfig() {
  if (!config.instagram.accessToken || !config.instagram.userId) {
    throw new Error('IG_ACCESS_TOKEN e IG_USER_ID nao configurados.');
  }
}
