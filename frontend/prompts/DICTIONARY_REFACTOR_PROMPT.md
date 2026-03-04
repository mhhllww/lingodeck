# DICTIONARY REFACTOR — FRONTEND AGENT PROMPT

## Контекст проекта

Next.js 14+, TypeScript, React Query, shadcn/ui, Tailwind.
Задача: убрать зависимость от FreeDictionaryAPI, переключить на бековский /api/dictionary/search?q=
Антонимы — убрать из UI и логики полностью.

---

## Текущая архитектура (что есть сейчас)

- src/lib/api/dictionary.ts — функция запроса к https://api.dictionaryapi.dev/api/v2/entries/en/{word}
- useDictionary — React Query хук, вызывает функцию выше
- SearchResults.tsx — использует хук, передаёт данные дальше
- buildCardData() — пакует данные из FreeDictionary в структуру карточки
- SaveCardButton — получает cardData, сохраняет карточку
- WordDetails — отображает transcription, partOfSpeech, definitions, examples, synonyms, antonyms

---

## Новый бековский ответ

Эндпоинт: GET /api/dictionary/search?q={word}

Тип ответа:
interface WordResponse {
id: number
word: string
transcription: string
part_of_speech: string
definitions: string[]
examples: string[]
synonyms: string[]
created_at: string
}

Если слово русское — сначала вызвать POST /api/translate чтобы получить английский вариант,
затем уже дёргать /api/dictionary/search.

---

## Что нужно сделать

1. Обновить src/lib/api/dictionary.ts
- Убрать запрос к api.dictionaryapi.dev
- Заменить на запрос к /api/dictionary/search?q={word}
- Обновить тип ответа на WordResponse выше

2. Обновить useDictionary
- Логика остаётся та же — React Query, кэширование
- Просто меняется источник данных
- Убрать всё что связано с маппингом FreeDictionary структуры (meanings, phonetics и тп)

3. Обновить buildCardData()
   Новый маппинг:
   {
   transcription: word.transcription,
   partOfSpeech: word.part_of_speech,
   definitions: word.definitions,
   examples: word.examples,
   synonyms: word.synonyms,
   // antonyms — убрать полностью
   }

4. Обновить WordDetails
- Убрать секцию antonyms из UI полностью
- Остальное отображать из новой структуры
- Поле part_of_speech (snake_case) — маппить в partOfSpeech при отображении

5. Убрать antonyms везде
- Убрать из типов/интерфейсов
- Убрать из buildCardData()
- Убрать из WordDetails
- Убрать из SaveCardButton если есть
- Убрать из suggestedTags если используется

---

## Чего НЕ делать

- Не трогать логику перевода через /api/translate — она остаётся как есть
- Не менять SaveCardButton логику сохранения — только убрать antonyms из данных
- Не трогать UI компоненты кроме удаления antonyms секции
- Не добавлять fallback на FreeDictionaryAPI — полностью убираем

---

## Критерии готовности

- [ ] api.dictionaryapi.dev не вызывается нигде в коде
- [ ] /api/dictionary/search?q= возвращает данные и они отображаются в UI
- [ ] Русское слово → перевод → поиск по английскому — работает
- [ ] Antonyms убраны из UI, типов и логики
- [ ] buildCardData() использует новую структуру
- [ ] TypeScript ошибок нет