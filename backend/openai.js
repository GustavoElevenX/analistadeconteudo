import OpenAI from 'openai';
import { config } from './config.js';

const client = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

export async function generateDailyContents({ date, sources = [], patterns = null, limit = config.dailyContentLimit }) {
  ensureOpenAIClient();

  const contents = [];
  const batchSize = 5;

  while (contents.length < limit) {
    const remaining = limit - contents.length;
    const currentBatchSize = Math.min(batchSize, remaining);
    const batch = await generateContentBatch({
      date,
      sources,
      patterns,
      limit: currentBatchSize,
      batchNumber: Math.floor(contents.length / batchSize) + 1,
      existingHooks: contents.map(item => item.gancho)
    });
    contents.push(...batch);
  }

  validateContents(contents, limit);
  return contents;
}

async function generateContentBatch({ date, sources, patterns, limit, batchNumber, existingHooks }) {
  const basePrompt = buildDailyPrompt({ date, sources, patterns, limit, batchNumber, existingHooks });
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

    const contents = parsed.conteudos.slice(0, limit);
    try {
      validateContents(contents, limit);
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
Responda apenas em JSON no formato:
{"insights":[{"funil":"topo","gancho":"...","estrutura":["..."],"cta_tipo":"comentario","cta_texto":"..."}]}
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
Classifique cada conteudo automaticamente no funil: topo, meio ou fundo, e explique por que gera leads.
Use pilares: vendas, empreendedorismo, fe, vida.
Evite repetir formula de gancho no mesmo lote.

Padrao de qualidade obrigatorio:
- Escreva como estrategista senior de conteudo B2B, nao como lista escolar.
- Seja especifico para diretor comercial, gestor de vendas ou empresario PME.
- Nunca use placeholders ou topicos genericos como "Competencia 1", "Erro 1", "Beneficios", "Importancia", "Como implementar", "Desafios e solucoes".
- Cada estrutura deve ter tres pontos concretos, com diagnostico, tensao comercial e acao pratica.
- O gancho deve expor uma dor, contradicao ou criterio claro de gestao comercial.
- Nao abra ganchos com perguntas amplas do tipo "voce esta pronto", "esta por dentro", "sua equipe esta preparada" ou "seu CRM esta pronto".
- Prefira ganchos com situacao concreta: reuniao de forecast, pipeline inflado, vendedor sem proximo passo, CRM preenchido depois da call, gestor cobrando meta sem rotina.
- Conteudos de fundo devem conectar a dor ao diagnostico gratuito, sem prometer resultado inventado.
`;
}

function buildDailyPrompt({ date, sources, patterns, limit, batchNumber = 1, existingHooks = [] }) {
  const freshnessWindow = sources.find(source => source.freshness_window_days)?.freshness_window_days || null;
  const sourceText = sources.slice(0, 20).map((s, index) => {
    return `${index + 1}. [${s.platform}${s.publishedAt ? ` | ${s.publishedAt}` : ''}] ${s.headline} - ${s.summary || ''} ${s.url || ''}`;
  }).join('\n');
  const salesMinimum = Math.max(3, Math.ceil(limit * 0.6));

  return `
Data: ${date}
Gere exatamente ${limit} conteudos para Instagram em JSON valido.
Este e o lote ${batchNumber}. Nao repita nenhum gancho ja usado.

Ganchos ja usados em lotes anteriores:
${existingHooks.length ? existingHooks.map(hook => `- ${hook}`).join('\n') : '- nenhum'}

Distribuicao base:
- vendas: 55%
- empreendedorismo: 25%
- fe: 15%
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
- Evite temas amplos demais como "voce esta preparado para 2026", "sua marca esta pronta para crescer", "voce faz pausas suficientes".
- Nao gere conteudo sobre mercado imobiliario, collabs, pausas no trabalho ou governanca generica, a menos que conecte explicitamente com processo comercial B2B.
- Nao use noticias de turismo, imobiliario, campanhas promocionais ou nomeacoes executivas como fonte de conteudo.
- Evite perguntas vagas. O gancho deve parecer uma frase que um diretor comercial reconheceria na rotina.
- Cada item precisa ter "source_headline" e "source_url" quando usar noticia; se for atemporal, deixe vazio.
- Se usar fonte com mais de 3 dias, transforme em principio atemporal e nao trate como novidade.
- Retorne exatamente ${limit} itens. Nem mais, nem menos.

Formato exato:
{
  "conteudos": [
    {
      "funil": "topo|meio|fundo",
      "pillar": "vendas|empreendedorismo|fe|vida",
      "tema": "Resumo em 6-8 palavras",
      "gancho": "Primeiros 5-10 segundos",
      "estrutura": ["ponto 1", "ponto 2", "ponto 3"],
      "cta_tipo": "link|comentario",
      "cta_texto": "Texto exato do CTA",
      "hashtags": ["#vendas", "#gestaocomercial"],
      "porque_gera_leads": "Explicacao estrategica",
      "source_headline": "Fonte usada ou vazio",
      "source_url": "URL ou vazio"
    }
  ]
}
`;
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

function validateContents(contents, expectedLimit) {
  if (contents.length !== expectedLimit) {
    throw new Error(`A OpenAI retornou ${contents.length} conteudos, mas o esperado era ${expectedLimit}. Nada foi salvo.`);
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
    /pausas suficientes/i
  ];

  const weakItems = contents.filter(item => {
    const text = [
      item.tema,
      item.gancho,
      ...(Array.isArray(item.estrutura) ? item.estrutura : [])
    ].join(' ');
    return forbiddenPatterns.some(pattern => pattern.test(text));
  });

  if (weakItems.length) {
    throw new Error('A OpenAI retornou conteudo generico ou com placeholders. Nada foi salvo; tente gerar novamente.');
  }
}
