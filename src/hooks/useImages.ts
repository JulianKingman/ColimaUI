import { useState, useEffect, useCallback } from 'react';
import type { DockerImage } from '../types/docker';
import { dockerService } from '../services/docker';

export function useImages() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await dockerService.listImages();
      setImages(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch images');
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

  return { images, loading, error, refresh };
}
