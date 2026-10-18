import { StyleSheet, View } from 'react-native';
import { ESTIMATE_NOTICE } from '../domain/glossary';
import { colors, radius, spacing } from '../theme';
import { Caption } from './Typography';

/** RNF13: toda previsão deixa claro que é uma estimativa. */
export function EstimateNotice({ extra }: { extra?: string }) {
  return (
    <View style={styles.box}>
      <Caption>{extra ? `${ESTIMATE_NOTICE} ${extra}` : ESTIMATE_NOTICE}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius / 2,
  },
});
