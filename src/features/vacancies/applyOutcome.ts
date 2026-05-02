import type { ApplyAttempt } from '../../types';
import type { ApplyNegotiationResult } from '../../services/hhClient';

export function mapApplyResult(vacancyId: string, result: ApplyNegotiationResult): ApplyAttempt {
  if (result.ok && result.status >= 200 && result.status < 300) {
    return { vacancyId, status: 'success', message: 'Отклик зарегистрирован.' };
  }

  const raw = result.raw;
  let detail = '';
  if (raw && typeof raw === 'object' && 'errors' in raw) {
    detail = JSON.stringify((raw as { errors: unknown }).errors).slice(0, 400);
  } else if (raw && typeof raw === 'object' && 'description' in raw) {
    detail = String((raw as { description: unknown }).description);
  }

  if (result.status === 403 || result.status === 409) {
    return {
      vacancyId,
      status: 'needs_followup',
      message:
        detail ||
        'Требуются дополнительные действия на hh.ru (ограничение, дубликат или анкета).',
    };
  }

  return {
    vacancyId,
    status: 'failure',
    message: detail || `Отказ (${result.status}). Проверьте текст и резюме на hh.ru.`,
  };
}
