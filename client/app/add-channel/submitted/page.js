import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getMeWithCookie, getMyChannelRequestsWithCookie } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ChannelRequestSubmittedPage({ searchParams }) {
  const params = await searchParams;
  const requestId = String(params?.requestId || '');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const account = await getMeWithCookie(cookieHeader).catch(() => null);

  if (!account?.authenticated) {
    redirect('/login?returnTo=%2Fdashboard');
  }

  const data = await getMyChannelRequestsWithCookie(cookieHeader);
  const request = data.items.find((item) => String(item.id) === requestId);

  if (!request) {
    notFound();
  }

  const botUsername = String(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '').trim();
  const botName = /^@[a-z0-9_]{5,32}$/i.test(botUsername) && botUsername !== '@your_service_bot'
    ? botUsername
    : null;

  return (
    <main className="page pageNarrow">
      <p className="backLink"><Link href="/dashboard">В кабинет</Link></p>
      <header className="siteHeader">
        <p className="eyebrow">Заявка №{request.id}</p>
        <h1>Заявка отправлена</h1>
        <p>Канал: {request.telegramChannel}</p>
      </header>

      {request.siteUrl ? (
        <section className="lookupResult lookupResultSuccess">
          <h2>Канал подключён</h2>
          <Link href={request.siteUrl}>Открыть сайт канала</Link>
        </section>
      ) : (
        <section className="lookupResult">
          <h2>Как добавить бота</h2>
          {!botName ? (
            <p>Имя сервисного бота пока не настроено. Мы покажем его здесь после настройки.</p>
          ) : (
            <>
              <p>Откройте в Telegram ваш канал и нажмите на его название.</p>
              <ol>
                <li>Откройте раздел «Администраторы» и нажмите «Добавить администратора».</li>
                <li>
                  Найдите <a href={`https://t.me/${botName.slice(1)}`} target="_blank" rel="noopener noreferrer">{botName}</a>
                  {' '}и добавьте его в канал.
                </li>
                <li>После добавления опубликуйте в канале один новый пост.</li>
              </ol>
              <p>После нового поста мы увидим канал и сможем подключить его. Старые посты автоматически не загрузятся.</p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
