# CONTEXT.md — Central de Autoridade e Demanda
## Especificação Completa do Sistema

---

## Atualizacao estrategica — Gustavo Garcia / Vamo

O sistema deixa de ser apenas um gerador de ideias de gestao comercial e passa a operar como editor-chefe da marca pessoal de Gustavo Garcia, cofundador da Vamo.

A Vamo deve ser posicionada como solucao de performance operacional comercial que une diagnostico, processos, sistemas e implementacao. Ela diagnostica gargalos em vendas, atendimento e pos-venda, redesenha processos, cria ou adapta sistemas de execucao, implementa na rotina do cliente, treina a equipe e otimiza continuamente.

A Vamo nunca deve parecer software isolado, CRM tradicional, agencia de marketing, software house generica ou consultoria que so entrega diagnostico.

Tese central: empresas nao perdem resultado apenas por falta de demanda. Muitas perdem vendas, atendimento e retencao por falhas invisiveis no processo comercial: lead sem retorno, follow-up fraco, ausencia de rotina, atendimento sem padrao, pos-venda inexistente e gestor sem visibilidade.

Pilares editoriais novos:

| Pilar | Peso inicial | Funcao |
|---|---:|---|
| Vamo / Performance Comercial | 45% | Atrair empresarios com dores reais de vendas, atendimento, pos-venda, processo, CRM, follow-up e previsibilidade. |
| Empreendedorismo Real | 20% | Mostrar construcao do zero, decisoes, bastidores, dificuldade, visao de negocio e aprendizado pratico. |
| Fe, Valores e Decisao | 15% | Conectar fe com responsabilidade, carater, tomada de decisao, disciplina e proposito. |
| Familia e Responsabilidade | 10% | Mostrar o peso real de construir uma empresa tendo familia, futuro e obrigacoes. |
| Oferta / Diagnostico | 10% | Convidar para diagnostico, conversa, analise ou entrada no funil da Vamo. |

Todo conteudo gerado deve incluir `content_intent`, `content_type`, `tese`, `conexao_com_vamo`, `risco_generico`, `score_autoridade`, `score_demanda`, `score_conexao`, `score_autenticidade` e `score_vamo_alignment`.

O recurso "Ideia da cabeca" transforma pensamento bruto em conteudo publicavel, com versoes para camera direta, story, carrossel, post mais agressivo, versao pessoal e sugestao de CTA.

Conteudos de fe, familia e bastidor sao permitidos quando tratados com maturidade. Eles nao devem ser avaliados apenas por lead, mas tambem por comentarios, salvamentos, compartilhamentos, respostas, crescimento de seguidores e fortalecimento de autoridade.

---

## 1. VISÃO GERAL DO PROJETO

Este sistema é um **analista de conteúdo virtual com inteligência de performance** para um criador de conteúdo no Instagram focado em gestão comercial, liderança, vendas B2B e fé católica nos negócios.

O sistema roda 24/7 num computador fixo em casa. Ele busca notícias e tendências automaticamente via Apify, processa tudo com GPT-4o e gera até 20 ideias de conteúdo por dia, já classificadas no funil de vendas correto. Às 7h da manhã envia um briefing resumido via WhatsApp (CallMeBot). A cada 2 horas, coleta métricas reais do Instagram via Graph API, analisa o que está performando e aprende continuamente — ajustando os pesos da geração de conteúdo com base no que realmente funciona para aquele criador específico. O frontend é um site responsivo acessível via link.

### Objetivos do criador
- Gerar leads qualificados via diagnóstico gratuito (link da bio)
- Construir autoridade no nicho comercial/liderança
- Postar 5–10 conteúdos por dia no Instagram
- Nunca ficar sem ideia, mesmo sem acesso ao computador
- Entender em tempo real o que performa e por quê — e que o sistema aprenda sozinho com isso

---

## 2. PÚBLICO-ALVO DO CRIADOR

**Personas primárias:**
- Diretor Comercial
- Gestor de Vendas
- Empresário / Dono de empresa PME

**Personas secundárias:**
- Vendedor Sênior em busca de crescimento
- Empreendedor iniciante com time comercial

**Tom da comunicação:** Autoridade sem arrogância. Direto, provocativo, humano. Baseado em conhecimento próprio (sem cases de clientes ainda).

---

## 3. FUNIL DE CONTEÚDO (REGRA CENTRAL DO SISTEMA)

O sistema deve classificar e gerar conteúdo seguindo rigorosamente este funil:

```
TOPO → Atrair quem não te conhece
  - Temas leves, problemas comuns de vendas
  - Erros clássicos, dados que surpreendem, provocações
  - CTA: "Segue pra ver mais" ou "Salva esse vídeo"
  - Métrica: alcance, novos seguidores

MEIO → Aprofundar confiança com quem já te conhece
  - Como você pensa, sua visão, sua metodologia
  - Ponto de vista diferenciado sobre situações do dia a dia comercial
  - CTA: "Comenta X aqui embaixo" ou "Me conta nos comentários"
  - Métrica: engajamento, comentários, salvamentos

FUNDO → Converter em lead qualificado
  - Especificidade: resolve um problema concreto e convida pra conversa
  - Metodologia aplicada, diagnóstico de situação
  - CTA: "Acessa o link da bio e faz o diagnóstico gratuito" 
  - Métrica: cliques no link, respostas de DM, diagnósticos preenchidos
```

**Regra importante:** O sistema deve identificar automaticamente o melhor nível de funil para cada conteúdo gerado, com base no tema e na profundidade. O criador não precisa escolher — o sistema decide e explica o porquê.

---

## 4. PILARES DE CONTEÚDO

O sistema deve distribuir os 20 conteúdos do dia entre estes pilares:

| Pilar | Peso | Temas |
|-------|------|-------|
| Vendas e Gestão Comercial | 55% | Gestão de times, processo de vendas, liderança comercial, erros de diretores, métricas, CRM, follow-up, quota |
| Empreendedorismo / Negócios | 25% | Tomada de decisão, crescimento de empresa, cultura organizacional, contratação |
| Fé Católica e Propósito | 15% | Princípios cristãos nos negócios, propósito, discernimento, liderança com valores |
| Bastidores / Vida | 5% | Momentos reais, construindo a consultoria, parceria com o sócio Pedro |

