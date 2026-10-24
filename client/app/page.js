import Link from 'next/link';
import { lookupChannel } from '@/lib/api';
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.channel || '').trim();
  let result = null;
  let failed = false;
  if (query) { try { result = await lookupChannel(query); } catch { failed = true; } }
  return <main className="page landingPage">
    <section className="landingHero">
      <p className="eyebrow">Один пост. Больше возможностей.</p>
      <h1>Пишите в Telegram.<br /><span>Публикуйте на сайте.</span></h1>
      <p className="heroDescription">Ваши тексты и фотографии — за пределами канала.<br className="desktopBreak" /> Без копирования и повторной загрузки.</p>
      <div className="heroActions"><Link className="plainButton" href="/site/default">Посмотреть пример <span aria-hidden="true">↗</span></Link><Link className="quietLink" href="/add-channel">Подключить канал <span aria-hidden="true">→</span></Link></div>
      <p className="finePrint">Бесплатная закрытая бета · Подключаем лично</p>
    </section>

    <section className="publicationExample" aria-label="Пример переноса публикации">
      <article className="examplePost"><p className="exampleLabel">В вашем Telegram</p><div className="exampleAuthor"><span className="exampleAvatar" aria-hidden="true">А</span><div><strong>Анна · Интерьеры</strong><span>Публикация в канале</span></div></div><h2>Как сделать комнату светлее</h2><p>Начните с трёх вещей: освободите подоконник, добавьте свет у кресла и выберите светлый текстиль.</p><span className="finePrint">Пример публикации</span></article>
      <span className="exampleArrow" aria-label="Автоматически появляется на сайте">→</span>
      <article className="examplePost exampleWebsite"><p className="exampleLabel">На сайте канала</p><div className="exampleSiteBrand">Анна · Интерьеры <span>Заметки</span></div><h2>Как сделать комнату светлее</h2><p>Начните с трёх вещей: освободите подоконник, добавьте свет у кресла и выберите светлый текстиль.</p><span className="exampleRead">Отдельная страница публикации <span aria-hidden="true">↗</span></span></article>
    </section>

    <section className="landingSection" id="how"><p className="eyebrow">Как это работает</p><h2>Ведите канал как обычно</h2><div className="stepsGrid">
      <article><span className="stepNumber">01</span><h3>Оставьте заявку</h3><p>Войдите и укажите свой публичный Telegram-канал.</p></article>
      <article><span className="stepNumber">02</span><h3>Добавьте бота</h3><p>Покажем, как добавить нашего бота в канал. Подключение завершим вручную.</p></article>
      <article><span className="stepNumber">03</span><h3>Публикуйте</h3><p>Новые тексты и фото появятся на сайте. Ссылка будет ждать в кабинете.</p></article>
    </div></section>

    <section className="landingSection"><p className="eyebrow">Ваш канал — ваш выбор</p><h2>Начните с простого</h2><div className="optionsGrid">
      <article><span className="availability">Доступно сейчас</span><h3>Отдельный сайт из канала</h3><p>Публичная лента и страницы публикаций на tg4you.ru. Для тех, кому нужна простая ссылка на свои материалы.</p><Link className="quietLink" href="/add-channel">Подключить бесплатно →</Link></article>
      <article><span className="availability availabilityLater">Следующий этап</span><h3>Публикации на вашем сайте</h3><p>Хотим, чтобы Telegram обновлял и существующий сайт. Готовим подключение с отдельными страницами материалов.</p><p className="finePrint">Пока недоступно</p></article>
    </div><p className="finePrint betaLimits">В бете: один публичный канал, новые тексты и одно фото. Без импорта старых записей, видео и альбомов.</p></section>

    <section className="landingSection channelSearch" id="find"><h2>Уже подключили канал?</h2><p className="muted">Найдите его публичную страницу.</p><form className="lookupForm lookupFormInline" action="/#find" method="get"><label htmlFor="channel">Название или username канала</label><div className="lookupRow"><input id="channel" name="channel" placeholder="@your_channel" defaultValue={query} required /><button type="submit">Найти</button></div></form>
      {failed && <p role="alert">Не удалось выполнить поиск. Попробуйте ещё раз.</p>}
      {result?.found && <div className="lookupResult lookupResultSuccess"><h3>{result.site.title || result.site.name}</h3><Link href={result.url}>Открыть сайт канала →</Link></div>}
      {result && !result.found && <div className="lookupResult"><h3>Канал пока не подключён</h3><Link href={'/add-channel?channel=' + encodeURIComponent(query)}>Подключить свой канал →</Link></div>}
    </section>
  </main>;
}
