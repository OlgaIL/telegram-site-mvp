# Контракт «приёмник → основной backend» — черновик v0

Статус: черновик архитектора. Агент аудита (промпт 01) сверяет его с кодом и выпускает
`docs/relay/CONTRACT.md` v1. После v1 контракт меняется только через Ольгу: его читают два агента параллельно.

## 1. Общие правила

- Транспорт: HTTPS на `https://tg4you.ru`, полная проверка сертификата.
- Все пути начинаются с `/telegram/ingest/` — nginx уже проксирует `/telegram/` на API, конфигурацию менять не нужно.
- Каждый запрос подписан (раздел 4).
- Ответ 2xx сервер даёт **только после фиксации транзакции** в базе или после переименования файла на диске.

## 2. Запросы

### 2.1. Событие

`POST /telegram/ingest/events`, `Content-Type: application/json`, тело ≤ 1 МБ.

```json
{
  "bot_id": 1234567890,
  "update_id": 100200300,
  "received_at": "2026-11-15T10:00:00.000Z",
  "update": { "...": "сырое событие Telegram без изменений" },
  "media": [
    { "file_unique_id": "AQAD...", "state": "ready", "sha256": "…", "size": 123456, "ext": ".jpg" }
  ]
}
```

`media[].state`: `ready` (файл уже отправлен), `pending` (ещё качается), `failed` (скачать не удалось).

Ответы:

| Код | Тело | Смысл для приёмника |
|---|---|---|
| 200 | `{"status":"applied"}` | Доставлено |
| 200 | `{"status":"duplicate"}` | Доставлено раньше |
| 200 | `{"status":"stale"}` | Событие старше сохранённой версии, не применено. Доставлено |
| 200 | `{"status":"ignored"}` | Тип события не обрабатывается. Доставлено |
| 401 / 403 | | Подпись или время не приняты. Очередь стоит, повтор раз в 5 минут, тревога |
| 422 | `{"error":"…"}` | Событие не разобрать. После 5 попыток — dead-letter |
| 429 / 5xx / таймаут | | Временный отказ. Повтор с ростом паузы, очередь стоит |

### 2.2. Фото

`PUT /telegram/ingest/media/<file_unique_id>`, тело — байты файла, ≤ 10 МБ.
Заголовки: `Content-Type: image/jpeg` (или фактический), `X-Relay-Content-Sha256`, `X-Relay-File-Ext`.

Сервер пишет во временный файл, сверяет SHA-256, переименовывает в `telegram_<file_unique_id><ext>` в `UPLOADS_DIR`,
затем обновляет все посты с этим `telegram_file_unique_id`: `media_url`, `media_status='downloaded'`.
Ответы: 200 `{"status":"stored"}` или `{"status":"exists"}`; 422 при несовпадении суммы; остальное — как в 2.1.

### 2.3. Сигнал «жив»

`POST /telegram/ingest/heartbeat`, раз в 60 с.

```json
{
  "bot_id": 1234567890,
  "sent_at": "2026-11-15T10:00:00.000Z",
  "queue_depth": 0,
  "oldest_undelivered_age_sec": 0,
  "last_poll_ok_at": "2026-11-15T09:59:58.000Z",
  "last_update_at": "2026-11-15T09:40:00.000Z",
  "media_pending": 0,
  "dead_letters": 0,
  "relay_version": "0.1.0"
}
```

Ответ 200 `{"status":"ok"}`. Сигнал не блокирует очередь событий.

## 3. Правила обработки на основном backend

1. Одна транзакция: вставка в `telegram_events` (ключ `bot_id, update_id`; конфликт → `duplicate`) → upsert канала → upsert поста.
2. Версия поста: `version_ts` = `edit_date` у `edited_channel_post`, `date` у `channel_post`; `source_update_id` = `update_id`.
3. Upsert поста применяется, если `(version_ts, source_update_id)` входящего ≥ сохранённого; иначе `stale`.
4. Если `file_unique_id` фото не изменился — поля фото не трогаются. Если файл уже лежит на диске — `media_status='downloaded'`, иначе `pending`.
5. `edited_at` выставляется только правкой и не обнуляется поздним `channel_post`.
6. Основной backend не обращается к Telegram API.

## 4. Подпись

Заголовки запроса:

| Заголовок | Значение |
|---|---|
| `X-Relay-Key-Id` | идентификатор ключа, например `k1` |
| `X-Relay-Timestamp` | Unix-время в секундах |
| `X-Relay-Signature` | hex от `HMAC-SHA256(secret, timestamp + "." + METHOD + "." + path + "." + sha256_hex(body))` |

Проверка: ключ известен; `|now − timestamp| ≤ 300` с; подпись сверяется сравнением с постоянным временем.
Основной backend держит до двух ключей: `RELAY_INGEST_KEYS=k1:<секрет>,k2:<секрет>`. Приёмник — один: `RELAY_INGEST_KEY_ID`, `RELAY_INGEST_SECRET`.
Секрет — не короче 32 случайных байт (`openssl rand -hex 32`).

## 5. Изменения схемы (одна миграция, только добавление)

- `posts`: `telegram_file_unique_id text`, `version_ts timestamptz`, `source_update_id bigint`.
- Новая таблица `telegram_events (bot_id bigint, update_id bigint, received_at timestamptz, applied_at timestamptz, status text, payload jsonb, primary key (bot_id, update_id))`.
- Новая таблица `relay_heartbeats` (последний сигнал на бота) — или одна строка в существующей служебной таблице, на усмотрение аудита.
- Ничего не удаляется и не переименовывается: откат кода не требует отката миграции.

## 6. Хранилище приёмника (SQLite)

- `updates(update_id PK, bot_id, received_at, kind, chat_id, message_id, raw_json, state, attempts, next_attempt_at, last_error, delivered_at)`;
  `state`: `new | ready | delivered | dead`.
- `media(file_unique_id PK, file_id, local_path, sha256, size, ext, state, attempts, next_attempt_at, last_error, uploaded_at)`;
  `state`: `pending | downloaded | uploaded | failed`.
- `meta(key PK, value)`: `poll_offset`.
- Режим: `journal_mode=WAL`, `synchronous=FULL`.

## 7. Что должен решить аудит

1. Имена полей и точные типы столбцов по фактической схеме.
2. Хватает ли `client_max_body_size 10m` и `express.json({limit:'2mb'})` для события и фото.
3. Где хранить последний сигнал «жив».
4. Нужно ли добавить `my_chat_member` в `allowed_updates`.
5. Как старые посты (без `version_ts`) ведут себя при первом входящем событии: считать их версию равной `coalesce(edited_at, published_at)`.
6. Добавить в раздел 4 эталонный пример подписи (секрет-заглушка, тело, время → ожидаемая подпись): по нему сверяются обе стороны.
