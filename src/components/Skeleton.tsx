import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

/** Bloco cinza que marca o lugar de um conteúdo em carregamento. Escondido de leitores de tela. */
export function Skeleton({ height = 24 }: { height?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { height }]}
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.track, borderRadius: 8, alignSelf: 'stretch' },
});
