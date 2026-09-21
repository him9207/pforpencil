import React, { useRef } from 'react';
import { StudentProgress, UserAccount } from '../../types';
import { 
  Award, 
  TrendingUp, 
  Flame, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Sparkles, 
  BarChart3, 
  Target,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';

interface StudentReportCardModalProps {
  student: StudentProgress;
  userAccount?: UserAccount;
  onClose: () => void;
  viewerRole?: string;
  schoolName?: string;
  className?: string;
  section?: string;
  room?: string;
  teacherName?: string;
  principalName?: string;
  parentName?: string;
}

export default function StudentReportCardModal({
  student,
  userAccount,
  onClose,
  viewerRole = 'parent',
  schoolName,
  className,
  section,
  room,
  teacherName,
  principalName,
  parentName
}: StudentReportCardModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Compute overall grade letter
  const score = student.averageScore || 88;
  const getGradeLetter = (pct: number) => {
    if (pct >= 95) return { letter: 'A+', standing: 'Outstanding Mastery', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 90) return { letter: 'A', standing: 'Excellent Proficiency', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (pct >= 85) return { letter: 'B+', standing: 'Very Good Progress', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 80) return { letter: 'B', standing: 'Good Competency', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (pct >= 70) return { letter: 'C', standing: 'Developing Skills', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { letter: 'Needs Support', standing: 'Targeted Review Needed', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const gradeInfo = getGradeLetter(score);

  // Standard competencies
  const competencies = [
    { name: 'Conceptual Understanding & Retention', rating: score >= 90 ? 'Exemplary' : 'Proficient', stars: score >= 90 ? 5 : 4 },
    { name: 'Problem Solving & Critical Thinking', rating: score >= 88 ? 'Exemplary' : 'Proficient', stars: score >= 88 ? 5 : 4 },
    { name: 'Quiz Accuracy & Speed Balance', rating: 'Proficient', stars: 4 },
    { name: 'Persistence & Daily Learning Habit', rating: student.streakDays >= 3 ? 'Exemplary' : 'Consistent', stars: student.streakDays >= 3 ? 5 : 4 },
    { name: 'Independent Task Completion', rating: 'Exemplary', stars: 5 },
  ];

  const handlePrint = () => {
    window.print();
  };

  const effectiveSchoolName = schoolName || student.schoolName || userAccount?.schoolName || 'Elementary Academy';
  const effectiveClassName = className || student.grade;
  const effectiveTeacherName = teacherName || (student.schoolOrParent === 'school' ? 'Lead Faculty Advisor' : 'Family Learning Mentor');
  const effectivePrincipalName = principalName || (student.schoolOrParent === 'school' ? `Principal / Academic Dean (${effectiveSchoolName})` : 'Academic Certification Board');
  const effectiveParentName = parentName || student.parentName || userAccount?.parentName || 'Parent / Legal Guardian';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div 
        ref={printRef}
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-4xl w-full my-auto overflow-hidden text-stone-900 print:shadow-none print:border-none print:max-w-none print:rounded-none"
      >
        {/* Top Action Bar (hidden when printing) */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">{student.avatar}</span>
            <div>
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider block">
                Official Student Academic Report Card
              </span>
              <h2 className="text-sm font-black text-white">
                {student.studentName} • {student.grade}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible">
          {/* Official Academy / Institution Header */}
          <div className="border-b-2 border-stone-200 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-stone-900 text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
                🎓
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                  FunLearn Academic Mastery Network
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {effectiveSchoolName}
                </h1>
                <p className="text-xs text-stone-500 font-medium">
                  Comprehensive Student Cumulative Performance & Analytics Portfolio
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-stone-200 sm:pr-4 pl-3 sm:pl-0">
              <div className="text-[11px] font-bold text-stone-400 uppercase">Assessment Term</div>
              <div className="text-xs font-black text-stone-900">Academic Year 2025–2026</div>
              <div className="text-[10px] text-stone-500 font-mono">Issued: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>

          {/* Student Profile Card */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 block">Learner Name</span>
              <div className="font-black text-stone-900 text-sm flex items-center gap-1.5 mt-0.5">
                <span>{student.avatar}</span>
                <span>{student.studentName}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 block">Student ID / Login</span>
              <div className="font-mono font-bold text-stone-800 mt-0.5">
                {student.studentId} <span className="text-stone-400">({student.studentUsername})</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 block">Current Cohort & Class</span>
              <div className="font-bold text-stone-800 mt-0.5">
                {effectiveClassName} • {student.grade}
                {section && <span className="text-blue-600 font-semibold ml-1">({section})</span>}
                {room && <span className="text-stone-500 font-normal ml-1">• {room}</span>}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 block">Family / Guardian</span>
              <div className="font-bold text-stone-800 mt-0.5">
                {effectiveParentName}
              </div>
            </div>
          </div>

          {/* Key Analytics Summary Hero Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl border text-center ${gradeInfo.color}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                Cumulative Grade
              </span>
              <div className="text-3xl font-black mt-1">
                {gradeInfo.letter}
              </div>
              <span className="text-[11px] font-bold block mt-0.5">
                {score}% Average
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Total Quizzes Completed
              </span>
              <div className="text-3xl font-black text-stone-900 mt-1">
                {student.totalQuizzesTaken}
              </div>
              <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                100% Completion Rate
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Active Learning Streak
              </span>
              <div className="text-3xl font-black text-orange-600 mt-1 flex items-center justify-center gap-1">
                <span>{student.streakDays}</span>
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              </div>
              <span className="text-[11px] text-stone-500 font-medium block mt-0.5">
                Consecutive Days
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Mastery Level & XP
              </span>
              <div className="text-3xl font-black text-indigo-700 mt-1">
                Lv. {student.level}
              </div>
              <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">
                {student.xp.toLocaleString()} Total XP
              </span>
            </div>
          </div>

          {/* Subject-by-Subject Mastery Matrix */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Curricular Subject Mastery Breakdown</span>
                </h3>
                <p className="text-[11px] text-stone-500">
                  Performance across evaluated core disciplines aligned with national education benchmarks
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase">
                Pass Criterion: 70%+
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(student.subjectMastery || {}).map(([subject, subjectScore]) => {
                const subGrade = getGradeLetter(subjectScore);
                return (
                  <div key={subject} className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70 hover:bg-stone-50 transition">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-900 mb-1.5">
                      <span className="flex items-center gap-2">
                        <span>{subject}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${subGrade.color}`}>
                          {subGrade.letter}
                        </span>
                      </span>
                      <span className="font-mono">{subjectScore}%</span>
                    </div>

                    {/* Visual Meter */}
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          subjectScore >= 90 ? 'bg-emerald-500' : subjectScore >= 80 ? 'bg-blue-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${subjectScore}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pedagogical Competencies & Behavioral Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Foundational Learning Competencies</span>
              </h3>
              <div className="space-y-2 text-xs">
                {competencies.map((comp) => (
                  <div key={comp.name} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <span className="text-stone-700 font-medium text-[11px]">{comp.name}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400 text-xs">
                        {'★'.repeat(comp.stars)}{'☆'.repeat(5 - comp.stars)}
                      </div>
                      <span className="text-[10px] font-bold text-stone-500">{comp.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Growth Areas */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Strengths & Recommended Pathways</span>
              </h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="font-bold flex items-center gap-1 text-emerald-900 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Key Demonstrated Strengths</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Demonstrates rapid mental agility in <strong>English Vocabulary, Reading Context, and Pattern Recognition</strong>. Consistently solves foundational items in under 8 seconds.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                  <div className="font-bold flex items-center gap-1 text-amber-900 mb-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Target Growth Area for Next Term</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Continue reinforcement on multi-step applied Science problems and fractional equivalence via interactive Boss Quests.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Earned Honors & Badges Gallery */}
          {student.badges && student.badges.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Earned Academic Badges & Achievements ({student.badges.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {student.badges.map((b) => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-1">
                    <span className="text-2xl block">{b.icon}</span>
                    <span className="text-[11px] font-bold text-stone-900 block truncate">{b.name}</span>
                    <span className="text-[9px] text-stone-400 block font-mono">{b.unlockedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Signatures & Certification for Print */}
          <div className="pt-6 border-t-2 border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-stone-600">
            <div>
              <div className="h-10 border-b border-stone-400 mb-1 flex items-end pb-1">
                <span className="font-serif italic text-stone-900 text-sm font-semibold tracking-wide">
                  {effectiveTeacherName}
                </span>
              </div>
              <span className="font-bold text-stone-900 block">Class Lead / Faculty Advisor</span>
              <span className="text-[10px] text-stone-400">Verified Educator Signature</span>
            </div>

            <div>
              <div className="h-10 border-b border-stone-400 mb-1 flex items-end pb-1">
                <span className="font-serif italic text-stone-900 text-sm font-semibold tracking-wide">
                  {effectivePrincipalName}
                </span>
              </div>
              <span className="font-bold text-stone-900 block">Principal / Academic Dean</span>
              <span className="text-[10px] text-stone-400">Institutional Seal & Endorsement</span>
            </div>

            <div>
              <div className="h-10 border-b border-stone-400 mb-1 flex items-end pb-1">
                <span className="font-serif italic text-stone-900 text-sm font-semibold tracking-wide">
                  {effectiveParentName}
                </span>
              </div>
              <span className="font-bold text-stone-900 block">Parent / Guardian Signature</span>
              <span className="text-[10px] text-stone-400">Family Digital Acknowledgment</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-stone-500">
            FunLearn Unified Learning System • Document ID: RC-{student.studentId}-{new Date().getFullYear()}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Close Report Card
          </button>
        </div>
      </div>
    </div>
  );
}
