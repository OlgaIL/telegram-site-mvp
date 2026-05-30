import Link from 'next/link';

export default function AppShell({ children }) {
  return (
    <>
      <header className="appTopbar">
        <Link className="appBrand" href="/">
          Telegram Site MVP
        </Link>

        <nav className="appNav" aria-label="Main navigation">
          <Link href="/">Find channel</Link>
          <Link href="/site/default">Demo site</Link>
          <Link href="/add-channel">Add channel</Link>
        </nav>
      </header>

      {children}
    </>
  );
}
