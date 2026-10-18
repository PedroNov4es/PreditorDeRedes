import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_INFO } from '../domain/quality';
import { colors, spacing } from '../theme';
import type { Quality } from '../types/api';

const ORDER: Quality[] = ['GOOD', 'MODERATE', 'UNSTABLE'];

/**
 * Escala de 3 níveis com o nível atual preenchido e o nome em destaque.
 * É um reforço visual: o leitor de tela já recebe a qualidade pelo selo, então a escala é escondida dele.
 */
export function QualityScale({ quality }: { quality: Quality }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.wrap}>
      <View style={styles.bars}>
        {ORDER.map((level) => (
          <View
            key={level}
            style={[styles.segment, { backgroundColor: level === quality ? QUALITY_INFO[level].bar : colors.track }]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        {ORDER.map((level) => (
          <Text key={level} style={[styles.label, level === quality && styles.labelActive]}>
            {QUALITY_INFO[level].label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  bars: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 10, borderRadius: 5 },
  labels: { flexDirection: 'row', gap: spacing.xs },
  label: { flex: 1, textAlign: 'center', fontSize: 14, color: colors.textMuted },
  labelActive: { fontWeight: '700', color: colors.text },
});
