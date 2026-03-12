# FEATURE: Auto Tag Generation via Groq on Dictionary Search

## Overview

When a user searches for a word in the Explore (Dictionary) page, automatically generate 2–4 semantic tags via Groq as part of the existing `DictionaryService.Search()` call. Tags are selected from a fixed whitelist to ensure consistency. Tags are stored alongside the dictionary cache entry in PostgreSQL and attached to any card created from this word.

---

## Whitelist of Allowed Tags

Groq must only pick from this exact list. Pass the full list in the prompt.

### Thematic (pick up to 3)
```
travel, business, food, technology, nature, health, emotions, sport, education,
law, finance, politics, art, music, science, fashion, family, society, religion,
home, animals, weather, time, body, culture
```

### Register (pick up to 1)
```
formal, informal, slang, academic, literary
```

Total tag pool: **30 thematic + 5 register = 35 tags**

---

## Groq Prompt

Add tag generation to the existing dictionary prompt. Append the following instruction to your current system or user prompt:

```
Additionally, select 2 to 4 tags for this word from the following list only.
Do not invent new tags. Do not modify tag spelling.

Thematic tags (choose up to 3):
travel, business, food, technology, nature, health, emotions, sport, education,
law, finance, politics, art, music, science, fashion, family, society, religion,
home, animals, weather, time, body, culture

Register tags (choose at most 1):
formal, informal, slang, academic, literary

Return tags as a JSON array of strings under the key "tags".
Example: "tags": ["business", "formal"]
```

### Full expected JSON response shape from Groq

```json
{
  "word": "entrepreneur",
  "translation": "предприниматель",
  "definition": "A person who sets up a business...",
  "examples": ["She became a successful entrepreneur at 25."],
  "tags": ["business", "formal"]
}
```

---

## Backend Changes (Go)

### 1. `DictionaryEntry` struct — add Tags field

**File:** `internal/dictionary/models.go` (or wherever DictionaryEntry is defined)

```go
type DictionaryEntry struct {
    Word        string   `json:"word"`
    Translation string   `json:"translation"`
    Definition  string   `json:"definition"`
    Examples    []string `json:"examples"`
    Tags        []string `json:"tags"` // NEW
}
```

### 2. PostgreSQL — add tags column to dictionary cache table

```sql
ALTER TABLE dictionary_cache
ADD COLUMN tags TEXT[] DEFAULT '{}';
```

Run this migration on the VPS:
```bash
psql -U <user> -d <dbname> -c "ALTER TABLE dictionary_cache ADD COLUMN tags TEXT[] DEFAULT '{}';"
```

### 3. `DictionaryService.Search()` — store and return tags

**File:** `internal/dictionary/service.go`

When parsing the Groq response, extract `tags` from JSON and:
- Store in `dictionary_cache.tags` on cache write
- Return as part of `DictionaryEntry` on cache hit

Cache write (add to existing INSERT):
```go
// existing INSERT — add tags column
`INSERT INTO dictionary_cache (word, language, data, tags, created_at)
 VALUES ($1, $2, $3, $4, NOW())
 ON CONFLICT (word, language) DO UPDATE SET data = $3, tags = $4, created_at = NOW()`
// args: word, language, jsonData, pq.Array(entry.Tags)
```

Cache read (add to existing SELECT):
```go
// existing SELECT — add tags column
`SELECT data, tags FROM dictionary_cache WHERE word = $1 AND language = $2`
// scan tags with pq.Array(&entry.Tags)
```

### 4. Tags normalization safety net

After parsing Groq response, filter tags against the whitelist on the Go side — Groq occasionally hallucinates despite instructions:

```go
var allowedTags = map[string]bool{
    "travel": true, "business": true, "food": true, "technology": true,
    "nature": true, "health": true, "emotions": true, "sport": true,
    "education": true, "law": true, "finance": true, "politics": true,
    "art": true, "music": true, "science": true, "fashion": true,
    "family": true, "society": true, "religion": true, "home": true,
    "animals": true, "weather": true, "time": true, "body": true,
    "culture": true, "formal": true, "informal": true, "slang": true,
    "academic": true, "literary": true,
}

func normalizeTags(raw []string) []string {
    seen := map[string]bool{}
    result := []string{}
    for _, t := range raw {
        t = strings.ToLower(strings.TrimSpace(t))
        if allowedTags[t] && !seen[t] {
            seen[t] = true
            result = append(result, t)
        }
    }
    if len(result) > 4 {
        result = result[:4]
    }
    return result
}
```

Call `normalizeTags(entry.Tags)` after parsing Groq JSON, before writing to cache.

---

## Card Creation — attach tags

When a user saves a word to a deck (creates a card), carry over the tags from `DictionaryEntry` to the card.

**File:** wherever `CreateCard` handler/service lives

```go
// On card creation from dictionary entry
card.Tags = dictionaryEntry.Tags
```

PostgreSQL — cards table should already have a tags column if tags feature exists. If not:
```sql
ALTER TABLE cards ADD COLUMN tags TEXT[] DEFAULT '{}';
```

---

## API Response

The `/api/dictionary/search` endpoint response should include `tags`:

```json
{
  "word": "entrepreneur",
  "translation": "предприниматель",
  "definition": "...",
  "examples": ["..."],
  "tags": ["business", "formal"]
}
```

---

## Frontend Changes (Next.js)

### 1. Show tags on Dictionary result card

**Location:** Explore page, word result component

Display tags as small badge pills below the word definition, before the "Add to deck" button.

```tsx
// Example rendering
{entry.tags?.map(tag => (
  <span key={tag} className="tag-pill">#{tag}</span>
))}
```

Style: small, muted, rounded — similar to shadcn/ui `Badge` with `variant="secondary"`.

### 2. Tags carried into AddToCard flow

When user taps "Add to deck", pre-populate the card's tags from `entry.tags`. User can remove them before saving if desired.

---

## What NOT to build yet

- Tag filtering UI in Explore (phase 2)
- Cross-deck tag search (phase 2)
- Tag-based Word of the Day personalization (phase 3)
- User-defined custom tags (phase 3)

---

## Testing Checklist

- [ ] Search a word → Groq returns `tags` array
- [ ] Tags are normalized (whitelist filter applied)
- [ ] Tags stored in `dictionary_cache.tags`
- [ ] Cache hit returns tags correctly
- [ ] Tags appear in API response
- [ ] Tags displayed in frontend word card
- [ ] Tags carried over to card on save
- [ ] Edge case: Groq returns no tags → empty array, no crash
- [ ] Edge case: Groq returns invalid tag → filtered out silently
