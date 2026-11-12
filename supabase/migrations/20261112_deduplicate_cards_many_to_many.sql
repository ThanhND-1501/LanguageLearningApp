-- ==============================================================================
-- Migration: Deduplicate Vocabulary Cards & Establish Many-to-Many Deck Relations
-- Compatible with Supabase SQL Editor (No connection-pool temporary table issues)
-- ==============================================================================

-- 1. Create junction table deck_cards (Many-to-Many between decks and cards)
CREATE TABLE IF NOT EXISTS deck_cards (
    deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (deck_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON deck_cards (card_id);

-- Enable RLS and setup policies for deck_cards
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read deck_cards" ON deck_cards;
CREATE POLICY "Allow read deck_cards" ON deck_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated write deck_cards" ON deck_cards;
CREATE POLICY "Allow authenticated write deck_cards" ON deck_cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon write deck_cards" ON deck_cards;
CREATE POLICY "Allow anon write deck_cards" ON deck_cards FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Add deck_ids array column to cards table for ultra-fast single-table queries
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deck_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
CREATE INDEX IF NOT EXISTS idx_cards_deck_ids ON cards USING GIN (deck_ids);

-- 3. Modify cards.deck_id to allow NULL and ON DELETE SET NULL
-- (Prevents deleting a deck from wiping out master cards shared across other decks)
ALTER TABLE cards ALTER COLUMN deck_id DROP NOT NULL;
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_deck_id_fkey;
ALTER TABLE cards ADD CONSTRAINT cards_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE SET NULL;

-- 4. Temporarily drop trigger on cards to avoid corrupting total_cards during deduplication
DROP TRIGGER IF EXISTS trigger_update_deck_total_cards ON cards;

-- 5. Populate initial relationships into deck_cards from existing cards
INSERT INTO deck_cards (deck_id, card_id, created_at)
SELECT deck_id, id, created_at FROM cards
WHERE deck_id IS NOT NULL
ON CONFLICT (deck_id, card_id) DO NOTHING;

-- 6. Build Master Card mapping using a standard migration table (bypasses PgBouncer temp table limits)
DROP TABLE IF EXISTS _migration_card_id_mapping;
CREATE TABLE _migration_card_id_mapping AS
WITH ranked_cards AS (
    SELECT 
        id,
        term,
        LOWER(TRIM(term)) as norm_term,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(term)) 
            ORDER BY 
                CASE WHEN phonetic IS NOT NULL AND phonetic <> '' THEN 1 ELSE 2 END,
                CASE WHEN example_sentence IS NOT NULL AND example_sentence <> '' THEN 1 ELSE 2 END,
                repetition DESC,
                created_at ASC
        ) as rank
    FROM cards
),
masters AS (
    SELECT norm_term, id as master_id
    FROM ranked_cards
    WHERE rank = 1
)
SELECT 
    r.id as old_id,
    m.master_id
FROM ranked_cards r
JOIN masters m ON r.norm_term = m.norm_term;

CREATE INDEX IF NOT EXISTS idx_migr_old_id ON _migration_card_id_mapping (old_id);
CREATE INDEX IF NOT EXISTS idx_migr_master_id ON _migration_card_id_mapping (master_id);

-- 7. Re-point deck_cards to Master Card IDs
INSERT INTO deck_cards (deck_id, card_id)
SELECT DISTINCT 
    dc.deck_id,
    m.master_id
FROM deck_cards dc
JOIN _migration_card_id_mapping m ON dc.card_id = m.old_id
ON CONFLICT (deck_id, card_id) DO NOTHING;

-- Delete old duplicate card IDs from deck_cards
DELETE FROM deck_cards
WHERE card_id IN (
    SELECT old_id FROM _migration_card_id_mapping WHERE old_id <> master_id
);

-- 8. Re-point speaking_attempts to Master Card IDs
UPDATE speaking_attempts sa
SET card_id = m.master_id
FROM _migration_card_id_mapping m
WHERE sa.card_id = m.old_id AND m.old_id <> m.master_id;

-- 9. Add foreign key from deck_cards to cards(id) with CASCADE
ALTER TABLE deck_cards 
    DROP CONSTRAINT IF EXISTS deck_cards_card_id_fkey,
    ADD CONSTRAINT deck_cards_card_id_fkey 
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE;

-- 10. Delete duplicate redundant card rows from cards table
DELETE FROM cards
WHERE id IN (
    SELECT old_id FROM _migration_card_id_mapping WHERE old_id <> master_id
);

-- 11. Populate deck_ids array on Master cards with all linked decks
WITH card_decks_agg AS (
    SELECT card_id, array_agg(DISTINCT deck_id) as all_decks
    FROM deck_cards
    GROUP BY card_id
)
UPDATE cards c
SET deck_ids = cda.all_decks
FROM card_decks_agg cda
WHERE c.id = cda.card_id;

-- 12. Create trigger on deck_cards to automatically maintain decks.total_cards
CREATE OR REPLACE FUNCTION update_deck_total_cards_from_deck_cards()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE decks SET total_cards = total_cards + 1, updated_at = now() WHERE id = NEW.deck_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE decks SET total_cards = GREATEST(0, total_cards - 1), updated_at = now() WHERE id = OLD.deck_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deck_cards_total ON deck_cards;
CREATE TRIGGER trigger_update_deck_cards_total
AFTER INSERT OR DELETE ON deck_cards
FOR EACH ROW EXECUTE FUNCTION update_deck_total_cards_from_deck_cards();

-- 13. Recalculate decks.total_cards with accurate count of linked cards
WITH deck_card_counts AS (
    SELECT deck_id, COUNT(*) as card_count
    FROM deck_cards
    GROUP BY deck_id
)
UPDATE decks d
SET total_cards = COALESCE(dcc.card_count, 0)
FROM deck_card_counts dcc
WHERE d.id = dcc.deck_id;

-- 14. Update v_deck_statistics view to use deck_cards junction table
DROP VIEW IF EXISTS v_deck_statistics;
CREATE VIEW v_deck_statistics AS
SELECT 
    d.id AS deck_id,
    d.title,
    d.target_lang,
    COUNT(dc.card_id) AS total_cards,
    COUNT(CASE WHEN c.status = 'new' THEN 1 END) AS new_cards,
    COUNT(CASE WHEN c.status = 'learning' THEN 1 END) AS learning_cards,
    COUNT(CASE WHEN c.status = 'mastered' THEN 1 END) AS mastered_cards,
    COUNT(CASE WHEN c.next_review_at <= now() THEN 1 END) AS due_cards
FROM decks d
LEFT JOIN deck_cards dc ON d.id = dc.deck_id
LEFT JOIN cards c ON dc.card_id = c.id
GROUP BY d.id, d.title, d.target_lang;

-- 15. Enforce UNIQUE constraint on LOWER(TRIM(term)) to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_unique_lower_term ON cards (LOWER(TRIM(term)));

-- 16. Cleanup migration helper table
DROP TABLE IF EXISTS _migration_card_id_mapping;
