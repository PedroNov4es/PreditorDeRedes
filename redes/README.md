# Redes de Computadores: monitoramento ICMP e predição de falhas

Coletor em **Python (somente biblioteca padrão)** que implementa o desenho do material da professora
Denise Braito: rajadas ICMP, jitter RFC 3550, baseline com desvio padrão, mudança de rota e painel
verde/amarelo/vermelho, com persistência em SQLite.

```text
[ Agente em 2º plano ] -- a cada 5 min --> [ 15 pings, 1 por segundo ]
         |                                         |
         v                                         v
 [ SQLite: metricas_locais ] <-- RTT médio, jitter (RFC 3550), perda
         |
         +--> após 5 dias: baselines (média e desvio padrão do RTT)
         +--> a cada rajada: classificador -> estados (ESTÁVEL / EM RISCO / COM FALHA / ROTA ALTERADA)
                                              -> painel (VERDE / AMARELO / VERMELHO)
```

## Uso

Requer Python 3.9+ e o comando `ping` do sistema. Rode dentro da pasta `redes/`.

```bash
python -m preditor_icmp demo                          # simulação completa, sem rede (ótima para o vídeo)
python -m preditor_icmp host-add gateway 192.168.0.1  # RF01: cadastra host (resolve DNS uma única vez)
python -m preditor_icmp host-add google 8.8.8.8
python -m preditor_icmp coletar                       # RF02/RF03: 15 pings a cada 5 min, em segundo plano
python -m preditor_icmp status google                 # baseline, últimos estados e mensagem do painel
python -m preditor_icmp baseline google --forcar      # calcula o baseline agora (para testar)
python -m preditor_icmp exportar google metricas.csv  # RF05: histórico em CSV
python -m unittest discover -s tests -t .             # 21 testes
```

Para uma demonstração rápida com rede real: `coletar --intervalo 20 --pings 5 --intervalo-pings 1 --min-rajadas 5`
e `host-add ... --baseline-dias 0.003` (cerca de 4 minutos de aprendizado).

## Como cada módulo se liga ao material

| Módulo | O que faz | Origem no material |
|---|---|---|
| `metricas.py` | `jitter_rfc3550` (peso 1/16), média e desvio padrão | "Cálculo do Jitter Técnico (RFC 3550)" |
| `coletor.py` | ping por IP, rajada de 15 pings, interpreta saídas pt-BR/en/Linux | "Passo 1: O Coletor" |
| `baseline.py` | média, desvio padrão, teto 2σ/3σ, ignora rajadas sem resposta | "Regra dos Três Sigmas" |
| `classificador.py` | estados, painel com persistência, recalibração | "Árvore de decisão", "Painel Visual e Alertas" |
| `armazenamento.py` | SQLite: `hosts`, `metricas_locais`, `baselines`, `estados` | "Arquitetura de Coleta e Armazenamento" |
| `servico.py` | ciclo completo e threads por host (segundo plano) | "Execução em Segundo Plano" |
| `demo.py` | 5 dias de baseline + cenários (normal, congestionamento, queda, rota alterada) | "Considerações finais" (SP → Espanha → RJ) |

## Regras de classificação (todas do material)

| | Estável | Em risco | Com falha |
|---|---|---|---|
| Perda de pacotes | ≤ 0,5 % | 0,5 a 2 % | > 2 % ou 100 % (queda total) |
| Jitter (RFC 3550) | ≤ 20 ms | 20 a 50 ms | > 50 ms |
| RTT contra o baseline | até média + 2σ | acima de média + 2σ | n/a (ver abaixo) |

- **Rota alterada:** RTT fora de média ± 3σ **com perda ≤ 0,5 % e jitter ≤ 20 ms** não é falha; é mudança de caminho.
  Se isso se mantém por **1 hora** (12 rajadas), o baseline antigo é descartado e um novo aprendizado de 24 h começa.
- **Painel (semáforo com persistência):** vermelho = queda total agora, ou 3 ciclos seguidos com falha; amarelo = 2 ciclos
  seguidos em risco ou falha; verde nos demais casos (um pico isolado não alarma).
- O RTT bruto nunca é comparado a um valor fixo: uma rota Brasil ⇄ EUA com 150 ms estável é saudável.

## Decisões de implementação (onde o código vai além do material)

1. **Perda medida na janela da última hora (12 rajadas = 180 pings).** Com 15 pings por rajada, qualquer perda vale ≥ 6,7 %,
   o que tornaria a faixa "em risco" (0,5 a 2 %) inalcançável. A queda total continua sendo decidida pela rajada.
   `Config(janela_perda_rajadas=1)` reproduz o comportamento por rajada.
2. **Rajada sem resposta grava `NULL`** em `rtt_medio` (e não 0,0), para nunca contaminar média e desvio padrão.
3. **Baseline sobre o RTT médio de cada rajada** (1.440 linhas em 5 dias), coerente com o confronto, que também compara médias de rajada.
4. **Jitter RFC 3550** inicia com a primeira diferença, igual ao exemplo da professora (`[120,122,119,125,150,121]` → 5,31 ms).
5. **O ciclo desconta o tempo da rajada** (`Event.wait`), em vez de dormir um valor fixo de 285 s, e para com Ctrl+C.
6. **TTL é guardado** em cada rajada: uma mudança de TTL é um indício adicional de mudança de rota (e aparece no Packet Tracer).
7. `--desvio-minimo` (padrão 0, como no material) evita falsos alarmes em rotas muito estáveis, em que o desvio padrão
   do RTT médio chega a décimos de milissegundo. Para uso real, 1 a 2 ms é um bom valor.

## Limitações

- O `ping` é executado pelo sistema operacional (`subprocess`); precisa estar instalado e permitido.
- ICMP pode ser bloqueado ou limitado por roteadores (como o salto 2 do `pathping` do material). Prefira monitorar o gateway e um host externo.
- A coleta real de 5 dias exige o computador ligado. Use `demo` e as opções de coleta rápida para apresentações.
- Não há integração automática com a API Java (que é simulada); os dados saem por CSV (`exportar`) e pelo SQLite.

Guias relacionados: [`PACKET_TRACER.md`](PACKET_TRACER.md) e [`ROTEIRO_VIDEO.md`](ROTEIRO_VIDEO.md).
