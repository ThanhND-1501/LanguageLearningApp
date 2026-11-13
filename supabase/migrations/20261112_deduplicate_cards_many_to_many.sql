-- ==============================================================================
-- Migration: Deduplicate Vocabulary Cards & Establish Many-to-Many Deck Relations
-- 100% Self-Contained Statements (No intermediate/temporary tables)
-- Compatible with Supabase SQL Editor and PgBouncer connection pooling
-- ==============================================================================

-- 1. Create junction table deck_cards (Many-to-Many between decks and cards)
CREATE TABLE IF NOT EXISTS public.deck_cards (
    deck_id TEXT NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (deck_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON public.deck_cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON public.deck_cards (card_id);

-- Enable RLS and setup policies for deck_cards
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read deck_cards" ON public.deck_cards;
CREATE POLICY "Allow read deck_cards" ON public.deck_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated write deck_cards" ON public.deck_cards;
CREATE POLICY "Allow authenticated write deck_cards" ON public.deck_cards FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon write deck_cards" ON public.deck_cards;
CREATE POLICY "Allow anon write deck_cards" ON public.deck_cards FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Add deck_ids array column to cards table for ultra-fast single-table queries
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS deck_ids TEXT[] DEFAULT ARRAY[]::TEXT[];
CREATE INDEX IF NOT EXISTS idx_cards_deck_ids ON public.cards USING GIN (deck_ids);

-- 3. Modify cards.deck_id to allow NULL and ON DELETE SET NULL
-- (Prevents deleting a deck from wiping out master cards shared across other decks)
ALTER TABLE public.cards ALTER COLUMN deck_id DROP NOT NULL;
ALTER TABLE public.cards DROP CONSTRAINT IF EXISTS cards_deck_id_fkey;
ALTER TABLE public.cards ADD CONSTRAINT cards_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id) ON DELETE SET NULL;

-- 4. Temporarily drop trigger on cards to avoid corrupting total_cards during deduplication
DROP TRIGGER IF EXISTS trigger_update_deck_total_cards ON public.cards;

-- 5. Populate initial relationships into deck_cards from existing cards
INSERT INTO public.deck_cards (deck_id, card_id, created_at)
SELECT deck_id, id, created_at FROM public.cards
WHERE deck_id IS NOT NULL
ON CONFLICT (deck_id, card_id) DO NOTHING;

-- 6. Re-point deck_cards to Master Card IDs (Using inline CTE, zero temp tables)
WITH duplicates AS (
    SELECT 
        id as old_id,
        FIRST_VALUE(id) OVER (
            PARTITION BY LOWER(TRIM(term))
            ORDER BY 
                CASE WHEN phonetic IS NOT NULL AND phonetic <> '' THEN 1 ELSE 2 END,
                CASE WHEN example_sentence IS NOT NULL AND example_sentence <> '' THEN 1 ELSE 2 END,
                repetition DESC,
                created_at ASC
        ) as master_id
    FROM public.cards
)
INSERT INTO public.deck_cards (deck_id, card_id)
SELECT DISTINCT dc.deck_id, d.master_id
FROM public.deck_cards dc
JOIN duplicates d ON dc.card_id = d.old_id
WHERE d.old_id <> d.master_id
ON CONFLICT (deck_id, card_id) DO NOTHING;

-- 7. Delete old duplicate card IDs from deck_cards
WITH duplicates AS (
    SELECT 
        id as old_id,
        FIRST_VALUE(id) OVER (
            PARTITION BY LOWER(TRIM(term))
            ORDER BY 
                CASE WHEN phonetic IS NOT NULL AND phonetic <> '' THEN 1 ELSE 2 END,
                CASE WHEN example_sentence IS NOT NULL AND example_sentence <> '' THEN 1 ELSE 2 END,
                repetition DESC,
                created_at ASC
        ) as master_id
    FROM public.cards
)
DELETE FROM public.deck_cards dc
USING duplicates d
WHERE dc.card_id = d.old_id AND d.old_id <> d.master_id;

-- 8. Re-point speaking_attempts to Master Card IDs
WITH duplicates AS (
    SELECT 
        id as old_id,
        FIRST_VALUE(id) OVER (
            PARTITION BY LOWER(TRIM(term))
            ORDER BY 
                CASE WHEN phonetic IS NOT NULL AND phonetic <> '' THEN 1 ELSE 2 END,
                CASE WHEN example_sentence IS NOT NULL AND example_sentence <> '' THEN 1 ELSE 2 END,
                repetition DESC,
                created_at ASC
        ) as master_id
    FROM public.cards
)
UPDATE public.speaking_attempts sa
SET card_id = d.master_id
FROM duplicates d
WHERE sa.card_id = d.old_id AND d.old_id <> d.master_id;

-- 9. Delete duplicate redundant card rows from cards table (keeping master row with rn = 1)
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(term))
            ORDER BY 
                CASE WHEN phonetic IS NOT NULL AND phonetic <> '' THEN 1 ELSE 2 END,
                CASE WHEN example_sentence IS NOT NULL AND example_sentence <> '' THEN 1 ELSE 2 END,
                repetition DESC,
                created_at ASC
        ) as rn
    FROM public.cards
)
DELETE FROM public.cards c
USING duplicates d
WHERE c.id = d.id AND d.rn > 1;