---

## 5. CTAs DISPONÍVEIS

O sistema deve variar entre dois tipos de CTA e indicar qual usar em cada conteúdo:

**CTA Tipo 1 — Link da Bio (mais poderoso, para fundo de funil):**
> "Se você quer entender como está o seu processo comercial hoje, acessa o link da bio e faz o diagnóstico gratuito. São 3 minutos e você já vai sair com clareza."

**CTA Tipo 2 — Comentário/DM (engajamento, para meio de funil):**
> "Comenta aqui [palavra-chave] que eu te mando [material/análise] direto no direct."
> Exemplo: "Comenta FUNIL aqui embaixo que eu te mando o checklist completo."

---

## 6. ARQUITETURA TÉCNICA

### Stack

```
Backend:   Node.js + Express
Scheduler: node-cron
Banco:     SQLite (via better-sqlite3) — simples, sem instalação, arquivo local
Scraping:  Apify Client (SDK oficial)
IA:        OpenAI GPT-4o (via openai SDK)
Métricas:  Instagram Graph API (oficial, via HTTP)
WhatsApp:  CallMeBot API (HTTP GET simples, gratuito)
Frontend:  HTML + CSS + Vanilla JS (sem framework — deploy simples)
           OU Next.js se o dev preferir (especificar no .env: FRONTEND_TYPE)
```

### Estrutura de pastas

```
/project-root
  /backend
    server.js          # Express API + serve do frontend
    scheduler.js       # node-cron: geração, métricas, briefing, análise semanal
    apify.js           # Módulo de scraping via Apify
    openai.js          # Módulo de geração de conteúdo com GPT-4o
    instagram.js       # Módulo Instagram Graph API (métricas em tempo real)
    intelligence.js    # Motor de aprendizado — analisa padrões e ajusta pesos
    whatsapp.js        # Módulo CallMeBot
    database.js        # SQLite: inicialização e queries
    /db
      data.db          # Banco SQLite (gerado automaticamente)
  /frontend
    index.html         # SPA responsiva
    style.css
    app.js
    manifest.json      # PWA manifest (ícone, nome, tema)
    sw.js              # Service Worker (cache offline básico)
  .env                 # Todas as variáveis de ambiente
  .env.example         # Template sem valores reais
  package.json
  README.md
  CONTEXT.md           # Este arquivo
```

---

## 7. VARIÁVEIS DE AMBIENTE (.env)

Criar um arquivo `.env` na raiz com exatamente estas variáveis:

```env
# ==============================
# OPENAI
# ==============================
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# ==============================
# APIFY
# ==============================
APIFY_API_TOKEN=apify_api_...

# Apify Actor IDs para scraping (configurar conforme necessidade)
# Sugestão: usar actors públicos já disponíveis no Apify Store
APIFY_ACTOR_GOOGLE_NEWS=lukaskrivka/google-news-feed      # Google News RSS via Apify
APIFY_ACTOR_INSTAGRAM=apify/instagram-hashtag-scraper     # Posts por hashtag
APIFY_ACTOR_LINKEDIN=vocabnomics/linkedin-posts-scraper   # Posts LinkedIn
APIFY_ACTOR_TWITTER=quacker/twitter-scraper               # Tweets por keyword

# ==============================
# WHATSAPP (CallMeBot)
# ==============================
# Como configurar: mande "I allow callmebot to send me messages" para +34 644 66 26 28 no WhatsApp
# Você receberá sua APIKEY em resposta
CALLMEBOT_PHONE=55119XXXXXXXX     # Seu número com DDI, sem + e sem espaços
CALLMEBOT_APIKEY=XXXXXXXX         # Chave recebida pelo WhatsApp

# ==============================
# SCHEDULER
# ==============================
CRON_SCRAPE_AND_GENERATE=0 0 * * *    # Meia-noite: busca notícias e gera conteúdo
CRON_WHATSAPP_BRIEFING=0 7 * * *      # 7h da manhã: envia briefing no WhatsApp
TIMEZONE=America/Sao_Paulo

# ==============================
# SERVIDOR
# ==============================
PORT=3000
NODE_ENV=production

# ==============================
# CRIADOR (contexto do sistema)
# ==============================
CREATOR_NAME=                     # Seu nome completo
CREATOR_PARTNER=Pedro             # Nome do sócio
CREATOR_PRODUCT=                  # Ex: Consultoria de reestruturação comercial
CREATOR_CTA_LINK=                 # Ex: linktr.ee/seuperfil
CREATOR_BIO=                      # Parágrafo sobre você: experiência, momento atual, diferencial
CREATOR_HAS_CASES=false           # false = sem cases ainda, true = tem cases

# ==============================
# CONFIGURAÇÕES DE GERAÇÃO
# ==============================
DAILY_CONTENT_LIMIT=20            # Máximo de conteúdos gerados por dia
BRIEFING_TOP_PICKS=5              # Quantos conteúdos enviar no WhatsApp de manhã

# ==============================
# INSTAGRAM GRAPH API (métricas)
# ==============================
# Como obter:
# 1. Conta Instagram precisa ser Profissional (Criador ou Empresa)
# 2. Conectar ao Facebook Page
# 3. Criar app em developers.facebook.com
# 4. Adicionar produto "Instagram Graph API"
# 5. Gerar token de longa duração (60 dias) com permissões:
#    instagram_basic, instagram_manage_insights, pages_show_list
IG_ACCESS_TOKEN=                  # Token de acesso (longa duração)
IG_USER_ID=                       # ID numérico da conta Instagram
IG_TOKEN_REFRESH_DAYS=50          # Renovar token antes de expirar (50 dias)

# ==============================
# SCHEDULER — MÉTRICAS E APRENDIZADO
# ==============================
CRON_METRICS_SYNC=0 */2 * * *     # A cada 2h: sincroniza métricas do Instagram
CRON_INTELLIGENCE_UPDATE=0 3 * * * # 3h da manhã: atualiza padrões de aprendizado
CRON_WEEKLY_REPORT=0 8 * * 1      # Segunda às 8h: relatório semanal no WhatsApp

# Tempo mínimo de um post para coletar métricas relevantes (em horas)
METRICS_MIN_AGE_HOURS=2
# Janela para considerar um post "recente" na análise de padrões (em dias)
INTELLIGENCE_WINDOW_DAYS=30
```

