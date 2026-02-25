import { useState, useEffect, useCallback, useRef } from 'react';
import type { Container, ComposeProject } from '../types/docker';
import { dockerService } from '../services/docker';

export function useContainers(pollInterval = 3000) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await dockerService.listContainers();
      setContainers(data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch containers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    intervalRef.current = setInterval(fetch, pollInterval);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetch, pollInterval]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetch();
  }, [fetch]);

  // Group containers by compose project
  const projects: ComposeProject[] = [];
  const standalone: Container[] = [];

  containers.forEach((c) => {
    const projectName = c.Labels['com.docker.compose.project'];
    if (projectName) {
      let project = projects.find((p) => p.name === projectName);
      if (!project) {
        project = { name: projectName, containers: [] };
        projects.push(project);
      }
      project.containers.push(c);
    } else {
      standalone.push(c);
    }
  });

  return { containers, projects, standalone, loading, error, refresh };
}
