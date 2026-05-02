import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LoginOrOAuthRoot } from '../features/auth/LoginOrOAuthRoot';
import { OAuthCallbackPage } from '../features/auth/OAuthCallbackPage';
import { SubscriptionsPage } from '../features/subscriptions/SubscriptionsPage';
import { LlmSettings } from '../features/settings/LlmSettings';
import { PollingSettings } from '../features/settings/PollingSettings';
import { ResumeSettings } from '../features/settings/ResumeSettings';
import { SoundSettings } from '../features/settings/SoundSettings';
import { NewVacanciesPage } from '../features/vacancies/NewVacanciesPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LoginOrOAuthRoot />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/vacancies" element={<NewVacanciesPage />} />
        <Route path="/settings/resume" element={<ResumeSettings />} />
        <Route path="/settings/polling" element={<PollingSettings />} />
        <Route path="/settings/sound" element={<SoundSettings />} />
        <Route path="/settings/llm" element={<LlmSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