---

## 8. BANCO DE DADOS (SQLite)

### Tabelas

```sql
-- Conteúdos gerados
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                    -- YYYY-MM-DD
  funil TEXT NOT NULL,                   -- 'topo' | 'meio' | 'fundo'
  pillar TEXT NOT NULL,                  -- 'vendas' | 'empreendedorismo' | 'fe' | 'vida'
  tema TEXT NOT NULL,                    -- Resumo em 6-8 palavras
  gancho TEXT NOT NULL,                  -- Os primeiros 5-10 segundos
  estrutura TEXT NOT NULL,               -- JSON array de strings
  cta_tipo TEXT NOT NULL,                -- 'link' | 'comentario'
  cta_texto TEXT NOT NULL,               -- Texto exato do CTA
  hashtags TEXT NOT NULL,                -- JSON array
  porque_gera_leads TEXT NOT NULL,       -- Explicação estratégica
  source_headline TEXT,                  -- Notícia/post que inspirou (se houver)
  source_url TEXT,                       -- URL da fonte
  used INTEGER DEFAULT 0,                -- 0 = não usado, 1 = gravado/usado
  favorited INTEGER DEFAULT 0,           -- 0 = normal, 1 = favoritado
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Fontes coletadas no dia
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  platform TEXT NOT NULL,                -- 'google_news' | 'instagram' | 'linkedin' | 'twitter'
  headline TEXT NOT NULL,
  url TEXT,
  summary TEXT,
  relevance_score INTEGER,               -- 1-10 (avaliado pelo GPT)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Log de execuções do scheduler
CREATE TABLE IF NOT EXISTS scheduler_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job TEXT NOT NULL,                     -- 'scrape' | 'generate' | 'whatsapp' | 'metrics' | 'intelligence'
  status TEXT NOT NULL,                  -- 'success' | 'error'
  message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Métricas dos posts do Instagram (sincronizadas a cada 2h)
CREATE TABLE IF NOT EXISTS post_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id INTEGER REFERENCES contents(id),  -- Link com o conteúdo gerado (se rastreável)
  instagram_post_id TEXT UNIQUE NOT NULL,       -- ID do post no Instagram
  posted_at TEXT NOT NULL,                      -- Quando foi postado
  media_type TEXT,                              -- 'REEL' | 'IMAGE' | 'CAROUSEL_ALBUM'
  caption_snippet TEXT,                         -- Primeiros 100 chars da legenda
  -- Métricas brutas (atualizadas a cada sync)
  reach INTEGER DEFAULT 0,                      -- Pessoas únicas que viram
  impressions INTEGER DEFAULT 0,                -- Total de exibições
  plays INTEGER DEFAULT 0,                      -- Plays (Reels)
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,             -- Visitas ao perfil a partir do post
  -- Métricas calculadas
  engagement_rate REAL DEFAULT 0,               -- (likes+comments+shares+saves) / reach * 100
  retention_score REAL DEFAULT 0,               -- plays / reach * 100 (% que assistiu)
  lead_score REAL DEFAULT 0,                    -- profile_visits / reach * 100
  -- Controle
  last_synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
  sync_count INTEGER DEFAULT 0                  -- Quantas vezes foi sincronizado
);

-- Padrões de aprendizado — o coração do sistema de inteligência
CREATE TABLE IF NOT EXISTS intelligence_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  window_days INTEGER DEFAULT 30,               -- Janela de análise em dias
  -- Pesos por funil (soma = 1.0, ajustados pelo desempenho)
  weight_topo REAL DEFAULT 0.35,
  weight_meio REAL DEFAULT 0.40,
  weight_fundo REAL DEFAULT 0.25,
  -- Pesos por pilar (soma = 1.0)
  weight_vendas REAL DEFAULT 0.55,
  weight_empreendedorismo REAL DEFAULT 0.25,
  weight_fe REAL DEFAULT 0.15,
  weight_vida REAL DEFAULT 0.05,
  -- Melhores fórmulas de gancho identificadas
  top_hook_formulas TEXT,                       -- JSON: array de fórmulas que mais performaram
  -- Horários que mais performam
  best_posting_hours TEXT,                      -- JSON: array de horas com melhor reach médio
  -- Temas que mais geram leads (profile_visits)
  top_lead_topics TEXT,                         -- JSON: array de temas/keywords
  -- Análise textual do GPT sobre os padrões
  gpt_analysis TEXT,                            -- Texto livre: o que está funcionando e por quê
  -- Conteúdos que serviram de base para esta análise
  posts_analyzed INTEGER DEFAULT 0
);

-- Histórico de performance por categoria (para gráficos)
CREATE TABLE IF NOT EXISTS performance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week TEXT NOT NULL,                           -- 'YYYY-WW' (ano-semana)
  funil TEXT NOT NULL,
  pillar TEXT NOT NULL,
  avg_reach REAL DEFAULT 0,
  avg_engagement_rate REAL DEFAULT 0,
  avg_retention_score REAL DEFAULT 0,
  avg_lead_score REAL DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. MÓDULO APIFY (apify.js)

### Função principal: `scrapeAllSources(date)`

Deve executar actors em paralelo e retornar um array de fontes normalizadas.

**Queries de busca a usar:**

```javascript
const SEARCH_QUERIES = {
  comercial: [
    'gestão de vendas B2B',
    'diretor comercial tendências',
    'time de vendas liderança',
    'funil de vendas erros',
    'CRM processo comercial',
  ],
  empreendedorismo: [
    'empreendedorismo PME Brasil',
    'liderança empresarial',
    'crescimento empresa pequena',
    'tomada de decisão empresário',
  ],
  fe_negocios: [
    'fé propósito negócios',
    'empresário católico',
    'valores cristãos liderança',
    'propósito empreendimento',
  ],
  tendencias: [
    'vendas inteligência artificial',
    'gestão comercial 2025',
    'linkedin vendas tendência',
  ]
};
```

**Formato normalizado de retorno:**

```javascript
{
  platform: 'google_news',        // ou instagram, linkedin, twitter
  headline: 'Título da notícia ou post',
  url: 'https://...',
  summary: 'Resumo de 2-3 frases',
  publishedAt: '2025-04-24T07:00:00Z',
  relevance: null                  // será preenchido pelo GPT depois
}
```

**Fallback:** Se Apify falhar ou não tiver crédito, usar RSS gratuito do Google News como fallback:
```
https://news.google.com/rss/search?q={query}&hl=pt-BR&gl=BR&ceid=BR:pt-419
```

---

## 9A. MÓDULO INSTAGRAM GRAPH API (instagram.js)

### Função: `syncRecentMetrics()`

Executada a cada 2 horas pelo scheduler. Busca os posts mais recentes do perfil e atualiza as métricas no banco.

**Endpoints usados:**

```javascript
// 1. Listar posts recentes do perfil
GET https://graph.instagram.com/{IG_USER_ID}/media
  ?fields=id,caption,media_type,timestamp,permalink
  &access_token={IG_ACCESS_TOKEN}
  &limit=20

// 2. Métricas de cada post (Reels)
GET https://graph.instagram.com/{post_id}/insights
  ?metric=reach,impressions,plays,likes,comments,shares,saved,profile_visits
  &access_token={IG_ACCESS_TOKEN}

// 3. Métricas de posts estáticos (imagem/carrossel)
GET https://graph.instagram.com/{post_id}/insights
  ?metric=reach,impressions,likes,comments,shares,saved,profile_visits
  &access_token={IG_ACCESS_TOKEN}
```

**Lógica de matching (conteúdo gerado → post real):**

O sistema tenta vincular um post do Instagram a um conteúdo gerado usando:
1. Se o usuário marcou o conteúdo como "Usado" (`used=1`), o sistema tenta match por proximidade de data (post criado em até 4h após o conteúdo ser marcado como usado)
2. Similaridade de texto: comparar os primeiros 50 chars do caption com o gancho do conteúdo
3. Se não conseguir vincular, salva o post mesmo assim como `content_id = null`

**Função: `refreshTokenIfNeeded()`**

Verificar se o token está próximo de expirar (< `IG_TOKEN_REFRESH_DAYS` dias restantes) e alertar via WhatsApp para renovar manualmente.

---

## 9B. MÓDULO DE INTELIGÊNCIA (intelligence.js)

Este é o cérebro do sistema. Roda toda noite às 3h. Analisa os últimos `INTELLIGENCE_WINDOW_DAYS` dias de métricas e atualiza os padrões que influenciam a geração de conteúdo do dia seguinte.

### Função: `updatePatterns()`

**Passo 1 — Agregar métricas por categoria:**

```javascript
// Para cada combinação funil × pilar, calcular médias
const stats = db.query(`
  SELECT 
    c.funil, c.pillar,
    AVG(pm.reach) as avg_reach,
    AVG(pm.engagement_rate) as avg_engagement,
    AVG(pm.retention_score) as avg_retention,
    AVG(pm.lead_score) as avg_leads,
    COUNT(*) as total
  FROM post_metrics pm
  JOIN contents c ON pm.content_id = c.id
  WHERE pm.posted_at >= date('now', '-${INTELLIGENCE_WINDOW_DAYS} days')
  GROUP BY c.funil, c.pillar
`);
```

**Passo 2 — Calcular novos pesos:**

Os pesos são calculados proporcionalmente ao score composto de cada categoria:

```javascript
// Score composto (ponderado pela meta do criador)
// Foco em leads: lead_score tem peso 50%, reach 30%, engagement 20%
const compositeScore = (avg_leads * 0.5) + (avg_reach * 0.3) + (avg_engagement * 0.2);

// Normalizar para que a soma dos pesos = 1.0
const totalScore = sum(allScores);
const newWeight = compositeScore / totalScore;
```

**Passo 3 — Analisar padrões textuais com GPT-4o:**

```
Analise as métricas de performance dos últimos {INTELLIGENCE_WINDOW_DAYS} dias:

{metrics_summary}

Posts com melhor performance em leads (profile_visits):
{top_lead_posts_with_hooks}

Posts com melhor retenção (replay rate):
{top_retention_posts}

Posts com pior performance:
{bottom_performers}

Com base nesses dados, identifique:
1. Quais fórmulas de gancho estão gerando mais retenção? (exemplos concretos)
2. Quais temas levam mais pessoas ao perfil (proxy de intenção de compra)?
3. Quais pilares estão gerando mais engajamento real vs. vanity metrics?
4. O que evitar — o que parece bom mas não converte?
5. Uma recomendação específica de conteúdo para amanhã baseada nos padrões.

Responda em JSON:
{
  "top_hook_formulas": ["fórmula1", "fórmula2", "fórmula3"],
  "best_posting_hours": [7, 12, 18, 20],
  "top_lead_topics": ["tema1", "tema2", "tema3"],
  "avoid": ["padrão que não funciona 1", "padrão 2"],
  "tomorrow_recommendation": "Uma frase específica sobre o que focar amanhã",
  "gpt_analysis": "Análise textual completa de 3-5 parágrafos"
}
```

**Passo 4 — Salvar padrões e usar na geração:**

Os padrões salvos em `intelligence_patterns` são **injetados no system prompt** da geração de conteúdo do dia seguinte, na seção "O QUE ESTÁ FUNCIONANDO PARA VOCÊ":

```
O QUE ESTÁ FUNCIONANDO PARA VOCÊ (baseado nos últimos {INTELLIGENCE_WINDOW_DAYS} dias):
- Fórmulas de gancho com melhor retenção: {top_hook_formulas}
- Temas que mais levam ao perfil (potencial de lead): {top_lead_topics}
- Melhor horário para postar: {best_posting_hours}
- EVITAR: {avoid}
- Recomendação para hoje: {tomorrow_recommendation}

AJUSTE DE DISTRIBUIÇÃO (baseado em performance real):
- Topo: {weight_topo * 100}% dos conteúdos de hoje
- Meio: {weight_meio * 100}%
- Fundo: {weight_fundo * 100}%
```

### Função: `weeklyPerformanceReport()`

Roda toda segunda às 8h. Envia relatório via WhatsApp com:

```
📊 *Relatório Semanal — Semana {N}*

*Performance geral:*
Reach médio: {X} (+/-Y% vs semana anterior)
Engajamento: {X}%
Taxa de retenção média: {X}%
Leads gerados (visitas ao perfil): {X}

