# LingoPulse AI — Personal Language Platform

> Ứng dụng học từ vựng và luyện phản xạ giao tiếp ngoại ngữ tích hợp AI, kết hợp thuật toán Spaced Repetition (FSRS/SM-2), chấm điểm phát âm 4 chiều PronScore™ và hội thoại nhập vai.

---

## 1. Tổng Quan Kiến Trúc Kỹ Thuật

Dự án xây dựng vòng lặp học tập khép kín 4 giai đoạn:
1. **Khởi tạo học liệu (Create):** Tạo bộ thẻ thủ công hoặc dùng Google Gemini Multimodal Vision (Photo-to-Flashcard) trích xuất từ vựng từ ảnh chụp sách giáo khoa/tài liệu và mở rộng theo chủ đề (Topic-to-Flashcard).
2. **Ghi nhớ ngắt quãng (Memorize):** Tích hợp thuật toán **Modified SuperMemo SM-2 & FSRS** tự động tính toán hệ số dễ nhớ ($EF$), số lần lặp ($n$) và khoảng thời gian ôn tập tiếp theo ($I$). 3 chế độ học tập cốt lõi:
   - **Flashcard:** Lật thẻ 3D, phát âm bản xứ, đánh giá 4 mức nhớ (`Again`, `Hard`, `Good`, `Easy`).
   - **Write:** Chế độ tự luận gõ lại từ vựng theo nghĩa ngữ cảnh.
   - **Dictation:** Nghe giọng đọc mẫu và chép chính tả toàn bộ câu ví dụ.
3. **Thực hành ngữ cảnh & Ngữ pháp (Contextual & Grammar):** Kiểm tra câu đặt của người học với từ vựng mục tiêu, tự động bắt lỗi ngữ pháp và gợi ý câu viết lại tự nhiên chuẩn bản xứ.
4. **Phản xạ nói & Chấm điểm phát âm (Speak & PronScore):** Thu âm trực tiếp qua `MediaRecorder API` và phân tích theo 4 chỉ số chuẩn của Azure AI Speech:
   - **AccuracyScore:** Độ chính xác âm vị từng từ (tô màu Xanh $\ge 80$, Vàng $60-79$, Đỏ $< 60$).
   - **FluencyScore:** Độ trôi chảy và ngắt nghỉ tự nhiên.
   - **CompletenessScore:** Tỷ lệ từ phát âm so với văn bản gốc.
   - **ProsodyScore:** Trọng âm câu, cao độ và ngữ điệu.

---

## 2. Cấu Trúc Thư Mục Chuẩn Developer

```tree
LanguageLearningApp/
├── package.json                                    # Scripts & dependencies
├── tsconfig.json                                   # Cấu hình TypeScript strict mode
├── .eslintrc.json                                  # Cấu hình Next.js ESLint
├── tailwind.config.ts                              # Cấu hình Theme màu & Design System
├── postcss.config.mjs                              # PostCSS plugin pipeline
├── next.config.mjs                                 # Cấu hình Next.js App Router
├── .env.example                                    # Mẫu biến môi trường bảo mật
├── .gitignore                                      # Bộ lọc file rác / git ignore
├── README.md                                       # Tài liệu hướng dẫn kỹ thuật
│
├── tests/                                          # Unit Test Suites (node:test + spec reporter)
│   ├── run.js                                      # Test runner tự động phát hiện test files
│   ├── srs.test.ts                                 # Unit tests cho Spaced Repetition Engine (SM-2)
│   ├── utils.test.ts                               # Unit tests cho hàm tiện ích (date, badge color, cn)
│   └── azure-speech.test.ts                        # Unit tests cho PronScore assessment simulator
│
├── supabase/                                       # Cơ sở dữ liệu PostgreSQL
│   ├── schema.sql                                  # 4 bảng cốt lõi (decks, cards, speaking_attempts, sessions) + Views + Triggers
│   └── seed.sql                                    # Dữ liệu mẫu phong phú (IELTS Band 8.0, Silicon Valley Vocab)
│
└── src/
    ├── app/                                        # Next.js 14 App Router
    │   ├── layout.tsx                              # Root layout với Navbar và Footer
    │   ├── globals.css                             # Tailwind directives & CSS 3D
    │   ├── page.tsx                                # Dashboard tổng quan, Review Queue, Thống kê
    │   ├── decks/
    │   │   ├── page.tsx                            # Thư viện bộ từ vựng, tìm kiếm & bộ lọc
    │   │   └── [id]/page.tsx                       # Chi tiết bộ từ, danh sách thẻ, kích hoạt luyện nói
    │   ├── study/[id]/page.tsx                     # Đấu trường ôn tập 3 chế độ (Flashcard, Write, Dictation)
    │   ├── speaking/page.tsx                       # Studio luyện phản xạ nói & Chấm điểm PronScore
    │   ├── conversation/page.tsx                   # Hội thoại nhập vai AI Native Speaker Roleplay
    │   └── api/
    │       ├── ai/generate-cards/route.ts          # API trích xuất thẻ từ ảnh / chủ đề (Gemini)
    │       ├── ai/check-grammar/route.ts           # API chấm ngữ pháp câu trả lời
    │       └── speech/assess/route.ts              # API chấm phát âm PronScore (Azure Speech)
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx                          # Thanh điều hướng với Study Streak
    │   │   └── Footer.tsx                          # Footer ứng dụng
    │   ├── deck/
    │   │   └── DeckCard.tsx                        # Card hiển thị bộ từ & tiến độ New/Learning/Mastered
    │   ├── study/
    │   │   ├── FlashcardViewer.tsx                 # 3D Flip Card với phím tắt Space và 1-4
    │   │   ├── WriteMode.tsx                       # Chế độ tự luận gõ từ
    │   │   └── DictationMode.tsx                   # Chế độ nghe chép chính tả
    │   ├── speaking/
    │   │   ├── PronScoreDisplay.tsx                # Bảng radar & phân tích 4 chỉ số PronScore + Word breakdown
    │   │   └── SpeechPracticeModal.tsx             # Modal thu âm giọng nói và hiển thị kết quả
    │   ├── ai/
    │   │   └── PhotoToCardModal.tsx                # Modal tạo từ vựng thông minh từ ảnh chụp / chủ đề
    │   └── conversation/
    │       └── RoleplayChat.tsx                    # Giao diện hội thoại theo kịch bản mục tiêu
    │
    ├── lib/
    │   ├── srs.ts                                  # Thuật toán Spaced Repetition (Modified SM-2 / FSRS)
    │   ├── audio.ts                                # Web Speech TTS và MediaRecorder
    │   ├── gemini.ts                               # Client Google Gemini 2.5 Flash
    │   ├── azure-speech.ts                         # Azure AI Speech Assessment & Heuristic fallback
    │   ├── storage.ts                              # Adapter Local-First IndexedDB / LocalStorage
    │   └── utils.ts                                # Tiện ích định dạng, ghép class cn()
    │
    └── types/
        └── index.ts                                # Định nghĩa kiểu TypeScript chặt chẽ
```

