import { useEffect, useRef } from 'react';
import { readLocalState } from '../services/storage';

export function useNewVacancySound(newVacanciesCount: number): void {
  const prev = useRef(0);

  useEffect(() => {
    if (newVacanciesCount > prev.current && readLocalState().soundEnabled) {
      const audio = new Audio('/notification.mp3');
      void audio.play().catch(() => {
        /* autoplay policies */
      });
    }
    prev.current = newVacanciesCount;
  }, [newVacanciesCount]);
}
