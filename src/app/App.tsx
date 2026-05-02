import { BrowserRouter } from 'react-router-dom';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { AuthProvider } from '../features/auth/AuthProvider';
import { PollingCoordinator } from '../features/polling/PollingCoordinator';
import { PollingStateProvider, usePollingState } from '../features/polling/PollingStateContext';
import { useNewVacancySound } from '../hooks/useNewVacancySound';
import { AppRoutes } from './routes';

function VacancySoundWatcher() {
  const { newVacancies } = usePollingState();
  useNewVacancySound(newVacancies.length);
  return null;
}

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PollingStateProvider>
            <VacancySoundWatcher />
            <AppRoutes />
            <PollingCoordinator />
          </PollingStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