---

## 3. Hướng Dẫn Cài Đặt & Khởi Chạy (Developer Setup)

### Bước 1: Kiểm tra hoặc cài đặt Node.js
Dự án yêu cầu **Node.js phiên bản $\ge 18.18.0$ (Khuyến nghị Node.js 20 LTS hoặc 22)**:
- Tải từ trang chủ: [https://nodejs.org/](https://nodejs.org/) hoặc dùng lệnh:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```

### Bước 2: Cài đặt Dependencies
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy:
```bash
npm install
# hoặc nếu dùng pnpm:
pnpm install
```

### Bước 3: Cấu hình Biến Môi Trường (API Keys)
Sao chép file `.env.example` thành `.env.local`:
```bash
cp .env.example .env.local
```
Điền các API Key theo nhu cầu:
1. **Google Gemini API Key:** Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey) để kích hoạt tính năng tạo thẻ từ ảnh chụp (Photo-to-Flashcard), sửa lỗi ngữ pháp và hội thoại Roleplay.
2. **Azure AI Speech Key & Region:** Đăng ký gói Free Tier (F0) tại [Azure Portal](https://portal.azure.com) (miễn phí 5 giờ âm thanh/tháng) để kích hoạt chấm điểm phát âm `PronScore`.
*(Lưu ý: Nếu chưa cấu hình API Key, ứng dụng vẫn tự động kích hoạt Heuristic Simulation Fallback và Web Speech API để lập trình viên có thể test toàn bộ tính năng và giao diện mà không bị lỗi).*

### Bước 4: Khởi chạy môi trường phát triển & Chạy Tests
```bash
# Khởi chạy dev server
npm run dev

# Chạy toàn bộ Unit Tests (24 test cases cho SRS, PronScore, Utils)
npm test

# Kiểm tra lint & kiểu dữ liệu TypeScript
npm run lint
npm run type-check
```
Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

## 4. Cấu Hình Cơ Sở Dữ Liệu Đám Mây (Supabase / PostgreSQL)

Mặc định, ứng dụng sử dụng cơ chế **Local-First (LocalStorage & Memory Adapter)** để người dùng có thể học ngay lập tức với độ trễ 0ms mà không cần tạo database.

Nếu bạn muốn đồng bộ đa thiết bị qua đám mây:
1. Tạo một dự án miễn phí tại [Supabase](https://supabase.com).
2. Vào **SQL Editor** trong bảng điều khiển Supabase và dán toàn bộ nội dung file [`supabase/schema.sql`](./supabase/schema.sql) để tạo 4 bảng, indexes và triggers.
3. Chạy file [`supabase/seed.sql`](./supabase/seed.sql) để nạp các bộ từ vựng chuẩn IELTS và Business Tech.
4. Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` vào file `.env.local`.

---

## 5. Quy Chuẩn Kỹ Thuật Đã Áp Dụng (Developer Standards)

- **Strict TypeScript:** Toàn bộ dữ liệu, props, API responses đều được định kiểu chặt chẽ trong `src/types/index.ts`.
- **Zero Lock-in Local-First:** Bộ nhớ cục bộ hoạt động độc lập ngay cả khi mất mạng; lật thẻ và ôn tập đạt tốc độ tức thì.
- **Mã nguồn Mở & Tiêu chuẩn Hiện đại:** Toàn bộ mã nguồn được xây dựng mới 100% dựa trên các công nghệ chuẩn công nghiệp (Next.js, Tailwind, Web Speech API, Azure Speech REST) với kiến trúc độc lập.
- **Clean Architecture & Phân tách trách nhiệm:** Các module AI, Audio, SRS, UI components được cô lập thành các file chức năng riêng biệt, dễ dàng unit test và mở rộng sang mobile app (Expo / React Native).
