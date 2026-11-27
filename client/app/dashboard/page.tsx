'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { ProfileCompletionGuide } from '@/components/dashboard/ProfileCompletionGuide';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { RecentVerificationTable } from '@/components/dashboard/RecentVerificationTable';
import {
  useFtuxState,
  FtuxWelcomeModal,
  DashboardSpotlightTour,
  FloatingOnboardingDock,
  OnboardingCelebrationModal,
} from '@/components/dashboard/ftux';
import { useSession } from '@/lib/auth-client';
import { apiFetch } from '@/lib/api';
import { profileService, CandidateProfile } from '@/services/profile.service';
import { resumeService } from '@/services/resume.service';
import { verificationService } from '@/services/verification.service';

export default function DashboardPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [resumesCount, setResumesCount] = useState<number>(0);
  const [interviewsCount, setInterviewsCount] = useState<number>(0);
  const [records, setRecords] = useState<any[]>([]);
  const [verifiedSkillsCount, setVerifiedSkillsCount] = useState<number>(0);
  const { data: session, isPending: isSessionPending } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isExistingUser = useMemo(() => {
    if (resumesCount > 0 || interviewsCount > 0 || verifiedSkillsCount > 0) return true;
    if ((profile?.completionPercentage ?? 0) >= 80) return true;
    const createdAt = (session?.user as { createdAt?: string | Date } | undefined)?.createdAt;
    if (createdAt) {
      const ageMs = Date.now() - new Date(createdAt).getTime();
      if (Number.isFinite(ageMs) && ageMs > 24 * 60 * 60 * 1000) return true;
    }
    return false;
  }, [resumesCount, interviewsCount, verifiedSkillsCount, profile?.completionPercentage, session?.user]);

  const ftux = useFtuxState(profile?.userId || session?.user?.id, {
    isLoading: isLoading || isSessionPending,
    isExistingUser,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [profileData, userResumes, recordsData, interviewsRes] = await Promise.all([
          profileService.getMyProfile().catch(() => null),
          resumeService.getUserResumes().catch(() => []),
          verificationService.getUserRecords().catch(() => []),
          apiFetch<{ success: boolean; data: { total?: number; data?: any[] } }>('/api/interviews/sessions').catch(() => null),
        ]);

        if (!isMounted) return;

        if (profileData) setProfile(profileData);
        setResumesCount(userResumes?.length || 0);
        setRecords(recordsData || []);
        const verified = (recordsData || []).filter((r: any) => r.status === 'verified').length;
        setVerifiedSkillsCount(verified);

        if (interviewsRes?.data) {
          const count = interviewsRes.data.total ?? interviewsRes.data.data?.length ?? 0;
          setInterviewsCount(count);
        }
      } catch (err) {
        console.error('Error loading dashboard onboarding data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const candidateSkills = useMemo(() => {
    if (!profile?.skills || !Array.isArray(profile.skills)) return [];
    return profile.skills.map((s) => s.name).filter(Boolean);
  }, [profile]);

  return (
    <DashboardLayout
      topbarLeftOfSearch={
        <FloatingOnboardingDock
          userId={profile?.userId || session?.user?.id}
          variant="topbar"
          isTourActive={ftux.isTourActive}
          resumesCount={resumesCount}
          interviewsCount={interviewsCount}
          completedMilestones={ftux.completedMilestones}
          verifiedSkillsCount={verifiedSkillsCount}
          hasProfileGoal={Boolean(profile?.targetRole || profile?.headline)}
          completionPercentage={profile?.completionPercentage}
          onReplayTour={ftux.replayTour}
          onOpenWelcome={ftux.openWelcomeModal}
          onAllMilestonesComplete={() => {
            if (!ftux.hasSeenCelebration) {
              ftux.triggerCelebration();
            }
          }}
        />
      }
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner
          profile={profile}
          records={records}
          isLoading={isLoading}
          resumesCount={resumesCount}
        />

        {/* Profile Completion Onboarding Guide */}
        <ProfileCompletionGuide
          profile={profile}
          resumesCount={resumesCount}
          verifiedSkillsCount={verifiedSkillsCount}
        />

        {/* Top Summary Metrics */}
        <DashboardSummary profile={profile} records={records} isLoading={isLoading} />

        {/* 4 Core Stat Cards */}
        <StatsGrid profile={profile} records={records} isLoading={isLoading} />

        {/* Middle Section: Quick Actions & Live Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <QuickActions />
          <ActivityTimeline userSkills={candidateSkills} isLoading={isLoading} />
        </div>

        {/* Bottom Section: Recent Verification Table */}
        <RecentVerificationTable records={records} isLoading={isLoading} />

        {/* First-Time User Experience (FTUX) Guides */}
        <FtuxWelcomeModal
          isOpen={ftux.showWelcomeModal}
          userName={session?.user?.name || 'Candidate'}
          onStartTour={ftux.startTour}
          onDismiss={ftux.dismissWelcome}
        />

        <DashboardSpotlightTour
          isActive={ftux.isTourActive}
          currentStep={ftux.currentStep}
          currentStepIndex={ftux.currentStepIndex}
          totalSteps={ftux.totalSteps}
          onNext={ftux.nextTourStep}
          onPrev={ftux.prevTourStep}
          onSkip={ftux.skipTour}
        />

        <OnboardingCelebrationModal
          isOpen={ftux.showCelebrationModal}
          userName={session?.user?.name || profile?.headline || 'Candidate'}
          onDismiss={ftux.dismissCelebration}
        />
      </div>
    </DashboardLayout>
  );
}
