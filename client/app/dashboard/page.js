import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <main className="page pageNarrow ym-hide-content">
      <header className="siteHeader">
        <p className="eyebrow">Кабинет</p>
        <h1>Мой аккаунт</h1>
        <p>Ваши заявки и ссылки на подключённые сайты.</p>
      </header>

      <DashboardClient />
    </main>
  );
}
