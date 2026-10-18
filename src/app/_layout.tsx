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
        <Stack.Screen name="index" options={{ title: 'Previsão' }} />
        <Stack.Screen name="detalhes" options={{ title: 'Detalhes' }} />
        <Stack.Screen name="atividade" options={{ title: 'Atividade' }} />
      </Stack>
    </SelectionProvider>
  );
}
