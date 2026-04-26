import { config } from './config.js';
import { db, safeJson } from './database.js';
import { analyzePerformanceWithGpt } from './openai.js';

export function getLatestPatterns() {
  const row = db.prepare('SELECT * FROM intelligence_patterns ORDER BY id DESC LIMIT 1').get();
  if (!row) return defaultPatterns();
  return {
    ...row,
    top_hook_formulas: safeJson(row.top_hook_formulas, []),
    best_posting_hours: safeJson(row.best_posting_hours, []),
    top_lead_topics: safeJson(row.top_lead_topics, [])
  };
}

export async function updatePatterns() {
  const stats = db.prepare(`
    SELECT
      c.funil,
      c.pillar,
      AVG(pm.reach) AS avg_reach,
      AVG(pm.engagement_rate) AS avg_engagement_rate,
      AVG(pm.retention_score) AS avg_retention_score,
      AVG(pm.lead_score) AS avg_lead_score,
      SUM(pm.link_clicks) AS link_clicks,
      SUM(pm.leads_generated) AS leads_generated,
      COUNT(*) AS posts_count
    FROM post_metrics pm
    JOIN contents c ON pm.content_id = c.id
    WHERE pm.posted_at >= date('now', ?)
      AND c.used = 1
      AND c.instagram_post_id IS NOT NULL
    GROUP BY c.funil, c.pillar
  `).all(`-${config.intelligenceWindowDays} days`);

  const weights = calculateWeights(stats);
  const summary = JSON.stringify({ stats, weights }, null, 2);
  const analysis = await analyzePerformanceWithGpt(summary);

  db.prepare(`
    INSERT INTO intelligence_patterns (
      window_days, weight_topo, weight_meio, weight_fundo, weight_vendas,
      weight_empreendedorismo, weight_fe, weight_vida, top_hook_formulas,
      best_posting_hours, top_lead_topics, gpt_analysis, posts_analyzed
    ) VALUES (
      @window_days, @weight_topo, @weight_meio, @weight_fundo, @weight_vendas,
      @weight_empreendedorismo, @weight_fe, @weight_vida, @top_hook_formulas,
      @best_posting_hours, @top_lead_topics, @gpt_analysis, @posts_analyzed
    )
  `).run({
    window_days: config.intelligenceWindowDays,
    ...weights,
    top_hook_formulas: JSON.stringify([]),
    best_posting_hours: JSON.stringify([]),
    top_lead_topics: JSON.stringify(extractTopTopics()),
    gpt_analysis: analysis,
    posts_analyzed: stats.reduce((sum, row) => sum + row.posts_count, 0)
  });

  return getLatestPatterns();
}

function calculateWeights(stats) {
  if (!stats.length) return defaultPatterns();

  const funilScores = { topo: 0, meio: 0, fundo: 0 };
  const pillarScores = { vendas: 0, empreendedorismo: 0, fe: 0, vida: 0 };

  for (const row of stats) {
    const score = compositeScore(row);
    if (row.funil in funilScores) funilScores[row.funil] += score;
    if (row.pillar in pillarScores) pillarScores[row.pillar] += score;
  }

  const funil = normalize(funilScores, { topo: 0.40, meio: 0.30, fundo: 0.30 });
  const pillar = normalize(pillarScores, { vendas: 0.70, empreendedorismo: 0.20, fe: 0.05, vida: 0.05 });

  return {
    weight_topo: funil.topo,
    weight_meio: funil.meio,
    weight_fundo: funil.fundo,
    weight_vendas: pillar.vendas,
    weight_empreendedorismo: pillar.empreendedorismo,
    weight_fe: pillar.fe,
    weight_vida: pillar.vida
  };
}

function compositeScore(row) {
  return (Number(row.avg_lead_score || 0) * 0.55)
    + (Number(row.leads_generated || 0) * 8)
    + (Number(row.link_clicks || 0) * 2)
    + (Number(row.avg_retention_score || 0) * 0.15)
    + (Number(row.avg_engagement_rate || 0) * 0.15)
    + (Number(row.avg_reach || 0) * 0.05);
}

function normalize(scores, fallback) {
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  if (!total) return fallback;
  return Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Number((value / total).toFixed(4))]));
}

function extractTopTopics() {
  return db.prepare(`
    SELECT c.tema
    FROM post_metrics pm
    JOIN contents c ON pm.content_id = c.id
    WHERE c.used = 1
      AND c.instagram_post_id IS NOT NULL
    ORDER BY pm.lead_score DESC
    LIMIT 5
  `).all().map(row => row.tema);
}

function defaultPatterns() {
  return {
    weight_topo: 0.40,
    weight_meio: 0.30,
    weight_fundo: 0.30,
    weight_vendas: 0.70,
    weight_empreendedorismo: 0.20,
    weight_fe: 0.05,
    weight_vida: 0.05,
    top_hook_formulas: [],
    best_posting_hours: [],
    top_lead_topics: [],
    gpt_analysis: 'Pesos padrao em uso ate haver metricas suficientes.',
    posts_analyzed: 0
  };
}
