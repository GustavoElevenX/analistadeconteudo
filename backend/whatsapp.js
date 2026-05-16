import { config, todayISO } from './config.js';
import { db, parseContent } from './database.js';

export async function sendWhatsAppMessage(message) {
  if (!config.callmebotPhone || !config.callmebotApiKey) {
    throw new Error('CALLMEBOT_PHONE e CALLMEBOT_APIKEY nao configurados.');
  }
  const url = new URL('https://api.callmebot.com/whatsapp.php');
  url.searchParams.set('phone', config.callmebotPhone);
  url.searchParams.set('text', message);
  url.searchParams.set('apikey', config.callmebotApiKey);
  const resp = await fetch(url);
  const text = await resp.text();
  if (!resp.ok) throw new Error(text);
  return text;
}

export async function sendDailyBriefing(date = todayISO()) {
  const rows = db.prepare(`
    SELECT * FROM contents
    WHERE date = ?
    ORDER BY favorited DESC, id ASC
    LIMIT ?
  `).all(date, config.briefingTopPicks).map(parseContent);

  const message = buildBriefingMessage(date, rows);
  return sendWhatsAppMessage(message);
}

export function buildBriefingMessage(date, contents) {
  const body = contents.map((content, index) => {
    return `#${index + 1} - ${content.funil.toUpperCase()} | ${pillarLabel(content.pillar)} | ${content.content_intent || content.objetivo_post || 'Conteudo'} | ${content.formato_recomendado || 'Formato livre'}
*${content.titulo_reels || content.tema}*
_${content.gancho}_

Tese: ${content.tese || content.tema || ''}
Roteiro: ${content.roteiro_falado || (content.estrutura || []).join(' / ')}
Vamo: ${content.conexao_com_vamo || 'sem conexao explicita'}
Tela: ${content.momento_mostrar_tela || 'sem tela'}
CTA: ${content.cta_texto}`;
  }).join('\n\n----------------\n\n');

  return `*Briefing da Central de Autoridade - ${date}*

Bom dia! Aqui estao seus ${contents.length} melhores conteudos de hoje:

${body || 'Nenhum conteudo gerado ainda. Rode "npm run generate-now".'}

Ver todos os conteudos: ${config.appPublicUrl}

Bora gravar.`;
}

function pillarLabel(pillar) {
  return {
    vendas: 'Vamo',
    vamo: 'Vamo',
    empreendedorismo: 'Empreendedorismo',
    fe: 'Fe',
    familia: 'Familia',
    vida: 'Familia',
    oferta: 'Oferta'
  }[pillar] || pillar;
}
