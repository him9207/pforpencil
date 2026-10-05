import React, { useState, FormEvent } from 'react';
import { StudentProgress, UserAccount, GradeLevel, ClassRoom, CurriculumGrade } from '../../../types';
import { X, GraduationCap, School, ArrowRight, Sparkles, CheckCircle2, Layers, User } from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { useBodyScrollLock } from '../../../utils/useBodyScrollLock';

export interface EditStudentModalProps {
  student: StudentProgress;
  studentUser?: UserAccount;
  classes: ClassRoom[];
  grades?: CurriculumGrade[] | GradeLevel[];
  schoolName?: string;
  onClose: () => void;
  onSave: (
    updatedStudent: StudentProgress,
    updatedUser: UserAccount,
    targetClassId: string | null,
    previousClassId: string | null
  ) => void;
}

const COMMON_STUDENT_AVATARS = [
  '🎒', '🚀', '🌟', '🦄', '🦁', '🦊', '🎨', '🎯', '⚽', '🐼', 
  '🐬', '🏆', '💡', '🌈', '🦉', '🦖', '🚁', '🎻', '🤖', '👑'
];

const STANDARD_GRADE_ORDER: GradeLevel[] = [
  'Preschool',
  'Kindergarten',
  'Foundation',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12'
];

export default function EditStudentModal({
  student,
  studentUser,
  classes,
  grades = [],
  schoolName,
  onClose,
  onSave
}: EditStudentModalProps) {
  // Current class identification
  const currentClass = classes.find(c => c.studentIds?.includes(student.studentId));

  // Form states
  const [name, setName] = useState(student.studentName || studentUser?.name || '');
  const [avatar, setAvatar] = useState(student.avatar || studentUser?.avatar || '🎒');
  const [grade, setGrade] = useState<GradeLevel>(student.grade || (studentUser?.grade as GradeLevel) || 'Grade 1');
  const [assignedClassId, setAssignedClassId] = useState<string>(currentClass?.id || '');
  const [showAllGradesClasses, setShowAllGradesClasses] = useState(false);
  const [error, setError] = useState<string>('');

  useBodyScrollLock(true);

  // Available grade levels
  const availableGradeList: GradeLevel[] = React.useMemo(() => {
    if (grades && grades.length > 0) {
      if (typeof grades[0] === 'string') {
        return grades as GradeLevel[];
      }
      return (grades as CurriculumGrade[]).filter(g => g.active).map(g => g.name as GradeLevel);
    }
    return STANDARD_GRADE_ORDER.slice(0, 8);
  }, [grades]);

  // Dynamic matching classes for the currently selected grade
  const matchingGradeClasses = React.useMemo(() => {
    return classes.filter(c => c.grade === grade);
  }, [classes, grade]);

  // Displayed classes: filtered strictly by grade unless user explicitly toggles to view all
  const displayedClasses = showAllGradesClasses ? classes : matchingGradeClasses;

  // Determine next grade in progression for 1-click promotion
  const currentGradeIndex = availableGradeList.findIndex(g => g === grade);
  const nextGradeLevel = (currentGradeIndex >= 0 && currentGradeIndex < availableGradeList.length - 1)
    ? availableGradeList[currentGradeIndex + 1]
    : null;

  // Handle 1-click quick promotion to next grade
  const handleQuickPromote = () => {
    sounds.playLevelUp();
    if (!nextGradeLevel) return;
    
    setGrade(nextGradeLevel);
    // Find matching classes in the next grade level
    const matchingNewClasses = classes.filter(c => c.grade === nextGradeLevel);
    if (matchingNewClasses.length > 0) {
      setAssignedClassId(matchingNewClasses[0].id);
    } else {
      // No specific class in next grade, set to unassigned cohort
      setAssignedClassId('');
    }
  };

  // When user changes grade from dropdown, dynamically update class selection
  const handleGradeChange = (newGrade: GradeLevel) => {
    setGrade(newGrade);
    const matchingClasses = classes.filter(c => c.grade === newGrade);
    const currentSelectedClass = classes.find(c => c.id === assignedClassId);
    
    // If the currently assigned class does not belong to the newly selected grade
    if (!currentSelectedClass || currentSelectedClass.grade !== newGrade) {
      if (matchingClasses.length > 0) {
        setAssignedClassId(matchingClasses[0].id);
      } else {
        setAssignedClassId('');
      }
    }
  };

  // When user selects a class, automatically sync the student's Master Grade to match the class grade
  const handleClassChange = (newClassId: string) => {
    setAssignedClassId(newClassId);
    if (newClassId) {
      const targetClass = classes.find(c => c.id === newClassId);
      if (targetClass?.grade && targetClass.grade !== grade) {
        // Automatically sync Master Grade at backend and in UI
        setGrade(targetClass.grade);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Student name cannot be empty.');
      return;
    }

    const updatedUser: UserAccount = {
      ...(studentUser || {
        id: student.studentId,
        username: student.studentUsername,
        role: 'student' as const,
        enrolledAt: '2025-09-01',
        status: 'active' as const
      }),
      name: name.trim(),
      avatar,
      grade,
      schoolName: schoolName || student.schoolName || studentUser?.schoolName
    };

    const updatedStudent: StudentProgress = {
      ...student,
      studentName: name.trim(),
      avatar,
      grade,
      schoolName: schoolName || student.schoolName
    };

    sounds.click();
    onSave(
      updatedStudent,
      updatedUser,
      assignedClassId ? assignedClassId : null,
      currentClass ? currentClass.id : null
    );
  };

  const selectedClass = classes.find(c => c.id === assignedClassId);
  const isPromoted = student.grade !== grade;
  const isClassChanged = (currentClass?.id || '') !== (assignedClassId || '');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center text-2xl shrink-0">
              {avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900">
                  Edit Student & Class Assignment
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Student
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                ID: <span className="font-bold text-stone-800">{student.studentId}</span> • <span className="text-stone-700 font-sans">@{student.studentUsername}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
              {error}
            </div>
          )}

          {/* Quick Academic Promotion Highlight Card */}
          <div className="p-4 rounded-2xl bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                <span>Academic Grade Progression & Promotion</span>
              </span>
              {nextGradeLevel && (
                <button
                  type="button"
                  onClick={handleQuickPromote}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black shadow-xs transition flex items-center gap-1 cursor-pointer"
                  title={`Promote from ${grade} to ${nextGradeLevel}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Click Promote to {nextGradeLevel}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Master Grade Level */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Master Grade Level *
                </label>
                <select
                  value={grade}
                  onChange={(e) => handleGradeChange(e.target.value as GradeLevel)}
                  className="w-full p-2.5 rounded-xl border border-amber-300 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  {availableGradeList.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  Changing grade promotes student academic diagnostic standard.
                </p>
              </div>

              {/* Assigned Classroom (Dynamically filtered by Master Grade) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-stone-500" />
                    <span>Assigned Classroom / Section *</span>
                  </label>
                  {classes.length > matchingGradeClasses.length && (
                    <button
                      type="button"
                      onClick={() => setShowAllGradesClasses(!showAllGradesClasses)}
                      className="text-[10px] font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                    >
                      {showAllGradesClasses ? `Filter by ${grade} only` : 'Show all school classes'}
                    </button>
                  )}
                </div>
                <select
                  value={assignedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="">General Cohort / Unassigned ({grade})</option>
                  {displayedClasses.length === 0 ? (
                    <option disabled value="">
                      No active classes found for {grade} (Will be General Cohort)
                    </option>
                  ) : (
                    displayedClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade}) — Lead: {c.teacherName}
                        {c.secondaryTeacherName ? ` & ${c.secondaryTeacherName}` : ''}
                      </option>
                    ))
                  )}
                </select>
                <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                  <span>
                    {showAllGradesClasses
                      ? `Showing all ${classes.length} classes. Choosing a class will auto-sync Master Grade.`
                      : matchingGradeClasses.length > 0
                        ? `✓ Showing ${matchingGradeClasses.length} class${matchingGradeClasses.length === 1 ? '' : 'es'} matching ${grade}.`
                        : `ℹ️ No classes exist for ${grade} yet. Student will be in General Cohort.`}
                  </span>
                  {showAllGradesClasses && (
                    <span className="font-bold text-amber-700 text-[10px]">All Grades</span>
                  )}
                </div>
              </div>
            </div>

            {/* Real-time Status / Reassignment Preview */}
            {(isPromoted || isClassChanged) && (
              <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    {isPromoted && !isClassChanged && `Promoting from ${student.grade} ➔ ${grade}`}
                    {!isPromoted && isClassChanged && `Moving from ${currentClass?.name || 'General Cohort'} ➔ ${selectedClass?.name || 'General Cohort'}`}
                    {isPromoted && isClassChanged && `Promoting & Moving: ${student.grade} (${currentClass?.name || 'General'}) ➔ ${grade} (${selectedClass?.name || 'General'})`}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                  Pending Save
                </span>
              </div>
            )}
          </div>

          {/* Student Profile Details */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider block">
              Student Profile Information
            </span>

            {/* Student Full Name */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Student Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mason Clark"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden bg-white"
                />
              </div>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Avatar Emoji
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-stone-50 border border-stone-200 rounded-2xl max-h-32 overflow-y-auto">
                {COMMON_STUDENT_AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      sounds.click();
                      setAvatar(av);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      avatar === av
                        ? 'bg-amber-500 text-white shadow-xs scale-105 ring-2 ring-amber-300'
                        : 'bg-white hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Academic Diagnostics info */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-[11px] text-stone-600">
            <div className="flex items-center gap-3">
              <span className="font-bold text-stone-900">Total Quizzes: {student.totalQuizzesTaken || 0}</span>
              <span>•</span>
              <span className="font-bold text-amber-700">+{student.xp} XP</span>
              <span>•</span>
              <span className="font-bold text-emerald-700">{student.averageScore}% Accuracy</span>
            </div>
            <span className="font-mono text-stone-400">PIN: {studentUser?.pin || '7392'}</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Update Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
