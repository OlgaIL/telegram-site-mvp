# Вход и провайдеры

Настройки находятся в корневом .env. После изменений перезапустить API.
Клиент получает способы входа через GET /api/auth-providers без пересборки.
Кнопки появляются только для включённых и настроенных провайдеров.

    YANDEX_AUTH_ENABLED=true
    GOOGLE_AUTH_ENABLED=true
    VK_AUTH_ENABLED=false
    EMAIL_AUTH_ENABLED=false

Для OAuth нужны свои *_CLIENT_ID, *_CLIENT_SECRET и *_CALLBACK_URL.
VK использует VK ID с PKCE; VK_CLIENT_SECRET текущему flow не нужен.
Callback должен точно совпадать с настройками приложения VK ID:
локально http://localhost:3000/auth/vk/callback, на сервере https://tg4you.ru/auth/vk/callback.
Флаг выключает кнопку и возможность войти прямым запросом.
Уже выданные сессии продолжают действовать.

## Почта

Применить миграции: npm run db:migrate.

Заполнить корневой .env самостоятельно:

    EMAIL_AUTH_ENABLED=true
    EMAIL_OTP_SECRET=<отдельный случайный секрет не короче 32 символов>
    SMTP_HOST=<сервер отправки>
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=<логин почты>
    SMTP_PASSWORD=<пароль или пароль приложения>
    SMTP_FROM=<адрес отправителя>

Создать секрет:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Сохранить вывод только в .env; не присылать в чат и не включать в Git.
Для порта 587 указать SMTP_SECURE=false: соединение обязательно повышается до TLS через STARTTLS.
Использовать собственный адрес отправителя проекта, разрешённый почтовым сервисом.

Необязательные параметры:

    EMAIL_AUTH_CODE_TTL_MINUTES=10
    EMAIL_AUTH_RESEND_SECONDS=60
    EMAIL_AUTH_MAX_ATTEMPTS=5
    EMAIL_AUTH_EMAIL_REQUESTS_PER_HOUR=5
    EMAIL_AUTH_IP_REQUESTS_PER_HOUR=20

Код состоит из 6 цифр, одноразовый. В PostgreSQL сохраняются HMAC кода и IP.
Новый запрос аннулирует предыдущий код; ошибка доставки тоже аннулирует код.
Коды и SMTP-пароли не пишутся в логи. Старые записи удаляются при успешной отправке.
Неудачные отправки тоже учитываются в ограничении запросов.
Письмо содержит собственный HTML-шаблон Telegram Зеркала и ссылку https://tg4you.ru/,
а также текстовую версию для почтовых клиентов без HTML.

Успешная проверка находит пользователя по email или создаёт нового.
Имя, аватар, ID и заявки существующего OAuth-пользователя сохраняются.
По умолчанию вход возвращает в /dashboard; из «Добавить канал» возвращает в /add-channel.

API:

- POST /auth/email/request: JSON с email.
- POST /auth/email/verify: JSON с email, шестизначным code и returnTo.
- Ошибки: 400 неверные данные/код, 429 лимит с Retry-After, 503 почта отключена или недоступна.
- При успехе сервер устанавливает ту же HttpOnly session cookie, что и OAuth.
- Допускаются JSON-запросы с origin клиентского сайта; внешний redirect отвергается.

## Проверка

Проверка SMTP без отправки писем: npm run smtp:verify.
Команда использует тот же транспорт, что и отправка кодов, и не выводит пароль.
EAUTH 535 означает отказ авторизации, ETIMEDOUT CONN — таймаут подключения.

1. npm test — провайдеры, redirect и регрессия завершения заявок.
2. npm run test:auth:db — изолированная схема в локальном PostgreSQL, без настоящих писем.
3. npm run build --prefix client.
4. После настройки SMTP открыть /login, запросить код на свою почту и войти.
5. Повторить из /add-channel: после входа должна открыться форма заявки.
6. Проверить неправильный/повторно использованный код и повторную отправку.
7. Выключить EMAIL_AUTH_ENABLED, перезапустить API: кнопка пропадает, email endpoint возвращают 503.

Автотест не подтверждает доставляемость писем и успешный вход в VK ID.
Для VK проверяются PKCE, отправка state и проверка state в ответе обмена кода.
Для VK нужен ручной вход через настроенное приложение с зарегистрированным callback.
На VPS переменные добавляет Ольга; публикация выполняется отдельно.

SMTP-параметры: https://nodemailer.com/smtp
Обмен кода VK ID: https://github.com/VKCOM/vkid-web-sdk/blob/master/src/auth/auth.ts
