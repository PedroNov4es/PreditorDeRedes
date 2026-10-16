import { useMemo } from 'react';
import { toRegions, type Region } from '../domain/regions';
import { getLocations } from '../services/api';
import { useRequest } from './useRequest';

export function useRegions() {
  const request = useRequest(() => getLocations(), []);
  const regions: Region[] = useMemo(() => (request.data ? toRegions(request.data.items) : []), [request.data]);
  return { ...request, regions };
}
