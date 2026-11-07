# OpenPronounce Local AI Service

Hệ thống chấm điểm phát âm tiếng Anh mã nguồn mở cục bộ (Phoneme-level ASR & DTW Alignment), thay thế hoàn toàn các model thương mại tính phí (Azure Speech, SpeechAce).

## Mô hình hoạt động
- **Acoustic Embeddings & Transcription**: `facebook/wav2vec2-large-960h`
- **Phoneme Recognition & Error Detection**: `facebook/wav2vec2-lv-60-espeak-cv-ft` + `phonemizer` (eSpeak-NG)
- **Alignment & Prosody Scoring**: Dynamic Time Warping (FastDTW), F0 pitch extraction và Energy contour
- **Framework API**: FastAPI + Uvicorn tại `http://127.0.0.1:8000`

## Khởi động Service

```bash
# Cách 1: Qua npm script tại thư mục gốc của project
npm run openpronounce:start

# Cách 2: Chạy trực tiếp script
bash services/openpronounce/run_server.sh
```

## Tính năng Offline 100% & Tối ưu tốc độ (Fast Offline TTS)
- **Engine TTS mẫu**: Tích hợp `espeak-ng` trực tiếp làm backend TTS tham chiếu, xử lý âm thanh mẫu chỉ mất **~50ms** (so với 2+ phút khi dùng Google Translate TTS qua mạng).
- **Zero Internet Dependency**: Không phụ thuộc kết nối ngoài, không bị timeout, không bị chặn bởi firewall doanh nghiệp.

## Kiểm tra sức khỏe Service

```bash
# Kiểm tra trực tiếp uvicorn
npm run openpronounce:health

# Kiểm tra qua Next.js health API
curl http://localhost:3001/api/speech/health
# Output: {"online":true,"message":"OpenPronounce engine is online & ready (Tier 1 Default)","url":"http://127.0.0.1:8000"}
```

## Tích hợp vào Next.js App
Khi service đang chạy ở cổng 8000, API backend Next.js (`src/lib/azure-speech.ts`) sẽ **tự động ưu tiên Tier 1 (OpenPronounce)** để chấm điểm phát âm chi tiết đến từng âm vị, hiển thị badge:
`OpenPronounce (Local Wav2Vec2 + DTW)`.
Nếu service tắt, Next.js sẽ tự động chuyển sang chế độ dự phòng mà không gây gián đoạn người dùng.

