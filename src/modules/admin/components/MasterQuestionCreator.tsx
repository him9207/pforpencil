import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Question, 
  QuestionType, 
  VisualQuestionConfig, 
  VisualQuestionTemplate, 
  VisualAnimation,
  GradeLevel,
  Subject
} from '../../../types';
import { 
  X, 
  Check, 
  Eye, 
  Trash2, 
  Globe, 
  Plus, 
  Clock, 
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { parseVisualObjectsString } from '../../../utils/visualUtils';
import { 
  CLIPART_REGISTRY, 
  CLIPART_FAMILIES, 
  ClipartCategory, 
  ClipartItem,
  ResolvedClipart,
  getClipartsByCategory, 
  resolveMultipleClipartItems 
} from '../../../data/clipartRegistry';
import { ClipartImage, ClipartText } from '../../../common/ClipartRenderer';
import QuestionPreviewModal from './QuestionPreviewModal';
import { sounds } from '../../../utils/audio';
import { loadCurriculumMaster } from '../../../data/curriculumMasterData';
import { loadQuestionBankMasters, CategoryMasterRecord, SkillMasterRecord } from '../../../data/questionBankMasterData';
import { getNextQuestionId } from '../../../utils/idAndUsernameGenerator';

export interface MasterQuestionCreatorProps {
  question?: Question | null;
  isOpen?: boolean;
  onClose: () => void;
  onSave: (savedQuestion: Question) => void;
  mode?: 'create' | 'edit';
  availableGrades?: string[];
  availableSubjects?: string[];
  initialGrade?: string;
  initialSubject?: string;
  initialCategory?: string;
  initialSkill?: string;
  initialCountryId?: string;
  initialRegionId?: string;
  initialCurriculumId?: string;
  categoryMasters?: CategoryMasterRecord[];
  skillMasters?: SkillMasterRecord[];
  existingQuestions?: Question[];
}

export function normalizeQuestionType(raw?: string): QuestionType {
  if (!raw) return 'single_choice';
  if (raw === 'radio_single') return 'single_choice';
  if (raw === 'open_box') return 'fill_blank';
  if (raw === 'image_mcq') return 'image_choice';
  return raw as QuestionType;
}

export const QUESTION_TYPES_CONFIG: { value: QuestionType; label: string; icon: string; description: string }[] = [
  { value: 'single_choice', label: 'Single Choice (Radio)', icon: '🔘', description: 'Student selects exactly 1 correct answer' },
  { value: 'multiple_choice', label: 'Multiple Choice (MCQ)', icon: '☑️', description: 'Student selects 1 or more correct answers (multi-select)' },
  { value: 'fill_blank', label: 'Fill in the Blank / Open Box', icon: '✍️', description: 'Student types exact number or word answer' },
  { value: 'true_false', label: 'True / False', icon: '⚖️', description: 'Evaluate statement with True / False buttons' },
  { value: 'image_choice', label: 'Image Choice', icon: '🖼️', description: 'Select from visual picture cards' },
  { value: 'select_objects', label: 'Select Objects (Tap to Count)', icon: '🔢', description: 'Interactive objects student taps to reach target count' },
  { value: 'drag_and_drop', label: 'Drag & Drop', icon: '🎯', description: 'Drag item into matching target container' },
  { value: 'match_making', label: 'Match Making (Pairs)', icon: '🔗', description: 'Connect left item with corresponding right item' },
  { value: 'ordering', label: 'Ordering / Sequencing', icon: '📊', description: 'Arrange numbers, steps, or items in order' },
  { value: 'sorting', label: 'Sorting into Buckets', icon: '🧺', description: 'Organize items into categorized buckets' },
  { value: 'clock', label: 'Clock / Time', icon: '⏰', description: 'Read or set time on an analog clock' },
  { value: 'data_graph', label: 'Data / Graph', icon: '📈', description: 'Interpret table, pictogram, or bar chart' },
  { value: 'word_problem', label: 'Word Problem', icon: '📖', description: 'Scenario-based math story problem' },
  { value: 'interactive', label: 'Interactive Manipulative', icon: '✨', description: 'Interactive visual problem solving' }
];

export default function MasterQuestionCreator({
  question,
  isOpen = true,
  onClose,
  onSave,
  mode = 'create',
  availableGrades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Preschool', 'Foundation'],
  availableSubjects = ['Mathematics'],
  initialGrade,
  initialSubject,
  initialCategory,
  initialSkill,
  initialCountryId,
  initialCurriculumId,
  categoryMasters = [],
  skillMasters = [],
  existingQuestions = []
}: MasterQuestionCreatorProps) {
  if (!isOpen) return null;

  const isCreate = mode === 'create' || !question?.id;
  const cm = loadCurriculumMaster();

  // 1. Countries
  const countries = useMemo(() => {
    return cm.countries.filter(c => c.active);
  }, [cm]);

  const [countryId, setCountryId] = useState<string>(() => {
    if (question?.countryId) return question.countryId;
    if (initialCountryId) return initialCountryId;
    return countries[0]?.id || 'CNT-AU';
  });

  // Country Flag Helper
  const getCountryFlag = (cId: string) => {
    if (cId === 'CNT-AU') return '🇦🇺';
    if (cId === 'CNT-US') return '🇺🇸';
    if (cId === 'CNT-IN') return '🇮🇳';
    if (cId === 'CNT-UK') return '🇬🇧';
    if (cId === 'CNT-CA') return '🇨🇦';
    return '🌐';
  };

  // 2. Curricula (filtered by Country)
  const availableCurricula = useMemo(() => {
    const list = cm.curricula.filter(c => c.active && (!countryId || c.countryId === countryId));
    return list.length > 0 ? list : cm.curricula.filter(c => c.active);
  }, [cm, countryId]);

  const [curriculumId, setCurriculumId] = useState<string>(() => {
    if (question?.curriculumId) return question.curriculumId;
    if (initialCurriculumId) return initialCurriculumId;
    return availableCurricula[0]?.id || 'CUR-VCAA20';
  });

  // Keep curriculumId synced if country changes
  useEffect(() => {
    if (!availableCurricula.some(c => c.id === curriculumId)) {
      if (availableCurricula[0]) {
        setCurriculumId(availableCurricula[0].id);
      }
    }
  }, [availableCurricula, curriculumId]);

  const activeCurriculum = useMemo(() => {
    return availableCurricula.find(c => c.id === curriculumId) || availableCurricula[0] || {
      id: 'CUR-GEN',
      name: 'Standard Curriculum',
      countryId: countryId,
      regionId: 'REG-GEN'
    };
  }, [availableCurricula, curriculumId, countryId]);

  // 3. Grade & Subject
  const [grade, setGrade] = useState<string>(() => {
    return question?.grade || initialGrade || availableGrades[0] || 'Grade 1';
  });

  const [subject, setSubject] = useState<string>(() => {
    return question?.subject || initialSubject || availableSubjects[0] || 'Mathematics';
  });

  // 4. Categories (Topic) - Guaranteed rich list
  const defaultMasters = useMemo(() => {
    try {
      return loadQuestionBankMasters();
    } catch {
      return { categories: [], skills: [] };
    }
  }, []);

  const mergedCategories = useMemo(() => {
    const map = new Map<string, CategoryMasterRecord>();
    defaultMasters.categories.forEach(c => map.set(c.id, c));
    categoryMasters.forEach(c => map.set(c.id, c));
    return Array.from(map.values());
  }, [categoryMasters, defaultMasters]);

  const mergedSkills = useMemo(() => {
    const map = new Map<string, SkillMasterRecord>();
    defaultMasters.skills.forEach(s => map.set(s.id, s));
    skillMasters.forEach(s => map.set(s.id, s));
    return Array.from(map.values());
  }, [skillMasters, defaultMasters]);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  const categoryOptions = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();

    // Add standard categories
    const standards = [
      'Numbers & Quantities',
      'Addition & Subtraction',
      'Counting & Cardinality',
      'Geometry & Shapes',
      'Measurement & Time',
      'Fractions & Decimals',
      'Operations & Algebraic Thinking',
      'Data & Graphs',
      'Word Problems',
      'Comparison & Sorting'
    ];

    standards.forEach(name => {
      seen.add(name.toLowerCase());
      list.push({ id: `CAT-${name.replace(/[^a-zA-Z0-9]/g, '')}`, name });
    });

    // Merge from masters
    mergedCategories.forEach(c => {
      if (!seen.has(c.name.toLowerCase())) {
        seen.add(c.name.toLowerCase());
        list.push({ id: c.id, name: c.name });
      }
    });

    if (question?.category && !seen.has(question.category.toLowerCase())) {
      list.unshift({ id: question.categoryId || 'CAT-Q', name: question.category });
    }

    return list;
  }, [mergedCategories, question?.category, question?.categoryId]);

  const [categoryId, setCategoryId] = useState<string>(() => {
    return question?.categoryId || categoryOptions[0]?.id || 'CAT-NumbersQuantities';
  });

  const selectedCategory = useMemo(() => {
    if (isCustomCategory) {
      return { id: 'CAT-CUSTOM', name: customCategoryText.trim() || 'Custom Topic' };
    }
    return categoryOptions.find(c => c.id === categoryId) || categoryOptions[0];
  }, [isCustomCategory, customCategoryText, categoryOptions, categoryId]);

  // 5. Skills
  const [isCustomSkill, setIsCustomSkill] = useState(false);
  const [customSkillText, setCustomSkillText] = useState('');

  const skillOptions = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();

    const matches = mergedSkills.filter(s => s.categoryId === selectedCategory.id);
    matches.forEach(s => {
      seen.add(s.name.toLowerCase());
      list.push({ id: s.id, name: s.name });
    });

    if (list.length === 0) {
      const defaultSkillNames = [
        `Core ${selectedCategory.name} Practice`,
        `Interactive ${selectedCategory.name} Drill`,
        `Applied ${selectedCategory.name} Challenges`
      ];
      defaultSkillNames.forEach((name, idx) => {
        list.push({ id: `SK-${selectedCategory.id}-${idx + 1}`, name });
      });
    }

    if (question?.skill && !seen.has(question.skill.toLowerCase())) {
      list.unshift({ id: question.skillId || 'SK-Q', name: question.skill });
    }

    return list;
  }, [mergedSkills, selectedCategory, question?.skill, question?.skillId]);

  const [skillId, setSkillId] = useState<string>(() => {
    return question?.skillId || skillOptions[0]?.id || '';
  });

  const selectedSkill = useMemo(() => {
    if (isCustomSkill) {
      return { id: 'SK-CUSTOM', name: customSkillText.trim() || 'Custom Skill' };
    }
    return skillOptions.find(s => s.id === skillId) || skillOptions[0] || { id: 'SK-1', name: 'Core Foundation Drill' };
  }, [isCustomSkill, customSkillText, skillOptions, skillId]);

  // 6. Question Type
  const normalizedInitialType: QuestionType = useMemo(() => {
    return normalizeQuestionType(question?.type);
  }, [question?.type]);

  const [type, setType] = useState<QuestionType>(normalizedInitialType);

  // 7. Question Prompt
  const [prompt, setPrompt] = useState(question?.prompt || '');
  const questionInputRef = useRef<HTMLTextAreaElement>(null);

  // 8. Shared Clipart Directory State
  const [clipartCategory, setClipartCategory] = useState<ClipartCategory>('fruits');
  const [isClipartDirectoryOpen, setIsClipartDirectoryOpen] = useState(true);
  const [clipartCopiedToast, setClipartCopiedToast] = useState<string>('');

  const currentCategoryCliparts = useMemo(() => {
    return getClipartsByCategory(clipartCategory);
  }, [clipartCategory]);

  // Active input tracking for direct insertion
  const [activeInputTarget, setActiveInputTarget] = useState<'prompt' | 'visualText' | number>('prompt');

  // Insert clipart tag into active field
  const handleInsertClipartTag = (tag: string) => {
    if (activeInputTarget === 'prompt') {
      setPrompt(prev => prev ? `${prev} ${tag}` : tag);
    } else if (activeInputTarget === 'visualText') {
      setVisualText(prev => prev ? `${prev} ${tag}` : tag);
    } else if (typeof activeInputTarget === 'number') {
      const next = [...options];
      next[activeInputTarget] = next[activeInputTarget] ? `${next[activeInputTarget]} ${tag}` : tag;
      setOptions(next);
    }

    setClipartCopiedToast(`Inserted ${tag}`);
    setTimeout(() => setClipartCopiedToast(''), 2000);
  };

  // 9. Answers State (Dynamically adapting to type)
  const [options, setOptions] = useState<string[]>(
    question?.options && question.options.length ? [...question.options] : ['', '', '', '']
  );
  const [correctIndex, setCorrectIndex] = useState<number>(question?.correctIndex ?? 0);
  const [correctIndices, setCorrectIndices] = useState<number[]>(() => {
    if (question?.correctIndices && question.correctIndices.length > 0) {
      return question.correctIndices;
    }
    return [question?.correctIndex ?? 0];
  });
  const [openAnswer, setOpenAnswer] = useState<string>(question?.openBoxAnswer || '');

  const toggleCorrectIndex = (idx: number) => {
    setCorrectIndices(prev => {
      const next = prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx];
      if (next.length === 0) return [idx];
      setCorrectIndex(next[0]);
      return next;
    });
  };

  const handleTypeChange = (nextType: QuestionType) => {
    setType(nextType);
    if (nextType === 'true_false') {
      setOptions(['True', 'False']);
      setCorrectIndex(0);
      setCorrectIndices([0]);
    } else if (nextType === 'single_choice' || nextType === 'multiple_choice' || nextType === 'image_choice') {
      // If previous options were True/False or fill-in single answer, initialize clean 4 choices
      if (options.length < 2 || options.includes('True') || options.includes('False') || (options.length === 1 && options[0] === openAnswer)) {
        setOptions(['', '', '', '']);
        setCorrectIndex(0);
        setCorrectIndices([0]);
      } else {
        const next = [...options];
        while (next.length < 4) next.push('');
        setOptions(next);
      }
    } else if (nextType === 'fill_blank') {
      setOptions([openAnswer || '']);
      setCorrectIndex(0);
      setCorrectIndices([0]);
    } else if (nextType === 'select_objects') {
      setOptions([String(selectObjectsGoal || 4)]);
      setCorrectIndex(0);
      setCorrectIndices([0]);
    }
  };

  const isSingleChoice = type === 'single_choice' || type === 'radio_single';
  const isMultipleChoice = type === 'multiple_choice';

  // Specific question type states
  const [selectObjectsGoal, setSelectObjectsGoal] = useState<number>(
    Number(question?.openBoxAnswer || question?.options?.[0]) || 4
  );

  const [dragItems, setDragItems] = useState<{ item: string; target: string }[]>(
    question?.dragItems && question.dragItems.length
      ? [...question.dragItems]
      : []
  );

  const [matchPairs, setMatchPairs] = useState<{ left: string; right: string }[]>(
    question?.matchPairs && question.matchPairs.length
      ? [...question.matchPairs]
      : []
  );

  const [orderSequence, setOrderSequence] = useState<string[]>(
    question?.orderSequence && question.orderSequence.length
      ? [...question.orderSequence]
      : []
  );

  const [sortBuckets, setSortBuckets] = useState<{ bucketName: string; items: string[] }[]>(
    question?.sortBuckets && question.sortBuckets.length
      ? [...question.sortBuckets]
      : []
  );

  const [clockHour, setClockHour] = useState<number>(3);
  const [clockMinute, setClockMinute] = useState<number>(0);

  // Sync state if question prop changes
  useEffect(() => {
    if (question) {
      const normType = normalizeQuestionType(question.type);
      setType(normType);
      setPrompt(question.prompt || '');
      setOptions(question.options && question.options.length ? [...question.options] : ['', '', '', '']);
      setCorrectIndex(question.correctIndex ?? 0);
      setCorrectIndices(question.correctIndices && question.correctIndices.length ? [...question.correctIndices] : [question.correctIndex ?? 0]);
      setOpenAnswer(question.openBoxAnswer || '');
      setExplanation(question.explanation || '');
      setHint(question.hint || '');
      setPoints(question.points || 20);
      setDifficulty(question.difficulty || 'Easy');
      setStatus((question.status as 'Draft' | 'Published') || 'Published');
      setHasVisual(Boolean(question.visualConfig?.enabled || question.visualClipart));
      setVisualText(question.visualConfig?.visualInstructions || '');
      setVisualClipartString(question.visualClipart || '');
      if (question.dragItems) setDragItems([...question.dragItems]);
      if (question.matchPairs) setMatchPairs([...question.matchPairs]);
      if (question.orderSequence) setOrderSequence([...question.orderSequence]);
      if (question.sortBuckets) setSortBuckets([...question.sortBuckets]);
    }
  }, [question]);

  // 10. Visual Representation Checkbox & Details
  const initialHasVisual = Boolean(question?.visualConfig?.enabled || question?.visualClipart);
  const [hasVisual, setHasVisual] = useState<boolean>(initialHasVisual);
  const [visualText, setVisualText] = useState<string>(
    question?.visualConfig?.visualInstructions || ''
  );
  const [visualClipartString, setVisualClipartString] = useState<string>(
    question?.visualClipart || ''
  );
  const [visualAnimation, setVisualAnimation] = useState<VisualAnimation>(
    question?.visualConfig?.animation || 'bounce'
  );

  // Attached clipart items in visual tray
  const visualChips = useMemo(() => {
    if (!visualClipartString.trim()) return [];
    const items = resolveMultipleClipartItems(visualClipartString);
    const map = new Map<string, { key: string; name: string; clipart: ResolvedClipart; count: number; raw: string }>();
    items.forEach(it => {
      const key = it.fallbackSrc || it.src || it.id.split('-')[0];
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          key,
          name: it.alt || 'Clipart',
          clipart: it,
          count: 1,
          raw: it.fallbackSrc || it.src
        });
      }
    });
    return Array.from(map.values());
  }, [visualClipartString]);

  const handleAddVisualClipart = (rawOrTag: string) => {
    const currentTokens = visualClipartString.trim() 
      ? visualClipartString.split(/[,|]/).map(s => s.trim()).filter(Boolean) 
      : [];
    currentTokens.push(rawOrTag);
    setVisualClipartString(currentTokens.join(', '));
    setHasVisual(true);
  };

  const handleUpdateChipCount = (rawKey: string, delta: number) => {
    const items = resolveMultipleClipartItems(visualClipartString);
    const matchIdx = items.findIndex(it => (it.fallbackSrc || it.src || it.id.split('-')[0]) === rawKey || it.alt === rawKey);
    if (delta < 0 && matchIdx !== -1) {
      items.splice(matchIdx, 1);
    } else if (delta > 0 && matchIdx !== -1) {
      items.push({ ...items[matchIdx], id: `${items[matchIdx].id}-copy` });
    }
    setVisualClipartString(items.map(it => it.fallbackSrc || it.src).join(', '));
  };

  const handleRemoveChip = (rawKey: string) => {
    const items = resolveMultipleClipartItems(visualClipartString);
    const filtered = items.filter(it => (it.fallbackSrc || it.src || it.id.split('-')[0]) !== rawKey && it.alt !== rawKey);
    setVisualClipartString(filtered.map(it => it.fallbackSrc || it.src).join(', '));
  };

  // 11. Difficulty, Points & Status
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(question?.difficulty || 'Easy');
  const [points, setPoints] = useState<number>(question?.points || 20);
  const [status, setStatus] = useState<'Draft' | 'Published'>(
    question?.status === 'Published' ? 'Published' : 'Draft'
  );
  const [hint, setHint] = useState<string>(question?.hint || '');
  const [explanation, setExplanation] = useState<string>(question?.explanation || '');

  // 12. Preview & Validation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generatedId = useMemo(() => {
    if (question?.id) return question.id;
    return getNextQuestionId(grade as GradeLevel, existingQuestions, 0, subject as Subject);
  }, [question?.id, grade, subject, existingQuestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setErrorMessage('Please enter the question text before saving.');
      return;
    }

    let finalOptions = options.map(o => o.trim()).filter(Boolean);
    if (finalOptions.length === 0) finalOptions = ['Option 1', 'Option 2'];
    let finalCorrectIndex = correctIndex;
    let finalOpenAnswer: string | undefined = undefined;

    if (type === 'fill_blank' || type === 'open_box') {
      finalOptions = [openAnswer.trim() || 'Answer'];
      finalCorrectIndex = 0;
      finalOpenAnswer = openAnswer.trim();
    } else if (type === 'true_false') {
      finalOptions = ['True', 'False'];
      finalCorrectIndex = correctIndex === 1 ? 1 : 0;
    } else if (type === 'select_objects') {
      finalOptions = [String(selectObjectsGoal)];
      finalCorrectIndex = 0;
      finalOpenAnswer = String(selectObjectsGoal);
    } else if (type === 'match_making') {
      finalOptions = matchPairs.map(p => `${p.left.trim()} -> ${p.right.trim()}`);
      finalCorrectIndex = 0;
    } else if (type === 'drag_and_drop') {
      finalOptions = dragItems.map(d => `${d.item.trim()} -> ${d.target.trim()}`);
      finalCorrectIndex = 0;
    } else if (type === 'ordering') {
      finalOptions = orderSequence.map(s => s.trim());
      finalCorrectIndex = 0;
    } else if (type === 'sorting') {
      finalOptions = sortBuckets.map(b => `${b.bucketName}: ${b.items.join(', ')}`);
      finalCorrectIndex = 0;
    } else if (type === 'clock') {
      const formatted = `${String(clockHour).padStart(2, '0')}:${String(clockMinute).padStart(2, '0')}`;
      finalOpenAnswer = formatted;
      finalOptions = [formatted, '12:00', '06:30', '09:15'];
      finalCorrectIndex = 0;
    }

    let visualConfig: VisualQuestionConfig | undefined = undefined;
    if (hasVisual) {
      visualConfig = {
        enabled: true,
        template: type === 'select_objects' ? 'picture_counting' : 'picture_choice',
        animation: visualAnimation,
        interaction: 'tap',
        visualInstructions: visualText.trim() || undefined,
        background: 'playful',
        autoPlay: true,
        objects: visualClipartString.trim() ? parseVisualObjectsString(visualClipartString) : undefined
      };
    }

    const saved: Question = {
      ...(question || {}),
      id: generatedId,
      prompt: prompt.trim(),
      difficulty,
      type,
      options: finalOptions,
      correctIndex: finalCorrectIndex,
      correctIndices: isMultipleChoice ? correctIndices : [finalCorrectIndex],
      openBoxAnswer: finalOpenAnswer,
      matchPairs: type === 'match_making' ? matchPairs : undefined,
      dragItems: type === 'drag_and_drop' ? dragItems : undefined,
      orderSequence: type === 'ordering' ? orderSequence : undefined,
      sortBuckets: type === 'sorting' ? sortBuckets : undefined,
      explanation: explanation.trim(),
      hint: hint.trim(),
      points: Number(points) || 20,
      status,
      grade: grade as GradeLevel,
      subject: subject as Subject,
      category: selectedCategory.name,
      skill: selectedSkill.name,
      categoryId: selectedCategory.id,
      skillId: selectedSkill.id,
      curriculumId: activeCurriculum.id,
      curriculum: activeCurriculum.name,
      countryId: countryId,
      visualClipart: hasVisual && visualClipartString.trim() ? visualClipartString.trim() : undefined,
      visualConfig
    };

    onSave(saved);
    sounds.success();
    onClose();
  };

  const previewDraft: Question = useMemo(() => {
    let finalOptions = options.map(o => o.trim()).filter(Boolean);
    let finalCorrectIndex = correctIndex;
    let finalOpenAnswer: string | undefined = undefined;

    if (type === 'fill_blank' || type === 'open_box') {
      finalOptions = [openAnswer.trim() || ''];
      finalCorrectIndex = 0;
      finalOpenAnswer = openAnswer.trim();
    } else if (type === 'true_false') {
      finalOptions = ['True', 'False'];
      finalCorrectIndex = correctIndex === 1 ? 1 : 0;
    } else if (type === 'select_objects') {
      finalOptions = [String(selectObjectsGoal || 4)];
      finalCorrectIndex = 0;
      finalOpenAnswer = String(selectObjectsGoal || 4);
    } else if (type === 'match_making') {
      finalOptions = matchPairs.map(p => `${p.left.trim()} -> ${p.right.trim()}`);
      finalCorrectIndex = 0;
    } else if (type === 'drag_and_drop') {
      finalOptions = dragItems.map(d => `${d.item.trim()} -> ${d.target.trim()}`);
      finalCorrectIndex = 0;
    } else if (type === 'ordering') {
      finalOptions = orderSequence.map(s => s.trim());
      finalCorrectIndex = 0;
    } else if (type === 'sorting') {
      finalOptions = sortBuckets.map(b => `${b.bucketName}: ${b.items.join(', ')}`);
      finalCorrectIndex = 0;
    } else if (type === 'clock') {
      const formatted = `${String(clockHour).padStart(2, '0')}:${String(clockMinute).padStart(2, '0')}`;
      finalOpenAnswer = formatted;
      finalOptions = [formatted, '12:00', '06:30', '09:15'];
      finalCorrectIndex = 0;
    } else {
      if (finalOptions.length < 2) {
        finalOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
    }

    return {
      ...(question || {}),
      id: generatedId,
      prompt: prompt.trim() || 'Question preview...',
      difficulty,
      type,
      options: finalOptions,
      correctIndex: finalCorrectIndex,
      correctIndices: isMultipleChoice ? correctIndices : [finalCorrectIndex],
      openBoxAnswer: finalOpenAnswer,
      matchPairs: type === 'match_making' ? matchPairs : undefined,
      dragItems: type === 'drag_and_drop' ? dragItems : undefined,
      orderSequence: type === 'ordering' ? orderSequence : undefined,
      sortBuckets: type === 'sorting' ? sortBuckets : undefined,
      explanation: explanation.trim(),
      hint: hint.trim(),
      points: Number(points) || 20,
      status,
      grade: grade as GradeLevel,
      subject: subject as Subject,
      category: selectedCategory.name,
      skill: selectedSkill.name,
      categoryId: selectedCategory.id,
      skillId: selectedSkill.id,
      curriculumId: activeCurriculum.id,
      curriculum: activeCurriculum.name,
      countryId: countryId,
      visualClipart: hasVisual && visualClipartString.trim() ? visualClipartString.trim() : undefined,
      visualConfig: hasVisual ? {
        enabled: true,
        template: type === 'select_objects' ? 'picture_counting' : 'picture_choice',
        animation: visualAnimation,
        interaction: 'tap',
        visualInstructions: visualText.trim() || undefined,
        background: 'playful',
        autoPlay: true,
        objects: visualClipartString.trim() ? parseVisualObjectsString(visualClipartString) : undefined
      } : undefined
    };
  }, [
    question, generatedId, prompt, difficulty, type, options, correctIndex, correctIndices,
    isMultipleChoice, openAnswer, matchPairs, dragItems, orderSequence, sortBuckets,
    explanation, hint, points, status, grade, subject, selectedCategory, selectedSkill,
    activeCurriculum, countryId, hasVisual, visualClipartString, visualAnimation, visualText,
    selectObjectsGoal, clockHour, clockMinute
  ]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-2 sm:p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
          
          {/* TOP BAR / TITLE */}
          <div className="bg-gradient-to-r from-stone-900 via-[#10246f] to-stone-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                isCreate ? 'bg-amber-400 text-stone-950' : 'bg-blue-400 text-stone-950'
              }`}>
                {isCreate ? '✨ Create New Question' : `✏️ Edit #${generatedId}`}
              </span>
              <span className="text-xs font-bold text-stone-300 hidden sm:inline">
                Standard Question & Answer Creator
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>Live Student Preview</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN SCROLLABLE FORM */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs text-stone-800">
            
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. HEADER -> COMPLETE GRID (Country / Curriculum / Grade / Category / Skill) */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-stone-900 text-xs uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Academic Hierarchy Grid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-500">Difficulty:</span>
                  {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer ${
                        difficulty === d
                          ? d === 'Easy'
                            ? 'bg-emerald-600 text-white'
                            : d === 'Medium'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                          : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                
                {/* 1. Country */}
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-1">Country</label>
                  <select
                    value={countryId}
                    onChange={e => setCountryId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#10246f]"
                  >
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>
                        {getCountryFlag(c.id)} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Curriculum */}
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-1">Curriculum</label>
                  <select
                    value={curriculumId}
                    onChange={e => setCurriculumId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#10246f]"
                  >
                    {availableCurricula.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Grade */}
                <div>
                  <label className="text-[10px] font-bold text-stone-500 block mb-1">Grade</label>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#10246f]"
                  >
                    {availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Category / Topic */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-stone-500">Category (Topic)</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-[9px] text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      {isCustomCategory ? 'List' : '+ Custom'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      value={customCategoryText}
                      onChange={e => setCustomCategoryText(e.target.value)}
                      placeholder="Type custom topic..."
                      className="w-full p-2 rounded-xl border border-blue-300 bg-blue-50/40 text-xs font-semibold focus:ring-2 focus:ring-blue-600"
                    />
                  ) : (
                    <select
                      value={selectedCategory.id}
                      onChange={e => setCategoryId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#10246f]"
                    >
                      {categoryOptions.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 5. Skill */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-stone-500">Target Skill</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSkill(!isCustomSkill)}
                      className="text-[9px] text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      {isCustomSkill ? 'List' : '+ Custom'}
                    </button>
                  </div>
                  {isCustomSkill ? (
                    <input
                      value={customSkillText}
                      onChange={e => setCustomSkillText(e.target.value)}
                      placeholder="Type custom skill..."
                      className="w-full p-2 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-semibold focus:ring-2 focus:ring-emerald-600"
                    />
                  ) : (
                    <select
                      value={selectedSkill.id}
                      onChange={e => setSkillId(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#10246f]"
                    >
                      {skillOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* 2. QUESTION TYPE DROPDOWN */}
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-black text-stone-900 text-xs uppercase tracking-wider">
                  Question Type:
                </span>
                <select
                  value={type}
                  onChange={e => handleTypeChange(e.target.value as QuestionType)}
                  className="p-2 rounded-xl border border-blue-300 bg-blue-50/60 font-black text-xs text-[#10246f] focus:ring-2 focus:ring-[#10246f] cursor-pointer"
                >
                  {QUESTION_TYPES_CONFIG.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-stone-500 font-semibold italic">
                {QUESTION_TYPES_CONFIG.find(t => t.value === type)?.description}
              </div>
            </div>

            {/* 3. QUESTION PROMPT */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="font-black text-stone-900 text-xs uppercase tracking-wider">
                  Question Prompt (Student-Facing Text):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-500 font-bold">Reward Points:</span>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    step={5}
                    value={points}
                    onChange={e => setPoints(Number(e.target.value) || 20)}
                    className="w-14 p-1 rounded-lg border border-stone-200 text-center font-bold text-xs"
                  />
                </div>
              </div>

              <textarea
                ref={questionInputRef}
                required
                rows={2}
                value={prompt}
                onFocus={() => setActiveInputTarget('prompt')}
                onChange={e => {
                  setPrompt(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Type the question prompt here (e.g. 'How many apples are on the table?' or 'What is 15 + 7?'). You can click any clipart from the directory below to insert into the question!"
                className="w-full p-3 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-[#10246f] outline-none"
              />

              {/* Prompt live preview with rendered clipart */}
              {prompt.trim() && (
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2 text-xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider shrink-0">Live Preview:</span>
                  <div className="font-bold text-stone-800 flex-1">
                    <ClipartText text={prompt} imageSize="xs" />
                  </div>
                </div>
              )}
            </div>

            {/* 4. CENTRALIZED CLIPART DIRECTORY (Used for Question & Answers) */}
            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 overflow-hidden shadow-2xs">
              {/* Directory Header with Toggle */}
              <div 
                onClick={() => setIsClipartDirectoryOpen(!isClipartDirectoryOpen)}
                className="p-3 bg-amber-100/70 flex items-center justify-between cursor-pointer select-none border-b border-amber-200/80"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <div>
                    <span className="font-black text-amber-950 text-xs">
                      Universal Clipart Directory ({CLIPART_REGISTRY.length} Vector Items)
                    </span>
                    <span className="text-[10px] text-amber-800 ml-2 hidden sm:inline">
                      Click any clipart below to insert into your Question or Answer
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {clipartCopiedToast && (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                      ✓ {clipartCopiedToast}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-amber-900">
                    {isClipartDirectoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {isClipartDirectoryOpen && (
                <div className="p-3.5 space-y-3">
                  
                  {/* Family Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {CLIPART_FAMILIES.map(fam => {
                      const isActive = fam.id === clipartCategory;
                      return (
                        <button
                          key={fam.id}
                          type="button"
                          onClick={() => setClipartCategory(fam.id)}
                          className={`px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-amber-500 text-stone-950 shadow-xs ring-2 ring-amber-300'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-100/60'
                          }`}
                        >
                          <span>{fam.icon}</span>
                          <span>{fam.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Clipart Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2 max-h-48 overflow-y-auto p-1">
                    {currentCategoryCliparts.map(item => {
                      const tag = `[${item.keywords[0] || item.id}]`;
                      return (
                        <div
                          key={item.id}
                          className="p-1.5 rounded-xl bg-white border border-stone-200 hover:border-amber-400 hover:bg-amber-50/70 transition flex flex-col items-center justify-between group shadow-2xs"
                        >
                          <div className="w-8 h-8 flex items-center justify-center p-0.5">
                            <ClipartImage clipart={item} size="sm" />
                          </div>
                          <span className="text-[10px] font-extrabold text-stone-700 truncate w-full text-center mt-1">
                            {item.name}
                          </span>
                          
                          {/* Quick 1-click Insert Actions */}
                          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-stone-100 w-full justify-center">
                            <button
                              type="button"
                              onClick={() => handleInsertClipartTag(tag)}
                              className="px-1 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-[9px] cursor-pointer"
                              title={`Insert ${tag} into active field`}
                            >
                              + Insert
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddVisualClipart(tag);
                                setClipartCopiedToast(`Added ${tag} to Visual`);
                                setTimeout(() => setClipartCopiedToast(''), 2000);
                              }}
                              className="px-1 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 font-black text-[9px] cursor-pointer"
                              title="Add to Visual Representation"
                            >
                              + Visual
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Insertion Target Switcher */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/80 flex-wrap gap-2">
                    <span className="font-bold text-amber-900">Current Insertion Target:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveInputTarget('prompt')}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                          activeInputTarget === 'prompt' ? 'bg-[#10246f] text-white' : 'bg-white text-stone-700 border border-stone-200'
                        }`}
                      >
                        Question Prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveInputTarget('visualText')}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                          activeInputTarget === 'visualText' ? 'bg-[#10246f] text-white' : 'bg-white text-stone-700 border border-stone-200'
                        }`}
                      >
                        Visual Text
                      </button>
                      {options.slice(0, 4).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveInputTarget(idx)}
                          className={`px-2 py-0.5 rounded-lg font-bold text-[10px] cursor-pointer ${
                            activeInputTarget === idx ? 'bg-[#10246f] text-white' : 'bg-white text-stone-700 border border-stone-200'
                          }`}
                        >
                          Option {String.fromCharCode(65 + idx)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. DYNAMIC ANSWER LAYOUT (Changes dynamically based on Question Type) */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="font-black text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>✅</span> Answer Layout & Configuration
                </label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Mode: {QUESTION_TYPES_CONFIG.find(t => t.value === type)?.label || 'Single Choice (Radio)'}
                </span>
              </div>

              {/* 5A. Single Choice & Multiple Choice Layout */}
              {(isSingleChoice || isMultipleChoice || type === 'word_problem' || type === 'interactive' || type === 'image_choice') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-stone-600 font-semibold">
                      {isMultipleChoice 
                        ? '☑️ Multi-Select: Click checkbox squares to designate 1 or more correct answers:' 
                        : '🔘 Single Choice: Click the round button to designate the 1 correct answer:'}
                    </p>
                    {options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setOptions(prev => [...prev, ''])}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {options.map((opt, idx) => {
                      const isCorrect = isMultipleChoice
                        ? correctIndices.includes(idx)
                        : correctIndex === idx;
                      const letter = String.fromCharCode(65 + idx);

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border transition flex flex-col justify-between space-y-2 ${
                            isCorrect
                              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200'
                              : 'bg-stone-50/70 border-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isMultipleChoice) {
                                  toggleCorrectIndex(idx);
                                } else {
                                  setCorrectIndex(idx);
                                  setCorrectIndices([idx]);
                                }
                              }}
                              className={`w-7 h-7 flex items-center justify-center font-black text-xs transition cursor-pointer shrink-0 ${
                                isMultipleChoice ? 'rounded-lg' : 'rounded-full'
                              } ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white text-stone-600 border border-stone-300 hover:bg-emerald-50'
                              }`}
                              title={isCorrect ? 'Marked Correct (click to change)' : 'Click to mark as correct'}
                            >
                              {isCorrect ? <Check className="w-4 h-4" /> : letter}
                            </button>

                            <input
                              value={opt}
                              onFocus={() => setActiveInputTarget(idx)}
                              onChange={e => {
                                const next = [...options];
                                next[idx] = e.target.value;
                                setOptions(next);
                              }}
                              placeholder={`Option ${letter} answer text or [clipart]...`}
                              className="flex-1 p-2 rounded-xl border border-stone-200 bg-white font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            />

                            {options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = options.filter((_, i) => i !== idx);
                                  setOptions(next);
                                  if (correctIndex === idx) setCorrectIndex(0);
                                  setCorrectIndices(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
                                }}
                                className="w-6 h-6 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs font-bold cursor-pointer"
                                title="Remove this option"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Live render for this option */}
                          {opt.trim() && (
                            <div className="pl-9 text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                              <span className="text-[9px] text-stone-400 uppercase">Preview:</span>
                              <ClipartText text={opt} imageSize="xs" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5B. Fill in the Blank / Open Box */}
              {(type === 'fill_blank' || type === 'open_box') && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <label className="font-extrabold text-xs text-stone-900 block">
                    Expected Correct Student Answer:
                  </label>
                  <input
                    required
                    value={openAnswer}
                    onChange={e => setOpenAnswer(e.target.value)}
                    placeholder="e.g. 15 or 8 apples or Triangle"
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-sm font-black text-amber-950 focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-stone-500">
                    The student will type this exact value into an interactive keypad or input box.
                  </p>
                </div>
              )}

              {/* 5C. True / False */}
              {type === 'true_false' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'True', index: 0, color: 'emerald' },
                    { label: 'False', index: 1, color: 'rose' }
                  ].map(tf => {
                    const isSelected = correctIndex === tf.index;
                    return (
                      <button
                        key={tf.label}
                        type="button"
                        onClick={() => {
                          setCorrectIndex(tf.index);
                          setOptions(['True', 'False']);
                        }}
                        className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                          isSelected
                            ? tf.color === 'emerald'
                              ? 'bg-emerald-500 text-white font-black shadow-md border-emerald-600 ring-2 ring-emerald-300'
                              : 'bg-rose-500 text-white font-black shadow-md border-rose-600 ring-2 ring-rose-300'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <p className="text-base font-black">{tf.label}</p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/90' : 'text-stone-400'}`}>
                          {isSelected ? '✓ Correct Answer' : 'Click to select as correct'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 5D. Select Objects (Tap to Count) */}
              {type === 'select_objects' && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-xs text-stone-900">Target Count to Reach</p>
                    <p className="text-[10px] text-stone-500">How many objects the student must tap to complete the answer.</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={selectObjectsGoal}
                    onChange={e => setSelectObjectsGoal(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 p-2 rounded-xl border border-stone-200 text-center font-black text-sm bg-white text-stone-900"
                  />
                </div>
              )}

              {/* 5E. Drag & Drop */}
              {type === 'drag_and_drop' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-700">Draggable Items ➔ Target Zones</span>
                    <button
                      type="button"
                      onClick={() => setDragItems(prev => [...prev, { item: 'Item', target: 'Target' }])}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-black text-[10px] hover:bg-blue-100"
                    >
                      + Add Pair
                    </button>
                  </div>
                  {dragItems.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={d.item}
                        onChange={e => {
                          const next = [...dragItems];
                          next[i].item = e.target.value;
                          setDragItems(next);
                        }}
                        placeholder="Draggable item (e.g. 🍎 Apple)"
                        className="flex-1 p-2 rounded-xl border border-stone-200 text-xs font-bold"
                      />
                      <span className="text-stone-400 font-black">➔</span>
                      <input
                        value={d.target}
                        onChange={e => {
                          const next = [...dragItems];
                          next[i].target = e.target.value;
                          setDragItems(next);
                        }}
                        placeholder="Target container (e.g. 🧺 Basket)"
                        className="flex-1 p-2 rounded-xl border border-stone-200 text-xs font-bold"
                      />
                      {dragItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDragItems(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 5F. Match Making */}
              {type === 'match_making' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-700">Left Item ➔ Right Matching Item</span>
                    <button
                      type="button"
                      onClick={() => setMatchPairs(prev => [...prev, { left: 'Left', right: 'Right' }])}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-black text-[10px] hover:bg-purple-100"
                    >
                      + Add Pair
                    </button>
                  </div>
                  {matchPairs.map((pair, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={pair.left}
                        onChange={e => {
                          const next = [...matchPairs];
                          next[i].left = e.target.value;
                          setMatchPairs(next);
                        }}
                        placeholder="Left prompt (e.g. 5 + 5)"
                        className="flex-1 p-2 rounded-xl border border-stone-200 text-xs font-bold"
                      />
                      <span className="text-stone-400 font-black">➔</span>
                      <input
                        value={pair.right}
                        onChange={e => {
                          const next = [...matchPairs];
                          next[i].right = e.target.value;
                          setMatchPairs(next);
                        }}
                        placeholder="Right match (e.g. 10)"
                        className="flex-1 p-2 rounded-xl border border-stone-200 text-xs font-bold"
                      />
                      {matchPairs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMatchPairs(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 5G. Ordering */}
              {type === 'ordering' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-700">Correct Sequence</span>
                    <button
                      type="button"
                      onClick={() => setOrderSequence(prev => [...prev, `Step ${prev.length + 1}`])}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-[10px] hover:bg-emerald-100"
                    >
                      + Add Step
                    </button>
                  </div>
                  {orderSequence.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 text-center font-black text-stone-400">#{i + 1}</span>
                      <input
                        value={item}
                        onChange={e => {
                          const next = [...orderSequence];
                          next[i] = e.target.value;
                          setOrderSequence(next);
                        }}
                        className="flex-1 p-2 rounded-xl border border-stone-200 text-xs font-bold"
                      />
                      {orderSequence.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOrderSequence(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 5H. Sorting */}
              {type === 'sorting' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-700">Buckets & Assigned Items</span>
                    <button
                      type="button"
                      onClick={() => setSortBuckets(prev => [...prev, { bucketName: 'New Bucket', items: ['Item 1'] }])}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-black text-[10px] hover:bg-teal-100"
                    >
                      + Add Bucket
                    </button>
                  </div>
                  {sortBuckets.map((bucket, bIdx) => (
                    <div key={bIdx} className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={bucket.bucketName}
                          onChange={e => {
                            const next = [...sortBuckets];
                            next[bIdx].bucketName = e.target.value;
                            setSortBuckets(next);
                          }}
                          placeholder="Bucket name (e.g. 🧺 Fruit Basket)"
                          className="flex-1 p-1.5 rounded-lg border border-stone-200 bg-white font-bold text-xs"
                        />
                        {sortBuckets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSortBuckets(prev => prev.filter((_, idx) => idx !== bIdx))}
                            className="text-stone-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <input
                        value={bucket.items.join(', ')}
                        onChange={e => {
                          const next = [...sortBuckets];
                          next[bIdx].items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setSortBuckets(next);
                        }}
                        placeholder="Comma-separated items (e.g. 🍎 Apple, 🍌 Banana)"
                        className="w-full p-1.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 5I. Clock / Time */}
              {type === 'clock' && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-1">Hour (1 - 12)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={clockHour}
                      onChange={e => setClockHour(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
                      className="w-20 p-2 rounded-xl border border-stone-200 text-center font-black text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 block mb-1">Minute (0 - 55)</label>
                    <input
                      type="number"
                      min={0}
                      max={55}
                      step={5}
                      value={clockMinute}
                      onChange={e => setClockMinute(Math.min(55, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-20 p-2 rounded-xl border border-stone-200 text-center font-black text-sm bg-white"
                    />
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl border border-amber-300 text-center font-mono font-black text-base text-amber-950">
                    ⏰ {String(clockHour).padStart(2, '0')}:{String(clockMinute).padStart(2, '0')}
                  </div>
                </div>
              )}
            </div>

            {/* 6. VISUAL REPRESENTATION (Checkbox -> Visual Text -> Clipart Single/Multi) */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-black text-stone-900 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasVisual}
                    onChange={e => setHasVisual(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable Visual Representation (Visual Layer)</span>
                </label>
                <span className="text-[10px] text-stone-400 font-semibold">
                  {hasVisual ? 'Active' : 'Optional visual display'}
                </span>
              </div>

              {hasVisual && (
                <div className="space-y-3 pt-2 border-t border-stone-100 animate-in fade-in">
                  
                  {/* Further below: Visual Text */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">
                      Visual Instruction / Caption Text:
                    </label>
                    <input
                      value={visualText}
                      onFocus={() => setActiveInputTarget('visualText')}
                      onChange={e => setVisualText(e.target.value)}
                      placeholder="e.g. 'Look at the pictures below' or 'Count the red apples:'"
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-semibold focus:ring-2 focus:ring-[#10246f]"
                    />
                  </div>

                  {/* Further below: Clipart Single / Multi Controls */}
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-stone-700 uppercase tracking-wider">
                        Attached Clipart Items ({visualChips.length} Unique / {resolveMultipleClipartItems(visualClipartString).length} Total):
                      </span>
                      {visualChips.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setVisualClipartString('')}
                          className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Clear Clipart
                        </button>
                      )}
                    </div>

                    {visualChips.length === 0 ? (
                      <div className="p-3 text-center text-stone-400 text-[11px] bg-white rounded-xl border border-dashed border-stone-300">
                        No clipart attached to visual yet. Click "+ Visual" on any item in the Clipart Directory above!
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-white border border-stone-200">
                        {visualChips.map(chip => (
                          <div
                            key={chip.key}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-300 text-stone-800"
                          >
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                              <ClipartImage clipart={chip.clipart} size="xs" />
                            </div>
                            <span className="font-extrabold text-[11px]">{chip.name}</span>
                            <div className="flex items-center gap-1 ml-1 bg-white px-1.5 py-0.5 rounded-lg border border-stone-200">
                              <button
                                type="button"
                                onClick={() => handleUpdateChipCount(chip.key, -1)}
                                className="w-4 h-4 rounded flex items-center justify-center text-stone-700 hover:bg-stone-100 font-black cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-black text-[11px] text-stone-900 px-1">{chip.count}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateChipCount(chip.key, 1)}
                                className="w-4 h-4 rounded flex items-center justify-center text-stone-700 hover:bg-stone-100 font-black cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveChip(chip.key)}
                              className="text-stone-400 hover:text-rose-600 p-0.5 ml-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Animation & Live Canvas Render */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-stone-500">Animation:</span>
                        {(['bounce', 'pulse', 'none'] as const).map(anim => (
                          <button
                            key={anim}
                            type="button"
                            onClick={() => setVisualAnimation(anim)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize cursor-pointer ${
                              visualAnimation === anim ? 'bg-[#10246f] text-white' : 'bg-white border border-stone-200 text-stone-700'
                            }`}
                          >
                            {anim}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Visual Canvas Preview */}
                    <div className="p-3 bg-white rounded-xl border border-stone-200 flex flex-col items-center justify-center min-h-[80px]">
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1">Visual Canvas Render</span>
                      <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                        {resolveMultipleClipartItems(visualClipartString).length > 0 ? (
                          resolveMultipleClipartItems(visualClipartString).map((it, idx) => (
                            <div key={idx} className={visualAnimation === 'bounce' ? 'animate-bounce' : visualAnimation === 'pulse' ? 'animate-pulse' : ''}>
                              <ClipartImage clipart={it} size="sm" />
                            </div>
                          ))
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">Visual canvas is currently empty</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. EDUCATIONAL GUIDANCE (Hints & Explanation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                <label className="font-bold text-stone-700 text-xs">💡 Student Hint (Optional)</label>
                <textarea
                  rows={2}
                  value={hint}
                  onChange={e => setHint(e.target.value)}
                  placeholder="e.g. Try counting by 2s or look at the colors..."
                  className="w-full p-2 rounded-lg border border-stone-200 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                <label className="font-bold text-stone-700 text-xs">📖 Solution Explanation (Optional)</label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  placeholder="e.g. 5 apples plus 3 apples equals 8 apples."
                  className="w-full p-2 rounded-lg border border-stone-200 text-xs"
                />
              </div>
            </div>

            {/* 8. STATUS & SAVE ACTIONS */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">Publish Status:</span>
                {(['Draft', 'Published'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                      status === s
                        ? s === 'Published'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                        : 'bg-white border border-stone-200 text-stone-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> Live Preview
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-extrabold text-xs shadow-md hover:from-blue-800 hover:to-indigo-900 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> {isCreate ? 'Create Question' : 'Save Changes'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* LIVE PREVIEW MODAL */}
      {previewOpen && (
        <QuestionPreviewModal question={previewDraft} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}
