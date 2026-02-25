import { useState, useEffect, useCallback, useRef } from 'react';
import { dockerService, startColima } from '../services/docker';

type ConnectionState = null | true | false; // null = checking, true = connected, false = disconnected

export function useDockerConnection(pollInterval = 3000) {
  const [connected, setConnected] = useState<ConnectionState>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const result = await dockerService.ping();
      setConnected(result.connected);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, pollInterval);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [check, pollInterval]);

  const handleStartColima = useCallback(async () => {
    setStarting(true);
    setStartError(null);
    try {
      const result = await startColima();
      if (result.exitCode !== 0) {
        setStartError(result.stderr || `Exit code ${result.exitCode}`);
      }
      // Trigger an immediate re-check
      await check();
    } catch (e: any) {
      setStartError(e.message ?? 'Failed to start Colima');
    } finally {
      setStarting(false);
    }
  }, [check]);

  return { connected, starting, startError, startColima: handleStartColima };
}
