import OpenAI from 'openai';
import { config } from './config.js';

const client = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

const ALLOWED_PILLARS = ['vamo', 'empreendedorismo', 'fe', 'familia', 'oferta'];
const ALLOWED_INTENTS = ['atrair', 'autoridade', 'conexao', 'educar', 'quebrar_crenca', 'provar_metodo', 'vender', 'reativar', 'bastidor'];
const ALLOWED_TYPES = [
  'camera_direta',
  'bastidor',
  'opiniao_forte',
  'historia_pessoal',
  'analise_de_operacao',
  'framework',
  'meme_com_contexto',
  'carrossel',
  'story',
  'prova_de_construcao',
  'convite_diagnostico'
];

export async function generateDailyContents({ date, sources = [], patterns = null, limit = config.dailyContentLimit }) {
  ensureOpenAIClient();

  const contents = [];
  const batchSize = 5;
  const editorialPlan = buildEditorialPlan(limit);

  while (contents.length < limit) {
    const remaining = limit - contents.length;
    const currentBatchSize = Math.min(batchSize, remaining);
    const currentPlan = editorialPlan.slice(contents.length, contents.length + currentBatchSize);
    const batch = await generateContentBatch({
      date,
      sources,
      patterns,
      limit: currentBatchSize,
      batchNumber: Math.floor(contents.length / batchSize) + 1,
      existingHooks: contents.map(item => item.gancho),
      editorialPlan: currentPlan
    });
    contents.push(...batch);
  }

  validateContents(contents, limit, editorialPlan);
  return contents;
}

async function generateContentBatch({ date, sources, patterns, limit, batchNumber, existingHooks, editorialPlan }) {
  const basePrompt = buildDailyPrompt({ date, sources, patterns, limit, batchNumber, existingHooks, editorialPlan });
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const prompt = attempt === 1
      ? basePrompt
      : `${basePrompt}

ATENCAO: sua resposta anterior foi rejeitada pelo validador com este motivo:
${lastError.message}

Corrija agora. Retorne exatamente ${limit} itens, sem placeholders, sem topicos genericos, sem CTA de diagnostico fora de fundo/oferta e sem texto fora do JSON.`;

    const raw = await callJson(prompt);
    const parsed = parseJson(raw);
    if (!Array.isArray(parsed.conteudos)) {
      lastError = new Error('A OpenAI nao retornou o JSON esperado em "conteudos". Nada foi salvo.');
      continue;
    }

    const contents = normalizeGeneratedContents(parsed.conteudos.slice(0, limit), editorialPlan);
    try {
      validateContents(contents, limit, editorialPlan);
      return contents;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function captureInsight(insightText) {
  ensureOpenAIClient();

  const raw = await callJson(`
O criador escreveu este pensamento bruto:
"${insightText}"

Transforme isso em conteudo publicavel para a marca pessoal de Gustavo Garcia / Vamo.
Nao force todo insight para venda. Se o tema for fe, familia ou bastidor, preserve a natureza do insight e conecte com a Vamo apenas quando fizer sentido estrategico.

Gere exatamente 6 versoes:
1. Reels camera direta.
2. Story.
3. Carrossel.
4. Post mais agressivo.
5. Versao mais pessoal.
6. Convite ou CTA recomendado.

Cada versao precisa trazer pilar, funil, intencao, tipo, tese, gancho, roteiro, legenda, CTA, conexao com a Vamo, risco e notas de 0 a 10.
Use CTA de diagnostico somente em conteudo de fundo ou pilar oferta.

Responda apenas em JSON neste formato:
${contentJsonContract()}
`);
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed.conteudos)) {
    throw new Error('A OpenAI nao retornou o JSON esperado em "conteudos".');
  }
  const conteudos = normalizeGeneratedContents(parsed.conteudos);
  return { conteudos, insights: conteudos };
}

