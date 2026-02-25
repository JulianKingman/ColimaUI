import { useState, useEffect, useCallback } from 'react';
import type { DockerVolume } from '../types/docker';
import { dockerService } from '../services/docker';

export function useVolumes() {
  const [volumes, setVolumes] = useState<DockerVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await dockerService.listVolumes();
      setVolumes(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch volumes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetch();
  }, [fetch]);

  return { volumes, loading, error, refresh };
}
