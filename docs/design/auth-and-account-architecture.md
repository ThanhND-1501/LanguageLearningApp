# Tài Liệu Thiết Kế: Kiến Trúc Xác Thực, Phân Tách Dữ Liệu & Tải Tài Liệu Tạo Bộ Từ Vựng

> **Tài liệu đặc tả kiến trúc phần mềm & sơ đồ luồng hệ thống**  
> **Dự án:** LingoPulse AI — Personal Language Platform  
> **Phiên bản:** 1.1.0  
> **Tác giả:** Đội ngũ phát triển sản phẩm  
> **Trạng thái:** Approved & Implemented  

---

## 1. Tổng Quan & Mục Tiêu Thiết Kế (Product & System Goals)

Kiến trúc xác thực và quản lý tài khoản của **LingoPulse AI** được thiết kế theo triết lý **Hybrid Local-First with Cloud Sync**, đảm bảo tính riêng tư, tốc độ tức thì (0ms latency), khả năng hoạt động offline hoàn toàn và phân tách dữ liệu an toàn giữa các người học:

1. **Chế độ Tài khoản Trải nghiệm (Demo / Evaluation Account):**  
   Dành cho người học muốn khám phá nhanh ứng dụng mà không cần đăng ký. Tài khoản trải nghiệm (`demo@lingopulse.ai`) được nạp sẵn 2 bộ từ vựng chuẩn kinh điển:
   - *IELTS Academic Mastery (Band 7.0 - 8.5)*
   - *Silicon Valley & Tech Communication*  
   Đi kèm các thẻ từ vựng với đầy đủ tiến độ lặp lại ngắt quãng (SRS: new, learning, mastered) và lịch sử luyện nói.

2. **Khởi tạo Tài khoản Mới Sạch Hoàn Toàn (Fresh Clean-Slate Registration):**  
   Khi người dùng mới đăng ký (`registerLocalUser`), tài khoản khởi đầu ở **trạng thái mới tinh**:
   - Kho từ vựng cá nhân trống (0 bộ từ cá nhân, 0 thẻ học, 0 thống kê ảo).
   - Thư viện **"Bộ từ vựng chung có sẵn" (Global Shared Catalog)** được hiển thị tách biệt và đánh dấu nhãn nhận diện rõ ràng.
   - Người dùng có toàn quyền chủ động chọn bộ từ phù hợp trong thư viện chung để bấm **"Đăng ký học" (Enroll)**, hoặc khởi tạo bộ từ mới.

3. **Cơ Chế Tải Tài Liệu Đa Định Dạng Tạo Bộ Từ Vựng (Document-to-Flashcards Engine):**  
   Người học có thể tải lên tài liệu học tập thực tế (Ảnh chụp giáo trình `.png, .jpg`, sách báo `.pdf`, tiểu luận/bài tập `.docx`, ghi chú `.txt, .md`). Hệ thống sử dụng Google Gemini Multimodal Vision & Text Extraction cùng bộ bóc tách chuyên dụng (Mammoth, OCR) để trích xuất tự động danh sách từ vựng trọng tâm, phiên âm IPA, định nghĩa tiếng Việt ngữ cảnh, câu ví dụ và câu hỏi luyện nói phản xạ.

---

## 2. Sơ Đồ Kiến Trúc Tổng Thể (System Architecture)

