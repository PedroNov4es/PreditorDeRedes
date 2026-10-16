import { minimumQuality, qualityRank } from '../domain/quality';
import type { Activity, Quality, TimelineItem } from '../types/api';

/** Estrutura de agregação dos indicadores de uma linha do tempo de previsões. */
export interface TimelineSummary {
  count: number;
  avgRttMs: number;
  minRttMs: number;
  maxRttMs: number;
  avgLossPct: number;
  byQuality: Record<Quality, number>;
}

export function summarize(items: readonly TimelineItem[]): TimelineSummary | null {
  if (items.length === 0) return null;
  const byQuality: Record<Quality, number> = { GOOD: 0, MODERATE: 0, UNSTABLE: 0 };
  let rttSum = 0;
  let lossSum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const item of items) {
    byQuality[item.quality] += 1;
    rttSum += item.predictedAvgRttMs;
    lossSum += item.predictedPacketLossPct;
    min = Math.min(min, item.predictedAvgRttMs);
    max = Math.max(max, item.predictedAvgRttMs);
  }
  return {
    count: items.length,
    avgRttMs: rttSum / items.length,
    minRttMs: min,
    maxRttMs: max,
    avgLossPct: lossSum / items.length,
    byQuality,
  };
}

export interface BestWindow {
  quality: Quality;
  start: string;
  end: string;
  length: number;
}

/**
 * Maior sequência consecutiva de períodos com a melhor qualidade presente.
 * Em caso de empate, vence a janela mais cedo.
 */
export function bestWindow(items: readonly TimelineItem[]): BestWindow | null {
  if (items.length === 0) return null;
  const best = items.reduce((acc, item) => Math.max(acc, qualityRank(item.quality)), 0);
  let result: BestWindow | null = null;
  let i = 0;
  while (i < items.length) {
    if (qualityRank(items[i].quality) !== best) {
      i += 1;
      continue;
    }
    let j = i;
    while (j + 1 < items.length && qualityRank(items[j + 1].quality) === best) j += 1;
    const length = j - i + 1;
    if (result === null || length > result.length) {
      result = { quality: items[i].quality, start: items[i].predictionFor, end: items[j].predictionFor, length };
    }
    i = j + 1;
  }
  return result;
}

/**
 * Melhor horário para uma atividade: entre os períodos que atendem à qualidade
 * mínima, o de maior score (empate -> o mais cedo). null se nenhum atende.
 */
export function bestPeriodFor(items: readonly TimelineItem[], activity: Activity): TimelineItem | null {
  const minRank = qualityRank(minimumQuality(activity));
  let best: TimelineItem | null = null;
  for (const item of items) {
    if (qualityRank(item.quality) < minRank) continue;
    if (best === null || item.qualityScore > best.qualityScore) best = item;
  }
  return best;
}
