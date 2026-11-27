'use client';

import { useState, useEffect, useCallback } from 'react';
import { FTUX_TOUR_STEPS } from './ftux-steps.config';

export type FtuxStageKey =
  | 'dashboardTour'
  | 'resumeStudioTopBar'
  | 'resumeStudioAudit'
  | 'resumeStudioEditor'
  | 'interviewArena';

export interface FtuxStoredState {
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
  completedMilestones: string[];
  isDockMinimized: boolean;
  hasSeenCelebration?: boolean;
  completedStages?: Partial<Record<FtuxStageKey, boolean>>;
}

const STORAGE_KEY_PREFIX = 'skillezo_ftux_';
const GUIDE_DISMISSED_KEY = 'skillezo_guide_dismissed';

function resolveFtuxStorageKey(userId?: string): string {
  if (userId) return `${STORAGE_KEY_PREFIX}${userId}`;
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          return key;
        }
      }
    } catch {
      // ignore
    }
  }
  return `${STORAGE_KEY_PREFIX}guest`;
}

function getGuideDismissedKey(userId?: string): string {
  return userId ? `${GUIDE_DISMISSED_KEY}_${userId}` : GUIDE_DISMISSED_KEY;
}

export function isFtuxStageCompleted(stage: FtuxStageKey, userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(getGuideDismissedKey(userId)) === 'true') {
      return true;
    }
    const raw = localStorage.getItem(resolveFtuxStorageKey(userId));
    if (!raw) return false;
    const parsed: FtuxStoredState = JSON.parse(raw);
    if (parsed.hasSeenCelebration) {
      return true;
    }
    if (stage === 'dashboardTour' && parsed.hasCompletedTour) {
      return true;
    }
    return Boolean(parsed.completedStages?.[stage]);
  } catch {
    return false;
  }
}

export function markFtuxStageCompleted(stage: FtuxStageKey, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = resolveFtuxStorageKey(userId);
    const raw = localStorage.getItem(key);
    const current: FtuxStoredState = raw
      ? JSON.parse(raw)
      : {
          hasSeenWelcome: false,
          hasCompletedTour: false,
          completedMilestones: [],
          isDockMinimized: false,
          hasSeenCelebration: false,
          completedStages: {},
        };
    const updated: FtuxStoredState = {
      ...current,
      completedStages: {
        ...(current.completedStages || {}),
        [stage]: true,
      },
    };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function emitMilestoneCompleted(milestoneId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('skillezo:milestone-completed', { detail: { milestoneId } })
    );
  }
}

export interface UseFtuxOptions {
  isLoading?: boolean;
  isExistingUser?: boolean;
}

