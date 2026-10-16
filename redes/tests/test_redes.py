import os
import tempfile
import unittest

from preditor_icmp.armazenamento import Banco
from preditor_icmp.baseline import DadosInsuficientes, baseline_de_lista, calcular_baseline
from preditor_icmp.classificador import Estado, Painel, classificar_rajada, deve_recalibrar, estado_painel
from preditor_icmp.coletor import Rajada, Resposta, comando_ping, consolidar, executar_rajada, interpretar_saida
from preditor_icmp.demo import executar_demo
from preditor_icmp.metricas import jitter_medio_abs, jitter_rfc3550, media_desvio
from preditor_icmp.servico import Config, processar_rajada

WIN_PT = "Resposta de 8.8.8.8: bytes=32 tempo=20ms TTL=112"
WIN_PT_MENOR = "Resposta de 192.168.0.1: bytes=32 tempo<1ms TTL=64"
WIN_EN = "Reply from 8.8.8.8: bytes=32 time=18ms TTL=112"
LINUX = "64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=12.3 ms"
WIN_TIMEOUT = "Esgotado o tempo limite do pedido."
WIN_TTL_EXPIRADO = "Resposta de 10.0.0.1: TTL expirado em trânsito."


def rajada(rtt, jitter=2.0, perda=0.0, enviados=15, ts=0.0):
    recebidos = enviados - round(enviados * perda / 100)
    return Rajada(ts, enviados, recebidos, rtt, rtt, rtt, jitter, perda)


class TestMetricas(unittest.TestCase):
    def test_jitter_rfc3550_exemplo_do_material(self):
        self.assertEqual(jitter_rfc3550([120, 122, 119, 125, 150, 121]), 5.31)

    def test_jitter_casos_simples(self):
        self.assertEqual(jitter_rfc3550([10]), 0.0)
        self.assertEqual(jitter_rfc3550([10, 12]), 2.0)
        self.assertEqual(jitter_medio_abs([20, 24, 20, 18]), round((4 + 4 + 2) / 3, 2))

    def test_media_desvio(self):
        media, desvio = media_desvio([2, 4, 4, 4, 5, 5, 7, 9])
        self.assertEqual(media, 5.0)
        self.assertEqual(desvio, 2.0)
        self.assertEqual(media_desvio([]), (0.0, 0.0))


class TestColetor(unittest.TestCase):
    def test_interpreta_saidas_reais(self):
        self.assertEqual(interpretar_saida(WIN_PT), Resposta(20.0, 112))
        self.assertEqual(interpretar_saida(WIN_EN), Resposta(18.0, 112))
        self.assertEqual(interpretar_saida(LINUX), Resposta(12.3, 117))
        self.assertEqual(interpretar_saida(WIN_PT_MENOR).rtt_ms, 1.0)

    def test_sem_tempo_e_perda(self):
        self.assertIsNone(interpretar_saida(WIN_TIMEOUT))
        self.assertIsNone(interpretar_saida(WIN_TTL_EXPIRADO))

    def test_comando_por_sistema(self):
        self.assertEqual(comando_ping("1.1.1.1", 2, "Windows"), ["ping", "-n", "1", "-w", "2000", "1.1.1.1"])
        self.assertEqual(comando_ping("1.1.1.1", 2, "Linux"), ["ping", "-c", "1", "-W", "2", "1.1.1.1"])

    def test_rajada_com_perda(self):
        respostas = iter([Resposta(10, 64), None, Resposta(12, 64), Resposta(11, 64)])
        pausas = []
        r = executar_rajada("1.1.1.1", 4, 1.0, ping=lambda ip: next(respostas), dormir=pausas.append, agora=lambda: 100.0)
        self.assertEqual((r.enviados, r.recebidos, r.perda_pct), (4, 3, 25.0))
        self.assertEqual(r.rtt_medio, 11.0)
        self.assertEqual(r.timestamp, 100.0)
        self.assertEqual(len(pausas), 3)  # sem pausa depois do último ping

    def test_queda_total_nao_vira_zero(self):
        r = consolidar([None] * 15, 0.0)
        self.assertTrue(r.queda_total)
        self.assertIsNone(r.rtt_medio)
        self.assertEqual(r.perda_pct, 100.0)


class TestBaseline(unittest.TestCase):
    def test_teto_3_sigmas(self):
        b = baseline_de_lista([150, 152, 149, 151, 148, 153, 150, 151, 152, 149])
        self.assertEqual(b.media, 150.5)
        self.assertAlmostEqual(b.teto_3sigma, b.media + 3 * b.desvio_padrao)

    def test_dados_insuficientes(self):
        with self.assertRaises(DadosInsuficientes):
            baseline_de_lista([10, 11, 12])

    def test_rajada_sem_resposta_nao_polui_a_media(self):
        lista = [rajada(100.0) for _ in range(10)] + [Rajada(0, 15, 0, None, None, None, 0.0, 100.0)]
        self.assertEqual(calcular_baseline(lista).media, 100.0)


