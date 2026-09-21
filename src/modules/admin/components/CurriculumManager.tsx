import React, { useState } from 'react';
import { CurriculumGrade, CurriculumSubject, Question } from '../../../types';
import { 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Check, 
  Sparkles, 
  Layers, 
  X, 
  HelpCircle,
  FolderPlus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../../utils/audio';

interface CurriculumManagerProps {
  grades: CurriculumGrade[];
  subjects: CurriculumSubject[];
  questions: Question[];
  onAddGrade: (grade: CurriculumGrade) => void;
  onAddSubject: (subject: CurriculumSubject) => void;
  onDeleteGrade?: (gradeId: string) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onResetToMathPreschoolToGrade6?: () => void;
  onSuccessMessage: (msg: string) => void;
}

const GRADE_ICONS = ['🧸', '🌱', '🎒', '✏️', '🚀', '🔍', '🔬', '🎓', '📚', '🌟', '🎨', '🧩'];
const SUBJECT_ICONS = ['➗', '🧪', '📖', '🧩', '🌍', '💻', '🎨', '🎵', '📜', '🧬', '🤖', '📐'];
const COLOR_OPTIONS = [
  { id: 'blue', label: 'Blue', border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700' },
  { id: 'emerald', label: 'Emerald', border: 'border-emerald-300', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { id: 'purple', label: 'Purple', border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-700' },
  { id: 'amber', label: 'Amber', border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-700' },
  { id: 'rose', label: 'Rose', border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-700' },
  { id: 'cyan', label: 'Cyan', border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-700' },
];

export default function CurriculumManager({
  grades,
  subjects,
  questions,
  onAddGrade,
  onAddSubject,
  onDeleteGrade,
  onDeleteSubject,
  onResetToMathPreschoolToGrade6,
  onSuccessMessage
}: CurriculumManagerProps) {
  const [activeSection, setActiveSection] = useState<'grades' | 'subjects'>('grades');

  // New Grade Modal State
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeName, setGradeName] = useState('');
  const [gradeAgeGroup, setGradeAgeGroup] = useState('');
  const [gradeDesc, setGradeDesc] = useState('');
  const [gradeIcon, setGradeIcon] = useState('🎓');

  // New Subject Modal State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCategory, setSubCategory] = useState('STEM');
  const [subDesc, setSubDesc] = useState('');
  const [subIcon, setSubIcon] = useState('📐');
  const [subColor, setSubColor] = useState('blue');

  // Confirm delete state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'grade' | 'subject';
    id: string;
    name: string;
  } | null>(null);

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    sounds.playCorrect();
    if (deleteConfirmation.type === 'grade' && onDeleteGrade) {
      onDeleteGrade(deleteConfirmation.id);
      onSuccessMessage(`Removed Academic Grade Level: ${deleteConfirmation.name}`);
    } else if (deleteConfirmation.type === 'subject' && onDeleteSubject) {
      onDeleteSubject(deleteConfirmation.id);
      onSuccessMessage(`Removed Curriculum Subject: ${deleteConfirmation.name}`);
    }
    setDeleteConfirmation(null);
  };

  const handleCreateGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeName.trim()) return;

    sounds.success();
    const newGrade: CurriculumGrade = {
      id: `GRD_${Date.now()}`,
      name: gradeName.trim(),
      ageGroup: gradeAgeGroup.trim() || 'Custom Age',
      description: gradeDesc.trim() || 'Curriculum Grade & Academic Standards',
      icon: gradeIcon,
      active: true
    };

    onAddGrade(newGrade);
    onSuccessMessage(`Created new Academic Grade Level: ${newGrade.name}`);
    setShowGradeModal(false);
    setGradeName('');
    setGradeAgeGroup('');
    setGradeDesc('');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    sounds.success();
    const newSub: CurriculumSubject = {
      id: `SUB_${Date.now()}`,
      name: subName.trim(),
      category: subCategory,
      description: subDesc.trim() || 'Foundational knowledge & skills',
      icon: subIcon,
      color: subColor,
      active: true
    };

    onAddSubject(newSub);
    onSuccessMessage(`Created new Curriculum Subject: ${newSub.name}`);
    setShowSubjectModal(false);
    setSubName('');
    setSubDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-6 shadow-md border border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin-Exclusive Curriculum Authority</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Create Class & Subject Authority</h2>
            <p className="text-xs text-stone-300 max-w-2xl mt-1">
              Easily configure, create, or delete academic classes (Preschool to Grade 6) and select active subjects (exclusive Mathematics focus or STEM).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onResetToMathPreschoolToGrade6 && (
              <button
                type="button"
                onClick={() => {
                  sounds.playCorrect();
                  onResetToMathPreschoolToGrade6();
                  onSuccessMessage('Configured curriculum preset: Preschool to Grade 6 with Mathematics only!');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                title="Reset/apply Preschool to Grade 6 (Maths Only) preset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Preschool – Grade 6 (Maths Only)</span>
              </button>
            )}
            <button
              onClick={() => {
                sounds.click();
                setShowGradeModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Grade</span>
            </button>
            <button
              onClick={() => {
                sounds.click();
                setShowSubjectModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#10246f] hover:bg-[#0c1b54] text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Create Subject</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Setup Recommendation Bar */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-950">
          <span className="text-lg">🎯</span>
          <div>
            <strong>Current Goal: Preschool to Grade 6 (Mathematics Focus)</strong>
            <span className="block text-[11px] text-amber-800">
              Active Grades: {grades.map(g => g.name).join(', ')} • Active Primary Subject: {subjects.find(s => s.name.includes('Math'))?.name || 'Mathematics'}
            </span>
          </div>
        </div>
        {onResetToMathPreschoolToGrade6 && (
          <button
            type="button"
            onClick={() => {
              sounds.playCorrect();
              onResetToMathPreschoolToGrade6();
              onSuccessMessage('Configured curriculum preset: Preschool to Grade 6 with Mathematics only!');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#10246f] hover:bg-[#0c1b54] text-amber-300 font-bold text-xs transition shrink-0 cursor-pointer"
          >
            Apply Preschool–Grade 6 Math Preset
          </button>
        )}
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => {
            sounds.click();
            setActiveSection('grades');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSection === 'grades'
              ? 'bg-[#10246f] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Curriculum Classes & Grades ({grades.length})</span>
        </button>
        <button
          onClick={() => {
            sounds.click();
            setActiveSection('subjects');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSection === 'subjects'
              ? 'bg-[#10246f] text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Subjects ({subjects.length})</span>
        </button>
      </div>

      {/* SECTION 1: GRADES & CLASSES */}
      {activeSection === 'grades' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Configured Academic Grades & Class Levels
            </span>
            <span className="text-xs text-stone-500">
              Click the trash icon to delete any unwanted grade level
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {grades.map((grd) => {
              const qCount = questions.filter((q) => q.grade === grd.name).length;
              return (
                <div
                  key={grd.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-stone-300 transition flex flex-col justify-between group relative"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-xl">
                        {grd.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                        {onDeleteGrade && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmation({ type: 'grade', id: grd.id, name: grd.name })}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={`Delete grade ${grd.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">{grd.name}</h4>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        Age: {grd.ageGroup}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{grd.description}</p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between text-[11px] text-stone-500">
                    <span>Master Questions:</span>
                    <span className="font-bold text-stone-800">{qCount} questions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: SUBJECTS */}
      {activeSection === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Configured Curriculum Subjects & Disciplines
            </span>
            <span className="text-xs text-stone-500">
              Click the trash icon to delete any unwanted subject
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const qCount = questions.filter((q) => q.subject === sub.name).length;
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm hover:border-stone-300 transition flex flex-col justify-between group relative"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-2xl shadow-xs">
                        {sub.icon}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                          {sub.category}
                        </span>
                        {onDeleteSubject && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmation({ type: 'subject', id: sub.id, name: sub.name })}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={`Delete subject ${sub.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-stone-900">{sub.name}</h4>
                      <p className="text-xs text-stone-500 leading-relaxed mt-1">{sub.description}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between text-xs">
                    <span className="text-stone-500">Repository Content:</span>
                    <span className="font-bold text-[#10246f] bg-[#eef4ff] border border-[#d7def0] px-2 py-0.5 rounded-md font-mono">
                      {qCount} Questions in Bank
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-sm w-full p-5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-stone-900">
                Delete {deleteConfirmation.type === 'grade' ? 'Grade' : 'Subject'}?
              </h3>
              <p className="text-xs text-stone-600">
                Are you sure you want to remove <strong>{deleteConfirmation.name}</strong> from the active curriculum? Existing questions in the bank will be preserved.
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE GRADE / CLASS LEVEL */}
      {showGradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden">
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Create New Academic Grade / Class</h3>
              </div>
              <button
                onClick={() => setShowGradeModal(false)}
                className="p-1 rounded text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGrade} className="p-5 space-y-3.5 text-xs text-stone-800">
              <div>
                <label className="block font-semibold mb-1 text-stone-700">Class / Grade Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preschool, Foundation, Grade 6, Grade 7"
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700">Target Age Range *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-4 Years, 11-12 Years"
                  value={gradeAgeGroup}
                  onChange={(e) => setGradeAgeGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700">Icon / Symbol</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                    {gradeIcon}
                  </span>
                  <select
                    value={gradeIcon}
                    onChange={(e) => setGradeIcon(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300"
                  >
                    {GRADE_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic} Symbol
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700">Curriculum Scope / Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe learning objectives and focus standards"
                  value={gradeDesc}
                  onChange={(e) => setGradeDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-3 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold shadow-md"
                >
                  Create Grade Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE SUBJECT */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden">
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold">Create New Curriculum Subject</h3>
              </div>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="p-1 rounded text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-5 space-y-3.5 text-xs text-stone-800">
              <div>
                <label className="block font-semibold mb-1 text-stone-700">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maths, Art & Creativity, Social Studies"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#10246f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Category</label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  >
                    <option value="STEM">STEM</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Cognitive">Cognitive</option>
                    <option value="Tech">Tech / Coding</option>
                    <option value="Creative">Creative Arts</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Subject Icon</label>
                  <select
                    value={subIcon}
                    onChange={(e) => setSubIcon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300"
                  >
                    {SUBJECT_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic} Icon
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-stone-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe knowledge domain and learning outcomes"
                  value={subDesc}
                  onChange={(e) => setSubDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#10246f]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-3 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#10246f] hover:bg-[#0c1b54] text-white font-bold shadow-md cursor-pointer transition-all"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
