# Báo Cáo Phân Tích Kỹ Thuật OpenQuiz.ai & Nghiên Cứu Khả Thi Xây Dựng Web App Cá Nhân

Tài liệu này phân tích chi tiết kiến trúc kỹ thuật, hệ sinh thái tính năng, đánh giá thực tế từ cộng đồng đối với nền tảng học ngoại ngữ [OpenQuiz.ai](https://openquiz.ai/), đồng thời đề xuất bản thiết kế kiến trúc hệ thống (System Blueprint) tối ưu về chi phí và hiệu năng để tự xây dựng một ứng dụng tương tự phục vụ mục đích cá nhân.

## 1. Tổng Quan Về Nền Tảng OpenQuiz.ai

[OpenQuiz.ai](https://openquiz.ai/) là một nền tảng học từ vựng và luyện phản xạ giao tiếp ngoại ngữ tích hợp AI phát triển tại Việt Nam, thuộc sở hữu và vận hành bởi [Công ty TNHH OpenQuiz (MST: 2902266403)](https://thuvienphapluat.vn/ma-so-thue/cong-ty-tnhh-openquiz-mst-2902266403.html) có trụ sở tại Nghệ An, Việt Nam (thành lập ngày 04/03/2026). Nền tảng tự định vị là giải pháp thay thế hiện đại cho Quizlet, Anki và Knowt với triết lý cốt lõi: chuyển hóa từ vựng thụ động (chỉ nhận diện mặt chữ khi đọc) thành phản xạ nói chủ động trong ngữ cảnh thực tế ([OpenQuiz English](https://openquiz.ai/en/)).

| Tiêu chí | Thông tin chi tiết trên hệ thống OpenQuiz.ai |
| :--- | :--- |
| **Đơn vị phát triển** | [Công ty TNHH OpenQuiz](https://masothue.com/2902266403-cong-ty-tnhh-openquiz) (Người đại diện: Phan Nguyễn Đức Hiếu, ngành nghề chính: Lập trình máy tính) |
| **Quy mô người dùng** | Hơn 120.000 người dùng hoạt động hàng tháng (MAU) và hơn 1 triệu phiên học tập ([Trang chủ Tiếng Việt](https://openquiz.ai/vi/)) |
| **Ngôn ngữ hỗ trợ** | Hơn 50 ngôn ngữ, trọng tâm là Tiếng Anh (IELTS, TOEIC, Giao tiếp), Tiếng Trung (HSK 1–6), Tiếng Hàn (TOPIK I–II), Tiếng Nhật (JLPT N5–N1) ([OpenQuiz.ai](https://openquiz.ai/)) |
| **Hệ sinh thái đa nền tảng** | Web App hỗ trợ Offline qua PWA ([So sánh OpenQuiz vs Quizlet](https://openquiz.ai/vi/openquiz-vs-quizlet/)), [Ứng dụng iOS (App Store)](https://apps.apple.com/vn/app/openquiz-ai/id6767530658), [Ứng dụng Android (Google Play)](https://play.google.com/store/apps/details?id=com.openquiz.ai), và [Tiện ích Chrome Extension](https://chromewebstore.google.com/detail/openquiz-ytnetflix-shadow/pahpmlblfmellglfkaknhbgkdlcndbak) |
| **Đối tác hạ tầng giọng nói** | Nhận tài trợ từ chương trình [ElevenLabs Grants](https://openquiz.ai/) cho công nghệ tổng hợp giọng nói AI |
| **Mô hình định giá** | Freemium: Gói Free Forever ($0) và Gói Premium 159.000đ/tháng ($7.98), 289.000đ/quý ($26.99), 790.000đ/năm ($52.98) ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) |
| **Cổng thanh toán tích hợp** | Quốc tế qua Stripe/VISA và nội địa Việt Nam qua mã QR ngân hàng, ví MoMo, ZaloPay ([Chính sách quyền riêng tư](https://openquiz.ai/en/privacy-policy.html)) |

## 2. Phân Tích Hệ Thống Chức Năng & Luồng Nghiệp Vụ (Product & Feature Breakdown)

Khác với các ứng dụng flashcard truyền thống chỉ dừng lại ở bước lật thẻ ghi nhớ nghĩa, [OpenQuiz Review trên ToolAndWise](https://toolandwise.com/openquiz-review-can-ai-turn-vocabulary-into-real-speaking-skills/) chỉ ra rằng nền tảng này thiết kế một vòng lặp học tập khép kín gồm 4 giai đoạn: **Khởi tạo từ vựng (Create) → Ghi nhớ ngắt quãng (Memorize) → Thực hành ngữ cảnh & Ngữ pháp (Practice in Context) → Phản xạ nói & Chấm phát âm (Speak & Score)**.

### 2.1. Phân hệ Khởi tạo & Quản lý Học liệu (Input & Content Generation)
* **Tạo bộ từ thủ công & Nhập liệu hàng loạt (Import):** Cho phép người dùng tự tạo bộ thẻ (Study Sets) không giới hạn gồm từ vựng, phiên âm IPA, từ loại, nghĩa, câu ví dụ, hình ảnh minh họa, hoặc nhập trực tiếp từ định dạng CSV/TSV và gói dữ liệu Anki để chuyển đổi dữ liệu nhanh chóng ([OpenQuiz vs Anki](https://openquiz.ai/vi/openquiz-vs-anki/)).
* **Tạo Flashcard từ ảnh chụp bằng AI (Photo-to-Flashcard):** Người dùng chụp ảnh trang sách giáo khoa, thực đơn, biển báo hoặc tài liệu; hệ thống sử dụng mô hình thị giác máy tính (Vision OCR + LLM) để bóc tách văn bản, lọc ra các từ vựng trọng tâm phù hợp với trình độ và tự động sinh định nghĩa, phiên âm cùng câu ví dụ ([OpenQuiz English](https://openquiz.ai/en/)).
* **Mở rộng từ vựng thông minh bằng AI (AI Word Import & Learning Paths):** Nhập một cụm từ hoặc chủ đề mục tiêu (ví dụ: phỏng vấn công việc, du lịch, IELTS Reading), AI sẽ tự động sinh danh sách từ vựng liên quan kèm từ đồng nghĩa và thiết kế lộ trình học cá nhân hóa ([OpenQuiz.ai](https://openquiz.ai/)).

### 2.2. Phân hệ Ghi nhớ & Lặp lại ngắt quãng (Memorization & SRS Engine)
* **Thuật toán Spaced Repetition (SM-2 cải tiến):** Hệ thống tự động phân loại trạng thái từng từ vựng (`New` → `Learning` → `Mastered`) và tính toán thời điểm rơi vào "đường cong quên lãng" để nhắc ôn tập đúng ngày mà không đòi hỏi người dùng phải tự cấu hình thông số phức tạp như trên Anki ([OpenQuiz vs Anki](https://openquiz.ai/vi/openquiz-vs-anki/)).
* **Đa chế độ ôn tập cơ bản (Core Study Modes):** Tích hợp chế độ lật thẻ truyền thống (`Flashcard`), chế độ nhớ chủ động (`Learn / Recall`), chế độ tự luận gõ lại từ (`Write`), và chế độ nghe chép chính tả từ vựng/định nghĩa (`Dictation`) mở khóa miễn phí hoàn toàn ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)).

### 2.3. Phân hệ Thực hành Ngữ cảnh & Ngữ pháp (Contextual & Grammar Practice)
* **Bài tập ngữ cảnh & Đọc hiểu (Reading Comprehension & Cloze):** Đưa các từ vựng đang học vào đoạn văn hoặc bài tập điền từ vào chỗ trống, dịch câu hai chiều và sắp xếp các từ bị xáo trộn thành câu hoàn chỉnh để rèn khả năng kết hợp từ (collocations) ([ToolAndWise Review](https://toolandwise.com/openquiz-review-can-ai-turn-vocabulary-into-real-speaking-skills/)).
* **Kiểm tra câu trả lời bằng LLM (AI Sentence & Grammar Feedback):** Trong chế độ `Speaking with words`, hệ thống đặt câu hỏi mở và bắt buộc người học phải trả lời bằng câu có chứa từ vựng mục tiêu (ví dụ: yêu cầu dùng các từ `resilient`, `progress`, `strategy` để kể về một lần vượt qua thử thách). Nếu người học mắc lỗi ngữ pháp như *"I was very resilient and I did not gave up"*, AI sẽ lập tức bắt lỗi chia động từ kép (*"did not gave"*) và gợi ý câu diễn đạt tự nhiên hơn: *"I stayed resilient through the hardest weeks and refused to give up on my goal"* ([OpenQuiz.ai](https://openquiz.ai/)).

### 2.4. Phân hệ Luyện Hội thoại AI & Chấm điểm Phát âm (Speaking & Pronunciation Scoring)
* **Hội thoại mô phỏng tình huống thực tế (AI Roleplay Conversation):** AI đóng vai người bản xứ trong các kịch bản cụ thể (gọi món tại nhà hàng, phỏng vấn xin việc, họp kinh doanh, giao tiếp hàng ngày) và điều chỉnh độ khó theo trình độ người học, buộc người học phải kích hoạt vốn từ vừa ôn trong bộ flashcard ([OpenQuiz Tiếng Việt](https://openquiz.ai/vi/)).
* **Chấm điểm phát âm đa chiều (PronScore Engine):** Sau mỗi lượt ghi âm trả lời của người học, hệ thống phân tích tín hiệu âm thanh và trả về điểm tổng `PronScore` trên thang 100 cùng 4 chỉ số thành phần: **Accuracy** (Độ chính xác âm vị), **Fluency** (Độ trôi chảy), **Completeness** (Độ đầy đủ so với văn bản gốc) và **Prosody** (Ngữ điệu, trọng âm và nhịp điệu), đồng thời bóc tách điểm số chi tiết đến từng từ vựng riêng lẻ (ví dụ: `resilient: 91`, `strategy: 84`, `progress: 73`) ([OpenQuiz.ai](https://openquiz.ai/)).

### 2.5. Phân hệ Tiện ích mở rộng & Quản lý Lớp học (Extension & Classroom)
* **Chrome Extension cho YouTube & Netflix:** Tiện ích [OpenQuiz - YT/Netflix Shadowing & Translate](https://chromewebstore.google.com/detail/openquiz-ytnetflix-shadow/pahpmlblfmellglfkaknhbgkdlcndbak) nhúng một bảng điều khiển cạnh trình phát video YouTube/Netflix ([Hướng dẫn trên AI Hay](https://ai-hay.vn/cach-xem-youtube-co-openquiz-ben-canh-pN1UmIag_1m)), cho phép người học luyện nghe chép chính tả từng câu phụ đề (Dictation), nhại lại giọng bản xứ kèm so sánh ngữ điệu (Shadowing), dịch nhanh từ/trang web khi bôi đen và lưu thẳng từ mới về kho từ vựng trên `openquiz.ai`.
* **Quản lý lớp học (Class Management):** Cho phép giáo viên tạo lớp học miễn phí, giao bài tập (Assignments) từ các bộ từ vựng, theo dõi tiến độ học tập của từng học viên và hiển thị bảng xếp hạng (Ranking/Leaderboard) ([Tìm kiếm OpenQuiz](https://openquiz.ai/search)).

| Phân nhóm tính năng | Gói Miễn Phí (Free Forever) | Gói Trả Phí (Premium) |
| :--- | :--- | :--- |
| **Tạo bộ từ thủ công & Gắn ảnh minh họa** | Không giới hạn ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn |
| **Chế độ Learn, Flashcard & Dictation** | Không giới hạn ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn |
| **Quản lý lớp học & Giao bài tập** | Không giới hạn ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn |
| **Lặp lại ngắt quãng (SRS) & Từ đồng nghĩa** | Giới hạn theo chu kỳ ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn (Mở khóa trọn đời nếu mua gói 1 năm) |
| **Chế độ Luyện nói, Hội thoại AI, Ngữ pháp, Đọc hiểu** | 3 lượt / tháng mỗi chế độ ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn |
| **Tạo bộ từ từ ảnh chụp / AI & Chấm điểm phát âm** | 5 lượt / tháng mỗi tính năng ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn |
| **Extension: Dịch / Điền từ / Chép chính tả** | Không giới hạn ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn |
| **Extension: Luyện nói nhại theo video (Shadowing)** | 5 lượt / tháng ([Bảng giá OpenQuiz](https://openquiz.ai/pricing)) | Không giới hạn |

## 3. Phân Tích Chuyên Sâu Về Mặt Kỹ Thuật Của OpenQuiz.ai

Dựa trên dữ liệu công khai tại [Trang chủ OpenQuiz.ai](https://openquiz.ai/), [Chính sách quyền riêng tư](https://openquiz.ai/en/privacy-policy.html), [Chính sách bảo mật Extension](https://openquiz.ai/openquiz-extension-privacy-policy.html) và cấu trúc chỉ số đánh giá phát âm, có thể giải mã chi tiết kiến trúc kỹ thuật đứng sau nền tảng này:

### 3.1. Kiến trúc Frontend, PWA & Đa nền tảng
* **Progressive Web App (PWA) & Local-First Caching:** Việc OpenQuiz hỗ trợ chế độ học ngoại tuyến (Offline Mode) trên trình duyệt ([OpenQuiz vs Quizlet](https://openquiz.ai/vi/openquiz-vs-quizlet/)) cho thấy Frontend sử dụng kiến trúc SPA hiện đại (như Next.js/React hoặc Vue/Nuxt) kết hợp với **Service Workers** và cơ sở dữ liệu trình duyệt (**IndexedDB** hoặc `localStorage`). Khi có mạng, danh sách từ vựng và lịch ôn tập SRS được tải trước về bộ nhớ cục bộ; các thao tác lật thẻ, gõ từ được xử lý ngay trên trình duyệt với độ trễ bằng 0, sau đó mới đồng bộ nền (Background Sync) lên máy chủ.
* **Kiến trúc Cross-Platform (Web, iOS, Android):** Ứng dụng có mặt đồng thời trên Web, [iOS App Store](https://apps.apple.com/vn/app/openquiz-ai/id6767530658) và [Google Play Store](https://play.google.com/store/apps/details?id=com.openquiz.ai) với cùng một hệ thống tài khoản (OAuth 2.0 qua Sign in with Google và Sign in with Apple).
* **Kiến trúc Chrome Extension (Manifest V3):** Tiện ích [OpenQuiz Chrome Extension](https://chromewebstore.google.com/detail/openquiz-ytnetflix-shadow/pahpmlblfmellglfkaknhbgkdlcndbak) sử dụng **Content Scripts** để can thiệp vào cây DOM của trang YouTube và Netflix, đọc luồng dữ liệu phụ đề có gắn nhãn thời gian (timed text / WebVTT tracks), điều khiển sự kiện phát/dừng (`HTMLMediaElement.currentTime`, `play()`, `pause()`) để cắt từng câu thoại cho chế độ Dictation và Shadowing, đồng thời giao tiếp với **Background Service Worker** để gửi từ vựng đã lưu về REST API của `openquiz.ai`.

### 3.2. Công nghệ Xử lý Giọng nói & Giải mã Engine "PronScore"
Một trong những chi tiết kỹ thuật đắt giá nhất của OpenQuiz là hệ thống chấm điểm phát âm `PronScore` hiển thị đúng 4 chỉ số thành phần: **Accuracy, Fluency, Completeness, Prosody** kèm điểm số cho từng từ riêng lẻ ([OpenQuiz.ai](https://openquiz.ai/)).
* **Engine chấm điểm phát âm (Pronunciation Assessment):** Bộ 4 tham số `AccuracyScore`, `FluencyScore`, `CompletenessScore` và `ProsodyScore` chính là cấu trúc JSON đầu ra đặc trưng của dịch vụ **Azure AI Speech Pronunciation Assessment** (hoặc các engine tương đương như SpeechSuper). Khi người dùng thu âm câu trả lời qua `MediaRecorder API` trên trình duyệt, file âm thanh (WAV/WebM/Opus) cùng văn bản tham chiếu (hoặc kịch bản transcript do Whisper STT nhận diện trước) được gửi lên API chấm phát âm để đối sánh từng âm vị (phoneme-level alignment) và tính điểm trọng âm, nhịp điệu (prosody).
* **Engine Tổng hợp giọng nói (Text-to-Speech - TTS):** Phần chân trang của [OpenQuiz.ai](https://openquiz.ai/) xác nhận nền tảng nhận tài trợ từ **ElevenLabs Grants**. Điều này cho thấy các giọng đọc mẫu tự nhiên trong chế độ hội thoại AI và phát âm từ vựng đa ngôn ngữ sử dụng **ElevenLabs TTS API** (kết hợp bộ nhớ đệm Audio CDN trên Cloud Storage để không phải gọi lại API cho các từ vựng trùng lặp).

### 3.3. Kiến trúc AI / LLM Pipeline & Thị giác máy tính (Vision)
* **Photo-to-Flashcard Pipeline:** Khi người dùng tải ảnh lên ([Chính sách quyền riêng tư](https://openquiz.ai/en/privacy-policy.html)), ảnh được lưu trữ trên Object Storage (AWS S3 hoặc Google Cloud Storage) và đưa qua **Multimodal LLM** (như Gemini 2.5 Flash hoặc GPT-4o-mini). Hệ thống sử dụng kỹ thuật **Structured Outputs (JSON Schema)** để yêu cầu mô hình trích xuất danh sách từ vựng từ ảnh, tự động điền phiên âm IPA, loại từ, nghĩa tiếng Việt, câu ví dụ ngữ cảnh và danh sách từ đồng nghĩa trong một lần gọi API duy nhất.
* **Contextual Conversation & Grammar Evaluation:** Sử dụng kỹ thuật **Context Injection Prompting**. Khi khởi tạo phiên hội thoại hoặc kiểm tra câu, Backend truy vấn danh sách các từ vựng đang ở trạng thái `Learning` của người dùng trong Database và truyền vào System Prompt của LLM: *"Yêu cầu người học trả lời câu hỏi có sử dụng các từ [X, Y, Z]. Kiểm tra xem câu trả lời của người học có chứa từ mục tiêu không, chỉ ra lỗi ngữ pháp và gợi ý một câu viết lại tự nhiên hơn"*.

### 3.4. Thuật toán Lặp lại ngắt quãng (Modified SM-2)
Hệ thống sử dụng biến thể của thuật toán **SuperMemo-2 (SM-2)** ([OpenQuiz vs Anki](https://openquiz.ai/vi/openquiz-vs-anki/)). Mỗi thẻ từ vựng của người dùng lưu trữ 4 biến trạng thái trong cơ sở dữ liệu:
* `repetition` ($n$): Số lần trả lời đúng liên tiếp.
* `easiness_factor` ($EF$): Hệ số dễ nhớ (mặc định khởi tạo ở mức $2.5$, giảm xuống nếu trả lời sai hoặc ngập ngừng, tăng lên nếu trả lời nhanh và chính xác).
* `interval` ($I$): Khoảng cách số ngày đến lần ôn tiếp theo ($I_1 = 1$ ngày, $I_2 = 6$ ngày, với $n > 2$ thì $I_n = \text{round}(I_{n-1} \times EF)$).
* `next_review_at`: Mốc thời gian (`TIMESTAMP`) mở khóa thẻ trong hàng đợi ôn tập hàng ngày. Khác với Anki buộc người dùng tự bấm chọn mức độ "Again / Hard / Good / Easy", OpenQuiz tự động hóa việc chấm mức độ nhớ dựa trên kết quả làm bài tập trắc nghiệm, gõ từ (Write/Dictation) và điểm phát âm.

## 4. Tổng Hợp Đánh Giá Thực Tế Trên Internet (Ưu & Nhược Điểm)

Qua khảo sát các trang đánh giá công nghệ giáo dục như [AI Hay Review OpenQuiz](https://ai-hay.vn/review-nhanh-web-hoc-tieng-anh-openquiz-ai-uu-nhuoc-diem-pN1UmIYLPES), [ToolAndWise](https://toolandwise.com/openquiz-review-can-ai-turn-vocabulary-into-real-speaking-skills/) và phản hồi của người dùng trên [App Store](https://apps.apple.com/us/app/openquiz-ai/id6767530658), dưới đây là bức tranh khách quan về trải nghiệm thực tế của OpenQuiz.ai:

### 4.1. Điểm mạnh được đánh giá cao
* **Giải quyết đúng "điểm nghẽn" từ vựng thụ động:** Việc ép người học phải đặt câu và nói thành tiếng với chính từ vựng vừa lật thẻ giúp xóa bỏ tình trạng "nhớ mặt chữ nhưng đơ khi giao tiếp" ([ToolAndWise](https://toolandwise.com/openquiz-review-can-ai-turn-vocabulary-into-real-speaking-skills/)).
* **Gói miễn phí hào phóng cho nhu cầu cơ bản:** Trong khi Quizlet đặt chế độ `Learn` và `Test` sau tường phí (paywall), OpenQuiz mở miễn phí trọn đời cho việc tạo thẻ thủ công, chế độ Learn, Dictation và quản lý lớp học mà không chèn quảng cáo ([AI Hay Review](https://ai-hay.vn/review-nhanh-web-hoc-tieng-anh-openquiz-ai-uu-nhuoc-diem-pN1UmIYLPES)).
* **Bản địa hóa tối ưu cho người Việt:** Giao diện tiếng Việt tự nhiên, lộ trình học chia sẵn theo các chứng chỉ phổ biến tại Việt Nam (IELTS, TOEIC, HSK, JLPT, TOPIK) và tích hợp thanh toán nội địa QR/MoMo tiện lợi ([OpenQuiz Tiếng Việt](https://openquiz.ai/vi/)).

### 4.2. Hạn chế & Phản hồi trái chiều từ người dùng
* **Giới hạn lượt dùng AI khá thấp ở gói Free:** Theo [Bảng giá OpenQuiz](https://openquiz.ai/pricing), người dùng miễn phí chỉ được trải nghiệm 3 lượt/tháng cho chế độ Speaking, Conversation, Grammar và 5 lượt/tháng cho chấm điểm phát âm hoặc tạo thẻ từ ảnh. Điều này dẫn đến một số đánh giá 1–2 sao trên [App Store](https://apps.apple.com/us/app/openquiz-ai/id6767530658) phàn nàn rằng *"mới học có 1 lần đã bắt đóng tiền"* khi người dùng tập trung vào các tính năng AI.
* **Trải nghiệm đầu vào cho người mất gốc:** Một số câu hỏi gợi ý trong chế độ luyện nói hiển thị hoàn toàn bằng tiếng Anh ngay từ đầu, có thể gây bỡ ngỡ cho người mới bắt đầu nếu chưa tự điều chỉnh cài đặt trình độ ([AI Hay Review](https://ai-hay.vn/review-nhanh-web-hoc-tieng-anh-openquiz-ai-uu-nhuoc-diem-pN1UmIYLPES)).
* **Độ sâu học liệu luyện thi chuyên biệt:** Các bộ đề học thuật chuyên sâu (như chấm chữa IELTS Writing/Speaking theo tiêu chí chấm thi chuẩn hoặc bài đọc dài) vẫn dừng ở mức bổ trợ từ vựng và phản xạ câu ngắn, chưa thể thay thế hoàn toàn giáo viên thật ([ToolAndWise](https://toolandwise.com/openquiz-review-can-ai-turn-vocabulary-into-real-speaking-skills/)).

## 5. Nghiên Cứu Khả Thi & Bản Thiết Kế Xây Dựng Web App Cá Nhân Tương Tự

### 5.1. Đánh giá tính khả thi (Feasibility Analysis)
Việc tự xây dựng một web app học từ vựng và luyện phản xạ nói có tính năng tương đương **90–95% so với OpenQuiz.ai** để làm **project cá nhân sử dụng riêng** là **hoàn toàn khả thi với chi phí vận hành gần như bằng 0 ($0 – $2/tháng)**.

Lý do cốt lõi là:
1. **Không tốn chi phí gánh tải hạ tầng (Zero Multi-tenant Overhead):** OpenQuiz phải thu phí $7.98/tháng vì họ phải trả tiền máy chủ, băng thông và API AI cho 120.000 người dùng. Khi làm app cá nhân (1 người dùng hoặc nhóm nhỏ gia đình/bạn bè), bạn loại bỏ hoàn toàn bài toán cổng thanh toán (Stripe/MoMo), hệ thống phân quyền lớp học phức tạp, chống gian lận (rate-limiting/anti-abuse) và có thể tận dụng tối đa gói **Free Tier** của các nền tảng đám mây hiện đại.
2. **Mở khóa không giới hạn các tính năng AI (No Paywall):** Thay vì bị giới hạn 3 lượt luyện nói/tháng như gói Free của OpenQuiz, việc kết nối trực tiếp API Key cá nhân (BYOK - Bring Your Own Key) với Gemini API, OpenAI/Groq và Azure Speech cho phép bạn luyện hội thoại, tạo flashcard từ ảnh và chấm điểm phát âm không giới hạn mỗi ngày.

### 5.2. Đề xuất Kiến trúc Công nghệ (Recommended Tech Stack) cho Cá nhân

| Tầng kiến trúc (Layer) | Công nghệ đề xuất (Tech Stack) | Lý do lựa chọn & Hạn mức miễn phí (Free Tier) |
| :--- | :--- | :--- |
| **Frontend & Backend Framework** | **Next.js (App Router, TypeScript)** + **Tailwind CSS** + **shadcn/ui** | Xây dựng cả giao diện người dùng (UI) và API Routes (Serverless Functions) trong cùng một codebase duy nhất; hỗ trợ cấu hình PWA (`next-pwa`) dễ dàng để dùng trên điện thoại như app thật. |
| **Cơ sở dữ liệu & Xác thực (DB & Auth)** | **Supabase** (PostgreSQL + Supabase Auth + Storage) hoặc **Local-first với Dexie.js (IndexedDB)** | Supabase miễn phí 500MB Database và 1GB lưu trữ file (đủ lưu hơn 100.000 thẻ từ vựng và ảnh chụp tài liệu). Nếu chỉ dùng 1 mình, có thể kết hợp IndexedDB để tốc độ lật thẻ đạt 0ms. |
| **Engine AI Đa phương thức (LLM & Vision OCR)** | **Google Gemini 2.5 Flash API** (qua `@google/genai` hoặc `ai` SDK) | Xử lý đồng thời: trích xuất từ vựng từ ảnh chụp (Photo-to-Flashcard), tạo câu ví dụ, chấm ngữ pháp và đóng vai hội thoại (Roleplay) với tốc độ phản hồi cực nhanh và có hạn mức miễn phí/chi phí cực rẻ. |
| **Engine Chấm điểm Phát âm (PronScore)** | **Azure AI Speech Service** (Pronunciation Assessment API) | Cung cấp miễn phí **5 giờ âm thanh/tháng** ở gói Free Tier (F0) — tương đương khoảng **1.000 lượt chấm câu nói dài 18 giây mỗi tháng**, trả về chính xác 4 chỉ số `Accuracy`, `Fluency`, `Completeness`, `Prosody` và điểm từng từ y hệt OpenQuiz. |
| **Engine Nhận diện & Tổng hợp Giọng nói (STT / TTS)** | **Web Speech API** / **Edge TTS** (Miễn phí) hoặc **Groq Whisper** + **OpenAI TTS / ElevenLabs** | Dùng `window.speechSynthesis` hoặc thư viện `edge-tts` để có giọng đọc tự nhiên hoàn toàn miễn phí ($0); hoặc dùng Groq Whisper API để nhận diện giọng nói thời gian thực trong chế độ hội thoại. |
| **Thuật toán Lặp lại ngắt quãng (SRS)** | Thư viện mã nguồn mở **`ts-fsrs`** (Free Spaced Repetition Scheduler) hoặc **`supermemo`** | `ts-fsrs` (thuật toán FSRS mới nhất của cộng đồng Anki viết bằng TypeScript) tối ưu lịch ôn tập thông minh và chính xác hơn cả thuật toán SM-2 truyền thống. |
| **Hạ tầng Triển khai (Hosting)** | **Vercel** hoặc **Cloudflare Pages** | Miễn phí hoàn toàn cho project cá nhân, tự động triển khai (CI/CD) mỗi khi đẩy code lên GitHub. |

### 5.3. Thiết kế Cơ sở dữ liệu (Database Schema trên PostgreSQL / Supabase)
Để vận hành toàn bộ các tính năng từ quản lý bộ thẻ, lịch ôn tập SRS cho đến lưu lịch sử chấm phát âm và hội thoại AI, bạn chỉ cần thiết kế 4 bảng cốt lõi sau:

```sql
-- 1. Bảng quản lý Bộ từ vựng (Study Sets / Decks)
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_lang VARCHAR(10) NOT NULL DEFAULT 'en-US',
    native_lang VARCHAR(10) NOT NULL DEFAULT 'vi-VN',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bảng quản lý Thẻ từ vựng & Trạng thái thuật toán SRS (Cards)
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    term TEXT NOT NULL,                   -- Từ vựng (VD: "resilient")
    phonetic TEXT,                        -- Phiên âm IPA (VD: "/rɪˈzɪliənt/")
    part_of_speech VARCHAR(20),           -- Từ loại (adj, noun, verb...)
    definition TEXT NOT NULL,             -- Nghĩa tiếng Việt
    example_sentence TEXT,                -- Câu ví dụ ngữ cảnh
    synonyms JSONB DEFAULT '[]'::jsonb,   -- Mảng từ đồng nghĩa
    audio_url TEXT,                       -- Link file âm thanh (nếu cache lại)
    -- Các trường phục vụ thuật toán lặp lại ngắt quãng (SM-2 / FSRS)
    status VARCHAR(20) DEFAULT 'new',     -- 'new', 'learning', 'mastered'
    repetition INT DEFAULT 0,
    easiness_factor REAL DEFAULT 2.5,
    interval_days INT DEFAULT 0,
    next_review_at TIMESTAMPTZ DEFAULT now(),
    last_reviewed_at TIMESTAMPTZ
);

-- 3. Bảng lưu Lịch sử Luyện nói & Điểm phát âm PronScore (Speaking Logs)
CREATE TABLE speaking_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
    prompt_question TEXT NOT NULL,        -- Câu hỏi yêu cầu dùng từ
    user_transcript TEXT NOT NULL,        -- Văn bản người dùng đã nói
    ai_grammar_feedback TEXT,             -- Nhận xét sửa lỗi ngữ pháp của LLM
    ai_suggested_rewrite TEXT,            -- Câu gợi ý tự nhiên hơn từ LLM
    pron_score REAL,                      -- Điểm tổng PronScore (0-100)
    accuracy_score REAL,                  -- Độ chính xác âm vị (0-100)
    fluency_score REAL,                   -- Độ trôi chảy (0-100)
    completeness_score REAL,              -- Độ đầy đủ (0-100)
    prosody_score REAL,                   -- Ngữ điệu (0-100)
    word_level_scores JSONB,              -- Điểm chi tiết từng từ: [{"word": "resilient", "score": 91}]
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bảng lưu Phiên Hội thoại Tình huống AI (Roleplay Sessions)
CREATE TABLE conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_title TEXT NOT NULL,         -- VD: "Job Interview", "Ordering Food"
    target_words JSONB NOT NULL,          -- Danh sách các từ vựng buộc phải sử dụng trong hội thoại
    used_words JSONB DEFAULT '[]'::jsonb, -- Các từ người học đã sử dụng thành công
    messages JSONB DEFAULT '[]'::jsonb,   -- Lịch sử chat [{role, content, feedback, pron_score}]
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4. Thiết kế Luồng Tích hợp AI (Core AI Pipelines)

#### A. Pipeline 1: Tạo Flashcard từ Ảnh chụp hoặc Văn bản (Photo-to-Flashcard với Structured Output)
Khi bạn chụp ảnh trang sách hoặc dán một bài báo tiếng Anh vào app, một API Route trong Next.js (`/api/generate-cards`) sẽ gửi ảnh/văn bản tới mô hình LLM kèm cấu trúc JSON Schema nghiêm ngặt:

```typescript
// Ví dụ Prompt & Schema trích xuất từ vựng từ ảnh/văn bản
const systemPrompt = `
Bạn là chuyên gia ngôn ngữ học. Hãy phân tích hình ảnh/văn bản được cung cấp,
trích xuất 10-15 từ vựng hoặc cụm động từ (phrasal verbs) quan trọng nhất ở trình độ B1-C1.
Với mỗi từ, hãy trả về đúng định dạng JSON gồm:
- term: từ nguyên mẫu
- phonetic: phiên âm chuẩn IPA
- partOfSpeech: từ loại (n, v, adj, adv, phrase)
- definitionVi: nghĩa tiếng Việt ngắn gọn, sát ngữ cảnh
- exampleSentence: 1 câu ví dụ tự nhiên chứa từ đó
- synonyms: mảng 2-3 từ đồng nghĩa
- speakingPrompt: 1 câu hỏi mở ngắn gọn buộc người học phải dùng từ này để trả lời.
`;
```

#### B. Pipeline 2: Chấm điểm Phát âm từng từ (PronScore với Azure Speech SDK)
Để tái hiện bảng điểm `PronScore` gồm 4 chỉ số (`Accuracy`, `Fluency`, `Completeness`, `Prosody`) và điểm từng từ như trên [OpenQuiz.ai](https://openquiz.ai/), bạn cài đặt gói `microsoft-cognitiveservices-speech-sdk`:

1. **Bước 1 (Nhận diện văn bản & Sửa ngữ pháp):** Thu âm câu trả lời của bạn từ trình duyệt, gửi qua Whisper/Gemini Audio để chuyển thành văn bản (`transcript`), đồng thời kiểm tra xem bạn đã dùng đúng từ vựng mục tiêu chưa và sửa lỗi ngữ pháp.
2. **Bước 2 (Chấm điểm âm vị & ngữ điệu):** Truyền cùng đoạn âm thanh đó và chuỗi `transcript` vào `PronunciationAssessmentConfig` của Azure Speech với chế độ `Granularity.Phoneme` và bật `enableProsodyAssessment()`. Azure sẽ trả về JSON chứa điểm số của từng từ và từng âm tiết để bạn tô màu Xanh (≥ 80 điểm), Vàng (60–79 điểm) hoặc Đỏ (< 60 điểm) trực tiếp trên giao diện.

### 5.5. Lộ trình Triển khai Dự án Cá nhân (4 Giai đoạn - 4 Tuần)

| Giai đoạn | Thời gian dự kiến | Mục tiêu & Hạng mục công việc cụ thể |
| :--- | :--- | :--- |
| **Giai đoạn 1: Core Vocabulary & SRS (MVP)** | Tuần 1 | Khởi tạo project Next.js + Tailwind + Supabase; xây dựng CRUD quản lý bộ từ (`decks`, `cards`), tính năng Import/Export CSV từ Quizlet/Anki, tích hợp thư viện `ts-fsrs` để tính lịch ôn tập ngắt quãng và làm 3 chế độ học cơ bản: Flashcard lật thẻ, Write (gõ từ) và Dictation (nghe gõ lại từ bằng Web Speech API). |
| **Giai đoạn 2: AI Content & Context Engine** | Tuần 2 | Tích hợp Gemini API để làm tính năng **Photo-to-Flashcard** (tải ảnh tài liệu tự sinh bộ thẻ) và **Topic-to-Flashcard** (nhập chủ đề tự sinh từ vựng); xây dựng chế độ bài tập điền từ ngữ cảnh (Cloze Test) và chấm sửa lỗi câu tự động khi đặt câu với từ mới. |
| **Giai đoạn 3: Speaking, Roleplay & PronScore** | Tuần 3 | Xây dựng bộ thu âm giọng nói trên trình duyệt (`MediaRecorder API`), tích hợp Azure Speech Pronunciation Assessment để hiển thị biểu đồ điểm `PronScore` (Accuracy, Fluency, Completeness, Prosody) và chế độ Hội thoại nhập vai (AI Roleplay) buộc dùng các từ đến hạn ôn tập. |
| **Giai đoạn 4: PWA Offline & Tiện ích mở rộng** | Tuần 4 | Cấu hình Service Worker (`next-pwa`) để cài đặt web app lên màn hình chính điện thoại iOS/Android; tùy chọn viết thêm một Chrome Extension nhỏ gọn giúp bôi đen từ vựng khi đọc báo/xem YouTube và bấm 1 nút lưu thẳng vào Database cá nhân. |


## 6. Pháp Lý, Bản Quyền (Copyright/License) & Điều Kiện Phân Phối Trên App Store và Google Play

Khi bạn chuyển định hướng từ một project cá nhân sang xây dựng một ứng dụng thương mại độc lập hoàn toàn mới để phát hành trên **Apple App Store (iOS)** và **Google Play Store (CH Play - Android)**, bài toán sẽ mở rộng sang quyền sở hữu trí tuệ (IP), giấy phép mã nguồn mở (Open-Source Licenses) và các quy định kiểm duyệt khắt khe của hai kho ứng dụng.

### 6.1. Ranh giới Bản quyền (Copyright) & Sở hữu trí tuệ so với App gốc (OpenQuiz.ai)

Theo nguyên tắc pháp lý quốc tế về quyền tác giả phần mềm (như **Idea-Expression Dichotomy** - Phân tách giữa Ý tưởng và Hình thức thể hiện) và Luật Sở hữu trí tuệ Việt Nam, pháp luật **bảo hộ cách thức thể hiện cụ thể (mã nguồn, giao diện đồ họa, cơ sở dữ liệu độc quyền, nhãn hiệu)** chứ **không bảo hộ ý tưởng, phương pháp học tập hay thuật toán toán học**.

Theo mục Sở hữu trí tuệ tại [Điều khoản dịch vụ (Terms of Service)](https://openquiz.ai/en/terms-of-service.html) và [Quy định cung cấp dịch vụ (Service Provision)](https://openquiz.ai/en/service-provision.html) của OpenQuiz:
> *"All content, features, and functionality of OpenQuiz, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are the exclusive property of OpenQuiz and protected by international copyright, trademark, and other intellectual property laws."*

Ngoài ra, một số trang đánh giá như [AI Hay (So sánh Quizlet và OpenQuiz)](https://ai-hay.vn/quizlet-va-openquiz-ai-co-khac-nhau-khong-pN1UmIxdXAO) từng đề cập nhầm rằng OpenQuiz là "mã nguồn mở", nhưng thực tế [OpenQuiz.ai](https://openquiz.ai/) là **phần mềm thương mại đóng mã nguồn (Proprietary Software — "© 2026 OpenQuiz Company Limited. All rights reserved.")**. Chữ "Open" chỉ nằm trong tên thương hiệu của công ty.

Để ứng dụng mới của bạn **hợp pháp 100% và không vi phạm bản quyền của OpenQuiz hay các bên thứ ba**, bạn cần tuân thủ rõ ràng ranh giới sau:

| Hạng mục | Được phép sử dụng & Tự phát triển (Hợp pháp 100%) | Tuyệt đối cấm sao chép (Vi phạm Bản quyền / Nhãn hiệu) |
| :--- | :--- | :--- |
| **Thuật toán & Phương pháp học** | Sử dụng phương pháp lặp lại ngắt quãng (Spaced Repetition - SM-2, FSRS), phương pháp nghe chép chính tả (Dictation), nhại giọng (Shadowing), tạo thẻ từ ảnh chụp (OCR + LLM) và luyện hội thoại nhập vai AI. Đây là các phương pháp sư phạm và công nghệ chung của ngành EdTech. | Sao chép nguyên văn các đoạn mã JavaScript/HTML/CSS đã đóng gói (bundle) từ trang web hoặc dịch ngược (decompile) file APK/IPA của [OpenQuiz trên Google Play](https://play.google.com/store/apps/details?id=com.openquiz.ai) / [App Store](https://apps.apple.com/vn/app/openquiz-ai/id6767530658). |
| **Mã nguồn & Thư viện (Licenses)** | Tự viết mã nguồn mới (Clean-room implementation) kết hợp các thư viện mã nguồn mở có giấy phép thương mại tự do (**MIT License** hoặc **Apache 2.0**) như [`ts-fsrs` (MIT License)](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/LICENSE), React Native, Expo, Tailwind CSS. | Sử dụng các thư viện dính giấy phép **GPL / AGPL** (như một số thành phần mã nguồn của Anki Desktop) vào ứng dụng đóng mã nguồn trên App Store mà không công khai mã nguồn theo yêu cầu của giấy phép. |
| **Giao diện (UI/UX) & Thương hiệu** | Tự thiết kế hệ thống Design System riêng (bảng màu, bố cục màn hình, biểu tượng, tên gọi ứng dụng và logo độc lập). | Sao chép y hệt bố cục màn hình, câu chữ quảng cáo (copywriting), hình ảnh minh họa, hoặc đặt tên ứng dụng gây nhầm lẫn với "OpenQuiz", "Quizlet", "Anki" (vi phạm [App Store Guideline 4.1 - Copycats](https://developer.apple.com/app-store/review/guidelines/)). |
| **Học liệu & Bộ từ vựng (Content DB)** | Tự tạo bộ từ vựng bằng AI (LLM), sử dụng dữ liệu từ điển mở (như Wiktionary, WordNet, CEFR lists, CC-CEDICT cho tiếng Trung, JMdict cho tiếng Nhật) hoặc để người dùng tự tạo. | Dùng công cụ cào dữ liệu (scraping/crawling) để lấy các bộ từ vựng, câu ví dụ, file âm thanh hoặc lộ trình học có sẵn trên `openquiz.ai`, hoặc sử dụng trái phép tên sách có bản quyền như *"Vocabulary in Use"* của Cambridge. |
| **Nhãn hiệu các kỳ thi quốc tế** | Ghi rõ tuyên bố miễn trừ trách nhiệm (Disclaimer) giống như [OpenQuiz.ai](https://openquiz.ai/) đang làm: *"Ứng dụng độc lập, không liên kết hoặc được chứng thực bởi IELTS, TOEIC, TOEFL, HSK, JLPT, TOPIK"*. | Đặt tên app lấy trực tiếp tên thương hiệu đã bảo hộ làm từ khóa chính (ví dụ: *"IELTS Official Vocab"*) hoặc dùng logo của ETS, British Council, IDP mà không có giấy phép sẽ bị Apple và Google gỡ app ngay lập tức. |

### 6.2. Chiến lược Công nghệ để Phát triển App iOS & Android Độc lập

Nếu mục tiêu ban đầu chỉ là dùng cá nhân thì **PWA (Web App)** là đủ. Tuy nhiên, khi đưa lên **App Store** và **Google Play**, nếu bạn chỉ đóng gói trang web (WebView wrapper) bằng Capacitor/Cordova mà không có trải nghiệm gốc (Native), Apple sẽ **từ chối phê duyệt ngay lập tức theo điều khoản [Guideline 4.2 (Minimum Functionality)](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper/)**.

Do đó, kiến trúc chuẩn nhất để vừa có Web, vừa có App iOS và Android mượt mà là:
* **Mobile App Framework:** Sử dụng **React Native (với Expo SDK)** hoặc **Flutter**. Nếu bạn đã quen React/Next.js từ bản Web, **Expo (React Native)** cho phép bạn tái sử dụng tới **70–80% code logic TypeScript** (thuật toán `ts-fsrs`, luồng gọi API Gemini/Azure, quản lý trạng thái Zustand/TanStack Query) giữa Web và Mobile, đồng thời biên dịch ra giao diện Native 100% trên iOS và Android.
* **Cơ sở dữ liệu Offline trên Mobile:** Sử dụng **SQLite cục bộ** (`expo-sqlite` hoặc `WatermelonDB`) ngay trên điện thoại để người dùng học từ vựng không cần mạng, kết hợp đồng bộ đám mây (Sync) với **Supabase**.
* **Tính năng Native bắt buộc phải có để vượt qua vòng duyệt App Store:**
  * **Push Notifications:** Nhắc nhở chuỗi ngày học liên tiếp (Streak) và báo khi có từ vựng đến giờ ôn tập SRS.
  * **Haptic Feedback & Native Audio:** Phản hồi rung nhẹ khi lật thẻ/trả lời đúng và thu âm giọng nói độ trễ thấp bằng phần cứng thiết bị.
  * **Home Screen Widgets (Tùy chọn):** Widget hiển thị "Từ vựng của ngày" ngay trên màn hình chính iOS/Android.

### 6.3. Những Điều Kiện Bắt Buộc Khi Phân Phối Trên App Store (iOS) và Google Play (CH Play)

Để ứng dụng được duyệt lên kệ mà không bị từ chối (Reject), bạn cần chuẩn bị kỹ 6 nhóm yêu cầu sau:

| Tiêu chí kiểm duyệt | Yêu cầu trên Apple App Store (iOS) | Yêu cầu trên Google Play Store (CH Play) |
| :--- | :--- | :--- |
| **1. Chi phí & Loại tài khoản Developer** | **$99 / năm** (Apple Developer Program). Có thể đăng ký tài khoản Cá nhân (Individual) hoặc Doanh nghiệp (Organization - cần mã D-U-N-S). | **$25 một lần duy nhất** (Google Play Console). Tuy nhiên, tài khoản Cá nhân và Tổ chức có quy trình duyệt khác nhau (xem mục 2 bên dưới). |
| **2. Quy định Kiểm thử bắt buộc (Testing Gate)** | Không bắt buộc số lượng tester tối thiểu trên TestFlight; đội ngũ Apple App Review sẽ trực tiếp kiểm tra ứng dụng của bạn (thường mất 24–48 giờ). | Với **tài khoản Cá nhân** tạo mới, Google bắt buộc ứng dụng phải vượt qua vòng **Closed Testing với tối thiểu 12 người dùng thực (testers) cài đặt và giữ ứng dụng liên tục trong 14 ngày** trước khi được phép bấm nút xin lên Production ([Google Play Help](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)). Nếu đăng ký **tài khoản Doanh nghiệp (Organization)** có mã D-U-N-S thì được miễn quy định 12 testers / 14 ngày này ([PrimeTestLab](https://primetestlab.com/blog/personal-vs-organization-google-play-account-12-testers)). |
| **3. Hoa hồng & Cổng thanh toán In-App Purchase (IAP)** | Theo [App Store Review Guideline 3.1.1](https://developer.apple.com/app-store/review/guidelines/), mọi tính năng kỹ thuật số mở khóa trong app (như gói Premium AI) **bắt buộc phải thanh toán qua hệ thống In-App Purchase của Apple**. Bạn **không được phép** gắn link hay nút thanh toán qua Stripe, MoMo, chuyển khoản QR bên trong app iOS (nếu vi phạm sẽ bị từ chối duyệt ngay). Hãy đăng ký **Apple Small Business Program** để giảm mức phí hoa hồng của Apple từ 30% xuống còn **15%** (cho doanh thu dưới 1 triệu USD/năm). | Tương tự Apple, mọi giao dịch mua gói Premium bên trong app Android phải đi qua **Google Play Billing** (mức phí **15%** cho 1 triệu USD doanh thu đầu tiên mỗi năm). *Mẹo thực tế:* Bạn có thể tích hợp **RevenueCat** (miễn phí tới $2.500 doanh thu/tháng) để quản lý chung gói đăng ký (Subscription) cho cả iOS, Android và Web trong một SDK duy nhất. |
| **4. Quy định Xóa tài khoản & Quyền riêng tư** | Theo [Guideline 5.1.1(v)](https://developer.apple.com/news/?id=i71db0mv), nếu ứng dụng có tính năng tạo tài khoản, **bắt buộc phải có nút "Xóa tài khoản" (Delete Account) trực tiếp bên trong cài đặt ứng dụng** để xóa toàn bộ dữ liệu người dùng (chỉ để lại email liên hệ hỗ trợ như `official@...` trên web là không đủ đối với App Store). Đồng thời, nếu có đăng nhập bằng Google/Facebook, bạn **bắt buộc phải tích hợp thêm "Sign in with Apple"**. | Bắt buộc có chức năng xóa tài khoản ngay trong app **VÀ** phải cung cấp thêm một đường dẫn URL trên web (Web link) cho phép người dùng yêu cầu xóa tài khoản/dữ liệu ngay cả khi họ đã gỡ cài đặt ứng dụng khỏi điện thoại. |
| **5. Khai báo quyền phần cứng & Dữ liệu AI** | Phải khai báo rõ lý do xin quyền Microphone (`NSMicrophoneUsageDescription` — để chấm điểm phát âm) và Camera/Photo Library (`NSCameraUsageDescription` — để chụp ảnh tạo flashcard). Ngoài ra, cần thông báo rõ dữ liệu giọng nói/ảnh được gửi tới bên thứ ba (như OpenAI/Google/Azure) để xử lý AI trong bảng App Privacy. | Phải điền đầy đủ bảng **Data Safety** (An toàn dữ liệu) trên Play Console, nêu rõ việc thu thập dữ liệu âm thanh (Audio recordings), hình ảnh và mục đích sử dụng. |
| **6. Kiểm duyệt Nội dung do AI tạo (UGC / AI Safety)** | Vì ứng dụng của bạn có tính năng **AI Roleplay Conversation** (chat/hội thoại tự do với AI), cả Apple và Google đều yêu cầu ứng dụng phải có: (1) Bộ lọc nội dung không phù hợp (Content Moderation), và (2) Nút **"Báo cáo phản hồi AI không phù hợp" (Report/Flag offensive AI output)** ngay trong màn hình hội thoại. | Tương tự iOS, Google Play áp dụng chính sách **AI-Generated Content Policy** bắt buộc phải có tính năng cho phép người dùng báo cáo (Report) các câu trả lời sai lệch hoặc nhạy cảm do AI sinh ra. |

### 6.4. Lưu ý Pháp lý & Thuế tại Việt Nam khi Thương mại hóa
Khi phát hành ứng dụng có thu phí hoặc đặt quảng cáo từ Việt Nam:
* **Bảo mật API Keys (Kỹ thuật sống còn):** Tuyệt đối không nhúng trực tiếp API Key của Gemini, OpenAI hay Azure Speech vào trong mã nguồn ứng dụng di động (vì hacker có thể dịch ngược file APK/IPA để lấy cắp key trong vài phút). Toàn bộ lệnh gọi AI phải đi qua **Backend Server / Edge Functions (như Supabase Edge Functions hoặc Next.js API)** có xác thực JWT Token của người dùng và giới hạn số lượt gọi (Rate Limiting).
* **Nghĩa vụ Thuế và Pháp nhân tại Việt Nam:** Apple và Google hiện đều khấu trừ thuế nhà thầu / thuế GTGT theo quy định tại thị trường Việt Nam và chuyển phần doanh thu còn lại về tài khoản ngân hàng của bạn. Nếu bạn phát triển lâu dài và muốn tích hợp thêm cổng thanh toán nội địa (QR/MoMo/ZaloPay) trên **phiên bản Website** (tách biệt với luồng IAP trong app iOS/Android) giống như cách [Công ty TNHH OpenQuiz](https://thuvienphapluat.vn/ma-so-thue/cong-ty-tnhh-openquiz-mst-2902266403.html) đang làm, bạn sẽ cần đăng ký Hộ kinh doanh cá thể hoặc Công ty TNHH, đồng thời thực hiện thủ tục thông báo/đăng ký ứng dụng thương mại điện tử với Bộ Công Thương theo [Nghị định 52/2013/NĐ-CP](https://thuvienphapluat.vn/van-ban/Thuong-mai/Nghi-dinh-52-2013-ND-CP-thuong-mai-dien-tu-187901.aspx) (được sửa đổi, bổ sung bởi Nghị định 85/2021/NĐ-CP).
