import './globals.css';
import AppShell from './components/AppShell';
import Metrika from './components/Metrika';

export const metadata = {
  title: 'Telegram Зеркало — сайт вашего Telegram-канала',
  description: 'Пишите в Telegram — сайт обновляется сам. Подключите канал и получите публичную ленту постов и фотографий.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AppShell>{children}</AppShell>
        <Metrika />
      </body>
    </html>
  );
}
