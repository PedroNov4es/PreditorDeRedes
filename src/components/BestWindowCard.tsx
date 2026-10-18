import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_INFO } from '../domain/quality';
import type { BestWindow } from '../lib/aggregate';
import { formatHour } from '../lib/format';
import { colors, radius, spacing } from '../theme';

/**
 * Destaque do melhor período identificado: a maior sequência de períodos com a melhor qualidade.
 * O app só sabe a hora em que cada período COMEÇA, então o texto diz "a partir das" e "o último
 * período começa às", sem inventar a hora em que a janela termina.
 */
export function BestWindowCard({ window: best }: { window: BestWindow }) {
  const info = QUALITY_INFO[best.quality];
  const plural = best.length > 1;
  const count = `${best.length} período${plural ? 's' : ''} seguido${plural ? 's' : ''}`;
  const start = `A partir das ${formatHour(best.start)}`;
  const last = plural ? `O último período começa às ${formatHour(best.end)}.` : null;

  return (
    <View
      accessible
      accessibilityLabel={`Melhor janela prevista: ${start}, qualidade ${info.label}, ${count}. ${last ?? ''}`}
      style={styles.card}
    >
      <Text style={styles.eyebrow}>Melhor janela prevista</Text>
      <Text style={styles.range}>{start}</Text>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: info.bg, borderColor: info.fg }]}>
          <Text style={[styles.badgeText, { color: info.fg }]}>{`${info.symbol} ${info.label}`}</Text>
        </View>
        <Text style={styles.count}>{count}</Text>
      </View>
      {last ? <Text style={styles.last}>{last}</Text> : null}
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
  last: { fontSize: 14, color: colors.text },
});
