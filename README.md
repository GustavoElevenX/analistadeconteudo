# Central de Autoridade e Demanda - Gustavo Garcia / Vamo

Sistema local para transformar pensamentos, bastidores, aprendizados e temas de negocio em conteudos que constroem autoridade para Gustavo Garcia e demanda qualificada para a Vamo.

A Vamo e posicionada como uma solucao de performance operacional comercial: diagnostica gargalos em vendas, atendimento e pos-venda, redesenha processos, cria ou adapta sistemas de execucao, implementa na rotina do cliente, treina a equipe e otimiza continuamente.

A marca pessoal do Gustavo combina cinco pilares:

- Vamo / Performance Comercial
- Empreendedorismo real e construcao do zero
- Fe, valores e decisao
- Familia e responsabilidade
- Oferta / Diagnostico

Agora a geracao segue um contrato editorial: cada post sai com objetivo, funil, pilar, intencao estrategica, tipo de conteudo, tese, gancho, roteiro falado, conexao com a Vamo, risco generico, CTA e scores de autoridade, demanda, conexao, autenticidade e alinhamento com a Vamo. A inteligencia nao mede conteudos de conexao apenas por lead; ela tambem olha comentarios, salvamentos, compartilhamentos, respostas e crescimento de seguidores.

## O que ja foi criado

- Backend Node.js + Express em `backend/`
- Banco SQLite local em `backend/db/data.db`
- Scheduler com `node-cron`
- Scraping via Apify usando Google Search, Instagram e LinkedIn, com fallback RSS do Google News
- Geracao com OpenAI
- WhatsApp via CallMeBot
- Instagram Graph API para metricas
- Registro manual de cliques no link e leads gerados, usado no lead score
- Frontend responsivo em `frontend/`
- `.env` e `.env.example` na raiz

## Instalar e rodar

```bash
npm install
npm run db:init
npm start
```

Este projeto tenta usar `better-sqlite3` e, se ele nao instalar no Windows, usa o SQLite nativo do Node 24. Se voce preferir obrigatoriamente `better-sqlite3`, use Node.js LTS 22 ou instale o Visual Studio Build Tools com a carga "Desktop development with C++".

Depois abra:

```text
http://localhost:3000
```

Se `BASIC_AUTH_USER` e `BASIC_AUTH_PASS` estiverem preenchidos no `.env`, o navegador vai pedir login.

## O que preencher no `.env`

Obrigatorio para gerar conteudo:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

Obrigatorio para o briefing no WhatsApp:

```env
CALLMEBOT_PHONE=55119XXXXXXXX
CALLMEBOT_APIKEY=XXXXXXXX
```

Obrigatorio para coletar metricas reais do Instagram:

```env
IG_ACCESS_TOKEN=
IG_USER_ID=
IG_TOKEN_REFRESH_DAYS=50
```

Recomendado para buscar tendencias via Apify:

```env
APIFY_API_TOKEN=apify_api_...
APIFY_ACTOR_GOOGLE_SEARCH=apify/google-search-scraper
APIFY_ACTOR_INSTAGRAM=apify/instagram-scraper
APIFY_ACTOR_LINKEDIN_SEARCH=harvestapi/linkedin-post-search
APIFY_ACTOR_LINKEDIN=harvestapi/postagens-de-perfil-do-linkedin
APIFY_GOOGLE_QUERIES="gestao comercial B2B Brasil"|"vendas B2B tendencias Brasil"
APIFY_INSTAGRAM_HASHTAGS=vendasb2b|gestaocomercial|liderancacomercial
APIFY_LINKEDIN_SEARCH_QUERIES="gestao comercial"|"vendas B2B"|"lideranca comercial"|"forecast vendas"
APIFY_LINKEDIN_PROFILE_URLS=https://www.linkedin.com/in/perfil-1/|https://www.linkedin.com/company/empresa-1/
```

O LinkedIn agora funciona automaticamente por busca em `APIFY_LINKEDIN_SEARCH_QUERIES`. `APIFY_LINKEDIN_PROFILE_URLS` é opcional, apenas para monitorar perfis ou empresas específicas. O Instagram pode usar hashtags em `APIFY_INSTAGRAM_HASHTAGS` ou URLs diretas em `APIFY_INSTAGRAM_URLS`.

Dados do criador e posicionamento:

