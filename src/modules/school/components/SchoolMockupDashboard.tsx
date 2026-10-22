import React, { useState } from 'react';
import { SchoolOrganization, ClassRoom, StudentProgress, UserAccount } from '../../../types';
import { 
  Users, 
  GraduationCap, 
  Layers, 
  TrendingUp, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  UserPlus, 
  UserCheck, 
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import { sounds } from '../../../utils/audio';

interface SchoolMockupDashboardProps {
  school: SchoolOrganization;
  classes: ClassRoom[];
  teachers: UserAccount[];
  students: StudentProgress[];
  onNavigateTab: (tab: string) => void;
  onOpenAddClass?: () => void;
  onOpenAddTeacher?: () => void;
  onOpenAddStudent?: () => void;
}

export default function SchoolMockupDashboard({
  school,
  classes,
  teachers,
  students,
  onNavigateTab,
  onOpenAddClass,
  onOpenAddTeacher,
  onOpenAddStudent
}: SchoolMockupDashboardProps) {
  const [selectedTerm, setSelectedTerm] = useState('Term 3, 2026');

  // Exact metrics from the mockup
  const totalStudentsCount = 120;
  const totalTeachersCount = 8;
  const totalClassesCount = 12;
  const activeLearnersPercent = 92;

  // Grade breakdown for grouped bar chart (Foundation, 1, 2, 3, 4, 5, 6)
  const gradeProgressData = [
    { grade: 'Foundation', attempted: 48, correct: 38 },
    { grade: '1', attempted: 60, correct: 46 },
    { grade: '2', attempted: 72, correct: 58 },
    { grade: '3', attempted: 78, correct: 62 },
    { grade: '4', attempted: 84, correct: 70 },
    { grade: '5', attempted: 90, correct: 78 },
    { grade: '6', attempted: 96, correct: 84 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner: Welcome & Term Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, Greenwood Primary!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track learning, support your teachers, and help every student grow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="appearance-none bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-4 py-2 pr-9 text-xs sm:text-sm font-bold text-slate-700 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Term 3, 2026">Term 3, 2026</option>
              <option value="Term 2, 2026">Term 2, 2026</option>
              <option value="Term 1, 2026">Term 1, 2026</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Row (Exact mockup styling with rounded cards & circular icon badges) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Students */}
        <div 
          onClick={() => {
            sounds.click();
            onNavigateTab('students');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-emerald-200 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-teal-100/90 text-teal-800 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {totalStudentsCount}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Students
            </div>
          </div>
        </div>

        {/* Card 2: Teachers */}
        <div 
          onClick={() => {
            sounds.click();
            onNavigateTab('teachers');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-amber-200 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-amber-100/90 text-amber-800 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {totalTeachersCount}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Teachers
            </div>
          </div>
        </div>

        {/* Card 3: Classes */}
        <div 
          onClick={() => {
            sounds.click();
            onNavigateTab('classes');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-rose-200 transition-all cursor-pointer flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-rose-100/90 text-rose-800 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-rose-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {totalClassesCount}
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Classes
            </div>
          </div>
        </div>

        {/* Card 4: Active Learners */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100/90 text-emerald-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {activeLearnersPercent}%
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Active Learners
            </div>
          </div>
        </div>
      </div>

      {/* Middle 2-Column Section: Student Progress Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Student Progress Grouped Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Student Progress
            </h2>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
              <span>This Term</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Grouped Bar Chart Canvas */}
          <div className="relative pt-4 pb-2">
            {/* Horizontal Grid lines */}
            <div className="h-48 w-full flex flex-col justify-between border-b border-slate-200/80 text-[11px] font-mono text-slate-400 relative">
              <div className="border-b border-slate-100 flex items-center justify-between pb-0.5">
                <span>100%</span>
              </div>
              <div className="border-b border-slate-100 flex items-center justify-between pb-0.5">
                <span>75%</span>
              </div>
              <div className="border-b border-slate-100 flex items-center justify-between pb-0.5">
                <span>50%</span>
              </div>
              <div className="border-b border-slate-100 flex items-center justify-between pb-0.5">
                <span>25%</span>
              </div>
              <div className="flex items-center justify-between pb-0.5">
                <span>0%</span>
              </div>

              {/* Bars Overlay */}
              <div className="absolute inset-0 pl-10 pr-2 flex items-end justify-between gap-2 sm:gap-4 pb-1">
                {gradeProgressData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1 sm:gap-1.5 h-full w-full justify-center">
                      {/* Bar 1: Questions Attempted (Green) */}
                      <div 
                        className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-sm transition-all duration-300 hover:brightness-110"
                        style={{ height: `${item.attempted}%` }}
                        title={`${item.grade}: ${item.attempted}% Questions Attempted`}
                      />
                      {/* Bar 2: Correct Answers (Yellow/Gold) */}
                      <div 
                        className="w-2.5 sm:w-3.5 bg-amber-400 rounded-t-sm transition-all duration-300 hover:brightness-110"
                        style={{ height: `${item.correct}%` }}
                        title={`${item.grade}: ${item.correct}% Correct Answers`}
                      />
                    </div>
                    {/* X-axis Label */}
                    <span className="text-[11px] font-semibold text-slate-600 mt-2 truncate">
                      {item.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span>Questions Attempted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" />
                <span>Correct Answers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity (Mockup list) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Recent Activity
            </h2>

            <button
              type="button"
              onClick={() => {
                sounds.click();
                onNavigateTab('students');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Activity 1 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  12 new students added
                </p>
                <p className="text-[11px] text-slate-400">
                  2 hours ago
                </p>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-teal-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Grade 4A completed a math quiz
                </p>
                <p className="text-[11px] text-slate-400">
                  4 hours ago
                </p>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  New teacher joined
                </p>
                <p className="text-[11px] text-slate-400">
                  1 day ago
                </p>
              </div>
            </div>

            {/* Activity 4 */}
            <div className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Subscription renewed
                </p>
                <p className="text-[11px] text-slate-400">
                  2 days ago
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Button for School Admin */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>School System Healthy</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All 12 Classes Syncing</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
