# DnDex

Платформа для поиска и организации TTRPG-кампаний. Каталог кампаний, заявки игроков, отзывы на мастеров — всё в одном месте.

## Возможности

- Каталог кампаний с фильтрами по системе, типу и рейтингу
- Заявки на вступление с модерацией от DM
- Отзывы и рейтинги кампаний
- Дашборд DM: управление заявками и своими кампаниями
- Дашборд игрока: список принятых и ожидающих игр
- Realtime-обновления через Supabase
- Демо-режим с моковыми данными (без Supabase)
- Тёмная фэнтези-тема с Tailwind CSS v4
- Markdown-описания кампаний (GFM)
- Валидация форм через Zod + React Hook Form

## Стек

| Слой | Технология |
|------|-----------|
| Фреймворк | React 19 + TypeScript |
| Сборка | Vite 8 |
| Стили | Tailwind CSS v4 |
| Маршрутизация | React Router v7 |
| Сервер состояния | TanStack React Query v5 |
| БД / Аутентификация | Supabase |
| Формы | React Hook Form + Zod |
| Иконки | Lucide React |
| i18n | i18next + react-i18next |

## Быстрый старт

### Требования

- Node.js 20+
- npm

### Установка

```bash
npm install
```

### Supabase (опционально)

Скопируй переменные окружения:

```bash
cp .env.example .env
```

Заполни `.env` данными из Supabase-проекта:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Выполни SQL-схему в Supabase SQL Editor: `src/sql/schema.sql`

Включи Realtime в Dashboard → Database → Replication для таблиц: `participants`, `campaigns`, `reviews`

> Без Supabase приложение запускается в демо-режиме с моковыми данными.

### Запуск

```bash
npm run dev
```

### Сборка

```bash
npm run build
```

### Линтинг

```bash
npm run lint
```

## Архитектура

```
src/
├── components/
│   ├── auth/          # AuthModal — вход/регистрация
│   ├── campaigns/     # CampaignCard, CampaignGrid, CampaignForm, CampaignHeader, CampaignPlayers, CampaignReviews
│   ├── layout/        # Layout, Header, Footer, AuthGuard
│   └── ui/            # Button, Input, Textarea, Select, Modal, Avatar, Badge, StarRating, Skeleton, EmptyState
├── hooks/
│   ├── useAuth.tsx    # Контекст аутентификации (Supabase + демо)
│   ├── useCampaigns.ts
│   ├── useParticipants.ts
│   └── useReviews.ts
├── lib/
│   ├── config.ts      # USE_MOCK, SYSTEMS, SYSTEM_COLORS
│   ├── queryKeys.ts   # Централизованные ключи React Query
│   ├── supabase.ts    # Клиент Supabase
│   └── mock-data.ts   # Моковые данные для демо-режима
├── pages/
│   ├── HomePage.tsx
│   ├── CampaignPage.tsx
│   ├── DashboardPage.tsx
│   └── CreateCampaignPage.tsx
├── sql/
│   └── schema.sql     # Полная схема БД с RLS
├── types/
│   └── database.ts    # Profile, Campaign, Participant, Review, CampaignFilters
├── App.tsx
├── main.tsx
└── index.css          # Tailwind v4 @theme, анимации, glass-card утилиты
```

### Ключевые паттерны

- **Двойной режим данных** — каждый хук поддерживает `USE_MOCK` (операции с массивами) и Supabase (запросы к БД)
- **Централизованные query-ключи** — `lib/queryKeys.ts` устраняет дублирование строковых ключей
- **Инвалидация при мутациях** — все мутации сбрасывают связанные кэши React Query
- **RLS на уровне БД** — PostgreSQL Row Level Security для каждой таблицы
- **Realtime** — подписка на изменения `participants` для мгновенных уведомлений

## Поддерживаемые системы

D&D 5e, D&D 5.5e (2024), Pathfinder 2e, Call of Cthulhu, Shadowrun 6e, Vampire: The Masquerade, FATE Core, Savage Worlds, Other

## Лицензия

Private
