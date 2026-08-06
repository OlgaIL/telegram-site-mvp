'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getMe, logout } from '@/lib/api';

export default function AppShell({ children }) {
  const pathname = usePathname();
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

  return (
    <>
      <header className="appTopbar">
        <Link className="appBrand" href="/">
          Telegram Зеркало
        </Link>

        {!isLoginPage ? (
          <nav className="appNav" aria-label="Основная навигация">
            <Link href="/">Поиск</Link>
            <Link href="/site/default">Демо-сайт</Link>
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
                    <span className="accountPlan">Бесплатный тариф</span>
                  </span>
                </Link>
                <button className="linkButton" type="button" onClick={handleLogout}>
                  Выход
                </button>
              </div>
            ) : (
              <Link href="/login">{account.loading ? 'Вход' : 'Вход'}</Link>
            )}
          </nav>
        ) : null}
      </header>

      {children}
    </>
  );
}
