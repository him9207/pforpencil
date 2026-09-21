import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, FolderPlus, HelpCircle, Layers3, Plus, Search, Trash2, X, Globe2, ToggleLeft, ToggleRight, Eye, Sparkles, Check, CheckSquare, Square, Filter, FileSpreadsheet, Send, ArrowRight } from 'lucide-react';
import { Question, CurriculumGrade, CurriculumSubject, QuestionType } from '../../../types';
import QuestionBankModal from './QuestionBankModal';
import QuestionPreviewModal from './QuestionPreviewModal';
import { loadCurriculumMaster } from '../../../data/curriculumMasterData';
import { CategoryMasterRecord, SkillMasterRecord, loadQuestionBankMasters, saveQuestionBankMasters } from '../../../data/questionBankMasterData';

interface Props {
  grades: CurriculumGrade[];
  subjects: CurriculumSubject[];
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onEditQuestion?: (q: Question) => void;
  onDeleteQuestion?: (id: string) => void;
  onSuccessMessage?: (message: string) => void;
}

const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const code = (v: string, p = 'CAT') => `${p}-${slug(v).split('-').filter(Boolean).map(x => x.slice(0, 3)).join('').slice(0, 8).toUpperCase() || 'ITEM'}`;
const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  radio_single: 'Single Choice',
  fill_blank: 'Fill in the Blank',
  open_box: 'Fill in the Blank',
  true_false: 'True / False',
  image_choice: 'Image Choice',
  image_mcq: 'Image + MCQ',
  select_objects: 'Select Objects',
  drag_and_drop: 'Drag & Drop',
  match_making: 'Matching',
  ordering: 'Ordering',
  sorting: 'Sorting',
  number_line: 'Number Line',
  clock: 'Clock',
  data_graph: 'Data / Graph',
  word_problem: 'Word Problem',
  interactive: 'Interactive'
};

function typeLabel(q: Question) {
  return TYPE_LABELS[String(q.type || '')] || String(q.type || 'Not set').replace(/_/g, ' ');
}

