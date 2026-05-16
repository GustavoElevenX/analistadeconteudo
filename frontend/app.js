const state = {
  contents: [],
  filter: 'all'
};

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

init();

async function init() {
  bindNavigation();
  bindActions();
  $('#today-label').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  await Promise.all([loadContents(), loadStatus(), loadAnalytics(), loadFavorites(), loadPostingSchedule()]);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function bindNavigation() {
  $$('.nav-item').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  $('[data-view-shortcut="capture"]').addEventListener('click', () => showView('capture'));
  $$('.chip').forEach(button => {
    button.addEventListener('click', () => {
      $$('.chip').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.filter = button.dataset.filter;
      renderContents();
    });
  });
}

function bindActions() {
  $('#generate-now').addEventListener('click', async () => {
    const button = $('#generate-now');
    button.disabled = true;
    button.textContent = 'Gerando...';
    try {
      await post('/api/generate-now', {});
      toast('Conteudos gerados.');
      await loadContents();
      await loadStatus();
    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Gerar agora';
    }
  });
  $('#capture-btn').addEventListener('click', captureInsight);
  $('#posts-per-day').addEventListener('change', loadPostingSchedule);
  $('#sync-metrics').addEventListener('click', async () => {
    await post('/api/sync-metrics-now', {});
    toast('Metricas sincronizadas.');
    await loadAnalytics();
    await loadStatus();
  });
  $('#update-intelligence').addEventListener('click', async () => {
    await post('/api/update-intelligence', {});
    toast('Inteligencia atualizada.');
    await loadAnalytics();
  });
}

function showView(view) {
  $$('.view').forEach(item => item.classList.toggle('active', item.id === view));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
}

async function loadPostingSchedule() {
  const postsPerDay = $('#posts-per-day')?.value || 5;
  const data = await get(`/api/posting-schedule?postsPerDay=${postsPerDay}`);
  renderPostingSchedule(data);
}

function renderPostingSchedule(data) {
  const windows = Object.fromEntries((data.attention_windows || []).map(item => [item.id, item]));
  $('#posting-schedule-panel').innerHTML = `
    <div class="panel posting-summary">
      <div>
        <span>ICP</span>
        <strong>${escapeHtml(data.icp_label || data.icp)}</strong>
      </div>
      <div>
        <span>Data</span>
        <strong>${formatDate(data.date)}</strong>
      </div>
      <div>
        <span>Modelo adaptativo</span>
        <strong>${data.adaptive?.enabled ? 'Ativo' : 'Base'}</strong>
      </div>
    </div>
    <div class="schedule-grid">
      ${(data.schedule || []).map(slot => {
        const window = windows[slot.window] || {};
        return `
          <article class="schedule-card">
            <div class="schedule-time">${escapeHtml(slot.time)}</div>
            <div>
              <strong>${labelSlotType(slot.type)}</strong>
              <span>${escapeHtml(window.label || '')}</span>
              <small>${labelIntent(window.intent)}</small>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

async function loadContents() {
  const data = await get('/api/contents');
  state.contents = data.contents || [];
  renderContents();
}

function renderContents() {
  const list = state.filter === 'all' ? state.contents : state.contents.filter(item => item.funil === state.filter);
  $('#contents-grid').innerHTML = list.length ? list.map(contentCard).join('') : '<div class="empty">Nenhum conteudo gerado para hoje. Use "Gerar agora".</div>';
  bindCardButtons($('#contents-grid'));
}

async function loadFavorites() {
  const data = await get('/api/contents/favorites');
  $('#favorites-grid').innerHTML = data.contents?.length ? data.contents.map(contentCard).join('') : '<div class="empty">Nenhum favorito ainda.</div>';
  bindCardButtons($('#favorites-grid'));
}

function contentCard(content) {
  const copy = formatContent(content);
  return `
    <article class="content-card ${content.used ? 'used' : ''}">
      <div class="meta">
        <span class="badge ${content.funil}">${content.funil}</span>
        <span class="badge pillar">${labelPillar(content.pillar)}</span>
        <span class="badge pillar">${labelIntentType(content.content_intent)}</span>
        <span class="badge pillar">${labelContentType(content.content_type)}</span>
        <span class="badge pillar">${escapeHtml(content.objetivo_post || objectiveForFunil(content.funil))}</span>
      </div>
      <div class="card-kicker">${escapeHtml(content.sequencia_nome || '')}${content.sequencia_parte ? ` | Parte ${content.sequencia_parte}` : ''}</div>
      <h2 class="reels-title">${escapeHtml(content.titulo_reels || content.tema || '')}</h2>
      <div class="format-line">${escapeHtml(content.formato_recomendado || 'Camera direta')}</div>
      ${content.tese ? `
        <div class="script-block highlight">
          <strong>Tese</strong>
          <p>${escapeHtml(content.tese)}</p>
        </div>
      ` : ''}
      <p class="hook">${escapeHtml(content.gancho)}</p>
      <div class="script-block">
        <strong>Roteiro falado</strong>
        <p>${escapeHtml(content.roteiro_falado || '')}</p>
      </div>
      ${content.pausas_entonacao ? `
        <div class="script-block">
          <strong>Pausas / Entonacao</strong>
          <p>${escapeHtml(content.pausas_entonacao)}</p>
        </div>
      ` : ''}
      ${content.momento_mostrar_tela ? `
        <div class="script-block">
          <strong>Momento de tela</strong>
          <p>${escapeHtml(content.momento_mostrar_tela)}</p>
        </div>
      ` : ''}
      <div class="script-block">
        <strong>Interpretacao</strong>
        <p>${escapeHtml(content.interpretacao || '')}</p>
      </div>
      ${content.conexao_com_vamo ? `
        <div class="script-block highlight">
          <strong>Conexao com Vamo</strong>
          <p>${escapeHtml(content.conexao_com_vamo)}</p>
        </div>
      ` : ''}
      <ol class="structure">${(content.estrutura || []).slice(0, 3).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
      <div class="score-row">
        ${scorePill('Autoridade', content.score_autoridade)}
        ${scorePill('Demanda', content.score_demanda)}
        ${scorePill('Conexao', content.score_conexao)}
        ${scorePill('Autenticidade', content.score_autenticidade)}
        ${scorePill('Vamo', content.score_vamo_alignment)}
      </div>
      <div class="cta">${escapeHtml(content.cta_texto || '')}</div>
      <div class="caption">${escapeHtml(content.legenda || '')}</div>
      <div class="link-box">
        ${content.instagram_post_id
          ? `
            <span class="linked">Post vinculado</span>
            <div class="manual-metrics">
              <input type="number" min="0" data-clicks-input="${content.instagram_post_id}" placeholder="Cliques no link" />
              <input type="number" min="0" data-leads-input="${content.instagram_post_id}" placeholder="Leads" />
              <button class="card-action" data-manual-metrics="${content.instagram_post_id}">Registrar performance</button>
            </div>
          `
          : `<input class="post-link-input" data-link-input="${content.id}" placeholder="Link do post publicado" />`}
      </div>
      <div class="card-actions">
        <button class="card-action" data-use="${content.id}">${content.used ? 'Desmarcar' : 'Usado'}</button>
        ${content.instagram_post_id ? '' : `<button class="card-action" data-link="${content.id}">Vincular post</button>`}
        <button class="card-action" data-favorite="${content.id}">${content.favorited ? 'Favorito' : 'Favoritar'}</button>
        <button class="card-action" data-copy="${encodeURIComponent(copy)}">Copiar para gravar</button>
      </div>
    </article>
  `;
}

function bindCardButtons(root) {
  root.querySelectorAll('[data-use]').forEach(button => button.addEventListener('click', async () => {
    await put(`/api/contents/${button.dataset.use}/use`);
    await loadContents();
    await loadFavorites();
  }));
  root.querySelectorAll('[data-favorite]').forEach(button => button.addEventListener('click', async () => {
    await put(`/api/contents/${button.dataset.favorite}/favorite`);
    await loadContents();
    await loadFavorites();
  }));
  root.querySelectorAll('[data-link]').forEach(button => button.addEventListener('click', async () => {
    const input = root.querySelector(`[data-link-input="${button.dataset.link}"]`);
    const url = input?.value?.trim();
    if (!url) return toast('Cole o link do post.');
    try {
      await post(`/api/contents/${button.dataset.link}/link-instagram`, { url });
      toast('Post vinculado.');
      await loadContents();
      await loadFavorites();
      await loadAnalytics();
    } catch (error) {
      toast(error.message);
    }
  }));
  root.querySelectorAll('[data-manual-metrics]').forEach(button => button.addEventListener('click', async () => {
    const postId = button.dataset.manualMetrics;
    const linkClicks = Number(root.querySelector(`[data-clicks-input="${postId}"]`)?.value || 0);
    const leadsGenerated = Number(root.querySelector(`[data-leads-input="${postId}"]`)?.value || 0);
    try {
      await putJson(`/api/metrics/${postId}/manual`, { link_clicks: linkClicks, leads_generated: leadsGenerated });
      toast('Performance registrada.');
      await loadAnalytics();
    } catch (error) {
      toast(error.message);
    }
  }));
  root.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(decodeURIComponent(button.dataset.copy));
    toast('Copiado.');
  }));
}

