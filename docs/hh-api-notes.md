# hh.ru integration notes

Maintain this file **alongside** `src/services/hhClient.ts`. Update whenever OAuth scopes, endpoints, or apply flows change.

## OAuth

| Field | Value (fill during impl.) |
|-------|---------------------------|
| Authorization URL | |
| Token URL | |
| Redirect URI(s) registered | |
| Client ID | Public SPA client per hh developer cabinet |
| PKCE | Required — align with [research.md](../specs/001-hh-vacancy-monitor/research.md) |

Scopes:

- 

## Applicant APIs in use

| Purpose | HTTP method | Path / operation | Notes |
|---------|-------------|------------------|-------|
| List saved searches / subscriptions | | | Maps to FR-002 |
| Fetch vacancies per subscription | | | Maps to polling |
| Submit negotiation / apply | | | Maps to FR-014–015 |

## Official references

- Link hh developer documentation URLs here when confirmed during **T010** / **T026**.

## Gotchas

- Rate limits / quotas:
- Resume attachment rules when applying:
