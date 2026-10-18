import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, MIN_TOUCH, radius, spacing } from '../theme';

interface Props {
  /** Nome da região escolhida. */
  name: string;
  open: boolean;
  /** Enquanto a lista de regiões carrega, o botão fica indisponível e avisa. */
  loading?: boolean;
  onToggle: () => void;
}

/**
 * Botão do cabeçalho que mostra a região escolhida e abre/fecha a lista de regiões.
 * Usa texto ("Trocar" / "Fechar") em vez de ícone: nada depende só de símbolo (RNF03).
 */
export function RegionSelect({ name, open, loading = false, onToggle }: Props) {
  const action = loading ? 'Carregando…' : open ? 'Fechar' : 'Trocar';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Região: ${name}. ${loading ? 'Carregando as regiões' : open ? 'Fechar a lista de regiões' : 'Trocar de região'}`}
      accessibilityState={{ expanded: open, busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onToggle}
      style={({ pressed }: { pressed: boolean }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text style={styles.caption}>Região</Text>
        <Text style={styles.name}>{name}</Text>
      </View>
      <Text style={styles.action}>{action}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.headerControlBorder,
    backgroundColor: colors.headerControlBg,
  },
  pressed: { opacity: 0.85 },
  texts: { flex: 1 },
  caption: { fontSize: 12, color: colors.onHeaderMuted },
  name: { fontSize: 18, fontWeight: '700', color: colors.onHeader },
  action: { fontSize: 14, fontWeight: '700', color: colors.onHeader },
});
