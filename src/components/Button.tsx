import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', style, ...rest }: Props) {
  const base: CSSProperties = {
    borderRadius: 8,
    padding: '8px 14px',
    border: variant === 'primary' ? 'none' : '1px solid #444',
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    background: variant === 'primary' ? '#1a73e8' : 'transparent',
    color: '#e8eaed',
    opacity: rest.disabled ? 0.5 : 1,
  };
  return <button type="button" style={{ ...base, ...style }} {...rest} />;
}
