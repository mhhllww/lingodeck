-- Cards: restore example and difficulty, drop new columns
ALTER TABLE cards ADD COLUMN IF NOT EXISTS example TEXT NOT NULL DEFAULT '';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS difficulty INTEGER NOT NULL DEFAULT 1;

-- Migrate first element of examples back to example
UPDATE cards SET example = examples[1] WHERE array_length(examples, 1) > 0;

ALTER TABLE cards DROP COLUMN IF EXISTS examples;
ALTER TABLE cards DROP COLUMN IF EXISTS transcription;
ALTER TABLE cards DROP COLUMN IF EXISTS part_of_speech;
ALTER TABLE cards DROP COLUMN IF EXISTS definitions;
ALTER TABLE cards DROP COLUMN IF EXISTS synonyms;
ALTER TABLE cards DROP COLUMN IF EXISTS antonyms;
ALTER TABLE cards DROP COLUMN IF EXISTS tags;
ALTER TABLE cards DROP COLUMN IF EXISTS times_correct;
ALTER TABLE cards DROP COLUMN IF EXISTS times_incorrect;
ALTER TABLE cards DROP COLUMN IF EXISTS last_studied_at;

-- Decks: drop color and tags
ALTER TABLE decks DROP COLUMN IF EXISTS color;
ALTER TABLE decks DROP COLUMN IF EXISTS tags;
