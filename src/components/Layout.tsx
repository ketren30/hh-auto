import { Link, Outlet } from 'react-router-dom';

const navLink = {
  color: '#e8eaed',
  textDecoration: 'none',
  padding: '6px 10px',
  borderRadius: 6,
} as const;

export function Layout() {
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
        <Outlet />
      </main>
    </div>
  );
}
