export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        background: '#3c1f1f',
        border: '1px solid #8b4040',
        color: '#fbc8c8',
        marginBottom: 12,
      }}
    >
      {message}
    </div>
  );
}