*O que bombou essa semana:*
🥇 {gancho do post #1 com melhor performance}
🥈 {gancho do post #2}

*O que não foi bem:*
📉 {tema/pilar que underperformou}

*O sistema ajustou para essa semana:*
- Foco em: {pilar com melhor lead_score}
- Gancho recomendado: {top formula}

📱 Ver análise completa: {APP_PUBLIC_URL}/analytics
```

### System Prompt base (montar dinamicamente com variáveis do .env)

```
Você é o estrategista de conteúdo pessoal de {CREATOR_NAME}, consultor de {CREATOR_PRODUCT}.

PERFIL:
- Parceiro: {CREATOR_PARTNER}
- Contexto: {CREATOR_BIO}
- Tem cases: {CREATOR_HAS_CASES} (se false: NUNCA mencionar cases de clientes — focar em metodologia, conhecimento e provocações)

PÚBLICO-ALVO: Diretores Comerciais, Gestores de Vendas, Empresários, Vendedores Sênior
São ocupados, céticos com conteúdo genérico. Tomam decisão B2B. Precisam confiar antes de contratar.

OBJETIVO PRINCIPAL: Gerar leads via diagnóstico gratuito em {CREATOR_CTA_LINK}
OBJETIVO SECUNDÁRIO: Autoridade e engajamento real (não vaidade)

FUNIL:
- TOPO: Problemas comuns, erros clássicos, dados que chocam. CTA leve.
- MEIO: Ponto de vista, metodologia, como você pensa. CTA de comentário.
- FUNDO: Especificidade, diagnóstico, convite direto. CTA do link da bio.

O sistema DECIDE automaticamente qual nível do funil é mais adequado para cada conteúdo.

REGRAS DO GANCHO (crítico):
1. Nunca começar com "Olá", "Hoje vou falar", "Esse vídeo é sobre"
2. Usar: afirmação polêmica, número específico, pergunta que dói, contra-senso, revelação de erro
3. Deve ser falado naturalmente, como numa conversa real
4. Os primeiros 3 segundos precisam gerar curiosidade imediata ou tocar uma dor específica

FORMATO DE VÍDEO: Diálogo direto, sem roteiro, 30–90 segundos, Reels Instagram
```

### Função: `generateDailyContent(sources, date)`

Chamar GPT-4o com as fontes do dia e gerar os 20 conteúdos.

**Prompt de geração:**

```
Com base nas seguintes fontes coletadas hoje ({date}):

{sources_formatted}

Gere {DAILY_CONTENT_LIMIT} ideias de conteúdo para Instagram. 

REGRAS DE DISTRIBUIÇÃO:
- 35% Topo de funil (7 conteúdos)
- 40% Meio de funil (8 conteúdos)  
- 25% Fundo de funil (5 conteúdos)

DISTRIBUIÇÃO DE PILARES:
- 55% Vendas/Gestão Comercial
- 25% Empreendedorismo
- 15% Fé Católica/Propósito
- 5% Bastidores

Para cada conteúdo, indique se a notícia foi o gatilho ou se é conhecimento atemporal.
Varie completamente os formatos de gancho — não repita fórmulas.

Responda APENAS com JSON válido:
{
  "contents": [
    {
      "funil": "topo|meio|fundo",
      "pillar": "vendas|empreendedorismo|fe|vida",
      "tema": "Resumo em 6-8 palavras",
      "gancho": "Exatamente o que falar nos primeiros 5-10 segundos",
      "estrutura": ["Ponto 1 a desenvolver", "Ponto 2", "Ponto 3"],
      "cta_tipo": "link|comentario",
      "cta_texto": "Texto exato do CTA para falar no vídeo",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "porque_gera_leads": "Uma frase: por que esse conteúdo específico leva o ICP a querer falar com você",
      "source_headline": "Título da notícia que inspirou, ou null se for atemporal",
      "source_url": "URL ou null"
    }
  ]
}
```

---

## 11. MÓDULO WHATSAPP (whatsapp.js)

### Função: `sendBriefing(contents)`

Selecionar os `BRIEFING_TOP_PICKS` melhores conteúdos do dia (priorizar: 2 topo + 2 meio + 1 fundo) e enviar via CallMeBot.

**URL da API:**
```
https://api.callmebot.com/whatsapp.php?phone={CALLMEBOT_PHONE}&text={TEXT_ENCODED}&apikey={CALLMEBOT_APIKEY}
```

**Formato da mensagem:**

```
⚡ *Briefing de Conteúdo — {data_hoje}*

Bom dia! Aqui estão seus 5 melhores conteúdos de hoje:

━━━━━━━━━━━━━━━
*#1 — TOPO* 💼 Vendas
_{gancho}_

*#2 — MEIO* ✝️ Fé
_{gancho}_

*#3 — TOPO* 💼 Vendas
_{gancho}_

*#4 — MEIO* 💼 Vendas
_{gancho}_

*#5 — FUNDO* 💼 Vendas
_{gancho}_

━━━━━━━━━━━━━━━
📱 Ver todos os 20 conteúdos: {URL_DO_APP}

Bora gravar! 🎯
```

---

## 12. SCHEDULER (scheduler.js)

```javascript
// Job 1: Meia-noite — scraping + geração (com inteligência injetada)
cron.schedule(process.env.CRON_SCRAPE_AND_GENERATE, async () => {
  // 1. Scraping via Apify
  // 2. Salvar fontes no banco
  // 3. Carregar padrões de inteligência mais recentes (intelligence_patterns)
  // 4. Gerar 20 conteúdos com GPT-4o (padrões injetados no prompt)
  // 5. Salvar conteúdos no banco
  // 6. Log de execução
}, { timezone: process.env.TIMEZONE });

// Job 2: A cada 2h — sincronizar métricas do Instagram
cron.schedule(process.env.CRON_METRICS_SYNC, async () => {
  // 1. Buscar posts recentes via Instagram Graph API
  // 2. Para cada post, buscar métricas (reach, plays, saves, profile_visits...)
  // 3. Calcular engagement_rate, retention_score, lead_score
  // 4. Atualizar post_metrics no banco
  // 5. Tentar vincular posts a conteúdos gerados (por data e similaridade)
  // 6. Verificar expiração do token IG — alertar via WhatsApp se < IG_TOKEN_REFRESH_DAYS
  // 7. Log de execução
}, { timezone: process.env.TIMEZONE });

// Job 3: 3h da manhã — atualizar inteligência
cron.schedule(process.env.CRON_INTELLIGENCE_UPDATE, async () => {
  // 1. Agregar métricas dos últimos INTELLIGENCE_WINDOW_DAYS dias
  // 2. Calcular novos pesos por funil e pilar (baseado em lead_score composto)
  // 3. Chamar GPT-4o para análise textual de padrões
  // 4. Salvar em intelligence_patterns
  // 5. Salvar snapshot semanal em performance_history
  // 6. Log de execução
}, { timezone: process.env.TIMEZONE });

// Job 4: 7h — envio do briefing
cron.schedule(process.env.CRON_WHATSAPP_BRIEFING, async () => {
  // 1. Buscar top picks do banco para a data de hoje
  // 2. Incluir destaque "melhor aposta de hoje segundo a IA" (baseado em intelligence)
  // 3. Enviar via CallMeBot
  // 4. Log de envio gravado
}, { timezone: process.env.TIMEZONE });

// Job 5: Segunda-feira às 8h — relatório semanal
cron.schedule(process.env.CRON_WEEKLY_REPORT, async () => {
  // 1. Gerar relatório de performance da semana anterior
  // 2. Comparar com semana anterior
  // 3. Enviar via WhatsApp
}, { timezone: process.env.TIMEZONE });
```

**Endpoints manuais:**
```
POST /api/generate-now          # Força geração de conteúdo
POST /api/sync-metrics-now      # Força sync de métricas do Instagram
POST /api/update-intelligence   # Força atualização dos padrões de aprendizado
```

---

## 13. API BACKEND (server.js)

### Endpoints necessários

```
GET  /api/contents?date=YYYY-MM-DD     # Conteúdos de uma data (default: hoje)
GET  /api/contents/:id                 # Um conteúdo específico
PUT  /api/contents/:id/use             # Marcar como usado/gravado
PUT  /api/contents/:id/favorite        # Favoritar
GET  /api/contents/favorites           # Listar favoritados

GET  /api/sources?date=YYYY-MM-DD      # Fontes coletadas no dia
GET  /api/status                       # Status do sistema (last run, next run, etc.)
POST /api/generate-now                 # Forçar geração manual
POST /api/capture-insight              # Capturar insight do campo rápido
                                       # Body: { text: "..." }
                                       # Retorna: conteúdo gerado na hora

GET  /api/stats                        # Estatísticas gerais: total gerado, usados, funil breakdown

# MÉTRICAS E INTELIGÊNCIA
GET  /api/metrics                      # Métricas de todos os posts sincronizados
GET  /api/metrics/:instagram_post_id   # Métricas de um post específico
POST /api/sync-metrics-now             # Força sync manual do Instagram
POST /api/metrics/link                 # Vincula um post do IG a um conteúdo gerado
                                       # Body: { instagram_post_id, content_id }

GET  /api/intelligence                 # Padrões de aprendizado atuais (pesos, top fórmulas, etc.)
GET  /api/intelligence/history         # Histórico semanal de performance
POST /api/update-intelligence          # Força atualização dos padrões manualmente

GET  /api/analytics/overview           # Dashboard: métricas agregadas dos últimos 30 dias
GET  /api/analytics/by-funil           # Performance breakdown por nível de funil
GET  /api/analytics/by-pillar          # Performance breakdown por pilar
GET  /api/analytics/top-posts          # Top 10 posts por lead_score
GET  /api/analytics/worst-posts        # Bottom 10 posts (para aprender o que evitar)
```

### Endpoint especial: Captura de Insight

O `/api/capture-insight` deve receber um texto livre (pode ser uma frase, situação do dia, observação) e retornar imediatamente 3 ângulos de conteúdo — um para cada nível do funil — baseados naquele insight.

**Prompt para captura de insight:**
```
O criador teve o seguinte insight ou situação hoje:

"{insight_text}"

Gere 3 ângulos de conteúdo para esse insight — um para cada nível do funil:
1. Como Topo (quem não te conhece)
2. Como Meio (quem já te acompanha)
3. Como Fundo (quem está considerando contratar)

Responda em JSON:
{
  "insights": [
    { "funil": "topo", "gancho": "...", "estrutura": [...], "cta_tipo": "...", "cta_texto": "..." },
    { "funil": "meio", "gancho": "...", "estrutura": [...], "cta_tipo": "...", "cta_texto": "..." },
    { "funil": "fundo", "gancho": "...", "estrutura": [...], "cta_tipo": "...", "cta_texto": "..." }
  ]
}
```

---

## 14. FRONTEND (design e funcionalidades)

### Design

**Identidade visual:**
- Fundo escuro (dark theme): `#0e0d0c`
- Acento primário: âmbar/dourado `#D4902A` — representa autoridade, ouro, resultado
- Tipografia: Sora (títulos) + DM Sans (corpo) — via Google Fonts
- Mobile-first, responsivo, sem frameworks CSS externos
- Deve funcionar bem em tela de 375px (iPhone SE) até 1440px (desktop)

**Paleta:**
```css
--bg: #0e0d0c;
--bg2: #161514;
--bg3: #1d1c1a;
--border: #2e2c29;
--text: #e8e3da;
--text2: #9b958a;
--amber: #d4902a;
--amber-light: #e8a84a;
--teal: #2a9d7c;    /* Topo de funil */
--amber-mid: #d4902a; /* Meio de funil */
--coral: #c9543a;   /* Fundo de funil */
```

### Telas / seções

**1. Home — Feed do Dia**
- Header com data de hoje e badge "X conteúdos gerados"
- Filtros rápidos: Todos | Topo | Meio | Fundo
- Cards de conteúdo com:
  - Badge colorido do funil (topo=verde-água, meio=âmbar, fundo=coral)
  - Badge do pilar (ícone + nome)
  - Gancho em destaque (fonte maior, bold)
  - Preview dos 3 pontos da estrutura (colapsável)
  - CTA tipo indicado
  - Botões: ✓ Usado | ★ Favoritar | 📋 Copiar | Expandir

**2. Detalhe do Conteúdo**
- Gancho completo em destaque
- Estrutura em tópicos numerados
- CTA com texto exato
- Hashtags clicáveis
- "Por que gera leads" em destaque
- Fonte que inspirou (se houver) com link
- Botão "Copiar tudo formatado"

**3. Captura Rápida (botão flutuante)**
- Botão ✏️ fixo no canto inferior direito
- Abre modal/drawer com textarea
- Placeholder: "Descreve o que aconteceu, um insight que teve, uma situação que viveu..."
- Botão "Transformar em conteúdo"
- Retorna 3 cards (um por nível de funil) instantaneamente

**4. Painel de Status**
- Última execução do scraping
- Próxima execução agendada
- Total de conteúdos gerados hoje
- Breakdown por funil (gráfico de barras simples)
- Breakdown por pilar
- Botão "Gerar agora" (força execução manual)

**5. Analytics — Inteligência de Performance** *(tela nova)*
- Header com período selecionável: 7 dias | 14 dias | 30 dias
- KPIs em cards: Reach médio, Engajamento médio, Retenção média, Lead score médio
- Gráfico de barras: Performance por nível de funil (reach vs. engagement vs. leads)
- Gráfico de barras: Performance por pilar
- Seção "O que está funcionando":
  - Top 3 ganchos com melhor retenção (texto + métrica)
  - Top 3 temas que mais levam ao perfil
- Seção "O que evitar":
  - Bottom 3 padrões com pior performance
- Seção "O sistema aprendeu":
  - Pesos atuais por funil (visual de proporção)
  - Análise textual do GPT (accordion expansível)
- Lista: Top 5 posts da janela com métricas completas
- Botão: "Forçar atualização da inteligência"

**6. Favoritos**
- Grid dos conteúdos favoritados
- Mesmos controles do feed principal

**7. Configurações**
- Campos editáveis para todas as vars do CREATOR_* do .env
- Campo para API keys (masked): OpenAI, Apify, Instagram Token, CallMeBot
- Campo para Instagram User ID
- Status do token Instagram: dias restantes + botão de instruções para renovar
- Toggle para ativar/desativar cada fonte do Apify
- Horário de envio do WhatsApp (editável)

### Responsividade

- Mobile: bottom navigation bar (6 ícones: Home, Captura, Analytics, Status, Favoritos, Config)
- Desktop: sidebar left navigation
- Cards em grid 1 coluna no mobile, 2 colunas no tablet, 3 no desktop

---

## 15. FLUXO COMPLETO — PASSO A PASSO

```
00:00  node-cron dispara job de geração
00:01  Carrega padrões de inteligência (pesos ajustados do dia)
00:01  apify.js executa actors em paralelo (Google News, Instagram, LinkedIn, Twitter)
00:03  Fontes salvas no banco (tabela sources)
00:04  openai.js recebe fontes + padrões de inteligência, monta prompt, chama GPT-4o
00:06  GPT retorna 20 conteúdos em JSON (distribuição ajustada pelo que funciona)
00:07  Conteúdos salvos no banco (tabela contents)
00:07  Log de sucesso gravado

02:00  Sync de métricas do Instagram (e a cada 2h durante o dia)
02:01  Graph API retorna posts recentes com métricas
02:02  Banco atualizado: reach, plays, saves, profile_visits de cada post
02:03  Sistema tenta vincular posts a conteúdos gerados
02:03  Calcula engagement_rate, retention_score, lead_score de cada post

03:00  Job de inteligência roda
03:01  Agrega métricas dos últimos 30 dias por funil e pilar
03:02  Calcula novos pesos (ex: fundo aumenta se lead_score cresceu)
03:03  GPT analisa padrões textuais: quais ganchos prendem, quais temas convertem
03:04  Salva intelligence_patterns atualizado
03:05  Snapshot semanal salvo em performance_history

07:00  node-cron dispara job de briefing
07:00  Seleciona top 5 conteúdos do dia
07:01  Inclui insight da inteligência: "melhor aposta de hoje segundo os seus dados"
07:01  Monta mensagem formatada para WhatsApp
07:01  Envia via CallMeBot API
07:02  Log de envio gravado

(manhã) Usuário abre o site no celular
        → Vê os 20 conteúdos do dia organizados por funil
        → Vê badge "📈 Recomendado pela IA" nos conteúdos alinhados com padrões vencedores
        → Escolhe, marca como usado, e vai gravar

(qualquer hora) Usuário tem um insight numa reunião
        → Abre site, clica no botão flutuante
        → Digita o insight
        → Recebe 3 ângulos na hora (topo/meio/fundo)

(segunda-feira 8h) Relatório semanal chega no WhatsApp
        → Comparativo da semana
        → O que o sistema aprendeu e ajustou
        → Top ganchos e temas da semana
```

---

## 16. INSTALAÇÃO E EXECUÇÃO

O `README.md` do projeto deve incluir:

```bash
# 1. Instalar dependências
npm install

# 2. Copiar .env.example e preencher
cp .env.example .env
# Editar .env com suas chaves

# 3. Inicializar banco de dados
npm run db:init

# 4. Testar geração manual
npm run generate-now

# 5. Iniciar servidor (produção)
npm start

# Para manter rodando 24/7 (usar PM2)
npm install -g pm2
pm2 start server.js --name "analista-conteudo"
pm2 save
pm2 startup   # Configura para iniciar com o sistema
```

**Dependências principais (package.json):**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "openai": "^4.0.0",
    "apify-client": "^2.9.0",
    "better-sqlite3": "^9.0.0",
    "node-cron": "^3.0.0",
    "node-fetch": "^3.0.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.0",
    "xml2js": "^0.6.0",
    "express-basic-auth": "^1.2.1"
  }
}
```

---

## 17. CONFIGURAÇÃO DO INSTAGRAM GRAPH API

**Pré-requisito:** Conta Instagram deve ser do tipo Profissional (Criador ou Empresa).

**Passo a passo:**

1. Acessar [developers.facebook.com](https://developers.facebook.com) e criar um app do tipo "Business"
2. Adicionar o produto "Instagram Graph API" ao app
3. Em "Instagram Graph API > Configuração", conectar sua conta Instagram
4. Gerar um token de acesso com as permissões:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_show_list`
5. Converter para **token de longa duração** (válido por 60 dias):
   ```
   GET https://graph.facebook.com/v18.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={APP_ID}
     &client_secret={APP_SECRET}
     &fb_exchange_token={SHORT_TOKEN}
   ```
