# Feature: Word of the Day + Daily Mix

## Контекст проекта

LingoDeck — flashcard-приложение для изучения иностранных слов.

**Backend:** Go 1.23, PostgreSQL, net/http stdlib, pgx/v5, golang-migrate  
**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query v5, Framer Motion  

Существующие таблицы: `users`, `decks`, `cards`, `words`.  
У карточек есть поля: `times_correct`, `times_incorrect`, `updated_at`.  
У слов есть: `transcription`, `part_of_speech`, `definitions`, `examples`, `synonyms`.

---

## Backend

### Миграция

Добавь новую миграцию. Создай таблицу `word_of_the_day`:

```sql
CREATE TABLE word_of_the_day (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id    UUID NOT NULL REFERENCES words(id),
  date       DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Word of the Day

#### Логика выборки
- Каждый день в полночь UTC запускается cron (горутина с тикером) — выбирается новое слово и записывается в `word_of_the_day`
- Слово глобальное (одно на всех пользователей на день)
- Алгоритм выборки: случайное слово из таблицы `words`, которого ещё нет ни в одной карточке (`cards`) ни одного пользователя
- Fallback: если таких слов нет — любое случайное слово из `words`
- Ответ персонализирован: в `suggested_deck` возвращается дека конкретного авторизованного юзера, в которую слово лучше всего подходит (по совпадению тегов; если тегов нет — первая дека юзера)

#### Эндпоинты

```
GET /api/daily/word-of-the-day
Authorization: required

Response:
{
  "word": "ephemeral",
  "transcription": "/ɪˈfem.ər.əl/",
  "part_of_speech": "adjective",
  "definition": "Lasting for a very short time.",
  "suggested_deck": {
    "id": "uuid",
    "name": "Advanced English"
  }
}
```

```
POST /api/daily/word-of-the-day/add
Authorization: required

Body: { "deck_id": "uuid" }

→ Создаёт карточку в указанной деке из слова дня
```

---

### Daily Mix

#### Логика выборки (итого до 10 карточек, приоритеты по порядку)

| Приоритет | Источник | Условие | Лимит |
|-----------|----------|---------|-------|
| 1 | Сложные | `times_incorrect > 0` ORDER BY `times_incorrect DESC` | 4 |
| 2 | Давно не повторявшиеся | изучались хотя бы раз, ORDER BY `updated_at ASC` | 3 |
| 3 | Новые | `times_correct = 0 AND times_incorrect = 0` | 2 |
| 4 | Слово дня | если слово дня есть в карточках юзера — добавить | 1 |

Карточки не дублируются между группами. Если карточек не хватает в одной группе — добирать из следующей.

Прогресс считается по количеству карточек из сегодняшнего микса, у которых `updated_at` >= начало текущего дня UTC.

#### Эндпоинт

```
GET /api/daily/mix
Authorization: required

Response:
{
  "cards": [ ...array of card objects... ],
  "progress": {
    "done": 3,
    "total": 10
  }
}
```

---

### Структура файлов (backend)

Следуй существующей слоистой архитектуре проекта:

- `internal/repository/postgres/daily_repo.go` — SQL-запросы для word of the day и daily mix
- `internal/service/daily.go` — бизнес-логика, cron горутина
- `internal/handler/daily.go` — HTTP-хендлеры + DTO
- Зарегистрируй роуты в `internal/server/server.go`
- Добавь новую миграцию в `migrations/`

---

## Frontend

### Расположение виджетов

Оба виджета размещаются в **сайдбаре** (`components/layout/Sidebar`) — между навигационными пунктами и футером. Виджеты компактные, не раздувают сайдбар. Стилистически разные друг от друга.

### Word of the Day виджет

- Показывает: слово, транскрипцию, часть речи, краткое определение (первое из массива)
- Подпись: `"Add to «{suggested_deck.name}»"` — кнопка вызывает `POST /api/daily/word-of-the-day/add` с `deck_id` из `suggested_deck`
- После добавления кнопка меняется на `"Added ✓"` и становится неактивной
- Данные fetching через TanStack Query, ключ `['word-of-the-day']`

### Daily Mix виджет

- Показывает: первые 3 слова из микса в виде чипов, остальные как `+N more`
- Прогресс-бар: `done / total`
- Кнопка: `"Start"` если `done === 0`, `"Continue →"` если `done > 0`, `"Done ✓"` если `done === total`
- Клик по кнопке запускает существующий study session флоу, передавая карточки из микса
- Данные fetching через TanStack Query, ключ `['daily-mix']`

### Структура файлов (frontend)

- `components/layout/SidebarWidgets.tsx` — оба виджета
- `hooks/useDailyMix.ts` — хук для `/api/daily/mix`
- `hooks/useWordOfTheDay.ts` — хук для `/api/daily/word-of-the-day`
- `lib/api/daily.ts` — API-функции

Добавь проксирование в Next.js API routes по аналогии с остальными эндпоинтами проекта.
