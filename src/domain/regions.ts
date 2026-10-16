import type { LocationItem } from '../types/api';

/**
 * O app não usa GPS nem pede permissão de localização (RNF10).
 * O usuário escolhe uma região; a API devolve as sondas (probes) com latitude e
 * longitude, e o app só associa um nome amigável a cada uma.
 */
const NAMES: Record<number, string> = {
  900001: 'São Paulo (SP)',
  900002: 'Rio de Janeiro (RJ)',
  900003: 'Belo Horizonte (MG)',
  900004: 'Brasília (DF)',
  900005: 'Salvador (BA)',
  900006: 'Recife (PE)',
  900007: 'Fortaleza (CE)',
  900008: 'Curitiba (PR)',
  900009: 'Porto Alegre (RS)',
  900010: 'Manaus (AM)',
};

export interface Region {
  probeId: number;
  name: string;
  latitude: number;
  longitude: number;
}

export const DEFAULT_PROBE_ID = 900001;

export function regionName(probeId: number): string {
  return NAMES[probeId] ?? `Região ${probeId}`;
}

export function toRegions(items: LocationItem[]): Region[] {
  return items
    .map((item) => ({
      probeId: item.probeId,
      name: regionName(item.probeId),
      latitude: item.location.latitude,
      longitude: item.location.longitude,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
