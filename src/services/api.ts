import { API_BASE_URL, REQUEST_TIMEOUT_MS, USE_MOCK } from '../config';
import type {
  ActivityCheckRequest,
  ActivityCheckResponse,
  ApiErrorBody,
  CompareResponse,
  LocationsResponse,
  ProbeForecastResponse,
  TimelineResponse,
} from '../types/api';
import { ApiError } from './errors';
import * as mock from './mock';

export { ApiError, toApiError } from './errors';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
    });
    if (!response.ok) {
      let code: string | undefined;
      let technical: string | undefined;
      try {
        const body = (await response.json()) as ApiErrorBody;
        code = body.error?.code;
        technical = body.error?.message;
      } catch {
        // corpo vazio ou não-JSON: mantém só o status
      }
      throw new ApiError('http', response.status, code, technical);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new ApiError('timeout');
    throw new ApiError('network', undefined, undefined, String(error));
  } finally {
    clearTimeout(timer);
  }
}

const query = (params: Record<string, string | number | undefined>) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

/** GET /api/v1/locations: sondas (regiões) com previsão disponível. */
export function getLocations(): Promise<LocationsResponse> {
  if (USE_MOCK) return mock.getLocations();
  return request('/api/v1/locations');
}

/** GET /api/v1/forecasts/probes/{id}: previsão "atual" da região (RQ01). */
export function getProbeForecast(probeId: number, modelId: string): Promise<ProbeForecastResponse> {
  if (USE_MOCK) return mock.getProbeForecast(probeId, modelId);
  return request(`/api/v1/forecasts/probes/${probeId}?${query({ model_id: modelId })}`);
}

/** GET /api/v1/forecasts/probes/{id}/timeline: períodos futuros (RQ02, RQ04). */
export function getTimeline(probeId: number, modelId: string, limit: number): Promise<TimelineResponse> {
  if (USE_MOCK) return mock.getTimeline(probeId, modelId, limit);
  return request(`/api/v1/forecasts/probes/${probeId}/timeline?${query({ model_id: modelId, limit })}`);
}

/** GET /api/v1/forecasts/probes/{id}/compare: o que cada modelo prevê para um instante. */
export function compareModels(probeId: number, predictionFor?: string): Promise<CompareResponse> {
  if (USE_MOCK) return mock.compareModels(probeId, predictionFor);
  return request(`/api/v1/forecasts/probes/${probeId}/compare?${query({ prediction_for: predictionFor })}`);
}

/** POST /api/v1/activity/check: a atividade é adequada neste horário? (RQ03) */
export function checkActivity(body: ActivityCheckRequest): Promise<ActivityCheckResponse> {
  if (USE_MOCK) return mock.checkActivity(body);
  return request('/api/v1/activity/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
