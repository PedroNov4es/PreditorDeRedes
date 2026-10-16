"""Persistência em SQLite (nativo do Python): hosts, métricas por rajada, baselines e estados."""
from __future__ import annotations

import csv
import sqlite3
from dataclasses import dataclass
from typing import Iterable, Optional

from .baseline import Baseline
from .coletor import Rajada

ESQUEMA = """
CREATE TABLE IF NOT EXISTS hosts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nome            TEXT NOT NULL UNIQUE,
    destino         TEXT NOT NULL,          -- como o usuário informou (nome ou IP)
    ip              TEXT NOT NULL,          -- IP monitorado (resolvido uma vez)
    criado_em       REAL NOT NULL,
    baseline_inicio REAL NOT NULL,          -- início da janela de aprendizado
    baseline_dias   REAL NOT NULL           -- duração da janela (5 dias; 1 na recalibração)
);
CREATE TABLE IF NOT EXISTS metricas_locais (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id     INTEGER NOT NULL REFERENCES hosts(id),
    timestamp   REAL NOT NULL,
    enviados    INTEGER NOT NULL,
    recebidos   INTEGER NOT NULL,
    rtt_medio   REAL,                       -- NULL = rajada sem nenhuma resposta
    rtt_min     REAL,
    rtt_max     REAL,
    jitter      REAL NOT NULL,              -- RFC 3550
    perda_pct   REAL NOT NULL,
    ttl         INTEGER
);
CREATE INDEX IF NOT EXISTS idx_metricas_host_tempo ON metricas_locais(host_id, timestamp);
CREATE TABLE IF NOT EXISTS baselines (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id       INTEGER NOT NULL REFERENCES hosts(id),
    calculado_em  REAL NOT NULL,
    ativo         INTEGER NOT NULL DEFAULT 1,
    media         REAL NOT NULL,
    desvio_padrao REAL NOT NULL,
    jitter_medio  REAL NOT NULL,
    perda_media   REAL NOT NULL,
    n_rajadas     INTEGER NOT NULL,
    inicio        REAL NOT NULL,
    fim           REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS estados (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id   INTEGER NOT NULL REFERENCES hosts(id),
    timestamp REAL NOT NULL,
    estado    TEXT NOT NULL,
    painel    TEXT NOT NULL,
    motivo    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_estados_host_tempo ON estados(host_id, timestamp);
"""


@dataclass(frozen=True)
class Host:
    id: int
    nome: str
    destino: str
    ip: str
    criado_em: float
    baseline_inicio: float
    baseline_dias: float


