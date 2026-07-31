import Link from 'next/link';
import { getChannelRequests } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ChannelRequestsAdminPage() {
  const data = await getChannelRequests();
  const requests = data?.items || [];

  return (
    <main className="page">
      <p className="backLink">
        <Link href="/">Назад к поиску</Link>
      </p>

      <header className="siteHeader">
        <p className="eyebrow">Внутренний черновик</p>
        <h1>Заявки на подключение</h1>
        <p>Временная внутренняя страница. Защиту доступа и управление статусами добавим отдельно.</p>
      </header>

      <section className="lookupResult internalNotice">
        <h2>Служебная страница</h2>
        <p className="muted">Этот маршрут пока не входит в публичный пользовательский сценарий.</p>
      </section>

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
                  <h2>{request.telegramChannel}</h2>
                  <p className="muted">{request.email}</p>
                </div>
                <span className="statusBadge">{request.status}</span>
              </div>

              {request.comment ? <p className="postText">{request.comment}</p> : null}

              <p className="muted">Создана: {formatDate(request.createdAt)}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