class TestClassificador(unittest.TestCase):
    def setUp(self):
        # exemplo da rota via Espanha do material: média 180,4 ms, desvio 1,1 ms
        from preditor_icmp.baseline import Baseline
        self.base = Baseline(180.4, 1.1, 2.0, 0.0, 100, 0, 1)

    def test_cenarios_do_material(self):
        self.assertEqual(classificar_rajada(rajada(181.2, 4.5), self.base).estado, Estado.ESTAVEL)
        self.assertEqual(classificar_rajada(rajada(192.0, 22.1, perda=1.2), self.base).estado, Estado.EM_RISCO)
        self.assertEqual(classificar_rajada(rajada(12.5, 2.1), self.base).estado, Estado.ROTA_ALTERADA)
        self.assertEqual(classificar_rajada(rajada(250.0, 5.0, perda=3.5), self.base).estado, Estado.COM_FALHA)

    def test_limiares_de_perda_e_jitter(self):
        self.assertEqual(classificar_rajada(rajada(180.4, 2, perda=2.5), self.base).estado, Estado.COM_FALHA)
        self.assertEqual(classificar_rajada(rajada(180.4, 51), self.base).estado, Estado.COM_FALHA)
        self.assertEqual(classificar_rajada(rajada(180.4, 30), self.base).estado, Estado.EM_RISCO)
        self.assertEqual(classificar_rajada(rajada(180.4, 20), self.base).estado, Estado.ESTAVEL)

    def test_queda_total(self):
        q = Rajada(0, 15, 0, None, None, None, 0.0, 100.0)
        self.assertEqual(classificar_rajada(q, self.base).estado, Estado.COM_FALHA)

    def test_perda_pode_ser_medida_na_janela(self):
        # 1 pacote perdido em 15 = 6,7 % na rajada, mas 0,56 % na última hora
        r = rajada(180.4, 2.0, perda=6.67)
        self.assertEqual(classificar_rajada(r, self.base).estado, Estado.COM_FALHA)
        self.assertEqual(classificar_rajada(r, self.base, perda_pct=0.56).estado, Estado.EM_RISCO)

    def test_sem_baseline_usa_so_perda_e_jitter(self):
        p = classificar_rajada(rajada(300.0, 3.0), None)
        self.assertEqual(p.estado, Estado.ESTAVEL)
        self.assertFalse(p.baseline_pronto)

    def test_painel_exige_persistencia(self):
        E, R, F = Estado.ESTAVEL, Estado.EM_RISCO, Estado.COM_FALHA
        self.assertEqual(estado_painel([E, F]), Painel.VERDE)          # pico isolado
        self.assertEqual(estado_painel([E, R, R]), Painel.AMARELO)
        self.assertEqual(estado_painel([R, F, F]), Painel.AMARELO)
        self.assertEqual(estado_painel([F, F, F]), Painel.VERMELHO)
        self.assertEqual(estado_painel([E], queda_total_agora=True), Painel.VERMELHO)

    def test_recalibracao_apos_uma_hora(self):
        A = Estado.ROTA_ALTERADA
        self.assertFalse(deve_recalibrar([A] * 11, 12))
        self.assertTrue(deve_recalibrar([Estado.ESTAVEL] + [A] * 12, 12))
        self.assertFalse(deve_recalibrar([A] * 6 + [Estado.EM_RISCO] + [A] * 5, 12))


class TestServicoEArmazenamento(unittest.TestCase):
    def test_baseline_gerado_apos_janela_e_persistido(self):
        banco = Banco(":memory:")
        host = banco.adicionar_host("h", "1.1.1.1", "1.1.1.1", 0.0, baseline_dias=1.0)
        cfg = Config()
        gerado = None
        for i in range(290):  # 290 x 5 min > 1 dia
            r = processar_rajada(banco, host, rajada(50.0 + (i % 3), ts=i * 300.0), cfg)
            gerado = gerado or r.baseline_novo
        self.assertTrue(gerado)
        self.assertAlmostEqual(banco.baseline_ativo(host.id).media, 51.0, delta=0.5)
        self.assertEqual(len(banco.rajadas(host.id)), 290)
        self.assertEqual(len(banco.rajadas(host.id, ultimas=5)), 5)

    def test_exportar_csv(self):
        banco = Banco(":memory:")
        host = banco.adicionar_host("h", "1.1.1.1", "1.1.1.1", 0.0)
        banco.salvar_rajada(host.id, rajada(20.0, ts=1.0))
        with tempfile.TemporaryDirectory() as pasta:
            caminho = os.path.join(pasta, "m.csv")
            self.assertEqual(banco.exportar_csv(host.id, caminho), 1)
            with open(caminho, encoding="utf-8") as arquivo:
                linhas = arquivo.read().splitlines()
        self.assertEqual(len(linhas), 2)
        self.assertTrue(linhas[0].startswith("timestamp,enviados"))

    def test_demo_cobre_todos_os_estados(self):
        saida = []
        res = executar_demo(saida.append)
        self.assertEqual(res["normal"].parecer.estado, Estado.ESTAVEL)
        self.assertEqual(res["congestionamento2"].painel, Painel.AMARELO)
        self.assertEqual(res["queda"].painel, Painel.VERMELHO)
        self.assertEqual(res["rota1"].parecer.estado, Estado.ROTA_ALTERADA)
        self.assertTrue(res["rota12"].recalibracao_iniciada)
        self.assertEqual(res["apos_recalibrar"].parecer.estado, Estado.ESTAVEL)


if __name__ == "__main__":
    unittest.main()
