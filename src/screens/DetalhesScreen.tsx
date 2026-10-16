import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../components/AppButton';
import { EstimateNotice } from '../components/EstimateNotice';
import { MetricCard } from '../components/MetricCard';
import { Screen } from '../components/Screen';
import { Card, Section } from '../components/Section';
import { ErrorState, LoadingState } from '../components/StateViews';
import { QualityBadge } from '../components/StatusBadge';
import { Body, Caption, Heading } from '../components/Typography';
import { TIMELINE_LIMIT } from '../config';
import { GLOSSARY } from '../domain/glossary';
import { QUALITY_INFO } from '../domain/quality';
import { regionName } from '../domain/regions';
import { useRequest } from '../hooks/useRequest';
import { summarize } from '../lib/aggregate';
import { formatHour, formatNumber, formatPeriod } from '../lib/format';
import { compareModels, getTimeline } from '../services/api';
import { useSelection } from '../state/SelectionContext';
import { colors, radius, spacing } from '../theme';

function relative(value: number, average: number, unit: string): string {
  const diff = value - average;
  if (Math.abs(diff) < 0.05) return 'Igual à média do dia.';
  return `${formatNumber(Math.abs(diff))}${unit} ${diff > 0 ? 'acima' : 'abaixo'} da média do dia (${formatNumber(average)}${unit}).`;
}

/** P02 — Detalhes da previsão (RNF03, RNF07). */
export function DetalhesScreen() {
  const { probeId, modelId, selectedTime } = useSelection();
  const timeline = useRequest(() => getTimeline(probeId, modelId, TIMELINE_LIMIT), [probeId, modelId]);
  const compare = useRequest(() => compareModels(probeId, selectedTime ?? undefined), [probeId, selectedTime], selectedTime !== null);

  if (!selectedTime) {
    return (
      <Screen>
        <Heading>Detalhes da previsão</Heading>
        <Body>Escolha primeiro uma região e um período na tela de previsão.</Body>
        <AppButton title="Escolher período" onPress={() => router.back()} />
      </Screen>
    );
  }

  const items = timeline.data?.items ?? [];
  const selected = items.find((item) => item.predictionFor === selectedTime) ?? null;
  const summary = summarize(items);
  const maxRtt = summary ? Math.max(summary.maxRttMs, 1) : 1;

  return (
    <Screen>
      <Heading>Por que esta previsão?</Heading>
      <Body>{`${regionName(probeId)} · ${formatPeriod(selectedTime)}`}</Body>

      {timeline.loading ? <LoadingState /> : null}
      {timeline.error ? <ErrorState message={timeline.error.userMessage} onRetry={timeline.reload} /> : null}

      {selected && summary ? (
        <>
          <Card>
            <QualityBadge quality={selected.quality} large />
            <Body>{QUALITY_INFO[selected.quality].summary}</Body>
            <Caption>{`Pontuação de qualidade: ${selected.qualityScore} de 100.`}</Caption>
          </Card>

          <MetricCard
            title="Latência (tempo de resposta)"
            value={`${formatNumber(selected.predictedAvgRttMs)} ms`}
            explanation={GLOSSARY.latencia}
            note={relative(selected.predictedAvgRttMs, summary.avgRttMs, ' ms')}
          />
          <MetricCard
            title="Perda de pacotes"
            value={`${formatNumber(selected.predictedPacketLossPct)}%`}
            explanation={GLOSSARY.perda}
            note={relative(selected.predictedPacketLossPct, summary.avgLossPct, '%')}
          />
          <MetricCard
            title="Jitter (oscilação)"
            value="Sem valor previsto"
            explanation={GLOSSARY.jitter}
            note="O serviço de previsão ainda não informa o jitter. Ele é medido pelo monitoramento da rede."
          />

          <Section title="Comparação ao longo do dia">
            <Caption>
              As barras são só um apoio visual. Todas as informações estão escritas em cada linha.
            </Caption>
            {items.map((item) => {
              const info = QUALITY_INFO[item.quality];
              const isSelected = item.predictionFor === selectedTime;
              const text = `${formatHour(item.predictionFor)}: ${info.label}, latência ${formatNumber(item.predictedAvgRttMs)} ms, perda ${formatNumber(item.predictedPacketLossPct)}%${isSelected ? ' (período escolhido)' : ''}`;
              return (
                <View key={item.predictionFor} accessible accessibilityLabel={text} style={styles.row}>
                  <Text style={[styles.rowText, isSelected && styles.rowSelected]}>
                    {`${isSelected ? '▶ ' : ''}${formatHour(item.predictionFor)} · ${info.symbol} ${info.label} · ${formatNumber(item.predictedAvgRttMs)} ms · ${formatNumber(item.predictedPacketLossPct)}%`}
                  </Text>
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={styles.track}
                  >
                    <View
                      style={[
                        styles.bar,
                        { width: `${Math.max(4, (item.predictedAvgRttMs / maxRtt) * 100)}%`, backgroundColor: info.fg },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </Section>

          <Section title="O que cada modelo prevê">
            {compare.loading ? <LoadingState message="Comparando modelos…" /> : null}
            {compare.error && compare.error.status === 404 ? (
              <Body>Não há comparação entre modelos para este horário.</Body>
            ) : null}
            {compare.error && compare.error.status !== 404 ? (
              <ErrorState message={compare.error.userMessage} onRetry={compare.reload} />
            ) : null}
            {compare.data
              ? compare.data.models.map((model) => (
                  <Card key={model.modelId}>
                    <Text accessibilityRole="header" style={styles.modelName}>
                      {model.modelName}
                    </Text>
                    <QualityBadge quality={model.quality} />
                    <Caption>
                      {`Latência ${formatNumber(model.predictedAvgRttMs)} ms · Perda ${formatNumber(model.predictedPacketLossPct)}%`}
                    </Caption>
                  </Card>
                ))
              : null}
          </Section>

          <EstimateNotice extra={`Modelo usado: ${timeline.data?.model.name ?? ''}.`} />
          <AppButton title="Ver por atividade" onPress={() => router.push('/atividade')} />
          <AppButton title="Voltar à previsão" variant="secondary" onPress={() => router.back()} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, paddingVertical: spacing.xs },
  rowText: { fontSize: 14, lineHeight: 20, color: colors.text },
  rowSelected: { fontWeight: '700' },
  track: { height: 8, backgroundColor: colors.surface, borderRadius: radius, overflow: 'hidden' },
  bar: { height: 8, borderRadius: radius },
  modelName: { fontSize: 16, fontWeight: '700', color: colors.text },
});
