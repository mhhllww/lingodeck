CREATE TABLE word_of_the_day (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id    INTEGER NOT NULL REFERENCES words(id),
  date       DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
