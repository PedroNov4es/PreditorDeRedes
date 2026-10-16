"""Baseline dinâmico (perfil da rota): média e desvio padrão do RTT das rajadas."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Optional

from .coletor import Rajada
from .metricas import media_desvio


class DadosInsuficientes(ValueError):
    """Poucas rajadas válidas para gerar um baseline confiável."""


@dataclass(frozen=True)
class Baseline:
    media: float
    desvio_padrao: float
    jitter_medio: float
    perda_media: float
    n_rajadas: int
    inicio: float
    fim: float

    @property
    def teto_2sigma(self) -> float:
        return self.media + 2 * self.desvio_padrao

    @property
    def teto_3sigma(self) -> float:
        """Teto de alerta (Regra dos Três Sigmas)."""
        return self.media + 3 * self.desvio_padrao


def calcular_baseline(
    rajadas: Iterable[Rajada], min_rajadas: int = 10, desvio_minimo_ms: float = 0.0
) -> Baseline:
    """Calcula o baseline ignorando rajadas sem nenhuma resposta (não poluem a média).

    `desvio_minimo_ms` é uma trava opcional contra rotas "perfeitas" (desvio ~0), que
    gerariam alarmes por variações de 1 ms. O padrão 0 reproduz exatamente o material
    da professora; em produção, 1 a 2 ms é um bom valor.
    """
    lista = list(rajadas)
    validas = [r for r in lista if r.rtt_medio is not None]
    if len(validas) < min_rajadas:
        raise DadosInsuficientes(
            f"Dados insuficientes: {len(validas)} rajadas válidas (mínimo {min_rajadas})."
        )
    media, desvio = media_desvio([r.rtt_medio for r in validas])  # type: ignore[misc]
    return Baseline(
        media=round(media, 2),
        desvio_padrao=round(max(desvio, desvio_minimo_ms), 2),
        jitter_medio=round(sum(r.jitter for r in validas) / len(validas), 2),
        perda_media=round(sum(r.perda_pct for r in lista) / len(lista), 2),
        n_rajadas=len(validas),
        inicio=min(r.timestamp for r in lista),
        fim=max(r.timestamp for r in lista),
    )


def baseline_de_lista(rtts: list[float], min_rajadas: int = 10) -> Baseline:
    """Atalho para os exemplos do material: lista de RTTs -> Baseline."""
    rajadas = [Rajada(float(i), 15, 15, v, v, v, 0.0, 0.0) for i, v in enumerate(rtts)]
    return calcular_baseline(rajadas, min_rajadas)


def descrever(b: Optional[Baseline]) -> str:
    if b is None:
        return "baseline ainda não calculado"
    return (
        f"média {b.media} ms, desvio {b.desvio_padrao} ms, "
        f"teto 3σ {b.teto_3sigma:.2f} ms ({b.n_rajadas} rajadas)"
    )
