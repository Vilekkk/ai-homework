# Мои задачи — ДЗ 5

Приложение управления задачами: React 18, TypeScript, Vite 5, Tailwind CSS 3.
Backend — Supabase PostgreSQL, REST API и Auth. Интерфейс первоначально создан
в Bolt, интеграция выполнялась с GigaCode

## Запуск

1. Установить Node.js и выполнить `npm ci` в папке проекта.
2. Создать проект Supabase; один раз выполнить миграцию
   `supabase/migrations/20261015000100_create_tasks.sql` через SQL Editor.
   Для уже настроенной базы повторно выполнять миграцию не нужно.
3. В Authentication → URL Configuration указать Site URL `http://localhost:5173`
   и добавить redirect URL `http://localhost:5173/**`.
4. Скопировать `.env.example` в `.env.local`. Ввести URL своего проекта
   и публичный publishable key. Секретный ключ и пароль БД в браузер не передавать.
5. Выполнить `npm run dev`, открыть адрес Vite, зарегистрироваться,
   подтвердить email и войти.

Для практической проверки использован проект Supabase `homework-5-tasks`.
Frontend запускался локально на Windows; публичный frontend-деплой не выполнялся.

## Команды Windows PowerShell

Если запуск npm блокируется политикой PowerShell, использовать `npm.cmd`.
При неверном ComSpec в текущем терминале:

```powershell
$env:ComSpec = "$env:SystemRoot\System32\cmd.exe"
npm.cmd ci
node .\node_modules\typescript\bin\tsc --noEmit -p tsconfig.app.json
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vite\bin\vite.js
```

## Возможности

Регистрация, вход, выход и восстановление сессии. Создание задач, загрузка
из БД, изменение completed, удаление с подтверждением. Совместные фильтры
статуса и приоритета; счётчики; адаптивная таблица и карточки.
Задачи не сохраняются в локальном демонстрационном хранилище.
Supabase SDK сохраняет только сессию пользователя в localStorage.

## База данных

| Поле public.tasks | Тип и ограничение |
|---|---|
| id | UUID, PK, gen_random_uuid() |
| owner_id | UUID NOT NULL, FK → auth.users(id), ON DELETE CASCADE |
| title | varchar(200) NOT NULL, непустое после trim |
| description | text NOT NULL DEFAULT '', до 2000 символов |
| completed | boolean NOT NULL DEFAULT false |
| priority | text NOT NULL DEFAULT 'medium', low/medium/high |
| created_at | timestamptz NOT NULL DEFAULT now() |

Четыре RLS-политики ограничивают SELECT, INSERT, UPDATE и DELETE условием
`auth.uid() = owner_id`. Роли anon доступ к таблице не предоставлен.

## Материалы

- [Backend-документация](backend_documentation.md): архитектура, развёртывание, API, процесс AI-разработки.
- [Проверки и оставшиеся действия](verification.md).
- `docs/database_design.md` — исходное проектирование с GigaCode.
- `src/lib/supabase/` — типизированный клиент, авторизация, преобразование данных, CRUD.
- `src/hooks/useTasks.ts` — загрузка и изменения задач в текущей сессии.
- `src/__tests__/` — автоматические проверки с подменой сетевого API.
- `screenshots/hw5/` — фактическая практика ДЗ 5.
- `docs/homework_4_history/`, остальные старые screenshots и requirements — материалы предыдущих заданий; не результаты тестов ДЗ 5.

## GitHub


