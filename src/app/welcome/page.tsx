"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Mic } from "lucide-react";
import { loginDemoUser } from "@/lib/auth";
import { useSession } from "@/hooks/useSession";
import { buttonClass } from "@/components/ui/button";
import { CameraDoc, SpeakingLearner } from "@/components/illustrations";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "tao", label: "Tạo" },
  { id: "ghi-nho", label: "Ghi nhớ" },
  { id: "van-dung", label: "Vận dụng" },
  { id: "luyen-noi", label: "Nói" },
];

const SHELF = [
  { code: "EN", color: "bg-deck-blue", title: "IELTS Academic Mastery", sub: "Band 7.0 đến 8.5" },
  { code: "FR", color: "bg-deck-teal", title: "Tiếng Pháp A1", sub: "Giao tiếp hằng ngày" },
  { code: "EN", color: "bg-deck-amber", title: "Silicon Valley & Tech", sub: "Họp, demo, phỏng vấn" },
  { code: "EN", color: "bg-deck-rose", title: "Sinh học 11 · Bài 5", sub: "Tạo từ ảnh chụp sách" },
  { code: "EN", color: "bg-deck-violet", title: "TOEIC 650+", sub: "Từ vựng công sở" },
];

function Word({ tone, children }: { tone: "good" | "fair" | "poor"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "border-b-2",
        tone === "good" && "border-solid border-good text-good",
        tone === "fair" && "border-dotted border-fair text-fair",
        tone === "poor" && "border-dashed border-poor text-poor"
      )}
    >
      {children}
    </span>
  );
}

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2.6} />
      <span>{children}</span>
    </li>
  );
}

