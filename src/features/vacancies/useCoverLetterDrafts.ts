import { useCallback, useEffect, useState } from 'react';
import type { CoverLetterDraft, VacancyItem } from '../../types';
import {
  folderIdFromGptModelUri,
  generateCoverLetterDraft,
} from '../../services/llmClient';
import { readLocalState } from '../../services/storage';

export function useCoverLetterDrafts(vacancies: VacancyItem[]) {
  const [drafts, setDrafts] = useState<Record<string, CoverLetterDraft>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const v of vacancies) {
        if (!next[v.id]) {
          next[v.id] = { vacancyId: v.id, body: '', generationStatus: 'idle' };
        }
      }
      return next;
    });
  }, [vacancies]);

  const setBody = useCallback((vacancyId: string, body: string) => {
    setDrafts((prev) => ({
      ...prev,
      [vacancyId]: {
        ...(prev[vacancyId] ?? { vacancyId, body: '', generationStatus: 'idle' }),
        vacancyId,
        body,
      },
    }));
  }, []);

  const generate = useCallback(async (vacancy: VacancyItem) => {
    const s = readLocalState();
    if (!s.resumeText.trim()) {
      setDrafts((prev) => ({
        ...prev,
        [vacancy.id]: {
          ...(prev[vacancy.id] ?? { vacancyId: vacancy.id, body: '', generationStatus: 'idle' }),
          vacancyId: vacancy.id,
          generationStatus: 'error',
          errorMessage: 'Заполните текст резюме в настройках.',
        },
      }));
      return;
    }
    const llm = s.llm;
    if (!llm?.apiKey?.trim()) {
      setDrafts((prev) => ({
        ...prev,
        [vacancy.id]: {
          ...(prev[vacancy.id] ?? { vacancyId: vacancy.id, body: '', generationStatus: 'idle' }),
          vacancyId: vacancy.id,
          generationStatus: 'error',
          errorMessage: 'Укажите API-ключ LLM в настройках.',
        },
      }));
      return;
    }

    const folderOk =
      Boolean(llm.folderId?.trim()) || Boolean(folderIdFromGptModelUri(llm.model ?? ''));
    const baseOk = Boolean(llm.baseUrl?.trim());
    const useYandex =
      folderOk ||
      Boolean(llm.model?.trim().startsWith('gpt://')) ||
      /llm\.api\.cloud\.yandex\.net|foundationmodels/i.test(llm.baseUrl ?? '');
    if (useYandex && !folderOk) {
      setDrafts((prev) => ({
        ...prev,
        [vacancy.id]: {
          ...(prev[vacancy.id] ?? { vacancyId: vacancy.id, body: '', generationStatus: 'idle' }),
          vacancyId: vacancy.id,
          generationStatus: 'error',
          errorMessage: 'Для Yandex Cloud укажите Folder ID или полный modelUri gpt://…',
        },
      }));
      return;
    }
    if (!useYandex && !baseOk) {
      setDrafts((prev) => ({
        ...prev,
        [vacancy.id]: {
          ...(prev[vacancy.id] ?? { vacancyId: vacancy.id, body: '', generationStatus: 'idle' }),
          vacancyId: vacancy.id,
          generationStatus: 'error',
          errorMessage: 'Укажите базовый URL для OpenAI-совместимого API.',
        },
      }));
      return;
    }

    setDrafts((prev) => ({
      ...prev,
      [vacancy.id]: {
        ...(prev[vacancy.id] ?? { vacancyId: vacancy.id, body: '', generationStatus: 'idle' }),
        vacancyId: vacancy.id,
        generationStatus: 'loading',
        errorMessage: undefined,
      },
    }));

    try {
      const body = await generateCoverLetterDraft({
        folderId: llm.folderId,
        baseUrl: llm.baseUrl,
        apiKey: llm.apiKey,
        model: llm.model,
        resumeText: s.resumeText,
        vacancy,
      });
      setDrafts((prev) => ({
        ...prev,
        [vacancy.id]: {
          vacancyId: vacancy.id,
          body,
          generationStatus: 'success',
        },
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка генерации';
      setDrafts((prev) => ({
        ...prev,
        [vacancy.id]: {
          ...(prev[vacancy.id] ?? { vacancyId: vacancy.id, body: '', generationStatus: 'idle' }),
          vacancyId: vacancy.id,
          generationStatus: 'error',
          errorMessage: msg,
        },
      }));
    }
  }, []);

  return { drafts, setBody, generate };
}
