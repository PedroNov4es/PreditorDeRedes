"""Linha de comando: python -m preditor_icmp <comando>."""
from __future__ import annotations

import argparse
import sys
import threading
import time
from datetime import datetime

from .armazenamento import Banco
from .baseline import descrever
from .classificador import MENSAGEM_PAINEL, Painel
from .coletor import PingIndisponivel
from .demo import executar_demo
from .servico import Config, ResultadoCiclo, cadastrar_host, rodar, tentar_gerar_baseline


def _hora(ts: float) -> str:
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")


def _montar_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="preditor_icmp", description="Preditor de Falhas na Rede (ICMP)")
    p.add_argument("--banco", default="preditor.db", help="arquivo SQLite (padrão: preditor.db)")
    sub = p.add_subparsers(dest="comando", required=True)

    a = sub.add_parser("host-add", help="cadastra um host monitorado (RF01)")
    a.add_argument("nome")
    a.add_argument("destino", help="IP ou nome DNS (resolvido uma única vez)")
    a.add_argument("--baseline-dias", type=float, default=5.0, help="janela de aprendizado (padrão 5 dias)")

    sub.add_parser("host-list", help="lista os hosts")

    c = sub.add_parser("coletar", help="inicia o monitoramento em segundo plano (RF02, RF03)")
    c.add_argument("nomes", nargs="*", help="hosts (padrão: todos)")
    c.add_argument("--intervalo", type=float, default=300.0, help="segundos entre rajadas (padrão 300)")
    c.add_argument("--pings", type=int, default=15, help="pings por rajada (padrão 15)")
    c.add_argument("--intervalo-pings", type=float, default=1.0, help="segundos entre pings (padrão 1)")
    c.add_argument("--min-rajadas", type=int, default=10, help="mínimo de rajadas para o baseline")
    c.add_argument("--desvio-minimo", type=float, default=0.0, help="trava mínima do desvio padrão (ms)")

    b = sub.add_parser("baseline", help="calcula o baseline agora")
    b.add_argument("nome")
    b.add_argument("--forcar", action="store_true", help="ignora a janela de 5 dias")

    s = sub.add_parser("status", help="mostra baseline, últimos estados e painel")
    s.add_argument("nome")

    e = sub.add_parser("exportar", help="exporta as métricas em CSV")
    e.add_argument("nome")
    e.add_argument("arquivo")

    sub.add_parser("demo", help="simulação completa sem rede (baseline + cenários)")
    return p


def _exigir_host(banco: Banco, nome: str):
    host = banco.obter_host(nome)
    if host is None:
        print(f"Host '{nome}' não encontrado. Use host-add.", file=sys.stderr)
        raise SystemExit(2)
    return host


def main(argv: list[str] | None = None) -> int:
    args = _montar_parser().parse_args(argv)

    if args.comando == "demo":
        executar_demo()
        return 0

    if args.comando == "coletar":
        return _coletar(args)

    with Banco(args.banco) as banco:
        if args.comando == "host-add":
            try:
                host = cadastrar_host(banco, args.nome, args.destino, time.time(), args.baseline_dias)
            except ValueError as erro:
                print(erro, file=sys.stderr)
                return 2
            except Exception as erro:  # nome duplicado etc.
                print(f"Não foi possível cadastrar: {erro}", file=sys.stderr)
                return 2
            print(f"Host '{host.nome}' cadastrado: {host.destino} -> {host.ip}")
        elif args.comando == "host-list":
            for h in banco.listar_hosts():
                print(f"{h.nome:<20} {h.destino:<25} {h.ip:<16} baseline: {h.baseline_dias:g} dia(s) desde {_hora(h.baseline_inicio)}")
        elif args.comando == "baseline":
            host = _exigir_host(banco, args.nome)
            novo = tentar_gerar_baseline(banco, host, time.time(), Config(), forcar=args.forcar)
            print(descrever(novo) if novo else "Ainda não há dados suficientes (ou a janela de aprendizado não terminou). Use --forcar para testar.")
        elif args.comando == "status":
            host = _exigir_host(banco, args.nome)
            print(f"Host: {host.nome} ({host.ip})")
            print(f"Baseline: {descrever(banco.baseline_ativo(host.id))}")
            estados = banco.ultimos_estados(host.id, 5)
            if not estados:
                print("Sem leituras ainda.")
            for l in estados:
                print(f"  {_hora(l['timestamp'])}  {l['estado']:<13} painel {l['painel']:<8} {l['motivo']}")
            if estados:
                print(MENSAGEM_PAINEL[Painel(estados[-1]["painel"])])
        elif args.comando == "exportar":
            host = _exigir_host(banco, args.nome)
            print(f"{banco.exportar_csv(host.id, args.arquivo)} linhas exportadas para {args.arquivo}")
    return 0


def _coletar(args: argparse.Namespace) -> int:
    cfg = Config(
        quantidade_pings=args.pings,
        intervalo_pings_s=args.intervalo_pings,
        intervalo_ciclo_s=args.intervalo,
        min_rajadas_baseline=args.min_rajadas,
        desvio_minimo_ms=args.desvio_minimo,
    )
    with Banco(args.banco) as banco:
        hosts = banco.listar_hosts()
    nomes = args.nomes or [h.nome for h in hosts]
    if not nomes:
        print("Nenhum host cadastrado. Use host-add.", file=sys.stderr)
        return 2

    def concluiu(host, r: ResultadoCiclo) -> None:
        rtt = "sem resposta" if r.rajada.rtt_medio is None else f"{r.rajada.rtt_medio:.1f} ms"
        print(
            f"[{_hora(r.rajada.timestamp)}] {host.nome} ({host.ip}) RTT {rtt} | jitter {r.rajada.jitter:.1f} ms | "
            f"perda {r.rajada.perda_pct:.1f}% | {r.parecer.estado.value} | painel {r.painel.value}\n    {r.parecer.motivo}",
            flush=True,
        )
        if r.baseline_novo:
            print(f"    Baseline gerado: {descrever(r.baseline)}", flush=True)
        if r.recalibracao_iniciada:
            print("    Rota alterada de forma estável: baseline descartado, recalibrando.", flush=True)

    def falhou(host, erro: Exception) -> None:
        print(f"[{_hora(time.time())}] {host.nome}: erro na coleta: {erro}", file=sys.stderr, flush=True)
        if isinstance(erro, PingIndisponivel):
            parar.set()

    parar = threading.Event()
    print(f"Monitorando {', '.join(nomes)} a cada {cfg.intervalo_ciclo_s:g}s ({cfg.quantidade_pings} pings por rajada). Ctrl+C para parar.")
    threads = rodar(args.banco, nomes, cfg, parar, concluiu, falhou)
    try:
        while any(t.is_alive() for t in threads) and not parar.is_set():
            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\nEncerrando…")
    finally:
        parar.set()
        for t in threads:
            t.join(timeout=5)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
