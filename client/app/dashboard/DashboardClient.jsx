'use client';

import { useEffect, useState } from 'react';
import { getMe, logout } from '@/lib/api';

export default function DashboardClient() {
  const [state, setState] = useState({
    loading: true,
    authenticated: false,
    user: null,
    error: '',
  });

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const data = await getMe();

        if (active) {
          setState({
            loading: false,
            authenticated: data.authenticated,
            user: data.user,
            error: '',
          });
        }
      } catch (err) {
        if (active) {
          setState({
            loading: false,
            authenticated: false,
            user: null,
            error: 'Could not load account.',
          });
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = '/login';
  }

  if (state.loading) {
    return <p className="muted">Loading account...</p>;
  }

  if (!state.authenticated) {
    return (
      <section className="lookupResult">
        <h2>You are not signed in</h2>
        <p className="muted">{state.error || 'Sign in to open the dashboard.'}</p>
        <p>
          <a href="/login">Go to login</a>
        </p>
      </section>
    );
  }

  return (
    <section className="lookupResult">
      <h2>{state.user?.name || state.user?.email || 'Account'}</h2>
      {state.user?.email ? <p className="muted">{state.user.email}</p> : null}
      <p className="muted">Dashboard draft. Site ownership and settings will be added next.</p>
      <button className="plainButton" type="button" onClick={handleLogout}>
        Logout
      </button>
    </section>
  );
}
