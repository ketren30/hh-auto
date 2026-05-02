/**
 * LLM: OpenAI-compatible HTTPS или Yandex Cloud AI (Foundation Models).
 * Яндекс: POST .../foundationModels/v1/completion, см.
 * https://yandex.cloud/en/docs/foundation-models/ и раздел аутентификации Api-Key / x-folder-id.
 */
import type { VacancyItem } from '../types';

export const YANDEX_LLM_ORIGIN = 'https://llm.api.cloud.yandex.net';
export const YANDEX_COMPLETION_PATH = '/foundationModels/v1/completion';

/** Модель по умолчанию — ваш инстанс aliceai-llm. Заменяется полем «Модель» в настройках. */
export const DEFAULT_YANDEX_MODEL_URI = 'gpt://b1g0lab2iuomo73vdbpp/aliceai-llm/latest';

/** Извлекает folder id из `gpt://<folder_id>/...` */
export function folderIdFromGptModelUri(uri: string): string | undefined {
  const m = /^gpt:\/\/([^/]+)\//.exec(uri.trim());
  return m?.[1];
}

const STRUCTURE_RULES = `Структура письма (строго три смысловых абзаца):
1) Должность, на которую претендует кандидат, и откуда узнал о вакансии (укажи источник из контекста подписки).
2) Мотивация, интерес к роли и соответствие корпоративной культуре (если данных мало — общие профессиональные формулировки).
3) Релевантные навыки, опыт или достижения и благодарность рекрутеру за время.
Тон: профессиональный. Язык ответа: русский.`;

function buildUserContent(resumeText: string, vacancy: VacancyItem): string {
  return [
    `Резюме кандидата:\n${resumeText}`,
    '',
    `Вакансия: ${vacancy.title}`,
    vacancy.employerName ? `Компания: ${vacancy.employerName}` : '',
    vacancy.descriptionSnippet ? `Фрагмент описания:\n${vacancy.descriptionSnippet}` : '',
    vacancy.subscriptionName
      ? `Подписка hh.ru (источник): ${vacancy.subscriptionName}`
      : '',
    '',
    `Требования к черновику:\n${STRUCTURE_RULES}`,
    '',
    'Сгенерируй только текст письма без заголовков вида "Абзац 1".',
  ]
    .filter(Boolean)
    .join('\n');
}

const SYSTEM_PROMPT =
  'Ты помощник соискателя. Пишешь сопроводительные письма на русском по заданной структуре.';

export interface LlmChatParams {
  /** Для режима Yandex Cloud — ID каталога в консоли облака (или берётся из modelUri gpt://…). */
  folderId?: string;
  baseUrl: string;
  apiKey: string;
  model?: string;
  resumeText: string;
  vacancy: VacancyItem;
}

function isYandexMode(params: LlmChatParams): boolean {
  const folder = params.folderId?.trim();
  if (folder) return true;
  const model = params.model?.trim();
  if (model?.startsWith('gpt://')) return true;
  const u = params.baseUrl.trim().toLowerCase();
  return u.includes('llm.api.cloud.yandex.net') || u.includes('yandex.net/foundationmodels');
}

/** В dev запрос идёт через прокси Vite (см. vite.config.ts), иначе возможен CORS в браузере. */
function yandexCompletionUrl(): string {
  if (import.meta.env.DEV) {
    return `/api/dev/yandex-llm${YANDEX_COMPLETION_PATH}`;
  }
  return `${YANDEX_LLM_ORIGIN}${YANDEX_COMPLETION_PATH}`;
}

/** modelUri: gpt://<folder_id>/<model>/<версия>; полный URI можно передать в поле «Модель». */
function buildYandexModelUri(folderId: string, modelField: string | undefined): string {
  const raw = modelField?.trim();
  if (raw?.startsWith('gpt://')) return raw;

  const name = raw?.replace(/^\/+|\/+$/g, '') || 'yandexgpt-lite';
  return `gpt://${folderId}/${name}/latest`;
}

interface YandexCompletionResponse {
  result?: {
    alternatives?: Array<{ message?: { text?: string }; status?: string }>;
  };
  error?: { grpcCode?: number; message?: string; details?: unknown };
}

function parseYandexText(data: YandexCompletionResponse): string {
  const err = data.error?.message;
  if (err) throw new Error(`Yandex AI: ${err}`);

  const alts = data.result?.alternatives;
  const text = alts?.[0]?.message?.text?.trim();
  if (!text) throw new Error('Пустой ответ модели Yandex');
  return text;
}

async function generateYandexDraft(params: LlmChatParams, userContent: string): Promise<string> {
  const rawModel = params.model?.trim();

  let modelUri: string;
  if (rawModel?.startsWith('gpt://')) {
    modelUri = rawModel;
  } else if (rawModel) {
    const fid = params.folderId?.trim();
    if (!fid) {
      throw new Error(
        'Для короткого имени модели укажите Folder ID или используйте полный modelUri вида gpt://…',
      );
    }
    modelUri = buildYandexModelUri(fid, rawModel);
  } else {
    modelUri = DEFAULT_YANDEX_MODEL_URI;
  }

  const folderId =
    params.folderId?.trim() || folderIdFromGptModelUri(modelUri);
  if (!folderId) {
    throw new Error(
      'Укажите Folder ID каталога Yandex Cloud или полный modelUri gpt://<folder_id>/... в настройках LLM.',
    );
  }

  const url = yandexCompletionUrl();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${params.apiKey.trim()}`,
      'x-folder-id': folderId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      modelUri,
      completionOptions: {
        stream: false,
        temperature: 0.7,
        maxTokens: '2500',
      },
      messages: [
        { role: 'system', text: SYSTEM_PROMPT },
        { role: 'user', text: userContent },
      ],
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Yandex AI ${res.status}: ${rawText.slice(0, 400)}`);
  }

  let data: YandexCompletionResponse;
  try {
    data = JSON.parse(rawText) as YandexCompletionResponse;
  } catch {
    throw new Error(`Yandex AI: некорректный JSON ответа`);
  }

  return parseYandexText(data);
}

async function generateOpenAiCompatibleDraft(
  params: LlmChatParams,
  userContent: string,
): Promise<string> {
  const base = params.baseUrl.replace(/\/+$/, '');
  const url = `${base}/v1/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM ${res.status}: ${t.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Пустой ответ модели');
  return text;
}

export async function generateCoverLetterDraft(params: LlmChatParams): Promise<string> {
  const userContent = buildUserContent(params.resumeText, params.vacancy);

  if (isYandexMode(params)) {
    return generateYandexDraft(params, userContent);
  }

  if (!params.baseUrl.trim()) {
    throw new Error(
      'Укажите базовый URL для OpenAI-совместимого API, Folder ID или полный modelUri gpt://… для Yandex Cloud.',
    );
  }

  return generateOpenAiCompatibleDraft(params, userContent);
}
