import './globals.css';
import AppShell from './components/AppShell';

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || 'Телеграм-Сайт',
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Сайт, который обновляется из Telegram',
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
