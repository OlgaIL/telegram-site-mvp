import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <main className="page pageNarrow">
      <header className="siteHeader">
        <p className="eyebrow">Кабинет</p>
        <h1>Мой аккаунт</h1>
        <p>Здесь будут заявки, подключенные сайты и настройки публикации.</p>
      </header>

      <DashboardClient />
    </main>
  );
}
