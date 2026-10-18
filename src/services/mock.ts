/**
 * Dados simulados (mitigação do risco R07). Ativados com EXPO_PUBLIC_USE_MOCK=true.
 * Espelha o contrato da API e as mesmas regras de classificação
 * (RTT 60/150 ms; perda 1/5 %), com 10 regiões e 24 horas de previsão.
 */
import type {
  ActivityCheckRequest,
  ActivityCheckResponse,
  CompareResponse,
  LocationsResponse,
  ProbeForecastResponse,
  Quality,
  TimelineItem,
  TimelineResponse,
} from '../types/api';
import { ApiError } from './errors';
import { minimumQuality, qualityRank } from '../domain/quality';

const PROBES = [
  [900001, -23.5505, -46.6333],
  [900002, -22.9068, -43.1729],
  [900003, -19.9167, -43.9345],
  [900004, -15.7975, -47.8919],
  [900005, -12.9714, -38.5014],
  [900006, -8.0476, -34.877],
  [900007, -3.7172, -38.5434],
  [900008, -25.4284, -49.2733],
  [900009, -30.0346, -51.2177],
  [900010, -3.119, -60.0217],
] as const;

const MODELS = [
  { id: 'model-a', name: 'Modelo A', version: '1.0', factor: 1.0 },
  { id: 'model-b', name: 'Modelo B', version: '1.0', factor: 1.15 },
  { id: 'model-c', name: 'Modelo C', version: '1.0', factor: 0.8 },
  { id: 'model-d', name: 'Modelo D', version: '1.0', factor: 1.25 },
];

const BASE_DAY = Date.UTC(2026, 7, 20); // 20/08/2026, como a fixture da API

const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250));

function classify(rtt: number, loss: number): { quality: Quality; score: number } {
  const level = (v: number, mod: number, uns: number): Quality => (v >= uns ? 'UNSTABLE' : v >= mod ? 'MODERATE' : 'GOOD');
  const a = level(rtt, 60, 150);
  const b = level(loss, 1, 5);
  const quality = qualityRank(a) <= qualityRank(b) ? a : b;
  const score = Math.round(Math.min(100, Math.max(0, Math.max(0, 1 - rtt / 200) * 70 + Math.max(0, 1 - loss / 10) * 30)));
  return { quality, score };
}

function series(probeId: number, modelId: string): TimelineItem[] {
  const index = PROBES.findIndex(([id]) => id === probeId);
  const model = MODELS.find((m) => m.id === modelId);
  if (index < 0 || !model) throw new ApiError('http', 404, 'PROBE_NOT_FOUND');
  const items: TimelineItem[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    const evening = hour >= 18 && hour <= 22 ? 1 : 0;
    const night = hour <= 5 ? -1 : 0;
    const rtt = Math.round((28 + index * 6 + evening * 45 + night * 8 + (hour % 4) * 3) * model.factor * 10) / 10;
    const loss = Math.round((0.3 + index * 0.25 + evening * 2.2 + (hour % 3) * 0.2) * model.factor * 10) / 10;
    const { quality, score } = classify(rtt, loss);
    items.push({
      predictionFor: new Date(BASE_DAY + hour * 3600_000).toISOString(),
      predictedAvgRttMs: rtt,
      predictedPacketLossPct: loss,
      quality,
      qualityScore: score,
    });
  }
  return items;
}

function current(items: TimelineItem[]): TimelineItem {
  const now = Date.now();
  return items.find((item) => new Date(item.predictionFor).getTime() >= now) ?? items[items.length - 1];
}

export function getLocations(): Promise<LocationsResponse> {
  const items = PROBES.map(([probeId, latitude, longitude]) => ({
    probeId,
    countryCode: 'BR',
    asnV4: null,
    asnV6: null,
    location: { latitude, longitude },
  }));
  return delay({ items, total: items.length });
}

