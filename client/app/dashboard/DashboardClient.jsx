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
            error: 'Не удалось загрузить аккаунт.',
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
    window.location.href = '/';
  }

  if (state.loading) {
    return <p className="muted">Загружаем аккаунт...</p>;
  }

  if (!state.authenticated) {
    return (
      <section className="lookupResult">
        <h2>Вы не вошли</h2>
        <p className="muted">{state.error || 'Войдите, чтобы открыть кабинет.'}</p>
        <p>
          <a href="/login">Перейти ко входу</a>
        </p>
      </section>
    );
  }

  return (
    <section className="lookupResult">
      <h2>{state.user?.name || state.user?.email || 'Аккаунт'}</h2>
      {state.user?.email ? <p className="muted">{state.user.email}</p> : null}
      <p className="muted">Черновой кабинет. Следующим шагом добавим связь пользователя с сайтами и заявками.</p>
      <button className="plainButton" type="button" onClick={handleLogout}>
        Выйти
      </button>
    </section>
  );
}
