import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../../components/ErrorBanner';
import { exchangeCodeForTokens, peekOAuthState, takeOAuthState } from '../../services/hhClient';
import { useAuth } from './AuthProvider';

/** React StrictMode в dev монтирует эффект дважды; второй обмен тем же code даёт invalid_grant. */
let oauthCodeExchangeLock: string | null = null;

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const expected = peekOAuthState();

    if (!code) {
      setError('Отсутствует параметр code в URL.');
      return;
    }
    if (oauthCodeExchangeLock === code) {
      return;
    }
    if (!state || state !== expected) {
      setError('Неверный state OAuth — попробуйте войти снова.');
      takeOAuthState();
      return;
    }
    oauthCodeExchangeLock = code;
    takeOAuthState();

    exchangeCodeForTokens(code)
      .then((tr) => {
        setTokens(tr);
        navigate('/subscriptions', { replace: true });
      })
      .catch((e: unknown) => {
        oauthCodeExchangeLock = null;
        setError(e instanceof Error ? e.message : 'Ошибка обмена кода');
      });
  }, [navigate, setTokens]);

  return (
    <div>
      <h1>Вход…</h1>
      {error ? <ErrorBanner message={error} /> : <p>Завершение авторизации…</p>}
    </div>
  );
}
