/**
 * Планировщик опроса на `setInterval`. В фоновых вкладках браузеры могут замедлять таймеры
 * (Page Visibility API / экономия энергии) — см. подсказку в `PollStatusBar`.
 */
import { useEffect, useRef } from 'react';
import { MIN_POLL_INTERVAL_MINUTES } from '../../services/storage';

export function usePollScheduler(options: {
  intervalMinutes: number;
  enabled: boolean;
  onTick: () => void;
}): void {
  const { intervalMinutes, enabled, onTick } = options;
  const tickRef = useRef(onTick);
  tickRef.current = onTick;

  const clamped = Math.max(intervalMinutes, MIN_POLL_INTERVAL_MINUTES);

  useEffect(() => {
    if (!enabled) return;

    const ms = clamped * 60 * 1000;
    const id = window.setInterval(() => {
      tickRef.current();
    }, ms);

    tickRef.current();

    return () => window.clearInterval(id);
  }, [enabled, clamped]);
}
