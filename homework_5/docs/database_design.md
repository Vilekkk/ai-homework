# Проектирование базы данных — «Мои задачи»

Версия 1.0 от 2026-10-15.

## 1. Обзор

База данных хранит задачи авторизованных пользователей.
Каждый пользователь видит и изменяет только свои задачи.
Анонимный (неавторизованный) доступ к задачам запрещён.

**Платформа:** Supabase с PostgreSQL.  
**Аутентификация:** Supabase Auth (email + пароль).  
**Управление пользователями:** встроенная таблица `auth.users`.

## 2. Сущности

### auth.users (Supabase, управляется автоматически)

Таблица Supabase, содержащая данные авторизации.
Не создаётся и не модифицируется миграциями.

| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid` | Уникальный идентификатор пользователя |
| `email` | `text` | Электронная почта |
| `password_encrypted` | `text` | Хеш пароля (Supabase) |
| `created_at` | `timestamptz` | Время регистрации |

Наша таблица ссылается на `auth.users.id` через `owner_id`.

### tasks

Основная таблица приложения.

| Поле | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` | Уникальный идентификатор задачи |
| `owner_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Владелец задачи |
| `title` | `varchar(200)` | NOT NULL, CHECK > 0 и ≤ 200 после trim | Название задачи |
| `description` | `text` | NOT NULL, DEFAULT `''`, CHECK ≤ 2000 | Описание задачи |
| `completed` | `boolean` | NOT NULL, DEFAULT `false` | Статус выполнения |
| `priority` | `text` | NOT NULL, DEFAULT `medium`, CHECK IN ('low', 'medium', 'high') | Приоритет |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Время создания |

### Связи

```
auth.users (1) ──────< (many) public.tasks
   id  FK → owner_id
```

- При удалении пользователя все его задачи удаляются (`ON DELETE CASCADE`).
- Связь реализована через внешний ключ на `auth.users.id`.

## 3. Ограничения

### Целостность данных

| Ограничение | SQL | Обоснование |
|---|---|---|
| Название непустое | `CHECK (length(trim(title)) > 0)` | Соответствует ТЗ: после trim 1–200 символов |
| Длина названия | `CHECK (length(trim(title)) <= 200)` | Соответствует ТЗ: до 200 символов |
| Длина описания | `CHECK (length(description) <= 2000)` | Соответствует ТЗ: до 2000 символов |
| Приоритет | `CHECK (priority IN ('low', 'medium', 'high'))` | Три допустимых значения из ТЗ |
| Статус | `completed BOOLEAN DEFAULT false` | Прямое соответствие `Task.completed` |

### Индексы

| Индекс | Колонка | Назначение |
|---|---|---|
| `idx_tasks_owner_id` | `owner_id` | Быстрый поиск задач пользователя, поддержка RLS-проверок |

### Row Level Security (RLS)

RLS включён через `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

| Политика | Направление | Пользователь | Условия |
|---|---|---|---|
| `Users can view own tasks` | SELECT | authenticated | `auth.uid() = owner_id` |
| `Users can insert own tasks` | INSERT | authenticated | `auth.uid() = owner_id` (WITH CHECK) |
| `Users can update own tasks` | UPDATE | authenticated | `auth.uid() = owner_id` (USING + WITH CHECK) |
| `Users can delete own tasks` | DELETE | authenticated | `auth.uid() = owner_id` |

- `TO authenticated` — только авторизованные пользователи.
- Анонимный доступ запрещён.
- `USING` — условие чтения для UPDATE/DELETE.
- `WITH CHECK` — условие валидации для INSERT/UPDATE.

### Управление правами доступа (GRANT/REVOKE)

После создания RLS-политик выполняется явное ограничение прав:

```sql
REVOKE ALL ON TABLE public.tasks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.tasks TO authenticated;
```

