import { router } from 'expo-router';

/**
 * Volta para a tela anterior; se não houver (ex.: a página foi recarregada direto numa
 * tela interna, na web), vai para a tela inicial. Evita o erro "GO_BACK was not handled".
 */
export function goBackOrHome(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
