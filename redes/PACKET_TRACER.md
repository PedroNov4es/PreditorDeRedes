# Cenário no Packet Tracer (entrega de Redes de Computadores)

Objetivo: montar uma rede local com arquitetura TCP/IP que reproduza os quatro estados do preditor
(normal, rota alterada, instável, falha) e comparar com o monitoramento real.

> O arquivo pronto está em [`packet-tracer/SentinelaDeRedes.pkt`](packet-tracer/SentinelaDeRedes.pkt) (abre no Packet Tracer 9). As configurações dos roteadores estão em `packet-tracer/R-*.txt` e os comandos dos cenários em `packet-tracer/cenarios.txt`. Este guia traz topologia, endereçamento e todos os comandos para refazer.

## 1. Topologia (SP ⇄ RJ, com desvio pela Espanha)

```text
 [PC-SP1] [Servidor]            [PC-RJ1]
     \     /                        |
   [SW-SP] ---- R-SP ======== R-RJ ---- [SW-RJ]
              g0/0   g0/1  g0/1   g0/0
                  \              /
                   g0/2      g0/2
                     \       /
                      R-ESP
                  (caminho longo)
```

- Roteadores **2911** (3 portas GigabitEthernet), switches **2960**, PCs e 1 servidor.
- `R-SP g0/1 ⇄ R-RJ g0/1`: link direto (rota curta, custo OSPF 10).
- `R-SP g0/2 ⇄ R-ESP g0/0` e `R-ESP g0/1 ⇄ R-RJ g0/2`: caminho longo (custo 100 + 100).

## 2. Endereçamento

| Rede | Faixa | Equipamentos |
|---|---|---|
| LAN SP | 192.168.10.0/24 | R-SP g0/0 = .1 · Servidor = .10 · PC-SP1 = .20 |
| LAN RJ | 192.168.20.0/24 | R-RJ g0/0 = .1 · PC-RJ1 = .20 |
| Link direto | 10.0.0.0/30 | R-SP g0/1 = .1 · R-RJ g0/1 = .2 |
| SP ⇄ ESP | 10.0.1.0/30 | R-SP g0/2 = .1 · R-ESP g0/0 = .2 |
| ESP ⇄ RJ | 10.0.2.0/30 | R-ESP g0/1 = .1 · R-RJ g0/2 = .2 |

Gateways: PC e servidor de SP usam 192.168.10.1; PC de RJ usa 192.168.20.1. DNS dos PCs: 192.168.10.10.

## 3. Configuração dos roteadores

**R-SP**
```text
enable
configure terminal
hostname R-SP
interface g0/0
 ip address 192.168.10.1 255.255.255.0
 no shutdown
interface g0/1
 ip address 10.0.0.1 255.255.255.252
 ip ospf cost 10
 no shutdown
interface g0/2
 ip address 10.0.1.1 255.255.255.252
 ip ospf cost 100
 no shutdown
router ospf 1
 network 192.168.10.0 0.0.0.255 area 0
 network 10.0.0.0 0.0.0.3 area 0
 network 10.0.1.0 0.0.0.3 area 0
end
write memory
```

**R-RJ**
```text
enable
configure terminal
hostname R-RJ
interface g0/0
 ip address 192.168.20.1 255.255.255.0
 no shutdown
interface g0/1
 ip address 10.0.0.2 255.255.255.252
 ip ospf cost 10
 no shutdown
interface g0/2
 ip address 10.0.2.2 255.255.255.252
 ip ospf cost 100
 no shutdown
router ospf 1
 network 192.168.20.0 0.0.0.255 area 0
 network 10.0.0.0 0.0.0.3 area 0
 network 10.0.2.0 0.0.0.3 area 0
end
write memory
```

**R-ESP**
```text
enable
configure terminal
hostname R-ESP
interface g0/0
 ip address 10.0.1.2 255.255.255.252
 ip ospf cost 100
 no shutdown
interface g0/1
 ip address 10.0.2.1 255.255.255.252
 ip ospf cost 100
 no shutdown
router ospf 1
 network 10.0.1.0 0.0.0.3 area 0
 network 10.0.2.0 0.0.0.3 area 0
end
write memory
```

Verificação: `show ip route ospf` em R-SP deve listar 192.168.20.0/24 via 10.0.0.2 (custo 11).

## 4. Serviços no servidor (camada de aplicação)

Servidor 192.168.10.10, aba **Services**:

| Serviço | Configuração |
|---|---|
| DNS | Registro A `monitor.local` → 192.168.10.10 |
| HTTP / HTTPS | Ligados (página padrão ou editada) |
| FTP | Ligado, usuário `aluno` / senha `redes` com permissão total |

## 5. Protocolos por camada (para mostrar no modo Simulation)

| Camada | Protocolos | Onde observar |
|---|---|---|
| Aplicação | HTTP/HTTPS, DNS, FTP | No PC-SP1, abrir `http://monitor.local`, `ftp 192.168.10.10` |
| Transporte | TCP (HTTP, FTP), UDP (DNS) | Modo Simulation → filtros → clique no pacote → "OSI Model" |
| Rede | IPv4, ICMP, OSPF | `ping`, `tracert`, `show ip route`, `show ip ospf neighbor` |
| Rede (IPv6, opcional) | IPv6 dual-stack | `ipv6 unicast-routing` e endereços 2001:db8:10::/64 nas LANs |
| Enlace | ARP, Ethernet | `arp -a` no PC; `show mac address-table` no switch |

## 6. Cenários de teste e o que esperar

Em todos, use o PC-SP1: `ping -n 20 192.168.20.20` e `tracert 192.168.20.20`.

| # | Cenário | Como provocar | Resultado esperado | Estado do preditor |
|---|---|---|---|---|
| 1 | Normal | Nada | 0 % de perda, **TTL=126**, tracert com 3 saltos | ESTÁVEL |
| 2 | Rota alterada | `interface g0/1` → `shutdown` em R-SP | OSPF reconverge pelo caminho longo; **TTL=125**, tracert com 4 saltos, sem perda após a convergência | ROTA ALTERADA |
| 3 | Falha (queda total) | Desligar também `g0/2` de R-SP | "Request timed out" em 100 % | COM FALHA (painel vermelho) |
| 4 | Instável (perda parcial) | `shutdown` e `no shutdown` em `g0/0` do R-RJ durante um `ping -t` | Respostas TTL=126 intercaladas com "Destination host unreachable" | EM RISCO / COM FALHA conforme a perda |
| 5 | Loop de roteamento | Rotas estáticas para uma rede inexistente (192.168.99.0/24) apontando uma para a outra (abaixo) | `tracert` alternando entre R-SP e R-RJ até 30 saltos; ping sem resposta | falha de roteamento (TTL esgotado) |

Perda parcial (cenário 4): no CLI do R-RJ entre em `interface g0/0`, rode `ping -t 192.168.20.20` no PC-SP1 e alterne `shutdown` / `no shutdown` (cerca de 5 s entre eles).
Termine sempre com `no shutdown`. Não use a ACL `deny icmp any any echo`: ela bloqueia 100 % dos pings, e não uma parte deles.

Loop (cenário 5), com o OSPF ligado e uma rede que não existe (a rota estática para 192.168.20.0 não funciona, pois essa rede está conectada ao R-RJ e vence a estática):
```text
R-SP: ip route 192.168.99.0 255.255.255.0 10.0.0.2
R-RJ: ip route 192.168.99.0 255.255.255.0 10.0.0.1
```
No PC-SP1: `ping 192.168.99.1` e `tracert 192.168.99.1`. Limpe com `no ip route 192.168.99.0 255.255.255.0 ...` nos dois roteadores.

### Resultados obtidos no simulador

| # | Cenário | Resultado |
|---|---|---|
| 1 | Normal | 20/20 respostas, 0 % de perda, TTL=126, 3 saltos |
| 2 | Rota alterada | 20/20 respostas, 0 % de perda, TTL=125, 4 saltos (via 10.0.1.2 e 10.0.2.2) |
| 3 | Queda total | 0/20 respostas, 100 % de perda, "Destination host unreachable" de 192.168.10.1 |
| 4 | Perda parcial | 264/316 respostas, 52 perdidos (17 % de perda) |
| 5 | Loop | ping 100 % de perda; tracert alterna entre R-SP e R-RJ até 30 saltos |

> **Limite do simulador:** o Packet Tracer não modela atraso por distância nem jitter realista, então o RTT em ms varia pouco.
> A mudança de rota aparece pelo **TTL** e pelos **saltos do tracert**. Por isso o coletor guarda o TTL de cada rajada.
> Perda e queda total são reproduzidas com `shutdown`, ACL e loop.

## 7. Validação: ocorrência real × simulador

| Situação | Real (coletor Python, `status`) | Simulador (Packet Tracer) | Coincide? |
|---|---|---|---|
| Rede saudável | ESTÁVEL, perda 0 % | Cenário 1 | |
| Rota diferente | ROTA ALTERADA, TTL mudou | Cenário 2 | |
| Queda total | COM FALHA, painel vermelho | Cenário 3 | |
| Perda parcial | EM RISCO | Cenário 4 | |
| TTL esgotado | linha "TTL expirado em trânsito" tratada como perda | Cenário 5 | |

Preencha a coluna "Coincide?" com prints do `ping`/`tracert` no PT e a saída de `status` do coletor.
Para o real, use `host-add gateway 192.168.0.1` e `host-add google 8.8.8.8`.
