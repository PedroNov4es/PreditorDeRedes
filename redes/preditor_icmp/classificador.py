"""Classificação do estado da rede: ESTÁVEL, EM RISCO, COM FALHA ou ROTA ALTERADA.

Limiares do material da professora Denise Braito:
  perda   : estável <= 0,5 %  | risco 0,5 a 2 %   | falha > 2 %
  jitter  : estável <= 20 ms  | risco 20 a 50 ms  | falha > 50 ms (RFC 3550)
  RTT     : estável até média + 2σ | risco acima de média + 2σ
            variação > 3σ com perda e jitter baixos = mudança de rota (não é falha)
O RTT bruto nunca é comparado com um valor fixo: a distância física muda o "normal".
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Sequence

from .baseline import Baseline
from .coletor import Rajada

PERDA_ESTAVEL_MAX = 0.5
PERDA_RISCO_MAX = 2.0
JITTER_ESTAVEL_MAX = 20.0
JITTER_RISCO_MAX = 50.0


class Estado(str, Enum):
    ESTAVEL = "ESTÁVEL"
    EM_RISCO = "EM RISCO"
    COM_FALHA = "COM FALHA"
    ROTA_ALTERADA = "ROTA ALTERADA"

    @property
    def rotulo_projeto(self) -> str:
        """Nomes usados no tutorial do Projeto Integrador (OK, RISCO, FALHA)."""
        return {
            Estado.ESTAVEL: "OK",
            Estado.EM_RISCO: "RISCO",
            Estado.COM_FALHA: "FALHA",
            Estado.ROTA_ALTERADA: "ALTERADA",
        }[self]


class Painel(str, Enum):
    VERDE = "VERDE"
    AMARELO = "AMARELO"
    VERMELHO = "VERMELHO"


MENSAGEM_PAINEL = {
    Painel.VERDE: "Sua conexão está excelente e estável.",
    Painel.AMARELO: "Instabilidade detectada. A navegação ou jogos podem apresentar lentidão.",
    Painel.VERMELHO: "Falha crítica na rede detectada. Verifique seu cabeamento ou operadora.",
}


@dataclass(frozen=True)
class Parecer:
    estado: Estado
    motivo: str
    baseline_pronto: bool


def classificar_rajada(
    rajada: Rajada, baseline: Optional[Baseline], perda_pct: Optional[float] = None
) -> Parecer:
    """Parecer de UMA rajada.

    `perda_pct` permite avaliar a perda numa janela maior (ex.: última hora). Com 15
    pings por rajada, qualquer perda vale >= 6,7 %, e a faixa "em risco" (0,5 a 2 %)
    só é alcançável medindo a perda sobre mais pacotes. A queda total é sempre decidida
    pela própria rajada.
    """
    perda = rajada.perda_pct if perda_pct is None else perda_pct
    jitter = rajada.jitter
    pronto = baseline is not None

    if rajada.queda_total:
        return Parecer(Estado.COM_FALHA, "Link fora do ar (100% de perda na rajada).", pronto)

    if perda > PERDA_RISCO_MAX or jitter > JITTER_RISCO_MAX:
        return Parecer(
            Estado.COM_FALHA,
            f"Conexão altamente instável. Perda: {perda:.2f}% | Jitter: {jitter:.2f} ms.",
            pronto,
        )

    rtt = rajada.rtt_medio
    saudavel = perda <= PERDA_ESTAVEL_MAX and jitter <= JITTER_ESTAVEL_MAX

    if baseline is not None and rtt is not None:
        desvio_3s = 3 * baseline.desvio_padrao
        if abs(rtt - baseline.media) > desvio_3s and saudavel:
            sentido = "Aumento (rota mais longa)" if rtt > baseline.media else "Redução (rota mais curta)"
            return Parecer(
                Estado.ROTA_ALTERADA,
                f"{sentido}: o RTT mudou de {baseline.media} ms para {rtt} ms, mas o link está saudável.",
                pronto,
            )
        if rtt > baseline.teto_2sigma:
            return Parecer(
                Estado.EM_RISCO,
                f"Sinais de saturação: RTT {rtt} ms acima de média + 2σ ({baseline.teto_2sigma:.2f} ms).",
                pronto,
            )

    if not saudavel:
        return Parecer(
            Estado.EM_RISCO,
            f"Rota começando a oscilar. Perda: {perda:.2f}% | Jitter: {jitter:.2f} ms.",
            pronto,
        )

    motivo = "Rede dentro do padrão histórico." if pronto else "Dentro dos limites de perda e jitter (baseline em coleta)."
    return Parecer(Estado.ESTAVEL, motivo, pronto)


def estado_painel(recentes: Sequence[Estado], queda_total_agora: bool = False) -> Painel:
    """Semáforo com persistência de estado (do mais antigo para o mais recente).

    VERMELHO: queda total (100% de perda) agora, ou 3 ciclos seguidos com falha.
    AMARELO : 2 ciclos seguidos em risco ou falha.
    VERDE   : demais casos. Um pico isolado não dispara alarme.
    """
    if queda_total_agora:
        return Painel.VERMELHO
    if len(recentes) >= 3 and all(e == Estado.COM_FALHA for e in recentes[-3:]):
        return Painel.VERMELHO
    if len(recentes) >= 2 and all(e in (Estado.EM_RISCO, Estado.COM_FALHA) for e in recentes[-2:]):
        return Painel.AMARELO
    return Painel.VERDE


def deve_recalibrar(recentes: Sequence[Estado], rajadas_por_hora: int) -> bool:
    """True se a rota ficou 'alterada' por 1 hora seguida (RTT novo, mas saudável)."""
    n = max(1, math.ceil(rajadas_por_hora))
    return len(recentes) >= n and all(e == Estado.ROTA_ALTERADA for e in recentes[-n:])
