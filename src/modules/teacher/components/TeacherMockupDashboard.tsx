import React from 'react';
import { UserAccount, ClassRoom, ClassAssignment, StudentProgress } from '../../../types';
import { 
  Plus, 
  FileText, 
  BarChart2, 
  Users, 
  ChevronRight, 
  Sprout, 
  Quote, 
  Layers, 
  HelpCircle,
  Calendar
} from 'lucide-react';
import { sounds } from '../../../utils/audio';

interface TeacherMockupDashboardProps {
  currentUser: UserAccount;
  classes: ClassRoom[];
  assignments: ClassAssignment[];
  students: StudentProgress[];
  onNavigateTab: (tab: string) => void;
  onOpenCreateAssignment: () => void;
  onSelectClass?: (classId: string) => void;
}

export default function TeacherMockupDashboard({
  currentUser,
  classes,
  assignments,
  students,
  onNavigateTab,
  onOpenCreateAssignment,
  onSelectClass
}: TeacherMockupDashboardProps) {
  // Mockup classes data
  const mockupClasses = [
    { id: 'CLS_GW_6A', name: 'Grade 6A', students: 24, score: 82 },
    { id: 'CLS_GW_5B', name: 'Grade 5B', students: 28, score: 78 },
    { id: 'CLS_GW_4A', name: 'Grade 4A', students: 26, score: 85 },
    { id: 'CLS_GW_3A', name: 'Grade 3A', students: 24, score: 80 },
  ];

  // Mockup assignments data
  const mockupAssignments = [
    { id: 'asg-1', title: 'Fractions Practice', class: 'Grade 5B', dueDate: '20 Sep 2026', submissions: '20 / 28' },
    { id: 'asg-2', title: 'Decimals Quiz', class: 'Grade 6A', dueDate: '18 Sep 2026', submissions: '22 / 24' },
    { id: 'asg-3', title: 'Area and Perimeter', class: 'Grade 6A', dueDate: '15 Sep 2026', submissions: '24 / 24' },
    { id: 'asg-4', title: 'Mixed Operations', class: 'Grade 4A', dueDate: '12 Sep 2026', submissions: '18 / 26' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Greeting & Date Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Good morning, {currentUser.name || 'Ms. Taylor'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Plan, assign and make math learning meaningful.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs">
            Tue, 22 Sep 2026
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <span>Small steps</span>
            <span className="text-emerald-600 font-bold">Big progress</span>
            <Sprout className="w-4 h-4 text-emerald-600 ml-0.5" />
          </div>
        </div>
      </div>

      {/* 4 Action / Quick Link Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Action 1: Create Assignment */}
        <div
          onClick={() => {
            sounds.click();
            onOpenCreateAssignment();
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 mt-3 group-hover:text-emerald-700 transition-colors">
            Create Assignment
          </span>
        </div>

        {/* Action 2: Browse Question Bank */}
        <div
          onClick={() => {
            sounds.click();
            onNavigateTab('questions');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-orange-300 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
        >
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 mt-3 group-hover:text-orange-700 transition-colors">
            Browse Question Bank
          </span>
        </div>

        {/* Action 3: View Class Progress */}
        <div
          onClick={() => {
            sounds.click();
            onNavigateTab('progress');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <BarChart2 className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 mt-3 group-hover:text-emerald-700 transition-colors">
            View Class Progress
          </span>
        </div>

        {/* Action 4: My Classes */}
        <div
          onClick={() => {
            sounds.click();
            onNavigateTab('classes');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 text-amber-600" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 mt-3 group-hover:text-amber-700 transition-colors">
            My Classes
          </span>
        </div>
      </div>

      {/* 2-Column Section: My Classes & Recent Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: My Classes */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              My Classes
            </h2>

            <button
              type="button"
              onClick={() => {
                sounds.click();
                onNavigateTab('classes');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {mockupClasses.map((cls) => (
              <div
                key={cls.id}
                onClick={() => {
                  sounds.click();
                  if (onSelectClass) onSelectClass(cls.id);
                  onNavigateTab('classes');
                }}
                className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {cls.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {cls.students} students
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {cls.score}%
                    </span>
                    <span className="text-[11px] text-slate-400 block -mt-0.5">
                      avg. score
                    </span>
                    {/* Small Progress Bar */}
                    <div className="w-16 h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${cls.score}%` }} 
                      />
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Active Term Roster</span>
            <span className="text-emerald-700 font-bold">102 Students Enrolled</span>
          </div>
        </div>

        {/* Right Column: Recent Assignments Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Recent Assignments
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Class</th>
                  <th className="pb-3 font-semibold">Due Date</th>
                  <th className="pb-3 font-semibold text-right">Submissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockupAssignments.map((asg) => (
                  <tr 
                    key={asg.id}
                    onClick={() => {
                      sounds.click();
                      onNavigateTab('assignments');
                    }}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 font-bold text-slate-900">
                      {asg.title}
                    </td>
                    <td className="py-3 text-slate-600">
                      {asg.class}
                    </td>
                    <td className="py-3 text-slate-500">
                      {asg.dueDate}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      {asg.submissions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
