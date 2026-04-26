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
  await Promise.all([loadContents(), loadStatus(), loadAnalytics(), loadFavorites()]);
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
      </div>
      <p class="hook">${escapeHtml(content.gancho)}</p>
      <ol class="structure">${(content.estrutura || []).slice(0, 3).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
      <div class="cta">${escapeHtml(content.cta_texto || '')}</div>
      <div class="link-box">
        ${content.instagram_post_id
          ? `<span class="linked">Post vinculado</span>`
          : `<input class="post-link-input" data-link-input="${content.id}" placeholder="Link do post publicado" />`}
      </div>
      <div class="card-actions">
        <button class="card-action" data-use="${content.id}">${content.used ? 'Desmarcar' : 'Usado'}</button>
        ${content.instagram_post_id ? '' : `<button class="card-action" data-link="${content.id}">Vincular post</button>`}
        <button class="card-action" data-favorite="${content.id}">${content.favorited ? 'Favorito' : 'Favoritar'}</button>
        <button class="card-action" data-copy="${encodeURIComponent(copy)}">Copiar</button>
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
  root.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(decodeURIComponent(button.dataset.copy));
    toast('Copiado.');
  }));
}

async function captureInsight() {
  const text = $('#insight-text').value.trim();
  if (!text) return toast('Escreva o insight primeiro.');
  const data = await post('/api/capture-insight', { text });
  const cards = (data.insights || []).map((item, index) => ({
    id: `insight-${index}`,
    funil: item.funil,
    pillar: 'vendas',
    gancho: item.gancho,
    estrutura: item.estrutura || [],
    cta_texto: item.cta_texto,
    used: 0,
    favorited: 0
  }));
  $('#capture-result').innerHTML = cards.map(contentCard).join('');
  $('#capture-result').querySelectorAll('[data-use],[data-favorite]').forEach(button => button.remove());
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
    metric('Reach medio', round(o.avg_reach)),
    metric('Engajamento', `${round(o.avg_engagement_rate)}%`),
    metric('Retencao', `${round(o.avg_retention_score)}%`),
    metric('Lead score', `${round(o.avg_lead_score)}%`)
  ].join('');
  const p = intelligence.patterns || {};
  $('#patterns-panel').innerHTML = `
    <h3>Pesos atuais</h3>
    <p>Funil: topo ${percent(p.weight_topo)}, meio ${percent(p.weight_meio)}, fundo ${percent(p.weight_fundo)}</p>
    <p>Pilares: vendas ${percent(p.weight_vendas)}, empreendedorismo ${percent(p.weight_empreendedorismo)}, fe ${percent(p.weight_fe)}, vida ${percent(p.weight_vida)}</p>
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

function formatContent(content) {
  return `GANCHO:\n${content.gancho}\n\nESTRUTURA:\n${(content.estrutura || []).join('\n')}\n\nCTA:\n${content.cta_texto}\n\nHASHTAGS:\n${(content.hashtags || []).join(' ')}`;
}

function labelPillar(pillar) {
  return { vendas: 'Vendas', empreendedorismo: 'Negocios', fe: 'Fe', vida: 'Vida' }[pillar] || pillar;
}

function round(value) {
  return Number(value || 0).toFixed(1);
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
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
