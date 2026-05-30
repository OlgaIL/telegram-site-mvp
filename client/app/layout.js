import './globals.css';
import AppShell from './components/AppShell';

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || 'Telegram Site',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Telegram-powered updates',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
