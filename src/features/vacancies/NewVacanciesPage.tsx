import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { PollStatusBar } from '../../components/PollStatusBar';
import { readLocalState } from '../../services/storage';
import { useAuth } from '../auth/AuthProvider';
import { usePollingDispatch, usePollingState } from '../polling/PollingStateContext';
import { ApplyConfirmDialog } from './ApplyConfirmDialog';
import type { ApplyAttempt } from '../../types';
import { useCoverLetterDrafts } from './useCoverLetterDrafts';

export function NewVacanciesPage() {
  const { session } = useAuth();
  const { newVacancies, lastPollError, lastSuccessfulPollAt } = usePollingState();
  const dispatch = usePollingDispatch();
  const settings = readLocalState();
  const sorted = useMemo(
    () => [...newVacancies].sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt)),
    [newVacancies],
  );
  const { drafts, setBody, generate } = useCoverLetterDrafts(sorted);
  const [dialogVacancyId, setDialogVacancyId] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, ApplyAttempt>>({});

  const dialogVacancy = sorted.find((v) => v.id === dialogVacancyId) ?? null;
  const dialogDraft = dialogVacancy ? drafts[dialogVacancy.id]?.body ?? '' : '';

  const recordOutcome = (a: ApplyAttempt) => {
    setOutcomes((o) => ({ ...o, [a.vacancyId]: a }));
    if (a.status === 'success') {
      dispatch({ type: 'removeVacancy', vacancyId: a.vacancyId });
    }
  };

  if (!session.accessToken) {
    return (
      <div>
        <ErrorBanner message="Войдите, чтобы работать с новыми вакансиями." />
        <Link to="/">Вход</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Новые вакансии</h1>
      <p style={{ color: '#9aa0a6' }}>
        Список пополняется при опросе включённых подписок. Черновики редактируются в полях ниже до
        отправки отклика.
      </p>
      <PollStatusBar
        pollIntervalMinutes={settings.pollIntervalMinutes}
        lastSuccessIso={lastSuccessfulPollAt}
        lastError={lastPollError}
      />
      {sorted.length === 0 ? (
        <p>Пока нет новых вакансий. Включите мониторинг подписок и дождитесь опроса.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sorted.map((v) => {
            const d = drafts[v.id];
            const oc = outcomes[v.id];
            return (
              <li
                key={v.id}
                style={{
                  marginBottom: 24,
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #2f3542',
                  background: '#181c22',
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong>{v.title}</strong>
                  {v.employerName ? <span style={{ color: '#9aa0a6' }}> · {v.employerName}</span> : null}
                  <div style={{ fontSize: 12, color: '#9aa0a6' }}>
                    id {v.id} · подписка {v.subscriptionId}
                  </div>
                </div>
                {v.descriptionSnippet ? (
                  <p style={{ fontSize: 14, color: '#bdc1c6' }}>{v.descriptionSnippet}</p>
                ) : null}
                <label style={{ display: 'block', marginTop: 12 }}>
                  <span style={{ fontSize: 14 }}>Черновик письма</span>
                  <textarea
                    value={d?.body ?? ''}
                    onChange={(e) => setBody(v.id, e.target.value)}
                    rows={8}
                    style={{
                      width: '100%',
                      marginTop: 8,
                      padding: 12,
                      borderRadius: 8,
                      background: '#121418',
                      border: '1px solid #3d4555',
                      color: '#e8eaed',
                    }}
                  />
                </label>
                <div style={{ marginTop: 8, fontSize: 13, color: '#9aa0a6' }}>
                  Статус генерации: {d?.generationStatus ?? 'idle'}
                  {d?.errorMessage ? ` — ${d.errorMessage}` : ''}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <Button onClick={() => void generate(v)} disabled={d?.generationStatus === 'loading'}>
                    Сгенерировать черновик
                  </Button>
                  <Button variant="ghost" onClick={() => setDialogVacancyId(v.id)}>
                    Отправить отклик…
                  </Button>
                </div>
                {oc ? (
                  <p style={{ marginTop: 12, fontSize: 14 }}>
                    <strong>Итог отклика:</strong> {oc.status} — {oc.message ?? ''}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <ApplyConfirmDialog
        vacancy={dialogVacancy}
        letterBody={dialogDraft}
        accessToken={session.accessToken}
        onClose={() => setDialogVacancyId(null)}
        onAfterApply={recordOutcome}
      />
    </div>
  );
}
