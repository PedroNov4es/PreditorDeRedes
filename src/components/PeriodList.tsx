import { StyleSheet, Text, View } from 'react-native';
import { QUALITY_INFO } from '../domain/quality';
import { formatNumber, formatPeriod } from '../lib/format';
import { spacing } from '../theme';
import type { TimelineItem } from '../types/api';
import { ChoiceButton } from './ChoiceButton';

interface Props {
  items: TimelineItem[];
  selectedTime: string | null;
  onSelect: (item: TimelineItem) => void;
}

/** Lista de períodos futuros (RQ02) com seleção por toque (RQ04). */
export function PeriodList({ items, selectedTime, onSelect }: Props) {
  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
      {items.map((item) => {
        const info = QUALITY_INFO[item.quality];
        const when = formatPeriod(item.predictionFor);
        const detail = `Latência ${formatNumber(item.predictedAvgRttMs)} ms · Perda ${formatNumber(item.predictedPacketLossPct)}%`;
        return (
          <ChoiceButton
            key={item.predictionFor}
            label={`${when} — ${info.symbol} ${info.label}`}
            accessibilityLabel={`${when}, qualidade ${info.label}. ${detail.replace('·', ',')}`}
            selected={item.predictionFor === selectedTime}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.detail}>{detail}</Text>
          </ChoiceButton>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  detail: { fontSize: 14, lineHeight: 20, color: '#425066' },
});
