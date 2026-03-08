# Word of the Day — Groq On-Demand Logic

## Контекст

В проекте уже реализован `DictionaryService` с методом `Search(word string)`:
- Ищет слово в таблице `words` (PostgreSQL)
- Если не находит — запрашивает у Groq API полное определение и сохраняет в `words`
- Возвращает объект слова

Нужно переиспользовать этот флоу для генерации Word of the Day.

## Логика

Каждый день в полночь UTC cron вызывает `DailyService.PickWordOfTheDay()`:

1. Достать из `word_of_the_day` последние 30 слов (чтобы не повторяться)
2. Отправить запрос к Groq:
   ```
   "Give me one advanced English word suitable for vocabulary learning.
   Do not use any of these words: [список последних 30].
   Return only the word, nothing else."
   ```
3. Полученное слово прогнать через существующий `DictionaryService.Search(word)`
   — он сам обогатит слово определением и сохранит в `words` если его там нет
4. Записать `word_id` в таблицу `word_of_the_day` с текущей датой

## Валидация

- Если слово уже есть в `word_of_the_day` за последние 30 дней — повторить запрос к Groq (до 3 попыток)
- Если все попытки неудачны — залогировать ошибку, слово дня на сегодня не выбирается

## Что переиспользовать

- `groq_service.go` — HTTP-клиент к Groq уже есть, добавь отдельный метод `GenerateWordOfTheDay(exclude []string) (string, error)`
- `DictionaryService.Search()` — вызывать как есть, без изменений
