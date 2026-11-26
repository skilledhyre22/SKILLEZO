'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Sparkles,
  Award,
  Coins,
  CheckCircle2,
  ArrowRight,
  X,
  TrendingUp,
} from 'lucide-react';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  shape: 'rect' | 'circle';
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = [
  '#00D9C0',
  '#3D5AFE',
  '#FFB800',
  '#EC4899',
  '#10B981',
  '#8B5CF6',
  '#F43F5E',
];

interface OnboardingCelebrationModalProps {
  isOpen: boolean;
  userName?: string;
  onDismiss: () => void;
}

export function OnboardingCelebrationModal({
  isOpen,
  userName = 'Candidate',
  onDismiss,
}: OnboardingCelebrationModalProps) {
  // Generate deterministic-looking pseudo-random confetti particles for physics-based burst
  const particles: ConfettiParticle[] = useMemo(() => {
    return Array.from({ length: 42 }).map((_, i) => {
      const angle = (i / 42) * 360 * (Math.PI / 180);
      const distance = 160 + (i % 7) * 45;
      return {
        id: i,
        x: Math.cos(angle) * distance + ((i * 17) % 50 - 25),
        y: Math.sin(angle) * distance * 0.75 + ((i * 23) % 60 - 30),
        rotation: (i * 85) % 360,
        scale: 0.7 + (i % 5) * 0.15,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        shape: i % 3 === 0 ? 'circle' : 'rect',
        delay: (i % 6) * 0.04,
        duration: 1.2 + (i % 4) * 0.2,
      };
    });
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl"
        />

        {/* Confetti Particle Burst Layer */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-15 overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0.9, 0],
                scale: [0, p.scale, p.scale * 0.9, 0.4],
                x: p.x,
                y: [0, p.y - 40, p.y + 120],
                rotate: [0, p.rotation + 180, p.rotation + 360],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.25, 0.1, 0.25, 1],
                repeat: Infinity,
                repeatDelay: 2.5,
              }}
              style={{
                backgroundColor: p.color,
                borderRadius: p.shape === 'circle' ? '9999px' : '3px',
                width: p.shape === 'circle' ? '10px' : '12px',
                height: p.shape === 'circle' ? '10px' : '7px',
              }}
              className="absolute"
            />
          ))}
        </div>

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 24 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="relative z-20 w-full max-w-lg rounded-3xl bg-[#0D153A] border border-[#00D9C0]/30 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,217,192,0.25)] text-white overflow-hidden text-center"
          data-testid="onboarding-celebration-modal"
        >
          {/* Top Neon Shimmer Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#3D5AFE] via-[#00D9C0] to-[#FFB800]" />

          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Celebration"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Animated Trophy Icon */}
          <div className="relative mx-auto w-20 h-20 mb-4">
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 4, -4, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-full h-full rounded-2xl bg-gradient-to-br from-[#FFB800] via-amber-500 to-orange-600 p-0.5 shadow-[0_0_30px_rgba(255,184,0,0.4)] flex items-center justify-center"
            >
              <div className="w-full h-full rounded-[14px] bg-[#0D153A] flex items-center justify-center">
                <Trophy className="w-10 h-10 text-[#FFB800]" />
              </div>
            </motion.div>

            {/* Pulsing Glow Ring */}
            <div className="absolute -inset-2 rounded-3xl bg-[#FFB800]/20 blur-xl -z-10 animate-pulse" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D9C0]/15 border border-[#00D9C0]/40 text-[#00D9C0] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Orientation Level 100% Cleared</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            You're 100% Job-Ready, {userName}!
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
            All 4 foundational milestones unlocked. Your employability score is now verified and fully visible to hiring partners.
          </p>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-left">
            {/* Reward 1: Badge */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#FFB800]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#FFB800]/20 flex items-center justify-center text-[#FFB800] mb-2">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Milestone Badge</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Job-Ready Explorer</p>
            </div>

            {/* Reward 2: Tokens */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#00D9C0]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#00D9C0]/20 flex items-center justify-center text-[#00D9C0] mb-2">
                <Coins className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">+500 AI Tokens</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Bonus Credits Added</p>
            </div>

            {/* Reward 3: Visibility */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-[#3D5AFE]/40 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#3D5AFE]/20 flex items-center justify-center text-indigo-400 mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Top 5% Talent Pool</h4>
              <p className="text-[11px] text-white/50 mt-0.5">High Recruiter Priority</p>
            </div>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard/job-center"
              onClick={onDismiss}
              data-testid="celebration-explore-jobs-btn"
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00D9C0] via-teal-500 to-[#3D5AFE] hover:shadow-[0_0_25px_rgba(0,217,192,0.5)] text-slate-950 font-black text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span>Explore High-Match Jobs</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>

            <button
              type="button"
              onClick={onDismiss}
              data-testid="celebration-dismiss-btn"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