```mermaid
flowchart TD
    subgraph Client_App["Lớp Giao Diện Người Dùng (Client / Next.js)"]
        UI_Home["Trang Chủ Giới Thiệu (/)"]
        UI_Login["Trang Đăng Nhập / Đăng Ký (/login)"]
        UI_Decks["Kho Bộ Từ Vựng (/decks)
        - Tab 1: Bộ từ của bạn (Enrolled Decks)
        - Tab 2: Thư viện chung có sẵn (Global Catalog)"]
        UI_DocModal["Modal Tải Tài Liệu (DocumentUploadModal)"]
        UI_Profile["Trang Cá Nhân & Thống Kê (/profile)"]
    end

    subgraph Auth_Engine["Lớp Xác Thực & Phân Quyền (src/lib/auth.ts)"]
        Hash_Module["SHA-256 Web Crypto Hashing"]
        Session_Mgr["Active Session Manager (getActiveUser / setActiveUser)"]
        Account_Store["Local Accounts Registry (lingopulse_accounts_v1)"]
        Demo_Account["Demo User Profile (Alex Nguyen)"]
    end

    subgraph Deck_Data_Engine["Lớp Quản Lý Bộ Từ & Thẻ Học (src/lib/storage.ts)"]
        Global_Catalog["Bộ Từ Vựng Chung (Global Decks):
        - IELTS Academic Mastery
        - Silicon Valley & Tech"]
        Enrollment_Service["Dịch Vụ Đăng Ký Học (enrollInDeck / unenrollDeck)"]
        User_Decks_Filter["Bộ Lọc Kho Từ Cá Nhân Theo User ID"]
        Card_SRS_Store["Kho Thẻ & Thuật Toán Spaced Repetition"]
    end

    subgraph Document_AI_Engine["Động Cơ Trích Xuất Tài Liệu (Document-to-Deck)"]
        API_Extract["POST /api/ai/extract-document"]
        Doc_Router{"Phân loại MIME Type"}
        Mammoth_Parser["Mammoth DOCX Text Extractor"]
        Text_Reader["Plaintext / Markdown Reader"]
        Gemini_Vision["Google Gemini 2.5 Flash Vision (Images & PDF)"]
        Gemini_Text["Google Gemini Text Reasoning & Vocabulary Selector"]
        Fallback_NLP["Linguistic Fallback Extractor (Offline / No API Key)"]
    end

    subgraph Storage_Layer["Lớp Lưu Trữ Dữ Liệu"]
        LocalStorage["LocalStorage (Offline-first, 0ms latency)"]
        Supabase_Cloud["Supabase PostgreSQL & Cloud Auth (Tùy chọn đồng bộ)"]
    end

    %% Auth connections
    UI_Login -->|1. Đăng ký tài khoản mới| Hash_Module
    Hash_Module -->|Tạo profile sạch| Account_Store
    Account_Store --> Session_Mgr
    UI_Login -->|2. Đăng nhập 1-Click Demo| Demo_Account
    Demo_Account --> Session_Mgr

    %% Decks connections
    Session_Mgr --> User_Decks_Filter
    Global_Catalog --> UI_Decks
    User_Decks_Filter --> UI_Decks
    UI_Decks -->|Bấm 'Đăng ký học'| Enrollment_Service
    Enrollment_Service -->|Thêm vào kho cá nhân| Card_SRS_Store

    %% Document extraction connections
    UI_DocModal -->|Upload ảnh, pdf, docx| API_Extract
    API_Extract --> Doc_Router
    Doc_Router -->|DOCX| Mammoth_Parser
    Doc_Router -->|TXT, MD| Text_Reader
    Doc_Router -->|Image, PDF| Gemini_Vision
    Mammoth_Parser --> Gemini_Text
    Text_Reader --> Gemini_Text
    Gemini_Vision --> Gemini_Text
    Gemini_Text -.->|Fallback nếu offline| Fallback_NLP
    Gemini_Text -->|Trả về thẻ từ đã lọc| UI_DocModal
    UI_DocModal -->|Lưu thành bộ từ cá nhân| User_Decks_Filter

    %% Storage sync
    Account_Store -.-> LocalStorage
    Card_SRS_Store -.-> LocalStorage
    LocalStorage -.->|Đồng bộ đám mây| Supabase_Cloud
```

---

## 3. Sơ Đồ Luồng Đăng Ký & Khởi Tạo Trạng Thái Mới Tinh (Sign-up Flowchart)

Khi người dùng đăng ký tài khoản mới, hệ thống đảm bảo tài khoản không bị lẫn lộn dữ liệu với tài khoản trải nghiệm, đồng thời hướng dẫn người học tiếp cận kho từ vựng chung một cách tự nhiên:

