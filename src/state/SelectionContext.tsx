import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_MODEL_ID } from '../config';
import { DEFAULT_PROBE_ID } from '../domain/regions';
import { RingBuffer } from '../lib/ringBuffer';
import type { Quality } from '../types/api';

export interface RecentConsultation {
  probeId: number;
  regionName: string;
  time: string;
  quality: Quality;
}

interface SelectionValue {
  probeId: number;
  modelId: string;
  /** Período escolhido (ISO UTC) ou null se ainda não escolhido. */
  selectedTime: string | null;
  recent: RecentConsultation[];
  selectRegion: (probeId: number) => void;
  selectTime: (time: string | null) => void;
  registerConsultation: (item: RecentConsultation) => void;
}

const SelectionContext = createContext<SelectionValue | null>(null);

const RECENT_CAPACITY = 5;

/** Guarda região e período escolhidos, compartilhados pelas três telas (P01, P02, P03). */
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [probeId, setProbeId] = useState(DEFAULT_PROBE_ID);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentConsultation[]>([]);
  const buffer = useRef(new RingBuffer<RecentConsultation>(RECENT_CAPACITY));

  const selectRegion = useCallback((id: number) => {
    setProbeId(id);
    setSelectedTime(null);
  }, []);

  const registerConsultation = useCallback((item: RecentConsultation) => {
    const last = buffer.current.latest();
    if (last && last.probeId === item.probeId && last.time === item.time) return;
    buffer.current.push(item);
    setRecent(buffer.current.toArray());
  }, []);

  const value = useMemo<SelectionValue>(
    () => ({
      probeId,
      modelId: DEFAULT_MODEL_ID,
      selectedTime,
      recent,
      selectRegion,
      selectTime: setSelectedTime,
      registerConsultation,
    }),
    [probeId, selectedTime, recent, selectRegion, registerConsultation],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection(): SelectionValue {
  const value = useContext(SelectionContext);
  if (!value) throw new Error('useSelection deve ser usado dentro de <SelectionProvider>');
  return value;
}
