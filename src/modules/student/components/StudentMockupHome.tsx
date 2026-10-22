import React from 'react';
import { UserAccount, StudentProgress, ClassAssignment } from '../../../types';
import { 
  Flame, 
  ArrowRight, 
  PieChart, 
  Ruler, 
  Triangle, 
  FileText, 
  Trophy, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { sounds } from '../../../utils/audio';

interface StudentMockupHomeProps {
  currentUser: UserAccount;
  studentProgress: StudentProgress;
  currentAssignment?: ClassAssignment;
  onNavigateTab: (tab: string) => void;
  onSelectTopic: (topicName: string) => void;
  onStartAssignment: (asg: ClassAssignment) => void;
}

export default function StudentMockupHome({
  currentUser,
  studentProgress,
  currentAssignment,
  onNavigateTab,
  onSelectTopic,
  onStartAssignment
}: StudentMockupHomeProps) {
  const studentName = currentUser.name ? currentUser.name.split(' ')[0] : (studentProgress.studentName || 'Student');
  const progressPercent = typeof studentProgress.averageScore === 'number' ? studentProgress.averageScore : 0;
  const questionsAttempted = typeof studentProgress.totalQuestionsAttempted === 'number' ? studentProgress.totalQuestionsAttempted : 0;
  const badgesEarned = Array.isArray(studentProgress.badges) ? studentProgress.badges.length : 0;
  const streakDays = typeof studentProgress.streakDays === 'number' ? studentProgress.streakDays : 0;

  // SVG Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // 6 Topic Cards from the mockup
  const topics = [
    {
      id: 'number_place_value',
      name: 'Number & Place Value',
      colorClass: 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-300 text-emerald-900',
      renderIcon: () => (
        <div className="font-black text-2xl tracking-tighter text-emerald-600 font-mono">
          1<span className="text-emerald-500">2</span><span className="text-emerald-700">3</span>
        </div>
      )
    },
    {
      id: 'fractions',
      name: 'Fractions',
      colorClass: 'bg-sky-50/70 border-sky-100 hover:border-sky-300 text-sky-900',
      renderIcon: () => (
        <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
          <PieChart className="w-7 h-7 text-sky-600" />
        </div>
      )
    },
    {
      id: 'decimals',
      name: 'Decimals',
      colorClass: 'bg-teal-50/60 border-teal-100 hover:border-teal-300 text-teal-900',
      renderIcon: () => (
        <div className="px-2.5 py-1 rounded-lg bg-teal-500/10 font-black text-xl text-teal-700 font-mono">
          0.1
        </div>
      )
    },
    {
      id: 'measurement',
      name: 'Measurement',
      colorClass: 'bg-amber-50/70 border-amber-100 hover:border-amber-300 text-amber-900',
      renderIcon: () => (
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Ruler className="w-7 h-7 text-amber-600" />
        </div>
      )
    },
    {
      id: 'geometry',
      name: 'Geometry',
      colorClass: 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-300 text-emerald-900',
      renderIcon: () => (
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <Triangle className="w-7 h-7 text-emerald-600 fill-emerald-500/30" />
        </div>
      )
    },
    {
      id: 'algebra',
      name: 'Algebra',
      colorClass: 'bg-indigo-50/70 border-indigo-100 hover:border-indigo-300 text-indigo-900',
      renderIcon: () => (
        <div className="font-black text-2xl font-serif text-indigo-700">
          x<sup className="text-base text-indigo-500 font-sans">2</sup>
        </div>
      )
    }
  ];

  const defaultAssignment: ClassAssignment = currentAssignment || {
    id: 'ASG-FRAC-5B',
    title: 'Fractions Practice',
    classId: 'CLS-6A',
    className: 'Grade 6A',
    subject: 'Mathematics',
    grade: 'Grade 6',
    questionIds: ['QG3-0001', 'QG3-0002'],
    dueDate: '20 Sep 2026',
    status: 'active',
    createdAt: '2026-09-10'
  };

  return (
    <div className="space-y-6">
      {/* Header Greeting & Streak Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hi {studentName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Let's keep going. Practice today and get one step closer to your goals.
          </p>
        </div>

        {/* Streak Card */}
        <div className="p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-orange-50/80 border border-orange-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-orange-600 fill-orange-500 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              You're on a {streakDays} day streak!
            </h4>
            <p className="text-[11px] text-slate-600">
              Great job! Keep it up!
            </p>
          </div>
        </div>
      </div>

      {/* "Choose a Topic" Section with 6 Playful Interactive Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Choose a Topic
          </h2>

          <button
            type="button"
            onClick={() => {
              sounds.click();
              onNavigateTab('practice');
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Topics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {topics.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                sounds.click();
                onSelectTopic(t.name);
              }}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col items-center justify-between text-center min-h-[140px] shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:-translate-y-0.5 ${t.colorClass}`}
            >
              <div className="flex-1 flex items-center justify-center my-1 group-hover:scale-108 transition-transform">
                {t.renderIcon()}
              </div>

              <div className="flex items-center gap-1 font-bold text-xs mt-2 group-hover:text-emerald-800 transition-colors">
                <span>{t.name}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: My Progress (circular gauge) & Current Assignment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: My Progress */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            My Progress
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular Gauge */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-black text-slate-900 font-mono block leading-none">
                  {progressPercent}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  Overall
                </span>
              </div>
            </div>

            {/* 3 Mini Stats */}
            <div className="space-y-2.5 w-full">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-mono font-bold text-slate-900">{questionsAttempted}</span>
                  <span className="text-slate-500 ml-1">Questions Attempted</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-mono font-bold text-slate-900">{badgesEarned}</span>
                  <span className="text-slate-500 ml-1">Badges Earned</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
                <div>
                  <span className="font-mono font-bold text-slate-900">{streakDays}</span>
                  <span className="text-slate-500 ml-1">Day Streak</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Continuously synced with daily learning goals
          </div>
        </div>

        {/* Right: Current Assignment */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Current Assignment
            </h2>

            <button
              type="button"
              onClick={() => {
                sounds.click();
                onNavigateTab('assignments');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-7 h-7 text-sky-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {defaultAssignment.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  10 questions • Due {defaultAssignment.dueDate}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playCorrect();
                onStartAssignment(defaultAssignment);
              }}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer hover:scale-102 active:scale-98 shrink-0 self-start sm:self-auto"
            >
              Start Now
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Teacher assigned from Ms. Taylor</span>
            <span className="text-sky-700 font-semibold font-mono text-xs">Due in 2 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
