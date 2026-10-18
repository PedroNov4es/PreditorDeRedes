import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

/** Quanto o primeiro bloco do conteúdo "sobe" sobre o cabeçalho, quando há `header`. */
export const HEADER_OVERLAP = 32;

interface Props {
  children: ReactNode;
  /** Faixa em largura total no topo (ver ScreenHeader). Sem ela, o layout é o de sempre. */
  header?: ReactNode;
}

/** Container rolável: sem alturas fixas, para suportar fonte ampliada (RNF05). */
export function Screen({ children, header }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: spacing.xl + insets.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      <View style={[styles.content, header ? styles.contentOverHeader : styles.contentPlain]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  contentPlain: { paddingTop: spacing.lg },
  contentOverHeader: { marginTop: -HEADER_OVERLAP },
});
