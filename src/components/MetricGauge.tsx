import { StyleSheet, Text, View } from 'react-native';
import { levelFor, QUALITY_INFO, type Thresholds } from '../domain/quality';
import { markerPercent, zoneFlex } from '../lib/gauge';
import { colors, radius, spacing } from '../theme';

interface Props {
  title: string;
  /** Valor já formatado para exibição (ex.: "73,2"). */
  valueText: string;
  unit: string;
  /** Valor numérico, usado para posicionar o marcador e achar o nível. */
  value: number;
  /** Fim da escala (o marcador nunca passa daqui). */
  max: number;
  thresholds: Thresholds;
  /** Explicação em linguagem simples (RNF07), vinda do glossário. */
  explanation: string;
  /** Observação opcional (ex.: comparação com a média do dia). */
  note?: string;
}

/**
 * Indicador com faixa de zonas (Boa / Regular / Instável) e marcador na posição do valor.
 * O nível aparece também em texto e símbolo, nunca só pela cor (RNF03).
 */
export function MetricGauge({ title, valueText, unit, value, max, thresholds, explanation, note }: Props) {
  const level = levelFor(value, thresholds);
  const info = QUALITY_INFO[level];
  const zones = zoneFlex(thresholds, max);
  const percent = markerPercent(value, max);
  const spoken = `${title}: ${valueText} ${unit}, nível ${info.label}. ${explanation}${note ? ` ${note}` : ''}`;

  return (
    <View accessible accessibilityLabel={spoken} style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{valueText}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <View style={[styles.level, { backgroundColor: info.bg, borderColor: info.fg }]}>
        <Text style={[styles.levelText, { color: info.fg }]}>{`${info.symbol} ${info.label}`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.zone, { flex: zones[0], backgroundColor: QUALITY_INFO.GOOD.bar }]} />
        <View style={[styles.zone, { flex: zones[1], backgroundColor: QUALITY_INFO.MODERATE.bar }]} />
        <View style={[styles.zone, { flex: zones[2], backgroundColor: QUALITY_INFO.UNSTABLE.bar }]} />
        <View style={[styles.marker, { left: `${percent}%` as `${number}%` }]} />
      </View>
      <Text style={styles.hint}>{`Boa abaixo de ${thresholds.moderate} ${unit}`}</Text>
      <Text style={styles.explanation}>{explanation}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 140,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  // flexWrap: com fonte grande a unidade ('ms', '%') desce para a linha de baixo em vez de ser cortada (F4).
  valueRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: spacing.xs },
  value: { fontSize: 30, lineHeight: 36, fontWeight: '700', color: colors.text },
  unit: { fontSize: 16, color: colors.textMuted },
  level: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  levelText: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  track: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    marginVertical: spacing.xs,
    position: 'relative',
  },
  zone: { height: 10 },
  marker: {
    position: 'absolute',
    top: -4,
    width: 6,
    height: 18,
    marginLeft: -3,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: colors.bg,
    backgroundColor: colors.text,
  },
  hint: { fontSize: 13, color: colors.textMuted },
  explanation: { fontSize: 14, lineHeight: 20, color: colors.text },
  note: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
});
