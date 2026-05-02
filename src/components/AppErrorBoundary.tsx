import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App error boundary:', error.message, info.componentStack?.slice(0, 200));
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 560, margin: '48px auto', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: 20 }}>Что-то пошло не так</h1>
          <p>Приложение столкнулось с ошибкой интерфейса. Обновите страницу или очистите данные сайта.</p>
          <p style={{ color: '#666', fontSize: 14 }}>
            Детали ошибки и ваши токены не показываются здесь из соображений безопасности.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Обновить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
