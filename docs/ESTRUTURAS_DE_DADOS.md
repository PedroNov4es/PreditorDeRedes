# Estruturas de dados do app

| Dado do tutorial | Estrutura no app | Onde | Uso no preditor |
|---|---|---|---|
| Histórico de medições/previsões | **Lista (array) de registros** `TimelineItem` (timestamp, latência, perda, qualidade) | `src/types/api.ts`, `useRequest` | análise temporal, lista de períodos |
| Histórico das últimas consultas | **Fila circular** `RingBuffer<RecentConsultation>` (capacidade 5) | `src/lib/ringBuffer.ts`, `SelectionContext` | "Consultas recentes" na P01 |
| Indicadores | **Registro de agregação** `TimelineSummary` (média, mín., máx., contagem por qualidade) | `src/lib/aggregate.ts` (`summarize`) | resumo do dia |
| Melhor janela | Varredura linear com **janelas consecutivas** | `bestWindow` | "Melhor janela: das 03:00 às 05:00" |
| Melhor horário por atividade | Varredura com filtro por qualidade mínima e máximo por *score* | `bestPeriodFor` | sugestão na P03 |
| Dicionários de domínio | `Record<Quality, ...>`, `Record<Activity, ...>` | `src/domain/quality.ts` | tradução para linguagem simples |

## Complexidade

| Operação | Custo |
|---|---|
| `RingBuffer.push` / `size` / `latest` | O(1) |
| `RingBuffer.toArray` | O(n), n ≤ 5 |
| `summarize`, `bestWindow`, `bestPeriodFor` | O(n), uma passagem, n ≤ 24 |

## Por que fila circular

O histórico de consultas recentes tem tamanho fixo. A fila circular reaproveita as posições:
quando está cheia, a nova consulta sobrescreve a mais antiga, sem realocar nem deslocar elementos.

Testes: `npm test` (`tests/logic.test.ts`).
