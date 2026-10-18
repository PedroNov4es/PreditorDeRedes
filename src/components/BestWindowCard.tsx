import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_INFO } from '../domain/quality';
import type { BestWindow } from '../lib/aggregate';
import { formatHour } from '../lib/format';
import { colors, radius, spacing } from '../theme';

/** Destaque do melhor período identificado: a maior sequência de períodos com a melhor qualidade. */
export function BestWindowCard({ window: best }: { window: BestWindow }) {
  const info = QUALITY_INFO[best.quality];
  const range = `das ${formatHour(best.start)} às ${formatHour(best.end)}`;
  const count = `${best.length} período${best.length > 1 ? 's' : ''} seguido${best.length > 1 ? 's' : ''}`;

  return (
    <View
      accessible
      accessibilityLabel={`Melhor janela prevista: ${range}, qualidade ${info.label}, ${count}.`}
      style={styles.card}
    >
      <Text style={styles.eyebrow}>Melhor janela prevista</Text>
      <Text style={styles.range}>{`${formatHour(best.start)} às ${formatHour(best.end)}`}</Text>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: info.bg, borderColor: info.fg }]}>
          <Text style={[styles.badgeText, { color: info.fg }]}>{`${info.symbol} ${info.label}`}</Text>
        </View>
        <Text style={styles.count}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.selectedBg,
  },
  eyebrow: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  range: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: 14, fontWeight: '700' },
  count: { fontSize: 14, color: colors.text },
});
