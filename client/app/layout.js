import './globals.css';
import AppShell from './components/AppShell';

export const metadata = {
  title: 'Telegram Зеркало — сайт вашего Telegram-канала',
  description: 'Пишите в Telegram — сайт обновляется сам. Подключите канал и получите публичную ленту постов и фотографий.',
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
