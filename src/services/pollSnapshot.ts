import type { PollSnapshotData } from '../types';

export function emptySnapshot(): PollSnapshotData {
  return { vacancyIdsBySubscription: {} };
}

/** Returns vacancy IDs that appear in `next` but were not in `prev` for the same subscription. */
export function diffNewVacancyIds(
  prev: PollSnapshotData,
  next: PollSnapshotData,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const subId of Object.keys(next.vacancyIdsBySubscription)) {
    const prevSet = new Set(prev.vacancyIdsBySubscription[subId] ?? []);
    const nextIds = next.vacancyIdsBySubscription[subId] ?? [];
    const newly = nextIds.filter((id) => !prevSet.has(id));
    if (newly.length) result[subId] = newly;
  }
  return result;
}

export function mergeSnapshot(prev: PollSnapshotData, next: PollSnapshotData): PollSnapshotData {
  const mergedSubs: Record<string, string[]> = { ...prev.vacancyIdsBySubscription };
  for (const [subId, ids] of Object.entries(next.vacancyIdsBySubscription)) {
    const set = new Set(mergedSubs[subId] ?? []);
    for (const id of ids) set.add(id);
    mergedSubs[subId] = [...set];
  }
  return {
    lastSuccessfulPollAt: next.lastSuccessfulPollAt ?? prev.lastSuccessfulPollAt,
    vacancyIdsBySubscription: mergedSubs,
  };
}
