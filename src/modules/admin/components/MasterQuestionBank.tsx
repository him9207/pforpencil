import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, FolderPlus, HelpCircle, Layers3, Plus, Search, Trash2, X, Globe2, ToggleLeft, ToggleRight, Eye, Sparkles, Check, CheckSquare, Square, Filter, FileSpreadsheet, Send, ArrowRight, Edit3, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Question, CurriculumGrade, CurriculumSubject, QuestionType } from '../../../types';
import QuestionBankModal from './QuestionBankModal';
import QuestionPreviewModal from './QuestionPreviewModal';
import QuestionEditModal from './QuestionEditModal';
import { loadCurriculumMaster } from '../../../data/curriculumMasterData';
import { CategoryMasterRecord, SkillMasterRecord, QuestionBankMasterData, loadQuestionBankMasters, saveQuestionBankMasters } from '../../../data/questionBankMasterData';
import { 
  syncCategoryMasterToSupabase, 
  syncSkillMasterToSupabase, 
  deleteCategoryMasterFromSupabase, 
  deleteSkillMasterFromSupabase, 
  deleteQuestionFromSupabase,
  syncQuestionToSupabase,
  purgeAllQuestionBankDataFromSupabase,
  fetchCategoryMastersFromSupabase,
  fetchSkillMastersFromSupabase
} from '../../../database/sync';

