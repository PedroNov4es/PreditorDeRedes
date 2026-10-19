# Checklist de acessibilidade (RNF01 a RNF13)

Status: **implementado no código**. Testado em celular Android real com **TalkBack** (P01, P02 e P03) e com **fonte no máximo** (ver "Registro de testes" abaixo). **VoiceOver (iOS)** ainda não foi testado; os itens marcados "validar com VoiceOver" dependem disso.

| Req. | O que foi feito | Onde | Status |
|---|---|---|---|
| RNF02 | `accessibilityRole` (button, radio, radiogroup, header, alert, progressbar), rótulo, estado (`selected`, `disabled`) e valor em todo controle | `components/*` | TalkBack ok; validar com VoiceOver |
| RNF03 | Qualidade sempre em **texto + símbolo + cor** (✔ Boa, ! Regular, ✖ Instável). Seleção marcada por "✓", borda grossa e estado de acessibilidade. Gráfico tem alternativa em texto linha a linha. Os medidores (`MetricGauge`, `ScoreMeter`, `QualityScale`) e a faixa de períodos (`PeriodStrip`) são só reforço visual: o valor e a qualidade aparecem sempre em texto | `StatusBadge`, `ChoiceButton`, `DetalhesScreen`, `MetricGauge`, `PeriodStrip` | ok |
| RNF04 | Contrastes calculados (WCAG): texto 15,97:1; texto secundário 8,17:1; botão primário 6,70:1; Boa 7,03:1; Regular 7,78:1; Instável 6,85:1; borda de controle ≥ 3:1 | `theme.ts`, `domain/quality.ts` | ok |
| RNF05 | `ScrollView` em todas as telas e fonte do sistema respeitada (sem `allowFontScaling={false}`). Texto, botões e cartões não têm altura fixa. **Exceção:** as barras puramente decorativas (10 dp em `ScoreMeter`, `QualityScale` e `MetricGauge`; 48 dp em `PeriodStrip`) têm altura fixa, não contêm texto e ficam ocultas ao leitor de tela | `Screen`, `ScoreMeter`, `QualityScale`, `MetricGauge`, `PeriodStrip` | ok (testado com fonte e tela no máximo, Android) |
| RNF06 | Só toque simples; sem arrastar, gesto ou multitoque | todas | ok |
| RNF07 | Glossário único; latência, perda e jitter explicados na P02 | `domain/glossary.ts`, `MetricCard` | ok |
| RNF08 | Ordem lógica; o `MetricGauge` e o `BestWindowCard` são lidos como um único elemento com rótulo falado (valor, unidade e qualidade); a `PeriodStrip` é escondida do leitor e o resumo em texto traz as mesmas informações; `announceForAccessibility` quando a previsão é atualizada, no resultado da atividade, no carregamento e no erro | telas, `StateViews` | TalkBack ok; validar com VoiceOver |
| RNF09 | `minHeight` e `minWidth` de 48 dp em botões e opções | `AppButton`, `ChoiceButton`, `theme.MIN_TOUCH` | ok |
| RNF10 | Sem login, cadastro, GPS ou rastreamento. Região escolhida em lista | `RegionPicker` | ok |
| RNF11 | Erro em linguagem simples + "Tentar novamente". Se as três consultas da P01 falham ao mesmo tempo, aparece **um só** aviso com um só botão, que recarrega tudo | `StateViews.ErrorState`, `ApiError.userMessage`, `PrevisaoScreen` | ok |
| RNF12 | Estado "carregando" visível e anunciado | `StateViews.LoadingState` | ok |
| RNF13 | Aviso de estimativa em P01, P02 e P03 | `EstimateNotice` | ok |

## Roteiro de teste manual (cada sprint)

0. Rodar o app no celular (Expo Go) conforme o `README.md`.
1. TalkBack (Android) e VoiceOver (iOS): percorrer P01 → escolher região → escolher período → P02 → P03 → escolher atividade.
2. Fonte do sistema no máximo: nenhuma sobreposição, truncamento ou botão inacessível.
3. Desligar a API (ou a internet): mensagem de erro clara e "Tentar novamente" funcionando.
4. Verificar que nenhum estado depende só de cor (modo escala de cinza do aparelho).
5. Botão voltar (P02/P03): recarregar a página numa rota interna e voltar deve levar à P01, sem erro.

## Registro de testes

### 18/10/2026: celular Android real, `release/1.0.0`

- **Ambiente:** celular Android físico, Expo Go, dados simulados (`EXPO_PUBLIC_USE_MOCK=true`), branch `release/1.0.0`.
- **Fonte e tela no máximo (P01, P02, P03):** o teste achou quatro defeitos de corte e quebra de texto (título da barra superior, nomes da escala, datas da faixa de períodos, símbolo separado da palavra). Todos foram corrigidos no PR #6 e conferidos de novo no aparelho.
- **TalkBack (P01, P02 e P03):** as três telas foram percorridas com o leitor de tela. Na tela inicial (P01), ao abrir a tela, o leitor já apresenta o conteúdo sozinho, sem precisar tocar em nada, e orienta o percurso pelo som. Foram observados: anúncio do carregamento ("Carregando previsão" e "Carregando períodos", lidos como barra de progresso), estado do botão de região (recolhido/expandido), opções de região lidas como botão de opção, aviso falado de previsão atualizada com a qualidade, e leitura da previsão com data, qualidade e latência em texto.
- **API desligada (RNF11):** com a API fora do ar, as telas mostraram "Não foi possível conectar ao serviço de previsão" com o botão "Tentar novamente". Com a API de volta, o botão recarregou os dados.
- **Botão voltar:** funcionou em P02 e P03.
- **Escala de cinza (RNF03):** no modo cinza do sistema, Boa, Regular e Instável continuaram distinguíveis pelo símbolo e pelo texto, sem depender da cor.
- **Alvos de toque (RNF09):** nenhum botão ou opção foi difícil de tocar com o dedo. Não houve medição em dp no aparelho; o tamanho mínimo de 48 dp vem do código (`theme.MIN_TOUCH`).
- **Contraste (RNF04):** razões recalculadas a partir das cores do código (`theme.ts` e `domain/quality.ts`) e conferidas com os valores acima: texto 15,97:1, texto secundário 8,17:1, botão primário 6,70:1, Boa 7,03:1, Regular 7,78:1, Instável 6,85:1, borda de controle 4,34:1. Todos cumprem o mínimo da WCAG AA.
- **Pendente:** VoiceOver (iOS), por falta de aparelho iOS (risco R10).
