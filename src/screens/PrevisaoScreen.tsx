import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../components/AppButton';
import { BestWindowCard } from '../components/BestWindowCard';
import { DemoNotice } from '../components/DemoNotice';
import { EstimateNotice } from '../components/EstimateNotice';
import { MetricGauge } from '../components/MetricGauge';
import { PeriodList } from '../components/PeriodList';
import { PeriodStrip } from '../components/PeriodStrip';
import { QualityScale } from '../components/QualityScale';
import { RegionPicker } from '../components/RegionPicker';
import { RegionSelect } from '../components/RegionSelect';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, Section } from '../components/Section';
import { Skeleton } from '../components/Skeleton';
import { ErrorState, LoadingState } from '../components/StateViews';
import { QualityBadge } from '../components/StatusBadge';
import { Body, Caption, Heading } from '../components/Typography';
import { TIMELINE_LIMIT, USE_MOCK } from '../config';
import { GLOSSARY } from '../domain/glossary';
import { LOSS_THRESHOLDS, QUALITY_INFO, RTT_THRESHOLDS } from '../domain/quality';
import { regionName } from '../domain/regions';
import { useRegions } from '../hooks/useRegions';
import { useRequest } from '../hooks/useRequest';
import { bestWindow, summarize } from '../lib/aggregate';
import { formatNumber, formatPeriod } from '../lib/format';
import { getProbeForecast, getTimeline } from '../services/api';
import { useSelection } from '../state/SelectionContext';
import { colors, spacing } from '../theme';
import type { TimelineItem } from '../types/api';

/** Fim das escalas dos indicadores. Só definem o desenho da faixa; valores acima ficam na ponta. */
const RTT_SCALE_MAX_MS = 200;
const LOSS_SCALE_MAX_PCT = 8;

