'use client';
import { useEffect, useState } from 'react';
import { getAuthProviders } from '@/lib/api';
import EmailLoginForm from '../login/EmailLoginForm';
const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function LoginPanel({ returnTo = '/dashboard', error = false, onBusyChange }) {
  const [state, setState] = useState({ loading: true, items: [], failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ loading: true, items: [], failed: false });
    getAuthProviders().then(data => {
      if (active) setState({ loading: false, items: data?.items || [], failed: false });
    }).catch(() => { if (active) setState({ loading: false, items: [], failed: true }); });
    return () => { active = false; };
  }, [attempt]);
  return <div className="loginPanel">
    <h1 id="login-title">Войти в Зеркало</h1>
    <p className="muted">Чтобы подключить канал и следить за заявкой.</p>
    {error && <p role="alert" className="emailLoginError">Не удалось войти. Попробуйте ещё раз.</p>}
    {state.loading ? <p role="status">Загружаем способы входа…</p> : <>
      <div className="authActions">{state.items.filter(p => p.id !== 'email').map(p =>
        <a className="authButton" key={p.id} href={API.replace(/\/$/, '') + '/auth/' + encodeURIComponent(p.id) + '?returnTo=' + encodeURIComponent(returnTo)}>Войти через {p.label}</a>
      )}</div>
      {state.items.some(p => p.id === 'email') && <EmailLoginForm returnTo={returnTo} onBusyChange={onBusyChange} />}
      {!state.items.length && <div role="status"><p className="muted">{state.failed ? 'Не удалось загрузить способы входа.' : 'Вход временно недоступен.'}</p><button className="authButton" onClick={() => setAttempt(a => a + 1)}>Попробовать снова</button></div>}
    </>}
    <p className="finePrint">Пароль не нужен. Для входа по почте отправим одноразовый код.</p>
  </div>;
}
