import { useState, useEffect, useCallback } from 'react';
import type { SystemDiskUsage } from '../types/docker';
import { dockerService } from '../services/docker';

export function useDiskUsage() {
  const [usage, setUsage] = useState<SystemDiskUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await dockerService.getSystemDiskUsage();
      setUsage(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch disk usage');
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

  return { usage, loading, error, refresh };
}
