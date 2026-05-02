import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  getConfiguredResumeIdFromEnv,
  hasResumeEnvVariables,
  listMyResumes,
  type MyResumeItem,
} from '../../services/hhClient';
import { mergeLocalState, readLocalState } from '../../services/storage';
import { useAuth } from '../auth/AuthProvider';

export function ResumeSettings() {
  const { session } = useAuth();
  const resumeIdFromEnv = getConfiguredResumeIdFromEnv();
  const resumeEnvLooksBroken = hasResumeEnvVariables() && !resumeIdFromEnv;
  const [savedResumeText, setSavedResumeText] = useState(() => readLocalState().resumeText);
  const [text, setText] = useState(() => readLocalState().resumeText);
  const [hhItems, setHhItems] = useState<MyResumeItem[]>([]);
  const [hhLoading, setHhLoading] = useState(false);
  const [hhError, setHhError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const s = readLocalState().resumeText;
      setText(s);
      setSavedResumeText(s);
    };
    window.addEventListener('hh-auto:storage', sync);
    return () => window.removeEventListener('hh-auto:storage', sync);
  }, []);

  const resumeDraftDirty = text !== savedResumeText;

  useEffect(() => {
    if (!session.accessToken) {
      setHhItems([]);
      setHhError(null);
      return;
    }
    if (getConfiguredResumeIdFromEnv()) {
      setHhLoading(false);
      setHhItems([]);
      setHhError(null);
      return;
    }
    setHhLoading(true);
    setHhError(null);
    listMyResumes(session.accessToken)
      .then(setHhItems)
      .catch((e: unknown) =>
        setHhError(e instanceof Error ? e.message : 'Не удалось загрузить резюме с hh.ru'),
      )
      .finally(() => setHhLoading(false));
  }, [session.accessToken]);

  const saveLocalDraft = () => {
    mergeLocalState({ resumeText: text });
  };

  const reloadHh = () => {
    if (!session.accessToken) return;
    setHhLoading(true);
    setHhError(null);
    listMyResumes(session.accessToken)
      .then(setHhItems)
      .catch((e: unknown) =>
        setHhError(e instanceof Error ? e.message : 'Не удалось загрузить резюме с hh.ru'),
      )
      .finally(() => setHhLoading(false));
  };

  return (
    <div>
      <h1>Резюме</h1>

      <h2 style={{ fontSize: '1.05rem', marginTop: 20, marginBottom: 8 }}>Резюме в аккаунте hh.ru</h2>
      <p style={{ color: '#9aa0a6', maxWidth: 560, marginBottom: 12 }}>
        Список загружается через API (те же резюме, что на hh.ru). Для отклика используется первое в
        списке или резюме из{' '}
        <code style={{ fontSize: '0.9em' }}>VITE_HH_RESUME_URL</code> /{' '}
        <code style={{ fontSize: '0.9em' }}>VITE_HH_RESUME_ID</code> в{' '}
        <code style={{ fontSize: '0.9em' }}>.env</code>. Если эти переменные распознаны, запрос{' '}
        <code style={{ fontSize: '0.9em' }}>/resumes/mine</code> при открытии страницы не делается —
        только по кнопке «Обновить список».
      </p>
      {resumeEnvLooksBroken ? (
        <ErrorBanner message="В .env задан VITE_HH_RESUME_URL или VITE_HH_RESUME_ID, но идентификатор извлечь не удалось. Укажите полную ссылку вида https://….hh.ru/resume/… или только hex-id после /resume/. Перезапустите npm run dev после правки .env; при запуске Vite из другой папки используйте каталог проекта hh-auto." />
      ) : null}
      {resumeIdFromEnv ? (
        <p
          style={{
            maxWidth: 560,
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#1e2a22',
            border: '1px solid #2d4a3e',
            fontSize: 14,
          }}
        >
          Для отклика из приложения сейчас используется резюме{' '}
          <code style={{ wordBreak: 'break-all' }}>{resumeIdFromEnv}</code> (из .env:
          VITE_HH_RESUME_ID или ссылка VITE_HH_RESUME_URL). Перезапустите{' '}
          <code style={{ fontSize: '0.9em' }}>npm run dev</code>, если изменили переменную.
        </p>
      ) : null}
      {!session.accessToken ? (
        <>
          <ErrorBanner message="Войдите через hh.ru, чтобы увидеть резюме из аккаунта." />
          <Link to="/">На страницу входа</Link>
        </>
      ) : (
        <>
          <Button variant="ghost" type="button" disabled={hhLoading} onClick={() => void reloadHh()}>
            Обновить список
          </Button>
          {hhError ? <ErrorBanner message={hhError} /> : null}
          {hhLoading && !hhError ? (
            <p style={{ color: '#9aa0a6', marginTop: 12 }}>Загрузка…</p>
          ) : !hhError && hhItems.length === 0 ? (
            <p style={{ color: '#9aa0a6', marginTop: 12 }}>
              {resumeIdFromEnv
                ? 'Список через API пуст или недоступен; отклик всё равно возможен с резюме из VITE_HH_RESUME_URL (см. блок выше).'
                : 'Нет резюме или список пуст.'}
            </p>
          ) : !hhError ? (
            <ul style={{ listStyle: 'none', padding: 0, maxWidth: 720, marginTop: 12 }}>
              {hhItems.map((r) => (
                <li
                  key={r.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #2a2e36',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: '#9aa0a6', marginTop: 6 }}>
                    <code>{r.id}</code>
                    {r.alternateUrl ? (
                      <>
                        {' · '}
                        <a href={r.alternateUrl} target="_blank" rel="noopener noreferrer">
                          Открыть на hh.ru
                        </a>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <h2 style={{ fontSize: '1.05rem', marginTop: 36, marginBottom: 8 }}>Текст резюме</h2>
      <p style={{ color: '#9aa0a6', maxWidth: 560, marginBottom: 12 }}>
        Ниже — сохранённая копия (из браузера): её видно на странице и её же использует LLM для
        черновиков писем. Редактор под блоком; после правок нажмите «Сохранить черновик».
      </p>
      <div
        style={{
          maxWidth: 720,
          marginBottom: 16,
          padding: 16,
          borderRadius: 8,
          background: '#121418',
          border: '1px solid #2a2e36',
          minHeight: 120,
          maxHeight: 420,
          overflow: 'auto',
        }}
      >
        {savedResumeText.trim() ? (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 15,
              lineHeight: 1.55,
              color: '#e8eaed',
            }}
          >
            {savedResumeText}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#9aa0a6', fontSize: 14 }}>
            Пока нет сохранённого текста — введите резюме в поле ниже и нажмите «Сохранить черновик».
          </p>
        )}
      </div>

      <h2 style={{ fontSize: '1.05rem', marginTop: 8, marginBottom: 8 }}>Редактирование</h2>
      <p style={{ color: '#9aa0a6', maxWidth: 560 }}>
        Черновик в редакторе не попадает в LLM, пока не сохранён. Данные хранятся только локально;
        в провайдера LLM уходит только то, что вы сохранили здесь.
      </p>
      {resumeDraftDirty ? (
        <p style={{ color: '#c9a227', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
          Есть несохранённые изменения — превью выше показывает последнюю сохранённую версию.
        </p>
      ) : null}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        style={{
          width: '100%',
          maxWidth: 720,
          marginTop: 12,
          padding: 12,
          borderRadius: 8,
          background: '#1e222a',
          border: '1px solid #3d4555',
          color: '#e8eaed',
        }}
      />
      <div style={{ marginTop: 12 }}>
        <Button onClick={saveLocalDraft}>Сохранить черновик</Button>
      </div>
    </div>
  );
}