6. Pegar seu `IG_USER_ID`:
   ```
   GET https://graph.instagram.com/me?fields=id,username&access_token={TOKEN}
   ```
7. Preencher `IG_ACCESS_TOKEN` e `IG_USER_ID` no `.env`
8. Testar: `npm run test-instagram`

**Renovação do token:** O sistema alerta via WhatsApp quando restam menos de `IG_TOKEN_REFRESH_DAYS` dias. A renovação deve ser feita manualmente repetindo o passo 5 com o token atual.

---

## 18. CONFIGURAÇÃO DO CALLMEBOT

Passos para ativar o WhatsApp:

1. Salvar o número `+34 644 66 26 28` nos seus contatos
2. Enviar a mensagem exata: `I allow callmebot to send me messages`
3. Aguardar resposta com sua `APIKEY`
4. Preencher `CALLMEBOT_PHONE` e `CALLMEBOT_APIKEY` no `.env`
5. Testar: `npm run test-whatsapp`

---

## 18. ACESSO EXTERNO (TUNNEL)

Para acessar de qualquer lugar sem servidor externo, usar ngrok ou Cloudflare Tunnel:

**Opção A — ngrok (mais simples):**
```bash
npm install -g ngrok
ngrok http 3000
# URL gerada: https://xxxx.ngrok-free.app
```

