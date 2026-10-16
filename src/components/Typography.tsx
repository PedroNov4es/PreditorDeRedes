import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors } from '../theme';

/** Títulos anunciados como "cabeçalho" por TalkBack/VoiceOver (RNF02, RNF08). */
export function Heading({ children, level = 1 }: { children: ReactNode; level?: 1 | 2 }) {
  return (
    <Text accessibilityRole="header" style={level === 1 ? styles.h1 : styles.h2}>
      {children}
    </Text>
  );
}

export function Body({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.body, style]}>
      {children}
    </Text>
  );
}

export function Caption({ children, style, ...rest }: TextProps) {
  return (
    <Text {...rest} style={[styles.caption, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.text },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  caption: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
});