export function getProbeForecast(probeId: number, modelId: string): Promise<ProbeForecastResponse> {
  const model = MODELS.find((m) => m.id === modelId);
  const probe = PROBES.find(([id]) => id === probeId);
  if (!model || !probe) return Promise.reject(new ApiError('http', 404, 'PROBE_NOT_FOUND'));
  const item = current(series(probeId, modelId));
  const message = {
    GOOD: 'A conexão prevista está adequada para atividades online neste período.',
    MODERATE: 'A conexão pode apresentar alguma instabilidade neste período.',
    UNSTABLE: 'Considere preparar recursos offline para este período.',
  }[item.quality];
  const code = ({ GOOD: 'NORMAL_USE', MODERATE: 'REDUCE_NETWORK_USAGE', UNSTABLE: 'PREPARE_OFFLINE' } as const)[item.quality];
  return delay({
    model: { id: model.id, name: model.name, version: model.version },
    probeId,
    location: { latitude: probe[1], longitude: probe[2], countryCode: 'BR' },
    prediction: {
      predictionFor: item.predictionFor,
      predictedAvgRttMs: item.predictedAvgRttMs,
      predictedPacketLossPct: item.predictedPacketLossPct,
      modelConfidence: 0.82,
    },
    assessment: { quality: item.quality, qualityScore: item.qualityScore },
    recommendation: { code, message },
  });
}

export function getTimeline(probeId: number, modelId: string, limit: number): Promise<TimelineResponse> {
  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return Promise.reject(new ApiError('http', 404, 'MODEL_NOT_FOUND'));
  try {
    return delay({
      model: { id: model.id, name: model.name, version: model.version },
      probeId,
      items: series(probeId, modelId).slice(0, limit),
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function compareModels(probeId: number, predictionFor?: string): Promise<CompareResponse> {
  try {
    const base = series(probeId, 'model-a');
    const target = predictionFor ? base.find((i) => i.predictionFor === predictionFor) : current(base);
    if (!target) return Promise.reject(new ApiError('http', 404, 'NO_COMMON_PREDICTION'));
    return delay({
      probeId,
      predictionFor: target.predictionFor,
      models: MODELS.map((m) => {
        const item = series(probeId, m.id).find((i) => i.predictionFor === target.predictionFor) as TimelineItem;
        return {
          modelId: m.id,
          modelName: m.name,
          predictedAvgRttMs: item.predictedAvgRttMs,
          predictedPacketLossPct: item.predictedPacketLossPct,
          quality: item.quality,
        };
      }),
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function checkActivity(body: ActivityCheckRequest): Promise<ActivityCheckResponse> {
  const probe = PROBES.reduce((best, p) =>
    Math.hypot(p[1] - body.latitude, p[2] - body.longitude) < Math.hypot(best[1] - body.latitude, best[2] - body.longitude) ? p : best,
  );
  const model = MODELS.find((m) => m.id === body.modelId);
  if (!model) return Promise.reject(new ApiError('http', 404, 'MODEL_NOT_FOUND'));
  const target = new Date(body.dateTime).getTime();
  const item = series(probe[0], model.id).reduce((best, i) =>
    Math.abs(new Date(i.predictionFor).getTime() - target) < Math.abs(new Date(best.predictionFor).getTime() - target) ? i : best,
  );
  const suitable = qualityRank(item.quality) >= qualityRank(minimumQuality(body.activity));
  return delay({
    model: { id: model.id, name: model.name, version: model.version },
    activity: body.activity,
    suitable,
    forecast: { quality: item.quality, predictedAvgRttMs: item.predictedAvgRttMs, predictedPacketLossPct: item.predictedPacketLossPct },
    recommendation: {
      code: item.quality === 'GOOD' ? 'NORMAL_USE' : item.quality === 'MODERATE' ? 'REDUCE_NETWORK_USAGE' : 'PREPARE_OFFLINE',
      message: suitable ? 'A conexão prevista atende a esta atividade neste período.' : 'A conexão prevista pode não atender a esta atividade neste período.',
    },
    metadata: { disclaimer: 'Dados simulados para desenvolvimento.', locationPrivacy: 'Nenhuma localização do aparelho é usada.' },
  });
}
