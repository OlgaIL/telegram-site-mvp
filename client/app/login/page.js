const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const returnTo = typeof params?.returnTo === 'string' ? params.returnTo : '/dashboard';
  const oauthReturnTo = encodeURIComponent(returnTo);

  return (
    <main className="page pageNarrow authPage">
      {error ? (
        <section className="lookupResult lookupResultError">
          <h2>Не удалось войти</h2>
          <p className="muted">Попробуйте еще раз или проверьте настройки OAuth.</p>
        </section>
      ) : null}

      <section className="authPanel">
        <p className="authPrompt">Выберите удобный способ входа</p>
        <div className="authActions">
          <a className="authButton" href={joinUrl(API_BASE_URL, `/auth/google?returnTo=${oauthReturnTo}`)}>
            Войти через Google
          </a>
          <a className="authButton" href={joinUrl(API_BASE_URL, `/auth/yandex?returnTo=${oauthReturnTo}`)}>
            Войти через Яндекс
          </a>
        </div>
      </section>
    </main>
  );
}
