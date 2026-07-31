import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page pageNarrow">
      <article className="postArticle">
        <h1>Страница не найдена</h1>
        <p className="muted">Такой записи нет или она еще не подключена к сайту.</p>
        <p className="backLink">
          <Link href="/">Вернуться на главную</Link>
        </p>
      </article>
    </main>
  );
}
