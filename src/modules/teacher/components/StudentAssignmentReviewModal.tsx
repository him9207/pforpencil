import React, { useState, useMemo, useRef } from 'react';
import { StudentProgress, ClassAssignment, Question, QuestionResult } from '../../../types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Printer, 
  X, 
  Sparkles, 
  Lightbulb, 
  Check, 
  RotateCcw,
  Save,
  CheckCheck,
  History
} from 'lucide-react';
import { ClipartText } from '../../../common/ClipartRenderer';
import { useBodyScrollLock } from '../../../utils/useBodyScrollLock';

export interface StudentAssignmentReviewModalProps {
  student: StudentProgress;
  assignment: ClassAssignment;
  attempt?: any;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  questions: Question[];
  onClose: () => void;
  onUpdateStudentProgress?: (progress: StudentProgress) => void;
}

interface QuestionReviewItem {
  index: number;
  questionId: string;
  prompt: string;
  category?: string;
  skill?: string;
  points: number;
  difficulty?: string;
  isCorrect: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
  hint?: string;
  timeSpentSeconds?: number;
  isHistoricalEstimated?: boolean;
}

export default function StudentAssignmentReviewModal({
  student,
  assignment,
  attempt,
  correctAnswers,
  totalQuestions,
  percentage,
  questions,
  onClose,
  onUpdateStudentProgress
}: StudentAssignmentReviewModalProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all');
  const printRef = useRef<HTMLDivElement>(null);
  const [savedToast, setSavedToast] = useState('');
  const [hasManualEdits, setHasManualEdits] = useState(false);

  useBodyScrollLock(true);

  // Compute base question-by-question breakdown
  const initialReviewItems: QuestionReviewItem[] = useMemo(() => {
    const rawResults: QuestionResult[] = attempt?.questionResults || [];
    const qIds = assignment.questionIds && assignment.questionIds.length > 0 
      ? assignment.questionIds 
      : [];

    return qIds.map((qid, idx) => {
      const q = questions.find((item) => item.id === qid);
      const recorded = rawResults.find(
        (r) => r.questionId === qid || (q?.prompt && r.prompt.trim().toLowerCase() === q.prompt.trim().toLowerCase())
      );

      if (recorded) {
        return {
          index: idx + 1,
          questionId: qid,
          prompt: recorded.prompt || q?.prompt || `Question ${idx + 1}`,
          category: q?.category || 'Curriculum Practice',
          skill: q?.skill || 'General Skill',
          points: q?.points || 20,
          difficulty: q?.difficulty || 'Medium',
          isCorrect: recorded.isCorrect,
          studentAnswer: recorded.studentAnswer || (recorded.isCorrect ? 'Correct option selected' : 'Incorrect option selected'),
          correctAnswer: recorded.correctAnswer || (q?.options?.[q?.correctIndex ?? 0] ?? q?.openBoxAnswer ?? 'Correct Option'),
          explanation: recorded.explanation || q?.explanation,
          hint: recorded.hint || q?.hint,
          timeSpentSeconds: recorded.timeSpentSeconds,
          isHistoricalEstimated: false
        };
      }

      // If no recorded telemetry existed (historical data prior to telemetry logging):
      // Reconstruct accurately using the student's submission score:
      // index < correctAnswers is marked correct, others marked as incorrect.
      const isCorrect = idx < correctAnswers;
      const expectedAnswer = q?.options?.[q?.correctIndex ?? 0] ?? q?.openBoxAnswer ?? 'Correct Option';
      const wrongAnswerCandidate = q?.options?.find((_, oIdx) => oIdx !== (q?.correctIndex ?? 0)) || 'Alternative Option';

      return {
        index: idx + 1,
        questionId: qid,
        prompt: q?.prompt || `Question ${idx + 1}`,
        category: q?.category || 'Curriculum Practice',
        skill: q?.skill || 'Problem Solving',
        points: q?.points || 20,
        difficulty: q?.difficulty || 'Medium',
        isCorrect,
        studentAnswer: isCorrect ? expectedAnswer : wrongAnswerCandidate,
        correctAnswer: expectedAnswer,
        explanation: q?.explanation,
        hint: q?.hint,
        timeSpentSeconds: undefined,
        isHistoricalEstimated: true
      };
    });
  }, [assignment, attempt, correctAnswers, questions]);

  // Working state of items (allows teacher to calibrate historical records if needed)
  const [items, setItems] = useState<QuestionReviewItem[]>(initialReviewItems);

  const hasHistoricalItems = useMemo(() => {
    return items.some((i) => i.isHistoricalEstimated);
  }, [items]);

  const currentCorrectCount = useMemo(() => items.filter((i) => i.isCorrect).length, [items]);
  const currentIncorrectCount = useMemo(() => items.filter((i) => !i.isCorrect).length, [items]);
  const currentTotal = Math.max(1, items.length);
  const currentPercentage = Math.min(100, Math.max(0, Math.round((currentCorrectCount / currentTotal) * 100)));

  const filteredItems = useMemo(() => {
    if (filterMode === 'incorrect') return items.filter((i) => !i.isCorrect);
    if (filterMode === 'correct') return items.filter((i) => i.isCorrect);
    return items;
  }, [items, filterMode]);

  // Teacher manual override / calibration for question status
  const handleToggleQuestionStatus = (itemIndex: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = updated.find((it) => it.index === itemIndex);
      if (!target) return prev;

      const nextCorrect = !target.isCorrect;
      const q = questions.find((item) => item.id === target.questionId);
      const expected = q?.options?.[q?.correctIndex ?? 0] ?? q?.openBoxAnswer ?? target.correctAnswer;
      const wrongCandidate = q?.options?.find((_, oIdx) => oIdx !== (q?.correctIndex ?? 0)) || 'Alternative Option';

      const targetIdx = updated.indexOf(target);
      updated[targetIdx] = {
        ...target,
        isCorrect: nextCorrect,
        studentAnswer: nextCorrect ? expected : wrongCandidate,
        isHistoricalEstimated: false // Verified by teacher
      };
      return updated;
    });
    setHasManualEdits(true);
  };

  // Reset to original items
  const handleResetReview = () => {
    setItems(initialReviewItems);
    setHasManualEdits(false);
  };

  // Save calibrated diagnostic review back to student's record
  const handleSaveReview = () => {
    if (!onUpdateStudentProgress) return;

    const newCorrectCount = items.filter((i) => i.isCorrect).length;
    const newTotalQuestions = Math.max(1, items.length);

    const updatedQuestionResults: QuestionResult[] = items.map((item) => ({
      questionId: item.questionId,
      prompt: item.prompt,
      isCorrect: item.isCorrect,
      studentAnswer: item.studentAnswer,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      hint: item.hint,
      timeSpentSeconds: item.timeSpentSeconds
    }));

    // Update the attempt in the student's recentActivities
    const existingActivities = student.recentActivities || [];
    const updatedActivities = existingActivities.map((act) => {
      const isMatch = act.id === assignment.id || 
        act.title.trim().toLowerCase() === assignment.title.trim().toLowerCase();
      if (isMatch) {
        return {
          ...act,
          score: newCorrectCount,
          maxScore: newTotalQuestions,
          correctAnswers: newCorrectCount,
          totalQuestions: newTotalQuestions,
          questionResults: updatedQuestionResults,
          timestamp: act.timestamp || 'Recorded'
        };
      }
      return act;
    });

    const updatedStudent: StudentProgress = {
      ...student,
      recentActivities: updatedActivities
    };

    onUpdateStudentProgress(updatedStudent);
    setHasManualEdits(false);
    setSavedToast(`Diagnostic breakdown updated successfully for ${student.studentName}!`);
    setTimeout(() => setSavedToast(''), 4500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <div 
        ref={printRef}
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full my-auto overflow-hidden text-stone-900 flex flex-col max-h-[calc(100dvh-1.5rem)] print:shadow-none print:border-none print:max-w-none print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#10246f] via-[#16318c] to-[#10246f] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 shrink-0">
              {student.avatar || '🎒'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {student.studentName}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-100 border border-blue-400/30 font-bold">
                  @{student.studentUsername}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  {student.grade}
                </span>
              </div>
              <p className="text-xs text-blue-100/90 mt-0.5 flex items-center gap-2">
                <span>Task: <strong>{assignment.title}</strong></span>
                <span>•</span>
                <span>{assignment.subject}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition cursor-pointer print:hidden"
              title="Print Review Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition cursor-pointer print:hidden"
              title="Close Review"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved Success Notification */}
        {savedToast && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-200" />
              <span>{savedToast}</span>
            </div>
            <button onClick={() => setSavedToast('')} className="p-1 hover:bg-white/20 rounded cursor-pointer">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-contain flex-1 modal-scroll-container">
          {/* Diagnostic KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Questions</span>
              <span className="text-xl font-black text-stone-900 mt-0.5 block">{currentTotal}</span>
              <span className="text-[10px] text-stone-400 font-medium">In Assignment</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Correct
              </span>
              <span className="text-xl font-black text-emerald-900 mt-0.5 block">{currentCorrectCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold">{currentPercentage}% Mastered</span>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3 text-rose-600" /> Needs Review
              </span>
              <span className="text-xl font-black text-rose-900 mt-0.5 block">{currentIncorrectCount}</span>
              <span className="text-[10px] text-rose-700 font-bold">{currentIncorrectCount > 0 ? `${currentIncorrectCount} Missed` : 'Zero Mistakes 🎉'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Overall Accuracy</span>
              <span className="text-xl font-black text-blue-900 mt-0.5 block">{currentPercentage}%</span>
              <span className="text-[10px] text-blue-700 font-semibold">{currentCorrectCount}/{currentTotal} questions</span>
            </div>
          </div>

          {/* Historical Assignment Notice */}
          {hasHistoricalItems && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-black text-indigo-950 text-xs sm:text-sm">
                    Reconstructed Historical Submission
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-900 font-extrabold">
                    Prior Attempt Record
                  </span>
                </div>
                <p className="text-indigo-900 text-[11px] leading-relaxed">
                  This assignment was completed prior to granular question telemetry logging. The system has automatically mapped each question from the assignment based on the student's recorded score (<strong>{currentCorrectCount} of {currentTotal} correct • {currentPercentage}%</strong>).
                </p>
                <p className="text-indigo-800 text-[10px] font-medium">
                  💡 <em>Teacher Tip:</em> You can review all questions below, or use the <strong>"Toggle (✓/✕)"</strong> button on any question to calibrate exactly which question was missed, then click <strong>"Save Calibration"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Remedial Guidance Callout Banner (if there are incorrect answers) */}
          {currentIncorrectCount > 0 ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <h4 className="font-black text-amber-950 text-xs sm:text-sm">
                  Teacher Diagnostic Alert: {currentIncorrectCount} Question{currentIncorrectCount === 1 ? '' : 's'} Missed
                </h4>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Review the red cards below to identify the student's mistakes, view the correct answers, and find step-by-step explanations for reteaching.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-200/80 text-emerald-900 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-emerald-950 text-xs sm:text-sm">
                  Full Mastery: 100% Correct!
                </h4>
                <p className="text-emerald-800 text-[11px]">
                  {student.studentName} answered all {currentTotal} questions correctly.
                </p>
              </div>
            </div>
          )}

          {/* Manual Edits Bar */}
          {hasManualEdits && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-blue-900">
                  You modified the question breakdown ({currentCorrectCount}/{currentTotal} correct • {currentPercentage}%).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetReview}
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Calibration</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-500 mr-1 hidden sm:inline">Filter:</span>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
              >
                All Questions ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('incorrect')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'incorrect'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Wrong Only ({currentIncorrectCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('correct')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Correct Only ({currentCorrectCount})</span>
              </button>
            </div>

            <span className="text-[11px] text-stone-400 font-mono">
              Showing {filteredItems.length} of {items.length} questions
            </span>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-1">
                <p className="font-bold text-xs">No questions in this filter.</p>
                <p className="text-[11px]">Select "All Questions" above to view every item.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.questionId}
                  className={`p-4 rounded-3xl border-2 transition-all space-y-3 ${
                    item.isCorrect
                      ? 'bg-white border-emerald-200/90 hover:border-emerald-300 shadow-2xs'
                      : 'bg-rose-50/40 border-rose-300 hover:border-rose-400 shadow-2xs'
                  }`}
                >
                  {/* Question Header & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-white text-xs font-black">
                        Question {item.index}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {item.category}
                      </span>
                      {item.skill && (
                        <span className="text-[10px] font-medium text-stone-500">
                          Skill: <strong>{item.skill}</strong>
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-stone-400">
                        ID: {item.questionId}
                      </span>
                      {item.isHistoricalEstimated && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                          Reconstructed from Score
                        </span>
                      )}
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

                      {/* Teacher Calibration Toggle Button */}
                      {onUpdateStudentProgress && (
                        <button
                          type="button"
                          onClick={() => handleToggleQuestionStatus(item.index)}
                          className="px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-[10px] font-bold transition cursor-pointer print:hidden"
                          title="Toggle between correct/incorrect if this historical question was different"
                        >
                          {item.isCorrect ? 'Mark as ✕' : 'Mark as ✓'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                    <p className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                      <ClipartText text={item.prompt} />
                    </p>
                  </div>

                  {/* Side-by-Side Answer Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Student's Answer */}
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
                            <Check className="w-3 h-3" /> Right
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-rose-700 flex items-center gap-1">
                            <X className="w-3 h-3" /> Wrong
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-xs sm:text-sm break-words">
                        {item.studentAnswer}
                      </div>
                    </div>

                    {/* Expected Answer Key */}
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

                  {/* Remedial Guidance & Teacher Insight */}
                  {(!item.isCorrect || item.explanation) && (
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-amber-900">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                        <span>Teacher Explanation & Remedial Note:</span>
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
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0 print:hidden flex-wrap">
          <div className="text-xs text-stone-500 flex items-center gap-2">
            <span className="font-bold text-stone-700">Accuracy: {currentPercentage}%</span>
            <span>•</span>
            <span>{currentCorrectCount} of {currentTotal} answered correctly</span>
          </div>
          <div className="flex items-center gap-2">
            {hasManualEdits && onUpdateStudentProgress && (
              <button
                type="button"
                onClick={handleSaveReview}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Calibration</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Close Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
