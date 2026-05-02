import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import {
  DEFAULT_YANDEX_MODEL_URI,
  folderIdFromGptModelUri,
} from './services/llmClient';
import { mergeLocalState, readLocalState } from './services/storage';
import './index.css';

/** Первый запуск: предзаполнить Yandex modelUri и каталог по умолчанию (без API-ключа). */
const defaultFolder = folderIdFromGptModelUri(DEFAULT_YANDEX_MODEL_URI);
if (readLocalState().llm === undefined && defaultFolder) {
  mergeLocalState({
    llm: {
      baseUrl: '',
      apiKey: '',
      model: DEFAULT_YANDEX_MODEL_URI,
      folderId: defaultFolder,
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
