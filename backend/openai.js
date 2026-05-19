import OpenAI from 'openai';
import { config } from './config.js';

const client = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

const ALLOWED_PILLARS = ['vamo', 'empreendedorismo', 'fe', 'familia', 'oferta'];
const ALLOWED_INTENTS = ['atrair', 'autoridade', 'conexao', 'educar', 'quebrar_crenca', 'provar_metodo', 'vender', 'reativar', 'bastidor', 'aumentar_percepcao_de_risco', 'nomear_problema', 'preparar_demanda'];
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
  'convite_diagnostico',
  'narrativa_de_funil',
  'alerta_comercial',
  'reflexao_empresarial'
];
const ALLOWED_NARRATIVE_AXES = [
  'vazamento_comercial',
  'processo_antes_da_ia',
  'ia_como_meio',
  'previsibilidade_comercial',
  'gestor_sem_visibilidade',
  'whatsapp_sem_processo',
  'follow_up_falho',
  'crm_morto',
  'bastidor_de_construcao',
  'fe_valores_decisao',
  'prosperidade_com_responsabilidade',
  'familia_responsabilidade',
  'diagnostico_vamo'
];
const ALLOWED_AWARENESS_LEVELS = [
  'inconsciente_do_problema',
  'sente_sintoma',
  'reconhece_gargalo',
  'busca_solucao',
  'pronto_para_conversar'
];
const ALLOWED_EXPECTED_RESULTS = [
  'alcance_qualificado',
  'comentarios_de_identificacao',
  'salvamentos',
  'respostas_no_direct',
  'cliques_no_diagnostico',
  'reforco_de_autoridade'
];
const ALLOWED_FUNNEL_ROLES = [
  'atrair_dor_latente',
  'nomear_problema',
  'quebrar_crenca',
  'aumentar_percepcao_de_risco',
  'provar_raciocinio',
  'criar_conexao',
  'preparar_demanda',
  'converter_para_diagnostico'
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

export async function captureInsight(input) {
  ensureOpenAIClient();

  const options = typeof input === 'string'
    ? { insightText: input }
    : (input || {});
  const insightText = options.insightText || options.text || '';
  const mode = normalizeCaptureMode(options.mode || config.editorial.defaultContentMode || 'auto');
  const desiredFunil = normalizeDesired(options.desiredFunil, ['auto', 'topo', 'meio', 'fundo']);
  const desiredPillar = normalizeDesired(options.desiredPillar, ['auto', ...ALLOWED_PILLARS]);

  const raw = await callJson(`
O criador escreveu este pensamento bruto:
"${insightText}"

Modo solicitado: ${mode}
Funil desejado: ${desiredFunil}
Pilar desejado: ${desiredPillar}

Transforme isso em conteudo publicavel para a marca pessoal Gustavo Garcia / VAMO.

Se o modo for narrativa_vamo:
- conecte com vazamento comercial, processo, previsibilidade ou IA como meio.

Se o modo for funil_contemporaneo:
- leia a ideia como uma oportunidade de funil.
- gere versoes para topo, meio e fundo.
- explique qual versao serve para atrair, qual serve para educar e qual serve para converter.

Se o modo for fe_prosperidade:
- preserve a fe e a prosperidade como maturidade, ordem, responsabilidade e decisao.
- nao force venda.

Se o modo for bastidor_empresario:
- transforme em conteudo de conexao e autoridade.
- mostre raciocinio de empresario em construcao.

Se o modo for oferta_diagnostico:
- leve para o Mapa de Vazamento de Vendas.
- mostre que antes de IA, automacao ou ferramenta vem diagnostico.

Gere exatamente 6 versoes:
1. Reels camera direta.
2. Story.
3. Carrossel.
4. Post forte de opiniao.
5. Versao pessoal/conexao.
6. Versao com funcao clara de funil.

Cada versao deve seguir o contrato JSON completo.

Responda apenas em JSON neste formato:
${contentJsonContract()}
`);
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed.conteudos)) {
    throw new Error('A OpenAI nao retornou o JSON esperado em "conteudos".');
  }
  const conteudos = normalizeGeneratedContents(parsed.conteudos);
  validateContents(conteudos, 6);
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
- quais eixos narrativos da VAMO mais performaram;
- quais tipos de vazamento comercial mais geraram identificacao;
- quais conteudos de fe/prosperidade geraram conexao sem parecerem soltos;
- quais conteudos prepararam melhor a demanda para diagnostico;
- quais conteudos devem virar serie.

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
Voce e o editor-chefe de conteudo de ${config.creator.name || 'Gustavo Garcia'}, cofundador da VAMO.