async function captureInsight() {
  const text = $('#insight-text').value.trim();
  if (!text) return toast('Escreva o insight primeiro.');
  const data = await post('/api/capture-insight', { text });
  const cards = (data.conteudos || data.insights || []).map((item, index) => ({
    id: `insight-${index}`,
    funil: item.funil,
    pillar: item.pillar || item.pilar || 'vamo',
    content_intent: item.content_intent || item.intent || '',
    content_type: item.content_type || item.formato || '',
    objetivo_post: item.objetivo_post,
    tese: item.tese,
    formato_recomendado: item.formato_recomendado,
    gancho: item.gancho,
    roteiro_falado: item.roteiro_falado,
    pausas_entonacao: item.pausas_entonacao,
    momento_mostrar_tela: item.momento_mostrar_tela,
    interpretacao: item.interpretacao,
    estrutura: item.estrutura || [],
    cta_texto: item.cta_texto,
    legenda: item.legenda,
    titulo_reels: item.titulo_reels,
    conexao_com_vamo: item.conexao_com_vamo,
    risco_generico: item.risco_generico,
    porque_gera_leads: item.porque_gera_leads,
    score_autoridade: item.score_autoridade,
    score_demanda: item.score_demanda,
    score_conexao: item.score_conexao,
    score_autenticidade: item.score_autenticidade,
    score_vamo_alignment: item.score_vamo_alignment,
    used: 0,
    favorited: 0
  }));
  $('#capture-result').innerHTML = cards.map(contentCard).join('');
  $('#capture-result').querySelectorAll('[data-use],[data-favorite],[data-link],.link-box').forEach(item => item.remove());
  bindCardButtons($('#capture-result'));
}

