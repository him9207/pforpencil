import React from 'react';
import { UserAccount, StudentProgress } from '../../../types';
import { 
  FileText, 
  Flame, 
  Trophy, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Star, 
  Target, 
  PenTool,
  ArrowRight
} from 'lucide-react';
import { sounds } from '../../../utils/audio';

interface ParentMockupDashboardProps {
  currentUser: UserAccount;
  activeChild: StudentProgress;
  allChildren: StudentProgress[];
  onSelectChild: (studentId: string) => void;
  onNavigateTab: (tab: string) => void;
  onViewReportCard: () => void;
}

export default function ParentMockupDashboard({
  currentUser,
  activeChild,
  allChildren,
  onSelectChild,
  onNavigateTab,
  onViewReportCard
}: ParentMockupDashboardProps) {
  const defaultTopics = [
    'Number & Place Value',
    'Fractions',
    'Decimals',
    'Measurement',
    'Geometry',
    'Algebra'
  ];

  // Dynamic topic performance calculated from activeChild mastery records
  const topicPerformance = defaultTopics.map((topicName) => {
    const fromSubject = activeChild?.subjectMastery?.[topicName];
    const fromSkill = activeChild?.skillMastery?.[topicName]?.accuracy;
    const resolved = typeof fromSubject === 'number'
      ? fromSubject
      : (typeof fromSkill === 'number' ? fromSkill : 0);
    return { name: topicName, score: resolved };
  });

  const childName = activeChild?.studentName || 'Child';
  const childGrade = activeChild?.grade || 'Grade 6';
  const childStreak = typeof activeChild?.streakDays === 'number' ? activeChild.streakDays : 0;
  const childQuestions = typeof activeChild?.totalQuestionsAttempted === 'number' ? activeChild.totalQuestionsAttempted : 0;
  const childBadges = Array.isArray(activeChild?.badges) ? activeChild.badges.length : 0;
  const childProgress = typeof activeChild?.averageScore === 'number' ? activeChild.averageScore : 0;

  // SVG Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (childProgress / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header Greeting & Child Switcher Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {currentUser.name ? currentUser.name.split(' ')[0] : 'Priya'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Here's how {childName} is progressing in Math.
          </p>
        </div>

        {/* Child Switcher Pill */}
        <div className="relative">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-900 font-bold text-xs flex items-center justify-center border border-teal-200">
              {childName[0]?.toUpperCase() || 'A'}
            </div>
            <div className="text-left text-xs">
              <span className="font-bold text-slate-900 block leading-tight">{childName}</span>
              <span className="text-[10px] text-slate-400 font-medium leading-tight">{childGrade}</span>
            </div>
            {allChildren.length > 1 && (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Circular Progress Gauge */}
        <div 
          onClick={() => {
            sounds.click();
            onViewReportCard();
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-emerald-200 transition cursor-pointer flex items-center gap-4"
        >
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="text-slate-100"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r={radius}
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-900 font-mono">
              {childProgress}%
            </span>
          </div>

          <div>
            <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {childProgress}%
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Overall Progress
            </div>
          </div>
        </div>

        {/* Card 2: Questions Attempted */}
        <div 
          onClick={() => {
            sounds.click();
            onNavigateTab('progress');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-blue-200 transition cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {childQuestions}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Questions Attempted
            </div>
          </div>
        </div>

        {/* Card 3: Current Streak */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-orange-600 fill-orange-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {childStreak} days
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Current Streak
            </div>
          </div>
        </div>

        {/* Card 4: Badges Earned */}
        <div 
          onClick={() => {
            sounds.click();
            onNavigateTab('progress');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-amber-200 transition cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {childBadges}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
              Badges Earned
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Topic Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Topic Performance Progress Bars */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Topic Performance
            </h2>

            <button
              type="button"
              onClick={() => {
                sounds.click();
                onViewReportCard();
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {topicPerformance.map((topic, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{topic.name}</span>
                  <span className="font-mono text-slate-900">{topic.score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700" 
                    style={{ width: `${topic.score}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Recent Activity
            </h2>

            <button
              type="button"
              onClick={() => {
                sounds.click();
                onNavigateTab('progress');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Activity 1 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Completed Algebra Practice
                </p>
                <p className="text-[11px] text-slate-400">
                  Today, 10:15 AM
                </p>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Earned a new badge: Problem Solver
                </p>
                <p className="text-[11px] text-slate-400">
                  Yesterday, 4:30 PM
                </p>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Scored 90% in Fractions Quiz
                </p>
                <p className="text-[11px] text-slate-400">
                  16 Sep 2026
                </p>
              </div>
            </div>

            {/* Activity 4 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <PenTool className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Completed 5 questions
                </p>
                <p className="text-[11px] text-slate-400">
                  15 Sep 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
