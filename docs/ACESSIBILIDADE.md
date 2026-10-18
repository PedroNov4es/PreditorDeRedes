# Checklist de acessibilidade (RNF01 a RNF13)

Status: **implementado no código**; itens marcados "validar" dependem de teste em dispositivo.

| Req. | O que foi feito | Onde | Status |
|---|---|---|---|
| RNF02 | `accessibilityRole` (button, radio, radiogroup, header, alert, progressbar), rótulo, estado (`selected`, `disabled`) e valor em todo controle | `components/*` | validar com TalkBack/VoiceOver |
| RNF03 | Qualidade sempre em **texto + símbolo + cor** (✔ Boa, ! Regular, ✖ Instável). Seleção marcada por "✓", borda grossa e estado de acessibilidade. Gráfico tem alternativa em texto linha a linha. Os medidores (`MetricGauge`, `ScoreMeter`, `QualityScale`) e a faixa de períodos (`PeriodStrip`) são só reforço visual: o valor e a qualidade aparecem sempre em texto | `StatusBadge`, `ChoiceButton`, `DetalhesScreen`, `MetricGauge`, `PeriodStrip` | ok |
| RNF04 | Contrastes calculados (WCAG): texto 15,97:1; texto secundário 8,17:1; botão primário 6,70:1; Boa 7,03:1; Regular 7,78:1; Instável 6,85:1; borda de controle ≥ 3:1 | `theme.ts`, `domain/quality.ts` | ok |
| RNF05 | `ScrollView` em todas as telas e fonte do sistema respeitada (sem `allowFontScaling={false}`). Texto, botões e cartões não têm altura fixa. **Exceção:** as barras puramente decorativas (10 dp em `ScoreMeter`, `QualityScale` e `MetricGauge`; 48 dp em `PeriodStrip`) têm altura fixa, não contêm texto e ficam ocultas ao leitor de tela | `Screen`, `ScoreMeter`, `QualityScale`, `MetricGauge`, `PeriodStrip` | validar com fonte máxima |
| RNF06 | Só toque simples; sem arrastar, gesto ou multitoque | todas | ok |
| RNF07 | Glossário único; latência, perda e jitter explicados na P02 | `domain/glossary.ts`, `MetricCard` | ok |
| RNF08 | Ordem lógica; o `MetricGauge` e o `BestWindowCard` são lidos como um único elemento com rótulo falado (valor, unidade e qualidade); a `PeriodStrip` é escondida do leitor e o resumo em texto traz as mesmas informações; `announceForAccessibility` quando a previsão é atualizada, no resultado da atividade, no carregamento e no erro | telas, `StateViews` | validar |
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
