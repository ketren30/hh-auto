import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  buildAuthorizeUrl,
  generatePkcePair,
  storeOAuthState,
  storePkceVerifier,
} from '../../services/hhClient';
import { useAuth } from './AuthProvider';

function randomState(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function LoginPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const clientConfigured = Boolean(import.meta.env.VITE_HH_CLIENT_ID?.trim());

  const startLogin = async () => {
    const { verifier, challenge } = await generatePkcePair();
    storePkceVerifier(verifier);
    const state = randomState();
    storeOAuthState(state);
    window.location.href = buildAuthorizeUrl({ state, codeChallenge: challenge });
  };

  if (session.authenticated) {
    return (
      <div>
        <p>Вы вошли в аккаунт hh.ru.</p>
        <Button onClick={() => navigate('/subscriptions')}>К подпискам</Button>{' '}
        <Button variant="ghost" onClick={logout}>
          Выйти
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1>Вход</h1>
      {!clientConfigured ? (
        <ErrorBanner message="Задайте VITE_HH_CLIENT_ID в .env (см. specs/001-hh-vacancy-monitor/contracts/env.example.md)." />
      ) : (
        <>
          <p style={{ color: '#9aa0a6', marginBottom: 16 }}>
            Используется OAuth с PKCE. Перенаправление на hh.ru.
          </p>
          <p style={{ fontSize: 13, color: '#9aa0a6', marginBottom: 16 }}>
            Если redirect URI в кабинете hh уже задан и его нельзя поменять — скопируйте его в{' '}
            <code>.env</code> как <code>VITE_OAUTH_REDIRECT_URI</code> (например{' '}
            <code>http://localhost:3000/oauth/callback</code>) и заходите на приложение по тому же URL.
          </p>
        </>
      )}
      <Button disabled={!clientConfigured} onClick={() => void startLogin()}>
        Войти через hh.ru
      </Button>
    </div>
  );
}
