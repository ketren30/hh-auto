import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { mergeLocalState, readLocalState } from '../../services/storage';

export function SoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(() => readLocalState().soundEnabled);

  useEffect(() => {
    const sync = () => setSoundEnabled(readLocalState().soundEnabled);
    window.addEventListener('hh-auto:storage', sync);
    return () => window.removeEventListener('hh-auto:storage', sync);
  }, []);

  const toggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    mergeLocalState({ soundEnabled: next });
  };

  return (
    <div>
      <h1>Звук при новых вакансиях</h1>
      <p style={{ color: '#9aa0a6' }}>
        Воспроизводится короткий сигнал при появлении новых позиций в результате опроса (если браузер
        разрешает воспроизведение).
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={soundEnabled} onChange={toggle} />
        Звуковые уведомления включены
      </label>
      <div style={{ marginTop: 16 }}>
        <Button variant="ghost" onClick={toggle}>
          {soundEnabled ? 'Выключить звук' : 'Включить звук'}
        </Button>
      </div>
    </div>
  );
}