Sua funcao nao e apenas criar ideias. Sua funcao e proteger e expandir uma narrativa comercial.

Narrativa-mae da VAMO:
${config.editorial.narrativeMother}

A VAMO nao vende IA como promessa principal.
A VAMO nao vende software isolado.
A VAMO nao vende bot.
A VAMO nao vende dashboard.
A VAMO nao vende automacao solta.
A VAMO vende performance comercial com IA como parte da estrutura.

Regra central:
${config.editorial.communicationRule}

O publico precisa perceber o problema comercial antes de perceber a tecnologia.

Gustavo nao deve parecer apenas o cara da IA ou o dev que cria sistemas.
Gustavo deve parecer alguem que transforma gargalos comerciais em sistemas inteligentes, automacoes e IA aplicada para empresas que querem vender com mais previsibilidade.

Tese que deve atravessar todos os conteudos comerciais:
- Empresas nao perdem venda so por falta de lead.
- Muitas perdem por falta de processo, velocidade, acompanhamento e inteligencia.
- IA sem processo nao resolve o comercial. Ela acelera a bagunca.
- Ferramenta qualquer um compra. Operacao comercial bem implantada poucos sustentam.
- O objetivo nao e ter mais uma tela. O objetivo e vender com mais previsibilidade.

Posicionamento do criador:
${config.creator.positioning || config.editorial.creatorNarrative}

Posicionamento da Vamo:
${config.vamo.positioning || config.editorial.institutionalNarrative}

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
1. VAMO e performance comercial.
2. Empreendedorismo real e construcao do zero.
3. Fe, valores, prosperidade e decisao.
4. Familia e responsabilidade.
5. Oferta, diagnostico e conversao.

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
- "sistema simples";
- "bot de vendas";
- "automatize tudo";
- "criamos agentes de IA";
- "implantamos chatbot";
- "IA que vende por voce";
- "sem esforco";
- "sucesso garantido";
- "fe vai te enriquecer";
- "prosperidade garantida";
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
${config.creator.faithBoundary || config.editorial.prosperityBoundary}
Pode falar de carater, disciplina, humildade, decisao dificil, principios e longo prazo. Nunca prometa sucesso financeiro por fe. Nunca use religiao como isca de engajamento.

Regras para familia:
${config.creator.familyBoundary || 'Falar de familia como responsabilidade e bastidor, sem exposicao desnecessaria e sem usar familia como isca de engajamento.'}