async function loadStatus() {
  const data = await get('/api/status');
  $('#status-panel').innerHTML = `
    <div class="metric-grid">
      <div class="metric-card"><span>Hoje</span><strong>${data.todayCount}</strong></div>
      <div class="metric-card"><span>Timezone</span><strong>${data.timezone}</strong></div>
    </div>
    <h3>Agendamentos</h3>
    <p><code>Geracao:</code> ${data.cron.generate}</p>
    <p><code>Briefing:</code> ${data.cron.briefing}</p>
    <p><code>Metricas:</code> ${data.cron.metrics}</p>
    <h3>Proxima agenda de posts</h3>
    <p>${(data.postingSchedule?.schedule || []).map(slot => `${slot.time} ${labelSlotType(slot.type)}`).join(' | ')}</p>
    <h3>Ultimos logs</h3>
    ${(data.lastRuns || []).map(log => `
      <div class="log-row">
        <strong>${log.job}</strong>
        <span>${log.status}</span>
        <span>${escapeHtml(log.message || '')}</span>
        <span>${new Date(log.created_at).toLocaleString('pt-BR')}</span>
      </div>
    `).join('') || '<div class="empty">Nenhum log ainda.</div>'}
  `;
}

async function loadAnalytics() {
  const [overview, intelligence] = await Promise.all([
    get('/api/analytics/overview'),
    get('/api/intelligence')
  ]);
  const o = overview.overview || {};
  $('#analytics-grid').innerHTML = [
    metric('Postagens', round(o.posts, 0)),
    metric('Vinculadas', round(o.linked_posts, 0)),
    metric('Reach medio', round(o.avg_reach)),
    metric('Engajamento', `${round(o.avg_engagement_rate)}%`),
    metric('Retencao', `${round(o.avg_retention_score)}%`),
    metric('Lead score', `${round(o.avg_lead_score)}%`),
    metric('Cliques', round(o.link_clicks, 0)),
    metric('Leads', round(o.leads_generated, 0))
  ].join('');
  const p = intelligence.patterns || {};
  $('#patterns-panel').innerHTML = `
    <h3>Pesos atuais</h3>
    <p>Funil: topo ${percent(p.weight_topo)}, meio ${percent(p.weight_meio)}, fundo ${percent(p.weight_fundo)}</p>
    <p>Pilares: Vamo ${percent(p.weight_vamo || p.weight_vendas)}, empreendedorismo ${percent(p.weight_empreendedorismo)}, fe ${percent(p.weight_fe)}, familia ${percent(p.weight_familia || p.weight_vida)}, oferta ${percent(p.weight_oferta)}</p>
    <h3>O sistema aprendeu</h3>
    <p>${escapeHtml(p.gpt_analysis || 'Ainda sem dados suficientes.')}</p>
  `;
}

