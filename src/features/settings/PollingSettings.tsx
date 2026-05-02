import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '../../components/Button';
import { mergeLocalState, MIN_POLL_INTERVAL_MINUTES, readLocalState } from '../../services/storage';

const inp: CSSProperties = {
  width: '100%',
  maxWidth: 120,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#1e222a',
  border: '1px solid #3d4555',
  color: '#e8eaed',
};

export function PollingSettings() {
  const [minutes, setMinutes] = useState(() => readLocalState().pollIntervalMinutes);

  useEffect(() => {
    const sync = () => setMinutes(readLocalState().pollIntervalMinutes);
    window.addEventListener('hh-auto:storage', sync);
    return () => window.removeEventListener('hh-auto:storage', sync);
  }, []);

  const clamped =
    Number.isFinite(minutes) && minutes >= MIN_POLL_INTERVAL_MINUTES
      ? Math.floor(minutes)
      : MIN_POLL_INTERVAL_MINUTES;
  const belowInput =
    Number.isFinite(minutes) && minutes < MIN_POLL_INTERVAL_MINUTES
      ? `Минимальный интервал — ${MIN_POLL_INTERVAL_MINUTES} минут (политика продукта и лимиты hh.ru).`
      : undefined;

  const save = () => {
    mergeLocalState({ pollIntervalMinutes: clamped });
  };

  return (
    <div>
      <h1>Интервал опроса</h1>
      <p style={{ color: '#9aa0a6' }}>
        Опрос выполняется, пока открыта вкладка с приложением. Значение не ниже {MIN_POLL_INTERVAL_MINUTES}{' '}
        минут.
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <span>Интервал (минуты)</span>
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          style={inp}
        />
      </label>
      {belowInput ? (
        <p style={{ color: '#f6aea9', marginTop: 8 }}>{belowInput}</p>
      ) : (
        <p style={{ color: '#9aa0a6', marginTop: 8 }}>
          При сохранении значение будет поднято до минимума, если оно ниже порога.
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <Button onClick={save}>Сохранить</Button>
      </div>
    </div>
  );
}
