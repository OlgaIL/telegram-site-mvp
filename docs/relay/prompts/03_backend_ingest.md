# Задание 03 — основной backend: приём событий, дедупликация, порядок

Сначала прочитай `docs\relay\prompts\00_COMMON.md`, `docs\relay\CONTRACT.md` и `docs\relay\AUDIT.md` целиком.
Без согласованного `CONTRACT.md` не начинай.

## Контекст

Основной backend (`server/`, Express 5, PostgreSQL) должен принимать события от приёмника по HTTPS с подписью,
сохранять их идемпотентно и не давать старой версии поста затереть новую. К Telegram backend больше не обращается.
Параллельно другой агент пишет приёмник (задание 02) — общих файлов у вас нет, связь только через контракт.

## Точная задача

1. **Миграция** `server/db/migrations/010_telegram_ingest.sql` по разделу 5 контракта. Только добавление таблиц и столбцов.
   Повторный запуск безопасен (`if not exists`). Старые посты получают `version_ts = coalesce(edited_at, published_at)`.
2. **Проверка подписи** — отдельный модуль: до двух ключей из `RELAY_INGEST_KEYS`, окно 300 с, сравнение с постоянным временем.
   Для подписи нужно сырое тело запроса: подключи его только для маршрутов `/telegram/ingest/*`, не меняя поведение остальных.
   Если ключи не заданы — маршруты отвечают 503 и ничего не принимают.
3. **Маршрут** `POST /telegram/ingest/events` по разделам 2.1 и 3 контракта. Одна транзакция: `telegram_events` → канал → пост.
   Ответ 200 — только после фиксации. Ошибка базы — 500.
4. **Защита порядка** в `server/repositories/posts.repository.js`: upsert применяется, только если входящая версия не старше сохранённой.
   `edited_at` не обнуляется поздним `channel_post`. Поля фото не меняются, если `file_unique_id` тот же.
5. **Сигнал «жив»**: `POST /telegram/ingest/heartbeat` и `GET /health/telegram`
   («ok», если сигнал свежее 3 минут и старейшее недоставленное событие моложе 10 минут; наружу — только статус и возраст сигнала).
6. **Старый webhook** `POST /telegram/webhook`: при ошибке обработки отвечать 500, а не 200; при пустом `TELEGRAM_WEBHOOK_SECRET` отвечать 503.
   Обработку перевести на тот же код, что у нового маршрута (ключ события — `update_id`).
7. **Переобработка**: `npm run telegram:reprocess -- --from <update_id> --to <update_id>` заново применяет события из `telegram_events`.
8. **Очистка**: события старше 90 дней удаляются командой `npm run telegram:cleanup` (запуск по расписанию — задание 06).
9. `.env.example` и `server/config/env.js`: добавить `RELAY_INGEST_KEYS`. Неиспользуемый `TELEGRAM_PROXY_URL` не удалять — отметить в отчёте.

Приём файлов фото (`PUT /telegram/ingest/media/...`) в это задание не входит — это задание 04.
В этом задании событие с фото сохраняет `telegram_file_unique_id` и `media_status='pending'`.

## Допустимые изменения

- новые: `server/db/migrations/010_telegram_ingest.sql`, `server/routes/telegram-ingest.routes.js`, `server/services/ingest.service.js`,
  `server/services/relay-signature.service.js`, `server/repositories/telegram-events.repository.js`, `scripts/telegram-reprocess.js`,
  `scripts/telegram-cleanup.js`, тесты `scripts/telegram-*.test.js`;
- правка: `server/app.js`, `server/routes/telegram.routes.js`, `server/routes/health.routes.js`, `server/telegram/webhook.js`,
  `server/services/post.service.js`, `server/repositories/posts.repository.js`, `server/config/env.js`, `.env.example`,
  `package.json` (только раздел `scripts`), `docs/api.md`;
- отчёт.

Если карта файлов в `AUDIT.md` отличается от этого списка — действует карта из `AUDIT.md`.

## Запреты

Сверх общих: не трогать `relay/**`, `client/**`, `deploy/nginx/**`, `ecosystem.config.cjs`, маршруты авторизации;
`server/services/media.service.js` и `server/telegram/telegram-file.service.js` не править (их меняет задание 04);
не удалять и не переименовывать существующие столбцы; не добавлять зависимостей без необходимости (каждую новую обосновать в отчёте).

## Входные данные

Контракт, аудит, локальная база PostgreSQL. Тестовые события — составить по документации Bot API и положить в `scripts/fixtures/telegram/`.

## Ожидаемые артефакты

Код и миграция по списку выше; тесты; обновлённый `docs/api.md`; отчёт `docs\relay\reports\03_backend_<модель>.md`
с точным списком команд релиза (миграция, перезапуск **только** `tg4you-api`) и списком новых переменных окружения.

## Проверки (на локальной базе)

1. Одно событие три раза → одна запись в `posts`, ответы `applied`, `duplicate`, `duplicate`.
2. Десять одинаковых запросов одновременно → одна запись, ни одной ошибки 500.
3. `edited_channel_post`, затем старый `channel_post` → текст от правки, `edited_at` не обнулён, ответ `stale`.
4. Правка подписи у поста с фото → поля фото не изменились.
5. Неверная подпись, неизвестный ключ, время старше 300 с → 401; в базе ничего.
6. Ключи не заданы → 503.
7. База недоступна → 500, после восстановления то же событие применяется.
8. Старый webhook: ошибка обработки → 500; пустой секрет → 503.
9. Миграция запускается дважды без ошибок; существующие посты читаются, сайт локально открывается.
10. `npm test` проходит целиком.

## Критерий завершения

Все десять проверок проходят, вывод приведён в отчёте; изменены только разрешённые файлы; в отчёте — список команд релиза и отката
и подтверждение, что откат кода не требует отката миграции.
