package com.brazcubas.apsii.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class QualityClassifierTest {
    private final QualityClassifier classifier = new QualityClassifier();

    @Test
    void classifiesGoodConnection() {
        assertEquals("GOOD", classifier.classify(30.0, 0.0));
    }

    @Test
    void classifiesModeratePacketLoss() {
        assertEquals("MODERATE", classifier.classify(40.0, 1.5));
    }

    @Test
    void worseMetricDeterminesQuality() {
        assertEquals("UNSTABLE", classifier.classify(20.0, 5.0));
    }

    // ------------------------------------------------------------------
    // Bordas de limiar: o limite é INCLUSIVO (value >= limite muda de nível).
    // Os valores são literais de propósito: se alguém mudar o limiar em
    // QualityRules, estes testes precisam falhar e chamar a atenção.
    // ------------------------------------------------------------------

    @Test
    void rttExactlyAtModerateThresholdIsModerate() {
        // Arrange: RTT exatamente no limiar de 60 ms, sem perda
        double rtt = 60.0;
        double packetLoss = 0.0;

        // Act
        String quality = classifier.classify(rtt, packetLoss);

        // Assert
        assertEquals("MODERATE", quality);
    }

    @Test
    void rttJustBelowModerateThresholdIsGood() {
        // Arrange: RTT logo abaixo do limiar de 60 ms
        double rtt = 59.99;
        double packetLoss = 0.0;

        // Act
        String quality = classifier.classify(rtt, packetLoss);

        // Assert
        assertEquals("GOOD", quality);
    }

    @Test
    void packetLossExactlyAtUnstableThresholdIsUnstable() {
        // Arrange: RTT excelente, mas perda exatamente no limiar de 5 %
        double rtt = 0.0;
        double packetLoss = 5.0;

        // Act
        String quality = classifier.classify(rtt, packetLoss);

        // Assert: a pior métrica (perda) decide
        assertEquals("UNSTABLE", quality);
    }

    @Test
    void extremeValuesGiveScoreZeroNeverNegative() {
        // Arrange: valores absurdamente altos, porém válidos
        double rtt = 1_000_000_000.0;
        double packetLoss = 1_000_000_000.0;

        // Act
        int score = classifier.score(rtt, packetLoss);

        // Assert: o score é limitado a [0, 100]
        assertEquals(0, score);
    }

    // ------------------------------------------------------------------
    // Caminho triste: métricas inválidas são rejeitadas, não classificadas.
    // ------------------------------------------------------------------

    @Test
    void negativeRttIsRejected() {
        // Arrange: RTT negativo não existe fisicamente
        double rtt = -1.0;

        // Act
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> classifier.classify(rtt, 0.0));

        // Assert
        assertEquals("Prediction metrics must be finite and non-negative", error.getMessage());
    }

    @Test
    void nanPacketLossIsRejected() {
        // Arrange: NaN costuma vir de divisão 0/0 em algum cálculo anterior
        double packetLoss = Double.NaN;

        // Act + Assert
        assertThrows(IllegalArgumentException.class, () -> classifier.classify(30.0, packetLoss));
    }
}