export async function analyzePerformanceWithGpt(summary) {
  ensureOpenAIClient();
  const raw = await callJson(`
Analise as metricas abaixo como editor-chefe da marca Gustavo Garcia / Vamo.

Separe o aprendizado por objetivo:
- conteudos que trouxeram alcance;
- conteudos que trouxeram seguidores;
- conteudos que trouxeram comentarios;
- conteudos que trouxeram salvamentos;
- conteudos que trouxeram cliques;
- conteudos que trouxeram leads;
- conteudos que fortaleceram autoridade.

Regra editorial:
Conteudos de conexao, fe, familia e bastidor nao devem ser julgados apenas por lead. Avalie por resposta, comentario, salvamento, compartilhamento e crescimento de seguidores.

Responda especificamente:
- o que postar mais;
- o que evitar;
- o que transformar em serie;
- como equilibrar autoridade, demanda e conexao na proxima semana.

${summary}

Responda em JSON: {"analise":"texto objetivo"}
`);
  return parseJson(raw).analise || '';
}

async function callJson(prompt) {
  const response = await client.chat.completions.create({
    model: config.openaiModel,
    temperature: 0.55,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: prompt }
    ]
  });
  return response.choices[0]?.message?.content || '{}';
}

function buildSystemPrompt() {
  const casesRule = config.creator.hasCases
    ? 'Pode mencionar cases reais somente se forem fornecidos no contexto.'
    : 'Nao mencione resultados de clientes nem cases. Use metodologia, diagnostico e conhecimento proprio.';

  return `
Voce e o editor-chefe de conteudo de ${config.creator.name || 'Gustavo Garcia'}, cofundador da ${config.creator.product || 'Vamo'}.

A Vamo e uma solucao de performance operacional comercial. Ela diagnostica gargalos em vendas, atendimento e pos-venda, redesenha processos e implanta sistemas de execucao para tornar a operacao mais previsivel, controlavel e escalavel.

Posicionamento do criador:
${config.creator.positioning || 'Fundador em construcao, cofundador da Vamo, falando sobre performance comercial, empreendedorismo real, fe, familia e construcao do zero.'}

Posicionamento da Vamo:
${config.vamo.positioning || 'Solucao de performance operacional comercial que combina diagnostico, processos, sistemas e implementacao.'}

Tese central da Vamo:
${config.vamo.thesis || 'Empresas nao perdem resultado apenas por falta de demanda. Muitas perdem vendas, atendimento e retencao por falhas invisiveis no processo comercial: lead sem retorno, follow-up fraco, ausencia de rotina, atendimento sem padrao, pos-venda inexistente e gestor sem visibilidade.'}

Oferta/metodo:
${config.vamo.offer || 'Diagnostico, mapeamento de gargalos, redesenho de processo, sistema de execucao, implantacao, treinamento e otimizacao continua.'}
Metodo: ${config.vamo.method || 'Diagnosticar, mapear, redesenhar, desenvolver, implementar e otimizar.'}
ICP: ${config.vamo.icp || 'Empresas com operacao comercial ativa e problemas de follow-up, atendimento, controle ou pos-venda.'}

A Vamo nao deve ser posicionada como:
${config.vamo.forbiddenPositioning || 'software isolado, CRM tradicional, agencia de marketing, software house generica ou consultoria que so entrega diagnostico.'}

A marca pessoal do Gustavo deve vender a Vamo sem parecer um perfil comercial frio.
Ela combina:
1. Performance comercial e operacao.
2. Empreendedorismo real e construcao do zero.
3. Fe, valores e responsabilidade.
4. Familia e bastidores.
5. Oferta e diagnostico.

Tom:
- direto;
- forte;
- humano;
- provocativo;
- sem arrogancia;
- sem parecer guru;
- sem parecer IA;
- sem linguagem generica.

Evite:
- "ajudo";
- "dicas";
- "vender mais";
- "transformar sua vida";
- "mentalidade de sucesso";
- frases motivacionais vazias;
- conteudo religioso desconectado da vida real;
- familia usada como isca de engajamento;
- promessa de resultado sem base.

Prefira:
- processo;
- sistema;
- execucao;
- previsibilidade;
- controle;
- clareza;
- rotina;
- gargalo;
- vazamento comercial;
- responsabilidade;
- construcao;
- decisao;
- disciplina;
- fe aplicada a pratica.

Regras para fe:
${config.creator.faithBoundary || 'Falar de fe com maturidade, sem parecer pregacao solta e sempre conectando com decisao, responsabilidade, carater, disciplina e vida real.'}
Pode falar de carater, disciplina, humildade, decisao dificil, principios e longo prazo. Nunca prometa sucesso financeiro por fe.

Regras para familia:
${config.creator.familyBoundary || 'Falar de familia como responsabilidade e bastidor, sem exposicao desnecessaria e sem usar familia como isca de engajamento.'}

Regras para Vamo:
- Explique a Vamo como processo + sistema + implementacao.
- Nunca trate como ferramenta isolada.
- Diagnostico e CTA comercial aparecem principalmente em fundo de funil ou pilar oferta.

${casesRule}

Todo conteudo precisa responder pelo menos uma destas perguntas:
1. Isso aumenta a autoridade do Gustavo?
2. Isso aproxima um empresario da Vamo?
3. Isso torna a tese da Vamo mais clara?
4. Isso cria conexao real com a jornada dele?
5. Isso gera conversa, diagnostico, DM ou clique qualificado?
`;
}

