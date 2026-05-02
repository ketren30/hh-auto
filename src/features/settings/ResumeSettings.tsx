import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { mergeLocalState, readLocalState } from '../../services/storage';

export function ResumeSettings() {
  const [text, setText] = useState(() => readLocalState().resumeText);

  useEffect(() => {
    const sync = () => setText(readLocalState().resumeText);
    window.addEventListener('hh-auto:storage', sync);
    return () => window.removeEventListener('hh-auto:storage', sync);
  }, []);

  const save = () => {
    mergeLocalState({ resumeText: text });
  };

  return (
    <div>
      <h1>Текст резюме</h1>
      <p style={{ color: '#9aa0a6', maxWidth: 560 }}>
        Используется локально для запросов к вашей LLM. Не покидает устройство, кроме как при явном
        запросе к выбранному вами провайдеру генерации текста.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        style={{
          width: '100%',
          maxWidth: 720,
          marginTop: 12,
          padding: 12,
          borderRadius: 8,
          background: '#1e222a',
          border: '1px solid #3d4555',
          color: '#e8eaed',
        }}
      />
      <div style={{ marginTop: 12 }}>
        <Button onClick={save}>Сохранить</Button>
      </div>
    </div>
  );
}
