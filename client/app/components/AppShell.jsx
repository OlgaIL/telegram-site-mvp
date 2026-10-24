'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getMe, logout } from '@/lib/api';
import Modal from './Modal';
import LoginPanel from './LoginPanel';
import SiteNotices from './SiteNotices';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [loginTarget, setLoginTarget] = useState(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [account, setAccount] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const data = await getMe();

        if (active) {
          setAccount({
            loading: false,
            authenticated: data.authenticated,
            user: data.user,
          });
        }
      } catch (err) {
        if (active) {
          setAccount({ loading: false, authenticated: false, user: null });
        }
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await logout();
    setAccount({ loading: false, authenticated: false, user: null });
    window.location.href = '/';
  }

  const addChannelHref = account.authenticated ? '/add-channel' : '/login?returnTo=%2Fadd-channel';
  const displayName = account.user?.name || account.user?.email || 'Аккаунт';
  const isLoginPage = pathname === '/login';

  function interceptLogin(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === '/login' || (url.pathname === '/add-channel' && !account.loading && !account.authenticated)) {
      event.preventDefault();
      anchor.focus({ preventScroll: true });
      setLoginTarget(url.pathname === '/login' ? (url.searchParams.get('returnTo') || '/dashboard') : url.pathname + url.search);
    }
  }

  return (
    <div className="appShell" onClickCapture={interceptLogin}>
      <header className="appTopbar">
        <Link className="appBrand" href="/">
          Telegram Зеркало
        </Link>

        {!isLoginPage ? (
          <nav className="appNav" aria-label="Основная навигация">
            <Link href="/#how">Как работает</Link>
            <Link href="/site/default">Пример</Link>
            <Link href={addChannelHref}>Добавить канал</Link>

            {account.authenticated ? (
              <div className="accountMenu">
                <Link className="accountLink" href="/dashboard">
                  {account.user?.avatarUrl ? (
                    <img className="accountAvatar" src={account.user.avatarUrl} alt="" />
                  ) : (
                    <span className="accountAvatarFallback">{displayName.slice(0, 1).toUpperCase()}</span>
                  )}
                  <span className="accountText">
                    <span className="accountName">{displayName}</span>
                    <span className="accountPlan">Бесплатная бета</span>
                  </span>
                </Link>
                <button className="linkButton" type="button" onClick={handleLogout}>
                  Выход
                </button>
              </div>
            ) : (
              <Link href="/login">Вход</Link>
            )}
          </nav>
        ) : null}
      </header>

      {children}
      <SiteNotices />
      {loginTarget !== null && <Modal busy={loginBusy} labelledBy="login-title" onClose={() => setLoginTarget(null)}><LoginPanel returnTo={loginTarget} onBusyChange={setLoginBusy} /></Modal>}
    </div>
  );
}
