import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMeWithCookie } from '@/lib/api';
import { submitChannelRequest } from './actions';

export default async function AddChannelPage({ searchParams }) {
  const cookieStore = await cookies();
  const account = await getMeWithCookie(cookieStore.toString()).catch(() => null);

  if (!account?.authenticated) {
    redirect('/login');
  }

  const params = await searchParams;
  const status = params?.status;
  const message = params?.message;
  const channel = String(params?.channel || '').trim();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '@your_service_bot';

  return (
    <main className="page pageNarrow">
      <p className="backLink">
        <Link href="/">Назад к поиску</Link>
      </p>

      <header className="siteHeader">
        <p className="eyebrow">Подключение канала</p>
        <h1>Добавить Telegram-канал</h1>
        <p>Оставьте заявку. Позже этот сценарий станет полноценным подключением канала в кабинете.</p>
      </header>

      <section className="lookupResult">
        <h2>Шаг с ботом</h2>
        <p className="muted">
          Для MVP и будущих клиентов мы используем одного сервисного бота. После подтверждения заявки добавьте его
          админом в Telegram-канал:
        </p>
        <p className="botName">{botUsername}</p>
        <p className="muted">
          Боту нужен доступ к новым постам канала. Мы определим канал по Telegram chat id, когда придет первый пост.
        </p>
      </section>

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
