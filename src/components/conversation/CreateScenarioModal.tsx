"use client";

import { useState } from "react";
import { Sparkles, Loader2, Lightbulb, Bot, X, Check } from "lucide-react";
import { RoleplayScenario } from "@/types";
import { buttonClass } from "@/components/ui/button";

interface CreateScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioCreated: (scenario: RoleplayScenario) => void;
}

const PRESET_IDEAS = [
  {
    label: "✈️ Phỏng vấn Visa Mỹ",
    instruction: "Luyện phỏng vấn xin visa du lịch Mỹ tại Đại sứ quán. Nhân viên lãnh sự hỏi về mục đích chuyến đi, lịch trình, công việc và ràng buộc tài chính tại Việt Nam.",
    suggestedWords: "itinerary, ties, financial proof, duration",
  },
  {
    label: "💼 Đàm phán lương & Offer",
    instruction: "Đàm phán mức lương, thưởng và chế độ làm việc từ xa (remote work) với nhà tuyển dụng sau khi nhận được thư mời làm việc.",
    suggestedWords: "compensation, counteroffer, benchmark, flexible",
  },
  {
    label: "🏨 Phàn nàn dịch vụ khách sạn",
    instruction: "Tôi nhận phòng khách sạn bị ồn và máy lạnh không hoạt động. Tôi muốn phàn nàn với quản lý lễ tân và yêu cầu đổi phòng hạng cao hơn.",
    suggestedWords: "unacceptable, upgrade, inconvenience, rectify",
  },
  {
    label: "☕ Kết bạn đồng nghiệp mới",
    instruction: "Trò chuyện làm quen thân mật với một đồng nghiệp người nước ngoài vừa mới gia nhập công ty trong giờ nghỉ trưa.",
    suggestedWords: "onboard, background, collaborate, recommend",
  },
  {
    label: "📈 Trình bày ý tưởng với đối tác",
    instruction: "Thuyết trình và phản biện ý tưởng phát triển sản phẩm công nghệ mới trong buổi họp đối tác quốc tế.",
    suggestedWords: "feasible, scalable, competitive advantage, rollout",
  },
];

const LEVELS = [
  { id: "A2-B1", label: "Cơ bản (A2 - B1)", desc: "Câu ngắn, giao tiếp đời thường" },
  { id: "B1-B2", label: "Trung cấp (B1 - B2)", desc: "Giao tiếp công sở & phản biện" },
  { id: "C1-C2", label: "Nâng cao (C1 - C2)", desc: "Ngôn từ chuyên sâu, tinh tế" },
];

export function CreateScenarioModal({ isOpen, onClose, onScenarioCreated }: CreateScenarioModalProps) {
  const [instruction, setInstruction] = useState("");
  const [level, setLevel] = useState("B1-B2");
  const [targetWordsInput, setTargetWordsInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setInstruction(preset.instruction);
    if (!targetWordsInput.trim()) {
      setTargetWordsInput(preset.suggestedWords);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    const words = targetWordsInput
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    try {
      const res = await fetch("/api/ai/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: instruction.trim(),
          level,
          targetWords: words,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.scenario) {
        throw new Error(data.error || "Không thể tạo kịch bản lúc này. Vui lòng thử lại.");
      }

      onScenarioCreated(data.scenario);
      onClose();
    } catch (err: any) {
      console.error("Create scenario error:", err);
      setErrorMessage(err.message || "Đã xảy ra lỗi khi kết nối tới AI. Vui lòng kiểm tra lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-lift p-6 space-y-5 animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Tạo kịch bản với Gemini AI</h2>
              <p className="text-xs text-ink-2">
                Nhập tình huống bạn muốn thực hành, AI sẽ tự động đóng vai và tạo mục tiêu giao tiếp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-mute hover:bg-subtle hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Suggestion Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-mute">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>Gợi ý chủ đề nhanh:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_IDEAS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs px-2.5 py-1 rounded-lg border border-line bg-subtle hover:border-primary/50 hover:bg-primary-soft text-ink-2 hover:text-primary-ink transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Instruction Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center justify-between">
              <span>Hướng dẫn hoặc mô tả tình huống giao tiếp: <span className="text-poor">*</span></span>
              <span className="text-[11px] text-mute font-normal">{instruction.length}/300 ký tự</span>
            </label>
            <textarea
              required
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ví dụ: Tôi muốn thực hành phỏng vấn visa du lịch Mỹ tại đại sứ quán. Viên chức hỏi về lịch trình du lịch, nghề nghiệp và cam kết quay về Việt Nam..."
              className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none resize-none bg-surface text-ink"
            />
          </div>

          {/* Level Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink">Trình độ mục tiêu:</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => {
                const isSelected = level === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLevel(lvl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary-soft text-primary-ink font-semibold"
                        : "border-line bg-subtle hover:bg-surface text-ink-2"
                    }`}
                  >
                    <div className="text-xs font-bold">{lvl.label}</div>
                    <div className="text-[10px] text-mute mt-0.5 line-clamp-1">{lvl.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Words Input (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ink flex items-center justify-between">
              <span>Từ vựng bạn muốn lồng ghép (tùy chọn):</span>
              <span className="text-[11px] text-mute font-normal">Cách nhau bằng dấu phẩy</span>
            </label>
            <input
              type="text"
              value={targetWordsInput}
              onChange={(e) => setTargetWordsInput(e.target.value)}
              placeholder="Ví dụ: negotiate, viable, streamline (hoặc để trống để AI tự gợi ý)"
              className="w-full rounded-xl border border-line px-3.5 py-2 text-sm focus:border-primary focus:outline-none bg-surface text-ink"
            />
            <p className="text-[11px] text-mute">
              Nếu để trống, Gemini sẽ tự động phân tích bối cảnh và chọn 3-5 từ vựng/thành ngữ đắt giá nhất.
            </p>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-poor-soft border border-poor/30 text-poor text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={buttonClass("ghost", "md")}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!instruction.trim() || isLoading}
              className={buttonClass("primary", "md", "gap-2 min-w-[170px]")}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gemini đang tạo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Tạo kịch bản với AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
