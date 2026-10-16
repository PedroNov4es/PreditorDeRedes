import { StyleSheet, Text } from 'react-native';
import { Card } from './Section';
import { Body, Caption } from './Typography';
import { colors } from '../theme';

interface Props {
  title: string;
  value: string;
  /** Explicação em linguagem simples (RNF07), vinda do glossário. */
  explanation: string;
  note?: string;
}

export function MetricCard({ title, value, explanation, note }: Props) {
  return (
    <Card>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.value}>{value}</Text>
      <Body>{explanation}</Body>
      {note ? <Caption>{note}</Caption> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  value: { fontSize: 28, fontWeight: '700', color: colors.text },
});