Regras para Vamo:
- Todo conteudo relacionado a VAMO deve obedecer esta ordem: problema comercial percebido, causa real, custo invisivel, papel do processo, papel da IA/automacao/sistema como meio, resultado esperado.
- Comece por perda de venda, falta de previsibilidade, follow-up, CRM morto, lead parado, WhatsApp sem processo ou gestor sem visibilidade.
- Nao comece por IA, sistema ou automacao.
- IA deve aparecer como camada de inteligencia operacional.
- Diagnostico e CTA comercial aparecem principalmente em fundo de funil ou pilar oferta.
- ${config.editorial.noTutorialRule}

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
${editorialPlan.map((item, index) => `${index + 1}. pilar=${item.pillar}; funil=${item.funil}; intent=${item.content_intent}; tipo=${item.content_type}; eixo=${item.narrative_axis}; papel=${item.funnel_role}; consciencia=${item.awareness_level}; narrativa=${item.narrative}`).join('\n')}

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
- Cada conteudo precisa ter eixo narrativo, papel no funil, nivel de consciencia, tipo de vazamento, percepcao desejada, ponte para VAMO, direcao de gravacao, lista do que nao falar e resultado esperado.
- Cada conteudo precisa deixar claro qual dor, tensao, valor ou bastidor aborda, qual funcao cumpre no funil, qual percepcao deve criar no empresario e o que Gustavo deve evitar falar.
- Quando for VAMO, comece por perda de venda, falta de previsibilidade, follow-up, CRM morto, lead parado, WhatsApp sem processo ou gestor sem visibilidade. Nao comece por IA, sistema ou automacao.
- Quando for fe/prosperidade, conecte com responsabilidade, ordem, disciplina, prudencia, decisao ou carater. Nao force venda nem prometa enriquecimento.
- Quando for familia, conecte com responsabilidade, futuro e construcao. Nao exponha terceiros nem force CTA comercial.
- Quando for oferta, convide para diagnostico, reuniao ou Mapa de Vazamento de Vendas. Mostre que antes de ferramenta vem diagnostico.
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
      "content_intent": "atrair|autoridade|conexao|educar|quebrar_crenca|provar_metodo|vender|reativar|bastidor|aumentar_percepcao_de_risco|nomear_problema|preparar_demanda",
      "content_type": "camera_direta|bastidor|opiniao_forte|historia_pessoal|analise_de_operacao|framework|meme_com_contexto|carrossel|story|prova_de_construcao|convite_diagnostico|narrativa_de_funil|alerta_comercial|reflexao_empresarial",
      "narrative_axis": "vazamento_comercial|processo_antes_da_ia|ia_como_meio|previsibilidade_comercial|gestor_sem_visibilidade|whatsapp_sem_processo|follow_up_falho|crm_morto|bastidor_de_construcao|fe_valores_decisao|prosperidade_com_responsabilidade|familia_responsabilidade|diagnostico_vamo",
      "funnel_role": "atrair_dor_latente|nomear_problema|quebrar_crenca|aumentar_percepcao_de_risco|provar_raciocinio|criar_conexao|preparar_demanda|converter_para_diagnostico",
      "awareness_level": "inconsciente_do_problema|sente_sintoma|reconhece_gargalo|busca_solucao|pronto_para_conversar",
      "sales_leak_type": "lead_sem_resposta|follow_up_lento|crm_sem_uso|gestor_sem_visao|time_sem_padrao|lead_desqualificado|proposta_sem_acompanhamento|pos_venda_inexistente|nenhum",
      "desired_perception": "O que o empresario deve pensar depois do conteudo",
      "offer_bridge": "Ponte natural para a VAMO, sem parecer venda forcada",
      "recording_direction": "Como gravar, tom, ritmo e contexto",
      "do_not_say": ["frase proibida 1", "frase proibida 2"],
      "expected_result": "alcance_qualificado|comentarios_de_identificacao|salvamentos|respostas_no_direct|cliques_no_diagnostico|reforco_de_autoridade",
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
    { pillar: 'vamo', funil: 'topo', content_intent: 'nomear_problema', content_type: 'alerta_comercial', narrative_axis: 'vazamento_comercial', funnel_role: 'atrair_dor_latente', awareness_level: 'sente_sintoma', narrative: 'dor percebida: venda vazando sem o gestor notar' },
    { pillar: 'vamo', funil: 'meio', content_intent: 'quebrar_crenca', content_type: 'opiniao_forte', narrative_axis: 'processo_antes_da_ia', funnel_role: 'quebrar_crenca', awareness_level: 'reconhece_gargalo', narrative: 'IA sem processo acelera a bagunca' },
    { pillar: 'vamo', funil: 'meio', content_intent: 'aumentar_percepcao_de_risco', content_type: 'analise_de_operacao', narrative_axis: 'gestor_sem_visibilidade', funnel_role: 'aumentar_percepcao_de_risco', awareness_level: 'reconhece_gargalo', narrative: 'gestor nao sabe onde agir antes do mes acabar' },
    { pillar: 'vamo', funil: 'meio', content_intent: 'educar', content_type: 'framework', narrative_axis: 'whatsapp_sem_processo', funnel_role: 'provar_raciocinio', awareness_level: 'busca_solucao', narrative: 'WhatsApp precisa de contexto, tempo certo e proximo passo' },
    { pillar: 'vamo', funil: 'meio', content_intent: 'provar_metodo', content_type: 'prova_de_construcao', narrative_axis: 'ia_como_meio', funnel_role: 'preparar_demanda', awareness_level: 'busca_solucao', narrative: 'IA como inteligencia operacional, nao como promessa magica' },
    { pillar: 'empreendedorismo', funil: 'topo', content_intent: 'bastidor', content_type: 'bastidor', narrative_axis: 'bastidor_de_construcao', funnel_role: 'criar_conexao', awareness_level: 'inconsciente_do_problema', narrative: 'construcao real da VAMO e vida de empresario' },
    { pillar: 'empreendedorismo', funil: 'meio', content_intent: 'autoridade', content_type: 'historia_pessoal', narrative_axis: 'bastidor_de_construcao', funnel_role: 'provar_raciocinio', awareness_level: 'sente_sintoma', narrative: 'aprendizado pratico de fundador' },
    { pillar: 'fe', funil: 'topo', content_intent: 'conexao', content_type: 'reflexao_empresarial', narrative_axis: 'prosperidade_com_responsabilidade', funnel_role: 'criar_conexao', awareness_level: 'inconsciente_do_problema', narrative: 'fe, prosperidade, ordem e responsabilidade' },
    { pillar: 'familia', funil: 'topo', content_intent: 'conexao', content_type: 'historia_pessoal', narrative_axis: 'familia_responsabilidade', funnel_role: 'criar_conexao', awareness_level: 'inconsciente_do_problema', narrative: 'familia como responsabilidade por tras da construcao' },
    { pillar: 'oferta', funil: 'fundo', content_intent: 'vender', content_type: 'convite_diagnostico', narrative_axis: 'diagnostico_vamo', funnel_role: 'converter_para_diagnostico', awareness_level: 'pronto_para_conversar', narrative: 'convite para Mapa de Vazamento de Vendas' }
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
    const hasPlan = Boolean(plan.pillar || plan.funil || plan.content_intent || plan.content_type);
    const funil = normalizeFunil(hasPlan ? plan.funil : item.funil);
    const pillar = normalizePillar(hasPlan ? plan.pillar : (item.pillar || item.pilar));
    const contentIntent = normalizeEnum(
      hasPlan ? plan.content_intent : (item.content_intent || item.intent),
      ALLOWED_INTENTS,
      plan.content_intent || 'autoridade'
    );
    const contentType = normalizeEnum(
      hasPlan ? plan.content_type : (item.content_type || item.formato),
      ALLOWED_TYPES,
      plan.content_type || 'camera_direta'
    );
    const narrativeAxis = normalizeNarrativeAxis(item.narrative_axis, pillar, plan);
    const funnelRole = normalizeFunnelRole(item.funnel_role, contentIntent, funil, pillar, plan);
    const awarenessLevel = normalizeAwarenessLevel(item.awareness_level || plan.awareness_level, funil, pillar);
    const expectedResult = normalizeExpectedResult(item.expected_result, funil, pillar, contentIntent);
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
      narrative_axis: narrativeAxis,
      funnel_role: funnelRole,
      awareness_level: awarenessLevel,
      sales_leak_type: normalizeSalesLeakType(item.sales_leak_type, pillar, narrativeAxis),
      desired_perception: item.desired_perception || desiredPerceptionFor({ pillar, funil, narrativeAxis }),
      offer_bridge: item.offer_bridge || offerBridgeFor({ pillar, funil, narrativeAxis }),
      recording_direction: item.recording_direction || recordingDirectionFor({ pillar, contentType, narrativeAxis }),
      do_not_say: Array.isArray(item.do_not_say) && item.do_not_say.length ? item.do_not_say : defaultDoNotSayFor({ pillar, narrativeAxis }),
      expected_result: expectedResult,
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

