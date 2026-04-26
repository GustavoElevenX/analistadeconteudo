import OpenAI from 'openai';
import { config } from './config.js';

const client = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

export async function generateDailyContents({ date, sources = [], patterns = null, limit = config.dailyContentLimit }) {
  ensureOpenAIClient();

  const contents = [];
  const batchSize = 5;
  const funilPlan = buildFunilPlan(limit);

  while (contents.length < limit) {
    const remaining = limit - contents.length;
    const currentBatchSize = Math.min(batchSize, remaining);
    const currentFunilPlan = funilPlan.slice(contents.length, contents.length + currentBatchSize);
    const batch = await generateContentBatch({
      date,
      sources,
      patterns,
      limit: currentBatchSize,
      batchNumber: Math.floor(contents.length / batchSize) + 1,
      existingHooks: contents.map(item => item.gancho),
      funilPlan: currentFunilPlan
    });
    contents.push(...batch);
  }

  validateContents(contents, limit, funilPlan);
  return contents;
}

async function generateContentBatch({ date, sources, patterns, limit, batchNumber, existingHooks, funilPlan }) {
  const basePrompt = buildDailyPrompt({ date, sources, patterns, limit, batchNumber, existingHooks, funilPlan });
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const prompt = attempt === 1
      ? basePrompt
      : `${basePrompt}

ATENCAO: sua resposta anterior foi rejeitada pelo validador com este motivo:
${lastError.message}

Corrija agora. Retorne exatamente ${limit} itens, sem placeholders, sem topicos genericos e sem texto fora do JSON.`;

    const raw = await callJson(prompt);
    const parsed = parseJson(raw);
    if (!Array.isArray(parsed.conteudos)) {
      lastError = new Error('A OpenAI nao retornou o JSON esperado em "conteudos". Nada foi salvo.');
      continue;
    }

    const contents = normalizeGeneratedContents(parsed.conteudos.slice(0, limit), funilPlan);
    try {
      validateContents(contents, limit, funilPlan);
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
O criador teve o seguinte insight ou situacao hoje:
"${insightText}"

Gere 3 angulos de conteudo, um para cada nivel do funil: topo, meio e fundo.
Cada angulo deve seguir o contrato operacional da VAMO: objetivo, formato, gancho, roteiro falado, momento de tela, interpretacao, CTA, legenda e titulo de Reels.

Responda apenas em JSON no formato:
{"insights":[{"objetivo_post":"Atrair seguidores","funil":"topo","formato_recomendado":"Camera direta","gancho":"...","roteiro_falado":"...","momento_mostrar_tela":"","interpretacao":"...","estrutura":["..."],"cta_tipo":"comentario","cta_texto":"...","legenda":"...","titulo_reels":"...","porque_gera_leads":"..."}]}
`);
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed.insights)) {
    throw new Error('A OpenAI nao retornou o JSON esperado em "insights".');
  }
  return parsed;
}

export async function analyzePerformanceWithGpt(summary) {
  ensureOpenAIClient();
  const raw = await callJson(`
Analise as metricas abaixo e explique em portugues, de forma direta, o que esta funcionando, o que evitar e como ajustar a geracao de conteudo.

Priorize o que gera leads, cliques no diagnostico e DMs. Reduza conteudos que so geram vaidade.
Responda especificamente:
- Qual formato gera mais lead
- Qual tipo de gancho funciona melhor
- Qual tipo de conteudo converte mais
- Que ajuste deve entrar na proxima geracao

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
Voce e o analista de conteudo virtual de ${config.creator.name}.
Nicho: gestao comercial, lideranca, vendas B2B e fe catolica nos negocios.
Produto: ${config.creator.product}.
Bio/contexto: ${config.creator.bio}
Tom: autoridade sem arrogancia, direto, provocativo e humano.
${casesRule}

Missao do sistema: transformar conteudo em maquina previsivel de geracao de leads para a VAMO.
Prioridade estrategica: 70% geracao de leads e 30% autoridade com decisores.
Todo conteudo precisa responder: "esse post leva alguem mais perto de virar lead?" Se nao levar, ajuste antes de responder.

Use pilares: vendas, empreendedorismo, fe, vida, mas conecte sempre com comercial, gestao, previsibilidade, impacto financeiro e falta de controle.
Evite repetir formula de gancho no mesmo lote.

Padrao de qualidade obrigatorio:
- Escreva como estrategista senior de conteudo B2B, nao como lista escolar.
- Seja especifico para diretor comercial, gestor de vendas ou empresario PME.
- Nunca gere conteudo generico. Conecte dor, impacto financeiro e falta de controle.
- Evite as palavras "ajudo", "dicas" e "vender mais". Prefira estrutura, previsibilidade, controle e clareza.
- Conteudos nao podem parecer venda, mas devem levar o decisor a perceber que o proximo passo e o diagnostico.
- Nunca use placeholders ou topicos genericos como "Competencia 1", "Erro 1", "Beneficios", "Importancia", "Como implementar", "Desafios e solucoes".
- Cada estrutura deve ter tres pontos concretos, com diagnostico, tensao comercial e acao pratica.
- O gancho deve expor uma dor, contradicao ou criterio claro de gestao comercial.
- Nao abra ganchos com perguntas amplas do tipo "voce esta pronto", "esta por dentro", "sua equipe esta preparada" ou "seu CRM esta pronto".
- Prefira ganchos com situacao concreta: reuniao de forecast, pipeline inflado, vendedor sem proximo passo, CRM preenchido depois da call, gestor cobrando meta sem rotina.
- Conteudos de fundo devem conectar a dor ao diagnostico gratuito, sem prometer resultado inventado.
`;
}

function buildDailyPrompt({ date, sources, patterns, limit, batchNumber = 1, existingHooks = [], funilPlan = [] }) {
  const freshnessWindow = sources.find(source => source.freshness_window_days)?.freshness_window_days || null;
  const sourceText = sources.slice(0, 20).map((s, index) => {
    return `${index + 1}. [${s.platform}${s.publishedAt ? ` | ${s.publishedAt}` : ''}] ${s.headline} - ${s.summary || ''} ${s.url || ''}`;
  }).join('\n');
  const salesMinimum = Math.max(3, Math.ceil(limit * 0.7));
  const sequenceName = pickSeriesName(date, batchNumber);

  return `
Data: ${date}
Gere exatamente ${limit} conteudos para Instagram em JSON valido.
Este e o lote ${batchNumber}. Nao repita nenhum gancho ja usado.

Ganchos ja usados em lotes anteriores:
${existingHooks.length ? existingHooks.map(hook => `- ${hook}`).join('\n') : '- nenhum'}

Distribuicao obrigatoria de funil neste lote, nesta ordem:
${funilPlan.map((funil, index) => `${index + 1}. ${funil}`).join('\n')}

A cada 10 conteudos do dia, a distribuicao precisa fechar em 4 topo, 3 meio e 3 fundo.

Sequencia narrativa do lote:
- Serie: "${sequenceName}"
- Os posts precisam parecer partes de uma linha de raciocinio, nao ideias soltas.
- Use a progressao: dor/provocacao (topo), explicacao/metricas (meio), diagnostico/custo oculto (fundo).

Distribuicao de pilares:
- vendas: 70%
- empreendedorismo: 20%
- fe: 5%
- vida: 5%

Use estes padroes atuais quando existirem:
${JSON.stringify(patterns || {}, null, 2)}

Fontes coletadas hoje:
${sourceText || 'Sem fontes externas. Use conhecimento atemporal.'}

Janela de relevancia das fontes: ${freshnessWindow ? `${freshnessWindow} dia(s)` : 'sem data confiavel; use somente se o tema for atemporal e relevante'}.
Prioridade obrigatoria: fontes de hoje > ultimos 3 dias > ultimos 7 dias > atemporal.

Regras de qualidade:
- Pelo menos ${salesMinimum} conteudos deste lote devem falar diretamente de gestao comercial, vendas B2B, lideranca comercial, CRM, follow-up, funil, forecast, meta, pipeline, conversao ou rotina de diretor comercial.
- Use noticias apenas quando elas realmente servirem para o nicho. Se uma fonte for fraca para vendas B2B, ignore.
- Noticias e tendencias devem sempre virar leitura de comercial, gestao e previsibilidade.
- Evite temas amplos demais como "voce esta preparado para 2026", "sua marca esta pronta para crescer", "voce faz pausas suficientes".
- Nao gere conteudo sobre mercado imobiliario, collabs, pausas no trabalho ou governanca generica, a menos que conecte explicitamente com processo comercial B2B.
- Nao use noticias de turismo, imobiliario, campanhas promocionais ou nomeacoes executivas como fonte de conteudo.
- Evite perguntas vagas. O gancho deve parecer uma frase que um diretor comercial reconheceria na rotina.
- O objetivo do post deve ser um destes: Atrair seguidores, Gerar autoridade, Gerar leads, Gerar comentarios, Gerar DM.
- O formato recomendado deve ser um destes: Camera direta, Tela da plataforma, Misto (camera + tela), Bastidor, Carrossel.
- TOPO usa CTA de seguir, refletir ou comentar. MEIO usa CTA de salvar ou compartilhar. FUNDO usa link na bio do diagnostico ou DM.
- Em fundo, use CTA como: "Se voce nao consegue ver isso no seu comercial, tem um diagnostico gratuito no link da bio".
- O roteiro falado deve ser natural, com pausas, sem parecer IA.
- Momento de mostrar tela deve dizer exatamente onde entra dashboard, pipeline ou metrica. Se nao se aplica, deixe vazio.
- Cada item precisa ter "source_headline" e "source_url" quando usar noticia; se for atemporal, deixe vazio.
- Se usar fonte com mais de 3 dias, transforme em principio atemporal e nao trate como novidade.
- Retorne exatamente ${limit} itens. Nem mais, nem menos.

Formato exato:
{
  "conteudos": [
    {
      "objetivo_post": "Atrair seguidores|Gerar autoridade|Gerar leads|Gerar comentarios|Gerar DM",
      "funil": "topo|meio|fundo",
      "pillar": "vendas|empreendedorismo|fe|vida",
      "sequencia_nome": "${sequenceName}",
      "sequencia_parte": 1,
      "tema": "Resumo em 6-8 palavras",
      "formato_recomendado": "Camera direta|Tela da plataforma|Misto (camera + tela)|Bastidor|Carrossel",
      "gancho": "Primeiros 5-10 segundos",
      "roteiro_falado": "Roteiro natural para falar no video",
      "momento_mostrar_tela": "Onde mostrar dashboard, pipeline ou metrica, ou vazio",
      "interpretacao": "O que isso significa para a gestao comercial",
      "estrutura": ["ponto 1", "ponto 2", "ponto 3"],
      "cta_tipo": "link|dm|comentario|salvar|compartilhar|seguir|refletir",
      "cta_texto": "Texto exato do CTA",
      "legenda": "Resumo do video com reforco da tese",
      "titulo_reels": "Titulo curto e direto",
      "hashtags": ["#vendas", "#gestaocomercial"],
      "porque_gera_leads": "Explicacao estrategica",
      "source_headline": "Fonte usada ou vazio",
      "source_url": "URL ou vazio"
    }
  ]
}
`;
}

function buildFunilPlan(limit) {
  const base = ['topo', 'topo', 'topo', 'topo', 'meio', 'meio', 'meio', 'fundo', 'fundo', 'fundo'];
  return Array.from({ length: limit }, (_, index) => base[index % base.length]);
}

function pickSeriesName(date, batchNumber) {
  const names = [
    'Empresa que fatura mas nao cresce',
    'Pipeline cheio, caixa imprevisivel',
    'Comercial ocupado sem controle',
    'Meta cobrada sem sistema'
  ];
  const seed = String(date || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), batchNumber);
  return names[seed % names.length];
}

function normalizeGeneratedContents(contents, funilPlan = []) {
  return contents.map((item, index) => {
    const funil = funilPlan[index] || normalizeFunil(item.funil);
    const estrutura = Array.isArray(item.estrutura) && item.estrutura.length
      ? item.estrutura
      : [
          item.interpretacao || 'Mostre o sintoma comercial com clareza.',
          'Conecte a dor com impacto financeiro e falta de controle.',
          'Feche com o proximo passo natural para diagnosticar o problema.'
        ];

    return {
      ...item,
      funil,
      objetivo_post: item.objetivo_post || objectiveForFunil(funil),
      pillar: item.pillar || 'vendas',
      sequencia_parte: Number(item.sequencia_parte || index + 1),
      formato_recomendado: item.formato_recomendado || formatForFunil(funil),
      tema: item.tema || item.titulo_reels || 'Diagnostico comercial',
      gancho: item.gancho || estrutura[0] || 'Seu comercial pode estar ocupado e ainda assim sem previsibilidade.',
      roteiro_falado: item.roteiro_falado || estrutura.join(' '),
      momento_mostrar_tela: item.momento_mostrar_tela || '',
      interpretacao: item.interpretacao || item.porque_gera_leads || estrutura[1] || 'Isso mostra falta de controle sobre o processo comercial.',
      estrutura,
      cta_tipo: item.cta_tipo || ctaTypeForFunil(funil),
      cta_texto: item.cta_texto || ctaTextForFunil(funil),
      legenda: item.legenda || `${item.gancho || estrutura[0]} ${item.porque_gera_leads || 'Conteudo conectado a previsibilidade comercial e diagnostico.'}`,
      titulo_reels: item.titulo_reels || String(item.tema || 'Comercial sem controle').slice(0, 45),
      hashtags: Array.isArray(item.hashtags) && item.hashtags.length ? item.hashtags : ['#gestaocomercial', '#vendasb2b'],
      porque_gera_leads: item.porque_gera_leads || 'Conecta a dor do decisor com a necessidade de diagnostico comercial.'
    };
  });
}

function normalizeFunil(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('fundo') || text.includes('bofu')) return 'fundo';
  if (text.includes('meio') || text.includes('mofu')) return 'meio';
  return 'topo';
}

function objectiveForFunil(funil) {
  return { topo: 'Atrair seguidores', meio: 'Gerar autoridade', fundo: 'Gerar leads' }[funil] || 'Gerar leads';
}

function formatForFunil(funil) {
  return { topo: 'Camera direta', meio: 'Misto (camera + tela)', fundo: 'Tela da plataforma' }[funil] || 'Camera direta';
}

function ctaTypeForFunil(funil) {
  return { topo: 'comentario', meio: 'salvar', fundo: 'link' }[funil] || 'comentario';
}

function ctaTextForFunil(funil) {
  if (funil === 'fundo') return 'Se voce nao consegue ver isso no seu comercial, tem um diagnostico gratuito no link da bio.';
  if (funil === 'meio') return 'Salve para revisar antes da proxima reuniao comercial.';
  return 'Comente se isso aparece na sua rotina comercial.';
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

function validateContents(contents, expectedLimit, funilPlan = []) {
  if (contents.length !== expectedLimit) {
    throw new Error(`A OpenAI retornou ${contents.length} conteudos, mas o esperado era ${expectedLimit}. Nada foi salvo.`);
  }

  const requiredFields = [
    'objetivo_post',
    'funil',
    'formato_recomendado',
    'gancho',
    'roteiro_falado',
    'interpretacao',
    'cta_texto',
    'legenda',
    'titulo_reels',
    'porque_gera_leads'
  ];

  const missing = contents.find(item => requiredFields.some(field => !String(item[field] || '').trim()));
  if (missing) {
    throw new Error('A OpenAI retornou conteudo sem a estrutura obrigatoria completa. Nada foi salvo.');
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
    /vender mais/i
  ];

  const weakItems = contents.filter(item => {
    const text = [
      item.tema,
      item.gancho,
      item.roteiro_falado,
      item.legenda,
      ...(Array.isArray(item.estrutura) ? item.estrutura : [])
    ].join(' ');
    return forbiddenPatterns.some(pattern => pattern.test(text));
  });

  if (weakItems.length) {
    throw new Error('A OpenAI retornou conteudo generico ou com placeholders. Nada foi salvo; tente gerar novamente.');
  }
}
