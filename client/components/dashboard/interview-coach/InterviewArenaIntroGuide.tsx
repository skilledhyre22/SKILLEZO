'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Mic,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

export interface InterviewIntroStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  tip: string;
}

const INTRO_STEPS: InterviewIntroStep[] = [
  {
    id: 'ai-persona',
    badge: 'Step 1 of 3',
    title: 'Adaptive AI Interviewer',
    description:
      'Engage with an intelligent AI interviewer that dynamically adjusts follow-up questions based on your technical depth and seniority level.',
    icon: Bot,
    accentColor: '#00D9C0',
    tip: 'Treat this like a real conversation — give concrete details and examples.',
  },
  {
    id: 'speech-cadence',
    badge: 'Step 2 of 3',
    title: 'Speech Cadence & Audio Monitor',
    description:
      'Live audio waveform indicators detect speaking pace, silence intervals, and filler words to refine your executive delivery.',
    icon: Mic,
    accentColor: '#3D5AFE',
    tip: 'Take a 2-second breath before answering complex behavioral prompts.',
  },
  {
    id: 'star-rubric',
    badge: 'Step 3 of 3',
    title: 'Instant STAR Rubric Evaluation',
    description:
      'Get structured diagnostics grading your Situation, Task, Action, and Result framing, paired with actionable model answers.',
    icon: Award,
    accentColor: '#FFB800',
    tip: 'Quantify your impact with metrics (e.g., % improvement, revenue, latency).',
  },
];

const STORAGE_KEY = 'skillezo_seen_interview_guide';

interface InterviewArenaIntroGuideProps {
  forceOpen?: boolean;
  onComplete?: () => void;
}

export function InterviewArenaIntroGuide({ forceOpen = false, onComplete }: InterviewArenaIntroGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hasSeen = localStorage.getItem(STORAGE_KEY);
      if (!hasSeen || forceOpen) {
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [forceOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
    }
    onComplete?.();
  };

  const handleNext = () => {
    if (currentIndex < INTRO_STEPS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentStep = INTRO_STEPS[currentIndex];
  const StepIcon = currentStep.icon;
  const isLast = currentIndex === INTRO_STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-[#0D153A] border border-slate-200 dark:border-white/15 p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-white overflow-hidden"
          data-testid="interview-arena-guide-modal"
        >
          {/* Top Specular Neon Accent */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px] transition-colors duration-300"
            style={{
              background: `linear-gradient(90deg, transparent, ${currentStep.accentColor}, transparent)`,
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-xl transition-colors duration-300"
                style={{
                  backgroundColor: `${currentStep.accentColor}20`,
                  color: currentStep.accentColor,
                }}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                  Quick Orientation • {currentStep.badge}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              title="Close Guide"
              aria-label="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-5">
            <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Pro Tip Callout */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00D9C0] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 dark:text-white/60">
                <span className="font-semibold text-slate-700 dark:text-white/80">Coach Advice: </span>
                {currentStep.tip}
              </p>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/10">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {INTRO_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'w-6 bg-[#00D9C0] dark:bg-[#00D9C0]'
                      : 'w-2 bg-slate-200 dark:bg-white/20 hover:bg-slate-300 dark:hover:bg-white/40'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                data-testid="interview-arena-guide-next-btn"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00D9C0] to-[#3D5AFE] hover:shadow-[0_0_18px_rgba(0,217,192,0.4)] text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{isLast ? 'Enter Arena' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
