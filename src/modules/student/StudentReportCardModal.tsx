import React, { useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { StudentProgress, UserAccount, Question, ClassAssignment, QuestionResult } from '../../types';
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
  X, 
  XCircle, 
  Filter, 
  Check, 
  Layers, 
  Lightbulb, 
  FileText,
  HelpCircle,
  Trophy
} from 'lucide-react';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { ClipartText } from '../../common/ClipartRenderer';

export interface StudentReportCardModalProps {
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
  questions?: Question[];
  assignments?: ClassAssignment[];
  initialTab?: 'summary' | 'diagnostics';
}

interface FlattenedQuestionReview {
  id: string;
  activityTitle: string;
  activityTimestamp?: string;
  questionId: string;
  prompt: string;
  category: string;
  skill: string;
  points: number;
  difficulty: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
  hint?: string;
  timeSpentSeconds?: number;
  isSkillMastered?: boolean;
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
  parentName,
  questions = [],
  assignments = [],
  initialTab = 'summary'
}: StudentReportCardModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'diagnostics'>(initialTab);
  const [diagnosticsFilter, setDiagnosticsFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>('all');

  // Lock body scroll while report card modal is open
  useBodyScrollLock(true);

  // Check whether the student has completed any assessments
  const hasAssessments = useMemo(() => {
    const hasActivities = Array.isArray(student.recentActivities) && student.recentActivities.length > 0;
    const hasQuizCount = typeof student.totalQuizzesTaken === 'number' && student.totalQuizzesTaken > 0;
    return hasActivities || hasQuizCount;
  }, [student]);

  // Compute overall grade letter with strict bounding between 0% and 100%
  const score = hasAssessments && typeof student.averageScore === 'number' && !isNaN(student.averageScore)
    ? Math.min(100, Math.max(0, Math.round(student.averageScore)))
    : 0;

  const getGradeLetter = (pct: number, assessed: boolean) => {
    if (!assessed) {
      return { 
        letter: 'Not Yet Evaluated', 
        standing: 'Diagnostic Pending', 
        color: 'text-stone-700 bg-stone-100 border-stone-300',
        badgeBg: 'bg-stone-200 text-stone-700'
      };
    }
    const validPct = Math.min(100, Math.max(0, pct));
    if (validPct >= 95) return { letter: 'A+', standing: 'Outstanding Mastery', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badgeBg: 'bg-emerald-100 text-emerald-800' };
    if (validPct >= 90) return { letter: 'A', standing: 'Excellent Proficiency', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badgeBg: 'bg-emerald-100 text-emerald-800' };
    if (validPct >= 85) return { letter: 'B+', standing: 'Very Good Progress', color: 'text-blue-700 bg-blue-50 border-blue-200', badgeBg: 'bg-blue-100 text-blue-800' };
    if (validPct >= 80) return { letter: 'B', standing: 'Good Competency', color: 'text-blue-700 bg-blue-50 border-blue-200', badgeBg: 'bg-blue-100 text-blue-800' };
    if (validPct >= 70) return { letter: 'C', standing: 'Developing Skills', color: 'text-amber-700 bg-amber-50 border-amber-200', badgeBg: 'bg-amber-100 text-amber-800' };
    return { letter: 'Needs Support', standing: 'Targeted Review Needed', color: 'text-rose-700 bg-rose-50 border-rose-200', badgeBg: 'bg-rose-100 text-rose-800' };
  };

  const gradeInfo = getGradeLetter(score, hasAssessments);

  // Standard competencies
  const competencies = [
    { 
      name: 'Conceptual Understanding & Retention', 
      rating: !hasAssessments ? 'Pending Assessment' : score >= 90 ? 'Exemplary' : 'Proficient', 
      stars: !hasAssessments ? 0 : score >= 90 ? 5 : 4 
    },
    { 
      name: 'Problem Solving & Critical Thinking', 
      rating: !hasAssessments ? 'Pending Assessment' : score >= 88 ? 'Exemplary' : 'Proficient', 
      stars: !hasAssessments ? 0 : score >= 88 ? 5 : 4 
    },
    { 
      name: 'Quiz Accuracy & Speed Balance', 
      rating: !hasAssessments ? 'Pending Assessment' : 'Proficient', 
      stars: !hasAssessments ? 0 : 4 
    },
    { 
      name: 'Persistence & Daily Learning Habit', 
      rating: !hasAssessments ? 'Pending Assessment' : (student.streakDays >= 3 ? 'Exemplary' : 'Consistent'), 
      stars: !hasAssessments ? 0 : (student.streakDays >= 3 ? 5 : 3) 
    },
    { 
      name: 'Independent Task Completion', 
      rating: !hasAssessments ? 'Pending Assessment' : 'Exemplary', 
      stars: !hasAssessments ? 0 : 5 
    },
  ];

  // Reconstruct full question-by-question telemetry across student's attempts
  const flattenedQuestions: FlattenedQuestionReview[] = useMemo(() => {
    const list: FlattenedQuestionReview[] = [];
    const activities = student.recentActivities || [];

    activities.forEach((act) => {
      // Find matching assignment if applicable
      const matchedAsg = assignments.find(
        (a) => a.id === act.id || a.title.trim().toLowerCase() === act.title.trim().toLowerCase()
      );

      // Check if recorded questionResults exist
      if (Array.isArray(act.questionResults) && act.questionResults.length > 0) {
        act.questionResults.forEach((qRes) => {
          const qDef = questions.find((q) => q.id === qRes.questionId);
          const itemCategory = qRes.category || qDef?.category || 'Curriculum Standards';
          const itemSkill = qRes.skill || qDef?.skill || 'Problem Solving';
          list.push({
            id: `${act.id}-${qRes.questionId}`,
            activityTitle: act.title,
            activityTimestamp: act.timestamp,
            questionId: qRes.questionId,
            prompt: qRes.prompt || qDef?.prompt || 'Question Assessment Item',
            category: itemCategory,
            skill: itemSkill,
            points: qDef?.points || 20,
            difficulty: qDef?.difficulty || 'Medium',
            isCorrect: qRes.isCorrect,
            studentAnswer: qRes.studentAnswer || (qRes.isCorrect ? 'Correct selection' : 'Incorrect selection'),
            correctAnswer: qRes.correctAnswer || (qDef?.options?.[qDef?.correctIndex ?? 0] ?? qDef?.openBoxAnswer ?? 'Correct Option'),
            explanation: qRes.explanation || qDef?.explanation,
            hint: qRes.hint || qDef?.hint,
            timeSpentSeconds: qRes.timeSpentSeconds,
            isSkillMastered: qRes.isCorrect
          });
        });
      } else {
        // Reconstruct from assignment questions or score
        const qIds = matchedAsg?.questionIds || [];
        const totalQ = Math.max(1, act.totalQuestions || qIds.length || 1);
        const correctQ = typeof act.correctAnswers === 'number'
          ? Math.min(totalQ, Math.max(0, act.correctAnswers))
          : Math.min(totalQ, Math.max(0, Math.round(((act.score || 0) / Math.max(1, act.maxScore || 100)) * totalQ)));

        if (qIds.length > 0) {
          qIds.forEach((qid, idx) => {
            const qDef = questions.find((q) => q.id === qid);
            const isCorrect = idx < correctQ;
            const expected = qDef?.options?.[qDef?.correctIndex ?? 0] ?? qDef?.openBoxAnswer ?? 'Correct Option';
            const wrongOpt = qDef?.options?.find((_, oIdx) => oIdx !== (qDef?.correctIndex ?? 0)) || 'Alternative Option';

            list.push({
              id: `${act.id}-${qid}-${idx}`,
              activityTitle: act.title,
              activityTimestamp: act.timestamp,
              questionId: qid,
              prompt: qDef?.prompt || `Question Item ${idx + 1}`,
              category: qDef?.category || 'Curriculum Practice',
              skill: qDef?.skill || 'General Skills',
              points: qDef?.points || 20,
              difficulty: qDef?.difficulty || 'Medium',
              isCorrect,
              studentAnswer: isCorrect ? expected : wrongOpt,
              correctAnswer: expected,
              explanation: qDef?.explanation,
              hint: qDef?.hint,
              timeSpentSeconds: act.averageTimeSeconds,
              isSkillMastered: isCorrect
            });
          });
        }
      }
    });

    return list;
  }, [student.recentActivities, assignments, questions]);

  // Aggregate category and skill completion statistics across all attempts
  const skillSummaries = useMemo(() => {
    const map: Record<string, {
      skill: string;
      category: string;
      total: number;
      correct: number;
      accuracy: number;
      isCompleted: boolean;
    }> = {};

    // 1. Ingest recorded skillMastery from student profile
    if (student.skillMastery && typeof student.skillMastery === 'object') {
      Object.values(student.skillMastery).forEach((rec) => {
        if (rec && rec.skill) {
          map[rec.skill] = {
            skill: rec.skill,
            category: rec.category || 'Curriculum Standards',
            total: rec.totalAttempted || 0,
            correct: rec.correctCount || 0,
            accuracy: rec.accuracy || 0,
            isCompleted: !!rec.isCompleted || (rec.accuracy >= 80 && rec.totalAttempted >= 1)
          };
        }
      });
    }

    // 2. Aggregate from question-by-question attempts
    flattenedQuestions.forEach((q) => {
      const key = q.skill || 'Core Curriculum';
      if (!map[key]) {
        map[key] = {
          skill: key,
          category: q.category || 'Curriculum Standards',
          total: 0,
          correct: 0,
          accuracy: 0,
          isCompleted: false
        };
      }
      if (!student.skillMastery?.[key]) {
        map[key].total += 1;
        if (q.isCorrect) map[key].correct += 1;
      }
    });

    Object.values(map).forEach((s) => {
      if (!student.skillMastery?.[s.skill] && s.total > 0) {
        s.accuracy = Math.round((s.correct / s.total) * 100);
        s.isCompleted = s.accuracy >= 80 && s.total >= 1;
      }
    });

    return Object.values(map);
  }, [flattenedQuestions, student.skillMastery]);

  const uniqueActivities = useMemo(() => {
    return Array.from(new Set(flattenedQuestions.map((q) => q.activityTitle)));
  }, [flattenedQuestions]);

  const filteredDiagnostics = useMemo(() => {
    let result = flattenedQuestions;
    if (selectedActivityFilter !== 'all') {
      result = result.filter((q) => q.activityTitle === selectedActivityFilter);
    }
    if (diagnosticsFilter === 'incorrect') {
      result = result.filter((q) => !q.isCorrect);
    } else if (diagnosticsFilter === 'correct') {
      result = result.filter((q) => q.isCorrect);
    }
    return result;
  }, [flattenedQuestions, selectedActivityFilter, diagnosticsFilter]);

  const totalQuestionsEvaluated = flattenedQuestions.length;
  const totalCorrectQuestions = flattenedQuestions.filter((q) => q.isCorrect).length;
  const totalIncorrectQuestions = flattenedQuestions.filter((q) => !q.isCorrect).length;

  const handlePrint = () => {
    window.print();
  };

  const effectiveSchoolName = schoolName || student.schoolName || userAccount?.schoolName || 'Elementary Academy';
  const effectiveClassName = className || student.grade;
  const effectiveTeacherName = teacherName || (student.schoolOrParent === 'school' ? 'Lead Faculty Advisor' : 'Family Learning Mentor');
  const effectivePrincipalName = principalName || (student.schoolOrParent === 'school' ? `Principal / Academic Dean (${effectiveSchoolName})` : 'Academic Certification Board');
  const effectiveParentName = parentName || student.parentName || userAccount?.parentName || 'Parent / Legal Guardian';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto overscroll-contain modal-scroll-container print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <div 
        ref={printRef}
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-4xl w-full my-auto overflow-hidden text-stone-900 print:shadow-none print:border-none print:max-w-none print:rounded-none max-h-[calc(100dvh-1rem)] sm:max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#10246f] via-[#16318c] to-[#10246f] text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl p-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 shrink-0">
              {student.avatar || '🎒'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {student.studentName}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-100 border border-blue-400/30 font-bold">
                  @{student.studentUsername}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  {student.grade}
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5">
                Official Comprehensive Academic Portfolio & Diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title="Print / Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close Report Card"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Summary Portfolio vs Detailed Question Responses */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0 print:hidden flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'summary'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Executive Summary & Portfolio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'diagnostics'
                  ? 'bg-[#10246f] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Detailed Question & Skill Responses</span>
              {flattenedQuestions.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'diagnostics' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-700'}`}>
                  {flattenedQuestions.length}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
            Synced with PforPencil Universal Academic Standards
          </span>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto overscroll-contain modal-scroll-container flex-1 print:max-h-none print:overflow-visible">
          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE SUMMARY & PORTFOLIO */}
          {/* ========================================================================= */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Institution Header */}
              <div className="border-b-2 border-stone-200 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#10246f] text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
                    🎓
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">
                      PforPencil Academic Mastery Network
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                      {effectiveSchoolName}
                    </h1>
                    <p className="text-xs text-stone-500 font-medium">
                      Student Cumulative Assessment Portfolio & Progress Record
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-stone-200 sm:pr-4 pl-3 sm:pl-0">
                  <div className="text-[10px] font-bold text-stone-400 uppercase">Assessment Term</div>
                  <div className="text-xs font-black text-stone-900">Academic Term 2025–2026</div>
                  <div className="text-[10px] text-stone-500 font-mono">Issued: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Student Profile Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Learner Name</span>
                  <div className="font-black text-stone-900 text-sm flex items-center gap-1.5 mt-0.5">
                    <span>{student.avatar || '🎒'}</span>
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

              {/* Notice for Newly Joined Students with Zero Assessments */}
              {!hasAssessments && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-black text-amber-950 text-xs sm:text-sm">
                      Onboarding Status: Pending Initial Assessment
                    </h4>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      This learner has newly joined and has not yet submitted any classroom assignments or quizzes.
                      As soon as {student.studentName} completes their first learning challenge, real-time mastery scores, competencies, and diagnostic analyses will automatically populate below.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Analytics Summary Hero Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border text-center ${gradeInfo.color}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Cumulative Grade
                  </span>
                  <div className="text-2xl sm:text-3xl font-black mt-1">
                    {gradeInfo.letter}
                  </div>
                  <span className="text-[11px] font-bold block mt-0.5">
                    {hasAssessments ? `${score}% Average Accuracy` : 'Pending Diagnostic'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Completed Assessments
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                    {hasAssessments ? (student.totalQuizzesTaken || student.recentActivities.length) : 0}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                    {hasAssessments ? 'Evaluated Quizzes' : '0 Quizzes Attempted'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Active Learning Streak
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-orange-600 mt-1 flex items-center justify-center gap-1">
                    <span>{hasAssessments ? student.streakDays : 0}</span>
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
                  <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">
                    Lv. {student.level || 1}
                  </div>
                  <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">
                    {hasAssessments ? (student.xp || 0).toLocaleString() : 0} Total XP
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
                    Benchmark: 70%+
                  </span>
                </div>

                <div className="space-y-3">
                  {Object.keys(student.subjectMastery || {}).length === 0 ? (
                    <div className="p-4 text-center bg-stone-50 rounded-xl border border-stone-200 text-stone-500 text-xs">
                      No subject evaluations recorded yet. Subject proficiencies will appear after first quiz.
                    </div>
                  ) : (
                    Object.entries(student.subjectMastery || {}).map(([subject, rawSubjectScore]) => {
                      const subjectScore = typeof rawSubjectScore === 'number' && !isNaN(rawSubjectScore)
                        ? Math.min(100, Math.max(0, Math.round(rawSubjectScore)))
                        : 0;
                      const subGrade = getGradeLetter(subjectScore, hasAssessments);
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
                    })
                  )}
                </div>
              </div>

              {/* Foundational Learning Competencies & Strengths */}
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
                            {comp.stars > 0 ? '★'.repeat(comp.stars) + '☆'.repeat(5 - comp.stars) : '☆☆☆☆☆'}
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
                        {hasAssessments
                          ? `Demonstrates consistent mental retention in core curriculum skills for ${student.grade}. Shows active persistence in daily learning tasks.`
                          : `Enrolled in ${student.grade} curriculum. Ready to begin foundational challenges and build accuracy.`}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                      <div className="font-bold flex items-center gap-1 text-amber-900 mb-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Target Focus for Next Term</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        {hasAssessments
                          ? 'Maintain regular practice on multi-step applied problems and daily sunrise quests to reinforce retention.'
                          : 'Complete initial assessment quests to establish baseline competency ratings.'}
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
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DETAILED QUESTION & SKILL DIAGNOSTICS */}
          {/* ========================================================================= */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-5">
              {/* Top Filter and Diagnostic KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Questions</span>
                  <span className="text-xl font-black text-stone-900 mt-0.5 block">{totalQuestionsEvaluated}</span>
                  <span className="text-[10px] text-stone-400 font-medium">Evaluated</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Correct
                  </span>
                  <span className="text-xl font-black text-emerald-900 mt-0.5 block">{totalCorrectQuestions}</span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {totalQuestionsEvaluated > 0 ? Math.round((totalCorrectQuestions / totalQuestionsEvaluated) * 100) : 0}% Accuracy
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-600" /> Needs Review
                  </span>
                  <span className="text-xl font-black text-rose-900 mt-0.5 block">{totalIncorrectQuestions}</span>
                  <span className="text-[10px] text-rose-700 font-bold">
                    {totalIncorrectQuestions > 0 ? 'Review Mistakes' : 'Zero Mistakes 🎉'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Skill Mastery</span>
                  <span className="text-xl font-black text-blue-900 mt-0.5 block">{score}%</span>
                  <span className="text-[10px] text-blue-700 font-semibold">{student.grade} Benchmark</span>
                </div>
              </div>

              {/* Skills & Categories Diagnostic Status Grid */}
              <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#10246f]" />
                    <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                      Curricular Skills & Category Mastery Tracker
                    </h3>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono font-bold">
                    {skillSummaries.filter(s => s.isCompleted).length} of {skillSummaries.length} Skills Completed
                  </span>
                </div>

                {skillSummaries.length === 0 ? (
                  <div className="text-center py-4 text-xs text-stone-400 italic">
                    No curriculum skills evaluated yet. Question skills and category completion status will appear here as the student attempts challenges.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {skillSummaries.map((sk) => (
                      <div
                        key={sk.skill}
                        className={`p-3 rounded-xl border transition-all ${
                          sk.isCompleted
                            ? 'bg-emerald-50/60 border-emerald-200 shadow-2xs'
                            : 'bg-stone-50/70 border-stone-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              {sk.category}
                            </span>
                            <span className="text-xs font-black text-stone-900 block">
                              {sk.skill}
                            </span>
                          </div>
                          {sk.isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black shrink-0">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>✓ Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold shrink-0">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>In Progress</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold">
                          <span className="text-stone-500">
                            Accuracy: {sk.accuracy}% ({sk.correct}/{sk.total} correct)
                          </span>
                          <span className={sk.isCompleted ? 'text-emerald-700' : 'text-amber-800'}>
                            {sk.isCompleted ? '✓ Skill Completed & Mastered' : 'Targeted Practice Needed'}
                          </span>
                        </div>

                        <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              sk.isCompleted ? 'bg-emerald-500' : sk.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, sk.accuracy))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity / Assignment Selector & Correctness Filter */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3 flex-wrap text-xs">
                {/* Filter by Activity / Assignment */}
                {uniqueActivities.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-600">Task:</span>
                    <select
                      value={selectedActivityFilter}
                      onChange={(e) => setSelectedActivityFilter(e.target.value)}
                      className="p-1.5 rounded-xl border border-stone-200 bg-white font-bold text-stone-800 text-xs"
                    >
                      <option value="all">All Assignments & Quizzes ({flattenedQuestions.length})</option>
                      {uniqueActivities.map((act) => (
                        <option key={act} value={act}>{act}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filter by Correctness */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDiagnosticsFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      diagnosticsFilter === 'all'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    All Items ({flattenedQuestions.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiagnosticsFilter('incorrect')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                      diagnosticsFilter === 'incorrect'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Wrong Only ({totalIncorrectQuestions})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiagnosticsFilter('correct')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 ${
                      diagnosticsFilter === 'correct'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct Only ({totalCorrectQuestions})</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {filteredDiagnostics.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-2">
                  <div className="text-3xl">📋</div>
                  <h4 className="font-bold text-xs text-stone-800">
                    {flattenedQuestions.length === 0 
                      ? 'No Question Responses Logged Yet' 
                      : 'No Questions Match This Filter'}
                  </h4>
                  <p className="text-[11px] max-w-md mx-auto">
                    {flattenedQuestions.length === 0
                      ? `When ${student.studentName} answers questions in assignments or quizzes, each question, selected response, category, and skill breakdown will appear here.`
                      : 'Switch the filter above to "All Items" to view all evaluated questions.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDiagnostics.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-3xl border-2 transition-all space-y-3 ${
                        item.isCorrect
                          ? 'bg-white border-emerald-200/90 hover:border-emerald-300 shadow-2xs'
                          : 'bg-rose-50/40 border-rose-300 hover:border-rose-400 shadow-2xs'
                      }`}
                    >
                      {/* Header with Category, Skill and Status */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-white text-xs font-black">
                            Q{idx + 1}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                            {item.category}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                            Skill: {item.skill}
                          </span>
                          {skillSummaries.find(s => s.skill === item.skill)?.isCompleted ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>✓ Skill Completed</span>
                            </span>
                          ) : !item.isCorrect ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-700" />
                              <span>Targeted Review</span>
                            </span>
                          ) : null}
                          <span className="text-[10px] text-stone-400 font-mono">
                            Task: {item.activityTitle}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {item.timeSpentSeconds !== undefined && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                              <Clock className="w-3 h-3 text-stone-400" />
                              {item.timeSpentSeconds}s
                            </span>
                          )}

                          {item.isCorrect ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>Correct</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                              <XCircle className="w-4 h-4 text-rose-700" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Prompt */}
                      <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                        <p className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                          <ClipartText text={item.prompt} />
                        </p>
                      </div>

                      {/* Side-by-Side Answer Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Student Answer */}
                        <div
                          className={`p-3 rounded-2xl border ${
                            item.isCorrect
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-rose-100/60 border-rose-300 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                              Student's Answer
                            </span>
                            {item.isCorrect ? (
                              <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Correct
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-rose-700 flex items-center gap-1">
                                <X className="w-3 h-3" /> Incorrect
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-xs sm:text-sm break-words">
                            {item.studentAnswer}
                          </div>
                        </div>

                        {/* Expected Correct Answer Key */}
                        <div className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-emerald-950">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                              Expected Answer Key
                            </span>
                            <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Answer Key
                            </span>
                          </div>
                          <div className="font-bold text-xs sm:text-sm text-emerald-900 break-words">
                            {item.correctAnswer}
                          </div>
                        </div>
                      </div>

                      {/* Remedial Guidance & Explanation */}
                      {(!item.isCorrect || item.explanation) && (
                        <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-amber-950 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-amber-900">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            <span>Remedial Explanation & Skill Guidance:</span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-relaxed">
                            {item.explanation || "Review fundamental steps and vocabulary for this concept with the student to solidify retention."}
                          </p>
                          {item.hint && (
                            <p className="text-[10px] text-amber-700 font-medium">
                              <strong>Helpful Hint:</strong> {item.hint}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-stone-500">
            PforPencil Unified Learning System • Document ID: RC-{student.studentId}-{new Date().getFullYear()}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Close Report Card
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
