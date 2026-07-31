import Link from 'next/link';
import { lookupChannel } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.channel || '').trim();
  const result = query ? await lookupChannel(query) : null;

  return (
    <main className="page pageNarrow">
      <section className="lookupResult heroPanel">
        <p className="eyebrow">Поиск зеркала</p>
        <h1>Найти зеркало телеграмм канала</h1>
        <p className="muted">
          Введите username или название канала. Если канал уже подключен, мы откроем его публичную страницу.
        </p>

        <form className="lookupForm lookupFormInline" action="/" method="get">
          <label htmlFor="channel">Название канала</label>
          <div className="lookupRow">
            <input
              id="channel"
              name="channel"
              type="text"
              placeholder="@test_site_tele"
              defaultValue={query}
            />
            <button type="submit">Найти</button>
          </div>
        </form>
      </section>

      {result?.found ? (
        <section className="lookupResult lookupResultSuccess">
          <h2>{result.site.title || result.site.name}</h2>
          <p className="muted">
            Канал найден: @{result.site.channel?.username || 'unknown'}
          </p>
          <p>
            <Link href={result.url}>Открыть сайт канала</Link>
          </p>
        </section>
      ) : null}

      {result && !result.found ? (
        <section className="lookupResult">
          <h2>Канал пока не подключен</h2>
          <p className="muted">Такого канала еще нет в нашей системе.</p>
          <p>
            <Link href={`/add-channel${query ? `?channel=${encodeURIComponent(query)}` : ''}`}>
              Добавить канал
            </Link>
          </p>
        </section>
      ) : null}

      {!result ? (
        <section className="lookupResult">
          <h2>Посмотреть демо</h2>
          <p className="muted">Откройте тестовый сайт, который уже получает посты из Telegram.</p>
          <p>
            <Link href="/site/default">Открыть демо-сайт</Link>
          </p>
        </section>
      ) : null}

      <section className="lookupResult">
        <p className="eyebrow">Подключение</p>
        <h2>Пишите в Telegram - и новостная лента вашего сайта обновляется сама.</h2>
        <p className="muted">
          Хотите подключить свой канал? Оставьте заявку, а дальше мы проведем вас через подключение бота.
        </p>
        <p>
          <Link href={`/add-channel${query ? `?channel=${encodeURIComponent(query)}` : ''}`}>
            Добавить канал
          </Link>
        </p>
      </section>
    </main>
  );
}
