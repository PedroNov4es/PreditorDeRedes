"""Coleta ICMP em rajadas (burst sampling): 15 pings, 1 por segundo, a cada 5 minutos."""
from __future__ import annotations

import platform
import re
import subprocess
import time
from dataclasses import dataclass
from typing import Callable, Optional, Sequence

from .metricas import jitter_rfc3550

# "time=12ms", "time=12.3 ms", "tempo<1ms", "tempo=1,5 ms"
_RE_TEMPO = re.compile(r"(?:time|tempo)\s*([=<])\s*(\d+(?:[.,]\d+)?)\s*ms", re.IGNORECASE)
_RE_TTL = re.compile(r"ttl\s*=\s*(\d+)", re.IGNORECASE)


class PingIndisponivel(RuntimeError):
    """O comando `ping` não existe ou não pôde ser executado neste sistema."""


@dataclass(frozen=True)
class Resposta:
    rtt_ms: float
    ttl: Optional[int] = None


def interpretar_saida(texto: str) -> Optional[Resposta]:
    """Extrai RTT e TTL da saída do ping (pt-BR/en-US; Windows/Linux/macOS).

    Sem `time=`/`tempo=` não houve resposta válida (timeout, destino inacessível,
    TTL expirado em trânsito...) e o pacote conta como perdido.
    """
    achado = _RE_TEMPO.search(texto)
    if not achado:
        return None
    rtt = float(achado.group(2).replace(",", "."))
    ttl = _RE_TTL.search(texto)
    return Resposta(rtt_ms=rtt, ttl=int(ttl.group(1)) if ttl else None)


def comando_ping(ip: str, timeout_s: int = 2, sistema: Optional[str] = None) -> list[str]:
    sistema = (sistema or platform.system()).lower()
    if sistema == "windows":
        return ["ping", "-n", "1", "-w", str(timeout_s * 1000), ip]
    if sistema == "darwin":
        return ["ping", "-c", "1", "-W", str(timeout_s * 1000), ip]
    return ["ping", "-c", "1", "-W", str(timeout_s), ip]


def disparar_ping(ip: str, timeout_s: int = 2, executar: Callable = subprocess.run) -> Optional[Resposta]:
    """Dispara UM ping pelo terminal do sistema. None = pacote perdido."""
    try:
        resultado = executar(
            comando_ping(ip, timeout_s),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout_s + 2,
        )
    except subprocess.TimeoutExpired:
        return None
    except FileNotFoundError as erro:
        raise PingIndisponivel("O comando 'ping' não foi encontrado neste sistema.") from erro
    return interpretar_saida(resultado.stdout or "")


@dataclass
class Rajada:
    """Consolidado de uma rajada (uma linha de `metricas_locais`)."""

    timestamp: float
    enviados: int
    recebidos: int
    rtt_medio: Optional[float]  # None se todos os pacotes foram perdidos
    rtt_min: Optional[float]
    rtt_max: Optional[float]
    jitter: float
    perda_pct: float
    ttl: Optional[int] = None

    @property
    def queda_total(self) -> bool:
        return self.enviados > 0 and self.recebidos == 0


def consolidar(respostas: Sequence[Optional[Resposta]], timestamp: float) -> Rajada:
    enviados = len(respostas)
    validas = [r for r in respostas if r is not None]
    rtts = [r.rtt_ms for r in validas]
    ttls = [r.ttl for r in validas if r.ttl is not None]
    perda = ((enviados - len(validas)) / enviados * 100.0) if enviados else 0.0
    return Rajada(
        timestamp=timestamp,
        enviados=enviados,
        recebidos=len(validas),
        rtt_medio=round(sum(rtts) / len(rtts), 2) if rtts else None,
        rtt_min=min(rtts) if rtts else None,
        rtt_max=max(rtts) if rtts else None,
        jitter=jitter_rfc3550(rtts),
        perda_pct=round(perda, 2),
        ttl=ttls[-1] if ttls else None,
    )


def executar_rajada(
    ip: str,
    quantidade: int = 15,
    intervalo_s: float = 1.0,
    ping: Callable[[str], Optional[Resposta]] = disparar_ping,
    dormir: Callable[[float], None] = time.sleep,
    agora: Callable[[], float] = time.time,
) -> Rajada:
    """Dispara `quantidade` pings espaçados por `intervalo_s` e consolida a rodada.

    Sempre usa o IP (não o nome DNS), para não confundir mudança de DNS com mudança de rota.
    """
    inicio = agora()
    respostas: list[Optional[Resposta]] = []
    for i in range(quantidade):
        respostas.append(ping(ip))
        if i < quantidade - 1:
            dormir(intervalo_s)
    return consolidar(respostas, inicio)
