import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, 'db');
const dbPath = path.join(dbDir, 'data.db');

fs.mkdirSync(dbDir, { recursive: true });

export const db = await openDatabase(dbPath);
db.exec('PRAGMA journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      objetivo_post TEXT,
      funil TEXT NOT NULL,
      pillar TEXT NOT NULL,
      content_intent TEXT,
      content_type TEXT,
      sequencia_nome TEXT,
      sequencia_parte INTEGER DEFAULT 1,
      tese TEXT,
      tema TEXT NOT NULL,
      formato_recomendado TEXT,
      gancho TEXT NOT NULL,
      roteiro_falado TEXT,
      pausas_entonacao TEXT,
      momento_mostrar_tela TEXT,
      interpretacao TEXT,
      estrutura TEXT NOT NULL,
      cta_tipo TEXT NOT NULL,
      cta_texto TEXT NOT NULL,
      legenda TEXT,
      titulo_reels TEXT,
      hashtags TEXT NOT NULL,
      conexao_com_vamo TEXT,
      risco_generico TEXT,
      porque_gera_leads TEXT NOT NULL,
      score_autoridade REAL DEFAULT 0,
      score_demanda REAL DEFAULT 0,
      score_conexao REAL DEFAULT 0,
      score_autenticidade REAL DEFAULT 0,
      score_vamo_alignment REAL DEFAULT 0,
      score_final REAL DEFAULT 0,
      source_headline TEXT,
      source_url TEXT,
      used INTEGER DEFAULT 0,
      used_at TEXT,
      instagram_post_id TEXT,
      instagram_permalink TEXT,
      favorited INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      platform TEXT NOT NULL,
      headline TEXT NOT NULL,
      url TEXT,
      summary TEXT,
      relevance_score INTEGER,
      published_at TEXT,
      freshness_window_days INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scheduler_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS post_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER REFERENCES contents(id),
      instagram_post_id TEXT UNIQUE NOT NULL,
      permalink TEXT,
      posted_at TEXT NOT NULL,
      media_type TEXT,
      caption_snippet TEXT,
      reach INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      plays INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      link_clicks INTEGER DEFAULT 0,
      leads_generated INTEGER DEFAULT 0,
      profile_visits INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      retention_score REAL DEFAULT 0,
      lead_score REAL DEFAULT 0,
      last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
      sync_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS intelligence_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      window_days INTEGER DEFAULT 30,
      weight_topo REAL DEFAULT 0.40,
      weight_meio REAL DEFAULT 0.30,
      weight_fundo REAL DEFAULT 0.30,
      weight_vendas REAL DEFAULT 0.70,
      weight_empreendedorismo REAL DEFAULT 0.20,
      weight_fe REAL DEFAULT 0.05,
      weight_vida REAL DEFAULT 0.05,
      top_hook_formulas TEXT,
      best_posting_hours TEXT,
      top_lead_topics TEXT,
      gpt_analysis TEXT,
      posts_analyzed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS performance_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week TEXT NOT NULL,
      funil TEXT NOT NULL,
      pillar TEXT NOT NULL,
      avg_reach REAL DEFAULT 0,
      avg_engagement_rate REAL DEFAULT 0,
      avg_retention_score REAL DEFAULT 0,
      avg_lead_score REAL DEFAULT 0,
      posts_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_contents_date ON contents(date);
    CREATE INDEX IF NOT EXISTS idx_sources_date ON sources(date);
    CREATE INDEX IF NOT EXISTS idx_metrics_posted_at ON post_metrics(posted_at);
  `);
}

export function logJob(job, status, message = '') {
  db.prepare('INSERT INTO scheduler_log (job, status, message) VALUES (?, ?, ?)').run(job, status, message);
}

export function insertSources(date, sources) {
  const stmt = db.prepare(`
    INSERT INTO sources (date, platform, headline, url, summary, relevance_score, published_at, freshness_window_days)
    VALUES (@date, @platform, @headline, @url, @summary, @relevance_score, @published_at, @freshness_window_days)
  `);
  const tx = db.transaction(items => {
    for (const source of items) {
      stmt.run({
        date,
        platform: source.platform || 'google_news',
        headline: source.headline || 'Fonte sem titulo',
        url: source.url || '',
        summary: source.summary || '',
        relevance_score: source.relevance_score || source.relevance || null,
        published_at: source.publishedAt || '',
        freshness_window_days: source.freshness_window_days || null
      });
    }
  });
  tx(sources);
}

export function insertContents(date, contents) {
  const stmt = db.prepare(`
    INSERT INTO contents (
      date, objetivo_post, funil, pillar, content_intent, content_type,
      sequencia_nome, sequencia_parte, tese, tema,
      formato_recomendado, gancho, roteiro_falado, pausas_entonacao, momento_mostrar_tela,
      interpretacao, estrutura, cta_tipo, cta_texto, legenda, titulo_reels,
      hashtags, conexao_com_vamo, risco_generico, porque_gera_leads,
      score_autoridade, score_demanda, score_conexao, score_autenticidade,
      score_vamo_alignment, score_final, source_headline, source_url
    ) VALUES (
      @date, @objetivo_post, @funil, @pillar, @content_intent, @content_type,
      @sequencia_nome, @sequencia_parte, @tese, @tema,
      @formato_recomendado, @gancho, @roteiro_falado, @pausas_entonacao, @momento_mostrar_tela,
      @interpretacao, @estrutura, @cta_tipo, @cta_texto, @legenda, @titulo_reels,
      @hashtags, @conexao_com_vamo, @risco_generico, @porque_gera_leads,
      @score_autoridade, @score_demanda, @score_conexao, @score_autenticidade,
      @score_vamo_alignment, @score_final, @source_headline, @source_url
    )
  `);
  const tx = db.transaction(items => {
    for (const item of items) {
      stmt.run(normalizeContent(date, item));
    }
  });
  tx(contents);
}

function normalizeContent(date, item) {
  return {
    date,
    objetivo_post: item.objetivo_post || objectiveForFunil(item.funil),
    funil: item.funil || 'topo',
    pillar: normalizePillar(item.pillar || item.pilar || 'vamo'),
    content_intent: item.content_intent || item.intent || '',
    content_type: item.content_type || item.formato || '',
    sequencia_nome: item.sequencia_nome || '',
    sequencia_parte: Number(item.sequencia_parte || 1),
    tese: item.tese || '',
    tema: item.tema || 'Tema comercial',
    formato_recomendado: item.formato_recomendado || 'Camera direta',
    gancho: item.gancho || '',
    roteiro_falado: item.roteiro_falado || '',
    pausas_entonacao: item.pausas_entonacao || item.pausas || '',
    momento_mostrar_tela: item.momento_mostrar_tela || '',
    interpretacao: item.interpretacao || '',
    estrutura: JSON.stringify(item.estrutura || []),
    cta_tipo: item.cta_tipo || item.ctaTipo || (item.funil === 'fundo' ? 'link' : 'comentario'),
    cta_texto: item.cta_texto || item.cta || '',
    legenda: item.legenda || '',
    titulo_reels: item.titulo_reels || '',
    hashtags: JSON.stringify(item.hashtags || []),
    conexao_com_vamo: item.conexao_com_vamo || '',
    risco_generico: item.risco_generico || item.risco || '',
    porque_gera_leads: item.porque_gera_leads || item.porque || '',
    score_autoridade: Number(item.score_autoridade || 0),
    score_demanda: Number(item.score_demanda || 0),
    score_conexao: Number(item.score_conexao || 0),
    score_autenticidade: Number(item.score_autenticidade || 0),
    score_vamo_alignment: Number(item.score_vamo_alignment || 0),
    score_final: Number(item.score_final || 0),
    source_headline: item.source_headline || item.sourceHeadline || '',
    source_url: item.source_url || item.sourceUrl || ''
  };
}

function normalizePillar(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('vendas') || text.includes('comercial') || text.includes('vamo')) return 'vamo';
  if (text.includes('empreendedor')) return 'empreendedorismo';
  if (text.includes('fe') || text.includes('fé')) return 'fe';
  if (text.includes('famil')) return 'familia';
  if (text.includes('oferta') || text.includes('diagn')) return 'oferta';
  return 'vamo';
}

function objectiveForFunil(funil) {
  return {
    topo: 'Atrair seguidores',
    meio: 'Gerar autoridade',
    fundo: 'Gerar leads'
  }[funil] || 'Gerar leads';
}

async function openDatabase(filePath) {
  try {
    const mod = await import('better-sqlite3');
    return new mod.default(filePath);
  } catch {
    const { DatabaseSync } = await import('node:sqlite');
    return new DatabaseSync(filePath);
  }
}

export function parseContent(row) {
  if (!row) return null;
  return {
    ...row,
    estrutura: safeJson(row.estrutura, []),
    hashtags: safeJson(row.hashtags, [])
  };
}

export function safeJson(value, fallback) {
  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

export function clearNonRealTestData() {
  const contents = db.prepare('DELETE FROM contents').run().changes;
  const logs = db.prepare(`
    DELETE FROM scheduler_log
    WHERE job IN ('generate', 'whatsapp', 'weekly_report')
       OR status = 'error'
       OR message LIKE '%simulad%'
       OR message LIKE '%OPENAI_API_KEY%'
       OR message LIKE '%retornou 19%'
       OR message LIKE '%16 conteudos%'
  `).run().changes;
  return { contents, logs };
}

function ensureMigrations() {
  const sourceColumns = db.prepare('PRAGMA table_info(sources)').all().map(row => row.name);
  if (!sourceColumns.includes('freshness_window_days')) {
    db.exec('ALTER TABLE sources ADD COLUMN freshness_window_days INTEGER');
  }
  if (!sourceColumns.includes('published_at')) {
    db.exec('ALTER TABLE sources ADD COLUMN published_at TEXT');
  }
  const contentColumns = db.prepare('PRAGMA table_info(contents)').all().map(row => row.name);
  if (!contentColumns.includes('used_at')) {
    db.exec('ALTER TABLE contents ADD COLUMN used_at TEXT');
  }
  if (!contentColumns.includes('instagram_post_id')) {
    db.exec('ALTER TABLE contents ADD COLUMN instagram_post_id TEXT');
  }
  if (!contentColumns.includes('instagram_permalink')) {
    db.exec('ALTER TABLE contents ADD COLUMN instagram_permalink TEXT');
  }
  const contentMigrations = {
    objetivo_post: 'TEXT',
    content_intent: 'TEXT',
    content_type: 'TEXT',
    sequencia_nome: 'TEXT',
    sequencia_parte: 'INTEGER DEFAULT 1',
    tese: 'TEXT',
    formato_recomendado: 'TEXT',
    roteiro_falado: 'TEXT',
    pausas_entonacao: 'TEXT',
    momento_mostrar_tela: 'TEXT',
    interpretacao: 'TEXT',
    legenda: 'TEXT',
    titulo_reels: 'TEXT',
    conexao_com_vamo: 'TEXT',
    risco_generico: 'TEXT',
    score_autoridade: 'REAL DEFAULT 0',
    score_demanda: 'REAL DEFAULT 0',
    score_conexao: 'REAL DEFAULT 0',
    score_autenticidade: 'REAL DEFAULT 0',
    score_vamo_alignment: 'REAL DEFAULT 0',
    score_final: 'REAL DEFAULT 0'
  };
  for (const [column, definition] of Object.entries(contentMigrations)) {
    if (!contentColumns.includes(column)) {
      db.exec(`ALTER TABLE contents ADD COLUMN ${column} ${definition}`);
    }
  }
  const metricColumns = db.prepare('PRAGMA table_info(post_metrics)').all().map(row => row.name);
  if (!metricColumns.includes('permalink')) {
    db.exec('ALTER TABLE post_metrics ADD COLUMN permalink TEXT');
  }
  if (!metricColumns.includes('link_clicks')) {
    db.exec('ALTER TABLE post_metrics ADD COLUMN link_clicks INTEGER DEFAULT 0');
  }
  if (!metricColumns.includes('leads_generated')) {
    db.exec('ALTER TABLE post_metrics ADD COLUMN leads_generated INTEGER DEFAULT 0');
  }
}

initDb();
ensureMigrations();

if (process.argv[1] && process.argv[1].endsWith('database.js')) {
  console.log(`Banco inicializado em ${dbPath}`);
}
