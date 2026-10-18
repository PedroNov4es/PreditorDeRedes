"""Simulação completa (sem rede): 5 dias de baseline + cenários do material da professora.

Usa o MESMO código do serviço real (consolidar -> processar_rajada), mas com pings
sintéticos e relógio simulado, para demonstrar rapidamente os estados no vídeo e nos testes.
"""
from __future__ import annotations

import random
from datetime import datetime
from typing import Callable, Optional

from .armazenamento import Banco
from .coletor import Resposta, consolidar
from .servico import Config, ResultadoCiclo, processar_rajada


def executar_demo(imprimir: Callable[[str], None] = print, semente: int = 42) -> dict[str, ResultadoCiclo]:
    rng = random.Random(semente)
    cfg = Config()
    banco = Banco(":memory:")
    inicio = datetime(2026, 10, 1, 0, 0).timestamp()
    host = banco.adicionar_host("rota-longa", "192.0.2.10", "192.0.2.10", inicio)
    relogio = [inicio]
    resultados: dict[str, ResultadoCiclo] = {}

    def rajada(media: float, ruido: float, perdidos: int = 0, total: bool = False) -> ResultadoCiclo:
        n = cfg.quantidade_pings
        quais = set(range(n)) if total else set(rng.sample(range(n), perdidos))
        respostas: list[Optional[Resposta]] = [
            None if i in quais else Resposta(max(1.0, round(rng.gauss(media, ruido), 1)), 112) for i in range(n)
        ]
        resultado = processar_rajada(banco, host, consolidar(respostas, relogio[0]), cfg)
        relogio[0] += cfg.intervalo_ciclo_s
        return resultado

    def linha(rotulo: str, r: ResultadoCiclo) -> None:
        rtt = "—" if r.rajada.rtt_medio is None else f"{r.rajada.rtt_medio:7.1f}"
        imprimir(
            f"{rotulo:<26} RTT {rtt} ms | jitter {r.rajada.jitter:5.1f} | perda rajada {r.rajada.perda_pct:5.1f}% "
            f"(janela {r.perda_janela_pct:4.2f}%) | {r.parecer.estado.value:<13} | painel {r.painel.value}"
        )

    imprimir("== FASE 1: aprendizado do baseline (5 dias, 288 rajadas/dia) ==")
    for _ in range(5 * 288 + 1):
        r = rajada(180.0, 1.5)
        if r.baseline_novo and r.baseline:
            b = r.baseline
            imprimir(
                f"Baseline gerado: média {b.media} ms | desvio {b.desvio_padrao} ms | "
                f"teto 2σ {b.teto_2sigma:.2f} ms | teto 3σ {b.teto_3sigma:.2f} ms | {b.n_rajadas} rajadas"
            )
    imprimir("")
    imprimir("== FASE 2: monitoramento em tempo real (dia 6) ==")

    resultados["normal"] = rajada(180.0, 1.5)
    linha("A) rota normal", resultados["normal"])

    for i in range(3):
        r = rajada(196.0, 28.0, perdidos=1)
        linha(f"B) congestionamento #{i + 1}", r)
        resultados[f"congestionamento{i + 1}"] = r

    for _ in range(12):
        rajada(180.0, 1.5)  # volta ao normal

    resultados["queda"] = rajada(0, 0, total=True)
    linha("C) queda total", resultados["queda"])
    for _ in range(12):
        rajada(180.0, 1.5)

    imprimir("")
    imprimir("== FASE 3: a rota mudou (SP -> Espanha -> RJ voltou a ser SP -> RJ direto) ==")
    for i in range(cfg.rajadas_por_hora):
        r = rajada(12.0, 1.0)
        if i in (0, cfg.rajadas_por_hora - 1):
            linha(f"D) rota direta #{i + 1}", r)
            resultados[f"rota{i + 1}"] = r
    if r.recalibracao_iniciada:
        imprimir("-> Mudança de rota confirmada por 1 hora: baseline antigo descartado; novo aprendizado de 24 h iniciado.")
    for _ in range(288):
        r = rajada(12.0, 1.0)
        if r.baseline_novo and r.baseline:
            imprimir(f"Novo baseline: média {r.baseline.media} ms | desvio {r.baseline.desvio_padrao} ms")
    resultados["apos_recalibrar"] = rajada(12.0, 1.0)
    linha("E) após recalibrar", resultados["apos_recalibrar"])
    banco.fechar()
    return resultados
