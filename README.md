# hh-auto

Локальное SPA для мониторинга сохранённых поисков на hh.ru, опроса новых вакансий, черновиков сопроводительных писем через вашу LLM и откликов через официальный API (OAuth + PKCE). Секреты и резюме не отправляются на сервер разработчика — только в браузер и в выбранные вами службы (hh.ru, провайдер LLM).

## Документация фичи

- Спецификация и сценарии: [specs/001-hh-vacancy-monitor/spec.md](specs/001-hh-vacancy-monitor/spec.md)
- Быстрый старт и зависимости: [specs/001-hh-vacancy-monitor/quickstart.md](specs/001-hh-vacancy-monitor/quickstart.md)
- Конституция проекта: [.specify/memory/constitution.md](.specify/memory/constitution.md)

## Запуск

Требуется Node.js 20+.

```bash
npm install
npm run dev
```

Сборка и проверки:

```bash
npm run build
npm run lint
npm run format
npm run test   # заглушка; Vitest по желанию (см. quickstart.md)
```

## OAuth hh.ru

1. Зарегистрируйте приложение в кабинете разработчика hh.ru и укажите redirect URI **точно как в кабинете** (часто `https://localhost:3000` без пути или `http://localhost:3000/oauth/callback`).
2. Создайте `.env` в корне репозитория (не коммитьте секреты приложения, если они есть):

```bash
VITE_HH_CLIENT_ID=<client id>
# Если выдан client_secret (confidential): только так, без префикса VITE_
HH_CLIENT_SECRET=<client secret>
VITE_HH_TOKEN_PROXY=true
# Совпадает с тем, что уже указано в hh (если нельзя поменять — копируйте строку оттуда дословно):
VITE_OAUTH_REDIRECT_URI=https://localhost:3000
```

Если redirect начинается с **`https://localhost`** или **`https://127.0.0.1`**, при **`npm run dev`** Vite поднимет HTTPS (самоподписанный сертификат плагина `@vitejs/plugin-basic-ssl`): откройте **`https://localhost:3000`**, один раз примите предупреждение браузера.

Колбэк с **`?code=`** обрабатывается и на **`/`**, и на **`/oauth/callback`**. Задайте **`VITE_OAUTH_REDIRECT_URI`** дословно как в кабинете hh, чтобы authorize/token совпадали с зарегистрированным URI.

При `VITE_HH_TOKEN_PROXY=true` обмен кода в **`npm run dev`** идёт через прокси Vite: секрет не попадает в фронтовый бандл. Для production без своего backend нужен публичный PKCE-клиент без секрета или отдельный сервер обмена токена.

Подробнее: [.env.example](.env.example) и [docs/hh-api-notes.md](docs/hh-api-notes.md).

## Интеграция API

Реальные URL и scope синхронизированы с `src/services/hhClient.ts` и описаны в [docs/hh-api-notes.md](docs/hh-api-notes.md). При изменении клиента обновляйте этот файл.

### Yandex Cloud AI (черновики писем)

В настройках **LLM** укажите **Folder ID** каталога и API-ключ (формат `Authorization: Api-Key …`). Запросы идут на `foundationModels/v1/completion` с телом в формате Foundation Models (`modelUri`, `messages[].text`). При **`npm run dev`** используется прокси Vite (`/api/dev/yandex-llm/...`), чтобы обойти CORS; для статического хостинга без backend понадобится свой reverse-proxy на `https://llm.api.cloud.yandex.net`.
