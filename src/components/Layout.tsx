import { Link, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ErrorBanner } from './ErrorBanner';
import { fetchMeAuthSummary } from '../services/hhClient';
import { useAuth } from '../features/auth/AuthProvider';

const navLink = {
  color: '#e8eaed',
  textDecoration: 'none',
  padding: '6px 10px',
  borderRadius: 6,
} as const;

export function Layout() {
  const { session } = useAuth();
  const [applicantWarn, setApplicantWarn] = useState<string | null>(null);

  useEffect(() => {
    if (!session.accessToken) {
      setApplicantWarn(null);
      return;
    }
    fetchMeAuthSummary(session.accessToken).then((me) => {
      if (!me) return;
      if (me.isEmployer || me.authType === 'employer') {
        setApplicantWarn(
          `Сейчас выдан токен работодателя (auth_type=${me.authType ?? 'employer'}). Для подписок и резюме через API нужен соискатель — нажмите «Выйти» ниже, затем войдите снова и пройдите вход именно как соискатель (на hh.ru при запросе приложения выберите роль соискателя).`,
        );
        return;
      }
      if (!me.isApplicant && me.authType && me.authType !== 'application') {
        setApplicantWarn(
          `Токен не соискателя (auth_type=${me.authType}). Автопоиски и «мои резюме» могут отвечать 403 — выйдите и войдите снова с ролью applicant.`,
        );
        return;
      }
      setApplicantWarn(null);
    });
  }, [session.accessToken]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #2a2e36',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ marginRight: 12 }}>hh-auto</strong>
        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/subscriptions" style={navLink}>
            Подписки
          </Link>
          <Link to="/vacancies" style={navLink}>
            Новые вакансии
          </Link>
          <Link to="/settings/resume" style={navLink}>
            Резюме
          </Link>
          <Link to="/settings/polling" style={navLink}>
            Опрос
          </Link>
          <Link to="/settings/sound" style={navLink}>
            Звук
          </Link>
          <Link to="/settings/llm" style={navLink}>
            LLM
          </Link>
          <Link to="/" style={navLink}>
            Вход
          </Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '20px', maxWidth: 960, width: '100%', margin: '0 auto' }}>
        {applicantWarn ? (
          <div style={{ marginBottom: 16 }}>
            <ErrorBanner message={applicantWarn} />
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
