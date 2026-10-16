import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SelectionProvider } from '../state/SelectionContext';
import { colors } from '../theme';

export default function Layout() {
  return (
    <SelectionProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.headerBg },
          headerTintColor: colors.onHeader,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Previsão da conexão' }} />
        <Stack.Screen name="detalhes" options={{ title: 'Detalhes da previsão' }} />
        <Stack.Screen name="atividade" options={{ title: 'Previsão por atividade' }} />
      </Stack>
    </SelectionProvider>
  );
}
