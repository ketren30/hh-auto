# Environment variables (example)

Only **non-secret** values belong in `.env` for a public SPA. Anything sensitive is entered in the app UI and stored in `localStorage` / `sessionStorage` per spec FR-011.

```bash
# Optional: OAuth client id if hh registers a public SPA client (confirm with hh docs)
# VITE_HH_CLIENT_ID=

# Полный redirect_uri как в кабинете hh (если уже зафиксирован, например localhost:3000):
# VITE_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback

# Иначе: только путь на текущем origin
# VITE_OAUTH_REDIRECT_PATH=/oauth/callback
```

Do **not** put client secrets or LLM API keys in `.env` committed to git — they would ship in the bundle or leak via Vite prefix rules.