function buildDailyPrompt({ date, sources, patterns, limit, batchNumber = 1, existingHooks = [], editorialPlan = [] }) {
  const freshnessWindow = sources.find(source => source.freshness_window_days)?.freshness_window_days || null;
  const sourceText = sources.slice(0, 20).map((s, index) => {
    return `${index + 1}. [${s.platform}${s.publishedAt ? ` | ${s.publishedAt}` : ''}] ${s.headline} - ${s.summary || ''} ${s.url || ''}`;
  }).join('\n');
  const sequenceName = pickSeriesName(date, batchNumber);

  return `
Data: ${date}
Gere exatamente ${limit} conteudos para Instagram em JSON valido.
Este e o lote ${batchNumber}. Nao repita nenhum gancho ja usado.

Ganchos ja usados em lotes anteriores:
${existingHooks.length ? existingHooks.map(hook => `- ${hook}`).join('\n') : '- nenhum'}

Plano editorial obrigatorio deste lote, nesta ordem:
${editorialPlan.map((item, index) => `${index + 1}. pilar=${item.pillar}; funil=${item.funil}; intent=${item.content_intent}; tipo=${item.content_type}; narrativa=${item.narrative}`).join('\n')}

Distribuicao diaria recomendada para 10 conteudos:
- 4 conteudos de Vamo / Performance Comercial.
- 2 conteudos de Empreendedorismo Real.
- 1 conteudo de Fe, Valores e Decisao.
- 1 conteudo de Familia e Responsabilidade.
- 1 conteudo de Bastidor da construcao da Vamo.
- 1 conteudo de Oferta / Diagnostico.

Para 20 conteudos, duplique a proporcao, mas evite repeticao de gancho e formato.

O lote deve parecer uma linha narrativa:
1. dor percebida;
2. causa real;
3. erro comum;
4. tese da Vamo;
5. bastidor de construcao;
6. aprendizado pessoal;
7. valor ou fe aplicado;
8. responsabilidade familiar;
9. convite para diagnostico;
10. reforco de autoridade.

Serie editorial: "${sequenceName}"

Use estes padroes atuais quando existirem, sem deixar o lead score matar conteudos de conexao:
${JSON.stringify(patterns || {}, null, 2)}

Fontes coletadas hoje:
${sourceText || 'Sem fontes externas. Use conhecimento atemporal.'}

Janela de relevancia das fontes: ${freshnessWindow ? `${freshnessWindow} dia(s)` : 'sem data confiavel; use somente se o tema for atemporal e relevante'}.
Prioridade: fontes de hoje > ultimos 3 dias > ultimos 7 dias > atemporal.

Regras de qualidade:
- A Vamo deve aparecer como processo + sistema + implementacao.
- Nao force insight pessoal, fe ou familia a virar venda direta.
- Sempre que fizer sentido, explique a conexao estrategica com a Vamo.
- Conteudo de conexao pode terminar em reflexao, comentario, salvamento ou compartilhamento.
- CTA de diagnostico so em funil fundo ou pilar oferta.
- Cada item precisa de uma tese clara.
- Cada item precisa de notas 0 a 10 para autoridade, demanda, conexao, autenticidade e alinhamento com Vamo.
- Proiba linguagem fraca, generica, guru ou motivacional vazia.
- Retorne exatamente ${limit} itens. Nem mais, nem menos.

Contrato JSON:
${contentJsonContract(sequenceName)}
`;
}

