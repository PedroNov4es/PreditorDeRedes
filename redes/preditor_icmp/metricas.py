"""Cálculos estatísticos do material da professora (jitter RFC 3550, média e desvio padrão)."""
from __future__ import annotations

import math
from typing import Sequence


def jitter_rfc3550(rtts: Sequence[float]) -> float:
    """Jitter suavizado (peso 1/16), como no material de apoio.

    Requer os RTTs em ordem cronológica. J(i) = J(i-1) + (|D(i-1,i)| - J(i-1)) / 16,
    iniciando J com a primeira diferença absoluta (igual ao exemplo da professora).
    """
    if len(rtts) < 2:
        return 0.0
    jitter = 0.0
    for i in range(1, len(rtts)):
        diferenca = abs(rtts[i] - rtts[i - 1])
        jitter = diferenca if i == 1 else jitter + (diferenca - jitter) / 16.0
    return round(jitter, 2)


def jitter_medio_abs(rtts: Sequence[float]) -> float:
    """Jitter simples: média da diferença absoluta entre pings consecutivos."""
    if len(rtts) < 2:
        return 0.0
    difs = [abs(rtts[i] - rtts[i - 1]) for i in range(1, len(rtts))]
    return round(sum(difs) / len(difs), 2)


def media_desvio(valores: Sequence[float]) -> tuple[float, float]:
    """Média e desvio padrão populacional (divide por n, como no material)."""
    n = len(valores)
    if n == 0:
        return 0.0, 0.0
    media = sum(valores) / n
    variancia = sum((x - media) ** 2 for x in valores) / n
    return media, math.sqrt(variancia)
