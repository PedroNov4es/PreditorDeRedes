import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import { HEADER_OVERLAP } from './Screen';

interface Props {
  /** Nome curto do produto, em letras maiúsculas pequenas. */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Controles que ficam dentro da faixa (ex.: seletor de região). */
  children?: ReactNode;
}

/**
 * Faixa de identidade da tela: diz o que a tela faz e abriga o controle principal.
 * Reserva espaço embaixo para o primeiro bloco do conteúdo sobrepor a faixa (ver Screen).
 */
export function ScreenHeader({ eyebrow, title, subtitle, children }: Props) {
  return (
    <View style={styles.band}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children ? <View style={styles.slot}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: HEADER_OVERLAP + spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: spacing.xs,
  },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: colors.onHeaderEyebrow },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.onHeader },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.onHeaderMuted },
  slot: { marginTop: spacing.md, gap: spacing.sm },
});