**Opção B — Cloudflare Tunnel (permanente, gratuito):**
```bash
# Instalar cloudflared e criar tunnel
cloudflared tunnel create analista-conteudo
cloudflared tunnel route dns analista-conteudo seu-subdominio.exemplo.com
```

Salvar a URL final no `.env` como `APP_PUBLIC_URL` — será usada na mensagem do WhatsApp.

---

## 20. NOTAS IMPORTANTES PARA O DESENVOLVEDOR

1. **Sem cases**: Se `CREATOR_HAS_CASES=false`, o GPT nunca deve mencionar resultados de clientes. Todo conteúdo de fundo deve ser baseado em metodologia, diagnóstico de situação e conhecimento próprio.

2. **Variedade de ganchos**: Em cada lote de 20 conteúdos, nenhum gancho pode começar com a mesma palavra ou usar a mesma fórmula que outro. O prompt de geração deve incluir isso explicitamente.

3. **Relevância vs. atemporalidade**: Nem todo conteúdo precisa ter raiz em notícia. Cerca de 50% pode ser conhecimento atemporal. O sistema deve balancear.

4. **Erros de API**: Se o Apify falhar, o sistema não pode parar. Deve usar o fallback RSS e logar o erro. Se o GPT falhar, tentar novamente em 5 minutos (máximo 3 tentativas). Se o Instagram Graph API falhar, logar e tentar no próximo ciclo de 2h.

