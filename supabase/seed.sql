-- ==============================================================================
-- LingoPulse AI - Seed Data
-- 3 Production-grade Study Sets with Full IPA, Examples & Speaking Prompts
-- ==============================================================================

-- Deck 1: IELTS High-Frequency Vocabulary
INSERT INTO decks (id, title, description, target_lang, native_lang, tags, total_cards)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'IELTS Academic Mastery (Band 7.0 - 8.5)',
    'Các từ vựng học thuật quan trọng nhất xuất hiện liên tục trong bài thi IELTS Writing Task 2 và Speaking Part 3.',
    'en-US',
    'vi-VN',
    ARRAY['IELTS', 'Academic', 'Writing', 'Speaking'],
    5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cards (deck_id, term, phonetic, part_of_speech, definition, example_sentence, example_translation, synonyms, speaking_prompt, status, repetition, easiness_factor, interval_days, next_review_at)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    'resilient',
    '/rɪˈzɪl.jənt/',
    'adjective',
    'Kiên cường, có khả năng phục hồi nhanh chóng sau khó khăn hoặc nghịch cảnh',
    'Children are often much more resilient to major life changes than adults anticipate.',
    'Trẻ em thường kiên cường hơn nhiều trước những biến đổi lớn của cuộc sống so với người lớn dự đoán.',
    '["tough", "tenacious", "adaptable"]'::jsonb,
    'Describe a challenging situation in your life and explain how you stayed resilient.',
    'learning',
    2,
    2.6,
    3,
    now() - INTERVAL '1 hour'
),
(
    'a1111111-1111-1111-1111-111111111111',
    'ubiquitous',
    '/juːˈbɪk.wə.təs/',
    'adjective',
    'Có mặt ở khắp mọi nơi, phổ biến cùng lúc tại nhiều nơi',
    'Smartphones have become ubiquitous across every corner of modern society.',
    'Điện thoại thông minh đã trở nên hiện diện ở khắp mọi ngóc ngách của xã hội hiện đại.',
    '["omnipresent", "pervasive", "everywhere"]'::jsonb,
    'Do you believe artificial intelligence will become ubiquitous in our daily jobs? Why or why not?',
    'learning',
    1,
    2.5,
    1,
    now() - INTERVAL '2 hours'
),
(
    'a1111111-1111-1111-1111-111111111111',
    'corroborate',
    '/kəˈrɒb.ə.reɪt/',
    'verb',
    'Chứng thực, củng cố bằng chứng xác nhận một tuyên bố hay giả thuyết',
    'Recent geological research corroborated the theory of continental drift.',
    'Nghiên cứu địa chất gần đây đã chứng thực lý thuyết trôi dạt lục địa.',
    '["substantiate", "validate", "confirm"]'::jsonb,
    'Why is it crucial for investigative journalists to corroborate every piece of news before publishing?',
    'new',
    0,
    2.5,
    0,
    now()
),
(
    'a1111111-1111-1111-1111-111111111111',
    'candid',
    '/ˈkæn.dɪd/',
    'adjective',
    'Thẳng thắn, bộc trực, không giấu giếm',
    'She gave a remarkably candid assessment of the project failures during the press conference.',
    'Cô ấy đã đưa ra một đánh giá thẳng thắn đáng chú ý về những thất bại của dự án trong buổi họp báo.',
    '["frank", "honest", "outspoken"]'::jsonb,
    'In your opinion, is it always beneficial for a team leader to be brutally candid with employees?',
    'new',
    0,
    2.5,
    0,
    now()
),
(
    'a1111111-1111-1111-1111-111111111111',
    'viable',
    '/ˈvaɪ.ə.bəl/',
    'adjective',
    'Khả thi, có thể thực hiện thành công được trong thực tế',
    'Solar energy has emerged as a commercially viable alternative to fossil fuels.',
    'Năng lượng mặt trời đã nổi lên như một giải pháp thay thế khả thi về mặt thương mại cho nhiên liệu hóa thạch.',
    '["feasible", "workable", "sustainable"]'::jsonb,
    'What do you consider a viable solution to ease traffic congestion in mega cities?',
    'mastered',
    4,
    2.7,
    14,
    now() + INTERVAL '5 days'
);

-- Deck 2: Tech & Business Idioms
INSERT INTO decks (id, title, description, target_lang, native_lang, tags, total_cards)
VALUES (
    'b2222222-2222-2222-2222-222222222222',
    'Silicon Valley & Workplace Communication',
    'Thành ngữ và thuật ngữ thường gặp trong môi trường công nghệ cao và họp giao ban quốc tế.',
    'en-US',
    'vi-VN',
    ARRAY['Business', 'Tech', 'Workplace', 'Idioms'],
    3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO cards (deck_id, term, phonetic, part_of_speech, definition, example_sentence, example_translation, synonyms, speaking_prompt, status, repetition, easiness_factor, interval_days, next_review_at)
VALUES
(
    'b2222222-2222-2222-2222-222222222222',
    'touch base',
    '/tʌtʃ beɪs/',
    'phrase / idiom',
    'Liên hệ lại, trao đổi ngắn gọn để cập nhật tiến độ công việc',
    'Let us touch base next Monday morning to finalize the sprint release plan.',
    'Chúng ta hãy trao đổi ngắn vào sáng thứ Hai tới để chốt kế hoạch phát hành sprint.',
    '["catch up", "reconnect", "check in"]'::jsonb,
    'How often do you like to touch base with your teammates during a sprint?',
    'learning',
    1,
    2.5,
    1,
    now() - INTERVAL '30 minutes'
),
(
    'b2222222-2222-2222-2222-222222222222',
    'bottleneck',
    '/ˈbɒt.əl.nek/',
    'noun',
    'Điểm nghẽn, khâu gây chậm trễ cho toàn bộ tiến độ của hệ thống hoặc dự án',
    'The manual quality assurance review has become the primary bottleneck in our CI/CD pipeline.',
    'Khâu kiểm thử chất lượng thủ công đã trở thành điểm nghẽn chính trong quy trình CI/CD của chúng ta.',
    '["obstacle", "impediment", "blocker"]'::jsonb,
    'Can you identify a major bottleneck in your daily study routine and propose a fix?',
    'new',
    0,
    2.5,
    0,
    now()
),
(
    'b2222222-2222-2222-2222-222222222222',
    'leverage',
    '/ˈlev.ər.ɪdʒ/',
    'verb',
    'Tận dụng triệt để đòn bẩy hoặc nguồn lực sẵn có để đạt kết quả tối đa',
    'We should leverage cloud computing to significantly scale our inference performance.',
    'Chúng ta nên tận dụng điện toán đám mây để mở rộng đáng kể hiệu năng suy luận.',
    '["utilize", "exploit", "capitalize on"]'::jsonb,
    'How do you plan to leverage AI tools to master spoken English faster?',
    'learning',
    3,
    2.6,
    6,
    now() - INTERVAL '4 hours'
);