```mermaid
flowchart TD
    Start(["Bắt đầu: Người dùng vào /login (Tab Đăng ký)"]) --> FormInput["Nhập Tên, Email, Mật khẩu, Trình độ mục tiêu (IELTS, TOEIC...)"]
    FormInput --> Validate{"Kiểm tra hợp lệ form"}
    
    Validate -->|Email sai hoặc mật khẩu < 6 ký tự| ShowError["Hiển thị thông báo lỗi"]
    ShowError --> FormInput
    
    Validate -->|Hợp lệ| CheckExisting{"Email đã tồn tại?"}
    CheckExisting -->|Đã tồn tại| NotifyExisted["Báo lỗi: Email đã được đăng ký"]
    NotifyExisted --> FormInput
    
    CheckExisting -->|Chưa tồn tại| HashPass["Băm mật khẩu bằng SHA-256 Web Crypto"]
    HashPass --> CreateCleanProfile["Khởi tạo UserProfile Mới Tinh:
    - enrolledDeckIds: [] (0 bộ từ)
    - totalWords: 0
    - masteredWords: 0
    - streakDays: 1
    - isCloudSynced: false"]
    
    CreateCleanProfile --> SaveAccount["Lưu tài khoản vào Local Accounts Registry"]
    SaveAccount --> SetActive["Thiết lập phiên làm việc Active User Session"]
    SetActive --> LogWelcomeActivity["Ghi nhận hoạt động: 'Khởi tạo tài khoản'"]
    
    LogWelcomeActivity --> RedirectDecks["Chuyển hướng đến /decks (Kho Bộ Từ Vựng)"]
    
    RedirectDecks --> RenderDecks{"Kiểm tra danh sách bộ từ cá nhân"}
    RenderDecks -->|enrolledDeckIds rỗng| ShowEmptyPersonal["Hiển thị màn hình chào mừng tài khoản mới:
    - Thông báo: 'Bạn chưa có bộ từ vựng cá nhân nào'
    - Nút 1: Khám phá thư viện chung có sẵn
    - Nút 2: Tải tài liệu lên (Ảnh, PDF, Word)"]
    
    ShowEmptyPersonal --> ExploreGlobal["Hiển thị mục 'Thư Viện Bộ Từ Vựng Chung (Có Sẵn)':
    - IELTS Academic Mastery [Bộ từ chung]
    - Silicon Valley & Tech [Bộ từ chung]"]
    
    ExploreGlobal --> UserDecision{"Người học chọn hành động"}
    UserDecision -->|Bấm 'Đăng ký học'| EnrollDeck["Hệ thống thêm deckId vào enrolledDeckIds, nạp thẻ học mới vào kho cá nhân"]
    UserDecision -->|Bấm 'Tải tài liệu lên'| OpenDocModal["Mở Modal tải file (Ảnh, PDF, Word) trích xuất từ vựng"]
    UserDecision -->|Bấm 'Tạo bộ mới'| OpenCreateModal["Mở Modal tạo bộ từ thủ công"]
    
    EnrollDeck --> UpdateStatus["Đổi nhãn thành 'Đã đăng ký ✓' và hiển thị trong 'Bộ từ của bạn'"]
    OpenDocModal --> EndFlow(["Tiếp tục học tập cá nhân hóa"])
    UpdateStatus --> EndFlow
```

---

## 4. Sơ Đồ Luồng Đăng Nhập & Chế Độ Trải Nghiệm (Sign-in & Demo Flowchart)

