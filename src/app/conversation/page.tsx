"use client";

import { useState } from "react";
import { RoleplayScenario, ConversationMessage } from "@/types";
import { playNativePronunciation } from "@/lib/audio";
import {
  MessageSquare,
  Sparkles,
  Send,
  Volume2,
  CheckCircle2,
  User,
  Bot,
  RotateCcw,
} from "lucide-react";

const SCENARIOS: RoleplayScenario[] = [
  {
    id: "tech-interview",
    title: "Phỏng vấn Kỹ sư phần mềm (Job Interview)",
    description: "Nhà tuyển dụng công nghệ Silicon Valley phỏng vấn về kinh nghiệm giải quyết điểm nghẽn và năng lực phục hồi khi hệ thống gặp sự cố.",
    aiPersona: "Senior Engineering Hiring Manager",
    initialMessage: "Welcome to our technical interview! Can you tell me about a time when you encountered a severe bottleneck in your project and how you stayed resilient to overcome it?",
    targetWords: ["bottleneck", "resilient", "viable"],
  },
  {
    id: "business-standup",
    title: "Cuộc họp Sprint Planning & Chiến lược",
    description: "Trao đổi với Product Lead về giải pháp tận dụng công nghệ mới và liên hệ cập nhật tiến độ tuần tới.",
    aiPersona: "Product Director",
    initialMessage: "Good morning team! We need to finalize the quarterly roadmap. How can we leverage our AI capabilities to streamline operations before we touch base next week?",
    targetWords: ["leverage", "touch base", "ubiquitous"],
  },
];

export default function ConversationPage() {
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario>(SCENARIOS[0]);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: "msg-initial",
      role: "assistant",
      content: SCENARIOS[0].initialMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSelectScenario = (sc: RoleplayScenario) => {
    setSelectedScenario(sc);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: sc.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setUsedWords([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    // Check target words used
    const newlyUsed = selectedScenario.targetWords.filter((w) =>
      userText.toLowerCase().includes(w.toLowerCase())
    );
    const updatedUsedWords = Array.from(new Set([...usedWords, ...newlyUsed]));
    setUsedWords(updatedUsedWords);

    const userMsg: ConversationMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Simulate/call Gemini roleplay response
      const prompt = `
Bạn là ${selectedScenario.aiPersona} trong kịch bản "${selectedScenario.title}".
Lịch sử hội thoại:
${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}
user: ${userText}

Nhiệm vụ:
Đáp lại câu trả lời của user bằng tiếng Anh tự nhiên (2-3 câu), thể hiện sự thấu hiểu câu trả lời và đặt thêm một câu hỏi tiếp nối để kích thích hội thoại.
`;

      const aiRes = await fetch("/api/ai/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetWords: selectedScenario.targetWords,
          userSentence: userText,
          promptQuestion: selectedScenario.title,
        }),
      });

      let aiReply = "That's a very clear explanation. How do you envision maintaining this progress moving forward?";
      if (aiRes.ok) {
        const data = await aiRes.json();
        if (data.evaluation?.naturalRewrite) {
          aiReply = `Great response! To build upon what you said about '${newlyUsed.join(", ") || "that"}', what would be the next step your team should prioritize?`;
        }
      }

      const botMsg: ConversationMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "assistant",
        content: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      playNativePronunciation(aiReply);
    } catch (err) {
      console.error("Roleplay error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider mb-2 dark:bg-brand-950/60 dark:text-brand-300">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>AI Native Speaker Roleplay</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Hội Thoại Nhập Vai Tình Huống AI
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          AI đóng vai người bản xứ và ép bạn phải kích hoạt đúng các từ vựng mục tiêu trong cuộc trò chuyện thực tế.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scenarios & Word Goals */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chọn kịch bản mô phỏng:
            </h3>

            {SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <div
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 dark:border-brand-700"
                      : "border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sc.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sc.description}</p>
                </div>
              );
            })}
          </div>

          {/* Goal Tracker: Target words */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Từ mục tiêu cần kích hoạt:
              </h3>
              <span className="text-xs font-semibold text-brand-600">
                {usedWords.length} / {selectedScenario.targetWords.length}
              </span>
            </div>

            <div className="space-y-2">
              {selectedScenario.targetWords.map((word) => {
                const isUsed = usedWords.includes(word);
                return (
                  <div
                    key={word}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium ${
                      isUsed
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-bold"
                        : "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    <span>{word}</span>
                    {isUsed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Chưa dùng</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chat Box */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col h-[600px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedScenario.aiPersona}
                </h3>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang trực tuyến (AI Native Speaker)
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelectScenario(selectedScenario)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Bắt đầu lại cuộc hội thoại"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isMe = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isMe
                        ? "bg-brand-600 text-white"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    }`}
                  >
                    {isMe ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-brand-600 text-white rounded-tr-none"
                          : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white rounded-tl-none"
                      }`}
                    >
                      <p>{msg.content}</p>

                      {!isMe && (
                        <button
                          onClick={() => playNativePronunciation(msg.content)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Nghe phát âm</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:0.2s]">●</span>
                <span className="animate-bounce [animation-delay:0.4s]">●</span>
                <span>AI đang suy nghĩ phản hồi...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Gõ tin nhắn tiếng Anh của bạn (hãy dùng từ mục tiêu)..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
