import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ChoiceButton } from '../components/ChoiceButton';
import { EstimateNotice } from '../components/EstimateNotice';
import { HeroCard } from '../components/HeroCard';
import { MetricGauge } from '../components/MetricGauge';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Card, Section } from '../components/Section';
import { ErrorState, LoadingState } from '../components/StateViews';
import { SuitabilityBadge } from '../components/StatusBadge';
import { Body, Caption } from '../components/Typography';
import { TIMELINE_LIMIT } from '../config';
import { GLOSSARY } from '../domain/glossary';
import {
  ACTIVITIES,
  ACTIVITY_LABEL,
  LOSS_THRESHOLDS,
  QUALITY_INFO,
  RTT_THRESHOLDS,
  SUITABILITY_INFO,
  suitabilityFor,
} from '../domain/quality';
import { regionName } from '../domain/regions';
import { useRegions } from '../hooks/useRegions';
import { useRequest } from '../hooks/useRequest';
import { bestPeriodFor } from '../lib/aggregate';
import { formatNumber, formatPeriod, spokenPeriod } from '../lib/format';
import { checkActivity, getTimeline } from '../services/api';
import { goBackOrHome } from '../lib/navigation';
import { useSelection } from '../state/SelectionContext';
import { colors, radius, spacing } from '../theme';
import type { Activity } from '../types/api';

/** P03 — Previsão por atividade (RQ03, RQ04). */
export function AtividadeScreen() {
  const { probeId, modelId, selectedTime, selectTime } = useSelection();
  const [activity, setActivity] = useState<Activity | null>(null);
  const regionsRequest = useRegions();
  const region = regionsRequest.regions.find((r) => r.probeId === probeId) ?? null;
  const timeline = useRequest(() => getTimeline(probeId, modelId, TIMELINE_LIMIT), [probeId, modelId]);

  // Extraímos latitude/longitude ANTES do hook, com `?.` (seguro quando region é null).
  // Ler `region!.latitude` dentro da função fazia o React Compiler acessar a propriedade
  // durante a renderização, quando as regiões ainda não tinham carregado (region === null).
  const latitude = region?.latitude;
  const longitude = region?.longitude;

  const ready = activity !== null && selectedTime !== null && latitude !== undefined && longitude !== undefined;
  const check = useRequest(
    () =>
      checkActivity({
        modelId,
        latitude: latitude!,
        longitude: longitude!,
        dateTime: selectedTime!,
        activity: activity!,
      }),
    [modelId, latitude, longitude, selectedTime, activity],
    ready,
  );

  const suitability = check.data && activity ? suitabilityFor(activity, check.data.forecast.quality) : null;

  useEffect(() => {
    if (!suitability || !activity) return;
    AccessibilityInfo.announceForAccessibility(`${ACTIVITY_LABEL[activity]}: ${SUITABILITY_INFO[suitability].label}.`);
  }, [suitability, activity]);

  if (!selectedTime) {
    return (
      <Screen
        header={
          <ScreenHeader
            eyebrow="PREVISÃO POR ATIVIDADE"
            title="O que você quer fazer?"
            subtitle="Para ver se uma atividade funciona, escolha antes uma região e um período."
          />
        }
      >
        <Card>
          <Body>Escolha primeiro uma região e um período na tela de previsão.</Body>
          <AppButton title="Escolher período" onPress={goBackOrHome} />
        </Card>
      </Screen>
    );
  }

  const best =
    activity && timeline.data && suitability && suitability !== 'ADEQUATE'
      ? bestPeriodFor(timeline.data.items, activity)
      : null;

  return (
    <Screen
      header={
        <ScreenHeader
          eyebrow="PREVISÃO POR ATIVIDADE"
          title="O que você quer fazer?"
          subtitle={`${regionName(probeId)} · ${formatPeriod(selectedTime)}`}
          subtitleSpoken={`${regionName(probeId)}, ${spokenPeriod(selectedTime)}`}
        />
      }
    >
      <AppButton
        title="Alterar horário"
        variant="secondary"
        onPress={goBackOrHome}
        hint="Volta para a lista de períodos"
      />

      <Section title="Atividade">
        <View accessibilityRole="radiogroup" style={styles.choices}>
          {ACTIVITIES.map((item) => (
            <ChoiceButton
              key={item}
              label={ACTIVITY_LABEL[item]}
              selected={item === activity}
              onPress={() => setActivity(item)}
            />
          ))}
        </View>
      </Section>

      {!activity ? <Caption>Escolha uma atividade para ver se ela deve funcionar bem neste horário.</Caption> : null}
      {regionsRequest.error ? (
        <ErrorState message={regionsRequest.error.userMessage} onRetry={regionsRequest.reload} />
      ) : null}
      {check.loading ? <LoadingState message="Verificando a atividade…" /> : null}
      {check.error ? <ErrorState message={check.error.userMessage} onRetry={check.reload} /> : null}

      {check.data && suitability && activity ? (
        <Section title="Resultado">
          <HeroCard accent={SUITABILITY_INFO[suitability].fg}>
            <Text style={styles.activityName}>{ACTIVITY_LABEL[activity]}</Text>
            <SuitabilityBadge suitability={suitability} large />
            <Body>{check.data.recommendation.message}</Body>
            <Caption>{`Qualidade prevista para este horário: ${QUALITY_INFO[check.data.forecast.quality].label}.`}</Caption>
            <View style={styles.metrics}>
              <MetricGauge
                title="Latência prevista"
                valueText={formatNumber(check.data.forecast.predictedAvgRttMs)}
                unit="ms"
                value={check.data.forecast.predictedAvgRttMs}
                max={RTT_SCALE_MAX_MS}
                thresholds={RTT_THRESHOLDS}
                explanation={GLOSSARY.latencia}
              />
              <MetricGauge
                title="Perda de pacotes prevista"
                valueText={formatNumber(check.data.forecast.predictedPacketLossPct)}
                unit="%"
                value={check.data.forecast.predictedPacketLossPct}
                max={LOSS_SCALE_MAX_PCT}
                thresholds={LOSS_THRESHOLDS}
                explanation={GLOSSARY.perda}
              />
            </View>
            {best && best.predictionFor !== selectedTime ? (
              <View style={styles.suggestion}>
                <Text style={styles.suggestionTitle}>Melhor horário para esta atividade</Text>
                <Body accessibilityLabel={`${spokenPeriod(best.predictionFor)}, qualidade ${QUALITY_INFO[best.quality].label}.`}>
                  {`${formatPeriod(best.predictionFor)} (${QUALITY_INFO[best.quality].label}).`}
                </Body>
                <AppButton
                  title="Usar este horário"
                  variant="secondary"
                  onPress={() => selectTime(best.predictionFor)}
                />
              </View>
            ) : null}
            {suitability !== 'ADEQUATE' && !best ? (
              <Body>Nenhum dos períodos de hoje atende bem a esta atividade.</Body>
            ) : null}
            <EstimateNotice extra={check.data.metadata.disclaimer} />
          </HeroCard>
        </Section>
      ) : null}
    </Screen>
  );
}

/** Fim das escalas dos indicadores (mesmas da tela de previsão). */
const RTT_SCALE_MAX_MS = 200;
const LOSS_SCALE_MAX_PCT = 8;

const styles = StyleSheet.create({
  choices: { gap: spacing.sm },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  activityName: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  suggestion: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedBg,
  },
  suggestionTitle: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
});
