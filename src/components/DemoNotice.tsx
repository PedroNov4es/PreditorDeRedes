import { StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../theme';

/** Aviso visível quando o app usa dados simulados (EXPO_PUBLIC_USE_MOCK=true), nunca da API. */
export function DemoNotice() {
  return (
    <Text accessibilityRole="alert" style={styles.box}>
      Dados de demonstração: valores simulados no aparelho, não vêm do serviço de previsão.
    </Text>
  );
}

const styles = StyleSheet.create({
  box: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.warningFg,
    backgroundColor: colors.warningBg,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
