import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_INFO } from '../domain/quality';
import { markerPercent } from '../lib/gauge';
import { colors, spacing } from '../theme';
import type { Quality } from '../types/api';

/** Pontuação de qualidade (0 a 100) como barra de progresso. O número também vai por escrito. */
export function ScoreMeter({ score, quality }: { score: number; quality: Quality }) {
  const percent = markerPercent(score, 100);
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{`Pontuação de qualidade: ${score} de 100.`}</Text>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.track}>
        <View
          style={[styles.fill, { width: `${percent}%` as `${number}%`, backgroundColor: QUALITY_INFO[quality].bar }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  text: { fontSize: 14, color: colors.textMuted },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
});
