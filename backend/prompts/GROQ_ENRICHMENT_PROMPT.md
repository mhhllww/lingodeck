# GROQ DICTIONARY ENRICHMENT — BACKEND AGENT PROMPT

## Контекст проекта

Бекенд на Go (net/http, Go 1.22, pgx/v5, golang-migrate).  
Задача: добавить Groq API как источник обогащения словарных данных.  
Язык слов — только английский (EN → RU архитектура).

---

## Задача

Реализовать `GroqService` который вызывается в `DictionaryService.Search()`  
когда слово **не найдено в БД** — получает данные, сохраняет и возвращает.

---

## Что нужно сделать

### 1. Миграция БД

Добавить поле `synonyms` в таблицу `words`:

\```sql
ALTER TABLE words ADD COLUMN synonyms TEXT[] DEFAULT '{}';
\```

Создать файл миграции через golang-migrate.

---

### 2. Обновить domain.Word

\```go
type Word struct {
    ID            int
    Word          string
    Transcription string
    PartOfSpeech  string
    Definitions   []string
    Examples      []string
    Synonyms      []string  // новое поле
    CreatedAt     time.Time
}
\```

---

### 3. Реализовать GroqService

Файл: `internal/service/groq_service.go`

**Промпт для Groq:**

\```
You are a dictionary API. For the given English word, return a JSON object with exactly this structure:
{
"transcription": "IPA transcription",
"part_of_speech": "noun|verb|adjective|adverb|etc",
"definitions": ["definition 1", "definition 2"],
"examples": ["example sentence 1", "example sentence 2"],
"synonyms": ["synonym1", "synonym2", "synonym3"]
}

Rules:
- transcription must be in IPA format with slashes, e.g. /ɪˈfem.ər.əl/
- definitions: 1-3 short English definitions
- examples: 2-3 natural example sentences using the word
- synonyms: 3-5 English synonyms
- Return ONLY valid JSON, no markdown, no explanation, no backticks

Word: {WORD}
\```

**Структуры:**

\```go
type groqRequest struct {
    Model    string        `json:"model"`
    Messages []groqMessage `json:"messages"`
}
type groqMessage struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}
type groqResponse struct {
    Choices []struct {
        Message struct {
            Content string `json:"content"`
        } `json:"message"`
    } `json:"choices"`
}
\```

- URL: `https://api.groq.com/openai/v1/chat/completions`
- Model: `llama-3.3-70b-versatile`
- Header: `Authorization: Bearer {GROQ_API_KEY}`
- Таймаут: 10 секунд

\```go
type GroqService struct {
client *http.Client
apiKey string
}

func NewGroqService(apiKey string) *GroqService
func (s *GroqService) EnrichWord(ctx context.Context, word string) (*domain.Word, error)
\```

---

### 4. Обновить WordRepository

- Добавить `synonyms` во все SELECT запросы
- Добавить `synonyms` в INSERT при сохранении нового слова
- pgx/v5 маппит `[]string` → `TEXT[]` нативно

---

### 5. Обновить DictionaryService.Search()

\```
1. Ищем слово в БД
2. Если найдено → возвращаем
3. Если не найдено → вызываем GroqService.EnrichWord()
4. Сохраняем через WordRepository.Create()
5. Возвращаем результат
   \```

Оба вызова используют `context` с таймаутом.

---

### 6. Конфигурация

Добавить `GROQ_API_KEY` в `.env`, структуру конфига и `main.go`.

---

## Чего НЕ делать

- Не трогать `/api/translate` и `TranslationService` — DeepL остаётся
- Не добавлять retry — достаточно одной попытки с таймаутом
- Не кэшировать Groq ответы отдельно — БД и есть кэш
- Не менять API контракт — фронт ожидает тот же `domain.Word`

---

## Критерии готовности

- [ ] Миграция создана и применена
- [ ] `domain.Word` содержит `Synonyms []string`
- [ ] `GroqService.EnrichWord()` возвращает заполненный `domain.Word`
- [ ] При поиске нового слова — данные сохраняются в БД
- [ ] При повторном поиске — Groq не вызывается
- [ ] `GROQ_API_KEY` читается из env