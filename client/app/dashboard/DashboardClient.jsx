'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/format';
import { getMe, getMyChannelRequests, logout } from '@/lib/api';

function requestStatusLabel(status) {
  const labels = {
    new: 'На рассмотрении',
    sent: 'Отправлена',
    in_progress: 'В работе',
    done: 'Подключена',
    rejected: 'Не подключена',
  };

  return labels[status] || status || 'На рассмотрении';
}

export default function DashboardClient() {
  const [state, setState] = useState({
    loading: true,
    authenticated: false,
    user: null,
    requests: [],
    error: '',
  });

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const account = await getMe();

        if (!account.authenticated) {
          if (active) {
            setState({
              loading: false,
              authenticated: false,
              user: null,
              requests: [],
              error: '',
            });
          }
          return;
        }

        const requests = await getMyChannelRequests();

        if (active) {
          setState({
            loading: false,
            authenticated: true,
            user: account.user,
            requests: requests.items || [],
            error: '',
          });
        }
      } catch (err) {
        if (active) {
          setState({
            loading: false,
            authenticated: false,
            user: null,
            requests: [],
            error: 'Не удалось загрузить кабинет.',
          });
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  if (state.loading) {
    return <p className="muted">Загружаем кабинет...</p>;
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
    <div className="dashboardStack">
      <section className="lookupResult">
        <h2>{state.user?.name || state.user?.email || 'Аккаунт'}</h2>
        {state.user?.email ? <p className="muted">{state.user.email}</p> : null}
        <p className="muted">Бесплатный тариф</p>
        <button className="plainButton" type="button" onClick={handleLogout}>
          Выйти
        </button>
      </section>

      <section className="lookupResult">
        <div className="sectionHeaderRow">
          <div>
            <h2>Мои заявки</h2>
            <p className="muted">Здесь виден статус подключения Telegram-канала.</p>
          </div>
          <a href="/add-channel">Добавить канал</a>
        </div>

        {state.requests.length === 0 ? (
          <p className="muted">Заявок пока нет.</p>
        ) : (
          <div className="requestList">
            {state.requests.map((request) => (
              <article className="requestItem" key={request.id}>
                <div>
                  <h3>{request.telegramChannel}</h3>
                  <p className="muted">Отправлена: {formatDate(request.createdAt)}</p>
                </div>
                <span className="statusBadge">{requestStatusLabel(request.status)}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
