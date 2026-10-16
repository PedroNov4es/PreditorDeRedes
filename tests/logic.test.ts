import assert from 'node:assert/strict';
import { test } from 'node:test';
import { minimumQuality, suitabilityFor } from '../src/domain/quality';
import { bestPeriodFor, bestWindow, summarize } from '../src/lib/aggregate';
import { formatNumber } from '../src/lib/format';
import { RingBuffer } from '../src/lib/ringBuffer';
import type { Quality, TimelineItem } from '../src/types/api';

const item = (hour: number, quality: Quality, rtt: number, loss: number, score: number): TimelineItem => ({
  predictionFor: `2026-08-20T${String(hour).padStart(2, '0')}:00:00Z`,
  predictedAvgRttMs: rtt,
  predictedPacketLossPct: loss,
  quality,
  qualityScore: score,
});

const day: TimelineItem[] = [
  item(0, 'GOOD', 30, 0.2, 90),
  item(1, 'GOOD', 32, 0.3, 88),
  item(2, 'MODERATE', 70, 1.5, 60),
  item(3, 'GOOD', 28, 0.1, 92),
  item(4, 'GOOD', 29, 0.2, 91),
  item(5, 'GOOD', 31, 0.2, 90),
  item(6, 'UNSTABLE', 180, 6, 20),
];

test('RingBuffer sobrescreve o mais antigo quando cheia', () => {
  const buffer = new RingBuffer<number>(3);
  [1, 2, 3, 4, 5].forEach((n) => buffer.push(n));
  assert.equal(buffer.size, 3);
  assert.deepEqual(buffer.toArray(), [5, 4, 3]);
  assert.equal(buffer.latest(), 5);
});

test('RingBuffer vazia e clear', () => {
  const buffer = new RingBuffer<string>(2);
  assert.equal(buffer.latest(), undefined);
  assert.deepEqual(buffer.toArray(), []);
  buffer.push('a');
  buffer.clear();
  assert.equal(buffer.size, 0);
  assert.throws(() => new RingBuffer<number>(0), RangeError);
});

test('summarize agrega latência, perda e contagem por qualidade', () => {
  const s = summarize(day)!;
  assert.equal(s.count, 7);
  assert.equal(s.minRttMs, 28);
  assert.equal(s.maxRttMs, 180);
  assert.deepEqual(s.byQuality, { GOOD: 5, MODERATE: 1, UNSTABLE: 1 });
  assert.equal(summarize([]), null);
});

test('bestWindow devolve a maior sequência da melhor qualidade', () => {
  const w = bestWindow(day)!;
  assert.equal(w.quality, 'GOOD');
  assert.equal(w.length, 3);
  assert.equal(w.start, '2026-08-20T03:00:00Z');
  assert.equal(w.end, '2026-08-20T05:00:00Z');
  assert.equal(bestWindow([]), null);
});

test('bestPeriodFor respeita a qualidade mínima da atividade', () => {
  assert.equal(bestPeriodFor(day, 'VIDEO_CALL')!.predictionFor, '2026-08-20T03:00:00Z');
  assert.equal(bestPeriodFor([day[6]], 'VIDEO_CALL'), null);
  assert.equal(bestPeriodFor([day[6]], 'MESSAGING')!.quality, 'UNSTABLE');
});

test('suitabilityFor: adequada, com ressalvas e não recomendada', () => {
  assert.equal(minimumQuality('VIDEO_CALL'), 'GOOD');
  assert.equal(suitabilityFor('VIDEO_CALL', 'GOOD'), 'ADEQUATE');
  assert.equal(suitabilityFor('VIDEO_CALL', 'MODERATE'), 'WITH_CAVEATS');
  assert.equal(suitabilityFor('VIDEO_CALL', 'UNSTABLE'), 'NOT_RECOMMENDED');
  assert.equal(suitabilityFor('WEB_BROWSING', 'MODERATE'), 'ADEQUATE');
  assert.equal(suitabilityFor('WEB_BROWSING', 'UNSTABLE'), 'WITH_CAVEATS');
  assert.equal(suitabilityFor('MESSAGING', 'UNSTABLE'), 'ADEQUATE');
});

test('formatNumber usa vírgula decimal', () => {
  assert.equal(formatNumber(62.64), '62,6');
  assert.equal(formatNumber(3, 0), '3');
});
