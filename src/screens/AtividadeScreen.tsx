import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '../components/AppButton';
import { ChoiceButton } from '../components/ChoiceButton';
import { EstimateNotice } from '../components/EstimateNotice';
import { Screen } from '../components/Screen';
import { Card, Section } from '../components/Section';
import { ErrorState, LoadingState } from '../components/StateViews';
import { SuitabilityBadge } from '../components/StatusBadge';
import { Body, Caption, Heading } from '../components/Typography';
import { TIMELINE_LIMIT } from '../config';
import { ACTIVITIES, ACTIVITY_LABEL, QUALITY_INFO, SUITABILITY_INFO, suitabilityFor } from '../domain/quality';
import { regionName } from '../domain/regions';
import { useRegions } from '../hooks/useRegions';
import { useRequest } from '../hooks/useRequest';
import { bestPeriodFor } from '../lib/aggregate';
import { formatNumber, formatPeriod } from '../lib/format';
import { checkActivity, getTimeline } from '../services/api';
import { useSelection } from '../state/SelectionContext';
import { spacing } from '../theme';
import type { Activity } from '../types/api';

/** P03 — Previsão por atividade (RQ03, RQ04). */
export function AtividadeScreen() {
  const { probeId, modelId, selectedTime, selectTime } = useSelection();
  const [activity, setActivity] = useState<Activity | null>(null);
  const regionsRequest = useRegions();
  const region = regionsRequest.regions.find((r) => r.probeId === probeId) ?? null;
  const timeline = useRequest(() => getTimeline(probeId, modelId, TIMELINE_LIMIT), [probeId, modelId]);

  const ready = activity !== null && selectedTime !== null && region !== null;
  const check = useRequest(
    () =>
      checkActivity({
        modelId,
        latitude: region!.latitude,
        longitude: region!.longitude,
        dateTime: selectedTime!,
        activity: activity!,
      }),
    [modelId, region, selectedTime, activity],
    ready,
  );

  const suitability = check.data && activity ? suitabilityFor(activity, check.data.forecast.quality) : null;

  useEffect(() => {
    if (!suitability || !activity) return;
    AccessibilityInfo.announceForAccessibility(`${ACTIVITY_LABEL[activity]}: ${SUITABILITY_INFO[suitability].label}.`);
  }, [suitability, activity]);

  if (!selectedTime) {
    return (
      <Screen>
        <Heading>Previsão por atividade</Heading>
        <Body>Escolha primeiro uma região e um período na tela de previsão.</Body>
        <AppButton title="Escolher período" onPress={() => router.back()} />
      </Screen>
    );
  }

  const best =
    activity && timeline.data && suitability && suitability !== 'ADEQUATE'
      ? bestPeriodFor(timeline.data.items, activity)
      : null;

  return (
    <Screen>
      <Heading>O que você quer fazer?</Heading>
      <Body>{`${regionName(probeId)} · ${formatPeriod(selectedTime)}`}</Body>
      <AppButton
        title="Alterar horário"
        variant="secondary"
        onPress={() => router.back()}
        hint="Volta para a lista de períodos"
      />

      <Section title="Atividade">
        <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
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
          <Card>
            <SuitabilityBadge suitability={suitability} large />
            <Body>{check.data.recommendation.message}</Body>
            <Caption>
              {`Qualidade prevista: ${QUALITY_INFO[check.data.forecast.quality].label} · Latência ${formatNumber(check.data.forecast.predictedAvgRttMs)} ms · Perda ${formatNumber(check.data.forecast.predictedPacketLossPct)}%`}
            </Caption>
            {best && best.predictionFor !== selectedTime ? (
              <>
                <Body>
                  {`Melhor horário previsto para esta atividade: ${formatPeriod(best.predictionFor)} (${QUALITY_INFO[best.quality].label}).`}
                </Body>
                <AppButton
                  title="Usar este horário"
                  variant="secondary"
                  onPress={() => selectTime(best.predictionFor)}
                />
              </>
            ) : null}
            {suitability !== 'ADEQUATE' && !best ? (
              <Body>Nenhum dos períodos de hoje atende bem a esta atividade.</Body>
            ) : null}
            <EstimateNotice extra={check.data.metadata.disclaimer} />
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