function contentJsonContract(sequenceName = '') {
  return `{
  "conteudos": [
    {
      "objetivo_post": "Atrair seguidores|Gerar autoridade|Gerar leads|Gerar comentarios|Gerar DM|Criar conexao",
      "funil": "topo|meio|fundo",
      "pillar": "vamo|empreendedorismo|fe|familia|oferta",
      "content_intent": "atrair|autoridade|conexao|educar|quebrar_crenca|provar_metodo|vender|reativar|bastidor",
      "content_type": "camera_direta|bastidor|opiniao_forte|historia_pessoal|analise_de_operacao|framework|meme_com_contexto|carrossel|story|prova_de_construcao|convite_diagnostico",
      "sequencia_nome": "${sequenceName}",
      "sequencia_parte": 1,
      "tese": "Ideia central do conteudo",
      "tema": "Resumo curto",
      "formato_recomendado": "Camera direta|Tela da plataforma|Misto (camera + tela)|Bastidor|Carrossel|Story",
      "gancho": "Primeiros 5-10 segundos",
      "roteiro_falado": "Roteiro natural",
      "pausas_entonacao": "Marcacoes curtas de ritmo, pausa e enfase",
      "momento_mostrar_tela": "Se aplicavel",
      "interpretacao": "O que isso significa para o publico",
      "estrutura": ["ponto 1", "ponto 2", "ponto 3"],
      "cta_tipo": "link|dm|comentario|salvar|compartilhar|seguir|refletir",
      "cta_texto": "Texto do CTA",
      "legenda": "Legenda pronta",
      "titulo_reels": "Titulo curto",
      "hashtags": ["#vendas", "#empreendedorismo"],
      "conexao_com_vamo": "Como isso fortalece a Vamo ou a autoridade do Gustavo",
      "risco_generico": "O que evitar ao gravar",
      "porque_gera_leads": "Explicacao estrategica",
      "score_autoridade": 0,
      "score_demanda": 0,
      "score_conexao": 0,
      "score_autenticidade": 0,
      "score_vamo_alignment": 0,
      "source_headline": "",
      "source_url": ""
    }
  ]
}`;
}

function buildEditorialPlan(limit) {
  const base = [
    { pillar: 'vamo', funil: 'topo', content_intent: 'atrair', content_type: 'opiniao_forte', narrative: 'dor percebida' },
    { pillar: 'vamo', funil: 'meio', content_intent: 'educar', content_type: 'analise_de_operacao', narrative: 'causa real' },
    { pillar: 'vamo', funil: 'meio', content_intent: 'quebrar_crenca', content_type: 'camera_direta', narrative: 'erro comum' },
    { pillar: 'vamo', funil: 'meio', content_intent: 'provar_metodo', content_type: 'framework', narrative: 'tese da Vamo' },
    { pillar: 'empreendedorismo', funil: 'topo', content_intent: 'bastidor', content_type: 'bastidor', narrative: 'bastidor de construcao' },
    { pillar: 'empreendedorismo', funil: 'topo', content_intent: 'autoridade', content_type: 'historia_pessoal', narrative: 'aprendizado pessoal' },
    { pillar: 'fe', funil: 'topo', content_intent: 'conexao', content_type: 'historia_pessoal', narrative: 'valor ou fe aplicado' },
    { pillar: 'familia', funil: 'topo', content_intent: 'conexao', content_type: 'bastidor', narrative: 'responsabilidade familiar' },
    { pillar: 'oferta', funil: 'fundo', content_intent: 'vender', content_type: 'convite_diagnostico', narrative: 'convite para diagnostico' },
    { pillar: 'vamo', funil: 'fundo', content_intent: 'autoridade', content_type: 'prova_de_construcao', narrative: 'reforco de autoridade' }
  ];
  return Array.from({ length: limit }, (_, index) => base[index % base.length]);
}

