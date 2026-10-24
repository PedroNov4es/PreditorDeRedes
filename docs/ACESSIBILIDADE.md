# Checklist de acessibilidade (RNF01 a RNF13)

Status: **implementado no código**. Testado em celular Android real com **TalkBack** e em iPhone real com **VoiceOver** (P01, P02 e P03), e com **fonte no máximo** nos dois (ver "Registro de testes" abaixo). Ainda não verificados no VoiceOver: o anúncio de carregamento com API lenta (RNF12) e o estado "Não recomendada" da P03. Os defeitos F1 a F5 encontrados no iPhone estão listados no registro de 22/10/2026.

| Req. | O que foi feito | Onde | Status |
|---|---|---|---|
| RNF02 | `accessibilityRole` (button, radio, radiogroup, header, alert, progressbar), rótulo, estado (`selected`, `disabled`) e valor em todo controle | `components/*` | TalkBack ok; VoiceOver ok (papel e estado falados em inglês, ver F1) |
| RNF03 | Qualidade sempre em **texto + símbolo + cor** (✔ Boa, ! Regular, ✖ Instável). Seleção marcada por "✓", borda grossa e estado de acessibilidade. Gráfico tem alternativa em texto linha a linha. Os medidores (`MetricGauge`, `ScoreMeter`, `QualityScale`) e a faixa de períodos (`PeriodStrip`) são só reforço visual: o valor e a qualidade aparecem sempre em texto | `StatusBadge`, `ChoiceButton`, `DetalhesScreen`, `MetricGauge`, `PeriodStrip` | ok (escala de cinza conferida na P01 no iPhone) |
| RNF04 | Contrastes calculados (WCAG): texto 15,97:1; texto secundário 8,17:1; botão primário 6,70:1; Boa 7,03:1; Regular 7,78:1; Instável 6,85:1; borda de controle ≥ 3:1 | `theme.ts`, `domain/quality.ts` | ok |
| RNF05 | `ScrollView` em todas as telas e fonte do sistema respeitada (sem `allowFontScaling={false}`). Texto, botões e cartões não têm altura fixa. **Exceção:** as barras puramente decorativas (10 dp em `ScoreMeter`, `QualityScale` e `MetricGauge`; 48 dp em `PeriodStrip`) têm altura fixa, não contêm texto e ficam ocultas ao leitor de tela | `Screen`, `ScoreMeter`, `QualityScale`, `MetricGauge`, `PeriodStrip` | ok no Android (fonte e tela no máximo); **parcial no iOS**: botões e telas utilizáveis, mas com cortes visuais (F4, F5) |
| RNF06 | Só toque simples; sem arrastar, gesto ou multitoque | todas | ok |
| RNF07 | Glossário único; latência, perda e jitter explicados na P02 | `domain/glossary.ts`, `MetricCard` | ok (no iOS, papel e estado em inglês e data/hora lidas como números: F1 e F2) |
| RNF08 | Ordem lógica; o `MetricGauge` e o `BestWindowCard` são lidos como um único elemento com rótulo falado (valor, unidade e qualidade); a `PeriodStrip` é escondida do leitor e o resumo em texto traz as mesmas informações; `announceForAccessibility` quando a previsão é atualizada, no resultado da atividade, no carregamento e no erro | telas, `StateViews` | TalkBack ok; VoiceOver ok (ver F2 e F3) |
| RNF09 | `minHeight` e `minWidth` de 48 dp em botões e opções | `AppButton`, `ChoiceButton`, `theme.MIN_TOUCH` | ok |
| RNF10 | Sem login, cadastro, GPS ou rastreamento. Região escolhida em lista | `RegionPicker` | ok |
| RNF11 | Erro em linguagem simples + "Tentar novamente". Se as três consultas da P01 falham ao mesmo tempo, aparece **um só** aviso com um só botão, que recarrega tudo | `StateViews.ErrorState`, `ApiError.userMessage`, `PrevisaoScreen` | ok (TalkBack e VoiceOver) |
| RNF12 | Estado "carregando" visível e anunciado | `StateViews.LoadingState` | ok no TalkBack; VoiceOver **não verificado** (com falha instantânea o anúncio de erro substitui o de carregamento; falta testar com API lenta) |
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
- **Pendente:** VoiceOver (iOS), por falta de aparelho iOS (risco R10).

### 22/10/2026: iPhone físico, VoiceOver (iOS)

- **Ambiente:** iPhone físico, Expo Go, dados simulados (`EXPO_PUBLIC_USE_MOCK=true`; o erro foi testado com `false`). O projeto foi atualizado localmente para o SDK 58 só para este teste, porque o Expo Go atual do iOS não abre mais o SDK 57.
- **Conferido e ok (P01, P02 e P03):**
  - Ordem de leitura e títulos lidos como cabeçalho.
  - Qualidade em texto; medidores e melhor janela lidos como um único item.
  - Barras decorativas não lidas, com o resumo em texto no lugar ("24 períodos, 19 Boa, 5 Regular").
  - Aviso de estimativa lido.
  - Seleção de período, região e atividade com estado e anúncio ("selecionado"; "Previsão atualizada para ..., qualidade ..."; "Chamada de áudio, adequada"), com a qualidade do anúncio batendo com a do selo em três regiões.
  - Região atual marcada como selecionada na lista.
  - Foco correto ao abrir e ao voltar de tela (botão "Voltar à previsão", gesto "Z" e botão da barra superior).
  - P02: jitter explicado sem valor numérico; linhas da comparação lidas em texto, sem ler as barras.
  - P03: resultado "Adequada" e "Com ressalvas" (período Regular) com a frase correspondente.
  - Erro (RNF11): anunciado sozinho, aviso único com título, mensagem e "Tentar novamente" (com dica); o botão refaz a consulta e o botão de região continua acessível.
  - Escala de cinza (conferida na P01): qualidade, período selecionado e diferença entre Boa e Regular continuam distinguíveis sem cor (RNF03). P02 e P03 não foram conferidas em escala de cinza.
- **F1 (baixa/média):** papel e estado falados em inglês dentro de fala em português ("radio button, checked/unchecked", "Expanded"), em períodos, regiões e atividades. No Android (TalkBack) saía "botão de opção".
- **F2 (baixa):** data e hora da P01 ("20/08 20") lidas como números soltos. Na P02 a hora sai bem ("21 horas").
- **F3 (baixa):** "Funciona bem para quase tudo" falada duas vezes seguidas na P02 (selo + texto). Na P01, provável e não verificado.
- **F4 (baixa):** com fonte no máximo, "ms" e "%" ficam cortados nos cartões de métricas da P01.
- **F5 (baixa):** com fonte no máximo, o selo "Adequada" da P03 sofre corte leve, mas a palavra aparece inteira.
- **Observações:** o botão de região não fala estado "recolhido" ao fechar (o nome já diz "Trocar de região"); um anúncio de previsão atualizada saiu incompleto uma vez e não se repetiu.
- **Não verificado:** anúncio de "Carregando previsão…" com API lenta (RNF12; com falha instantânea o anúncio de erro o substitui); estado "Não recomendada" da P03 (sem período Instável nos dados simulados); item 5 do roteiro (recarregar página numa rota interna e voltar).
- **Risco R10:** tratado para o VoiceOver. Resta repetir o carregamento com API lenta e corrigir ou aceitar F1 a F5.
