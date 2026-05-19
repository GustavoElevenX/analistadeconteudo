import { config } from './config.js';
import { db, safeJson } from './database.js';
import { analyzePerformanceWithGpt } from './openai.js';

export function getLatestPatterns() {
  const row = db.prepare('SELECT * FROM intelligence_patterns ORDER BY id DESC LIMIT 1').get();
  if (!row) return defaultPatterns();
  const weightVamo = Number(row.weight_vamo || 0);
  const weightEmpreendedorismo = Number(row.weight_empreendedorismo || 0);
  const weightFe = Number(row.weight_fe || 0);
  const weightFamilia = Number(row.weight_familia || 0);
  const weightOferta = Number(row.weight_oferta ?? Math.max(0, 1 - (
    weightVamo + weightEmpreendedorismo + weightFe + weightFamilia
  )));
  return {
    ...row,
    weight_vamo: weightVamo,
    weight_empreendedorismo: weightEmpreendedorismo,
    weight_fe: weightFe,
    weight_familia: weightFamilia,
    weight_oferta: weightOferta,
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
      c.content_intent,
      c.content_type,
      c.objetivo_post,
      c.narrative_axis,
      c.funnel_role,
      c.awareness_level,
      c.sales_leak_type,
      c.expected_result,
      AVG(pm.reach) AS avg_reach,
      AVG(pm.profile_visits) AS avg_profile_visits,
      AVG(pm.engagement_rate) AS avg_engagement_rate,
      AVG(pm.retention_score) AS avg_retention_score,
      AVG(pm.lead_score) AS avg_lead_score,
      SUM(pm.comments) AS comments,
      SUM(pm.shares) AS shares,
      SUM(pm.saves) AS saves,
      SUM(pm.link_clicks) AS link_clicks,
      SUM(pm.leads_generated) AS leads_generated,
      COUNT(*) AS posts_count
    FROM post_metrics pm
    JOIN contents c ON pm.content_id = c.id
    WHERE pm.posted_at >= date('now', ?)
      AND c.used = 1
      AND c.instagram_post_id IS NOT NULL
    GROUP BY c.funil, c.pillar, c.content_intent, c.content_type, c.objetivo_post,
      c.narrative_axis, c.funnel_role, c.awareness_level, c.sales_leak_type, c.expected_result
  `).all(`-${config.intelligenceWindowDays} days`);

  const weights = calculateWeights(stats);
  const objectiveBreakdown = buildObjectiveBreakdown(stats);
  const summary = JSON.stringify({ stats, weights, objectiveBreakdown }, null, 2);
  const analysis = await analyzePerformanceWithGpt(summary);

  db.prepare(`
    INSERT INTO intelligence_patterns (
      window_days, weight_topo, weight_meio, weight_fundo, weight_vamo,
      weight_empreendedorismo, weight_fe, weight_familia, weight_oferta, top_hook_formulas,
      best_posting_hours, top_lead_topics, gpt_analysis, posts_analyzed
    ) VALUES (
      @window_days, @weight_topo, @weight_meio, @weight_fundo, @weight_vamo,
      @weight_empreendedorismo, @weight_fe, @weight_familia, @weight_oferta, @top_hook_formulas,
      @best_posting_hours, @top_lead_topics, @gpt_analysis, @posts_analyzed
    )
  `).run({
    window_days: config.intelligenceWindowDays,
    ...persistableWeights(weights),
    top_hook_formulas: JSON.stringify([]),
    best_posting_hours: JSON.stringify(calculateBestPostingHours()),
    top_lead_topics: JSON.stringify(extractTopTopics()),
    gpt_analysis: analysis,
    posts_analyzed: stats.reduce((sum, row) => sum + row.posts_count, 0)
  });

  return getLatestPatterns();
}

function calculateWeights(stats) {
  if (!stats.length) return defaultPatterns();

  const funilScores = { topo: 0, meio: 0, fundo: 0 };
  const pillarScores = { vamo: 0, empreendedorismo: 0, fe: 0, familia: 0, oferta: 0 };

  for (const row of stats) {
    const score = compositeScore(row);
    if (row.funil in funilScores) funilScores[row.funil] += score;
    const pillar = normalizePillar(row.pillar);
    if (pillar in pillarScores) pillarScores[pillar] += score;
  }

  const funil = normalize(funilScores, { topo: 0.40, meio: 0.30, fundo: 0.30 });
  const pillar = normalize(pillarScores, { vamo: 0.45, empreendedorismo: 0.20, fe: 0.15, familia: 0.10, oferta: 0.10 });

  return {
    weight_topo: funil.topo,
    weight_meio: funil.meio,
    weight_fundo: funil.fundo,
    weight_vamo: pillar.vamo,
    weight_empreendedorismo: pillar.empreendedorismo,
    weight_fe: pillar.fe,
    weight_familia: pillar.familia,
    weight_oferta: pillar.oferta
  };
}

function persistableWeights(weights) {
  return {
    weight_topo: weights.weight_topo,
    weight_meio: weights.weight_meio,
    weight_fundo: weights.weight_fundo,
    weight_vamo: weights.weight_vamo,
    weight_empreendedorismo: weights.weight_empreendedorismo,
    weight_fe: weights.weight_fe,
    weight_familia: weights.weight_familia,
    weight_oferta: weights.weight_oferta
  };
}

function compositeScore(row) {
  const connectionContent = ['fe', 'familia'].includes(normalizePillar(row.pillar))
    || ['conexao', 'bastidor', 'atrair'].includes(String(row.content_intent || ''));

  if (connectionContent) {
    return (Number(row.avg_reach || 0) * 0.18)
      + (Number(row.avg_profile_visits || 0) * 0.40)
      + (Number(row.comments || 0) * 2.4)
      + (Number(row.saves || 0) * 1.8)
      + (Number(row.shares || 0) * 2.0)
      + (Number(row.avg_engagement_rate || 0) * 0.50)
      + (Number(row.avg_retention_score || 0) * 0.25);
  }

  return (Number(row.avg_lead_score || 0) * 0.45)
    + (Number(row.leads_generated || 0) * 8)
    + (Number(row.link_clicks || 0) * 2)
    + (Number(row.comments || 0) * 0.8)
    + (Number(row.saves || 0) * 0.8)
    + (Number(row.shares || 0) * 0.8)
    + (Number(row.avg_retention_score || 0) * 0.15)
    + (Number(row.avg_engagement_rate || 0) * 0.15)
    + (Number(row.avg_reach || 0) * 0.05);
}

function buildObjectiveBreakdown(stats) {
  const buckets = {
    alcance: { label: 'conteudos que trouxeram alcance', rows: [] },
    seguidores: { label: 'conteudos que trouxeram seguidores', rows: [] },
    comentarios: { label: 'conteudos que trouxeram comentarios', rows: [] },
    salvamentos: { label: 'conteudos que trouxeram salvamentos', rows: [] },
    cliques: { label: 'conteudos que trouxeram cliques', rows: [] },
    leads: { label: 'conteudos que trouxeram leads', rows: [] },
    autoridade: { label: 'conteudos que fortaleceram autoridade', rows: [] }
    ,
    eixos_alcance: { label: 'eixos narrativos que mais geraram alcance', rows: [] },
    eixos_salvamento: { label: 'eixos narrativos que mais geraram salvamento', rows: [] },
    eixos_clique_lead: { label: 'eixos narrativos que mais geraram clique/lead', rows: [] },
    papeis_funil: { label: 'papeis de funil que mais funcionaram', rows: [] }
  };

  for (const row of stats) {
    buckets.alcance.rows.push(scoreRow(row, row.avg_reach));
    buckets.seguidores.rows.push(scoreRow(row, row.avg_profile_visits));
    buckets.comentarios.rows.push(scoreRow(row, row.comments));
    buckets.salvamentos.rows.push(scoreRow(row, row.saves));
    buckets.cliques.rows.push(scoreRow(row, row.link_clicks));
    buckets.leads.rows.push(scoreRow(row, row.leads_generated || row.avg_lead_score));
    buckets.autoridade.rows.push(scoreRow(row, authorityScore(row)));
    buckets.eixos_alcance.rows.push(scoreRow(row, row.avg_reach));
    buckets.eixos_salvamento.rows.push(scoreRow(row, row.saves));
    buckets.eixos_clique_lead.rows.push(scoreRow(row, Number(row.link_clicks || 0) + Number(row.leads_generated || 0) + Number(row.avg_lead_score || 0)));
    buckets.papeis_funil.rows.push(scoreRow(row, compositeScore(row)));
  }

  return Object.fromEntries(Object.entries(buckets).map(([key, bucket]) => [
    key,
    {
      label: bucket.label,
      top: bucket.rows
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
    }
  ]));
}

function scoreRow(row, value) {
  return {
    pillar: normalizePillar(row.pillar),
    funil: row.funil,
    content_intent: row.content_intent || '',
    content_type: row.content_type || '',
    objetivo_post: row.objetivo_post || '',
    narrative_axis: row.narrative_axis || '',
    funnel_role: row.funnel_role || '',
    awareness_level: row.awareness_level || '',
    sales_leak_type: row.sales_leak_type || '',
    expected_result: row.expected_result || '',
    score: Number(value || 0)
  };
}

function authorityScore(row) {
  return (Number(row.saves || 0) * 2)
    + (Number(row.shares || 0) * 1.8)
    + (Number(row.comments || 0) * 1.5)
    + (Number(row.avg_retention_score || 0) * 0.4)
    + (Number(row.avg_engagement_rate || 0) * 0.4);
}

function normalizePillar(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('vendas') || text.includes('comercial') || text.includes('vamo')) return 'vamo';
  if (text.includes('empreendedor')) return 'empreendedorismo';
  if (text.includes('fe') || text.includes('fé')) return 'fe';
  if (text.includes('famil')) return 'familia';
  if (text.includes('vida')) return 'familia';
  if (text.includes('oferta') || text.includes('diagn')) return 'oferta';
  return 'vamo';
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

function calculateBestPostingHours() {
  return db.prepare(`
    SELECT
      strftime('%H', posted_at) AS hour,
      AVG(lead_score + engagement_rate + (saves * 0.5) + (shares * 0.7)) AS score,
      COUNT(*) AS posts
    FROM post_metrics
    WHERE posted_at >= date('now', ?)
    GROUP BY hour
    HAVING posts >= 1
    ORDER BY score DESC
    LIMIT 8
  `).all(`-${config.intelligenceWindowDays} days`)
    .filter(row => row.hour !== null)
    .map(row => ({
      time: `${String(row.hour).padStart(2, '0')}:30`,
      score: Number(row.score || 0).toFixed(2),
      posts: row.posts
    }));
}

function defaultPatterns() {
  return {
    weight_topo: 0.40,
    weight_meio: 0.30,
    weight_fundo: 0.30,
    weight_vamo: 0.45,
    weight_empreendedorismo: 0.20,
    weight_fe: 0.15,
    weight_familia: 0.10,
    weight_oferta: 0.10,
    top_hook_formulas: [],
    best_posting_hours: [],
    top_lead_topics: [],
    gpt_analysis: 'Pesos editoriais padrao em uso ate haver metricas suficientes.',
    posts_analyzed: 0
  };
}
