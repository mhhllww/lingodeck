-- Decks: add color and tags
ALTER TABLE decks ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT '#6366f1';
ALTER TABLE decks ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Cards: rename example -> examples (text array), drop difficulty, add new columns
ALTER TABLE cards ADD COLUMN IF NOT EXISTS examples TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing example data into the array column
UPDATE cards SET examples = ARRAY[example] WHERE example != '';

ALTER TABLE cards DROP COLUMN IF EXISTS example;
ALTER TABLE cards DROP COLUMN IF EXISTS difficulty;

ALTER TABLE cards ADD COLUMN IF NOT EXISTS transcription VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS part_of_speech TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS definitions TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS synonyms TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS antonyms TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS times_correct INT NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS times_incorrect INT NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_studied_at TIMESTAMP NULL;
