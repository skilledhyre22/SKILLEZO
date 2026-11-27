'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCareerCoach } from '@/hooks/useCareerCoach';
import { MessageBubble } from './MessageBubble';
import { LifecycleIndicator } from './LifecycleIndicator';
import { CoachAvatarMark } from './CoachAvatarMark';
import {
  Sparkles,
  X,
  Maximize2,
  Send,
  Square,
  Trash2,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

const QUICK_PROMPTS = [
  'Analyze my active resume & ATS score',
  'What are my missing skill gaps?',
  'What is my employability score?',
  'Recommend matching jobs for me',
];

export const CoachFloatingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const pathname = usePathname();
  const router = useRouter();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(0);

  const {
    messages,
    status,
    isGenerating,
    sendMessage,
    cancelRequest,
    retryLastMessage,
    clearConversation,
  } = useCareerCoach();

  // Hide the floating widget if user is already on the dedicated AI Career Coach workbench page
  const isDedicatedCoachPage = pathname === '/dashboard/ai-career-coach';

  // Smart auto-scroll inside widget
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      isNearBottomRef.current = true;
    }
  }, []);

  useEffect(() => {
    const isNew = messages.length > prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    if (isNew) {
      scrollToBottom();
    } else if (isNearBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status, scrollToBottom]);

  // Scroll to bottom when opening drawer
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isOpen, scrollToBottom]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isDedicatedCoachPage) {
    return null;
  }

  const isLifecycleStatus =
    status === 'thinking' ||
    status === 'executing_tools' ||
    status === 'synthesizing';

  return (
    <>
      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="SKILLEZO AI Career Coach Assistant"
          className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[580px] max-h-[calc(100vh-7rem)] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl shadow-indigo-900/20 dark:shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 transition-all"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0D153A] border border-[#3D5AFE]/40 flex items-center justify-center shadow-xs">
                <CoachAvatarMark size={22} isThinking={isGenerating} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    AI Career Coach
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Verified
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Real-time career intelligence & advice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearConversation}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push('/dashboard/ai-career-coach');
                }}
                title="Expand to Full Workbench"
                aria-label="Expand to full career coach workbench"
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                aria-label="Close assistant"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Viewport */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3 overscroll-contain"
          >
            {messages.length === 0 ? (
              <div className="py-6 px-2 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    How can I accelerate your career today?
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Ask anything about resume diagnostics, ATS scores, skill gaps, or jobs.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                    Suggested Questions
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onRetry={retryLastMessage}
                  onOpenWorkbenchTab={() => {
                    setIsOpen(false);
                    router.push('/dashboard/ai-career-coach');
                  }}
                />
              ))
            )}

            {isLifecycleStatus && (
              <div className="max-w-md mr-auto pl-11 mb-2">
                <LifecycleIndicator status={status} />
              </div>
            )}
          </div>

          {/* Bottom Composer */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                placeholder={
                  isGenerating ? 'AI Coach is analyzing...' : 'Ask AI Coach anything...'
                }
                aria-label="Ask SKILLEZO AI Coach"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />

              {isGenerating ? (
                <button
                  type="button"
                  onClick={cancelRequest}
                  aria-label="Stop response"
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 transition-colors cursor-pointer shrink-0"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Send message"
                  className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Floating Trigger Icon Button (Bottom Right Corner) */}
      <div className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5">
        {/* Zero-CLS Hover Pill Label */}
        {!isOpen && (
          <div className="pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D153A]/95 border border-[#00D9C0]/35 text-white text-xs font-semibold shadow-lg backdrop-blur-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            <Sparkles className="w-3 h-3 text-[#00D9C0]" />
            <span>Ask AI Coach</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseMove={(e) => {
            if (isOpen) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const dx = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 2;
            const dy = ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 1.6;
            setEyeOffset({
              x: Math.max(-2, Math.min(2, dx)),
              y: Math.max(-1.6, Math.min(1.6, dy)),
            });
          }}
          onMouseLeave={() => setEyeOffset({ x: 0, y: 0 })}
          aria-label={isOpen ? 'Close AI Career Coach' : 'Open AI Career Coach'}
          title="Open AI Career Coach"
          className={`relative flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'bg-slate-900 border border-white/15 text-white hover:bg-slate-800 shadow-slate-900/40 rotate-90'
              : 'bg-gradient-to-br from-[#131E52] via-[#0D153A] to-[#070D28] border border-[#00D9C0]/45 hover:border-[#00D9C0]/80 text-white hover:scale-105 shadow-[0_12px_35px_rgba(13,21,58,0.55)]'
          }`}
        >
          {/* Subtle Ambient Gradient Aura when closed */}
          {!isOpen && (
            <span
              className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#3D5AFE] via-[#00D9C0] to-[#7C4DFF] blur-md pointer-events-none transition-opacity ${
                isGenerating ? 'opacity-65 animate-pulse' : 'opacity-25 group-hover:opacity-55'
              }`}
            />
          )}

          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200" />
          ) : (
            <div className="relative flex items-center justify-center">
              <CoachAvatarMark
                size={32}
                isThinking={isGenerating}
                interactive
                eyeOffset={eyeOffset}
                className="group-hover:scale-105 transition-transform duration-200"
              />
              {/* Live Emerald Active Status Dot */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border-2 border-[#0D153A]" />
              </span>
            </div>
          )}
        </button>
      </div>
    </>
  );
};
