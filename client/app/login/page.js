const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="page pageNarrow">
      <header className="siteHeader">
        <p className="eyebrow">Account</p>
        <h1>Sign in</h1>
        <p>Use an external account. We do not store passwords in this MVP.</p>
      </header>

      {error ? (
        <section className="lookupResult lookupResultError">
          <h2>Login failed</h2>
          <p className="muted">Please try again or check OAuth settings.</p>
        </section>
      ) : null}

      <section className="lookupResult">
        <h2>Choose provider</h2>
        <div className="authActions">
          <a className="authButton" href={joinUrl(API_BASE_URL, '/auth/yandex')}>
            Continue with Yandex
          </a>
          <a className="authButton authButtonSecondary" href={joinUrl(API_BASE_URL, '/auth/google')}>
            Continue with Google
          </a>
        </div>
      </section>
    </main>
  );
}
