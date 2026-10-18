import { useEffect } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppButton } from './AppButton';
import { Body, Heading } from './Typography';

/** RNF12: carregamento visível e anunciado ao leitor de tela. */
export function LoadingState({ message = 'Carregando previsão…' }: { message?: string }) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      style={styles.center}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Body>{message}</Body>
    </View>
  );
}

/** RNF11: erro claro, em linguagem simples, com "Tentar novamente". */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Erro. ${message}`);
  }, [message]);
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
      <Heading level={2}>Não foi possível carregar</Heading>
      <Body>{message}</Body>
      <AppButton title="Tentar novamente" onPress={onRetry} hint="Faz a consulta de novo" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  error: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: colors.dangerBg,
  },
});
