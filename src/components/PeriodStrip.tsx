import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_INFO } from '../domain/quality';
import { formatPeriod } from '../lib/format';
import { colors, spacing } from '../theme';
import type { Quality, TimelineItem } from '../types/api';

const ORDER: Quality[] = ['GOOD', 'MODERATE', 'UNSTABLE'];
/** A altura também comunica a qualidade, para a faixa não depender só da cor (RNF03). */
const HEIGHT: Record<Quality, number> = { GOOD: 44, MODERATE: 30, UNSTABLE: 16 };

interface Props {
  items: TimelineItem[];
  selectedTime: string | null;
  /** Quantos períodos há de cada qualidade (já calculado por `summarize`). */
  counts: Record<Quality, number>;
}

/**
 * Resumo visual dos períodos futuros. Não é interativo (as barras são pequenas demais para tocar, RNF09):
 * a escolha do período continua na lista logo abaixo (RQ04). O mesmo resumo vai em texto, e a faixa é
 * escondida do leitor de tela.
 */
export function PeriodStrip({ items, selectedTime, counts }: Props) {
  if (items.length === 0) return null;
  const summary = ORDER.filter((level) => counts[level] > 0)
    .map((level) => `${counts[level]} ${QUALITY_INFO[level].label}`)
    .join(' · ');

  return (
    <View style={styles.wrap}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.chart}>
        <View style={styles.bars}>
          {items.map((item) => (
            <View
              key={item.predictionFor}
              style={[
                styles.bar,
                { height: HEIGHT[item.quality], backgroundColor: QUALITY_INFO[item.quality].bar },
                item.predictionFor === selectedTime && styles.barSelected,
              ]}
            />
          ))}
        </View>
        <View style={styles.axis}>
          <Text style={styles.axisText}>{formatPeriod(items[0].predictionFor)}</Text>
          <Text style={styles.axisText}>{formatPeriod(items[items.length - 1].predictionFor)}</Text>
        </View>
        <View style={styles.legend}>
          {ORDER.map((level) => (
            <View key={level} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: QUALITY_INFO[level].bar }]} />
              <Text style={styles.axisText}>{QUALITY_INFO[level].label}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={styles.summary}>{`${items.length} períodos: ${summary}.`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chart: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 48 },
  bar: { flex: 1, borderRadius: 2 },
  barSelected: { borderWidth: 2, borderColor: colors.text },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { fontSize: 13, color: colors.textMuted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  summary: { fontSize: 14, color: colors.textMuted },
});
