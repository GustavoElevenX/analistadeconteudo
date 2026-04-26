import express from 'express';
import cors from 'cors';
import basicAuth from 'express-basic-auth';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, todayISO } from './config.js';
import { db, parseContent } from './database.js';
import { captureInsight } from './openai.js';
import { getLatestPatterns } from './intelligence.js';
import { runBriefing, runDailyGeneration, runIntelligenceUpdate, runMetricsSync, startScheduler, getStatus } from './scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

if (config.basicAuthUser && config.basicAuthPass) {
  app.use(basicAuth({
    users: { [config.basicAuthUser]: config.basicAuthPass },
    challenge: true
  }));
}

app.get('/api/contents', (req, res) => {
  const date = req.query.date || todayISO();
  const rows = db.prepare('SELECT * FROM contents WHERE date = ? ORDER BY id ASC').all(date).map(parseContent);
  res.json({ date, contents: rows });
});

app.get('/api/contents/favorites', (req, res) => {
  const rows = db.prepare('SELECT * FROM contents WHERE favorited = 1 ORDER BY id DESC').all().map(parseContent);
  res.json({ contents: rows });
});

app.get('/api/contents/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM contents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Conteudo nao encontrado.' });
  res.json({ content: parseContent(row) });
});

app.put('/api/contents/:id/use', (req, res) => {
  const current = db.prepare('SELECT used FROM contents WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Conteudo nao encontrado.' });
  const used = current.used ? 0 : 1;
  db.prepare('UPDATE contents SET used = ?, used_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE used_at END WHERE id = ?')
    .run(used, used, req.params.id);
  res.json({ ok: true, used: current.used ? 0 : 1 });
});

app.post('/api/contents/:id/link-instagram', (req, res) => {
  const content = db.prepare('SELECT id FROM contents WHERE id = ?').get(req.params.id);
  if (!content) return res.status(404).json({ error: 'Conteudo nao encontrado.' });

  const permalink = String(req.body?.url || req.body?.permalink || '').trim();
  if (!permalink) return res.status(400).json({ error: 'Envie { "url": "link do post" }.' });

  const post = findInstagramMetricByPermalink(permalink);
  if (!post) {
    return res.status(404).json({
      error: 'Post nao encontrado nas metricas sincronizadas. Clique em "Sincronizar metricas" depois de publicar e tente novamente.'
    });
  }

  db.prepare(`
    UPDATE contents
    SET used = 1, used_at = COALESCE(used_at, CURRENT_TIMESTAMP),
        instagram_post_id = ?, instagram_permalink = ?
    WHERE id = ?
  `).run(post.instagram_post_id, post.permalink || permalink, req.params.id);

  db.prepare('UPDATE post_metrics SET content_id = ? WHERE instagram_post_id = ?').run(req.params.id, post.instagram_post_id);

  res.json({ ok: true, instagram_post_id: post.instagram_post_id });
});

app.put('/api/contents/:id/favorite', (req, res) => {
  const current = db.prepare('SELECT favorited FROM contents WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Conteudo nao encontrado.' });
  db.prepare('UPDATE contents SET favorited = ? WHERE id = ?').run(current.favorited ? 0 : 1, req.params.id);
  res.json({ ok: true, favorited: current.favorited ? 0 : 1 });
});

app.get('/api/sources', (req, res) => {
  const date = req.query.date || todayISO();
  const sources = db.prepare('SELECT * FROM sources WHERE date = ? ORDER BY id DESC').all(date);
  res.json({ date, sources });
});

app.get('/api/status', (req, res) => res.json(getStatus()));

app.post('/api/generate-now', async (req, res, next) => {
  try {
    res.json(await runDailyGeneration(req.body?.date || todayISO()));
  } catch (error) {
    next(error);
  }
});