function pickSeriesName(date, batchNumber) {
  const names = [
    'Caos comercial em execucao previsivel',
    'Construindo a Vamo por dentro',
    'Vazamentos que o gestor nao ve',
    'Processo, sistema e responsabilidade'
  ];
  const seed = String(date || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), batchNumber);
  return names[seed % names.length];
}

function normalizeGeneratedContents(contents, editorialPlan = []) {
  return contents.map((item, index) => {
    const plan = editorialPlan[index] || {};
    const funil = normalizeFunil(item.funil || plan.funil);
    const pillar = normalizePillar(item.pillar || item.pilar || plan.pillar);
    const contentIntent = normalizeEnum(item.content_intent || item.intent || plan.content_intent, ALLOWED_INTENTS, plan.content_intent || 'autoridade');
    const contentType = normalizeEnum(item.content_type || item.formato || plan.content_type, ALLOWED_TYPES, plan.content_type || 'camera_direta');
    const estrutura = Array.isArray(item.estrutura) && item.estrutura.length
      ? item.estrutura
      : [
          item.tese || item.interpretacao || 'Mostre o ponto central com clareza.',
          'Conecte com processo, responsabilidade ou execucao.',
          'Feche com um proximo passo coerente com a intencao do post.'
        ];
    const ctaTipo = normalizeCtaType(item.cta_tipo, funil, pillar);

    return {
      ...item,
      funil,
      pillar,
      content_intent: contentIntent,
      content_type: contentType,
      objetivo_post: item.objetivo_post || objectiveFor({ funil, pillar, contentIntent }),
      sequencia_nome: item.sequencia_nome || '',
      sequencia_parte: Number(item.sequencia_parte || index + 1),
      tese: item.tese || item.tema || estrutura[0] || 'Tese do conteudo',
      tema: item.tema || item.titulo_reels || item.tese || 'Central de autoridade',
      formato_recomendado: item.formato_recomendado || formatForContentType(contentType, funil),
      gancho: item.gancho || estrutura[0] || 'CRM sem rotina vira cemiterio de lead.',
      roteiro_falado: item.roteiro_falado || estrutura.join(' '),
      pausas_entonacao: item.pausas_entonacao || item.pausas || '',
      momento_mostrar_tela: item.momento_mostrar_tela || '',
      interpretacao: item.interpretacao || item.conexao_com_vamo || estrutura[1] || '',
      estrutura,
      cta_tipo: ctaTipo,
      cta_texto: normalizeCtaText(item.cta_texto || item.cta, ctaTipo, funil, pillar),
      legenda: item.legenda || `${item.gancho || estrutura[0]} ${item.tese || ''}`.trim(),
      titulo_reels: item.titulo_reels || String(item.tema || item.tese || 'Execucao comercial').slice(0, 45),
      hashtags: Array.isArray(item.hashtags) && item.hashtags.length ? item.hashtags : ['#somosvamo', '#execucaocomercial'],
      conexao_com_vamo: item.conexao_com_vamo || strategicConnectionFor(pillar),
      risco_generico: item.risco_generico || item.risco || 'Evite frase pronta, promessa exagerada ou tom de guru.',
      porque_gera_leads: item.porque_gera_leads || item.porque || strategicLeadReasonFor({ pillar, funil, contentIntent }),
      score_autoridade: score(item.score_autoridade),
      score_demanda: score(item.score_demanda),
      score_conexao: score(item.score_conexao),
      score_autenticidade: score(item.score_autenticidade),
      score_vamo_alignment: score(item.score_vamo_alignment ?? item.score_alinhamento_vamo),
      source_headline: item.source_headline || item.sourceHeadline || '',
      source_url: item.source_url || item.sourceUrl || ''
    };
  }).map(item => ({
    ...item,
    score_final: Number((
      item.score_autoridade * 0.25
      + item.score_demanda * 0.30
      + item.score_conexao * 0.15
      + item.score_autenticidade * 0.10
      + item.score_vamo_alignment * 0.20
    ).toFixed(2))
  }));
}

