import React from 'react';
import { 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Target,
  Zap
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
  const questionCount = dailyQuizActivity?.questionIds?.length || 5;

  return (
    <div
      id="daily-goal-notification-card"
      className={`rounded-2xl border transition-all duration-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
        isCompleted
          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
          : 'bg-gradient-to-r from-amber-50 via-orange-50/40 to-white border-amber-200 text-stone-900'
      } ${className}`}
    >
      {/* Left: Icon & Compact Goal Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
            isCompleted
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
              : 'bg-amber-100 border-amber-300 text-amber-900'
          }`}
        >
          {isCompleted ? '✓' : '🔥'}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-[#10246f]">
              {isCompleted ? "Today's Daily Goal Completed!" : "Daily Streak Quest"}
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              · {currentStreak} Day Streak 🔥
            </span>
          </div>
          <p className="text-[11px] text-slate-600 truncate">
            {isCompleted
              ? "Awesome work! You secured today's +50 XP & +15 Coins streak bonus."
              : `Complete ${questionCount} quick practice questions to extend your streak!`}
          </p>
        </div>
      </div>

      {/* Right: Compact Action */}
      <div className="shrink-0 self-end sm:self-center">
        {isCompleted ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Streak Safe</span>
          </span>
        ) : (
          <button
            type="button"
            id="start-daily-goal-btn"
            onClick={onStartDailyQuiz}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white text-xs font-bold transition shadow-xs hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Start Daily Quest ({questionCount} Qs)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
