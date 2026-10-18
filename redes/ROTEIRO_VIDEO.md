# Roteiro do vídeo (Redes de Computadores)

**Regras da entrega:** 10 a 15 minutos · YouTube **não listado** · imagens ao fundo e apresentador em uma das
laterais da tela, sem cobrir o conteúdo · link entregue **somente pela atividade da Blackboard** ·
**prazo 10/11/2026, sem prorrogação** · até 3 tentativas, vale só a última · vale até 3,0 pontos na A2.
Sem entrega, ou entrega que impeça a visualização, a nota do projeto é zerada.

## Estrutura e tempo (alvo: 13 minutos)

| Tempo | Parte | O que mostrar e falar |
|---|---|---|
| 0:00–1:00 | **Introdução** | Capa com nome do projeto (Preditor de Falhas na Rede), integrantes e **RGMs** |
| 1:00–2:30 | **Objetivo** | O problema (indisponibilidade e degradação de enlaces), a pergunta norteadora ("como usar medições ICMP para antecipar sinais de falha?"), a solução (monitorar por ICMP, registrar, classificar OK/RISCO/FALHA) e a aplicação (app mobile + API) |
| 2:30–6:30 | **Desenvolvimento A: simulado** | Packet Tracer: topologia e endereçamento; protocolos por camada (HTTP/DNS/FTP, TCP/UDP, IPv4/ICMP/OSPF, ARP/Ethernet) no modo Simulation; cenários 1 a 5 do `PACKET_TRACER.md` com `ping`/`tracert` |
| 6:30–11:30 | **Desenvolvimento B: real** | Coletor Python: `host-add`, `coletar` (rajada de 15 pings), `status`; explicar RTT, TTL, jitter (RFC 3550), perda e baseline por desvio padrão; `demo` para mostrar os estados; depois o app mostrando previsão, detalhes e atividade |
| 11:30–12:15 | **Validação** | Tabela real × simulado: o que coincidiu e por quê |
| 12:15–13:30 | **Encerramento** | **Por que** o projeto deve ser aproveitado (diferenciais: classificação por comportamento e não por valor fixo, distingue rota longa saudável de rota degradada, acessibilidade) e conclusão |

## Pontos técnicos que valem nota (fale com suas palavras)

- **RTT** é o tempo de ida e volta; **TTL** limita os saltos (128 − 126 = 2 roteadores).
- RTT alto sozinho não indica falha: uma rota longa saudável tem RTT alto e **estável**. Falha = perda de pacotes e jitter alto.
- **Baseline dinâmico:** média e desvio padrão do próprio histórico, sem tabela externa. Limite = média + 3σ.
- **Jitter RFC 3550:** estimador suavizado com peso 1/16.
- **Mudança de rota ≠ falha:** RTT mudou muito, mas perda e jitter continuam baixos.
- **Rajadas** (15 pings a cada 5 min) evitam sobrecarregar a rede e permitem calcular jitter e perda.
- ICMP pode ser bloqueado em alguns saltos (falso positivo do `pathping`).

## Checklist de gravação

- [ ] Resolução 1080p, áudio claro, ensaio cronometrado (10 a 15 min).
- [ ] Apresentador numa lateral; Packet Tracer, terminal e app ao fundo, legíveis.
- [ ] Todos os integrantes falam, ou os nomes e RGMs aparecem na capa.
- [ ] Packet Tracer: cenários 1 a 5 executados com `ping` e `tracert` visíveis.
- [ ] Coletor real executado (ou `demo`) e app aberto com a API ou com dados simulados.
- [ ] Publicado como **não listado**; testar o link em janela anônima.
- [ ] Enviar na Blackboard antes de 10/11/2026 (não por e-mail ou mensagem).
