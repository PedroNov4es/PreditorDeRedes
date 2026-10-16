import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  hint?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

/** Botão com área mínima de 48x48 dp (RNF09), papel e rótulo explícitos (RNF02). */
export function AppButton({ title, onPress, hint, variant = 'primary', disabled = false }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        primary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, primary ? styles.textPrimary : styles.textSecondary]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.bg, borderColor: colors.primary },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  textPrimary: { color: colors.onPrimary },
  textSecondary: { color: colors.primary },
});
