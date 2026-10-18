import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

/**
 * Card de destaque do resultado principal da tela, com uma faixa colorida no topo.
 * A cor (`accent`) é só reforço: o resultado também aparece em texto e símbolo (RNF03).
 */
export function HeroCard({ accent, children }: { accent?: string; children: ReactNode }) {
  return <View style={[styles.card, accent ? { borderTopColor: accent } : null]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderTopWidth: 6,
    borderColor: colors.border,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
});