5. **Custo estimado**:
   - Geração: 20 conteúdos/dia × 30 dias = ~600 chamadas ao GPT-4o ≈ $5–8/mês
   - Inteligência: 1 análise/dia × 30 dias = ~30 chamadas extras ≈ +$1–2/mês
   - Total estimado: ~$7–10/mês de API OpenAI

6. **Segurança**: O backend deve ter autenticação básica (`express-basic-auth` com `BASIC_AUTH_USER` e `BASIC_AUTH_PASS` no .env) para não deixar o painel aberto publicamente, especialmente porque o token do Instagram fica armazenado.

7. **Período de aprendizado**: Nas primeiras 2 semanas, o sistema não terá dados suficientes para ajustar pesos de forma confiável. Durante este período, usar os pesos padrão definidos no `.env`. O sistema começa a aprender de forma significativa após 15–20 posts com métricas coletadas.

8. **Vinculação de posts**: O match automático entre posts do Instagram e conteúdos gerados nunca será 100% perfeito. Deve existir na tela de Analytics um botão de vinculação manual para o usuário corrigir ou criar vínculos não detectados automaticamente.

9. **Métricas disponíveis por tipo de post**:
   - Reels: reach, impressions, plays, likes, comments, shares, saved, profile_visits ✅
   - Imagens/Carrossel: reach, impressions, likes, comments, shares, saved, profile_visits ✅
   - Stories: impressions, reach, exits, replies (armazenamento por apenas 24h pela API) ⚠️

---

## 21. CHECKLIST DE ENTREGA

**Core:**
- [ ] `.env.example` completo com todas as variáveis documentadas
- [ ] Backend rodando e servindo o frontend na porta 3000
- [ ] Scheduler funcionando (testar com horário em 2 minutos)
- [ ] Scraping via Apify retornando fontes reais
- [ ] Fallback RSS funcionando quando Apify falha
- [ ] GPT-4o gerando 20 conteúdos em JSON válido
- [ ] Conteúdos salvos no SQLite corretamente
- [ ] WhatsApp recebendo mensagem de teste

**Frontend:**
- [ ] Mobile-first carregando os conteúdos do banco
- [ ] Filtros de funil funcionando
- [ ] Botão flutuante de captura de insight funcionando
- [ ] Marcar como usado funcionando
- [ ] Favoritar funcionando
- [ ] Painel de status mostrando última/próxima execução

**Métricas e Inteligência:**
- [ ] Instagram Graph API retornando métricas reais
- [ ] Sync a cada 2h funcionando e logando
- [ ] Tabela post_metrics sendo populada corretamente
- [ ] Vinculação automática de posts funcionando (pelo menos parcialmente)
- [ ] Vinculação manual disponível no frontend
- [ ] Job de inteligência rodando às 3h
- [ ] Pesos sendo calculados e salvos em intelligence_patterns
- [ ] Análise GPT sendo salva em gpt_analysis
- [ ] Padrões sendo injetados no prompt de geração do dia seguinte
- [ ] Tela de Analytics exibindo métricas corretamente
- [ ] Badge "Recomendado pela IA" aparecendo nos conteúdos relevantes
- [ ] Relatório semanal sendo enviado no WhatsApp
- [ ] Alerta de expiração de token do Instagram funcionando

**Infra:**
- [ ] PM2 configurado para reinício automático
- [ ] README com instruções completas de instalação
- [ ] Seção de troubleshooting no README para erros comuns de token Instagram
