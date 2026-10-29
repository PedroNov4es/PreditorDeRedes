# Preditor de Redes (Sentinela de Redes)

Aplicativo mobile do Projeto Integrador **Preditor de Falhas na Rede** (Centro Universitário Braz Cubas).
Ele consome a **Connectivity Forecast API** e mostra, em linguagem simples e com acessibilidade, a qualidade
de conexão **prevista** para a região e o horário que o usuário escolher.

> **Status:** telas P01, P02 e P03 implementadas e testadas em celular Android real e em iPhone real (Expo Go), com TalkBack,
> VoiceOver e fonte do sistema no máximo. No Android, testadas também com a API Java real e com o mock. Os defeitos F2 a F5
> do iPhone foram corrigidos no código e ainda precisam ser conferidos em aparelho (ver `docs/ACESSIBILIDADE.md`).

## Telas (protótipos do Documento de Visão)

| Tela | Rota | Requisitos |
|---|---|---|
| P01 – Previsão (inicial) | `/` | RQ01, RQ02, RQ04, RNF03, RNF13 |
| P02 – Detalhes da previsão | `/detalhes` | RNF03, RNF07 |
| P03 – Previsão por atividade | `/atividade` | RQ03, RQ04 |

Sem cadastro, login, rastreamento nem GPS (RNF10): o usuário escolhe a região na lista.

## Como rodar

Pré-requisitos: **Node.js** (LTS) e, para usar a API real, **JDK 17** e **Maven 3.9+**.

```bash
npm install
cp .env.example .env     # no PowerShell: Copy-Item .env.example .env
npx expo start -c
```

O `-c` limpa o cache. É necessário sempre que o `.env` mudar, porque as variáveis `EXPO_PUBLIC_*` são gravadas no
app na hora do empacotamento (bundle).

### Opção A: sem a API (mais simples, mitigação do risco R07)

No `.env`, use `EXPO_PUBLIC_USE_MOCK=true` e reinicie com `npx expo start -c`. O app mostra um aviso visível de que os
dados são simulados.

### Opção B: com a API Java (`trabalho-api-java`)

1. Em outro terminal, na pasta da API: `mvn spring-boot:run` (sobe em `http://localhost:8080`).
2. No `.env`, ajuste `EXPO_PUBLIC_API_URL` conforme **onde o app roda**:

| Onde o app roda | `EXPO_PUBLIC_API_URL` |
|---|---|
| Navegador do computador (`w` no Expo) | `http://localhost:8080` |
| Emulador Android | `http://10.0.2.2:8080` |
| Simulador iOS | `http://localhost:8080` |
| Celular físico (Expo Go) | `http://IP-DO-COMPUTADOR:8080` (mesmo Wi-Fi) |

`10.0.2.2` só funciona dentro do emulador Android; no navegador use `localhost`.

### Testar no celular

1. Instale o **Expo Go** no aparelho (Android ou iOS) e conecte-o ao **mesmo Wi-Fi** do computador.
2. Rode `npx expo start -c` e leia o QR code (Android: dentro do Expo Go; iOS: pela câmera).
3. Sem API, use a Opção A. Com API, a Opção B com o IP do computador.
4. Roteiro do que conferir: `docs/ACESSIBILIDADE.md`.

Outros comandos: `npm run typecheck`, `npm run lint`, `npm test` (12 testes da lógica).

## Endpoints usados

| Uso | Endpoint |
|---|---|
| Regiões | `GET /api/v1/locations` |
| Previsão atual (RQ01) | `GET /api/v1/forecasts/probes/{id}?model_id=` |
| Períodos futuros (RQ02, RQ04) | `GET /api/v1/forecasts/probes/{id}/timeline?model_id=&limit=` |
| Comparar modelos (P02) | `GET /api/v1/forecasts/probes/{id}/compare?prediction_for=` |
| Atividade adequada (RQ03) | `POST /api/v1/activity/check` |

## Estrutura

```text
src/
├── app/            rotas do Expo Router (finas): index, detalhes, atividade
├── screens/        PrevisaoScreen (P01), DetalhesScreen (P02), AtividadeScreen (P03)
├── components/     Screen/ScreenHeader, HeroCard, ScoreMeter, MetricGauge, QualityScale, PeriodStrip,
│                   BestWindowCard, RegionSelect/RegionPicker, StatusBadge, StateViews, Skeleton, DemoNotice...
├── domain/         qualidade e limiares (Boa/Regular/Instável), atividades, glossário, regiões
├── lib/            ringBuffer (fila circular), aggregate (agregação), format, gauge, navigation
├── services/       api (fetch + erros), mock (dados simulados), errors
├── hooks/          useRequest, useRegions
├── state/          SelectionContext (região, período e consultas recentes)
├── types/          tipos dos DTOs da API
└── theme.ts        cores (contrastes verificados) e área mínima de toque
tests/              testes da lógica (node:test)
docs/               acessibilidade, estruturas de dados
```

## Decisões

- **3 níveis de qualidade.** A API devolve `GOOD`, `MODERATE`, `UNSTABLE`; o app exibe **Boa, Regular, Instável**.
  A classificação é feita pela API (RTT 60/150 ms; perda 1/5 %). O app só traduz.
- **Atividades** são as da API: videochamada, chamada de áudio, streaming, envio de arquivos, navegação e mensagens.
- **Jitter**: a API prevê apenas RTT e perda. O app explica o jitter (RNF07) mas não inventa um valor.
- **Adequada / Com ressalvas / Não recomendada**: adequada quando a qualidade atende ao mínimo da atividade;
  "com ressalvas" um nível abaixo; "não recomendada" abaixo disso.
- Os dados da fixture da API são de 20/08/2026; o "período atual" é o mais próximo disponível.

## Estruturas de Dados (disciplina de ED)

Detalhes em [`docs/ESTRUTURAS_DE_DADOS.md`](docs/ESTRUTURAS_DE_DADOS.md): fila circular (`RingBuffer`),
lista de registros tipados (`TimelineItem`) e estruturas de agregação (`summarize`, `bestWindow`, `bestPeriodFor`).

## Colaboração

Git e GitHub. Atualize a cópia local, confira a branch, faça alterações da sua tarefa, revise antes do commit
e use mensagens claras.

## Redes de Computadores

O coletor ICMP em Python, o guia do Packet Tracer e o roteiro do vídeo ficam em [`redes/`](redes/README.md).

Prototipo Figma (P01, P02 e P03): https://method-syntax-64783864.figma.site/