function normalizeNarrativeAxis(value, pillar, plan = {}) {
  const text = String(value || plan.narrative_axis || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (ALLOWED_NARRATIVE_AXES.includes(text)) return text;
  if (pillar === 'fe') return 'fe_valores_decisao';
  if (pillar === 'familia') return 'familia_responsabilidade';
  if (pillar === 'oferta') return 'diagnostico_vamo';
  if (pillar === 'empreendedorismo') return 'bastidor_de_construcao';
  return 'vazamento_comercial';
}

function normalizeFunnelRole(value, intent, funil, pillar, plan = {}) {
  const text = String(value || plan.funnel_role || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (ALLOWED_FUNNEL_ROLES.includes(text)) return text;
  if (funil === 'fundo' || pillar === 'oferta') return 'converter_para_diagnostico';
  if (intent === 'quebrar_crenca') return 'quebrar_crenca';
  if (intent === 'aumentar_percepcao_de_risco') return 'aumentar_percepcao_de_risco';
  if (intent === 'nomear_problema') return 'nomear_problema';
  if (intent === 'conexao' || pillar === 'fe' || pillar === 'familia') return 'criar_conexao';
  if (funil === 'meio') return 'preparar_demanda';
  return 'atrair_dor_latente';
}

function normalizeAwarenessLevel(value, funil, pillar) {
  const text = String(value || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (ALLOWED_AWARENESS_LEVELS.includes(text)) return text;
  if (funil === 'fundo' || pillar === 'oferta') return 'pronto_para_conversar';
  if (funil === 'meio') return 'reconhece_gargalo';
  return 'sente_sintoma';
}

function normalizeExpectedResult(value, funil, pillar, intent) {
  const text = String(value || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (ALLOWED_EXPECTED_RESULTS.includes(text)) return text;
  if (funil === 'fundo' || pillar === 'oferta') return 'cliques_no_diagnostico';
  if (pillar === 'fe' || pillar === 'familia' || intent === 'conexao') return 'comentarios_de_identificacao';
  if (funil === 'meio') return 'salvamentos';
  return 'alcance_qualificado';
}

function normalizeSalesLeakType(value, pillar, narrativeAxis) {
  const allowed = ['lead_sem_resposta', 'follow_up_lento', 'crm_sem_uso', 'gestor_sem_visao', 'time_sem_padrao', 'lead_desqualificado', 'proposta_sem_acompanhamento', 'pos_venda_inexistente', 'nenhum'];
  const text = String(value || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (allowed.includes(text)) return text;
  if (!['vamo', 'oferta'].includes(pillar)) return 'nenhum';
  if (narrativeAxis === 'follow_up_falho') return 'follow_up_lento';
  if (narrativeAxis === 'crm_morto') return 'crm_sem_uso';
  if (narrativeAxis === 'gestor_sem_visibilidade') return 'gestor_sem_visao';
  if (narrativeAxis === 'whatsapp_sem_processo') return 'lead_sem_resposta';
  return 'time_sem_padrao';
}

function normalizeCaptureMode(value) {
  return normalizeEnum(value, ['auto', 'narrativa_vamo', 'funil_contemporaneo', 'fe_prosperidade', 'bastidor_empresario', 'oferta_diagnostico'], 'auto');
}

function normalizeDesired(value, allowed) {
  return normalizeEnum(value || 'auto', allowed, 'auto');
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

function desiredPerceptionFor({ pillar, funil, narrativeAxis }) {
  if (pillar === 'fe') return 'Prosperidade exige ordem, responsabilidade e decisao, nao promessa magica.';
  if (pillar === 'familia') return 'Construir negocio tambem e assumir responsabilidade pelo futuro sem expor a vida pessoal.';
  if (pillar === 'empreendedorismo') return 'Gustavo pensa como empresario e executa como operador, sem romantizar a construcao.';
  if (pillar === 'oferta' || funil === 'fundo') return 'Antes de comprar ferramenta ou colocar mais trafego, preciso entender onde minha venda esta vazando.';
  if (narrativeAxis === 'processo_antes_da_ia') return 'Talvez minha empresa nao precise de mais automacao agora. Talvez precise de processo antes de automatizar.';
  return 'Minha empresa talvez nao precise de mais lead agora. Talvez precise parar de perder os leads que ja chegam.';
}

function offerBridgeFor({ pillar, funil, narrativeAxis }) {
  if (pillar === 'fe' || pillar === 'familia') return 'A conexao com a VAMO fica no principio: responsabilidade, ordem e execucao antes de promessas.';
  if (pillar === 'empreendedorismo') return 'Esse bastidor mostra a forma como a VAMO e construida: diagnostico, processo, tecnologia e acompanhamento.';
  if (pillar === 'oferta' || funil === 'fundo') return 'Esse e o ponto de partida do Mapa de Vazamento de Vendas da VAMO.';
  if (narrativeAxis === 'ia_como_meio') return 'A VAMO usa IA como camada de inteligencia depois de entender o gargalo comercial.';
  return 'Esse e exatamente o tipo de vazamento que a VAMO identifica antes de falar em ferramenta.';
}

function recordingDirectionFor({ pillar, contentType, narrativeAxis }) {
  if (pillar === 'fe') return 'Gravar em camera direta, tom calmo e firme, conectando fe com responsabilidade pratica.';
  if (pillar === 'familia') return 'Gravar em tom humano e contido, sem expor terceiros nem transformar intimidade em oferta.';
  if (contentType === 'carrossel' || contentType === 'framework') return 'Organizar em pontos curtos, com exemplos de operacao comercial e fechamento claro.';
  if (narrativeAxis === 'processo_antes_da_ia') return 'Gravar em camera direta, tom firme, como quem alerta um empresario que confunde ferramenta com gestao.';
  return 'Gravar em camera direta, tom calmo e seguro, com foco no problema comercial antes da tecnologia.';
}

function defaultDoNotSayFor({ pillar, narrativeAxis }) {
  if (pillar === 'fe') return ['fe vai te enriquecer', 'prosperidade garantida', 'mentalidade de sucesso'];
  if (pillar === 'familia') return ['use sua familia para vender', 'compre por causa da minha historia', 'drama pessoal'];
  if (narrativeAxis === 'ia_como_meio' || narrativeAxis === 'processo_antes_da_ia') return ['criamos agentes de IA', 'automatize tudo', 'isso e simples de fazer'];
  return ['bot de vendas', 'sistema simples', 'vender mais sem esforco'];
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
    'narrative_axis',
    'funnel_role',
    'awareness_level',
    'desired_perception',
    'offer_bridge',
    'recording_direction',
    'expected_result',
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
    || !ALLOWED_NARRATIVE_AXES.includes(item.narrative_axis)
    || !ALLOWED_FUNNEL_ROLES.includes(item.funnel_role)
    || !ALLOWED_AWARENESS_LEVELS.includes(item.awareness_level)
    || !ALLOWED_EXPECTED_RESULTS.includes(item.expected_result)
  ));
  if (invalidEnum) {
    throw new Error('A OpenAI retornou campos estrategicos fora do contrato. Nada foi salvo.');
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
    /mentalidade de sucesso/i,
    /criamos agentes de ia/i,
    /implantamos chatbot/i,
    /automatize tudo/i,
    /sistema simples/i,
    /ferramenta simples/i,
    /bot de vendas/i,
    /ia que vende por voce/i,
    /sucesso financeiro garantido/i,
    /fe vai te enriquecer/i,
    /prosperidade garantida/i
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

  const badVamoOpening = contents.find(item => {
    if (item.pillar !== 'vamo') return false;
    return /^(ia|inteligencia artificial|bot|sistema|automacao|dashboard|crm)\b/i.test(String(item.gancho || '').trim());
  });
  if (badVamoOpening) {
    throw new Error('Conteudo de VAMO comecou pela ferramenta. Deve comecar pelo vazamento comercial. Nada foi salvo.');
  }

  const tutorialLeak = contents.find(item => {
    const text = [item.gancho, item.roteiro_falado, item.legenda, item.estrutura?.join(' ')].join(' ');
    return /passo a passo para criar|como configurar|copie esse fluxo|prompt pronto para|monte seu bot/i.test(text);
  });
  if (tutorialLeak) {
    throw new Error('Conteudo ensinou demais a construir sozinho. Deve vender a complexidade estrategica, nao entregar tutorial.');
  }

  // The normalizer applies the editorial plan before validation, so distribution
  // mismatches from the model should be corrected instead of blocking generation.
}
