// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, renderHook, act, waitFor } from '@testing-library/react';
import {
  useFtuxState,
  FtuxWelcomeModal,
  DashboardSpotlightTour,
  FloatingOnboardingDock,
  OnboardingCelebrationModal,
  emitMilestoneCompleted,
  isFtuxStageCompleted,
  markFtuxStageCompleted,
  FTUX_TOUR_STEPS,
  SUPERPOWER_CARDS,
} from '../components/dashboard/ftux';
import { ResumeStudioIntroGuide } from '../components/resume-studio/ResumeStudioIntroGuide';
import { InterviewArenaIntroGuide } from '../components/dashboard/interview-coach/InterviewArenaIntroGuide';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('First-Time User Experience (FTUX) Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. useFtuxState Hook', () => {
    it('initializes with showWelcomeModal=true for a fresh user', () => {
      const { result } = renderHook(() => useFtuxState('test-user-1'));

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.showWelcomeModal).toBe(true);
      expect(result.current.isTourActive).toBe(false);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.totalSteps).toBe(4);
    });

    it('dismisses welcome modal and persists to localStorage', () => {
      const { result } = renderHook(() => useFtuxState('test-user-1'));

      act(() => {
        result.current.dismissWelcome();
      });

      expect(result.current.showWelcomeModal).toBe(false);
      const stored = JSON.parse(localStorage.getItem('skillezo_ftux_test-user-1') || '{}');
      expect(stored.hasSeenWelcome).toBe(true);
    });

    it('starts tour correctly from welcome modal', () => {
      const { result } = renderHook(() => useFtuxState('test-user-1'));

      act(() => {
        result.current.startTour();
      });

      expect(result.current.showWelcomeModal).toBe(false);
      expect(result.current.isTourActive).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
      expect(result.current.currentStep.id).toBe(FTUX_TOUR_STEPS[0].id);
    });

    it('navigates next and prev steps, then finishes tour', () => {
      const { result } = renderHook(() => useFtuxState('test-user-1'));

      act(() => {
        result.current.startTour();
      });

      // Next step
      act(() => {
        result.current.nextTourStep();
      });
      expect(result.current.currentStepIndex).toBe(1);

      // Prev step
      act(() => {
        result.current.prevTourStep();
      });
      expect(result.current.currentStepIndex).toBe(0);

      // Step to end
      act(() => {
        result.current.nextTourStep(); // index 1
      });
      act(() => {
        result.current.nextTourStep(); // index 2
      });
      act(() => {
        result.current.nextTourStep(); // index 3 (last)
      });
      expect(result.current.currentStepIndex).toBe(3);

      act(() => {
        result.current.nextTourStep(); // Finish!
      });
      expect(result.current.isTourActive).toBe(false);
      expect(result.current.hasCompletedTour).toBe(true);
    });

    it('allows replaying tour anytime', () => {
      const { result } = renderHook(() => useFtuxState('test-user-1'));

      act(() => {
        result.current.skipTour();
      });
      expect(result.current.isTourActive).toBe(false);

      act(() => {
        result.current.replayTour();
      });
      expect(result.current.isTourActive).toBe(true);
      expect(result.current.currentStepIndex).toBe(0);
    });
  });

  describe('2. FtuxWelcomeModal Component', () => {
    it('renders candidate greeting and welcome token celebration', () => {
      render(
        <FtuxWelcomeModal
          isOpen={true}
          userName="Alex Rivera"
          onStartTour={vi.fn()}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.getByText(/Alex Rivera/i)).toBeDefined();
      expect(screen.getByText(/Welcome to SKILLEZO/i)).toBeDefined();
      expect(screen.getByText('+1,000 AI Tokens')).toBeDefined();
      expect(screen.getByTestId('ftux-welcome-modal')).toBeDefined();
    });

    it('cycles superpower carousel slides on prev/next clicks', async () => {
      render(
        <FtuxWelcomeModal
          isOpen={true}
          userName="Alex Rivera"
          onStartTour={vi.fn()}
          onDismiss={vi.fn()}
        />
      );

      // Initial slide is Resume Studio
      expect(screen.getByTestId('ftux-slide-resume-studio')).toBeDefined();

      // Click next
      const nextBtn = screen.getByTestId('ftux-carousel-next');
      fireEvent.click(nextBtn);

      // Second slide is Mock Interview Coach
      await waitFor(() => {
        expect(screen.getByTestId('ftux-slide-interview-coach')).toBeDefined();
      });

      // Click prev
      const prevBtn = screen.getByTestId('ftux-carousel-prev');
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(screen.getByTestId('ftux-slide-resume-studio')).toBeDefined();
      });
    });

    it('fires onStartTour when clicking "Take Interactive Tour"', () => {
      const onStart = vi.fn();
      render(
        <FtuxWelcomeModal
          isOpen={true}
          userName="Alex Rivera"
          onStartTour={onStart}
          onDismiss={vi.fn()}
        />
      );

      const tourBtn = screen.getByTestId('ftux-start-tour-btn');
      fireEvent.click(tourBtn);

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('fires onDismiss and routes on fast-track action click', () => {
      const onDismiss = vi.fn();
      render(
        <FtuxWelcomeModal
          isOpen={true}
          userName="Alex Rivera"
          onStartTour={vi.fn()}
          onDismiss={onDismiss}
        />
      );

      const fastTrackBtn = screen.getByTestId('ftux-fast-track-btn');
      fireEvent.click(fastTrackBtn);

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(SUPERPOWER_CARDS[0].actionHref);
    });
  });

  describe('3. DashboardSpotlightTour Component', () => {
    it('renders tour popover and target highlight ring when active', () => {
      const step = FTUX_TOUR_STEPS[0];
      render(
        <DashboardSpotlightTour
          isActive={true}
          currentStep={step}
          currentStepIndex={0}
          totalSteps={4}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByTestId('dashboard-spotlight-tour')).toBeDefined();
      expect(screen.getByTestId('spotlight-popover')).toBeDefined();
      expect(screen.getByText(step.title)).toBeDefined();
      expect(screen.getByText(step.description)).toBeDefined();
      expect(screen.getByText(step.badge)).toBeDefined();
    });

    it('calls onNext when clicking Next button', () => {
      const onNext = vi.fn();
      render(
        <DashboardSpotlightTour
          isActive={true}
          currentStep={FTUX_TOUR_STEPS[0]}
          currentStepIndex={0}
          totalSteps={4}
          onNext={onNext}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      const nextBtn = screen.getByTestId('spotlight-next-btn');
      fireEvent.click(nextBtn);

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('renders "Finish Tour" on the final step', () => {
      render(
        <DashboardSpotlightTour
          isActive={true}
          currentStep={FTUX_TOUR_STEPS[3]}
          currentStepIndex={3}
          totalSteps={4}
          onNext={vi.fn()}
          onPrev={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      expect(screen.getByText('Finish Tour')).toBeDefined();
    });
  });

  describe('4. FloatingOnboardingDock Component', () => {
    it('renders minimized guide pill with computed progress percent', () => {
      render(
        <FloatingOnboardingDock
          resumesCount={1}
          verifiedSkillsCount={0}
          hasProfileGoal={false}
          onReplayTour={vi.fn()}
          onOpenWelcome={vi.fn()}
        />
      );

      expect(screen.getByTestId('floating-onboarding-dock')).toBeDefined();
      expect(screen.getByTestId('dock-trigger-btn')).toBeDefined();
      // 1 out of 4 is 25%
      expect(screen.getByText('25%')).toBeDefined();
    });

    it('expands drawer on click and exposes replay tour button', () => {
      const onReplay = vi.fn();
      render(
        <FloatingOnboardingDock
          resumesCount={2}
          verifiedSkillsCount={1}
          hasProfileGoal={true}
          onReplayTour={onReplay}
          onOpenWelcome={vi.fn()}
        />
      );

      const triggerBtn = screen.getByTestId('dock-trigger-btn');
      fireEvent.click(triggerBtn);

      expect(screen.getByTestId('onboarding-dock-drawer')).toBeDefined();
      expect(screen.getByText(/3 of 4 milestones unlocked/i)).toBeDefined();

      const replayBtn = screen.getByTestId('dock-replay-tour-btn');
      fireEvent.click(replayBtn);

      expect(onReplay).toHaveBeenCalledTimes(1);
    });

    it('automatically disappears when user clears level (100% completion or cleared flag)', () => {
      const { rerender } = render(
        <FloatingOnboardingDock
          resumesCount={1}
          verifiedSkillsCount={1}
          hasProfileGoal={true}
          completionPercentage={100}
          onReplayTour={vi.fn()}
          onOpenWelcome={vi.fn()}
        />
      );

      // Should be hidden because completionPercentage is 100%
      expect(screen.queryByTestId('floating-onboarding-dock')).toBeNull();

      rerender(
        <FloatingOnboardingDock
          resumesCount={1}
          verifiedSkillsCount={0}
          hasProfileGoal={false}
          isCleared={true}
          onReplayTour={vi.fn()}
          onOpenWelcome={vi.fn()}
        />
      );

      // Should be hidden because isCleared is true
      expect(screen.queryByTestId('floating-onboarding-dock')).toBeNull();
    });

    it('disappears when candidate clicks dismiss guide', () => {
      render(
        <FloatingOnboardingDock
          resumesCount={1}
          verifiedSkillsCount={0}
          hasProfileGoal={false}
          onReplayTour={vi.fn()}
          onOpenWelcome={vi.fn()}
        />
      );

      // Open drawer
      fireEvent.click(screen.getByTestId('dock-trigger-btn'));
      expect(screen.getByTestId('onboarding-dock-drawer')).toBeDefined();

      // Click dismiss
      fireEvent.click(screen.getByTestId('dock-dismiss-btn'));

      // Dock disappears
      expect(screen.queryByTestId('floating-onboarding-dock')).toBeNull();
      expect(localStorage.getItem('skillezo_guide_dismissed')).toBe('true');
    });

    it('triggers onAllMilestonesComplete when all 4 milestones are achieved', () => {
      const onAllComplete = vi.fn();
      render(
        <FloatingOnboardingDock
          resumesCount={1}
          verifiedSkillsCount={1}
          hasProfileGoal={true}
          interviewsCount={1}
          onReplayTour={vi.fn()}
          onOpenWelcome={vi.fn()}
          onAllMilestonesComplete={onAllComplete}
        />
      );

      expect(onAllComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. OnboardingCelebrationModal Component', () => {
    it('renders celebration modal with rewards and user name when open', () => {
      const onDismiss = vi.fn();
      render(
        <OnboardingCelebrationModal
          isOpen={true}
          userName="Alex Rivera"
          onDismiss={onDismiss}
        />
      );

      expect(screen.getByTestId('onboarding-celebration-modal')).toBeDefined();
      expect(screen.getByText(/You're 100% Job-Ready, Alex Rivera!/i)).toBeDefined();
      expect(screen.getByText(/Job-Ready Explorer/i)).toBeDefined();
      expect(screen.getByText(/\+500 AI Tokens/i)).toBeDefined();
      expect(screen.getByText(/Top 5% Talent Pool/i)).toBeDefined();

      const dismissBtn = screen.getByTestId('celebration-dismiss-btn');
      fireEvent.click(dismissBtn);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      render(
        <OnboardingCelebrationModal
          isOpen={false}
          onDismiss={vi.fn()}
        />
      );

      expect(screen.queryByTestId('onboarding-celebration-modal')).toBeNull();
    });
  });

  describe('6. ResumeStudioIntroGuide Component', () => {
    it('renders interactive spotlight tour in editor mode: top bar buttons first, then studio sections', async () => {
      const onComplete = vi.fn();
      render(<ResumeStudioIntroGuide viewMode="editor" userId="u1" forceOpen={true} onComplete={onComplete} />);

      await waitFor(() => {
        expect(screen.getByTestId('resume-studio-spotlight-tour')).toBeDefined();
        expect(screen.getByTestId('resume-studio-guide-modal')).toBeDefined();
      });

      const expectedEditorTitles = [
        /ATS & Scores Overview/i,
        /Resume Variant Switcher/i,
        /Target Role Selector/i,
        /Interactive Tour Replay/i,
        /Compare with Master/i,
        /Download Vector PDF/i,
        /Sync Profile Updates/i,
        /Resume Sections & ATS Health/i,
        /Live Interactive Resume Preview/i,
        /AI Workspace & Scoring/i,
        /Design Settings & Templates/i,
      ];

      for (const titlePattern of expectedEditorTitles) {
        expect(screen.getByText(titlePattern)).toBeDefined();
        fireEvent.click(screen.getByTestId('resume-studio-guide-next-btn'));
      }

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(isFtuxStageCompleted('resumeStudioTopBar', 'u1')).toBe(true);
      expect(isFtuxStageCompleted('resumeStudioEditor', 'u1')).toBe(true);
    });

    it('renders interactive spotlight tour in audit mode: top bar buttons first, then audit sections', async () => {
      const onComplete = vi.fn();
      render(<ResumeStudioIntroGuide viewMode="audit" userId="u2" forceOpen={true} onComplete={onComplete} />);

      await waitFor(() => {
        expect(screen.getByTestId('resume-studio-spotlight-tour')).toBeDefined();
      });

      const expectedAuditTitles = [
        /Back to Dashboard/i,
        /Resume Variant Switcher/i,
        /Target Role Selector/i,
        /Interactive Tour Replay/i,
        /Compare with Master/i,
        /Download Vector PDF/i,
        /Sync Profile Updates/i,
        /Resume Intelligence Engine/i,
        /Authoritative Intelligence Scores/i,
        /Resume Portfolio & Variants/i,
        /Audit Pillars & Keyword Deep Dive/i,
      ];

      for (const titlePattern of expectedAuditTitles) {
        expect(screen.getByText(titlePattern)).toBeDefined();
        fireEvent.click(screen.getByTestId('resume-studio-guide-next-btn'));
      }

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(isFtuxStageCompleted('resumeStudioTopBar', 'u2')).toBe(true);
      expect(isFtuxStageCompleted('resumeStudioAudit', 'u2')).toBe(true);
    });

    it('skips duplicate top bar tour when switching to editor after already seeing top bar in audit', async () => {
      markFtuxStageCompleted('resumeStudioTopBar', 'u3');
      markFtuxStageCompleted('resumeStudioAudit', 'u3');

      render(<ResumeStudioIntroGuide viewMode="editor" userId="u3" />);

      await waitFor(() => {
        expect(screen.getByTestId('resume-studio-spotlight-tour')).toBeDefined();
      });

      // Should start directly at Editor workspace sections without repeating Top Bar
      expect(screen.getByText(/Resume Sections & ATS Health/i)).toBeDefined();
    });

    it('does not auto-open once initial onboarding or stage is completed until forceOpen is true', async () => {
      markFtuxStageCompleted('resumeStudioEditor', 'u4');

      const { rerender } = render(<ResumeStudioIntroGuide viewMode="editor" userId="u4" />);
      await new Promise((r) => setTimeout(r, 550));
      expect(screen.queryByTestId('resume-studio-spotlight-tour')).toBeNull();

      rerender(<ResumeStudioIntroGuide viewMode="editor" userId="u4" forceOpen={true} />);
      await waitFor(() => {
        expect(screen.getByTestId('resume-studio-spotlight-tour')).toBeDefined();
      });
    });
  });

  describe('7. InterviewArenaIntroGuide Component', () => {
    it('renders and allows stepping through AI persona, speech cadence and STAR rubric', async () => {
      const onComplete = vi.fn();
      render(<InterviewArenaIntroGuide forceOpen={true} onComplete={onComplete} />);

      await waitFor(() => {
        expect(screen.getByTestId('interview-arena-guide-modal')).toBeDefined();
      });

      expect(screen.getByText(/Adaptive AI Interviewer/i)).toBeDefined();

      // Step 2
      fireEvent.click(screen.getByTestId('interview-arena-guide-next-btn'));
      expect(screen.getByText(/Speech Cadence & Audio Monitor/i)).toBeDefined();

      // Step 3
      fireEvent.click(screen.getByTestId('interview-arena-guide-next-btn'));
      expect(screen.getByText(/Instant STAR Rubric Evaluation/i)).toBeDefined();

      // Finish
      fireEvent.click(screen.getByTestId('interview-arena-guide-next-btn'));
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('skillezo_seen_interview_guide')).toBe('true');
    });
  });

  describe('8. Event-Driven Milestone Automation in useFtuxState', () => {
    it('listens to emitMilestoneCompleted event and updates completed milestones', () => {
      const { result } = renderHook(() => useFtuxState('event-test-user'));

      expect(result.current.completedMilestones).toEqual([]);

      act(() => {
        emitMilestoneCompleted('m-interview');
      });

      expect(result.current.completedMilestones).toContain('m-interview');

      act(() => {
        emitMilestoneCompleted('m-resume');
      });

      expect(result.current.completedMilestones).toContain('m-interview');
      expect(result.current.completedMilestones).toContain('m-resume');
    });

    it('triggers and dismisses celebration modal', () => {
      const { result } = renderHook(() => useFtuxState('celebration-test-user'));

      expect(result.current.showCelebrationModal).toBe(false);

      act(() => {
        result.current.triggerCelebration();
      });

      expect(result.current.showCelebrationModal).toBe(true);

      act(() => {
        result.current.dismissCelebration();
      });

      expect(result.current.showCelebrationModal).toBe(false);
      expect(result.current.hasSeenCelebration).toBe(true);
    });

    it('never shows welcome modal to existing/old accounts or while session is still loading', () => {
      const { result, rerender } = renderHook(
        ({ userId, isLoading, isExistingUser }) =>
          useFtuxState(userId, { isLoading, isExistingUser }),
        {
          initialProps: {
            userId: undefined as string | undefined,
            isLoading: true,
            isExistingUser: false,
          },
        }
      );

      expect(result.current.showWelcomeModal).toBe(false);

      rerender({ userId: 'old-account-1', isLoading: false, isExistingUser: true });
      expect(result.current.showWelcomeModal).toBe(false);
      expect(result.current.hasCompletedTour).toBe(true);
    });

    it('still shows welcome modal to a brand-new account even if an older account dismissed the guide in the same browser', () => {
      localStorage.setItem('skillezo_guide_dismissed', 'true');
      localStorage.setItem('skillezo_guide_dismissed_old-account', 'true');

      const { result } = renderHook(() =>
        useFtuxState('brand-new-account', { isLoading: false, isExistingUser: false })
      );

      expect(result.current.showWelcomeModal).toBe(true);
    });
  });
});
