import React from 'react';
import { 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ArrowRight, 
  Coins, 
  Target,
  Trophy,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { StudentProgress, Activity } from '../../../types';

export interface DailyGoalCardProps {
  studentProgress: StudentProgress;
  dailyQuizActivity?: Activity | null;
  onStartDailyQuiz: () => void;
  className?: string;
}

export default function DailyGoalCard({
  studentProgress,
  dailyQuizActivity,
  onStartDailyQuiz,
  className = ''
}: DailyGoalCardProps) {
  const isCompleted = Boolean(studentProgress.dailyQuizCompletedToday);
  const currentStreak = studentProgress.streakDays || 0;
  const nextStreak = currentStreak + 1;
  const questionCount = dailyQuizActivity?.questionIds?.length || 5;
  const bonusXp = 50;
  const bonusCoins = 15;

  // Next milestone calculation (e.g. 5, 10, 15, 20, 30 days)
  const streakMilestones = [3, 5, 7, 10, 14, 21, 30, 50, 100];
  const nextMilestone = streakMilestones.find(m => m > (isCompleted ? currentStreak : nextStreak)) || 30;
  const daysToMilestone = nextMilestone - (isCompleted ? currentStreak : currentStreak);

  return (
    <div
      id="daily-goal-notification-card"
      className={`rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-xs ${
        isCompleted
          ? 'bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white border-emerald-200/90'
          : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white border-amber-300/80 ring-1 ring-amber-400/20'
      } ${className}`}
    >
      {/* Subtle background glow effect */}
      <div 
        className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full pointer-events-none blur-2xl opacity-40 ${
          isCompleted ? 'bg-emerald-300' : 'bg-amber-400'
        }`} 
      />

      <div className="p-4 sm:p-5 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Column: Icon & Headline */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            {/* Animated Flame / Sun Badge */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs border transition-transform hover:scale-105 ${
                isCompleted
                  ? 'bg-emerald-100/80 border-emerald-300 text-emerald-800'
                  : 'bg-amber-100 border-amber-300 text-amber-900 animate-pulse'
              }`}
            >
              {isCompleted ? '🎉' : '🔥'}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  <span>Daily Goal</span>
                </span>

                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Streak Bonus Claimed!</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>Remaining Today</span>
                    </>
                  )}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-black text-stone-900 truncate">
                {isCompleted
                  ? `Daily Quiz Completed! ${currentStreak}-Day Streak Secured`
                  : `Complete Today's Daily Quiz to Unlock Your ${nextStreak}-Day Streak Bonus!`}
              </h3>

              <p className="text-xs text-stone-600">
                {isCompleted
                  ? `Great work! Your streak is protected. Return tomorrow morning to level up to Day ${nextStreak}!`
                  : `1 daily quiz required today. Answer all ${questionCount} questions to earn +1 Streak Day, +${bonusXp} XP, and +${bonusCoins} Coins.`}
              </p>
            </div>
          </div>

          {/* Right Column: Requirements Pill Checklist & CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-200/60">
            {/* Requirements Pills */}
            <div className="flex items-center gap-2 text-xs">
              {/* Requirement 1: Daily Quiz Status */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${
                  isCompleted
                    ? 'bg-white text-emerald-800 border-emerald-200 shadow-2xs'
                    : 'bg-white text-amber-900 border-amber-200 shadow-2xs'
                }`}
                title={isCompleted ? 'Daily quiz finished for today' : 'Daily quiz needs to be taken'}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin" />
                )}
                <span>Quiz: {isCompleted ? '1/1 Done' : '0/1 Taken'}</span>
              </div>

              {/* Requirement 2: Streak Bonus Preview */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200/90 text-stone-700 text-[11px] font-bold shadow-2xs"
                title="Daily streak bonus reward"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span>
                  {isCompleted ? `${currentStreak}d Active` : `➔ ${nextStreak}d Streak`}
                </span>
                <span className="text-amber-600 font-black ml-0.5">+{bonusXp} XP</span>
              </div>
            </div>

            {/* Action Button */}
            {isCompleted ? (
              <div className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600/15 text-emerald-800 text-xs font-black border border-emerald-300/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Streak Protected 🔥</span>
              </div>
            ) : (
              <button
                type="button"
                id="daily-goal-start-quiz-btn"
                onClick={onStartDailyQuiz}
                className="px-4 sm:px-5 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs hover:scale-102 active:scale-98 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Start Daily Quiz</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Milestone hint */}
        <div className="mt-3 pt-3 border-t border-stone-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-500">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <span className="font-bold text-stone-700 shrink-0">Today's Progress:</span>
            <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'w-full bg-emerald-500' : 'w-1/12 bg-amber-500'
                }`}
              />
            </div>
            <span className="font-black text-stone-800 shrink-0">
              {isCompleted ? '100%' : '0%'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-stone-600 font-medium">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span>
              {daysToMilestone > 0
                ? `${daysToMilestone} days to ${nextMilestone}-Day Streak Milestone Badge!`
                : `Streak Milestone unlocked! Keep going!`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
