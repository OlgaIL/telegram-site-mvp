# Релиз: вход по почте

Подготовлено: 22 октября 2026 года. Публикацию выполняет Ольга.

Исходная ветка: codex/email-auth.
В неё входит также коммит 108b1cd (инструкция подключения канала), которого
на момент подготовки не было в origin/main.

## Проверено и что остаётся

- 20 автотестов: провайдеры, шаблон письма, коды, лимиты, сессии, повторное использование кода и существующий OAuth-аккаунт.
- SMTP-проверка не отправляет письмо и не доказывает доставляемость.
- Вход по почте на локальном компьютере остаётся неподтверждённым из-за сетевых таймаутов.
- После оплаты почтового хостинга Word2you на VPS работает по подтверждению Ольги.
- Это не подтверждает вход в Telegram Зеркало: его проверяем после публикации.
- VK ID остаётся отдельной ручной проверкой, до неё VK_AUTH_ENABLED=false.

## 1. Отправить подготовленную ветку в GitHub

В локальном Git Bash:

    cd /c/Users/olgak/PROJECTS/telegram-site-mvp
    git switch codex/email-auth
    git push -u origin codex/email-auth

## 2. Проверить состояние сервера

    ssh root@147.45.246.205
    cd /var/www/tg4you.ru/app
    git status --short
    git log -1 --oneline

При изменённых отслеживаемых файлах остановиться и проверить их; ничего не сбрасывать.
Сделать резервную копию базы tg4you средствами существующего сервиса БД.

Сохранить предыдущую ревизию и конфигурацию:

    git rev-parse HEAD > /var/www/tg4you.ru/shared/email-auth-before-revision
    cp .env "/var/www/tg4you.ru/shared/email-auth-env-$(date +%Y%m%d-%H%M%S).bak"

Резервная копия .env содержит секреты и остаётся только на сервере.

## 3. Получить код и установить зависимости

    git fetch origin
    git switch codex/email-auth
    git pull --ff-only origin codex/email-auth
    npm ci
    npm ci --prefix client

При первом переключении Git создаст локальную ветку, отслеживающую origin/codex/email-auth.
Не использовать git pull origin main для этого релиза: код пока находится в отдельной ветке.

## 4. Настроить серверный .env

Открыть /var/www/tg4you.ru/app/.env.
Сохранить действующие DATABASE_URL, Telegram-токен, OAuth, ADMIN_EMAILS, адреса и пути.
Добавить:

    EMAIL_AUTH_ENABLED=false
    EMAIL_OTP_SECRET=<отдельный секрет из 32+ случайных символов>
    SMTP_HOST=<рабочий SMTP-сервер>
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=<рабочий почтовый ящик>
    SMTP_PASSWORD=<пароль почты>
    SMTP_FROM=<разрешённый адрес отправителя>
    VK_AUTH_ENABLED=false

Использовать рабочие SMTP-данные Word2you, но не копировать весь его .env.
Для EMAIL_OTP_SECRET сгенерировать отдельное значение:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Не присылать секрет в чат. Параметры порта 587 описаны в email-auth.md.

## 5. Проверить и собрать

    npm run smtp:verify
    npm run db:migrate
    npm run build --prefix client

При любой ошибке остановиться. Не перезапускать приложение с неуспешной сборкой.
В норме SMTP сообщает SMTP OK, а миграция 009 добавляет таблицу кодов и дату проверки email.
Тест test:auth:db предназначен только для локальной БД, на VPS его запускать не нужно.

## 6. Включить и проверить

После успешных проверок поставить в серверном .env EMAIL_AUTH_ENABLED=true.

    pm2 restart tg4you-api tg4you-web --update-env
    pm2 save
    curl https://tg4you.ru/health
    pm2 status

Проверить https://tg4you.ru/login:

1. Вход через Google/Яндекс работает как раньше.
2. Запрос кода на свою почту: письмо Telegram Зеркала, код и ссылка на tg4you.ru.
3. Код позволяет войти в кабинет; повторно тот же код не принимается.
4. Из «Добавить канал» вход возвращает в форму заявки.
5. Существующие заявки и профиль остаются у прежнего пользователя при том же email.

Логи при ошибке:

    pm2 logs tg4you-api --lines 60 --nostream

Пароли, коды и весь .env в чат не присылать.

## Отключение почты и откат

Быстро убрать почтовый вход: EMAIL_AUTH_ENABLED=false в серверном .env, затем:

    pm2 restart tg4you-api --update-env

При необходимости вернуться к предыдущему коду:

    git switch --detach "$(cat /var/www/tg4you.ru/shared/email-auth-before-revision)"
    npm ci
    npm ci --prefix client
    npm run build --prefix client
    pm2 restart tg4you-api tg4you-web --update-env

Если рабочая директория изменена, переключение остановить и проверить изменения.
Миграцию 009 не удалять: она добавочная, предыдущий код совместим с новой схемой.
