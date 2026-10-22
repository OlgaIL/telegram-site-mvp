import { getAuthProviders } from '@/lib/api';
import EmailLoginForm from './EmailLoginForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const returnTo = typeof params?.returnTo === 'string' ? params.returnTo : '/dashboard';
  const oauthReturnTo = encodeURIComponent(returnTo);
  const providers = await getAuthProviders().catch(() => ({ items: [] }));

  return (
    <main className="page pageNarrow authPage">
      {error ? (
        <section className="lookupResult lookupResultError">
          <h2>Не удалось войти</h2>
          <p className="muted">Попробуйте ещё раз или выберите другой способ входа.</p>
        </section>
      ) : null}

      <section className="authPanel">
        <p className="authPrompt">Выберите удобный способ входа</p>
        <div className="authActions">
          {providers.items.filter((provider) => provider.id !== 'email').map((provider) => (
            <a
              className="authButton"
              href={joinUrl(API_BASE_URL, `/auth/${provider.id}?returnTo=${oauthReturnTo}`)}
              key={provider.id}
            >
              Войти через {provider.label}
            </a>
          ))}
        </div>
        {providers.items.some((provider) => provider.id === 'email') ? (
          <EmailLoginForm returnTo={returnTo} />
        ) : null}
        {providers.items.length === 0 ? (
          <p className="muted" role="status">Вход временно недоступен. Попробуйте позже.</p>
        ) : null}
      </section>
    </main>
  );
}