export function useFtuxState(userId?: string, options?: UseFtuxOptions) {
  const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  const isDataLoading = Boolean(options?.isLoading);
  const isExistingUser = Boolean(options?.isExistingUser);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isDockMinimized, setIsDockMinimized] = useState<boolean>(false);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(false);
  const [hasSeenCelebration, setHasSeenCelebration] = useState<boolean>(false);

  // Initialize from LocalStorage (wait until session/profile finishes loading before auto-opening)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDataLoading) return;

    try {
      const isGuideDismissed =
        localStorage.getItem(getGuideDismissedKey(userId)) === 'true';
      const raw = localStorage.getItem(storageKey);

      if (raw) {
        const parsed: FtuxStoredState = JSON.parse(raw);
        const alreadyOnboarded =
          isExistingUser ||
          isGuideDismissed ||
          Boolean(parsed.hasSeenWelcome) ||
          Boolean(parsed.hasCompletedTour) ||
          Boolean(parsed.hasSeenCelebration);

        setHasCompletedTour(Boolean(parsed.hasCompletedTour) || isExistingUser);
        setCompletedMilestones(parsed.completedMilestones || []);
        setIsDockMinimized(Boolean(parsed.isDockMinimized));
        setHasSeenCelebration(Boolean(parsed.hasSeenCelebration));
        setShowWelcomeModal(!alreadyOnboarded);

        if (isExistingUser && (!parsed.hasSeenWelcome || !parsed.hasCompletedTour)) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ ...parsed, hasSeenWelcome: true, hasCompletedTour: true })
          );
        }
      } else if (isExistingUser || isGuideDismissed) {
        // Existing/old account or previously dismissed: never show first-time welcome banner
        setShowWelcomeModal(false);
        setHasCompletedTour(true);
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            hasSeenWelcome: true,
            hasCompletedTour: true,
            completedMilestones: [],
            isDockMinimized: false,
            hasSeenCelebration: false,
            completedStages: { dashboardTour: true },
          })
        );
      } else {
        // Genuine brand-new user! Open welcome modal
        setShowWelcomeModal(true);
      }
    } catch (e) {
      console.warn('Failed to parse FTUX state from localStorage:', e);
      if (!isExistingUser) {
        setShowWelcomeModal(true);
      }
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey, userId, isDataLoading, isExistingUser]);

  // Save changes to LocalStorage
  const persistState = useCallback(
    (updates: Partial<FtuxStoredState>) => {
      if (typeof window === 'undefined') return;
      try {
        const raw = localStorage.getItem(storageKey);
        const current: FtuxStoredState = raw
          ? JSON.parse(raw)
          : {
              hasSeenWelcome: false,
              hasCompletedTour: false,
              completedMilestones: [],
              isDockMinimized: false,
              hasSeenCelebration: false,
            };

        const updated: FtuxStoredState = { ...current, ...updates };
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save FTUX state to localStorage:', e);
      }
    },
    [storageKey]
  );

  const dismissWelcome = useCallback(() => {
    setShowWelcomeModal(false);
    persistState({ hasSeenWelcome: true });
  }, [persistState]);

  const startTour = useCallback(() => {
    setShowWelcomeModal(false);
    setIsTourActive(true);
    setCurrentStepIndex(0);
    persistState({ hasSeenWelcome: true });
  }, [persistState]);

  const nextTourStep = useCallback(() => {
    if (currentStepIndex < FTUX_TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsTourActive(false);
      setHasCompletedTour(true);
      persistState({ hasCompletedTour: true });
    }
  }, [currentStepIndex, persistState]);

  const prevTourStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTour = useCallback(() => {
    setIsTourActive(false);
    setHasCompletedTour(true);
    persistState({ hasCompletedTour: true });
    markFtuxStageCompleted('dashboardTour', userId);
  }, [persistState, userId]);

  const finishTour = useCallback(() => {
    setIsTourActive(false);
    setHasCompletedTour(true);
    persistState({ hasCompletedTour: true });
    markFtuxStageCompleted('dashboardTour', userId);
  }, [persistState, userId]);

  const replayTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentStepIndex(0);
  }, []);

  const openWelcomeModal = useCallback(() => {
    setShowWelcomeModal(true);
  }, []);

  const toggleDock = useCallback(() => {
    setIsDockMinimized((prev) => {
      const next = !prev;
      persistState({ isDockMinimized: next });
      return next;
    });
  }, [persistState]);

  const markMilestone = useCallback(
    (milestoneId: string) => {
      setCompletedMilestones((prev) => {
        if (prev.includes(milestoneId)) return prev;
        const next = [...prev, milestoneId];
        persistState({ completedMilestones: next });
        return next;
      });
    },
    [persistState]
  );

  const triggerCelebration = useCallback(() => {
    setShowCelebrationModal(true);
  }, []);

  const dismissCelebration = useCallback(() => {
    setShowCelebrationModal(false);
    setHasSeenCelebration(true);
    persistState({ hasSeenCelebration: true });
  }, [persistState]);

  // Global listener for cross-module milestone completion events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMilestoneEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ milestoneId: string }>;
      if (customEvent.detail?.milestoneId) {
        markMilestone(customEvent.detail.milestoneId);
      }
    };

    window.addEventListener('skillezo:milestone-completed', handleMilestoneEvent);
    return () => {
      window.removeEventListener('skillezo:milestone-completed', handleMilestoneEvent);
    };
  }, [markMilestone]);

  return {
    isInitialized,
    showWelcomeModal,
    showCelebrationModal,
    hasSeenCelebration,
    isTourActive,
    currentStepIndex,
    currentStep: FTUX_TOUR_STEPS[currentStepIndex] || FTUX_TOUR_STEPS[0],
    totalSteps: FTUX_TOUR_STEPS.length,
    isDockMinimized,
    completedMilestones,
    hasCompletedTour,
    dismissWelcome,
    startTour,
    nextTourStep,
    prevTourStep,
    skipTour,
    finishTour,
    replayTour,
    openWelcomeModal,
    toggleDock,
    markMilestone,
    triggerCelebration,
    dismissCelebration,
  };
}
