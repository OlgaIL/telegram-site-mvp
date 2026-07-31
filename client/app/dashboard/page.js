import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <main className="page pageNarrow">
      <header className="siteHeader">
        <p className="eyebrow">Черновой кабинет</p>
        <h1>Мой аккаунт</h1>
        <p>Это первая закрытая область. Позже здесь появятся сайты, заявки и настройки подключения.</p>
      </header>

      <DashboardClient />
    </main>
  );
}