app.post('/api/capture-insight', async (req, res, next) => {
  try {
    if (!req.body?.text) return res.status(400).json({ error: 'Envie { "text": "..." }.' });
    res.json(await captureInsight(req.body.text));
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS value FROM contents').get().value;
  const used = db.prepare('SELECT COUNT(*) AS value FROM contents WHERE used = 1').get().value;
  const byFunil = db.prepare('SELECT funil, COUNT(*) AS total FROM contents GROUP BY funil').all();
  const byPillar = db.prepare('SELECT pillar, COUNT(*) AS total FROM contents GROUP BY pillar').all();
  res.json({ total, used, byFunil, byPillar });
});

app.get('/api/metrics', (req, res) => {
  const metrics = db.prepare('SELECT * FROM post_metrics ORDER BY posted_at DESC').all();
  res.json({ metrics });
});

app.get('/api/metrics/:instagram_post_id', (req, res) => {
  const metric = db.prepare('SELECT * FROM post_metrics WHERE instagram_post_id = ?').get(req.params.instagram_post_id);
  if (!metric) return res.status(404).json({ error: 'Metrica nao encontrada.' });
  res.json({ metric });
});

app.put('/api/metrics/:instagram_post_id/manual', (req, res) => {
  const metric = db.prepare('SELECT * FROM post_metrics WHERE instagram_post_id = ?').get(req.params.instagram_post_id);
  if (!metric) return res.status(404).json({ error: 'Metrica nao encontrada.' });

  const linkClicks = Math.max(0, Number(req.body?.link_clicks || 0));
  const leadsGenerated = Math.max(0, Number(req.body?.leads_generated || 0));
  const reach = Number(metric.reach || 0);
  const leadActions = Number(metric.profile_visits || 0) + (linkClicks * 2) + (leadsGenerated * 8);
  const leadScore = reach ? (leadActions / reach) * 100 : 0;

  db.prepare(`
    UPDATE post_metrics
    SET link_clicks = ?, leads_generated = ?, lead_score = ?, last_synced_at = CURRENT_TIMESTAMP
    WHERE instagram_post_id = ?
  `).run(linkClicks, leadsGenerated, leadScore, req.params.instagram_post_id);

  res.json({ ok: true, link_clicks: linkClicks, leads_generated: leadsGenerated, lead_score: leadScore });
});

app.post('/api/sync-metrics-now', async (req, res, next) => {
  try {
    res.json(await runMetricsSync());
  } catch (error) {
    next(error);
  }
});

app.post('/api/metrics/link', (req, res) => {
  const { instagram_post_id, content_id } = req.body || {};
  if (!instagram_post_id || !content_id) return res.status(400).json({ error: 'Envie instagram_post_id e content_id.' });
  db.prepare('UPDATE post_metrics SET content_id = ? WHERE instagram_post_id = ?').run(content_id, instagram_post_id);
  res.json({ ok: true });
});

app.get('/api/intelligence', (req, res) => res.json({ patterns: getLatestPatterns() }));
app.get('/api/intelligence/history', (req, res) => {
  res.json({ history: db.prepare('SELECT * FROM performance_history ORDER BY id DESC LIMIT 50').all() });
});
app.post('/api/update-intelligence', async (req, res, next) => {
  try {
    res.json({ patterns: await runIntelligenceUpdate() });
  } catch (error) {
    next(error);
  }
});

app.get('/api/analytics/overview', (req, res) => {
  const overview = db.prepare(`
    SELECT AVG(reach) avg_reach, AVG(engagement_rate) avg_engagement_rate,
      AVG(retention_score) avg_retention_score, AVG(lead_score) avg_lead_score,
      SUM(link_clicks) link_clicks, SUM(leads_generated) leads_generated,
      COUNT(*) posts
    FROM post_metrics
  `).get();
  const linked = db.prepare('SELECT COUNT(*) posts FROM post_metrics WHERE content_id IS NOT NULL').get();
  res.json({ overview: { ...overview, linked_posts: linked.posts } });
});

app.get('/api/analytics/by-funil', (req, res) => res.json({ rows: aggregateBy('funil') }));
app.get('/api/analytics/by-pillar', (req, res) => res.json({ rows: aggregateBy('pillar') }));
app.get('/api/analytics/top-posts', (req, res) => res.json({ rows: topPosts('DESC') }));
app.get('/api/analytics/worst-posts', (req, res) => res.json({ rows: topPosts('ASC') }));

app.post('/api/send-briefing-now', async (req, res, next) => {
  try {
    res.json({ result: await runBriefing(req.body?.date || todayISO()) });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(frontendDir));
app.get('*', (req, res) => res.sendFile(path.join(frontendDir, 'index.html')));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || 'Erro interno.' });
});

function aggregateBy(column) {
  const safeColumn = column === 'pillar' ? 'pillar' : 'funil';
  return db.prepare(`
    SELECT c.${safeColumn} label, AVG(pm.reach) avg_reach,
      AVG(pm.engagement_rate) avg_engagement_rate,
      AVG(pm.retention_score) avg_retention_score,
      AVG(pm.lead_score) avg_lead_score,
      COUNT(*) posts
    FROM post_metrics pm
    JOIN contents c ON pm.content_id = c.id
    WHERE pm.content_id IS NOT NULL
    GROUP BY c.${safeColumn}
  `).all();
}

function topPosts(order) {
  return db.prepare(`
    SELECT pm.*, c.gancho, c.tema, c.funil, c.pillar
    FROM post_metrics pm
    LEFT JOIN contents c ON pm.content_id = c.id
    WHERE pm.content_id IS NOT NULL
    ORDER BY pm.lead_score ${order === 'ASC' ? 'ASC' : 'DESC'}
    LIMIT 10
  `).all();
}

function findInstagramMetricByPermalink(permalink) {
  const normalized = normalizeInstagramUrl(permalink);
  const rows = db.prepare('SELECT * FROM post_metrics ORDER BY posted_at DESC').all();
  return rows.find(row => normalizeInstagramUrl(row.permalink) === normalized)
    || rows.find(row => normalized.includes(String(row.instagram_post_id)));
}

function normalizeInstagramUrl(value) {
  return String(value || '')
    .split('?')[0]
    .replace(/\/$/, '')
    .trim()
    .toLowerCase();
}

startScheduler();
app.listen(config.port, () => {
  console.log(`Analista de Conteudo rodando em http://localhost:${config.port}`);
});
