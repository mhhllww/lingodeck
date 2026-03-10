-- Allow cards to exist without a deck
ALTER TABLE cards ALTER COLUMN deck_id DROP NOT NULL;

-- Replace CASCADE with SET NULL so cards survive deck deletion
ALTER TABLE cards DROP CONSTRAINT cards_deck_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_deck_id_fkey
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE SET NULL;
