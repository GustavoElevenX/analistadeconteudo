import cron from 'node-cron';
import { config, todayISO } from './config.js';
import { db, insertContents, insertSources, logJob, parseContent } from './database.js';
import { scrapeAllSources } from './apify.js';
import { generateDailyContents } from './openai.js';
import { syncRecentMetrics } from './instagram.js';
import { getLatestPatterns, updatePatterns } from './intelligence.js';
import { sendDailyBriefing } from './whatsapp.js';

export async function runDailyGeneration(date = todayISO()) {
  try {
    const sources = await scrapeAllSources();
    insertSources(date, sources);
    const patterns = getLatestPatterns();
    const contents = await generateDailyContents({ date, sources, patterns, limit: config.dailyContentLimit });
    db.prepare('DELETE FROM contents WHERE date = ? AND used = 0 AND favorited = 0').run(date);
    insertContents(date, contents);
    logJob('generate', 'success', `${contents.length} conteudos gerados; ${sources.length} fontes coletadas.`);
    return { contents: contents.length, sources: sources.length };
  } catch (error) {
    logJob('generate', 'error', error.message);
    throw error;
  }
}

export async function runMetricsSync() {
  try {
    const result = await syncRecentMetrics();
    logJob('metrics', 'success', `${result.synced} posts sincronizados.`);
    return result;
  } catch (error) {
    logJob('metrics', 'error', error.message);
    throw error;
  }
}

export async function runIntelligenceUpdate() {
  try {
    const result = await updatePatterns();
    logJob('intelligence', 'success', `${result.posts_analyzed || 0} posts analisados.`);
    return result;
  } catch (error) {
    logJob('intelligence', 'error', error.message);
    throw error;
  }
}

export async function runBriefing(date = todayISO()) {
  try {
    const result = await sendDailyBriefing(date);
    logJob('whatsapp', 'success', 'Briefing enviado.');
    return result;
  } catch (error) {
    logJob('whatsapp', 'error', error.message);
    throw error;
  }
}

export function startScheduler() {
  cron.schedule(config.cron.generate, () => runDailyGeneration(), { timezone: config.timezone });
  cron.schedule(config.cron.metrics, () => runMetricsSync(), { timezone: config.timezone });
  cron.schedule(config.cron.intelligence, () => runIntelligenceUpdate(), { timezone: config.timezone });
  cron.schedule(config.cron.briefing, () => runBriefing(), { timezone: config.timezone });
  cron.schedule(config.cron.weekly, () => runWeeklyReport(), { timezone: config.timezone });
}

async function runWeeklyReport() {
  logJob('weekly_report', 'skipped', 'Relatorio semanal nao enviado: configure metricas e WhatsApp antes de ativar.');
}

export function getStatus() {
  const lastRuns = db.prepare(`
    SELECT job, status, message, created_at
    FROM scheduler_log
    ORDER BY id DESC
    LIMIT 20
  `).all();
  const todayCount = db.prepare('SELECT COUNT(*) AS total FROM contents WHERE date = ?').get(todayISO()).total;
  const contents = db.prepare('SELECT * FROM contents WHERE date = ? ORDER BY id DESC LIMIT 5').all(todayISO()).map(parseContent);
  return {
    ok: true,
    date: todayISO(),
    timezone: config.timezone,
    todayCount,
    latestContents: contents,
    lastRuns,
    cron: config.cron
  };
}
