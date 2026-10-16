/** Tipos que espelham os DTOs da Connectivity Forecast API (/api/v1). */

export type Quality = 'GOOD' | 'MODERATE' | 'UNSTABLE';

export type Activity =
  | 'VIDEO_CALL'
  | 'AUDIO_CALL'
  | 'STREAMING'
  | 'FILE_UPLOAD'
  | 'WEB_BROWSING'
  | 'MESSAGING';

export type RecommendationCode = 'NORMAL_USE' | 'REDUCE_NETWORK_USAGE' | 'PREPARE_OFFLINE';

export interface ModelReference {
  id: string;
  name: string;
  version: string;
}

export interface Recommendation {
  code: RecommendationCode;
  message: string;
}

export interface Assessment {
  quality: Quality;
  qualityScore: number;
}

export interface ProbeForecastResponse {
  model: ModelReference;
  probeId: number;
  location: { latitude: number; longitude: number; countryCode: string };
  prediction: {
    predictionFor: string;
    predictedAvgRttMs: number;
    predictedPacketLossPct: number;
    modelConfidence: number | null;
  };
  assessment: Assessment;
  recommendation: Recommendation;
}

export interface TimelineItem {
  predictionFor: string;
  predictedAvgRttMs: number;
  predictedPacketLossPct: number;
  quality: Quality;
  qualityScore: number;
}

export interface TimelineResponse {
  model: ModelReference;
  probeId: number;
  items: TimelineItem[];
}

export interface LocationItem {
  probeId: number;
  countryCode: string;
  asnV4: number | null;
  asnV6: number | null;
  location: { latitude: number; longitude: number };
}

export interface LocationsResponse {
  items: LocationItem[];
  total: number;
}

export interface CompareModelItem {
  modelId: string;
  modelName: string;
  predictedAvgRttMs: number;
  predictedPacketLossPct: number;
  quality: Quality;
}

export interface CompareResponse {
  probeId: number;
  predictionFor: string;
  models: CompareModelItem[];
}

export interface ActivityCheckRequest {
  modelId: string;
  latitude: number;
  longitude: number;
  dateTime: string;
  activity: Activity;
}

export interface ActivityCheckResponse {
  model: ModelReference;
  activity: Activity;
  suitable: boolean;
  forecast: { quality: Quality; predictedAvgRttMs: number; predictedPacketLossPct: number };
  recommendation: Recommendation;
  metadata: { disclaimer: string; locationPrivacy: string };
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: { field: string; message: string }[] };
}