/** P01 — Tela de previsão (RQ01, RQ02, RQ04). */
export function PrevisaoScreen() {
  const { probeId, modelId, selectedTime, recent, selectRegion, selectTime, registerConsultation } = useSelection();
  const [regionOpen, setRegionOpen] = useState(false);
  const regionsRequest = useRegions();
  const forecast = useRequest(() => getProbeForecast(probeId, modelId), [probeId, modelId]);
  const timeline = useRequest(() => getTimeline(probeId, modelId, TIMELINE_LIMIT), [probeId, modelId]);

  const items = timeline.data?.items;
  const name = regionName(probeId);

  // Período inicial: o instante "atual" da previsão, ou o primeiro da lista.
  // Espera a previsão atual terminar (com sucesso ou erro) antes de escolher: se a lista
  // chegasse primeiro, o app escolhia o 1º item e nunca corrigia para o período atual.
  useEffect(() => {
    if (!items || items.length === 0) return;
    if (forecast.loading) return;
    if (selectedTime && items.some((item) => item.predictionFor === selectedTime)) return;
    const current = forecast.data?.prediction.predictionFor;
    selectTime((items.find((item) => item.predictionFor === current) ?? items[0]).predictionFor);
  }, [items, forecast.data, forecast.loading, selectedTime, selectTime]);

  // RNF08: comunica a atualização da previsão às tecnologias assistivas.
  useEffect(() => {
    if (!forecast.data) return;
    const info = QUALITY_INFO[forecast.data.assessment.quality];
    AccessibilityInfo.announceForAccessibility(`Previsão atualizada para ${name}: qualidade ${info.label}.`);
  }, [forecast.data, name]);

  const onSelectPeriod = (item: TimelineItem) => {
    selectTime(item.predictionFor);
    registerConsultation({ probeId, regionName: name, time: item.predictionFor, quality: item.quality });
  };

  const onSelectRegion = (id: number) => {
    selectRegion(id);
    setRegionOpen(false);
  };

  const summary = items ? summarize(items) : null;
  const best = items ? bestWindow(items) : null;
  const selected = items?.find((item) => item.predictionFor === selectedTime) ?? null;
  const prediction = forecast.data?.prediction;
  const quality = forecast.data?.assessment.quality;

  return (
    <Screen
      header={
        <ScreenHeader
          eyebrow="PREDITOR DE REDES"
          title="Como estará a sua conexão?"
          subtitle="Veja a qualidade prevista da internet na sua região e escolha o melhor horário."
        >
          <RegionSelect
            name={name}
            open={regionOpen}
            loading={regionsRequest.loading}
            onToggle={() => setRegionOpen((open) => !open)}
          />
          {USE_MOCK ? <DemoNotice /> : null}
        </ScreenHeader>
      }
    >
      {regionsRequest.error ? (
        <ErrorState message={regionsRequest.error.userMessage} onRetry={regionsRequest.reload} />
      ) : null}
      {regionOpen && regionsRequest.data ? (
        <Card>
          <Heading level={2}>Escolha a região</Heading>
          <RegionPicker regions={regionsRequest.regions} probeId={probeId} onSelect={onSelectRegion} />
        </Card>
      ) : null}

      <View style={[styles.hero, quality ? { borderTopColor: QUALITY_INFO[quality].bar } : null]}>
        <Heading level={2}>Previsão atual</Heading>
        {forecast.loading ? <LoadingState /> : null}
        {forecast.error ? <ErrorState message={forecast.error.userMessage} onRetry={forecast.reload} /> : null}
        {forecast.data && prediction && quality ? (
          <>
            <Caption>{`${name} · previsão para ${formatPeriod(prediction.predictionFor)}`}</Caption>
            <QualityBadge quality={quality} large />
            <QualityScale quality={quality} />
            <Body>{QUALITY_INFO[quality].summary}</Body>
            <Body>{forecast.data.recommendation.message}</Body>
            <Caption>
              {forecast.data.model.name}
              {prediction.modelConfidence !== null
                ? ` · confiança do modelo ${Math.round(prediction.modelConfidence * 100)}%`
                : ''}
            </Caption>
            <EstimateNotice />
          </>
        ) : null}
      </View>

      {forecast.loading ? (
        <View style={styles.metrics}>
          <View style={styles.metricSkeleton}>
            <Skeleton height={150} />
          </View>
          <View style={styles.metricSkeleton}>
            <Skeleton height={150} />
          </View>
        </View>
      ) : null}
      {prediction ? (
        <View style={styles.metrics}>
          <MetricGauge
            title="Latência prevista"
            valueText={formatNumber(prediction.predictedAvgRttMs)}
            unit="ms"
            value={prediction.predictedAvgRttMs}
            max={RTT_SCALE_MAX_MS}
            thresholds={RTT_THRESHOLDS}
            explanation={GLOSSARY.latencia}
          />
          <MetricGauge
            title="Perda de pacotes prevista"
            valueText={formatNumber(prediction.predictedPacketLossPct)}
            unit="%"
            value={prediction.predictedPacketLossPct}
            max={LOSS_SCALE_MAX_PCT}
            thresholds={LOSS_THRESHOLDS}
            explanation={GLOSSARY.perda}
          />
        </View>
      ) : null}

      {best ? <BestWindowCard window={best} /> : null}

      <Section title="Próximos períodos">
        {timeline.loading ? <LoadingState message="Carregando períodos…" /> : null}
        {timeline.error ? <ErrorState message={timeline.error.userMessage} onRetry={timeline.reload} /> : null}
        {items && summary ? (
          <>
            <Body>
              {`Latência média prevista: ${formatNumber(summary.avgRttMs)} ms. Perda média: ${formatNumber(summary.avgLossPct)}%.`}
            </Body>
            <PeriodStrip items={items} selectedTime={selectedTime} counts={summary.byQuality} />
            <Caption>Toque em um período para escolhê-lo.</Caption>
            <PeriodList items={items} selectedTime={selectedTime} onSelect={onSelectPeriod} />
          </>
        ) : null}
      </Section>

      {selected ? (
        <Card>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Período escolhido
          </Text>
          <Body>{formatPeriod(selected.predictionFor)}</Body>
          <QualityBadge quality={selected.quality} />
          <View style={styles.actions}>
            <AppButton title="Ver detalhes da previsão" onPress={() => router.push('/detalhes')} />
            <AppButton
              title="Ver por atividade"
              variant="secondary"
              onPress={() => router.push('/atividade')}
              hint="Mostra se videochamada, streaming e outras atividades funcionam neste horário"
            />
          </View>
        </Card>
      ) : null}

      {recent.length > 0 ? (
        <Section title="Consultas recentes">
          {recent.map((item) => (
            <AppButton
              key={`${item.probeId}-${item.time}`}
              variant="secondary"
              title={`${item.regionName} · ${formatPeriod(item.time)} · ${QUALITY_INFO[item.quality].label}`}
              onPress={() => {
                selectRegion(item.probeId);
                selectTime(item.time);
              }}
            />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderTopWidth: 6,
    borderColor: colors.border,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metricSkeleton: { flexGrow: 1, flexBasis: 150, minWidth: 140 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  actions: { gap: spacing.sm },
});