```mermaid
flowchart TD
    Start(["Vào trang /login (Tab Đăng nhập)"]) --> Choice{"Chọn phương thức đăng nhập"}
    
    Choice -->|Bấm 'Đăng nhập Demo (Trải nghiệm nhanh)'| LoadDemo["Kích hoạt DEMO_USER (Alex Nguyen):
    - Tự động nạp sẵn 2 bộ từ chung: IELTS Mastery & Silicon Valley
    - Đầy đủ thẻ học ở các trạng thái SRS: new, learning, mastered
    - Lịch sử hoạt động và chuỗi học tập 7 ngày"]
    LoadDemo --> SaveDemoSession["Lưu Active Session = DEMO_USER"]
    SaveDemoSession --> GoDashboard["Chuyển hướng tới /decks với đầy đủ dữ liệu mẫu"]
    
    Choice -->|Nhập Email & Mật khẩu| VerifyForm["Xác thực email và băm SHA-256 mật khẩu"]
    VerifyForm --> FindAcc{"Tìm tài khoản trong cơ sở dữ liệu"}
    FindAcc -->|Không tìm thấy hoặc sai mật khẩu| AlertAuthFail["Báo lỗi thông tin đăng nhập không chính xác"]
    AlertAuthFail --> Choice
    
    FindAcc -->|Chính xác| LoadUserProfile["Tải Profile người dùng:
    - Khôi phục danh sách bộ từ đã đăng ký (enrolledDeckIds)
    - Khôi phục các thẻ từ cá nhân và tiến độ SRS
    - Cập nhật chuỗi ngày học liên tiếp (Streak Days)"]
    LoadUserProfile --> SaveSession["Thiết lập Active Session"]
    SaveSession --> GoDashboard
```

---

## 5. Sơ Đồ Luồng Tải Tài Liệu Tạo Bộ Từ Vựng (Document-to-Flashcards Flowchart)

```mermaid
flowchart TD
    StartDoc(["Bấm nút 'Tải tài liệu lên' tại /decks"]) --> OpenUploadModal["Mở DocumentUploadModal"]
    OpenUploadModal --> DragDrop["Người học kéo-thả hoặc chọn file:
    - Ảnh: .png, .jpg, .jpeg, .webp
    - Tài liệu: .pdf, .docx, .txt, .md"]
    
    DragDrop --> FileValidation{"Kiểm tra định dạng & dung lượng (< 20MB)"}
    FileValidation -->|Không hợp lệ| ShowFileError["Thông báo lỗi định dạng file không hỗ trợ"]
    ShowFileError --> DragDrop
    
    FileValidation -->|Hợp lệ| ConfigSettings["Người học cấu hình:
    1. Đích đến: 'Tạo bộ từ mới' HOẶC 'Thêm vào bộ hiện có'
    2. Trình độ từ vựng: B1, B2, C1 (IELTS), C2
    3. Số lượng từ trích xuất: 5 - 15 từ"]
    
    ConfigSettings --> SubmitExtract["Bấm 'Trích xuất từ vựng bằng AI'"]
    SubmitExtract --> PostAPI["Gửi FormData lên /api/ai/extract-document"]
    
    PostAPI --> CheckMime{"Kiểm tra loại tệp tin"}
    
    CheckMime -->|Ảnh .png, .jpg| GeminiVision["Đưa ảnh vào Google Gemini Multimodal Vision API"]
    CheckMime -->|Tài liệu .pdf| GeminiPDF["Chuyển buffer PDF trực tiếp sang Gemini Multimodal API"]
    CheckMime -->|Văn bản .docx| MammothRun["Mammoth bóc tách raw text từ XML của file Word"]
    CheckMime -->|Văn bản .txt, .md| DirectText["Đọc trực tiếp chuỗi văn bản"]
    
    MammothRun --> GeminiText["Đưa văn bản vào Gemini phân tích từ vựng trọng tâm"]
    DirectText --> GeminiText
    
    GeminiVision --> ParseResponse{"Gemini phản hồi thành công?"}
    GeminiPDF --> ParseResponse
    GeminiText --> ParseResponse
    
    ParseResponse -->|Thành công| ReturnCards["Chuẩn hóa mảng JSON: term, phonetic, pos, def, example, prompt"]
    ParseResponse -->|Lỗi mạng / Không có API Key| LocalNLP["Bộ bóc tách từ vựng thông minh dự phòng (Fallback NLP):
    - Trích xuất các từ học thuật, cụm từ chuyên môn
    - Tự động điền định nghĩa tiếng Việt & phiên âm IPA"]
    LocalNLP --> ReturnCards
    
    ReturnCards --> ShowReview["Hiển thị màn hình Xem & Chỉnh sửa thẻ:
    - Danh sách thẻ có checkbox chọn/bỏ chọn
    - Cho phép chỉnh sửa nhanh nghĩa, phiên âm, ví dụ"]
    
    ShowReview --> ConfirmSave["Người học bấm 'Lưu vào bộ từ vựng'"]
    
    ConfirmSave --> SaveMode{"Chế độ lưu"}
    SaveMode -->|Tạo bộ từ mới| CreateNewDeck["Tạo Deck mới với tên do AI gợi ý hoặc người dùng sửa"]
    SaveMode -->|Thêm vào bộ hiện có| AppendDeck["Bổ sung thẻ vào Deck được chọn"]
    
    CreateNewDeck --> SaveStorage["Lưu vào kho dữ liệu cá nhân & cập nhật LocalStorage"]
    AppendDeck --> SaveStorage
    SaveStorage --> LogActivity["Ghi nhận hoạt động: 'Tạo bộ từ từ tài liệu'"]
    LogActivity --> CloseModal["Đóng Modal, làm mới danh sách bộ từ cá nhân"]
    CloseModal --> End(["Hoàn tất"])
```

