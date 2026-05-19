import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  apifyToken: process.env.APIFY_API_TOKEN || '',
  callmebotPhone: process.env.CALLMEBOT_PHONE || '',
  callmebotApiKey: process.env.CALLMEBOT_APIKEY || '',
  timezone: process.env.TIMEZONE || 'America/Sao_Paulo',
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'production',
  appPublicUrl: process.env.APP_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`,
  basicAuthUser: process.env.BASIC_AUTH_USER || '',
  basicAuthPass: process.env.BASIC_AUTH_PASS || '',
  creator: {
    name: process.env.CREATOR_NAME || 'Gustavo Garcia',
    partner: process.env.CREATOR_PARTNER || '',
    product: process.env.CREATOR_PRODUCT || 'Vamo',
    ctaLink: process.env.CREATOR_CTA_LINK || '',
    bio: process.env.CREATOR_BIO || '',
    hasCases: String(process.env.CREATOR_HAS_CASES || 'false') === 'true',
    positioning: process.env.CREATOR_POSITIONING || '',
    faithBoundary: process.env.CREATOR_FAITH_BOUNDARY || '',
    familyBoundary: process.env.CREATOR_FAMILY_BOUNDARY || ''
  },
  vamo: {
    positioning: process.env.VAMO_POSITIONING || '',
    thesis: process.env.VAMO_THESIS || '',
    offer: process.env.VAMO_OFFER || '',
    method: process.env.VAMO_METHOD || '',
    icp: process.env.VAMO_ICP || '',
    forbiddenPositioning: process.env.VAMO_FORBIDDEN_POSITIONING || ''
  },
  editorial: {
    narrativeMother: process.env.VAMO_NARRATIVE_MOTHER || 'A VAMO identifica onde sua operacao comercial esta perdendo vendas e implanta a estrutura para corrigir isso com processo, IA, automacoes e acompanhamento.',
    institutionalNarrative: process.env.VAMO_INSTITUTIONAL_NARRATIVE || 'A VAMO transforma operacoes comerciais confusas em operacoes mais previsiveis, usando processo, IA e tecnologia como meio.',
    aggressiveNarrative: process.env.VAMO_AGGRESSIVE_NARRATIVE || 'Nao criamos sistemas para sua empresa parecer moderna. Criamos estrutura para sua empresa parar de perder venda por falta de processo, velocidade e acompanhamento.',
    corePromise: process.env.VAMO_CORE_PROMISE || 'Menos venda perdida. Mais previsibilidade comercial.',
    communicationRule: process.env.VAMO_COMMUNICATION_RULE || 'Comece pelo vazamento comercial, depois explique processo, e so entao cite IA, automacao ou sistema como meio.',
    creatorNarrative: process.env.CREATOR_NARRATIVE || 'Eu transformo gargalos comerciais em sistemas inteligentes, automacoes e IA aplicada para empresas que querem vender com mais previsibilidade.',
    prosperityBoundary: process.env.CREATOR_PROSPERITY_BOUNDARY || 'Falar de prosperidade como fruto de ordem, responsabilidade, trabalho, prudencia, disciplina e fe aplicada a pratica. Nunca prometer sucesso financeiro por fe.',
    noTutorialRule: process.env.CONTENT_NO_TUTORIAL_RULE || 'Nao ensinar o cliente a construir sozinho. Mostrar o custo de construir errado.',
    defaultContentMode: process.env.CONTENT_DEFAULT_MODE || 'narrativa_vamo'
  },
  contentWeights: {
    vamo: Number(process.env.CONTENT_WEIGHT_VAMO || 45),
    empreendedorismo: Number(process.env.CONTENT_WEIGHT_EMPREENDEDORISMO || 20),
    fe: Number(process.env.CONTENT_WEIGHT_FE || 15),
    familia: Number(process.env.CONTENT_WEIGHT_FAMILIA || 10),
    oferta: Number(process.env.CONTENT_WEIGHT_OFERTA || 10)
  },
  dailyContentLimit: Number(process.env.DAILY_CONTENT_LIMIT || 20),
  defaultPostsPerDay: Number(process.env.DEFAULT_POSTS_PER_DAY || 5),
  briefingTopPicks: Number(process.env.BRIEFING_TOP_PICKS || 5),
  instagram: {
    accessToken: process.env.IG_ACCESS_TOKEN || '',
    userId: process.env.IG_USER_ID || '',
    tokenRefreshDays: Number(process.env.IG_TOKEN_REFRESH_DAYS || 50)
  },
  cron: {
    generate: process.env.CRON_SCRAPE_AND_GENERATE || '0 0 * * *',
    briefing: process.env.CRON_WHATSAPP_BRIEFING || '0 7 * * *',
    metrics: process.env.CRON_METRICS_SYNC || '0 */2 * * *',
    intelligence: process.env.CRON_INTELLIGENCE_UPDATE || '0 3 * * *',
    weekly: process.env.CRON_WEEKLY_REPORT || '0 8 * * 1'
  },
  metricsMinAgeHours: Number(process.env.METRICS_MIN_AGE_HOURS || 2),
  intelligenceWindowDays: Number(process.env.INTELLIGENCE_WINDOW_DAYS || 30)
};

export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function tomorrowISO() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}