```env
CREATOR_NAME=Gustavo Garcia
CREATOR_PARTNER=
CREATOR_PRODUCT=Vamo
CREATOR_CTA_LINK=https://seulink.com
CREATOR_BIO=Um paragrafo sobre sua experiencia, momento atual e diferencial.
CREATOR_HAS_CASES=false
CREATOR_POSITIONING=Fundador em construcao, cofundador da Vamo, falando sobre performance comercial, empreendedorismo real, fe, familia e construcao do zero.
CREATOR_FAITH_BOUNDARY=Falar de fe com maturidade, sem parecer pregacao solta e sempre conectando com decisao, responsabilidade, carater, disciplina e vida real.
CREATOR_FAMILY_BOUNDARY=Falar de familia como responsabilidade e bastidor, sem exposicao desnecessaria e sem usar familia como isca de engajamento.
VAMO_POSITIONING=Solucao de performance operacional comercial que combina diagnostico, processos, sistemas e implementacao.
VAMO_THESIS=Empresas nao perdem resultado apenas por falta de demanda. Muitas perdem vendas, atendimento e retencao por falhas invisiveis no processo comercial.
VAMO_OFFER=Diagnostico, mapeamento de gargalos, redesenho de processo, sistema de execucao, implantacao, treinamento e otimizacao continua.
VAMO_METHOD=Diagnosticar, mapear, redesenhar, desenvolver, implementar e otimizar.
VAMO_ICP=Empresas com operacao comercial ativa, leads por WhatsApp, Instagram, site, indicacao ou trafego pago, e problemas de follow-up, atendimento, controle ou pos-venda.
VAMO_FORBIDDEN_POSITIONING=Nao posicionar como software isolado, CRM tradicional, agencia de marketing, software house generica ou consultoria que so entrega diagnostico.
```

Seguranca:

```env
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=crie-uma-senha-forte
APP_PUBLIC_URL=http://localhost:3000
```

Quando usar ngrok ou Cloudflare Tunnel, troque `APP_PUBLIC_URL` pela URL publica. Ela aparece no briefing do WhatsApp.

## Comandos uteis

```bash
npm run generate-now
npm run sync-metrics-now
npm run update-intelligence
npm run test-whatsapp
npm run test-instagram
```

## Configurar CallMeBot

1. Salve o numero `+34 644 66 26 28` nos contatos.
2. Envie no WhatsApp a mensagem exata: `I allow callmebot to send me messages`.
3. Aguarde a resposta com sua API key.
4. Preencha `CALLMEBOT_PHONE` com seu numero com DDI, sem `+` e sem espacos.
5. Preencha `CALLMEBOT_APIKEY`.
6. Rode `npm run test-whatsapp`.

## Configurar Instagram Graph API

1. A conta do Instagram precisa ser Profissional, do tipo Criador ou Empresa.
2. Conecte a conta a uma Facebook Page.
3. Acesse `https://developers.facebook.com` e crie um app Business.
4. Adicione o produto Instagram Graph API.
5. Gere um token com permissoes `instagram_basic`, `instagram_manage_insights` e `pages_show_list`.
6. Converta para token de longa duracao usando o endpoint de exchange do Facebook.
7. Obtenha o ID da conta:

```text
https://graph.instagram.com/me?fields=id,username&access_token=SEU_TOKEN
```

8. Preencha `IG_ACCESS_TOKEN` e `IG_USER_ID`.
9. Rode `npm run test-instagram`.

## Rodar 24/7 no computador

Instale o PM2:

```bash
npm install -g pm2
pm2 start backend/server.js --name analista-conteudo
pm2 save
pm2 startup
```

## Acesso externo

Opcao simples com ngrok:

```bash
npm install -g ngrok
ngrok http 3000
```

Copie a URL `https://...ngrok-free.app` para `APP_PUBLIC_URL`.

## Observacoes importantes

- Sem `OPENAI_API_KEY`, o sistema nao gera conteudo. Ele retorna erro ate o `.env` estar preenchido.
- Sem `APIFY_API_TOKEN`, o sistema tenta usar RSS gratuito do Google News.
- Sem `IG_ACCESS_TOKEN` e `IG_USER_ID`, os endpoints de metricas retornam erro ate a configuracao ser feita.
- Depois de editar o `.env`, reinicie o servidor.
