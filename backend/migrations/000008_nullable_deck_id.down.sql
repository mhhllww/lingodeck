-- Restore CASCADE and NOT NULL
UPDATE cards SET deck_id = (SELECT id FROM decks LIMIT 1) WHERE deck_id IS NULL;
ALTER TABLE cards ALTER COLUMN deck_id SET NOT NULL;
ALTER TABLE cards DROP CONSTRAINT cards_deck_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE;