---

## 6. Ma Trận Dữ Liệu & Phân Tách Theo Tài Khoản (Account Isolation Matrix)

| Thuộc tính / Tài nguyên | Tài khoản Trải nghiệm (Demo) | Tài khoản Mới Đăng Ký (New User) | Tài khoản Cá Nhân Đã Học (Active User) |
| :--- | :--- | :--- | :--- |
| **Email đăng nhập** | `demo@lingopulse.ai` | Email người dùng đăng ký | Email người dùng đăng ký |
| **Bộ từ mặc định** | `deck-ielts-mastery`, `deck-silicon-valley` | Trống (`enrolledDeckIds: []`) | Các bộ đã đăng ký + bộ tự tạo |
| **Thẻ học ban đầu** | 8 thẻ mẫu (1 mastered, 4 learning, 3 new) | 0 thẻ | Số thẻ thuộc các bộ sở hữu/đăng ký |
| **Thư viện chung (Global Catalog)** | Hiển thị dạng "Đã đăng ký ✓" | Hiển thị dạng "+ Đăng ký học" | Hiển thị trạng thái tương ứng |
| **Tải tài liệu (Docx, PDF, Ảnh)** | Khả dụng (lưu vào session demo) | Khả dụng (lưu vào kho cá nhân) | Khả dụng (lưu vào kho cá nhân) |
| **Chuỗi ngày học (Streak)** | 7 ngày | 1 ngày | Tự động tăng theo ngày học thực tế |
| **Quyền chỉnh sửa bộ từ chung** | Chỉ áp dụng cục bộ | Bản sao cá nhân độc lập | Bản sao cá nhân độc lập |

---

## 7. Kết Luận & Tiêu Chuẩn Triển Khai
Kiến trúc trên đảm bảo:
- **Tính trọn vẹn của dữ liệu (Data Integrity):** Không để rò rỉ hoặc ghi đè thẻ của tài khoản trải nghiệm vào tài khoản người dùng mới.
- **Tính tự nhiên của trải nghiệm (UX Onboarding):** Người dùng mới không bị choáng ngợp bởi hàng chục thẻ từ có sẵn của người khác, nhưng dễ dàng chọn lựa các bộ từ vựng chuẩn thế giới chỉ với một cú nhấp chuột.
- **Sức mạnh AI thực chiến:** Biến mọi tài liệu học tập đời thực (sách ảnh, file PDF, Word) thành bộ thẻ Spaced Repetition cá nhân hóa trong vài giây.

