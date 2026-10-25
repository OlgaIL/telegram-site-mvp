import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getChannelRequests, getDetectedChannels, getMeWithCookie } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { connectChannel } from './actions';

export const dynamic = 'force-dynamic';

function requestUsername(value) {
  const match = String(value || '').trim().match(/^(?:https?:\/\/)?(?:t\.me\/)?@?([a-z0-9_]{5,32})\/?$/i);
  return match?.[1]?.toLowerCase() || null;
}

function requestStatusLabel(request, channels) {
  if (request.siteUrl) return 'Подключена';
  if (request.status === 'rejected') return 'Отклонена';

  const username = requestUsername(request.telegramChannel);
  const hasMatch = channels.some(
    (channel) => !channel.siteUrl && username && channel.username?.toLowerCase() === username,
  );

  if (hasMatch) return 'Канал найден';
  return channels.some((channel) => !channel.siteUrl) ? 'Нужна сверка канала' : 'Ожидаем канал';
}

function ChannelConnection({ request, channels }) {
  const username = requestUsername(request.telegramChannel);
  const available = channels.filter((channel) => !channel.siteUrl);
  const alreadyConnected = channels.find(
    (channel) => channel.siteUrl && username && channel.username?.toLowerCase() === username,
  );
  const suggested = available.find(
    (channel) => username && channel.username?.toLowerCase() === username,
  );

  if (alreadyConnected) {
    return (
      <p className="muted">
        Этот канал уже подключён: <Link href={alreadyConnected.siteUrl}>открыть сайт</Link>.
        {' '}Telegram ID: {alreadyConnected.telegramChatId}.
      </p>
    );
  }

  if (!available.length) {
    return <p className="muted">Доступных каналов пока нет. Добавьте бота и опубликуйте новый пост.</p>;
  }

  return (
    <>
      <p className="muted">
        {suggested
          ? `Возможно, бот обнаружил канал @${suggested.username}. Проверьте его перед подключением.`
          : 'Автоматического совпадения нет. Выберите канал, который бот обнаружил после нового поста.'}
      </p>
      <form className="lookupForm" action={connectChannel}>
        <input type="hidden" name="requestId" value={request.id} />
        <label htmlFor={`channel-${request.id}`}>Обнаруженный канал</label>
        <select id={`channel-${request.id}`} name="channelId" defaultValue={suggested?.id || ''} required>
          <option value="" disabled>Выберите канал</option>
          {available.map((channel) => (
            <option value={channel.id} key={channel.id}>
              {channel.title || 'Без названия'}
              {channel.username ? ` (@${channel.username})` : ''}
              {` · ID ${channel.telegramChatId} · обнаружен ${formatDate(channel.detectedAt)}`}
            </option>
          ))}
        </select>
        <label>
          <input type="checkbox" name="confirmed" value="yes" required /> Подтверждаю: это канал из заявки
        </label>
        <button type="submit">Подключить канал</button>
      </form>
    </>
  );
}

export default async function ChannelRequestsAdminPage({ searchParams }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const account = await getMeWithCookie(cookieHeader).catch(() => null);

  if (!account?.authenticated) {
    redirect('/login?returnTo=%2Fadmin%2Fchannel-requests');
  }

  if (!account.user?.isAdmin) {
    notFound();
  }

  const [data, detected] = await Promise.all([
    getChannelRequests(cookieHeader),
    getDetectedChannels(cookieHeader),
  ]);
  const requests = data?.items || [];
  const channels = detected?.items || [];
  const params = await searchParams;

  return (
    <main className="page ym-hide-content">
      <p className="backLink">
        <Link href="/">Назад к поиску</Link>
      </p>

      <header className="siteHeader">
        <p className="eyebrow">Внутренний черновик</p>
        <h1>Заявки на подключение</h1>
        <p>Сверьте заявку с каналом, который бот обнаружил после нового поста.</p>
      </header>

      {params?.error ? <p className="lookupResult lookupResultError">{params.error}</p> : null}
      {typeof params?.connected === 'string' && /^\/site\/[a-z0-9-]+$/.test(params.connected) ? (
        <p className="lookupResult lookupResultSuccess">
          Канал подключён. <Link href={params.connected}>Открыть сайт</Link>
        </p>
      ) : null}

      {requests.length === 0 ? (
        <section className="lookupResult">
          <h2>Заявок пока нет</h2>
          <p className="muted">Новые заявки появятся здесь после отправки формы подключения канала.</p>
        </section>
      ) : (
        <section className="adminList" aria-label="Заявки на подключение каналов">
          {requests.map((request) => (
            <article className="adminCard" key={request.id}>
              <div className="adminCardHeader">
                <div>
                  <h2>Заявка №{request.id}: {request.telegramChannel}</h2>
                  <p className="muted">{request.email}</p>
                </div>
                <span className="statusBadge">{requestStatusLabel(request, channels)}</span>
              </div>

              {request.comment ? <p className="postText">{request.comment}</p> : null}

              <p className="muted">Создана: {formatDate(request.createdAt)}</p>
              {request.siteUrl ? (
                <p><Link href={request.siteUrl}>Открыть сайт канала</Link></p>
              ) : request.status === 'rejected' ? (
                <p className="muted">Заявка отклонена.</p>
              ) : (
                <ChannelConnection request={request} channels={channels} />
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