function normalizeFunil(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('fundo') || text.includes('bofu')) return 'fundo';
  if (text.includes('meio') || text.includes('mofu')) return 'meio';
  return 'topo';
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

function normalizeEnum(value, allowed, fallback) {
  const text = String(value || '').toLowerCase().trim().replace(/\s+/g, '_');
  return allowed.includes(text) ? text : fallback;
}

function objectiveFor({ funil, pillar, contentIntent }) {
  if (pillar === 'oferta' || contentIntent === 'vender' || funil === 'fundo') return 'Gerar leads';
  if (contentIntent === 'conexao') return 'Criar conexao';
  if (contentIntent === 'atrair') return 'Atrair seguidores';
  if (contentIntent === 'bastidor') return 'Gerar comentarios';
  return 'Gerar autoridade';
}

function formatForContentType(contentType, funil) {
  const formats = {
    camera_direta: 'Camera direta',
    bastidor: 'Bastidor',
    opiniao_forte: 'Camera direta',
    historia_pessoal: 'Camera direta',
    analise_de_operacao: 'Misto (camera + tela)',
    framework: 'Carrossel',
    meme_com_contexto: 'Story',
    carrossel: 'Carrossel',
    story: 'Story',
    prova_de_construcao: 'Misto (camera + tela)',
    convite_diagnostico: 'Camera direta'
  };
  return formats[contentType] || (funil === 'fundo' ? 'Misto (camera + tela)' : 'Camera direta');
}

function normalizeCtaType(value, funil, pillar) {
  const text = String(value || '').toLowerCase();
  const allowed = ['link', 'dm', 'comentario', 'salvar', 'compartilhar', 'seguir', 'refletir'];
  const requested = allowed.find(item => text.includes(item));
  if ((funil === 'fundo' || pillar === 'oferta') && ['link', 'dm', 'comentario'].includes(requested)) return requested;
  if (funil === 'fundo' || pillar === 'oferta') return 'link';
  if (requested && requested !== 'link' && requested !== 'dm') return requested;
  if (funil === 'meio') return 'salvar';
  return pillar === 'fe' || pillar === 'familia' ? 'refletir' : 'comentario';
}

function normalizeCtaText(value, ctaTipo, funil, pillar) {
  const text = String(value || '').trim();
  const diagnosticWords = /diagn[oó]stico|link da bio|dm|direct|analise sua opera/i;
  if (text && (funil === 'fundo' || pillar === 'oferta' || !diagnosticWords.test(text))) return text;
  if (funil === 'fundo' || pillar === 'oferta') return 'Se voce nao sabe onde sua operacao perde vendas, o diagnostico e o primeiro passo. O link esta na bio.';
  if (ctaTipo === 'salvar') return 'Salve para revisar antes da proxima decisao comercial.';
  if (ctaTipo === 'compartilhar') return 'Compartilhe com alguem que precisa olhar para a rotina com mais clareza.';
  if (ctaTipo === 'seguir') return 'Siga para acompanhar a construcao da Vamo e os bastidores da execucao comercial.';
  if (ctaTipo === 'refletir') return 'Pensa nisso antes da proxima decisao dificil.';
  return 'Comente se isso aparece na sua rotina.';
}

function strategicConnectionFor(pillar) {
  const connections = {
    vamo: 'Reforca a tese da Vamo: processo, sistema e implementacao para reduzir vazamentos comerciais.',
    empreendedorismo: 'Mostra Gustavo como fundador em construcao e da contexto humano para a Vamo.',
    fe: 'Conecta valores, decisao e responsabilidade com a forma de construir negocio.',
    familia: 'Mostra familia como responsabilidade real por tras da construcao da empresa.',
    oferta: 'Leva o decisor a perceber que precisa diagnosticar gargalos antes de comprar ferramenta.'
  };
  return connections[pillar] || connections.vamo;
}

function strategicLeadReasonFor({ pillar, funil, contentIntent }) {
  if (pillar === 'oferta' || funil === 'fundo' || contentIntent === 'vender') {
    return 'Conecta uma dor operacional concreta com o diagnostico da Vamo.';
  }
  if (pillar === 'vamo') return 'Aumenta clareza sobre vazamentos comerciais e prepara demanda qualificada.';
  return 'Fortalece autoridade e conexao, criando confianca antes da oferta.';
}

