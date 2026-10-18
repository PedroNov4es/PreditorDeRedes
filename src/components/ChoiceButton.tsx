import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Texto lido pelo leitor de tela; por padrão, o próprio label. */
  accessibilityLabel?: string;
  children?: ReactNode;
}

/**
 * Opção de escolha única (rádio). O estado selecionado aparece por marca textual
 * "✓", borda grossa e fundo, e é anunciado pelo leitor de tela (RNF03).
 */
export function ChoiceButton({ label, selected, onPress, accessibilityLabel, children }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={[styles.base, selected && styles.selected]}
    >
      <View style={styles.row}>
        <Text style={styles.mark}>{selected ? '✓' : '○'}</Text>
        <View style={styles.body}>
          <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
          {children}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  selected: { borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.selectedBg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  mark: { fontSize: 18, color: colors.primary, fontWeight: '700', width: 22, textAlign: 'center' },
  body: { flex: 1, gap: spacing.xs },
  label: { fontSize: 16, color: colors.text },
  labelSelected: { fontWeight: '700' },
});
