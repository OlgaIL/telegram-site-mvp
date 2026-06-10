import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <main className="page pageNarrow">
      <header className="siteHeader">
        <p className="eyebrow">Dashboard draft</p>
        <h1>My account</h1>
        <p>This is the first auth-protected area. Site settings will be connected here later.</p>
      </header>

      <DashboardClient />
    </main>
  );
}
