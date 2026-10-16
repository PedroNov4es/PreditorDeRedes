/**
 * Configuração do app.
 *
 * - EXPO_PUBLIC_API_URL: URL base da API (sem barra final).
 *     Emulador Android -> http://10.0.2.2:8080 (padrão)
 *     Simulador iOS    -> http://localhost:8080
 *     Celular físico   -> http://<IP-da-máquina>:8080 (mesma rede Wi-Fi)
 * - EXPO_PUBLIC_USE_MOCK=true: usa dados simulados locais (mitigação do risco R07).
 * - EXPO_PUBLIC_MODEL_ID: modelo preditivo consumido (padrão: model-a).
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080').replace(/\/+$/, '');
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';
export const DEFAULT_MODEL_ID = process.env.EXPO_PUBLIC_MODEL_ID ?? 'model-a';
export const REQUEST_TIMEOUT_MS = 8000;
export const TIMELINE_LIMIT = 24;
