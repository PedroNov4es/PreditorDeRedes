import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../components/AppButton';
import { EstimateNotice } from '../components/EstimateNotice';
import { PeriodList } from '../components/PeriodList';
import { RegionPicker } from '../components/RegionPicker';
import { Screen } from '../components/Screen';
import { Card, Section } from '../components/Section';
import { ErrorState, LoadingState } from '../components/StateViews';
import { QualityBadge } from '../components/StatusBadge';
import { Body, Caption, Heading } from '../components/Typography';
import { TIMELINE_LIMIT } from '../config';
import { QUALITY_INFO } from '../domain/quality';
import { regionName } from '../domain/regions';
import { useRegions } from '../hooks/useRegions';
import { useRequest } from '../hooks/useRequest';
import { bestWindow, summarize } from '../lib/aggregate';
import { formatHour, formatNumber, formatPeriod } from '../lib/format';
import { getProbeForecast, getTimeline } from '../services/api';
import { useSelection } from '../state/SelectionContext';
import { colors, spacing } from '../theme';
import type { TimelineItem } from '../types/api';

/** P01 — Tela de previsão (RQ01, RQ02, RQ04). */
export function PrevisaoScreen() {
  const { probeId, modelId, selectedTime, recent, selectRegion, selectTime, registerConsultation } = useSelection();
  const regionsRequest = useRegions();
  const forecast = useRequest(() => getProbeForecast(probeId, modelId), [probeId, modelId]);
  const timeline = useRequest(() => getTimeline(probeId, modelId, TIMELINE_LIMIT), [probeId, modelId]);

  const items = timeline.data?.items;
  const name = regionName(probeId);

  // Período inicial: o instante "atual" da previsão, ou o primeiro da lista.
  useEffect(() => {
    if (!items || items.length === 0) return;
    if (selectedTime && items.some((item) => item.predictionFor === selectedTime)) return;
    const current = forecast.data?.prediction.predictionFor;
    selectTime((items.find((item) => item.predictionFor === current) ?? items[0]).predictionFor);
  }, [items, forecast.data, selectedTime, selectTime]);

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

  const summary = items ? summarize(items) : null;
  const window = items ? bestWindow(items) : null;
  const selected = items?.find((item) => item.predictionFor === selectedTime) ?? null;

  return (
    <Screen>
      <Heading>Como estará a sua conexão?</Heading>
      <Body>Veja a qualidade prevista da internet na sua região e escolha o melhor horário.</Body>

      <Section title="Região">
        {regionsRequest.loading ? <LoadingState message="Carregando regiões…" /> : null}
        {regionsRequest.error ? (
          <ErrorState message={regionsRequest.error.userMessage} onRetry={regionsRequest.reload} />
        ) : null}
        {regionsRequest.data ? (
          <RegionPicker regions={regionsRequest.regions} probeId={probeId} onSelect={selectRegion} />
        ) : null}
      </Section>

      <Section title="Previsão atual">
        {forecast.loading ? <LoadingState /> : null}
        {forecast.error ? <ErrorState message={forecast.error.userMessage} onRetry={forecast.reload} /> : null}
        {forecast.data ? (
          <Card>
            <QualityBadge quality={forecast.data.assessment.quality} large />
            <Body>{QUALITY_INFO[forecast.data.assessment.quality].summary}</Body>
            <Body>{forecast.data.recommendation.message}</Body>
            <Caption>
              {`${name} · previsão para ${formatPeriod(forecast.data.prediction.predictionFor)} · ${forecast.data.model.name}`}
              {forecast.data.prediction.modelConfidence !== null
                ? ` · confiança do modelo ${Math.round(forecast.data.prediction.modelConfidence * 100)}%`
                : ''}
            </Caption>
            <EstimateNotice />
          </Card>
        ) : null}
      </Section>

      <Section title="Próximos períodos">
        {timeline.loading ? <LoadingState message="Carregando períodos…" /> : null}
        {timeline.error ? <ErrorState message={timeline.error.userMessage} onRetry={timeline.reload} /> : null}
        {items && summary ? (
          <>
            <Body>
              {`Latência média prevista: ${formatNumber(summary.avgRttMs)} ms. Perda média: ${formatNumber(summary.avgLossPct)}%.`}
            </Body>
            {window ? (
              <Body>
                {`Melhor janela: das ${formatHour(window.start)} às ${formatHour(window.end)} (${QUALITY_INFO[window.quality].label}), ${window.length} período${window.length > 1 ? 's' : ''} seguido${window.length > 1 ? 's' : ''}.`}
              </Body>
            ) : null}
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
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  actions: { gap: spacing.sm },
});