export default function MasterQuestionBank({
  grades,
  subjects,
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onSuccessMessage
}: Props) {
  const [curriculumMaster, setCurriculumMaster] = useState(loadCurriculumMaster);
  useEffect(() => { setCurriculumMaster(loadCurriculumMaster()); }, []);

  const activeCountries = curriculumMaster.countries.filter(x => x.active).sort((a, b) => a.displayOrder - b.displayOrder);
  const [countryId, setCountryId] = useState(activeCountries[0]?.id || 'CNT-AU');
  useEffect(() => {
    if (countryId && !activeCountries.some(c => c.id === countryId)) {
      setCountryId(activeCountries[0]?.id || '');
    }
  }, [activeCountries, countryId]);

  const regions = useMemo(() => curriculumMaster.regions.filter(x => x.active && x.countryId === countryId).sort((a, b) => a.displayOrder - b.displayOrder), [countryId]);
  const [regionId, setRegionId] = useState('');

  const curricula = useMemo(() => curriculumMaster.curricula.filter(x => x.active && x.countryId === countryId && x.regionId === regionId).sort((a, b) => a.displayOrder - b.displayOrder), [countryId, regionId]);
  const [curriculumId, setCurriculumId] = useState('');

  const activeGrades = useMemo(() => grades.filter(g => g.active), [grades]);
  const activeSubjects = useMemo(() => subjects.filter(s => s.active), [subjects]);
  const [selectedGradeId, setSelectedGradeId] = useState(activeGrades[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjects[0]?.id || '');

  const [masters, setMasters] = useState(() => loadQuestionBankMasters(grades, subjects));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Published' | 'Archived'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [showCreator, setShowCreator] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  useEffect(() => {
    if (!regionId && regions[0]) setRegionId(regions[0].id);
    else if (regionId && !regions.some(r => r.id === regionId)) setRegionId(regions[0]?.id || '');
  }, [regions, regionId]);

  useEffect(() => {
    if (!curriculumId && curricula[0]) setCurriculumId(curricula[0].id);
    else if (curriculumId && !curricula.some(c => c.id === curriculumId)) setCurriculumId(curricula[0]?.id || '');
  }, [curricula, curriculumId]);

  useEffect(() => {
    if (!selectedGradeId && activeGrades[0]) setSelectedGradeId(activeGrades[0].id);
    if (selectedGradeId && !activeGrades.some(g => g.id === selectedGradeId)) setSelectedGradeId(activeGrades[0]?.id || '');
    if (!selectedSubjectId && activeSubjects[0]) setSelectedSubjectId(activeSubjects[0].id);
    if (selectedSubjectId && !activeSubjects.some(s => s.id === selectedSubjectId)) setSelectedSubjectId(activeSubjects[0]?.id || '');
  }, [activeGrades, activeSubjects, selectedGradeId, selectedSubjectId]);

  useEffect(() => { saveQuestionBankMasters(masters); }, [masters]);

  const selectedCountry = activeCountries.find(x => x.id === countryId);
  const selectedRegion = regions.find(x => x.id === regionId);
  const selectedCurriculum = curricula.find(x => x.id === curriculumId);
  const selectedGrade = activeGrades.find(x => x.id === selectedGradeId);
  const selectedSubject = activeSubjects.find(x => x.id === selectedSubjectId);

  const categories = useMemo(() => {
    return masters.categories.filter(c => (showInactive || c.active) && c.curriculumId === curriculumId && c.subjectId === selectedSubjectId && c.gradeId === selectedGradeId);
  }, [masters, curriculumId, selectedSubjectId, selectedGradeId, showInactive]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories.find(c => c.active) || categories[0];
  const skills = useMemo(() => {
    return masters.skills.filter(s => (showInactive || s.active) && s.categoryId === selectedCategory?.id && s.gradeId === selectedGradeId);
  }, [masters, selectedCategory, selectedGradeId, showInactive]);

  const selectedSkill = skills.find(s => s.id === selectedSkillId) || skills.find(s => s.active) || skills[0];

  useEffect(() => {
    setSelectedCategoryId(prev => categories.some(c => c.id === prev) ? prev : (categories[0]?.id || null));
  }, [categories]);

  useEffect(() => {
    setSelectedSkillId(prev => skills.some(s => s.id === prev) ? prev : (skills[0]?.id || null));
  }, [skills]);

  // Clear selection when filters or category/skill change
  useEffect(() => {
    setSelectedQuestionIds([]);
  }, [curriculumId, selectedSubjectId, selectedGradeId, selectedCategoryId, selectedSkillId, statusFilter, difficultyFilter]);

  const visibleQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter(q => {
      const curriculumMatches = !q.curriculumId ||
        q.curriculumId === 'CUR-GLOBAL' ||
        q.curriculum === 'Global Standard' ||
        q.curriculum === 'Universal' ||
        q.curriculum === 'Universal Foundational' ||
        q.curriculumId === curriculumId ||
        (selectedCurriculum && q.curriculum === selectedCurriculum.name);
      if (!curriculumMatches) return false;

      const subjectMatches = !q.subjectId ||
        q.subjectId === selectedSubjectId ||
        (selectedSubject && q.subject === selectedSubject.name);
      if (!subjectMatches) return false;

      const gradeMatches = !q.gradeId ||
        q.gradeId === selectedGradeId ||
        (selectedGrade && q.grade?.toLowerCase() === selectedGrade.name.toLowerCase());
      if (!gradeMatches) return false;

      if (selectedCategory) {
        const catMatch = q.categoryId === selectedCategory.id ||
          q.category?.trim().toLowerCase() === selectedCategory.name.trim().toLowerCase();
        if (!catMatch) return false;
      }

      if (selectedSkill) {
        const sklMatch = q.skillId === selectedSkill.id ||
          q.skill?.trim().toLowerCase() === selectedSkill.name.trim().toLowerCase();
        if (!sklMatch) return false;
      }

      if (statusFilter !== 'all') {
        const qStatus = q.status || 'Draft';
        if (qStatus !== statusFilter) return false;
      }

      if (difficultyFilter !== 'all') {
        if (q.difficulty !== difficultyFilter) return false;
      }

      return !term || [q.id, q.prompt, q.category, q.skill, q.difficulty, typeLabel(q), ...(q.options || [])].some(v => String(v || '').toLowerCase().includes(term));
    });
  }, [questions, curriculumId, selectedCurriculum, selectedSubjectId, selectedSubject, selectedGradeId, selectedGrade, selectedCategory, selectedSkill, search, statusFilter, difficultyFilter]);

  const categoryCount = (c: CategoryMasterRecord) => {
    return questions.filter(q => {
      const categoryMatch = q.categoryId === c.id || q.category?.trim().toLowerCase() === c.name.trim().toLowerCase();
      const gradeMatch = !q.gradeId || q.gradeId === c.gradeId || (selectedGrade && q.grade?.toLowerCase() === selectedGrade.name.toLowerCase());
      return categoryMatch && gradeMatch;
    }).length;
  };

  const skillCount = (s: SkillMasterRecord) => {
    return questions.filter(q => {
      const skillMatch = q.skillId === s.id || q.skill?.trim().toLowerCase() === s.name.trim().toLowerCase();
      const gradeMatch = !q.gradeId || q.gradeId === s.gradeId || (selectedGrade && q.grade?.toLowerCase() === selectedGrade.name.toLowerCase());
      return skillMatch && gradeMatch;
    }).length;
  };

  const draftCountInSkill = useMemo(() => {
    return visibleQuestions.filter(q => (q.status || 'Draft') === 'Draft').length;
  }, [visibleQuestions]);

  const publishedCountInSkill = useMemo(() => {
    return visibleQuestions.filter(q => q.status === 'Published').length;
  }, [visibleQuestions]);

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || !selectedCurriculum || !selectedSubject || !selectedGrade) return;
    if (categories.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) {
      onSuccessMessage?.(`Category '${name}' already exists for ${selectedGrade.name} in this curriculum.`);
      return;
    }
    const item: CategoryMasterRecord = {
      id: `CAT-${Date.now()}`,
      code: code(name),
      curriculumId: selectedCurriculum.id,
      subjectId: selectedSubject.id,
      gradeId: selectedGrade.id,
      name,
      description: `${name} curriculum area`,
      active: true
    };
    setMasters(p => ({ ...p, categories: [...p.categories, item] }));
    setSelectedCategoryId(item.id);
    setSelectedSkillId(null);
    setNewCategory('');
    setShowCategoryForm(false);
    onSuccessMessage?.(`Created category: ${name} for ${selectedGrade.name}`);
  };

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name || !selectedCategory || !selectedGrade) return;
    if (skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      onSuccessMessage?.('Skill already exists for this category and grade.');
      return;
    }
    const n = skills.length + 1;
    const item: SkillMasterRecord = {
      id: `SKL-${Date.now()}`,
      code: `SK-${slug(selectedCategory.code)}-${slug(selectedGrade.name).replace(/-/g, '').slice(0, 6).toUpperCase()}-${String(n).padStart(3, '0')}`,
      categoryId: selectedCategory.id,
      gradeId: selectedGrade.id,
      name,
      active: true
    };
    setMasters(p => ({ ...p, skills: [...p.skills, item] }));
    setSelectedSkillId(item.id);
    setNewSkill('');
    setShowSkillForm(false);
    onSuccessMessage?.(`Created skill: ${name}`);
  };

  const toggleCategory = (id: string) => setMasters(p => {
    const nextCategories = p.categories.map(c => c.id === id ? { ...c, active: !c.active } : c);
    const updatedCategory = nextCategories.find(c => c.id === id);
    window.dispatchEvent(new CustomEvent('pforpencil_master_data_updated', { detail: { type: 'category', id, active: updatedCategory?.active } }));
    return { ...p, categories: nextCategories };
  });

  const toggleSkill = (id: string) => setMasters(p => {
    const nextSkills = p.skills.map(s => s.id === id ? { ...s, active: !s.active } : s);
    const updatedSkill = nextSkills.find(s => s.id === id);
    window.dispatchEvent(new CustomEvent('pforpencil_master_data_updated', { detail: { type: 'skill', id, active: updatedSkill?.active } }));
    return { ...p, skills: nextSkills };
  });

  const handleCountry = (id: string) => {
    setCountryId(id);
    const r = curriculumMaster.regions.find(x => x.active && x.countryId === id);
    setRegionId(r?.id || '');
    setCurriculumId('');
    setSelectedCategoryId(null);
    setSelectedSkillId(null);
  };

  const handleRegion = (id: string) => {
    setRegionId(id);
    const c = curriculumMaster.curricula.find(x => x.active && x.regionId === id);
    setCurriculumId(c?.id || '');
    setSelectedCategoryId(null);
    setSelectedSkillId(null);
  };

  const handleCurriculum = (id: string) => {
    setCurriculumId(id);
    setSelectedCategoryId(null);
    setSelectedSkillId(null);
  };

  // Bulk Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedQuestionIds.length === visibleQuestions.length && visibleQuestions.length > 0) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(visibleQuestions.map(q => q.id));
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = () => {
    if (!onEditQuestion || !selectedQuestionIds.length) return;
    selectedQuestionIds.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q && q.status !== 'Published') {
        onEditQuestion({ ...q, status: 'Published' });
      }
    });
    onSuccessMessage?.(`Published ${selectedQuestionIds.length} questions successfully.`);
    setSelectedQuestionIds([]);
  };

  const handleBulkDraft = () => {
    if (!onEditQuestion || !selectedQuestionIds.length) return;
    selectedQuestionIds.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q && q.status !== 'Draft') {
        onEditQuestion({ ...q, status: 'Draft' });
      }
    });
    onSuccessMessage?.(`Marked ${selectedQuestionIds.length} questions as Draft.`);
    setSelectedQuestionIds([]);
  };

  const handleBulkDelete = () => {
    if (!onDeleteQuestion || !selectedQuestionIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedQuestionIds.length} selected question(s)?`)) return;
    selectedQuestionIds.forEach(id => {
      onDeleteQuestion(id);
    });
    onSuccessMessage?.(`Deleted ${selectedQuestionIds.length} questions.`);
    setSelectedQuestionIds([]);
  };

  const handlePublishAllDraftsInSkill = () => {
    if (!onEditQuestion) return;
    const drafts = visibleQuestions.filter(q => (q.status || 'Draft') === 'Draft');
    if (!drafts.length) return;
    drafts.forEach(q => {
      onEditQuestion({ ...q, status: 'Published' });
    });
    onSuccessMessage?.(`Published all ${drafts.length} draft questions in ${selectedSkill?.name || 'this skill'}!`);
  };

  const isAllSelected = visibleQuestions.length > 0 && selectedQuestionIds.length === visibleQuestions.length;

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & CURRICULUM HIERARCHY BAR */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#10246f] uppercase tracking-wider">
              <Layers3 className="w-4 h-4 text-[#f20b86]" /> Master Question Bank
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
              Curriculum → Category → Skill → Questions
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Full-width visual question authoring, multi-select bulk publishing, and master clipart engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreator(true)}
              disabled={!selectedCategory || !selectedSkill || !selectedCategory.active || !selectedSkill.active}
              className="px-4 py-2.5 rounded-xl bg-[#10246f] hover:bg-[#0c1b54] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add / Import Questions
            </button>
          </div>
        </div>

        {/* Global Jurisdiction & Curriculum Selector Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#f8faff] border border-[#d7def0] rounded-2xl">
          <label className="text-[11px] font-bold text-[#10246f]">
            Country
            <select
              value={countryId}
              onChange={e => handleCountry(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-semibold"
            >
              {activeCountries.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-bold text-[#10246f]">
            State / Region
            <select
              value={regionId}
              onChange={e => handleRegion(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-semibold"
            >
              {regions.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-bold text-[#10246f]">
            Curriculum
            <select
              value={curriculumId}
              onChange={e => handleCurriculum(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs font-semibold"
            >
              {curricula.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* 2. GRADES & SUBJECT BAR */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Grade Level Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mr-1">Grade:</span>
            {activeGrades.map(g => {
              const isPre = g.name.toLowerCase().includes('pre');
              const isSelected = selectedGradeId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGradeId(g.id); setSelectedSkillId(null); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  {isPre ? `🧸 ${g.name}` : g.name}
                </button>
              );
            })}
          </div>

          {/* Subject Dropdown */}
          <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <BookOpen className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs font-bold text-stone-500">Subject:</span>
            <select
              value={selectedSubjectId}
              onChange={e => { setSelectedSubjectId(e.target.value); setSelectedCategoryId(null); setSelectedSkillId(null); }}
              className="bg-transparent text-xs font-bold text-stone-900 outline-none cursor-pointer"
            >
              {activeSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 3. SINGLE-LEVEL UNIFIED CATEGORY & SKILL ROW (Directly above questions) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 space-y-3 shadow-xs">
        {/* Category Selection Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Categories ({categories.length})
              </span>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  showInactive ? 'bg-stone-100 text-stone-600 border-stone-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {showInactive ? 'Showing All' : 'Active Only'}
              </button>
            </div>

            <button
              onClick={() => setShowCategoryForm(true)}
              className="px-2.5 py-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1 transition"
            >
              <FolderPlus className="w-3.5 h-3.5" /> + Add Category
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(c => {
              const isSelected = selectedCategory?.id === c.id;
              const count = categoryCount(c);
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                    isSelected
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  } ${!c.active ? 'opacity-70 border-dashed' : ''}`}
                >
                  <button
                    onClick={() => { setSelectedCategoryId(c.id); setSelectedSkillId(null); }}
                    className="flex items-center gap-1.5 text-left"
                  >
                    <span>{c.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {count}
                    </span>
                  </button>

                  <button
                    onClick={() => toggleCategory(c.id)}
                    title={c.active ? 'Click to deactivate' : 'Click to activate'}
                    className={`ml-1 text-[9px] p-0.5 rounded ${
                      isSelected
                        ? (c.active ? 'text-emerald-300 hover:text-emerald-200' : 'text-amber-300 hover:text-amber-200')
                        : (c.active ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700')
                    }`}
                  >
                    {c.active ? <ToggleRight className="w-3.5 h-3.5"/> : <ToggleLeft className="w-3.5 h-3.5"/>}
                  </button>
                </div>
              );
            })}
            {!categories.length && (
              <div className="text-xs text-stone-400 py-1">No categories yet for this grade. Click "+ Add Category".</div>
            )}
          </div>
        </div>

        {/* Divider with subtle arrow */}
        <div className="border-t border-stone-100 pt-2.5">
          {/* Skill Selection Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span> Skills for "{selectedCategory?.name || 'Selected Category'}" ({skills.length})
              </span>

              <button
                onClick={() => setShowSkillForm(true)}
                disabled={!selectedCategory || !selectedGrade || !selectedCategory.active}
                className="px-2.5 py-1 rounded-lg border border-dashed border-pink-300 bg-pink-50/50 hover:bg-pink-50 text-pink-700 text-xs font-bold flex items-center gap-1 transition disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> + Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map(s => {
                const isSelected = selectedSkill?.id === s.id;
                const count = skillCount(s);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    } ${!s.active ? 'opacity-70 border-dashed' : ''}`}
                  >
                    <button
                      onClick={() => setSelectedSkillId(s.id)}
                      className="flex items-center gap-1.5 text-left"
                    >
                      <span>{s.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {count}
                      </span>
                    </button>

                    <button
                      onClick={() => toggleSkill(s.id)}
                      title={s.active ? 'Click to deactivate' : 'Click to activate'}
                      className={`ml-1 text-[9px] p-0.5 rounded ${
                        isSelected
                          ? (s.active ? 'text-emerald-200' : 'text-amber-200')
                          : (s.active ? 'text-emerald-600' : 'text-amber-600')
                      }`}
                    >
                      {s.active ? <ToggleRight className="w-3.5 h-3.5"/> : <ToggleLeft className="w-3.5 h-3.5"/>}
                    </button>
                  </div>
                );
              })}
              {selectedCategory && !skills.length && (
                <div className="text-xs text-stone-400 py-1">No skills yet under {selectedCategory.name}. Click "+ Add Skill".</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. FULL-WIDTH QUESTIONS & ANSWERS CANVAS (NO SQUISHING, NO HORIZONTAL SCROLL) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Top Filter & Actions Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/50 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>{selectedCountry?.name}</span>
                <ChevronRight className="w-3 h-3 text-stone-400" />
                <span>{selectedCurriculum?.name}</span>
                <ChevronRight className="w-3 h-3 text-stone-400" />
                <span>{selectedGrade?.name}</span>
                <ChevronRight className="w-3 h-3 text-stone-400" />
                <span>{selectedSubject?.name}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-stone-900 mt-0.5">
                {selectedCategory?.name || 'Category'} <span className="text-pink-600">→</span> {selectedSkill?.name || 'All Questions'}
                <span className="ml-2 font-mono text-xs font-semibold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                  {visibleQuestions.length} Questions
                </span>
              </h3>
            </div>

            {/* Status & Difficulty Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl bg-white border border-stone-200 p-1 text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  All ({visibleQuestions.length})
                </button>
                <button
                  onClick={() => setStatusFilter('Draft')}
                  className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'Draft' ? 'bg-amber-500 text-white' : 'text-amber-700 hover:bg-amber-50'}`}
                >
                  Drafts ({draftCountInSkill})
                </button>
                <button
                  onClick={() => setStatusFilter('Published')}
                  className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'Published' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'}`}
                >
                  Published ({publishedCountInSkill})
                </button>
              </div>

              <select
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions or answers..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* BULK ACTION BAR */}
          <div className="p-3 bg-white border border-stone-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-xs text-stone-800">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="rounded border-stone-300 w-4 h-4 cursor-pointer text-indigo-600 focus:ring-indigo-500"
                />
                <span>Select All ({visibleQuestions.length})</span>
              </label>

              {selectedQuestionIds.length > 0 && (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  {selectedQuestionIds.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedQuestionIds.length > 0 ? (
                <>
                  <button
                    onClick={handleBulkPublish}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Publish Selected ({selectedQuestionIds.length})
                  </button>
                  <button
                    onClick={handleBulkDraft}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition cursor-pointer"
                  >
                    Mark as Draft ({selectedQuestionIds.length})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedQuestionIds.length})
                  </button>
                </>
              ) : (
                draftCountInSkill > 0 && (
                  <button
                    onClick={handlePublishAllDraftsInSkill}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" /> ⚡ Publish All {draftCountInSkill} Drafts in this Skill
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* FULL WIDTH QUESTION CARDS LIST */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {visibleQuestions.map((q, idx) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            const isDraft = (q.status || 'Draft') === 'Draft';
            const isPublished = q.status === 'Published';

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/30 shadow-xs'
                    : isDraft
                    ? 'border-amber-200/80 bg-amber-50/15 hover:border-stone-300'
                    : 'border-stone-200 bg-white hover:border-stone-300 shadow-2xs'
                }`}
              >
                {/* Header row: Checkbox, ID, Type, Difficulty, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectQuestion(q.id)}
                      className="rounded border-stone-300 w-4 h-4 cursor-pointer text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md">
                      #{idx + 1} · {q.id}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      q.difficulty === 'Easy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : q.difficulty === 'Hard'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                      {typeLabel(q)}
                    </span>
                    {q.visualClipart && (
                      <span className="text-xs px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-md font-medium flex items-center gap-1">
                        Badge: {q.visualClipart}
                      </span>
                    )}
                    {q.visualConfig && (
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-md font-bold">
                        Interactive Visual ({q.visualConfig.template})
                      </span>
                    )}
                  </div>

                  {/* Status toggle & Direct Action Buttons */}
                  <div className="flex items-center gap-2">
                    <select
                      value={q.status || 'Draft'}
                      onChange={e => onEditQuestion?.({ ...q, status: e.target.value as Question['status'] })}
                      disabled={!onEditQuestion}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                        isPublished
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : q.status === 'Archived'
                          ? 'border-stone-200 bg-stone-100 text-stone-500'
                          : 'border-amber-300 bg-amber-50 text-amber-800'
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published / Ready</option>
                      <option value="Archived">Archived</option>
                    </select>

                    {isDraft && onEditQuestion && (
                      <button
                        onClick={() => {
                          onEditQuestion({ ...q, status: 'Published' });
                          onSuccessMessage?.(`Published ${q.id}. Ready for students!`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-emerald-400" /> Publish
                      </button>
                    )}

                    <button
                      onClick={() => setPreviewQuestion(q)}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition cursor-pointer"
                      title="Preview question in student interactive view"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {onDeleteQuestion && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete question ${q.id}?`)) {
                            onDeleteQuestion(q.id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Prompt Text (Prominently rendered, full width) */}
                <div className="pt-3">
                  <div className="text-sm sm:text-base font-bold text-stone-900 leading-relaxed">
                    {q.prompt}
                  </div>
                </div>

                {/* Options & Answers Full Width Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
                  {(q.options && q.options.length > 0 ? q.options : [q.openBoxAnswer || '']).map((opt, optIdx) => {
                    const isCorrect = q.correctIndex === optIdx || q.type === 'open_box' || q.type === 'fill_blank';
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 break-words">{opt || '(No text)'}</span>
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 shrink-0">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation or Hint if available */}
                {(q.explanation || q.hint) && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap gap-4 text-xs text-stone-600">
                    {q.explanation && (
                      <div>
                        <span className="font-bold text-stone-700">Explanation: </span>
                        <span>{q.explanation}</span>
                      </div>
                    )}
                    {q.hint && (
                      <div>
                        <span className="font-bold text-amber-700">Hint: </span>
                        <span>{q.hint}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!visibleQuestions.length && (
            <div className="p-12 text-center bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 space-y-2">
              <HelpCircle className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="text-sm font-bold text-stone-700">No questions found matching the selected filters.</div>
              <p className="text-xs text-stone-500">
                Click <strong>"+ Add / Import Questions"</strong> to add questions manually, generate in batch, or upload Excel/CSV.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Category Creation Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-stone-200">
            <h3 className="font-black text-stone-900 text-base">Create Category</h3>
            <p className="text-xs text-stone-500 mt-1">
              {selectedCurriculum?.name} · {selectedSubject?.name} · {selectedGrade?.name}
            </p>
            <input
              autoFocus
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="e.g. Addition & Subtraction"
              className="w-full mt-4 p-3 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCategoryForm(false)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Creation Modal */}
      {showSkillForm && (
        <div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-stone-200">
            <h3 className="font-black text-stone-900 text-base">Create Skill</h3>
            <p className="text-xs text-stone-500 mt-1">
              {selectedCurriculum?.name} · {selectedGrade?.name} · {selectedCategory?.name}
            </p>
            <input
              autoFocus
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              placeholder="e.g. Add one-digit and two-digit numbers"
              className="w-full mt-4 p-3 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSkillForm(false)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addSkill}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
              >
                Create Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      <QuestionPreviewModal question={previewQuestion} onClose={() => setPreviewQuestion(null)} />

      {/* Question Bank Modal */}
      <QuestionBankModal
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        availableGrades={activeGrades.map(g => g.name)}
        availableSubjects={activeSubjects.map(s => s.name)}
        questions={questions}
        onAddQuestion={q => {
          onAddQuestion(q);
          onSuccessMessage?.(`Added ${q.id} to ${selectedCategory?.name} → ${selectedSkill?.name}`);
          setShowCreator(false);
        }}
        initialGrade={selectedGrade?.name}
        initialSubject={selectedSubject?.name}
        initialCategory={selectedCategory?.name}
        initialSkill={selectedSkill?.name}
        initialCountryId={countryId}
        initialRegionId={regionId}
        initialCurriculumId={curriculumId}
        categoryMasters={masters.categories}
        skillMasters={masters.skills}
        grades={activeGrades}
        subjects={activeSubjects}
        onAddBatchQuestions={qs => {
          qs.forEach(onAddQuestion);
          onSuccessMessage?.(`Added ${qs.length} questions to the Master Question Bank.`);
          setShowCreator(false);
        }}
      />
    </div>
  );
}
