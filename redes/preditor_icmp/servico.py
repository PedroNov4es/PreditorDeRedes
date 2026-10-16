"""Serviço de monitoramento: um ciclo = rajada -> salvar -> baseline -> classificar -> painel."""
from __future__ import annotations

import math
import socket
import threading
import time
from dataclasses import dataclass
from typing import Callable, Iterable, Optional

from .armazenamento import Banco, Host
from .baseline import Baseline, DadosInsuficientes, calcular_baseline
from .classificador import Estado, Painel, Parecer, classificar_rajada, deve_recalibrar, estado_painel
from .coletor import Rajada, executar_rajada


@dataclass(frozen=True)
class Config:
    quantidade_pings: int = 15          # pings por rajada
    intervalo_pings_s: float = 1.0      # intervalo dentro da rajada
    intervalo_ciclo_s: float = 300.0    # início de uma rajada ao início da próxima (5 min)
    min_rajadas_baseline: int = 10
    desvio_minimo_ms: float = 0.0
    janela_perda_rajadas: int = 12      # perda medida sobre a última hora (12 x 15 pings)
    baseline_rapido_dias: float = 1.0   # recalibração após mudança de rota (24 a 48 h)

    @property
    def rajadas_por_hora(self) -> int:
        return max(1, math.ceil(3600 / self.intervalo_ciclo_s))


@dataclass(frozen=True)
class ResultadoCiclo:
    rajada: Rajada
    parecer: Parecer
    painel: Painel
    perda_janela_pct: float
    baseline: Optional[Baseline]
    baseline_novo: bool = False
    recalibracao_iniciada: bool = False


def resolver_ip(destino: str) -> str:
    """Resolve o nome uma única vez: o monitoramento usa o IP, não o DNS."""
    try:
        return socket.gethostbyname(destino)
    except socket.gaierror as erro:
        raise ValueError(f"Não foi possível resolver '{destino}'.") from erro


def cadastrar_host(banco: Banco, nome: str, destino: str, agora: float, baseline_dias: float = 5.0) -> Host:
    return banco.adicionar_host(nome, destino, resolver_ip(destino), agora, baseline_dias)


def tentar_gerar_baseline(banco: Banco, host: Host, agora: float, cfg: Config, forcar: bool = False) -> Optional[Baseline]:
    """Gera o baseline quando a janela de aprendizado terminou (ou `forcar`)."""
    if not forcar and agora - host.baseline_inicio < host.baseline_dias * 86400:
        return None
    rajadas = banco.rajadas(host.id, desde=host.baseline_inicio)
    try:
        baseline = calcular_baseline(rajadas, cfg.min_rajadas_baseline, cfg.desvio_minimo_ms)
    except DadosInsuficientes:
        return None
    banco.salvar_baseline(host.id, baseline, agora)
    return baseline


def processar_rajada(banco: Banco, host: Host, rajada: Rajada, cfg: Config = Config(), agora: Optional[float] = None) -> ResultadoCiclo:
    """Salva a rajada, atualiza baseline e devolve o parecer + painel."""
    agora = rajada.timestamp if agora is None else agora
    host = banco.obter_host(host.nome) or host  # janela de baseline pode ter mudado (recalibração)
    banco.salvar_rajada(host.id, rajada)

    baseline = banco.baseline_ativo(host.id)
    baseline_novo = False
    if baseline is None:
        baseline = tentar_gerar_baseline(banco, host, agora, cfg)
        baseline_novo = baseline is not None

    recentes = banco.rajadas(host.id, ultimas=cfg.janela_perda_rajadas)
    enviados = sum(r.enviados for r in recentes)
    perdidos = sum(r.enviados - r.recebidos for r in recentes)
    perda_janela = round(perdidos / enviados * 100.0, 2) if enviados else 0.0

    parecer = classificar_rajada(rajada, baseline, perda_pct=perda_janela)

    historico = [Estado(l["estado"]) for l in banco.ultimos_estados(host.id, cfg.rajadas_por_hora - 1)] + [parecer.estado]
    painel = estado_painel(historico[-3:], queda_total_agora=rajada.queda_total)
    banco.salvar_estado(host.id, rajada.timestamp, parecer.estado.value, painel.value, parecer.motivo)

    recalibrar = False
    if baseline is not None and deve_recalibrar(historico, cfg.rajadas_por_hora):
        linhas = banco.ultimos_estados(host.id, cfg.rajadas_por_hora)
        inicio = linhas[0]["timestamp"] if linhas else agora
        banco.descartar_baseline(host.id)
        banco.definir_janela_baseline(host.id, inicio, cfg.baseline_rapido_dias)
        recalibrar = True

    return ResultadoCiclo(rajada, parecer, painel, perda_janela, baseline, baseline_novo, recalibrar)


def executar_ciclo(banco: Banco, host: Host, cfg: Config = Config(), **kwargs) -> ResultadoCiclo:
    """Um ciclo completo com ping real. `kwargs`: ping, dormir, agora (para testes)."""
    rajada = executar_rajada(host.ip, cfg.quantidade_pings, cfg.intervalo_pings_s, **kwargs)
    return processar_rajada(banco, host, rajada, cfg)


def rodar(
    caminho_banco: str,
    nomes: Iterable[str],
    cfg: Config,
    parar: threading.Event,
    ao_concluir: Callable[[Host, ResultadoCiclo], None],
    ao_erro: Callable[[Host, Exception], None] = lambda host, erro: None,
) -> list[threading.Thread]:
    """Uma thread de segundo plano por host; cada uma com sua conexão SQLite."""

    def laco(nome: str) -> None:
        with Banco(caminho_banco) as banco:
            host = banco.obter_host(nome)
            if host is None:
                return
            while not parar.is_set():
                inicio = time.monotonic()
                try:
                    ao_concluir(host, executar_ciclo(banco, host, cfg))
                except Exception as erro:  # mantém o serviço vivo
                    ao_erro(host, erro)
                # desconta o tempo gasto na rajada: o ciclo começa a cada 5 min
                parar.wait(max(0.0, cfg.intervalo_ciclo_s - (time.monotonic() - inicio)))

    threads = [threading.Thread(target=laco, args=(n,), daemon=True, name=f"monitor-{n}") for n in nomes]
    for t in threads:
        t.start()
    return threads
