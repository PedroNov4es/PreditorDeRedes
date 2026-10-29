import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_INFO, SUITABILITY_INFO, type Suitability } from '../domain/quality';
import { radius, spacing } from '../theme';
import type { Quality } from '../types/api';

interface Props {
  fg: string;
  bg: string;
  symbol: string;
  label: string;
  /** Texto lido pelo leitor de tela. */
  spoken: string;
  large?: boolean;
}

function Badge({ fg, bg, symbol, label, spoken, large }: Props) {
  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={[styles.badge, { backgroundColor: bg, borderColor: fg }]}
    >
      <Text style={[styles.symbol, { color: fg }, large && styles.symbolLarge]}>{symbol}</Text>
      <Text style={[styles.label, { color: fg }, large && styles.labelLarge]}>{label}</Text>
    </View>
  );
}

/** Qualidade em texto + símbolo + cor: nunca só por cor (RNF03). */
/**
 * `includeSummary={false}` evita ler a frase de resumo duas vezes quando ela já aparece como texto logo ao lado (F3).
 */
export function QualityBadge({
  quality,
  large = false,
  includeSummary = true,
}: {
  quality: Quality;
  large?: boolean;
  includeSummary?: boolean;
}) {
  const info = QUALITY_INFO[quality];
  return (
    <Badge
      fg={info.fg}
      bg={info.bg}
      symbol={info.symbol}
      label={info.label}
      spoken={includeSummary ? `Qualidade ${info.label}. ${info.summary}` : `Qualidade ${info.label}`}
      large={large}
    />
  );
}

export function SuitabilityBadge({ suitability, large = false }: { suitability: Suitability; large?: boolean }) {
  const info = SUITABILITY_INFO[suitability];
  return (
    <Badge fg={info.fg} bg={info.bg} symbol={info.symbol} label={info.label} spoken={`Atividade ${info.label}`} large={large} />
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  symbol: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  symbolLarge: { fontSize: 28, lineHeight: 36 },
  label: { flexShrink: 1, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  labelLarge: { fontSize: 24, lineHeight: 32 },
});
