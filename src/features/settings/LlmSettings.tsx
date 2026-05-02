import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '../../components/Button';
import { DEFAULT_YANDEX_MODEL_URI, folderIdFromGptModelUri } from '../../services/llmClient';
import { mergeLocalState, readLocalState } from '../../services/storage';

const DEFAULT_FOLDER = folderIdFromGptModelUri(DEFAULT_YANDEX_MODEL_URI) ?? '';

export function LlmSettings() {
  const persisted = readLocalState().llm;
  const initial = persisted ?? {
    baseUrl: '',
    apiKey: '',
    model: DEFAULT_YANDEX_MODEL_URI,
    folderId: DEFAULT_FOLDER,
  };
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model ?? DEFAULT_YANDEX_MODEL_URI);
  const [folderId, setFolderId] = useState(initial.folderId ?? DEFAULT_FOLDER);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => {
      const llm = readLocalState().llm;
      setBaseUrl(llm?.baseUrl ?? '');
      setApiKey(llm?.apiKey ?? '');
      setModel(llm?.model ?? DEFAULT_YANDEX_MODEL_URI);
      setFolderId(llm?.folderId ?? DEFAULT_FOLDER);
    };
    window.addEventListener('hh-auto:storage', sync);
    return () => window.removeEventListener('hh-auto:storage', sync);
  }, []);

  const save = () => {
    mergeLocalState({
      llm: {
        baseUrl: baseUrl.trim(),
        apiKey,
        model: model.trim() || undefined,
        folderId: folderId.trim() || undefined,
      },
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1>Генерация писем (LLM)</h1>
      <div
        role="note"
        style={{
          padding: '10px 12px',
          marginBottom: 16,
          borderRadius: 8,
          background: '#2d2618',
          border: '1px solid #6d5220',
          color: '#fde9c9',
        }}
      >
        Ключ API хранится только в localStorage этого браузера. Для Yandex Cloud нужны каталог и ключ с ролью на
        генерацию текста (см. документацию AI Studio).
      </div>
      <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label>
          <span style={{ display: 'block', marginBottom: 4 }}>
            Folder ID (Yandex Cloud AI / Foundation Models)
          </span>
          <input
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            placeholder={DEFAULT_FOLDER || 'например b1gxxxxxxxxxxxxxx'}
            style={inp}
            autoComplete="off"
          />
          <span style={{ fontSize: 12, color: '#9aa0a6' }}>
            Для полного modelUri вида gpt://… можно оставить совпадающим с URI или подставится автоматически из поля
            «Модель».
          </span>
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 4 }}>
            Базовый URL (OpenAI-совместимый API, если Folder ID пустой)
          </span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com"
            style={inp}
          />
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 4 }}>API-ключ</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={inp}
            autoComplete="off"
          />
          <span style={{ fontSize: 12, color: '#9aa0a6' }}>
            Yandex: заголовок <code>Authorization: Api-Key …</code>
          </span>
        </label>
        <label>
          <span style={{ display: 'block', marginBottom: 4 }}>Модель (Yandex: полный modelUri)</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_YANDEX_MODEL_URI}
            style={inp}
          />
        </label>
      </div>
      <div style={{ marginTop: 16 }}>
        <Button onClick={save}>Сохранить</Button>
        {saved ? <span style={{ marginLeft: 12 }}>Сохранено</span> : null}
      </div>
    </div>
  );
}

const inp: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  background: '#1e222a',
  border: '1px solid #3d4555',
  color: '#e8eaed',
};
