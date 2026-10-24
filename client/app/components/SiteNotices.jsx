'use client';
import { useEffect, useState } from 'react';
import Modal from './Modal';
const KEY = 'tg4you-cookie-notice-v1';

export default function SiteNotices() {
  const [visible, setVisible] = useState(false);
  const [sheet, setSheet] = useState(null);
  useEffect(() => { try { setVisible(!localStorage.getItem(KEY)); } catch { setVisible(true); } }, []);
  function dismiss() { try { localStorage.setItem(KEY, 'seen'); } catch {} setVisible(false); }
  return <>
    <footer className="appFooter"><span>Telegram Зеркало</span><div>
      <button className="linkButton" onClick={() => setSheet('beta')}>Условия беты</button>
      <button className="linkButton" onClick={() => setSheet('data')}>О данных и cookie</button>
    </div></footer>
    {visible && <aside className="cookieNotice" aria-label="Уведомление о cookie">
      <p>Используем cookie, чтобы сохранять вход в аккаунт. <button className="linkButton" onClick={() => setSheet('data')}>Подробнее</button></p>
      <button className="authButton" onClick={dismiss}>Понятно</button>
    </aside>}
    {sheet && <Modal label={sheet === 'beta' ? 'Условия беты' : 'О данных и cookie'} onClose={() => setSheet(null)}>
      {sheet === 'beta' ? <div className="noticeText"><h2>Условия беты</h2><p>Закрытая бета бесплатна. Подключаем один публичный канал на пользователя вручную.</p><p>Публикуются новые тексты и одно фото из публикации. Старые записи, альбомы, видео и документы пока не переносим.</p><p>Сейчас сайт канала размещается на tg4you.ru. Подключение к существующим сайтам — следующий этап.</p></div> :
        <div className="noticeText"><h2>О данных и cookie</h2><p>Для входа используем email или профиль выбранного провайдера. Для подключения сохраняем канал, контактную почту и комментарий к заявке.</p><p>Сессионная cookie позволяет оставаться в аккаунте. При выходе сессия завершается. Отметку о прочтении этого уведомления сохраняем в вашем браузере.</p><p>Подключённые публикации и фотографии доступны на публичной странице канала.</p><p className="finePrint">Это краткое описание работы сервиса. Политика обработки данных, пользовательское соглашение и контакт для обращений готовятся к запуску.</p></div>}
    </Modal>}
  </>;
}
