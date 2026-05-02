import { useCallback, useEffect, useRef, useState } from 'react';
import type { PollSnapshotData, VacancyItem } from '../../types';
import { diffNewVacancyIds, emptySnapshot, mergeSnapshot } from '../../services/pollSnapshot';
import { fetchVacanciesForSavedSearch } from '../../services/hhClient';
import { mergeLocalState, readLocalState } from '../../services/storage';
import { useAuth } from '../auth/AuthProvider';
import { usePollingDispatch } from './PollingStateContext';
import { usePollScheduler } from './usePollScheduler';

export function PollingCoordinator() {
  const { session } = useAuth();
  const dispatch = usePollingDispatch();
  const snapshotRef = useRef<PollSnapshotData>(emptySnapshot());
  const [, bump] = useState(0);

  useEffect(() => {
    const onStorage = () => bump((n) => n + 1);
    window.addEventListener('hh-auto:storage', onStorage);
    return () => window.removeEventListener('hh-auto:storage', onStorage);
  }, []);

  const runPoll = useCallback(async () => {
    const token = session.accessToken;
    if (!token) return;

    const monitoring = readLocalState().subscriptionMonitoring;
    const enabledIds = Object.entries(monitoring)
      .filter(([, v]) => v === true)
      .map(([id]) => id);

    if (enabledIds.length === 0) return;

    try {
      const nextSnap: PollSnapshotData = {
        vacancyIdsBySubscription: {},
        lastSuccessfulPollAt: new Date().toISOString(),
      };

      const vacanciesBySub: VacancyItem[][] = [];

      for (const subId of enabledIds) {
        const rows = await fetchVacanciesForSavedSearch(token, subId);
        vacanciesBySub.push(rows);
        nextSnap.vacancyIdsBySubscription[subId] = rows.map((r) => r.id);
      }

      const prev = snapshotRef.current;
      const hasBaseline = Object.keys(prev.vacancyIdsBySubscription).length > 0;
      const delta = hasBaseline ? diffNewVacancyIds(prev, nextSnap) : {};

      snapshotRef.current = mergeSnapshot(prev, nextSnap);

      const added: VacancyItem[] = [];
      for (const subId of Object.keys(delta)) {
        const ids = new Set(delta[subId]);
        const idx = enabledIds.indexOf(subId);
        const rows = idx >= 0 ? vacanciesBySub[idx] : [];
        for (const row of rows) {
          if (ids.has(row.id)) added.push(row);
        }
      }

      const at = nextSnap.lastSuccessfulPollAt ?? new Date().toISOString();
      mergeLocalState({ lastPollAt: at });

      dispatch({ type: 'success', at, added: hasBaseline ? added : [] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка опроса hh.ru';
      dispatch({ type: 'error', message: msg });
    }
  }, [session.accessToken, dispatch]);

  const settings = readLocalState();
  const monitoring = readLocalState().subscriptionMonitoring;
  const anyEnabled = Object.values(monitoring).some((v) => v === true);

  usePollScheduler({
    intervalMinutes: settings.pollIntervalMinutes,
    enabled: Boolean(session.accessToken && anyEnabled),
    onTick: () => {
      void runPoll();
    },
  });

  return null;
}
