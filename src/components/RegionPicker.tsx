import { View } from 'react-native';
import type { Region } from '../domain/regions';
import { spacing } from '../theme';
import { ChoiceButton } from './ChoiceButton';

interface Props {
  regions: Region[];
  probeId: number;
  onSelect: (probeId: number) => void;
}

/** Escolha de região por toque simples, sem GPS (RNF06, RNF10). */
export function RegionPicker({ regions, probeId, onSelect }: Props) {
  return (
    <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
      {regions.map((region) => (
        <ChoiceButton
          key={region.probeId}
          label={region.name}
          selected={region.probeId === probeId}
          onPress={() => onSelect(region.probeId)}
        />
      ))}
    </View>
  );
}
