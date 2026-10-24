-- ==============================================================================
-- OpenQuiz AI Architecture Blueprint - Database Schema
-- Compatible with PostgreSQL 15+ and Supabase
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. BẢNG BỘ TỪ VỰNG (Study Sets / Decks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_lang VARCHAR(10) NOT NULL DEFAULT 'en-US',
    native_lang VARCHAR(10) NOT NULL DEFAULT 'vi-VN',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_public BOOLEAN DEFAULT true,
    total_cards INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for searching decks
CREATE INDEX IF NOT EXISTS idx_decks_tags ON decks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_decks_created_at ON decks (created_at DESC);

-- ------------------------------------------------------------------------------
-- 2. BẢNG THẺ TỪ VỰNG & TRẠNG THÁI SRS (Cards & Spaced Repetition State)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,                           -- Từ vựng (VD: "resilient")
    phonetic VARCHAR(100),                                -- Phiên âm IPA (VD: "/rɪˈzɪliənt/")
    part_of_speech VARCHAR(50),                           -- Từ loại (noun, verb, adjective...)
    definition TEXT NOT NULL,                             -- Nghĩa tiếng Việt
    example_sentence TEXT,                                -- Câu ví dụ tiếng Anh
    example_translation TEXT,                             -- Bản dịch câu ví dụ
    synonyms JSONB DEFAULT '[]'::jsonb,                   -- Mảng từ đồng nghĩa ["tough", "adaptable"]
    audio_url TEXT,                                       -- Link file âm thanh phát âm (nếu lưu CDN)
    image_url TEXT,                                       -- Ảnh minh họa
    speaking_prompt TEXT,                                 -- Câu hỏi mở gợi ý người học nói dùng từ này
    
    -- Các trường thuật toán Lặp lại ngắt quãng (SM-2 / FSRS)
    status VARCHAR(20) DEFAULT 'new'                      -- 'new', 'learning', 'mastered'
        CHECK (status IN ('new', 'learning', 'mastered')),
    repetition INT DEFAULT 0,                             -- Số lần ôn đúng liên tiếp
    easiness_factor REAL DEFAULT 2.5,                     -- Hệ số dễ nhớ EF (khởi tạo 2.5)
    interval_days INT DEFAULT 0,                          -- Khoảng cách số ngày ôn tiếp theo
    next_review_at TIMESTAMPTZ DEFAULT now(),             -- Thời điểm đến hạn ôn tập
    last_reviewed_at TIMESTAMPTZ,                         -- Lần cuối cùng ôn tập
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for card lookup & SRS queue querying
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_srs_queue ON cards (next_review_at ASC, status);
CREATE INDEX IF NOT EXISTS idx_cards_term ON cards (term);

-- ------------------------------------------------------------------------------
-- 3. BẢNG LỊCH SỬ LUYỆN NÓI & CHẤM ĐIỂM PHÁT ÂM (Speaking Attempts & PronScore)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS speaking_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
    prompt_question TEXT NOT NULL,                        -- Đề bài / Câu hỏi mở
    user_transcript TEXT NOT NULL,                        -- Văn bản người dùng đã nói (STT)
    target_words JSONB DEFAULT '[]'::jsonb,               -- Danh sách từ bắt buộc phải xuất hiện
    ai_grammar_feedback TEXT,                             -- Đánh giá lỗi ngữ pháp từ LLM
    ai_suggested_rewrite TEXT,                            -- Câu diễn đạt tự nhiên hơn được LLM gợi ý
    
    -- Bộ 4 chỉ số PronScore từ Azure AI Speech Pronunciation Assessment
    pron_score REAL CHECK (pron_score >= 0 AND pron_score <= 100),
    accuracy_score REAL CHECK (accuracy_score >= 0 AND accuracy_score <= 100),
    fluency_score REAL CHECK (fluency_score >= 0 AND fluency_score <= 100),
    completeness_score REAL CHECK (completeness_score >= 0 AND completeness_score <= 100),
    prosody_score REAL CHECK (prosody_score >= 0 AND prosody_score <= 100),
    
    word_level_scores JSONB DEFAULT '[]'::jsonb,          -- [{"word": "resilient", "score": 92}]
    audio_record_url TEXT,                                -- URL file ghi âm người dùng
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_speaking_attempts_card_id ON speaking_attempts (card_id);
CREATE INDEX IF NOT EXISTS idx_speaking_attempts_created_at ON speaking_attempts (created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. BẢNG PHIÊN HỘI THOẠI TÌNH HUỐNG AI (Roleplay Conversation Sessions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_title VARCHAR(255) NOT NULL,                 -- VD: "Job Interview", "Ordering at Cafe"
    system_persona TEXT,                                  -- Persona AI đóng vai (VD: "Strict Tech Interviewer")
    target_words JSONB NOT NULL DEFAULT '[]'::jsonb,      -- Danh sách từ vựng buộc dùng trong hội thoại
    used_words JSONB NOT NULL DEFAULT '[]'::jsonb,        -- Từ vựng người học đã dùng thành công
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,          -- Mảng lịch sử tin nhắn [{role, content, timestamp, feedback}]
    status VARCHAR(20) DEFAULT 'in_progress'              -- 'in_progress', 'completed'
        CHECK (status IN ('in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_sessions_status ON conversation_sessions (status);

-- ------------------------------------------------------------------------------
-- TRIGGER TỰ ĐỘNG CẬP NHẬT TỔNG SỐ THẺ TRONG DECK
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_deck_total_cards()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE decks SET total_cards = total_cards + 1, updated_at = now() WHERE id = NEW.deck_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE decks SET total_cards = total_cards - 1, updated_at = now() WHERE id = OLD.deck_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deck_total_cards ON cards;
CREATE TRIGGER trigger_update_deck_total_cards
AFTER INSERT OR DELETE ON cards
FOR EACH ROW EXECUTE FUNCTION update_deck_total_cards();

-- ------------------------------------------------------------------------------
-- VIEW THỐNG KÊ TIẾN ĐỘ HỌC TẬP (Study Progress View)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_deck_statistics AS
SELECT 
    d.id AS deck_id,
    d.title,
    d.target_lang,
    COUNT(c.id) AS total_cards,
    COUNT(CASE WHEN c.status = 'new' THEN 1 END) AS new_cards,
    COUNT(CASE WHEN c.status = 'learning' THEN 1 END) AS learning_cards,
    COUNT(CASE WHEN c.status = 'mastered' THEN 1 END) AS mastered_cards,
    COUNT(CASE WHEN c.next_review_at <= now() THEN 1 END) AS due_cards
FROM decks d
LEFT JOIN cards c ON d.id = c.deck_id
GROUP BY d.id, d.title, d.target_lang;
