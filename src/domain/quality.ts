import type { Activity, Quality } from '../types/api';

/**
 * A API classifica em 3 níveis (GOOD, MODERATE, UNSTABLE). O app traduz para
 * linguagem simples (RNF07) e sempre exibe texto junto do símbolo (RNF03).
 */
export interface QualityInfo {
  label: string;
  summary: string;
  symbol: string;
  fg: string;
  bg: string;
  /** Cor sólida para barras e marcadores (contraste >= 3:1 contra branco e contra a superfície). */
  bar: string;
}

export const QUALITY_INFO: Record<Quality, QualityInfo> = {
  GOOD: {
    label: 'Boa',
    summary: 'Funciona bem para quase tudo.',
    symbol: '✔',
    fg: '#0B5D2A',
    bg: '#E3F4E8',
    bar: '#1B7F4B',
  },
  MODERATE: {
    label: 'Regular',
    summary: 'Funciona, com possíveis lentidões.',
    symbol: '!',
    fg: '#6B4200',
    bg: '#FFF1CC',
    bar: '#B26A00',
  },
  UNSTABLE: {
    label: 'Instável',
    summary: 'Pode oscilar ou cair. Evite tarefas críticas.',
    symbol: '✖',
    fg: '#9B1C1C',
    bg: '#FDE6E6',
    bar: '#B42318',
  },
};

/** Limites de um indicador: a partir de `moderate` é Regular; a partir de `unstable`, Instável. */
export interface Thresholds {
  moderate: number;
  unstable: number;
}

/**
 * Mesmos limiares da API (QualityClassifier): RTT 60/150 ms e perda 1/5 %, ambos
 * inclusivos (>=). São regras experimentais da API, usadas aqui só para desenhar as
 * faixas dos indicadores. A classificação geral da previsão continua vindo da API.
 */
export const RTT_THRESHOLDS: Thresholds = { moderate: 60, unstable: 150 };
export const LOSS_THRESHOLDS: Thresholds = { moderate: 1, unstable: 5 };

/** Nível de UM indicador (latência ou perda) segundo seus limites. */
export function levelFor(value: number, thresholds: Thresholds): Quality {
  if (value >= thresholds.unstable) return 'UNSTABLE';
  if (value >= thresholds.moderate) return 'MODERATE';
  return 'GOOD';
}

export function qualityRank(quality: Quality): number {
  switch (quality) {
    case 'UNSTABLE':
      return 0;
    case 'MODERATE':
      return 1;
    case 'GOOD':
      return 2;
  }
}

/** Mesma regra da API (ActivityRules.minimumQuality). */
export function minimumQuality(activity: Activity): Quality {
  switch (activity) {
    case 'VIDEO_CALL':
    case 'STREAMING':
      return 'GOOD';
    case 'AUDIO_CALL':
    case 'FILE_UPLOAD':
    case 'WEB_BROWSING':
      return 'MODERATE';
    case 'MESSAGING':
      return 'UNSTABLE';
  }
}

export const ACTIVITY_LABEL: Record<Activity, string> = {
  VIDEO_CALL: 'Videochamada',
  AUDIO_CALL: 'Chamada de áudio',
  STREAMING: 'Streaming de vídeo e música',
  FILE_UPLOAD: 'Envio de arquivos',
  WEB_BROWSING: 'Navegação na internet',
  MESSAGING: 'Mensagens',
};

export const ACTIVITIES = Object.keys(ACTIVITY_LABEL) as Activity[];

export type Suitability = 'ADEQUATE' | 'WITH_CAVEATS' | 'NOT_RECOMMENDED';

export const SUITABILITY_INFO: Record<Suitability, { label: string; symbol: string; fg: string; bg: string }> = {
  ADEQUATE: { label: 'Adequada', symbol: '✔', fg: '#0B5D2A', bg: '#E3F4E8' },
  WITH_CAVEATS: { label: 'Com ressalvas', symbol: '!', fg: '#6B4200', bg: '#FFF1CC' },
  NOT_RECOMMENDED: { label: 'Não recomendada', symbol: '✖', fg: '#9B1C1C', bg: '#FDE6E6' },
};

/**
 * Converte a qualidade prevista em "Adequada / Com ressalvas / Não recomendada".
 * Adequada = qualidade >= mínimo da atividade (mesmo critério do campo `suitable` da API).
 * Com ressalvas = um nível abaixo do mínimo. Abaixo disso = não recomendada.
 */
export function suitabilityFor(activity: Activity, quality: Quality): Suitability {
  const diff = qualityRank(quality) - qualityRank(minimumQuality(activity));
  if (diff >= 0) return 'ADEQUATE';
  if (diff === -1) return 'WITH_CAVEATS';
  return 'NOT_RECOMMENDED';
}
