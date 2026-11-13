"use client";

import { useState, useEffect } from "react";
import { RoleplayScenario, ConversationMessage, UserProfile } from "@/types";
import { getActiveUser } from "@/lib/auth";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario>(SCENARIOS[0]);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: "msg-initial",
      role: "assistant",
      content: SCENARIOS[0].initialMessage,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user);
    setIsAuthChecking(false);
  }, []);

  const handleSelectScenario = (sc: RoleplayScenario) => {
    setSelectedScenario(sc);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: sc.initialMessage,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
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
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 1. Call real AI Roleplay Conversation API (Gemini 2.5 Flash with Groq failover)
      const convoRes = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioTitle: selectedScenario.title,
          aiPersona: selectedScenario.aiPersona,
          targetWords: selectedScenario.targetWords,
          usedWords: updatedUsedWords,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: userText,
        }),
      });

      let aiReply = "";
      if (convoRes.ok) {
        const convoData = await convoRes.json();
        if (convoData.reply) {
          aiReply = convoData.reply;
        }
      }

      if (!aiReply) {
        aiReply = `Great response! To build upon what you said about '${newlyUsed.join(", ") || "that"}', what would be the next step your team should prioritize?`;
      }

      const botMsg: ConversationMessage = {
        id: `msg-bot-${Date.now()}`,
        role: "assistant",
        content: aiReply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      };

      setMessages((prev) => [...prev, botMsg]);
      playNativePronunciation(aiReply);
    } catch (err) {
      console.error("Roleplay error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isAuthChecking && !currentUser) {
    return (
      <AuthGuard
        featureName="Hội Thoại AI Roleplay"
        title="Đăng nhập để trò chuyện với AI"
        description="Tính năng đối thoại nhập vai ngữ cảnh thực tế với gia sư ảo AI yêu cầu đăng nhập để ghi nhớ lịch sử hội thoại và phân tích ngữ pháp."
        backHref="/decks"
        backLabel="Khám phá bộ từ vựng"
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-line">
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Hội thoại</h1>
        <p className="mt-1 text-ink-2">
          Trò chuyện với AI trong một tình huống thực tế và cố dùng các từ mục tiêu trong câu trả lời của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scenarios & Word Goals */}
        <div className="lg:col-span-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-mute">
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
                      ? "border-primary bg-primary-soft"
                      : "border-line hover:bg-subtle"
                  }`}
                >
                  <h4 className="text-sm font-bold text-ink">{sc.title}</h4>
                  <p className="text-xs text-mute mt-1 line-clamp-2">{sc.description}</p>
                </div>
              );
            })}
          </div>

          {/* Goal Tracker: Target words */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-mute">
                Từ mục tiêu cần kích hoạt:
              </h3>
              <span className="text-xs font-semibold text-primary-ink">
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
                        ? "bg-good-soft text-good border-good/25 font-bold"
                        : "bg-subtle text-ink-2 border-line"
                    }`}
                  >
                    <span>{word}</span>
                    {isUsed ? (
                      <CheckCircle2 className="h-4 w-4 text-good" />
                    ) : (
                      <span className="text-[10px] text-mute">Chưa dùng</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chat Box */}
        <div className="lg:col-span-8 rounded-2xl border border-line bg-surface shadow-sm flex flex-col h-[600px] overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary-ink flex items-center justify-center font-bold">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {selectedScenario.aiPersona}
                </h3>
                <p className="text-xs text-good font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
                  Vai do AI đóng
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelectScenario(selectedScenario)}
              className="p-2 rounded-xl text-mute hover:text-ink-2 hover:bg-subtle"
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
                        ? "bg-primary text-white"
                        : "bg-primary-soft text-primary-ink"
                    }`}
                  >
                    {isMe ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-subtle text-ink rounded-tl-none"
                      }`}
                    >
                      <p>{msg.content}</p>

                      {!isMe && (
                        <button
                          onClick={() => playNativePronunciation(msg.content)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-ink hover:underline"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Nghe phát âm</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-mute px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-mute pl-11">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse [animation-delay:0.2s]">●</span>
                <span className="animate-pulse [animation-delay:0.4s]">●</span>
                <span>AI đang suy nghĩ phản hồi...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-line flex items-center gap-3 bg-subtle"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Gõ tin nhắn tiếng Anh của bạn (hãy dùng từ mục tiêu)..."
              className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