function Ui({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-line bg-surface p-5 shadow-raised sm:p-6", className)}>{children}</div>;
}

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useSession();

  const tryDemo = () => {
    loginDemoUser();
    router.push("/home");
  };

  const primaryCta = user ? (
    <Link href="/home" className={buttonClass("primary", "lg")}>Vào trang học của bạn</Link>
  ) : (
    <Link href="/login?mode=signup" className={buttonClass("primary", "lg")}>Bắt đầu miễn phí</Link>
  );

  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-14 lg:pb-24 lg:pt-14">
        <div>
          <h1 className="text-[40px] font-extrabold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[58px]">
            Học từ vựng cho đến khi <span className="text-primary">nói ra được</span>.
          </h1>
          <p className="mt-5 max-w-[34em] text-lg leading-relaxed text-ink-2 sm:text-[19px]">
            Tạo bộ từ từ ảnh chụp sách, tài liệu hay bất kỳ chủ đề nào. LingoPulse nhắc bạn ôn đúng lúc, cho bạn viết và
            nghe lại, rồi chấm phát âm từng từ khi bạn nói.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {primaryCta}
            {!user && (
              <button type="button" onClick={tryDemo} className={buttonClass("secondary", "lg")}>
                Dùng thử tài khoản demo
              </button>
            )}
          </div>
          <p className="mt-4 text-sm text-mute">Học được cả khi không có mạng. Không cần thẻ thanh toán.</p>
        </div>

        <div className="relative h-[540px] rounded-3xl bg-primary-soft sm:h-[580px]" aria-label="Ví dụ minh họa: một thẻ từ và kết quả chấm phát âm">
          <SpeakingLearner className="absolute right-6 top-5 hidden h-auto w-[170px] sm:block" />
          <div className="absolute left-4 top-6 w-[280px] animate-fade-up rounded-2xl border border-line bg-surface p-6 shadow-lift sm:left-9 sm:top-9 sm:w-[300px]">
            <div className="text-[12.5px] font-semibold text-mute">IELTS Academic · Anh → Việt</div>
            <div className="mt-1.5 text-[34px] font-bold tracking-tight">resilient</div>
            <div className="text-mute">/rɪˈzɪl.i.ənt/ · tính từ</div>
            <hr className="my-4 border-dashed border-line" />
            <div className="text-[15px] text-ink-2">kiên cường, mau phục hồi sau khó khăn</div>
            <div className="mt-[18px] grid grid-cols-4 gap-1.5 text-center text-[12.5px] font-semibold">
              <span className="rounded-lg bg-subtle py-2 text-ink-2">Lại</span>
              <span className="rounded-lg bg-subtle py-2 text-ink-2">Khó</span>
              <span className="rounded-lg bg-primary py-2 text-white">Được</span>
              <span className="rounded-lg bg-subtle py-2 text-ink-2">Dễ</span>
            </div>
          </div>
          <div
            className="absolute bottom-12 right-4 w-[300px] animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-lift [animation-delay:120ms] sm:right-8 sm:w-[330px] sm:p-[22px]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-mute">PronScore</span>
              <span className="text-[30px] font-extrabold text-good">82</span>
            </div>
            <p className="mt-2 text-lg leading-[1.8]">
              <Word tone="good">She</Word> <Word tone="good">is</Word> <Word tone="fair">remarkably</Word>{" "}
              <Word tone="poor">resilient</Word>.
            </p>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-xs text-mute">
              {[["Chính xác", 78], ["Trôi chảy", 88], ["Đầy đủ", 100], ["Ngữ điệu", 74]].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd className="text-base font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <span className="absolute bottom-4 left-6 text-xs text-mute">Dữ liệu minh họa</span>
        </div>
      </section>

      {/* The loop */}
      <section id="cach-hoc" className="scroll-mt-20 bg-bg py-20 sm:py-24">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <h2 className="max-w-[18em] text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-[40px]">
            Một vòng học trọn vẹn, từ lúc gặp từ mới đến lúc nói thành câu.
          </h2>
          <p className="mt-3.5 max-w-[36em] text-lg text-ink-2">
            Ứng dụng thẻ ghi nhớ thường dừng ở bước nhận ra từ. LingoPulse đưa mỗi từ đi tiếp qua viết, nghe và nói.
          </p>
          <nav className="mb-2 mt-10 flex flex-wrap items-center gap-2.5" aria-label="Các bước học">
            {STEPS.map((s, i) => (
              <span key={s.id} className="flex items-center gap-2.5">
                <a
                  href={`#${s.id}`}
                  className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-2 pl-2 pr-4 font-semibold text-ink-2 transition-colors hover:border-primary hover:text-primary-ink"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-[13px] text-primary-ink">{i + 1}</span>
                  {s.label}
                </a>
                {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-line-strong" aria-hidden="true" />}
              </span>
            ))}
          </nav>

          <div className="divide-y divide-line">
            <article id="tao" className="grid scroll-mt-24 items-center gap-10 py-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
              <div>
                <h3 className="text-[28px] font-bold leading-tight tracking-tight">Biến tài liệu của bạn thành bộ từ</h3>
                <p className="mt-3 max-w-[30em] text-[17px] text-ink-2">
                  Chụp một trang sách, tải lên PDF hay file Word. AI tìm những từ quan trọng và điền sẵn phiên âm, nghĩa
                  tiếng Việt và câu ví dụ.
                </p>
                <ul className="mt-4 grid gap-2 text-ink-2">
                  <Tick>Hoặc gõ từ và tra từ điển Cambridge tự động</Tick>
                  <Tick>Hoặc chọn sẵn trong thư viện theo kỳ thi, chủ đề, trình độ</Tick>
                </ul>
              </div>
              <Ui>
                <div className="flex items-center gap-4 rounded-xl border-[1.5px] border-dashed border-line-strong p-4 text-ink-2">
                  <CameraDoc className="h-14 w-16 shrink-0" />
                  <div>
                    <b className="text-ink">Sinh học 11, trang 42.jpg</b>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {["PNG", "JPG", "PDF", "DOCX", "TXT"].map((f) => (
                        <span key={f} className="rounded-md bg-subtle px-2 py-0.5 text-xs font-semibold text-mute">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {[["photosynthesis", "quang hợp", "/ˌfəʊ.təʊˈsɪn.θə.sɪs/"], ["chlorophyll", "chất diệp lục", "/ˈklɒr.ə.fɪl/"], ["stomata", "khí khổng", "/ˈstəʊ.mə.tə/"]].map(([t, d, ipa]) => (
                    <div key={t} className="grid grid-cols-[1fr_1fr] items-center gap-3 rounded-[10px] border border-line px-3 py-2.5 text-[14.5px] sm:grid-cols-[150px_1fr_auto]">
                      <b className="font-semibold">{t}</b>
                      <span className="text-ink-2">{d}</span>
                      <small className="hidden text-right text-mute sm:block">{ipa}</small>
                    </div>
                  ))}
                </div>
              </Ui>
            </article>

            <article id="ghi-nho" className="grid scroll-mt-24 items-center gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
              <div className="lg:order-2">
                <h3 className="text-[28px] font-bold leading-tight tracking-tight">Ôn đúng lúc sắp quên</h3>
                <p className="mt-3 max-w-[30em] text-[17px] text-ink-2">
                  Thuật toán lặp lại ngắt quãng (FSRS) tính ngày ôn tiếp theo cho từng thẻ. Mỗi ngày bạn chỉ cần ôn những
                  thẻ đến hạn, bằng thẻ lật, gõ lại từ hoặc nghe chép.
                </p>
              </div>
              <Ui className="lg:order-1">
                <div className="grid gap-3">
                  {[["Lại", 6, "10 phút"], ["Khó", 22, "1 ngày"], ["Được", 52, "4 ngày"], ["Dễ", 100, "11 ngày"]].map(([k, w, t]) => (
                    <div key={k} className="grid grid-cols-[64px_1fr_76px] items-center gap-3.5 text-[14.5px]">
                      <b className="font-semibold">{k}</b>
                      <div className="h-2.5 overflow-hidden rounded-full bg-subtle">
                        <i className="block h-full rounded-full bg-primary" style={{ width: `${w}%` }} />
                      </div>
                      <small className="text-right text-mute">{t}</small>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[13.5px] text-mute">Lần ôn tiếp theo của từ “resilient” theo từng mức đánh giá</p>
              </Ui>
            </article>

            <article id="van-dung" className="grid scroll-mt-24 items-center gap-10 py-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
              <div>
                <h3 className="text-[28px] font-bold leading-tight tracking-tight">Dùng từ trong câu của chính bạn</h3>
                <p className="mt-3 max-w-[30em] text-[17px] text-ink-2">
                  Đặt câu với từ vừa học. AI chỉ ra lỗi ngữ pháp và gợi ý cách viết tự nhiên hơn.
                </p>
              </div>
              <Ui>
                <div className="text-sm text-mute">Đặt câu với “resilient”</div>
                <div className="mt-2 rounded-[10px] border-[1.5px] border-primary px-3.5 py-3 text-[17px]">
                  Children is very resilient after the storm.
                </div>
                <div className="mt-3.5 rounded-[10px] bg-good-soft px-3.5 py-3 text-[14.5px] text-good">
                  Gợi ý: Children <s className="text-poor">is</s> <b>are</b> remarkably resilient after the storm.
                </div>
              </Ui>
            </article>

            <article id="luyen-noi" className="grid scroll-mt-24 items-center gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
              <div className="lg:order-2">
                <h3 className="text-[28px] font-bold leading-tight tracking-tight">Nói thành tiếng và xem điểm từng từ</h3>
                <p className="mt-3 max-w-[30em] text-[17px] text-ink-2">
                  Ghi âm câu ví dụ. PronScore chấm độ chính xác, độ trôi chảy, độ đầy đủ và ngữ điệu, rồi tô màu từng từ
                  để bạn biết cần sửa ở đâu. Sau đó luyện hội thoại nhập vai với AI.
                </p>
              </div>
              <Ui className="lg:order-1">
                <div className="flex items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-white ring-8 ring-primary-soft">
                    <Mic className="h-[22px] w-[22px]" />
                  </span>
                  <div className="flex h-10 items-center gap-[3px]" aria-hidden="true">
                    {[10, 22, 34, 18, 28, 38, 20, 12, 26, 32, 16, 8].map((h, i) => (
                      <i key={i} className="block w-1 rounded-full bg-primary/40" style={{ height: h }} />
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-lg leading-[1.8]">
                  “The team stayed <Word tone="poor">resilient</Word> <Word tone="good">through</Word> the{" "}
                  <Word tone="fair">crisis</Word>.”
                </p>
                <p className="mt-2 text-[13.5px] text-mute">Gạch liền: tốt · chấm: tạm được · gạch đứt: cần luyện lại</p>
              </Ui>
            </article>
          </div>
        </div>
      </section>

      {/* Any language */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <h2 className="max-w-[18em] text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-[40px]">
            Ngôn ngữ nào, trình độ nào, tài liệu nào cũng được.
          </h2>
          <p className="mt-3.5 max-w-[36em] text-lg text-ink-2">
            Ôn thi IELTS, học tiếng Pháp từ đầu, hay thuộc từ vựng của một bài trên lớp. Mỗi bộ từ là của riêng bạn.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-5">
            {SHELF.map((d) => (
              <div key={d.title} className="rounded-[14px] border border-line bg-surface p-[18px]">
                <span className={cn("grid h-10 w-8 place-items-center rounded-md text-xs font-bold text-white dark:text-bg", d.color)}>{d.code}</span>
                <h3 className="mt-3.5 text-[15.5px] font-semibold leading-snug">{d.title}</h3>
                <p className="mt-1 text-[13px] text-mute">{d.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">Ví dụ minh họa các bộ từ bạn có thể tạo hoặc chọn.</p>
          <Link href="/decks" className="mt-5 inline-flex items-center gap-1 font-semibold text-primary-ink hover:underline">
            Xem thư viện bộ từ <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Close */}
      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="grid items-center gap-8 rounded-3xl bg-primary p-8 text-white sm:p-14 lg:grid-cols-[1fr_auto] lg:gap-10">
            <div>
              <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-[40px]">Bắt đầu bộ từ đầu tiên của bạn hôm nay.</h2>
              <p className="mt-3 text-lg text-white/90">
                Tài khoản mới bắt đầu trống, bạn chọn học gì. Hoặc dùng thử tài khoản demo có sẵn dữ liệu.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <Link href="/home" className={buttonClass("inverse", "lg")}>Vào trang học</Link>
              ) : (
                <>
                  <Link href="/login?mode=signup" className={buttonClass("inverse", "lg")}>Tạo tài khoản</Link>
                  <button
                    type="button"
                    onClick={tryDemo}
                    className={buttonClass("ghost", "lg", "border border-white/50 text-white hover:bg-white/10 hover:text-white")}
                  >
                    Dùng thử demo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
