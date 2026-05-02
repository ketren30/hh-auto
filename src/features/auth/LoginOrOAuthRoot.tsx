import { useSearchParams } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { OAuthCallbackPage } from './OAuthCallbackPage';

/** hh может вернуть редирект на корень `https://localhost:3000?code=…` без пути `/oauth/callback`. */
export function LoginOrOAuthRoot() {
  const [search] = useSearchParams();
  if (search.has('code')) {
    return <OAuthCallbackPage />;
  }
  return <LoginPage />;
}
