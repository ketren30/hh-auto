import { useState } from 'react';
import type { VacancyItem } from '../../types';
import type { ApplyAttempt } from '../../types';
import { Button } from '../../components/Button';
import { applyNegotiation, getPrimaryResumeId } from '../../services/hhClient';
import { mapApplyResult } from './applyOutcome';

interface Props {
  vacancy: VacancyItem | null;
  letterBody: string;
  accessToken: string | null;
  onClose: () => void;
  onAfterApply: (attempt: ApplyAttempt) => void;
}

export function ApplyConfirmDialog({
  vacancy,
  letterBody,
  accessToken,
  onClose,
  onAfterApply,
}: Props) {
  const [busy, setBusy] = useState(false);

  if (!vacancy) return null;

  const submit = async () => {
    if (!accessToken) return;
    setBusy(true);
    try {
      let resumeId = await getPrimaryResumeId(accessToken);
      if (!resumeId) {
        onAfterApply({
          vacancyId: vacancy.id,
          status: 'failure',
          message:
            'Не найдено резюме для отклика: список через API пуст или недоступен. Задайте в .env ссылку VITE_HH_RESUME_URL (страница резюме на hh.ru) или проверьте доступ к GET /resumes/mine.',
        });
        onClose();
        return;
      }

      const result = await applyNegotiation(accessToken, {
        vacancyId: vacancy.id,
        resumeId,
        message: letterBody,
      });
      onAfterApply(mapApplyResult(vacancy.id, result));
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: '#1a1d24',
          borderRadius: 12,
          padding: 20,
          maxWidth: 480,
          width: '100%',
          border: '1px solid #333',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Подтвердите отклик</h2>
        <p>
          Отправить отклик на вакансию «{vacancy.title}»
          {vacancy.employerName ? ` (${vacancy.employerName})` : ''}?
        </p>
        <p style={{ color: '#9aa0a6', fontSize: 14 }}>
          Одно подтверждение соответствует одной вакансии. Текст ниже уйдёт в hh.ru как сообщение к
          отклику (если поддерживается методом API).
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            maxHeight: 160,
            overflow: 'auto',
            padding: 12,
            background: '#121418',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {letterBody || '(пусто)'}
        </pre>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Отмена
          </Button>
          <Button disabled={busy || !letterBody.trim()} onClick={() => void submit()}>
            {busy ? 'Отправка…' : 'Отправить отклик'}
          </Button>
        </div>
      </div>
    </div>
  );
}