class Banco:
    """Uma conexão por thread: crie um `Banco` dentro de cada thread de coleta."""

    def __init__(self, caminho: str = "preditor.db") -> None:
        self.conexao = sqlite3.connect(caminho, timeout=30)
        self.conexao.row_factory = sqlite3.Row
        if caminho != ":memory:":
            self.conexao.execute("PRAGMA journal_mode=WAL")
        self.conexao.executescript(ESQUEMA)

    def __enter__(self) -> "Banco":
        return self

    def __exit__(self, *_: object) -> None:
        self.fechar()

    def fechar(self) -> None:
        self.conexao.close()

    # ---- hosts (RF01) ----
    def adicionar_host(self, nome: str, destino: str, ip: str, agora: float, baseline_dias: float = 5.0) -> Host:
        with self.conexao:
            self.conexao.execute(
                "INSERT INTO hosts (nome, destino, ip, criado_em, baseline_inicio, baseline_dias) VALUES (?,?,?,?,?,?)",
                (nome, destino, ip, agora, agora, baseline_dias),
            )
        return self.obter_host(nome)  # type: ignore[return-value]

    def obter_host(self, nome: str) -> Optional[Host]:
        linha = self.conexao.execute("SELECT * FROM hosts WHERE nome = ?", (nome,)).fetchone()
        return Host(**dict(linha)) if linha else None

    def listar_hosts(self) -> list[Host]:
        return [Host(**dict(l)) for l in self.conexao.execute("SELECT * FROM hosts ORDER BY nome")]

    def definir_janela_baseline(self, host_id: int, inicio: float, dias: float) -> None:
        with self.conexao:
            self.conexao.execute(
                "UPDATE hosts SET baseline_inicio = ?, baseline_dias = ? WHERE id = ?", (inicio, dias, host_id)
            )

    # ---- métricas (RF03) ----
    def salvar_rajada(self, host_id: int, r: Rajada) -> None:
        with self.conexao:
            self.conexao.execute(
                "INSERT INTO metricas_locais (host_id, timestamp, enviados, recebidos, rtt_medio, rtt_min, rtt_max, jitter, perda_pct, ttl)"
                " VALUES (?,?,?,?,?,?,?,?,?,?)",
                (host_id, r.timestamp, r.enviados, r.recebidos, r.rtt_medio, r.rtt_min, r.rtt_max, r.jitter, r.perda_pct, r.ttl),
            )

    def rajadas(self, host_id: int, desde: Optional[float] = None, ultimas: Optional[int] = None) -> list[Rajada]:
        sql = "SELECT * FROM metricas_locais WHERE host_id = ?"
        params: list[object] = [host_id]
        if desde is not None:
            sql += " AND timestamp >= ?"
            params.append(desde)
        if ultimas is not None:
            sql = f"SELECT * FROM ({sql} ORDER BY timestamp DESC LIMIT ?) ORDER BY timestamp ASC"
            params.append(ultimas)
        else:
            sql += " ORDER BY timestamp ASC"
        return [
            Rajada(
                timestamp=l["timestamp"], enviados=l["enviados"], recebidos=l["recebidos"],
                rtt_medio=l["rtt_medio"], rtt_min=l["rtt_min"], rtt_max=l["rtt_max"],
                jitter=l["jitter"], perda_pct=l["perda_pct"], ttl=l["ttl"],
            )
            for l in self.conexao.execute(sql, params)
        ]

    # ---- baselines ----
    def salvar_baseline(self, host_id: int, b: Baseline, agora: float) -> None:
        with self.conexao:
            self.conexao.execute("UPDATE baselines SET ativo = 0 WHERE host_id = ?", (host_id,))
            self.conexao.execute(
                "INSERT INTO baselines (host_id, calculado_em, ativo, media, desvio_padrao, jitter_medio, perda_media, n_rajadas, inicio, fim)"
                " VALUES (?,?,1,?,?,?,?,?,?,?)",
                (host_id, agora, b.media, b.desvio_padrao, b.jitter_medio, b.perda_media, b.n_rajadas, b.inicio, b.fim),
            )

    def baseline_ativo(self, host_id: int) -> Optional[Baseline]:
        l = self.conexao.execute(
            "SELECT * FROM baselines WHERE host_id = ? AND ativo = 1 ORDER BY id DESC LIMIT 1", (host_id,)
        ).fetchone()
        if not l:
            return None
        return Baseline(
            media=l["media"], desvio_padrao=l["desvio_padrao"], jitter_medio=l["jitter_medio"],
            perda_media=l["perda_media"], n_rajadas=l["n_rajadas"], inicio=l["inicio"], fim=l["fim"],
        )

    def descartar_baseline(self, host_id: int) -> None:
        with self.conexao:
            self.conexao.execute("UPDATE baselines SET ativo = 0 WHERE host_id = ?", (host_id,))

    # ---- estados (RF04, RF05) ----
    def salvar_estado(self, host_id: int, timestamp: float, estado: str, painel: str, motivo: str) -> None:
        with self.conexao:
            self.conexao.execute(
                "INSERT INTO estados (host_id, timestamp, estado, painel, motivo) VALUES (?,?,?,?,?)",
                (host_id, timestamp, estado, painel, motivo),
            )

    def ultimos_estados(self, host_id: int, n: int) -> list[sqlite3.Row]:
        """Do mais antigo para o mais recente."""
        linhas = self.conexao.execute(
            "SELECT * FROM estados WHERE host_id = ? ORDER BY timestamp DESC, id DESC LIMIT ?", (host_id, n)
        ).fetchall()
        return list(reversed(linhas))

    def exportar_csv(self, host_id: int, caminho: str) -> int:
        """Exporta as métricas do host (RF05/RM07), uma linha por rajada."""
        linhas = self.rajadas(host_id)
        with open(caminho, "w", newline="", encoding="utf-8") as arquivo:
            escritor = csv.writer(arquivo)
            escritor.writerow(["timestamp", "enviados", "recebidos", "rtt_medio_ms", "rtt_min_ms", "rtt_max_ms", "jitter_ms", "perda_pct", "ttl"])
            for r in linhas:
                escritor.writerow([r.timestamp, r.enviados, r.recebidos, r.rtt_medio, r.rtt_min, r.rtt_max, r.jitter, r.perda_pct, r.ttl])
        return len(linhas)