function score(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(10, Number(number.toFixed(1))));
}

function parseJson(raw) {
  try {
    return JSON.parse(String(raw).replace(/```json|```/g, '').trim());
  } catch {
    return {};
  }
}

function ensureOpenAIClient() {
  if (!client) {
    throw new Error('OPENAI_API_KEY nao configurada. Preencha o .env para gerar conteudo real.');
  }
}

function validateContents(contents, expectedLimit, editorialPlan = []) {
  if (contents.length !== expectedLimit) {
    throw new Error(`A OpenAI retornou ${contents.length} conteudos, mas o esperado era ${expectedLimit}. Nada foi salvo.`);
  }

  const requiredFields = [
    'objetivo_post',
    'funil',
    'pillar',
    'content_intent',
    'content_type',
    'tese',
    'formato_recomendado',
    'gancho',
    'roteiro_falado',
    'cta_texto',
    'legenda',
    'titulo_reels',
    'conexao_com_vamo',
    'risco_generico',
    'porque_gera_leads'
  ];

  const missing = contents.find(item => requiredFields.some(field => !String(item[field] || '').trim()));
  if (missing) {
    throw new Error('A OpenAI retornou conteudo sem a estrutura obrigatoria completa. Nada foi salvo.');
  }

  const invalidEnum = contents.find(item => (
    !ALLOWED_PILLARS.includes(item.pillar)
    || !ALLOWED_INTENTS.includes(item.content_intent)
    || !ALLOWED_TYPES.includes(item.content_type)
  ));
  if (invalidEnum) {
    throw new Error('A OpenAI retornou pilar, intencao ou tipo fora do contrato. Nada foi salvo.');
  }

  const forbiddenPatterns = [
    /compet[eê]ncia\s*\d/i,
    /erro\s*\d/i,
    /benef[ií]cios?$/i,
    /import[aâ]ncia$/i,
    /como implementar$/i,
    /desafios e solu[cç][oõ]es$/i,
    /voc[eê] est[aá] preparado/i,
    /est[aá] por dentro/i,
    /est[aá] pronto/i,
    /est[aá] no alvo/i,
    /equipe est[aá] preparada/i,
    /sua marca est[aá] pronta/i,
    /crm est[aá] pronto/i,
    /pausas suficientes/i,
    /\bajudo\b/i,
    /\bdicas\b/i,
    /vender mais/i,
    /transformar sua vida/i,
    /mentalidade de sucesso/i
  ];

  const weakItems = contents.filter(item => {
    const text = [
      item.tema,
      item.tese,
      item.gancho,
      item.roteiro_falado,
      item.legenda,
      item.conexao_com_vamo,
      item.risco_generico,
      ...(Array.isArray(item.estrutura) ? item.estrutura : [])
    ].join(' ');
    return forbiddenPatterns.some(pattern => pattern.test(text));
  });

  if (weakItems.length) {
    throw new Error('A OpenAI retornou conteudo generico ou com termos proibidos. Nada foi salvo; tente gerar novamente.');
  }

  const commercialCtaOutsideOffer = contents.find(item => {
    const text = `${item.cta_tipo || ''} ${item.cta_texto || ''}`;
    return item.funil !== 'fundo'
      && item.pillar !== 'oferta'
      && /(link da bio|diagn[oó]stico gratuito|diagnostico gratuito|dm|direct)/i.test(text);
  });
  if (commercialCtaOutsideOffer) {
    throw new Error('A OpenAI colocou CTA comercial forte fora de fundo/oferta. Nada foi salvo.');
  }

  if (editorialPlan.length) {
    const mismatch = contents.find((item, index) => {
      const plan = editorialPlan[index];
      return plan && (item.pillar !== plan.pillar || item.funil !== plan.funil);
    });
    if (mismatch) {
      throw new Error('A OpenAI nao respeitou a distribuicao editorial de pilar e funil. Nada foi salvo.');
    }
  }
}
