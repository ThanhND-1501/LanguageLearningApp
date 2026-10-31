"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Mic,
  Brain,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Zap,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Compass,
  Play,
  Volume2,
  Edit3,
  Layers,
  GraduationCap,
  Briefcase,
  Globe,
} from "lucide-react";
import { getActiveUser } from "@/lib/auth";
import { UserProfile } from "@/types";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setCurrentUser(getActiveUser());
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 py-8 sm:py-12">
      {/* 1. Logged-in User Quick Welcome Banner */}
      {currentUser && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 dark:from-brand-950/40 dark:to-indigo-950/40 dark:border-brand-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Chào mừng trở lại, {currentUser.name}!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mục tiêu hiện tại: <span className="font-semibold text-brand-600 dark:text-brand-400">{currentUser.targetLevel}</span> • Chuỗi học tập: <span className="font-semibold text-amber-600 dark:text-amber-400">{currentUser.streakDays || 1} ngày 🔥</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/profile"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Xem hồ sơ & kho từ vựng</span>
              </Link>
              <Link
                href="/decks"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                <span>Học tiếp</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero Section (Introduction to LingoPulse AI) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-indigo-600 to-violet-800 p-8 sm:p-14 lg:p-16 text-white shadow-2xl shadow-brand-500/15">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide uppercase text-indigo-100 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Nền Tảng Ngoại Ngữ Phản Xạ & Lặp Lại Ngắt Quãng</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Chuyển hóa từ vựng thụ động thành <span className="underline decoration-amber-400 decoration-wavy underline-offset-8">phản xạ nói tự nhiên</span>.
            </h1>

            <p className="text-base sm:text-lg text-indigo-100 leading-relaxed max-w-2xl">
              LingoPulse AI kết hợp khoa học não bộ (Spaced Repetition SM-2), công nghệ chấm điểm phát âm 4 chiều PronScore™ (Azure AI), và bộ tra cứu từ điển ngữ cảnh Cambridge giúp bạn ghi nhớ sâu và tự tin giao tiếp chuẩn bản xứ.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href={currentUser ? "/decks" : "/login"}
                className="inline-flex items-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white text-brand-700 font-extrabold text-sm sm:text-base shadow-lg hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
              >
                <span>{currentUser ? "Bắt đầu học ngay" : "Trải nghiệm miễn phí ngay"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/decks"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-bold text-sm sm:text-base border border-indigo-400/30 backdrop-blur-sm transition-colors"
              >
                <BookOpen className="h-4 w-4 text-indigo-300" />
                <span>Khám phá các bộ từ vựng</span>
              </Link>
            </div>

            {/* Quick Guarantees / Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-indigo-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Khoa học não bộ SM-2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Từ điển Cambridge + Auto-Failover</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Local-First 0ms & Cloud Sync</span>
              </div>
            </div>
          </div>

          {/* Ambient Lighting Background Accents */}
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute right-12 -bottom-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
        </div>
      </section>

      {/* 3. Core Features Showcase (Trụ Cột Tính Năng Đột Phá) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Công nghệ & Giải pháp
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tất cả những gì bạn cần để làm chủ vốn từ thực chiến
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Không còn tình trạng học trước quên sau hay thuộc mặt chữ nhưng ấp úng khi giao tiếp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-300 hover:shadow-md transition-all space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-brand-600 dark:bg-indigo-950/60 dark:text-brand-300 flex items-center justify-center">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Spaced Repetition (SM-2)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tối ưu hóa chu kỳ ôn tập tự động theo đường cong quên Ebbinghaus. Các từ khó sẽ được lặp lại với tần suất cao, từ thành thạo sẽ giãn cách chu kỳ, giúp ghi nhớ vĩnh viễn với thời gian ôn ngắn nhất.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-300 hover:shadow-md transition-all space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Tra cứu Cambridge & Auto-Failover
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tự động hóa bóc tách phiên âm IPA, âm thanh phát âm bản xứ MP3 chuẩn UK/US, định nghĩa, nghĩa tiếng Việt và câu ví dụ ngữ cảnh với cơ chế dự phòng đa tầng (Cambridge &rarr; Open Dict &rarr; Wiktionary &rarr; Tatoeba).
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-300 hover:shadow-md transition-all space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300 flex items-center justify-center">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Chấm điểm PronScore™ (Azure Speech)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Đánh giá giọng nói 4 chiều toàn diện: Độ chính xác âm vị (Accuracy), Độ lưu loát (Fluency), Độ hoàn thiện (Completeness) và Ngữ điệu tự nhiên (Prosody) theo từng từ trong câu ngữ cảnh.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-300 hover:shadow-md transition-all space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Tạo thẻ từ ảnh chụp (Multimodal AI)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Chụp ảnh trang sách, tài liệu giáo trình hoặc nhập chủ đề IELTS bất kỳ. AI Vision OCR sẽ phân tích văn bản, trích xuất danh sách từ vựng trọng tâm kèm định nghĩa và câu hỏi phản xạ mở.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-300 hover:shadow-md transition-all space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Luyện hội thoại & Check ngữ pháp
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Nhập vai giao tiếp với gia sư ảo AI theo tình huống thực tế (phỏng vấn, đàm phán, du lịch). Hệ thống phân tích tức thì các lỗi ngữ pháp và gợi ý cấu trúc diễn đạt tự nhiên hơn.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-brand-300 hover:shadow-md transition-all space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center">
              <Cloud className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Kiến trúc Hybrid Local-First & Cloud
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tốc độ phản hồi 0ms trên máy tính với LocalStorage, hoạt động ngoại tuyến mượt mà và tự động đồng bộ hai chiều lên Supabase Cloud khi có kết nối mạng để học trên đa thiết bị.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Methodology Section (Quy Trình Học 4 Giai Đoạn) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Phương pháp luận
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Vòng lặp học tập phản xạ 4 giai đoạn
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Phương pháp toàn diện giúp chuyển đổi từ vựng từ trạng thái nhận biết thụ động sang sử dụng chủ động trong lời nói.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Step 1 */}
          <div className="relative p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-brand-700 dark:bg-indigo-950 dark:text-brand-300 flex items-center justify-center font-extrabold text-sm">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Flashcard Lật Thẻ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tiếp cận từ vựng qua phiên âm IPA chuẩn, nghĩa tiếng Việt và câu ví dụ ngữ cảnh. Đánh giá độ khó (Again, Hard, Good, Easy) để máy tính thuật toán SRS.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center font-extrabold text-sm">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Write (Gõ từ chủ động)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Khắc sâu trí nhớ chính tả bằng cách gõ chính xác từ vựng theo nghĩa tiếng Việt gợi mở. Giúp kích hoạt trí nhớ chủ động thay vì chỉ nhìn nhận diện.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-extrabold text-sm">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Dictation (Nghe chép)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Luyện đôi tai thính nhạy với phát âm người bản xứ và chép lại toàn bộ câu ngữ cảnh thực tế, rèn luyện đồng thời kỹ năng nghe và ngữ pháp câu.
            </p>
          </div>

          {/* Step 4 */}
          <div className="relative p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 flex items-center justify-center font-extrabold text-sm">
              4
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Phản Xạ Nói & PronScore™</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ứng dụng từ vựng vào câu nói phản xạ thực tế qua micro. Trí tuệ nhân tạo phân tích phát âm và chấm điểm ngay lập tức trên thang điểm 100.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Featured Learning Paths (Lộ Trình Từ Vựng Tiêu Biểu) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Lộ trình mẫu chuẩn hóa
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Các bộ từ vựng định hướng mục tiêu
            </h2>
          </div>
          <Link
            href="/decks"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <span>Khám phá kho từ vựng</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Path 1 */}
          <div className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-brand-600 dark:bg-indigo-950 dark:text-brand-300 flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                IELTS Academic Mastery
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tập trung vào các thuật ngữ và collocations học thuật Band 7.0 - 8.5 giúp ghi điểm tối đa trong phần thi IELTS Writing & Speaking.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-brand-700 dark:bg-indigo-950 dark:text-brand-300">
                  Band 7.0 - 8.5
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Học thuật
                </span>
              </div>
            </div>

            <Link
              href="/decks"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 pt-2"
            >
              <span>Xem chi tiết lộ trình &rarr;</span>
            </Link>
          </div>

          {/* Path 2 */}
          <div className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Silicon Valley & Tech Communication
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thành ngữ công nghệ, từ vựng kinh doanh và thuật ngữ dùng hàng ngày trong các buổi standup, sprint planning và họp đối tác quốc tế.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Doanh nghiệp & IT
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Giao tiếp làm việc
                </span>
              </div>
            </div>

            <Link
              href="/decks"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 pt-2"
            >
              <span>Xem chi tiết lộ trình &rarr;</span>
            </Link>
          </div>

          {/* Path 3 */}
          <div className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Everyday Fluent Reflex (B1 - B2)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Xây dựng phản xạ nói tự nhiên, phá bỏ thói quen dịch nhẩm trong đầu với các ngữ cảnh đời sống thường nhật, nhà hàng, du lịch và giao tiếp.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  B1 - B2 Giao tiếp
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Đời sống
                </span>
              </div>
            </div>

            <Link
              href="/decks"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-2"
            >
              <span>Xem chi tiết lộ trình &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Scientific Proof / Statistics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-brand-400">92%+</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Tỷ lệ ghi nhớ từ vựng sau 30 ngày</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-400">4 Chiều</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Đánh giá phát âm chuẩn Azure AI</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">0ms</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Độ trễ phản hồi nhờ Local-First</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-violet-400">100%</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Khả dụng với Multi-Tier Failover</p>
          </div>
        </div>
      </section>

      {/* 7. Bottom Call to Action (CTA) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-700 text-white text-center space-y-6 shadow-xl">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Sẵn sàng làm chủ ngoại ngữ theo phương pháp khoa học?
            </h2>
            <p className="text-sm sm:text-base text-indigo-100">
              Bắt đầu xây dựng kho từ vựng cá nhân hóa và luyện phản xạ giao tiếp tự nhiên cùng LingoPulse AI ngay hôm nay.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={currentUser ? "/profile" : "/login"}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-brand-700 font-extrabold text-sm shadow-md hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95"
            >
              <span>{currentUser ? "Vào hồ sơ cá nhân" : "Tạo tài khoản miễn phí"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/decks"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-bold text-sm border border-indigo-400/30 transition-colors"
            >
              <span>Xem kho từ vựng</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