- `REVOKE ALL` — снимает все привилегии с `PUBLIC`, `anon` и `authenticated`.
- `GRANT` — предоставляет только DML-права (SELECT, INSERT, UPDATE, DELETE) роли `authenticated`.
- DDL-права (ALTER, DROP, TRUNCATE) не предоставляются.
- Анонимный доступ (`anon`) полностью лишён прав.
- Даже авторизованные пользователи (`authenticated`) получают только DML-права, а RLS-политики дополнительно фильтруют строки по `owner_id`.

## 4. Обоснование выбора Supabase

| Критерий | Обоснование |
|---|---|
| **PostgreSQL** | Зрелая СУБД с полной поддержкой JSON, UUID, триггеров и RLS |
| **Supabase Auth** | Готовая регистрация/вход по email+паролю, JWT-токены, `auth.uid()` в SQL |
| **RLS** | Декларативная политика на уровне БД — надёжнее, чем проверка на frontend |
| **gen_random_uuid()** | Нативная генерация UUID v4 — соответствует `crypto.randomUUID()` frontend |
| **timestamptz** | Хранит время с часовыми поясами — корректно для глобального приложения |
| **ON DELETE CASCADE** | Автоматическая очистка задач при удалении пользователя |
| **@supabase/supabase-js** | SDK уже установлен в `package.json` |

## 5. Преобразование типов между БД и frontend

### Текущие типы frontend (`src/types.ts`)

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: number; // Unix timestamp in milliseconds
}
```

### Соответствие полей

| Поле БД | Тип БД | Поле Frontend | Тип TS | Преобразование |
|---|---|---|---|---|
| `id` | `uuid` | `id` | `string` | `row.id::text` → `string` |
| `owner_id` | `uuid` | _(нет)_ | _(нет)_ | Не передаётся на frontend |
| `title` | `varchar(200)` | `title` | `string` | Прямое соответствие |
| `description` | `text` | `description` | `string` | Прямое соответствие |
| `completed` | `boolean` | `completed` | `boolean` | Прямое соответствие |
| `priority` | `text` | `priority` | `Priority` | Прямое соответствие |
| `created_at` | `timestamptz` | `createdAt` | `number` | ISO-строка → `Date.parse()` → `* 1000` |

### Преобразование `created_at`

```typescript
// БД → Frontend
const createdAt = Math.floor(new Date(row.created_at).getTime());

// Frontend → БД (в будущем)
// created_at генерируется БД автоматически, frontend не передаёт
```

### Преобразование `completed`

Прямое соответствие — `completed: boolean` в БД и в TypeScript одинаковы.
Нет необходимости в преобразовании `status ↔ boolean`.

## 6. Миграции

Файл миграции: `supabase/migrations/20261015000100_create_tasks.sql`

Содержит:
1. Создание таблицы `public.tasks` с ограничениями.
2. Включение RLS.
3. Создание индекса по `owner_id`.
4. Четыре политики RLS (SELECT, INSERT, UPDATE, DELETE).
5. Обёртку в транзакцию `BEGIN ... COMMIT`.

## 7. Вопросы и ограничения

1. **Демо-данные.** Старые localStorage-данные автоматически не импортируются.
   Каждый пользователь создаёт задачи с нуля.
2. **Генерация id.** `id` генерируется БД (`gen_random_uuid()`),
   frontend не передаёт `id` при создании задачи.
3. **Генерация created_at.** `created_at` генерируется БД (`DEFAULT now()`),
   frontend не передаёт время создания.
4. **Удаление задач.** `ON DELETE CASCADE` на `owner_id` удаляет все задачи
   пользователя при удалении аккаунта.
5. **Конкурентное редактирование.** В MVP не обрабатывается.
   При одновременном изменении задачи последним победит обновление,
   которое первым дойдёт до БД.
6. **Поиск и сортировка.** В MVP не требуются.
   При необходимости добавить — GIN-индекс на `title` и `description`,
   сортировка на уровне запроса.