-- 10. Add foreign key from deck_cards to cards(id) with CASCADE
ALTER TABLE public.deck_cards 
    DROP CONSTRAINT IF EXISTS deck_cards_card_id_fkey,
    ADD CONSTRAINT deck_cards_card_id_fkey 
    FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;

-- 11. Populate deck_ids array on Master cards with all linked decks
WITH card_decks_agg AS (
    SELECT card_id, array_agg(DISTINCT deck_id) as all_decks
    FROM public.deck_cards
    GROUP BY card_id
)
UPDATE public.cards c
SET deck_ids = cda.all_decks
FROM card_decks_agg cda
WHERE c.id = cda.card_id;

-- 12. Create trigger on deck_cards to automatically maintain decks.total_cards
CREATE OR REPLACE FUNCTION public.update_deck_total_cards_from_deck_cards()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.decks SET total_cards = total_cards + 1, updated_at = now() WHERE id = NEW.deck_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.decks SET total_cards = GREATEST(0, total_cards - 1), updated_at = now() WHERE id = OLD.deck_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deck_cards_total ON public.deck_cards;
CREATE TRIGGER trigger_update_deck_cards_total
AFTER INSERT OR DELETE ON public.deck_cards
FOR EACH ROW EXECUTE FUNCTION public.update_deck_total_cards_from_deck_cards();

-- 13. Recalculate decks.total_cards with accurate count of linked cards
WITH deck_card_counts AS (
    SELECT deck_id, COUNT(*) as card_count
    FROM public.deck_cards
    GROUP BY deck_id
)
UPDATE public.decks d
SET total_cards = COALESCE(dcc.card_count, 0)
FROM deck_card_counts dcc
WHERE d.id = dcc.deck_id;

-- 14. Update v_deck_statistics view to use deck_cards junction table
DROP VIEW IF EXISTS public.v_deck_statistics;
CREATE VIEW public.v_deck_statistics AS
SELECT 
    d.id AS deck_id,
    d.title,
    d.target_lang,
    COUNT(dc.card_id) AS total_cards,
    COUNT(CASE WHEN c.status = 'new' THEN 1 END) AS new_cards,
    COUNT(CASE WHEN c.status = 'learning' THEN 1 END) AS learning_cards,
    COUNT(CASE WHEN c.status = 'mastered' THEN 1 END) AS mastered_cards,
    COUNT(CASE WHEN c.next_review_at <= now() THEN 1 END) AS due_cards
FROM public.decks d
LEFT JOIN public.deck_cards dc ON d.id = dc.deck_id
LEFT JOIN public.cards c ON dc.card_id = c.id
GROUP BY d.id, d.title, d.target_lang;

-- 15. Enforce UNIQUE constraint on LOWER(TRIM(term)) to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_unique_lower_term ON public.cards (LOWER(TRIM(term)));

-- Cleanup any residual temporary table if previously created
DROP TABLE IF EXISTS public._migration_card_id_mapping;
