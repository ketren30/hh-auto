import { useCallback, useEffect, useState } from 'react';
import { mergeLocalState, readLocalState } from '../../services/storage';

export function useSubscriptionMonitoring() {
  const [map, setMap] = useState(() => readLocalState().subscriptionMonitoring);

  useEffect(() => {
    const sync = () => setMap({ ...readLocalState().subscriptionMonitoring });
    window.addEventListener('hh-auto:storage', sync);
    return () => window.removeEventListener('hh-auto:storage', sync);
  }, []);

  const setMonitoring = useCallback((subscriptionId: string, enabled: boolean) => {
    mergeLocalState({
      subscriptionMonitoring: {
        ...readLocalState().subscriptionMonitoring,
        [subscriptionId]: enabled,
      },
    });
    setMap({ ...readLocalState().subscriptionMonitoring });
  }, []);

  const isMonitoringEnabled = useCallback(
    (subscriptionId: string) => map[subscriptionId] === true,
    [map],
  );

  return { subscriptionMonitoring: map, setMonitoring, isMonitoringEnabled };
}