interface Props {
  grades: CurriculumGrade[];
  subjects: CurriculumSubject[];
  questions: Question[];
  onAddQuestion: (q: Question) => void;
  onEditQuestion?: (q: Question) => void;
  onDeleteQuestion?: (id: string) => void;
  onPurgeAllQuestions?: () => void;
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
  onPurgeAllQuestions,
  onSuccessMessage
}: Props) {
  const [curriculumMaster, setCurriculumMaster] = useState(loadCurriculumMaster);
  useEffect(() => { setCurriculumMaster(loadCurriculumMaster()); }, []);

  const allCurricula = useMemo(() => {
    return curriculumMaster.curricula.filter(x => x.active).map(c => {
      const country = curriculumMaster.countries.find(x => x.id === c.countryId);
      const region = curriculumMaster.regions.find(x => x.id === c.regionId);
      let flag = '🌐';
      if (c.countryId === 'CNT-AU') flag = '🇦🇺';
      else if (c.countryId === 'CNT-US') flag = '🇺🇸';
      else if (c.countryId === 'CNT-IN') flag = '🇮🇳';
      else if (c.countryId === 'CNT-UK') flag = '🇬🇧';
      else if (c.countryId === 'CNT-CA') flag = '🇨🇦';
      return {
        ...c,
        flag,
        displayName: `${flag} ${c.name} (${country?.name || 'Global'}${region?.name ? ' · ' + region.name : ''})`
      };
    });
  }, [curriculumMaster]);

  const activeCountries = curriculumMaster.countries.filter(x => x.active).sort((a, b) => a.displayOrder - b.displayOrder);
  const [countryId, setCountryId] = useState(activeCountries[0]?.id || 'CNT-AU');
  useEffect(() => {
    if (countryId && !activeCountries.some(c => c.id === countryId)) {
      setCountryId(activeCountries[0]?.id || '');
    }
  }, [activeCountries, countryId]);

  const regions = useMemo(() => curriculumMaster.regions.filter(x => x.active && x.countryId === countryId).sort((a, b) => a.displayOrder - b.displayOrder), [curriculumMaster, countryId]);
  const [regionId, setRegionId] = useState('');

  const curricula = useMemo(() => curriculumMaster.curricula.filter(x => x.active && x.countryId === countryId && x.regionId === regionId).sort((a, b) => a.displayOrder - b.displayOrder), [curriculumMaster, countryId, regionId]);
  const [curriculumId, setCurriculumId] = useState(allCurricula[0]?.id || 'CUR-VCAA20');

  const activeGrades = useMemo(() => grades.filter(g => g.active), [grades]);
  const activeSubjects = useMemo(() => subjects.filter(s => s.active), [subjects]);
  const [selectedGradeId, setSelectedGradeId] = useState(activeGrades[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(activeSubjects[0]?.id || '');

  const [masters, setMasters] = useState(() => loadQuestionBankMasters(grades, subjects));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Published'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Easy' | 'Medium' | 'Hard'>('all');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  const [showCreator, setShowCreator] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryMasterRecord | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<SkillMasterRecord | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [showInactive, setShowInactive] = useState(true);

  // Sync / load categories and skills from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLiveMasters() {
      try {
        const [catRes, skillRes] = await Promise.all([
          fetchCategoryMastersFromSupabase(),
          fetchSkillMastersFromSupabase()
        ]);
        if (isMounted) {
          const loadedCats = (catRes.success && Array.isArray(catRes.categories)) ? catRes.categories : [];
          const loadedSkills = (skillRes.success && Array.isArray(skillRes.skills)) ? skillRes.skills : [];
          if (loadedCats.length > 0 || loadedSkills.length > 0) {
            setMasters({ categories: loadedCats, skills: loadedSkills });
          }
        }
      } catch {}
    }
    loadLiveMasters();
  }, []);

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
  const selectedCurriculum = curricula.find(x => x.id === curriculumId) || allCurricula.find(x => x.id === curriculumId);
  const selectedGrade = activeGrades.find(x => x.id === selectedGradeId);
  const selectedSubject = activeSubjects.find(x => x.id === selectedSubjectId);

  const categories = useMemo(() => {
    // 1. First get categories matching the specific curriculum for this subject & grade
    const exact = masters.categories.filter(c => (showInactive || c.active) && (
      c.curriculumId === curriculumId &&
      (!c.subjectId || c.subjectId === selectedSubjectId) &&
      (!c.gradeId || c.gradeId === selectedGradeId)
    ));

    // 2. If no exact curriculum categories exist, get universal/global ones
    const pool = exact.length > 0 ? exact : masters.categories.filter(c => (showInactive || c.active) && (
      (!c.curriculumId || c.curriculumId === 'CUR-GLOBAL') &&
      (!c.subjectId || c.subjectId === selectedSubjectId) &&
      (!c.gradeId || c.gradeId === selectedGradeId)
    ));

    // Strict deduplication by trimmed, case-insensitive name
    const seen = new Set<string>();
    const result: CategoryMasterRecord[] = [];
    for (const cat of pool) {
      const key = cat.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(cat);
      }
    }
    return result;
  }, [masters, curriculumId, selectedSubjectId, selectedGradeId, showInactive]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories.find(c => c.active) || categories[0];

  const skills = useMemo(() => {
    if (!selectedCategory) return [];
    const pool = masters.skills.filter(s => 
      (showInactive || s.active) && 
      s.categoryId === selectedCategory.id && 
      (!s.gradeId || s.gradeId === selectedGradeId)
    );

    // Strict deduplication by trimmed, case-insensitive skill name
    const seen = new Set<string>();
    const result: SkillMasterRecord[] = [];
    for (const skl of pool) {
      const key = skl.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(skl);
      }
    }
    return result;
  }, [masters, selectedCategory, selectedGradeId, showInactive]);

  const selectedSkill = skills.find(s => s.id === selectedSkillId) || skills.find(s => s.active) || skills[0];

  useEffect(() => {
    if (selectedCategoryId && categories.some(c => c.id === selectedCategoryId)) return;
    setSelectedCategoryId(categories[0]?.id || null);
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (selectedSkillId && skills.some(s => s.id === selectedSkillId)) return;
    setSelectedSkillId(skills[0]?.id || null);
  }, [skills, selectedSkillId]);

  // Clear selection when filters or category/skill change
  useEffect(() => {
    setSelectedQuestionIds([]);
  }, [curriculumId, selectedSubjectId, selectedGradeId, selectedCategoryId, selectedSkillId, statusFilter, difficultyFilter]);

  const visibleQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter(q => {
      // 1. Strict Category check
      if (!selectedCategory) return false;
      const isSameCategory = (q.categoryId && q.categoryId === selectedCategory.id) ||
        (q.category && q.category.trim().toLowerCase() === selectedCategory.name.trim().toLowerCase() &&
         (!q.curriculumId || q.curriculumId === curriculumId) && 
         (!q.gradeId || q.gradeId === selectedGradeId) && 
         (!q.subjectId || q.subjectId === selectedSubjectId));
      if (!isSameCategory) return false;

      // 2. Strict Skill check
      if (selectedSkill) {
        const isSameSkill = (q.skillId && q.skillId === selectedSkill.id) ||
          (q.skill && q.skill.trim().toLowerCase() === selectedSkill.name.trim().toLowerCase() &&
           (q.categoryId === selectedCategory.id || !q.categoryId));
        if (!isSameSkill) return false;
      } else if (skills.length > 0) {
        return false;
      }

      if (statusFilter !== 'all') {
        const qStatus = q.status || 'Published';
        if (qStatus !== statusFilter) return false;
      }

      if (difficultyFilter !== 'all') {
        if (q.difficulty !== difficultyFilter) return false;
      }

      return !term || [q.id, q.prompt, q.category, q.skill, q.difficulty, typeLabel(q), ...(q.options || [])].some(v => String(v || '').toLowerCase().includes(term));
    });
  }, [questions, curriculumId, selectedSubjectId, selectedGradeId, selectedCategory, selectedSkill, skills.length, search, statusFilter, difficultyFilter]);

  const categoryCount = (c: CategoryMasterRecord) => {
    const cSkills = masters.skills.filter(s => s.categoryId === c.id);
    return questions.filter(q => {
      // Must match category strictly
      const catMatch = (q.categoryId && q.categoryId === c.id) ||
        (q.category && q.category.trim().toLowerCase() === c.name.trim().toLowerCase() &&
         (!q.curriculumId || q.curriculumId === c.curriculumId) &&
         (!q.gradeId || q.gradeId === c.gradeId) &&
         (!q.subjectId || q.subjectId === c.subjectId));
      if (!catMatch) return false;

      if (cSkills.length > 0) {
        return cSkills.some(s => 
          (q.skillId && q.skillId === s.id) ||
          (q.skill && q.skill.trim().toLowerCase() === s.name.trim().toLowerCase() && (q.categoryId === c.id || !q.categoryId))
        );
      }
      return (q.categoryId && q.categoryId === c.id);
    }).length;
  };

  const skillCount = (s: SkillMasterRecord) => {
    return questions.filter(q => {
      return (q.skillId && q.skillId === s.id) ||
        (q.skill && q.skill.trim().toLowerCase() === s.name.trim().toLowerCase() &&
         (q.categoryId === s.categoryId || !q.categoryId) &&
         (!q.gradeId || q.gradeId === s.gradeId));
    }).length;
  };

  const draftCountInSkill = useMemo(() => {
    return visibleQuestions.filter(q => q.status === 'Draft').length;
  }, [visibleQuestions]);

  const publishedCountInSkill = useMemo(() => {
    return visibleQuestions.filter(q => (q.status || 'Published') === 'Published').length;
  }, [visibleQuestions]);

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || !selectedCurriculum || !selectedSubject || !selectedGrade) return;
    if (categories.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) {
      onSuccessMessage?.(`Category '${name}' already exists for ${selectedGrade.name} in this curriculum.`);
      return;
    }
    const catCode = `CAT-${slug(name).toUpperCase().slice(0, 8)}`;
    const item: CategoryMasterRecord = {
      id: `CAT-${Date.now()}`,
      code: catCode,
      curriculumId: selectedCurriculum.id,
      subjectId: selectedSubject.id,
      gradeId: selectedGrade.id,
      name,
      description: `${name} curriculum area`,
      active: true
    };
    setMasters(p => ({ ...p, categories: [...p.categories, item] }));
    syncCategoryMasterToSupabase(item).catch(() => {});
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
      code: `SK-${slug(selectedCategory.code || selectedCategory.name)}-${slug(selectedGrade.name).replace(/-/g, '').slice(0, 6).toUpperCase()}-${String(n).padStart(3, '0')}`,
      categoryId: selectedCategory.id,
      gradeId: selectedGrade.id,
      name,
      active: true
    };
    setMasters(p => ({ ...p, skills: [...p.skills, item] }));
    syncSkillMasterToSupabase(item).catch(() => {});
    setSelectedSkillId(item.id);
    setNewSkill('');
    setShowSkillForm(false);
    onSuccessMessage?.(`Created skill: ${name}`);
  };

  const toggleCategory = (id: string) => setMasters(p => {
    const nextCategories = p.categories.map(c => c.id === id ? { ...c, active: !c.active } : c);
    const updatedCategory = nextCategories.find(c => c.id === id);
    if (updatedCategory) {
      syncCategoryMasterToSupabase(updatedCategory).catch(() => {});
    }
    window.dispatchEvent(new CustomEvent('pforpencil_master_data_updated', { detail: { type: 'category', id, active: updatedCategory?.active } }));
    return { ...p, categories: nextCategories };
  });

  const toggleSkill = (id: string) => setMasters(p => {
    const nextSkills = p.skills.map(s => s.id === id ? { ...s, active: !s.active } : s);
    const updatedSkill = nextSkills.find(s => s.id === id);
    if (updatedSkill) {
      syncSkillMasterToSupabase(updatedSkill).catch(() => {});
    }
    window.dispatchEvent(new CustomEvent('pforpencil_master_data_updated', { detail: { type: 'skill', id, active: updatedSkill?.active } }));
    return { ...p, skills: nextSkills };
  });

  // Calculate cascading impact for Category Deletion
  const categoryDeletionImpact = useMemo(() => {
    if (!categoryToDelete) return { skills: [], questions: [] };
    const targetCatId = categoryToDelete.id;
    const targetCatName = categoryToDelete.name.trim().toLowerCase();

    // 1. Linked child skills
    const linkedSkills = masters.skills.filter(s =>
      s.categoryId === targetCatId ||
      (categoryToDelete.gradeId && s.gradeId === categoryToDelete.gradeId && s.categoryId === targetCatId)
    );
    const linkedSkillIds = new Set(linkedSkills.map(s => s.id));
    const linkedSkillNames = new Set(linkedSkills.map(s => s.name.trim().toLowerCase()));

    // 2. Linked questions to be deleted
    const linkedQuestions = questions.filter(q => {
      const catMatch = q.categoryId === targetCatId || q.category?.trim().toLowerCase() === targetCatName;
      const skillMatch = (q.skillId && linkedSkillIds.has(q.skillId)) || (q.skill && linkedSkillNames.has(q.skill.trim().toLowerCase()));
      const gradeMatch = !q.gradeId || q.gradeId === categoryToDelete.gradeId || (selectedGrade && q.grade?.toLowerCase() === selectedGrade.name.toLowerCase());
      return (catMatch || skillMatch) && gradeMatch;
    });

    return { skills: linkedSkills, questions: linkedQuestions };
  }, [categoryToDelete, masters.skills, questions, selectedGrade]);

  // Calculate cascading impact for Skill Deletion
  const skillDeletionImpact = useMemo(() => {
    if (!skillToDelete) return { questions: [] };
    const targetSkillId = skillToDelete.id;
    const targetSkillName = skillToDelete.name.trim().toLowerCase();

    const linkedQuestions = questions.filter(q => {
      const skillMatch = q.skillId === targetSkillId || q.skill?.trim().toLowerCase() === targetSkillName;
      const gradeMatch = !q.gradeId || q.gradeId === skillToDelete.gradeId || (selectedGrade && q.grade?.toLowerCase() === selectedGrade.name.toLowerCase());
      return skillMatch && gradeMatch;
    });

    return { questions: linkedQuestions };
  }, [skillToDelete, questions, selectedGrade]);

  // Execute Cascading Category Deletion
  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const { skills: linkedSkills, questions: linkedQuestions } = categoryDeletionImpact;

    // 1. Delete all cascading questions
    if (onDeleteQuestion && linkedQuestions.length > 0) {
      linkedQuestions.forEach(q => {
        onDeleteQuestion(q.id);
        deleteQuestionFromSupabase(q.id).catch(() => {});
      });
    }

    // 2. Remove skills & category from master records
    const skillIdsToRemove = new Set(linkedSkills.map(s => s.id));
    const nextMasters: QuestionBankMasterData = {
      categories: masters.categories.filter(c => c.id !== categoryToDelete.id),
      skills: masters.skills.filter(s => s.categoryId !== categoryToDelete.id && !skillIdsToRemove.has(s.id))
    };

    setMasters(nextMasters);
    saveQuestionBankMasters(nextMasters);
    deleteCategoryMasterFromSupabase(categoryToDelete.id).catch(() => {});
    linkedSkills.forEach(s => deleteSkillMasterFromSupabase(s.id).catch(() => {}));
    window.dispatchEvent(new CustomEvent('pforpencil_master_data_updated', { detail: { type: 'category_deleted', id: categoryToDelete.id } }));

    onSuccessMessage?.(`Permanently deleted category "${categoryToDelete.name}", ${linkedSkills.length} skill(s), and ${linkedQuestions.length} question(s).`);
    setCategoryToDelete(null);
    setSelectedCategoryId(null);
    setSelectedSkillId(null);
  };

  // Execute Cascading Skill Deletion
  const handleConfirmDeleteSkill = () => {
    if (!skillToDelete) return;
    const { questions: linkedQuestions } = skillDeletionImpact;

    // 1. Delete all linked questions
    if (onDeleteQuestion && linkedQuestions.length > 0) {
      linkedQuestions.forEach(q => {
        onDeleteQuestion(q.id);
        deleteQuestionFromSupabase(q.id).catch(() => {});
      });
    }

    // 2. Remove skill from master records
    const nextMasters: QuestionBankMasterData = {
      categories: masters.categories,
      skills: masters.skills.filter(s => s.id !== skillToDelete.id)
    };

    setMasters(nextMasters);
    saveQuestionBankMasters(nextMasters);
    deleteSkillMasterFromSupabase(skillToDelete.id).catch(() => {});
    window.dispatchEvent(new CustomEvent('pforpencil_master_data_updated', { detail: { type: 'skill_deleted', id: skillToDelete.id } }));

    onSuccessMessage?.(`Permanently deleted skill "${skillToDelete.name}" and ${linkedQuestions.length} question(s).`);
    setSkillToDelete(null);
    setSelectedSkillId(null);
  };

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

  const handleExecutePurgeAll = async () => {
    setIsPurging(true);
    try {
      // 1. Purge Supabase database tables (questions, category_masters, skill_masters)
      await purgeAllQuestionBankDataFromSupabase();

      // 2. Clear state in Parent
      onPurgeAllQuestions?.();

      // 3. Reset local master records
      setMasters({ categories: [], skills: [] });
      setSelectedCategoryId(null);
      setSelectedSkillId(null);
      setSelectedQuestionIds([]);

      // 4. Purge browser storage keys
      try {
        localStorage.removeItem('pforpencil_question_bank_v1');
        localStorage.removeItem('pforpencil_question_bank_v2');
        localStorage.removeItem('funlearn_question_bank_v3');
        localStorage.removeItem('pforpencil_question_bank_masters_v1');
        localStorage.removeItem('pforpencil_question_bank_masters_v2');
        localStorage.removeItem('funlearn_question_bank_masters_v3');
      } catch {}

      onSuccessMessage?.('All questions, categories, and skills have been completely erased from database and local memory. Ready for fresh testing!');
    } catch (err: any) {
      onSuccessMessage?.(`Purge completed with notice: ${err?.message || 'Done'}`);
    } finally {
      setIsPurging(false);
      setShowPurgeModal(false);
    }
  };

  const isAllSelected = visibleQuestions.length > 0 && selectedQuestionIds.length === visibleQuestions.length;

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & CURRICULUM HIERARCHY BAR */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#10246f] uppercase tracking-wider">
              <Layers3 className="w-4 h-4 text-blue-600" /> Master Question Bank
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
              onClick={() => setShowPurgeModal(true)}
              className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Erase all questions, categories, and skills from database and memory"
            >
              <Trash2 className="w-4 h-4 text-rose-600" /> Erase All Bank Data
            </button>

            <button
              onClick={() => setShowCreator(true)}
              disabled={!selectedCategory || !selectedSkill || !selectedCategory.active || !selectedSkill.active}
              className="px-4 py-2.5 rounded-xl bg-[#10246f] hover:bg-[#0c1b54] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add / Import Questions
            </button>
          </div>
        </div>

        {/* Academic Curriculum Standard & Regional Selector */}
        <div className="p-3 bg-[#f8faff] border border-[#d7def0] rounded-2xl space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <label className="text-[11px] font-bold text-[#10246f] flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" /> Academic Curriculum Standard
            </label>
            <span className="text-[10px] text-stone-500 font-medium">
              Country: <strong className="text-stone-800">{selectedCountry?.name || 'Global'}</strong> · Region: <strong className="text-stone-800">{selectedRegion?.name || 'All'}</strong>
            </span>
          </div>
          <select
            value={curriculumId}
            onChange={e => {
              const nextId = e.target.value;
              setCurriculumId(nextId);
              const found = curriculumMaster.curricula.find(c => c.id === nextId);
              if (found) {
                setCountryId(found.countryId);
                setRegionId(found.regionId);
              }
              setSelectedCategoryId(null);
              setSelectedSkillId(null);
            }}
            className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs font-bold focus:ring-2 focus:ring-[#10246f]"
          >
            {allCurricula.map(c => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
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

      {/* 3. COMPACT CATEGORY & SKILL DROPDOWN SELECTION BAR */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Category Dropdown & Controls */}
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Category ({categories.length})
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowInactive(!showInactive)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${
                    showInactive ? 'bg-stone-200 text-stone-700 border-stone-300' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title="Toggle display of inactive categories and skills"
                >
                  {showInactive ? 'Showing All' : 'Active Only'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(true)}
                  className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Add new category"
                >
                  <Plus className="w-3 h-3" /> Add Category
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory?.id || ''}
                onChange={e => { setSelectedCategoryId(e.target.value); setSelectedSkillId(null); }}
                disabled={!categories.length}
                className="flex-1 p-2 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-stone-100 cursor-pointer"
              >
                {!categories.length && <option value="">No categories for this grade & subject</option>}
                {categories.map(c => {
                  const count = categoryCount(c);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count} questions){!c.active ? ' • [Inactive]' : ''}
                    </option>
                  );
                })}
              </select>

              {selectedCategory && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleCategory(selectedCategory.id)}
                    title={selectedCategory.active ? 'Category is Active. Click to deactivate.' : 'Category is Inactive. Click to activate.'}
                    className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                      selectedCategory.active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-amber-300 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {selectedCategory.active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-amber-600" />}
                    <span className="text-[10px]">{selectedCategory.active ? 'Active' : 'Inactive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(selectedCategory)}
                    title={`Delete category "${selectedCategory.name}" and all child skills and questions`}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-[10px] hidden sm:inline">Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Skill Dropdown & Controls */}
          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Skill ({skills.length})
              </label>
              <button
                type="button"
                onClick={() => setShowSkillForm(true)}
                disabled={!selectedCategory || !selectedCategory.active}
                className="px-2 py-0.5 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-[11px] font-bold flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
                title="Add new skill under current category"
              >
                <Plus className="w-3 h-3" /> Add Skill
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSkill?.id || ''}
                onChange={e => setSelectedSkillId(e.target.value)}
                disabled={!skills.length}
                className="flex-1 p-2 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-stone-100 cursor-pointer"
              >
                {!skills.length && <option value="">No skills for {selectedCategory?.name || 'this category'}</option>}
                {skills.map(s => {
                  const count = skillCount(s);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({count} questions){!s.active ? ' • [Inactive]' : ''}
                    </option>
                  );
                })}
              </select>

              {selectedSkill && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSkill(selectedSkill.id)}
                    title={selectedSkill.active ? 'Skill is Active. Click to deactivate.' : 'Skill is Inactive. Click to activate.'}
                    className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition ${
                      selectedSkill.active
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-amber-300 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {selectedSkill.active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-amber-600" />}
                    <span className="text-[10px]">{selectedSkill.active ? 'Active' : 'Inactive'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkillToDelete(selectedSkill)}
                    title={`Delete skill "${selectedSkill.name}" and all linked questions`}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-[10px] hidden sm:inline">Delete</span>
                  </button>
                </div>
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
                {selectedCategory?.name || 'Category'} <span className="text-pink-600">→</span> {selectedSkill?.name || (skills.length === 0 ? 'No Skills Defined' : 'All Skills')}
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

        {/* COMPACT QUESTIONS LIST / TABLE */}
        <div className="p-4 sm:p-5">
          {visibleQuestions.length > 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
              {/* Table Header (Hidden on extra small screens) */}
              <div className="hidden md:grid grid-cols-[44px_140px_1fr_130px_90px_120px_110px] items-center gap-3 px-4 py-3 bg-stone-50 border-b border-stone-200 text-[11px] font-black text-stone-600 uppercase tracking-wider">
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-stone-300 w-4 h-4 cursor-pointer text-indigo-600 focus:ring-indigo-500"
                    title="Select All Questions"
                  />
                </div>
                <div># & QID</div>
                <div>Question & Answer Preview</div>
                <div>Type</div>
                <div>Difficulty</div>
                <div>Status</div>
                <div className="text-right pr-1">Actions</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-stone-100">
                {visibleQuestions.map((q, idx) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  const isDraft = (q.status || 'Draft') === 'Draft';
                  const isPublished = q.status === 'Published';
                  const isExpanded = !!expandedQuestionIds[q.id];

                  // Get correct answer text preview
                  let correctAnswerPreview = '';
                  if (q.options && q.options.length > 0 && typeof q.correctIndex === 'number' && q.options[q.correctIndex]) {
                    correctAnswerPreview = `${String.fromCharCode(65 + q.correctIndex)}: ${q.options[q.correctIndex]}`;
                  } else if (q.openBoxAnswer) {
                    correctAnswerPreview = q.openBoxAnswer;
                  }

                  const toggleExpand = () => {
                    setExpandedQuestionIds(prev => ({ ...prev, [q.id]: !prev[q.id] }));
                  };

                  return (
                    <div
                      key={q.id}
                      className={`transition ${
                        isSelected
                          ? 'bg-indigo-50/40'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-stone-50/70'
                          : 'bg-stone-50/30 hover:bg-stone-50/80'
                      }`}
                    >
                      {/* Main compact row */}
                      <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col md:grid md:grid-cols-[44px_140px_1fr_130px_90px_120px_110px] items-start md:items-center gap-2 md:gap-3">
                        {/* 1. Checkbox */}
                        <div className="flex items-center justify-between w-full md:w-auto md:justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectQuestion(q.id)}
                            className="rounded border-stone-300 w-4 h-4 cursor-pointer text-indigo-600 focus:ring-indigo-500"
                          />
                          {/* Mobile-only inline tags */}
                          <div className="flex md:hidden items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <button
                              onClick={() => onEditQuestion?.({ ...q, status: isDraft ? 'Published' : 'Draft' })}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${
                                isPublished
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {q.status || 'Draft'}
                            </button>
                          </div>
                        </div>

                        {/* 2. # & ID */}
                        <div className="hidden md:flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-stone-900 font-mono">
                              #{idx + 1}
                            </span>
                            <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 truncate max-w-[95px]" title={q.id}>
                              {q.id}
                            </span>
                          </div>
                        </div>

                        {/* 3. Question Prompt & Answer Preview */}
                        <div className="w-full min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug break-words">
                              {q.prompt}
                            </div>
                            {(q.options?.length || q.explanation || q.hint) && (
                              <button
                                onClick={toggleExpand}
                                className="shrink-0 text-[11px] font-semibold text-stone-500 hover:text-stone-800 px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 transition flex items-center gap-0.5 cursor-pointer"
                                title={isExpanded ? 'Hide Options' : 'Show Options'}
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'Options'}</span>
                              </button>
                            )}
                          </div>

                          {/* Inline preview chips */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                            {correctAnswerPreview && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="truncate max-w-[220px]" title={correctAnswerPreview}>
                                  {correctAnswerPreview}
                                </span>
                              </span>
                            )}
                            {q.visualConfig && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[10px]">
                                🖼️ Visual ({q.visualConfig.template})
                              </span>
                            )}
                            {q.visualClipart && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[10px]">
                                {q.visualClipart}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 4. Type */}
                        <div className="hidden md:block">
                          <span className="text-[11px] font-semibold text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md inline-block max-w-full truncate" title={typeLabel(q)}>
                            {typeLabel(q)}
                          </span>
                        </div>

                        {/* 5. Difficulty */}
                        <div className="hidden md:block">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-block ${
                            q.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.difficulty === 'Hard'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>

                        {/* 6. Status Toggle (Only Draft & Published) */}
                        <div className="hidden md:flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (!onEditQuestion) return;
                              const nextStatus: Question['status'] = isDraft ? 'Published' : 'Draft';
                              onEditQuestion({ ...q, status: nextStatus });
                              onSuccessMessage?.(`Updated ${q.id} to ${nextStatus}.`);
                            }}
                            disabled={!onEditQuestion}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1 cursor-pointer select-none shadow-2xs ${
                              isPublished
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                            }`}
                            title={`Click to switch status to ${isDraft ? 'Published' : 'Draft'}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span>{q.status || 'Draft'}</span>
                          </button>
                        </div>

                        {/* 7. Action Buttons */}
                        <div className="w-full md:w-auto flex items-center justify-end gap-1 pt-1 md:pt-0 border-t md:border-t-0 border-stone-100">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition cursor-pointer shadow-2xs"
                            title="Preview question in student interactive view"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {onEditQuestion && (
                            <button
                              onClick={() => setEditingQuestion(q)}
                              className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer shadow-2xs"
                              title="Edit question text, answers, type, difficulty, or visual settings"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteQuestion && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete question ${q.id}?`)) {
                                  onDeleteQuestion(q.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer shadow-2xs"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Options Drawer */}
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-1 bg-stone-50/70 border-t border-stone-100 space-y-2">
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = q.correctIndex === optIdx || q.type === 'open_box' || q.type === 'fill_blank';
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                        : 'bg-white border-stone-200 text-stone-700'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600'
                                    }`}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="truncate">{opt || '(No text)'}</span>
                                    {isCorrect && <Check className="w-3 h-3 text-emerald-600 ml-auto shrink-0" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {(q.explanation || q.hint) && (
                            <div className="flex flex-wrap gap-3 text-xs text-stone-600 pt-1">
                              {q.explanation && (
                                <div><strong className="text-stone-700">Explanation:</strong> {q.explanation}</div>
                              )}
                              {q.hint && (
                                <div><strong className="text-amber-700">Hint:</strong> {q.hint}</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 space-y-2">
              <HelpCircle className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="text-sm font-bold text-stone-700">
                {selectedCategory
                  ? (skills.length === 0
                      ? `No skills or questions created yet for category "${selectedCategory.name}".`
                      : `No questions found for "${selectedCategory.name}" (${selectedSkill?.name || 'Selected Skill'}).`)
                  : 'No questions found matching the selected filters.'}
              </div>
              <p className="text-xs text-stone-500">
                {skills.length === 0 && selectedCategory ? (
                  <span>Click <strong className="text-pink-600">"+ Add Skill"</strong> above to define skills under this category, then add questions.</span>
                ) : (
                  <span>Click <strong>"+ Add / Import Questions"</strong> to create questions manually, batch generate drills, or upload Excel/CSV.</span>
                )}
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

      {/* Edit Question Modal */}
      {editingQuestion && (
        <QuestionEditModal
          isOpen={Boolean(editingQuestion)}
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={updated => {
            onEditQuestion?.(updated);
            onSuccessMessage?.(`Updated question ${updated.id} successfully!`);
            setEditingQuestion(null);
          }}
          availableGrades={activeGrades.map(g => g.name)}
          availableSubjects={activeSubjects.map(s => s.name)}
        />
      )}

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

      {/* Category Deletion Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[#10246f] text-base sm:text-lg">Delete Category & Contents?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Grade: <strong>{selectedGrade?.name}</strong> · Subject: <strong>{selectedSubject?.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setCategoryToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-2.5">
              <p className="font-semibold">
                Are you sure you want to permanently delete category <span className="underline font-black text-rose-700">"{categoryToDelete.name}"</span>?
              </p>
              <div className="bg-white rounded-xl p-3 space-y-1.5 text-[11px] text-slate-700 border border-rose-100 shadow-2xs">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>💥 Cascading deletion impact:</span>
                </p>
                <p className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <strong>{categoryDeletionImpact.skills.length}</strong> linked Skill(s)
                  {categoryDeletionImpact.skills.length > 0 && (
                    <span className="text-slate-500 truncate max-w-[200px]">({categoryDeletionImpact.skills.map(s => s.name).join(', ')})</span>
                  )}
                </p>
                <p className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <strong>{categoryDeletionImpact.questions.length}</strong> linked Question(s)
                </p>
              </div>
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                <span>⚠️</span> This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Category & All Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Deletion Confirmation Modal */}
      {skillToDelete && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[#10246f] text-base sm:text-lg">Delete Skill & Questions?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: <strong>{selectedCategory?.name}</strong> · Grade: <strong>{selectedGrade?.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSkillToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-2.5">
              <p className="font-semibold">
                Are you sure you want to permanently delete skill <span className="underline font-black text-rose-700">"{skillToDelete.name}"</span>?
              </p>
              <div className="bg-white rounded-xl p-3 space-y-1.5 text-[11px] text-slate-700 border border-rose-100 shadow-2xs">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>💥 Cascading deletion impact:</span>
                </p>
                <p className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <strong>{skillDeletionImpact.questions.length}</strong> linked Question(s) will be permanently deleted.
                </p>
              </div>
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                <span>⚠️</span> This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSkillToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSkill}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Skill & Questions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. PURGE ALL BANK DATA CONFIRMATION MODAL */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-rose-950 text-lg">Erase All Bank Data?</h3>
                <p className="text-xs text-rose-700 mt-0.5 font-semibold">
                  Complete purge from Supabase database tables & local memory.
                </p>
              </div>
              <button
                onClick={() => !isPurging && setShowPurgeModal(false)}
                disabled={isPurging}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-3">
              <p className="font-semibold text-rose-900 leading-relaxed">
                This will permanently delete all <strong>Questions</strong>, <strong>Categories</strong>, and <strong>Skills</strong> from both:
              </p>
              <ul className="space-y-1.5 pl-2 text-[11px] font-medium text-rose-800">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>Supabase tables: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">questions</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">category_masters</code>, <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-200">skill_masters</code></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>All local browser temporary cache and in-memory master records.</span>
                </li>
              </ul>
              <div className="p-2.5 bg-white rounded-xl border border-rose-200 text-[11px] text-stone-700 font-bold">
                🎯 After this operation, the question bank will be 100% clean and empty (0 categories, 0 skills, 0 questions), allowing you to test dynamic creation and database syncing from scratch.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handleExecutePurgeAll}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition disabled:opacity-60"
              >
                {isPurging ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Erasing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Erase Everything (DB & Local)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