function metric(label, value) {
  return `<div class="metric-card"><span>${label}</span><strong>${value || 0}</strong></div>`;
}

async function get(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

async function post(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error((await resp.json()).error || 'Erro na API');
  return resp.json();
}

async function put(url) {
  const resp = await fetch(url, { method: 'PUT' });
  if (!resp.ok) throw new Error((await resp.json()).error || 'Erro na API');
  return resp.json();
}

async function putJson(url, body) {
  const resp = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error((await resp.json()).error || 'Erro na API');
  return resp.json();
}

function formatContent(content) {
  return `TITULO:
${content.titulo_reels || content.tema || ''}

GANCHO:
${content.gancho || ''}

ROTEIRO:
${content.roteiro_falado || ''}

PAUSAS / ENTONACAO:
${content.pausas_entonacao || content.momento_mostrar_tela || ''}

CTA:
${content.cta_texto || ''}

LEGENDA:
${content.legenda || ''}

TESE:
${content.tese || ''}

CONEXAO COM VAMO:
${content.conexao_com_vamo || ''}

HASHTAGS:
${(content.hashtags || []).join(' ')}`;
}

function labelPillar(pillar) {
  return {
    vendas: 'Vamo',
    vamo: 'Vamo',
    empreendedorismo: 'Negocios',
    fe: 'Fe',
    familia: 'Familia',
    vida: 'Familia',
    oferta: 'Oferta'
  }[pillar] || pillar;
}

function labelIntentType(intent) {
  return {
    atrair: 'Atrair',
    autoridade: 'Autoridade',
    conexao: 'Conexao',
    educar: 'Educar',
    quebrar_crenca: 'Quebrar crenca',
    provar_metodo: 'Provar metodo',
    vender: 'Vender',
    reativar: 'Reativar',
    bastidor: 'Bastidor'
  }[intent] || 'Intencao';
}

function labelContentType(type) {
  return {
    camera_direta: 'Camera',
    bastidor: 'Bastidor',
    opiniao_forte: 'Opiniao',
    historia_pessoal: 'Historia',
    analise_de_operacao: 'Analise',
    framework: 'Framework',
    meme_com_contexto: 'Meme',
    carrossel: 'Carrossel',
    story: 'Story',
    prova_de_construcao: 'Prova',
    convite_diagnostico: 'Diagnostico'
  }[type] || 'Tipo';
}

function scorePill(label, value) {
  const score = Number(value || 0).toFixed(1);
  return `<span><small>${label}</small><strong>${score}</strong></span>`;
}

function round(value, digits = 1) {
  return Number(value || 0).toFixed(digits);
}

function objectiveForFunil(funil) {
  return { topo: 'Atrair seguidores', meio: 'Gerar autoridade', fundo: 'Gerar leads' }[funil] || 'Gerar leads';
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function labelSlotType(type) {
  return {
    insight: 'Insight',
    diagnostic: 'Diagnostico',
    light: 'Leve',
    quick_value: 'Valor rapido',
    authority: 'Autoridade'
  }[type] || type;
}

function labelIntent(intent) {
  return {
    awareness_mindset: 'Awareness / mindset',
    practical_problem_solving: 'Pratico / solucao',
    light_consumption: 'Consumo leve',
    quick_insights: 'Insights rapidos',
    deep_authority_conversion: 'Autoridade / conversao'
  }[intent] || '';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2200);
}
