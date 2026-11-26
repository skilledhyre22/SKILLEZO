'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  FileCheck2,
  Eye,
  Zap,
  Award,
  Layers,
  ShieldCheck,
  Sliders,
  Download,
  RefreshCw,
  Compass,
  ArrowLeft,
  GitCompare,
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

export interface ResumeStudioIntroStep {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  tip: string;
  targetSelector: string;
  preferredPlacement: 'bottom' | 'right' | 'left' | 'top';
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SHARED_HEADER_BUTTON_STEPS: ResumeStudioIntroStep[] = [
  {
    id: 'btn-variant',
    category: 'Top Bar • Resume Selector',
    title: 'Resume Variant Switcher',
    description:
      'Switch between your Primary Master Resume and job-tailored variants from one dropdown without losing your place.',
    icon: FileText,
    accentColor: '#FFB800',
    tip: 'Keep one Master Resume as your source of truth and tailor copies per role.',
    targetSelector: '#resume-studio-btn-variant',
    preferredPlacement: 'bottom',
  },
  {
    id: 'btn-role',
    category: 'Top Bar • Role Benchmark',
    title: 'Target Role Selector',
    description:
      'Choose your target job title to dynamically recalibrate ATS keyword matching, role alignment, and scoring weights.',
    icon: Target,
    accentColor: '#3D5AFE',
    tip: 'Changing the target role updates your ATS & Match scores immediately.',
    targetSelector: '#resume-studio-btn-role',
    preferredPlacement: 'bottom',
  },
  {
    id: 'btn-tour',
    category: 'Top Bar • Quick Help',
    title: 'Interactive Tour Replay',
    description:
      'Click Tour anytime to replay this step-by-step walkthrough whenever you want a quick refresher on Studio tools.',
    icon: Compass,
    accentColor: '#00D9C0',
    tip: 'Use ← and → arrow keys or Esc to navigate or close the tour faster.',
    targetSelector: '#resume-studio-btn-tour',
    preferredPlacement: 'bottom',
  },
  {
    id: 'btn-compare',
    category: 'Top Bar • Diff Viewer',
    title: 'Compare with Master',
    description:
      'Inspect a side-by-side diff of every keyword and bullet change between this tailored variant and your Master Resume.',
    icon: GitCompare,
    accentColor: '#3D5AFE',
    tip: 'Great for verifying you kept key achievements intact before applying.',
    targetSelector: '#resume-studio-btn-compare',
    preferredPlacement: 'bottom',
  },
  {
    id: 'btn-download',
    category: 'Top Bar • Export',
    title: 'Download Vector PDF',
    description:
      'Export your live resume as an ATS-parseable, print-ready vector PDF with crisp typography and clean links.',
    icon: Download,
    accentColor: '#00D9C0',
    tip: 'Always export after your final AI bullet polish so scores match your PDF.',
    targetSelector: '#resume-studio-btn-download',
    preferredPlacement: 'bottom',
  },
  {
    id: 'btn-sync',
    category: 'Top Bar • Profile Sync',
    title: 'Sync Profile Updates',
    description:
      'Pull newly added career facts from your profile into your Master Resume while preserving all custom layout & formatting edits.',
    icon: RefreshCw,
    accentColor: '#FFB800',
    tip: 'Appears automatically whenever your profile has newer updates.',
    targetSelector: '#resume-studio-btn-sync',
    preferredPlacement: 'bottom',
  },
];

const AUDIT_BACK_STEP: ResumeStudioIntroStep = {
  id: 'btn-back-dashboard',
  category: 'Top Bar • Navigation',
  title: 'Back to Dashboard',
  description:
    'Return to your main Candidate Command Center to track employability readiness, mock interviews, and verified skills.',
  icon: ArrowLeft,
  accentColor: '#3D5AFE',
  tip: 'Your ATS scores and resume variants are saved automatically.',
  targetSelector: '#resume-studio-btn-back',
  preferredPlacement: 'bottom',
};

const EDITOR_BACK_STEP: ResumeStudioIntroStep = {
  id: 'btn-back-audit',
  category: 'Top Bar • Navigation',
  title: 'ATS & Scores Overview',
  description:
    'Switch back to the full Resume Intelligence Engine & Portfolio overview anytime without losing unsaved edits.',
  icon: ArrowLeft,
  accentColor: '#3D5AFE',
  tip: 'Use this to compare scores or spin up a new tailored variant.',
  targetSelector: '#resume-studio-btn-back',
  preferredPlacement: 'bottom',
};

const AUDIT_SECTION_STEPS: ResumeStudioIntroStep[] = [
  {
    id: 'audit-engine-header',
    category: 'Workspace • Command Hub',
    title: 'Resume Intelligence Engine',
    description:
      'Jump straight into the 3-zone Edit & Design workspace or upload a fresh PDF resume for instant ATS evaluation.',
    icon: Target,
    accentColor: '#FFB800',
    tip: 'Click "Open Edit & Design" to refine bullets and templates live.',
    targetSelector: '#resume-audit-engine-header',
    preferredPlacement: 'bottom',
  },
  {
    id: 'audit-scores',
    category: 'Workspace • Live Scoring',
    title: 'Authoritative Intelligence Scores',
    description:
      'Track three independent pillars—ATS Score, Role Match, and Content Impact—evaluated deterministically against industry standards.',
    icon: Award,
    accentColor: '#00D9C0',
    tip: 'Aim for 85+ across all three rings before submitting applications.',
    targetSelector: '#resume-audit-scores',
    preferredPlacement: 'bottom',
  },
  {
    id: 'audit-portfolio',
    category: 'Workspace • Variants',
    title: 'Resume Portfolio & Variants',
    description:
      'Manage your Primary Master Resume alongside job-tailored variants so every application stays sharp without overwriting your baseline.',
    icon: Layers,
    accentColor: '#3D5AFE',
    tip: 'Use "Tailor Resume for This Job" to spin up a role-specific variant.',
    targetSelector: '#resume-audit-portfolio',
    preferredPlacement: 'bottom',
  },
  {
    id: 'audit-pillars',
    category: 'Workspace • Deep Dive',
    title: 'Audit Pillars & Keyword Deep Dive',
    description:
      'Expand any pillar to inspect missing keywords, action-verb impact formulas, formatting hygiene, and structural recruiter checks.',
    icon: ShieldCheck,
    accentColor: '#00D9C0',
    tip: 'Click "Expand to Detail" to uncover exact keyword gaps to fix.',
    targetSelector: '#resume-audit-pillars',
    preferredPlacement: 'top',
  },
];

const EDITOR_SECTION_STEPS: ResumeStudioIntroStep[] = [
  {
    id: 'ats-navigator',
    category: 'Workspace • Outline & Health',
    title: 'Resume Sections & ATS Health',
    description:
      'Navigate sections, check page & word counts, and spot which sections need attention based on live ATS scoring.',
    icon: FileCheck2,
    accentColor: '#3D5AFE',
    tip: 'Aim for an ATS score above 85% to maximize recruiter interview callbacks.',
    targetSelector: '#resume-studio-navigator',
    preferredPlacement: 'right',
  },
  {
    id: 'live-canvas',
    category: 'Workspace • Paper Canvas',
    title: 'Live Interactive Resume Preview',
    description:
      'See instant typography and layout updates on your live document. Click any section directly on the page to jump and edit it.',
    icon: Eye,
    accentColor: '#00D9C0',
    tip: 'Use Undo/Redo in the canvas toolbar to experiment freely with phrasing.',
    targetSelector: '#resume-studio-preview',
    preferredPlacement: 'right',
  },
  {
    id: 'ai-enhancer',
    category: 'Workspace • AI Copilot',
    title: 'AI Workspace & Scoring',
    description:
      'Review explainable ATS metrics and transform generic bullet points into quantified, Evidence-Locked STAR achievements.',
    icon: Zap,
    accentColor: '#00D9C0',
    tip: 'Your original resume remains unchanged until you approve each AI rewrite.',
    targetSelector: '#resume-studio-editor',
    preferredPlacement: 'left',
  },
  {
    id: 'design-settings',
    category: 'Workspace • Typography & Theme',
    title: 'Design Settings & Templates',
    description:
      'Switch to Design Settings to customize resume templates, font pairing, spacing, accent colors, and page density with live preview.',
    icon: Sliders,
    accentColor: '#3D5AFE',
    tip: 'Keep margins balanced and clean so your resume fits comfortably on 1–2 pages.',
    targetSelector: '#resume-studio-design-settings',
    preferredPlacement: 'left',
  },
];

interface ResumeStudioIntroGuideProps {
  viewMode?: string;
  forceOpen?: boolean;
  onComplete?: () => void;
}

export function ResumeStudioIntroGuide({
  viewMode = 'editor',
  forceOpen = false,
  onComplete,
}: ResumeStudioIntroGuideProps) {
  const isAuditMode = viewMode === 'audit' || viewMode === 'analysis';
  const candidateSteps = useMemo(
    () =>
      isAuditMode
        ? [AUDIT_BACK_STEP, ...SHARED_HEADER_BUTTON_STEPS, ...AUDIT_SECTION_STEPS]
        : [EDITOR_BACK_STEP, ...SHARED_HEADER_BUTTON_STEPS, ...EDITOR_SECTION_STEPS],
    [isAuditMode]
  );

  const storageKey = isAuditMode
    ? 'skillezo_seen_resume_studio_audit_v3'
    : 'skillezo_seen_resume_studio_editor_v3';

  const [isOpen, setIsOpen] = useState(false);
  const [activeSteps, setActiveSteps] = useState<ResumeStudioIntroStep[]>(candidateSteps);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter to only currently visible DOM targets so conditional buttons (Sync Profile, Compare) never create dead steps
  const resolveAvailableSteps = useCallback(() => {
    if (typeof document === 'undefined') return candidateSteps;
    const visible = candidateSteps.filter((step) => {
      const el = document.querySelector(step.targetSelector);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return visible.length > 0 ? visible : candidateSteps;
  }, [candidateSteps]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hasSeen = localStorage.getItem(storageKey);
      if (forceOpen) {
        setActiveSteps(resolveAvailableSteps());
        setCurrentIndex(0);
        setIsOpen(true);
        return;
      }
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setActiveSteps(resolveAvailableSteps());
          setCurrentIndex(0);
          setIsOpen(true);
        }, 450);
        return () => clearTimeout(timer);
      } else {
        setIsOpen(false);
      }
    } catch {
      // ignore storage access issues
    }
  }, [forceOpen, storageKey, resolveAvailableSteps]);

  const currentStep = activeSteps[currentIndex] || activeSteps[0];

  const measureTarget = useCallback(
    (allowScroll = false) => {
      if (!isOpen || !currentStep?.targetSelector) return;

      const el = document.querySelector(currentStep.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });

          if (allowScroll) {
            const vh = window.innerHeight || 800;
            const isInComfortZone = rect.top >= 12 && rect.bottom <= vh - 40;
            if (!isInComfortZone && typeof el.scrollIntoView === 'function') {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
              settleTimerRef.current = setTimeout(() => {
                measureTarget(false);
              }, 380);
            }
          }
          return;
        }
      }

      setTargetRect(null);
    },
    [isOpen, currentStep]
  );

  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const timer = setTimeout(() => measureTarget(true), 60);
    const handleScrollOrResize = () => measureTarget(false);

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      clearTimeout(timer);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, currentIndex, isAuditMode, measureTarget]);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // ignore
      }
    }
    onComplete?.();
  }, [onComplete, storageKey]);

  const handleNext = useCallback(() => {
    if (currentIndex < activeSteps.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  }, [currentIndex, activeSteps.length, handleDismiss]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleDismiss, handleNext, handlePrev]);

  if (!isOpen || !currentStep) return null;

  const StepIcon = currentStep.icon;
  const isLast = currentIndex === activeSteps.length - 1;
  const padding = 6;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let ringRect: TargetRect | null = null;
  if (targetRect) {
    const rawTop = targetRect.top - padding;
    const rawLeft = targetRect.left - padding;
    const rawRight = targetRect.left + targetRect.width + padding;
    const rawBottom = targetRect.top + targetRect.height + padding;

    const clampedTop = Math.max(4, rawTop);
    const clampedLeft = Math.max(4, rawLeft);
    const clampedRight = Math.min(vw - 4, rawRight);
    const clampedBottom = Math.min(vh - 4, rawBottom);

    ringRect = {
      top: clampedTop,
      left: clampedLeft,
      width: Math.max(32, clampedRight - clampedLeft),
      height: Math.max(32, clampedBottom - clampedTop),
    };
  }

  const popoverWidth = Math.min(390, vw - 32);
  const popoverHeight = 285;
  const gap = 16;

  let popoverTop = Math.max(20, vh / 2 - popoverHeight / 2);
  let popoverLeft = Math.max(16, vw / 2 - popoverWidth / 2);

  if (ringRect) {
    const spaceRight = vw - (ringRect.left + ringRect.width);
    const spaceLeft = ringRect.left;
    const spaceBelow = vh - (ringRect.top + ringRect.height);
    const spaceAbove = ringRect.top;

    const pref = currentStep.preferredPlacement;

    if (pref === 'right' && spaceRight >= popoverWidth + gap + 16) {
      popoverLeft = ringRect.left + ringRect.width + gap;
      popoverTop = Math.max(
        20,
        Math.min(vh - popoverHeight - 20, ringRect.top + 16)
      );
    } else if (pref === 'left' && spaceLeft >= popoverWidth + gap + 16) {
      popoverLeft = ringRect.left - gap - popoverWidth;
      popoverTop = Math.max(
        20,
        Math.min(vh - popoverHeight - 20, ringRect.top + 16)
      );
    } else if (pref === 'top' && spaceAbove >= popoverHeight + gap + 16) {
      popoverTop = Math.max(20, ringRect.top - gap - popoverHeight);
      popoverLeft = Math.max(
        16,
        Math.min(
          vw - popoverWidth - 16,
          ringRect.left + ringRect.width / 2 - popoverWidth / 2
        )
      );
    } else if (spaceBelow >= popoverHeight + gap) {
      popoverTop = ringRect.top + ringRect.height + gap;
      popoverLeft = Math.max(
        16,
        Math.min(
          vw - popoverWidth - 16,
          ringRect.left + ringRect.width / 2 - popoverWidth / 2
        )
      );
    } else if (spaceAbove >= popoverHeight + gap) {
      popoverTop = Math.max(20, ringRect.top - gap - popoverHeight);
      popoverLeft = Math.max(
        16,
        Math.min(
          vw - popoverWidth - 16,
          ringRect.left + ringRect.width / 2 - popoverWidth / 2
        )
      );
    } else if (spaceRight >= popoverWidth + gap + 16) {
      popoverLeft = ringRect.left + ringRect.width + gap;
      popoverTop = Math.max(20, Math.min(vh - popoverHeight - 20, ringRect.top));
    } else if (spaceLeft >= popoverWidth + gap + 16) {
      popoverLeft = ringRect.left - gap - popoverWidth;
      popoverTop = Math.max(20, Math.min(vh - popoverHeight - 20, ringRect.top));
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden"
      data-testid="resume-studio-spotlight-tour"
    >
      {/* Interactive SVG Cutout Mask Backdrop */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto"
        onClick={handleDismiss}
        aria-hidden="true"
      >
        <defs>
          <mask id="resume-studio-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {ringRect && (
              <rect
                x={ringRect.left}
                y={ringRect.top}
                width={ringRect.width}
                height={ringRect.height}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(7, 11, 30, 0.78)"
          mask="url(#resume-studio-spotlight-mask)"
        />
      </svg>

      {/* Animated Glowing Neon Ring around Active Element */}
      {ringRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            top: ringRect.top,
            left: ringRect.left,
            width: ringRect.width,
            height: ringRect.height,
            opacity: 1,
            scale: 1,
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="fixed pointer-events-none z-[92] rounded-[16px] border-2 border-[#00D9C0] shadow-[0_0_32px_rgba(0,217,192,0.55)] ring-4 ring-[#00D9C0]/20"
          data-testid="resume-studio-spotlight-ring"
        />
      )}

      {/* Floating SaaS Glassmorphic Popover Card */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.96 }}
        animate={{
          top: popoverTop,
          left: popoverLeft,
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={{ width: popoverWidth }}
        className="fixed z-[95] rounded-2xl bg-[#0D153A]/95 backdrop-blur-2xl border border-[#00D9C0]/40 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.85)] text-white overflow-hidden"
        data-testid="resume-studio-guide-modal"
      >
        {/* Top Specular Neon Accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] transition-colors duration-300"
          style={{
            background: `linear-gradient(90deg, transparent, ${currentStep.accentColor}, transparent)`,
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border border-white/10 shrink-0 transition-colors duration-300"
              style={{
                backgroundColor: `${currentStep.accentColor}22`,
                color: currentStep.accentColor,
              }}
            >
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#00D9C0]">
                Step {currentIndex + 1} of {activeSteps.length} • {currentStep.category}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Skip Tour (Esc)"
            aria-label="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
            className="py-3.5 space-y-2.5"
          >
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Pro Tip Callout */}
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#00D9C0] shrink-0 mt-0.5" />
              <p className="text-xs text-white/70 leading-relaxed">
                <span className="font-semibold text-white">Pro-Tip: </span>
                {currentStep.tip}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          {/* Interactive Step Dots */}
          <div className="flex items-center gap-1">
            {activeSteps.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-5 bg-[#00D9C0] shadow-[0_0_8px_rgba(0,217,192,0.5)]'
                    : 'w-1.5 bg-white/20 hover:bg-white/40'
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
                className="px-3 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              data-testid="resume-studio-guide-next-btn"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#3D5AFE] to-[#00D9C0] hover:shadow-[0_0_20px_rgba(0,217,192,0.45)] text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{isLast ? (isAuditMode ? 'Explore Audit' : 'Start Editing') : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
