import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorBanner } from '../../components/ErrorBanner';
import { PollStatusBar } from '../../components/PollStatusBar';
import { listSavedSearches } from '../../services/hhClient';
import { readLocalState } from '../../services/storage';
import { usePollingState } from '../polling/PollingStateContext';
import { useAuth } from '../auth/AuthProvider';
import { useSubscriptionMonitoring } from './useSubscriptionMonitoring';

export function SubscriptionsPage() {
  const { session } = useAuth();
  const { setMonitoring, isMonitoringEnabled } = useSubscriptionMonitoring();
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const settings = readLocalState();
  const { lastSuccessfulPollAt, lastPollError } = usePollingState();

  useEffect(() => {
    if (!session.accessToken) return;
    setLoading(true);
    listSavedSearches(session.accessToken)
      .then(setItems)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Не удалось загрузить подписки'),
      )
      .finally(() => setLoading(false));
  }, [session.accessToken]);

  if (!session.accessToken) {
    return (
      <div>
        <ErrorBanner message="Войдите, чтобы увидеть подписки." />
        <Link to="/">На страницу входа</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Подписки hh.ru</h1>
      <p style={{ color: '#9aa0a6' }}>
        Включите мониторинг для подписок, которые нужно опрашивать. Настройки хранятся только в вашем
        браузере.
      </p>
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? (
        <p>Загрузка…</p>
      ) : items.length === 0 ? (
        <p>Нет сохранённых поисков или список пуст.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((s) => (
            <li
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid #2a2e36',
              }}
            >
              <label style={{ flex: 1, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isMonitoringEnabled(s.id)}
                  onChange={(e) => setMonitoring(s.id, e.target.checked)}
                  style={{ marginRight: 10 }}
                />
                {s.name}
              </label>
              <code style={{ fontSize: 12, color: '#9aa0a6' }}>{s.id}</code>
            </li>
          ))}
        </ul>
      )}
      <PollStatusBar
        pollIntervalMinutes={settings.pollIntervalMinutes}
        lastSuccessIso={lastSuccessfulPollAt}
        lastError={lastPollError}
        visibilityHint="Неактивные вкладки могут замедлять таймеры браузера — интервал опроса может отличаться от заданного."
      />
    </div>
  );
}
