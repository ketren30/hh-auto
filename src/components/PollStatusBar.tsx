export function PollStatusBar(props: {
  lastSuccessIso?: string;
  lastError?: string | null;
  pollIntervalMinutes: number;
  visibilityHint?: string;
}) {
  const { lastSuccessIso, lastError, pollIntervalMinutes, visibilityHint } = props;
  return (
    <div
      style={{
        marginTop: 16,
        padding: '10px 12px',
        borderRadius: 8,
        background: '#1e222a',
        border: '1px solid #2f3542',
        fontSize: 14,
      }}
    >
      <div>
        Интервал опроса: <strong>{pollIntervalMinutes} мин</strong>
        {lastSuccessIso ? (
          <>
            {' '}
            · Последний успешный опрос:{' '}
            <strong>{new Date(lastSuccessIso).toLocaleString()}</strong>
          </>
        ) : (
          <> · Ещё не было успешного опроса</>
        )}
      </div>
      {lastError ? (
        <div style={{ color: '#f6aea9', marginTop: 6 }}>Ошибка: {lastError}</div>
      ) : null}
      {visibilityHint ? (
        <div style={{ color: '#9aa0a6', marginTop: 6, fontSize: 13 }}>{visibilityHint}</div>
      ) : null}
    </div>
  );
}
