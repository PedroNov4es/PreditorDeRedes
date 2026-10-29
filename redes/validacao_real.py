"""Reproduz a coluna "Real" da tabela real x simulador (PACKET_TRACER.md, seção 7).

Reclassifica as rajadas de dados/metricas_*.csv com as regras do coletor (baseline sobre todo o
histórico, perda medida na janela de 1 hora) e resume estados, TTL, perda e jitter.

Uso (dentro de redes/):  python validacao_real.py > dados/validacao_real.txt
"""
import csv
import collections
import datetime
import pathlib

from preditor_icmp.baseline import baseline_de_lista
from preditor_icmp.classificador import Estado, classificar_rajada
from preditor_icmp.coletor import Rajada

PASTA = pathlib.Path(__file__).parent / "dados"


def carregar(host):
    rajadas = []
    with open(PASTA / f"metricas_{host}.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            rajadas.append(Rajada(
                float(r["timestamp"]), int(r["enviados"]), int(r["recebidos"]),
                float(r["rtt_medio_ms"]) if r["rtt_medio_ms"] else None, None, None,
                float(r["jitter_ms"]), float(r["perda_pct"]), int(r["ttl"]) if r["ttl"] else None))
    return rajadas


for host in ("gateway", "google"):
    rs = carregar(host)
    base = baseline_de_lista([r.rtt_medio for r in rs if r.rtt_medio is not None])
    estados = []
    for i, r in enumerate(rs):
        janela = rs[max(0, i - 11):i + 1]
        env = sum(x.enviados for x in janela)
        perdidos = sum(x.enviados - x.recebidos for x in janela)
        estados.append(classificar_rajada(r, base, round(perdidos / env * 100, 2)).estado)
    dias = (rs[-1].timestamp - rs[0].timestamp) / 86400
    print(f"== {host}: {len(rs)} rajadas em {dias:.1f} dias")
    print(f"baseline: média {base.media} ms, desvio {base.desvio_padrao} ms, teto 2σ {base.teto_2sigma:.2f}, teto 3σ {base.teto_3sigma:.2f}")
    print("estados:", dict(collections.Counter(e.value for e in estados)))
    print("TTL observados:", dict(collections.Counter(r.ttl for r in rs)))
    print(f"rajadas com perda: {sum(r.perda_pct > 0 for r in rs)} | maior perda numa rajada: {max(r.perda_pct for r in rs)} %"
          f" | perda total: {sum(r.enviados - r.recebidos for r in rs) / sum(r.enviados for r in rs) * 100:.2f} %")
    print(f"rajadas com 100 % de perda (queda total): {sum(r.queda_total for r in rs)}")
    print(f"jitter > 20 ms: {sum(r.jitter > 20 for r in rs)} | jitter > 50 ms: {sum(r.jitter > 50 for r in rs)}")
    for r, e in zip(rs, estados):
        if e == Estado.ROTA_ALTERADA:
            quando = datetime.datetime.fromtimestamp(r.timestamp).strftime("%d/%m/%Y")
            print(f"ROTA ALTERADA em {quando}: RTT {r.rtt_medio} ms, jitter {r.jitter} ms, perda {r.perda_pct} %, TTL {r.ttl}")
