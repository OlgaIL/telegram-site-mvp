import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMeWithCookie } from '@/lib/api';
import { submitChannelRequest } from './actions';

export default async function AddChannelPage({ searchParams }) {
  const cookieStore = await cookies();
  const account = await getMeWithCookie(cookieStore.toString()).catch(() => null);

  if (!account?.authenticated) {
    const params = await searchParams;
    const channel = String(params?.channel || '').trim();
    const returnTo = channel ? `/add-channel?channel=${encodeURIComponent(channel)}` : '/add-channel';
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const params = await searchParams;
  const status = params?.status;
  const message = params?.message;
  const channel = String(params?.channel || '').trim();

  return (
    <main className="page pageNarrow">
      <p className="backLink">
        <Link href="/">Назад к поиску</Link>
      </p>

      <header className="siteHeader">
        <p className="eyebrow">Подключение канала</p>
        <h1>Добавить Telegram-канал</h1>
        <p>Оставьте заявку. Сразу после отправки покажем, как добавить бота в канал.</p>
      </header>

      {status === 'success' ? (
        <section className="lookupResult lookupResultSuccess">
          <h2>Заявка сохранена</h2>
          <p className="muted">Мы сохранили заявку. В MVP письма пока не отправляются.</p>
        </section>
      ) : null}

      {status === 'error' ? (
        <section className="lookupResult lookupResultError">
          <h2>Заявка не сохранена</h2>
          <p className="muted">{message || 'Проверьте форму и попробуйте еще раз.'}</p>
        </section>
      ) : null}

      <form className="lookupForm" action={submitChannelRequest}>
        <label htmlFor="telegramChannel">Telegram-канал</label>
        <input
          id="telegramChannel"
          name="telegramChannel"
          type="text"
          placeholder="@your_channel"
          defaultValue={channel}
          required
        />

        <label htmlFor="email">Email для связи</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          defaultValue={account.user?.email || ''}
          required
        />

        <label htmlFor="comment">Комментарий</label>
        <textarea
          id="comment"
          name="comment"
          rows="4"
          placeholder="Что важно знать для подключения"
        />

        <button type="submit">Отправить заявку</button>
      </form>
    </main>
  );
}
