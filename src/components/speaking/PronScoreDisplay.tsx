import { PronScoreResult } from "@/types";
import { getScoreBadgeColor } from "@/lib/utils";
import { Award, CheckCircle2, TrendingUp, Volume2, Mic } from "lucide-react";

interface PronScoreDisplayProps {
  scores: PronScoreResult;
}

export function PronScoreDisplay({ scores }: PronScoreDisplayProps) {
  const badgeInfo = getScoreBadgeColor(scores.pronScore);

  const metrics = [
    { label: "Accuracy (Âm vị)", value: scores.accuracyScore, desc: "Độ chuẩn xác phát âm từng âm tiết" },
    { label: "Fluency (Trôi chảy)", value: scores.fluencyScore, desc: "Độ liền mạch và nhịp ngắt nghỉ" },
    { label: "Completeness (Độ đủ)", value: scores.completenessScore, desc: "Tỷ lệ từ phát âm so với văn bản" },
    { label: "Prosody (Ngữ điệu)", value: scores.prosodyScore, desc: "Trọng âm câu và ngữ điệu tự nhiên" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header with Overall PronScore */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-600" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Bảng điểm phát âm PronScore™
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tích 4 chiều theo chuẩn Azure AI Speech Assessment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-brand-600 dark:text-brand-400">
              {scores.pronScore}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeInfo.bg} ${badgeInfo.text} ${badgeInfo.border}`}>
              {badgeInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Progress Bars */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((m) => {
          const mColor =
            m.value >= 80 ? "bg-emerald-500" : m.value >= 60 ? "bg-amber-400" : "bg-rose-500";
          return (
            <div key={m.label} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">{m.label}</span>
                <span className="font-mono">{m.value}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className={`h-full ${mColor} transition-all duration-500`} style={{ width: `${m.value}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Word-by-word Breakdown */}
      {scores.wordScores && scores.wordScores.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Đánh giá chi tiết từng từ:
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> &ge;80
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> 60-79
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt;60
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {scores.wordScores.map((w, idx) => {
              const colorCls =
                w.score >= 80
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  : w.score >= 60
                  ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";

              return (
                <div
                  key={`${w.word}-${idx}`}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium shadow-xs ${colorCls}`}
                >
                  <span>{w.word}</span>
                  <span className="font-mono text-[10px] opacity-80">({w.score})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
