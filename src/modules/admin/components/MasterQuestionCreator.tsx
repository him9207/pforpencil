import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Question, 
  QuestionType, 
  VisualQuestionConfig, 
  VisualQuestionTemplate, 
  VisualAnimation,
  GradeLevel,
  Subject,
  DragItemConfig
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
  HelpCircle,
  Image as ImageIcon,
  Upload,
  Search,
  Link as LinkIcon,
  Sparkles,
  Target,
  Lock
} from 'lucide-react';
import { parseVisualObjectsString } from '../../../utils/visualUtils';
import { 
  CLIPART_REGISTRY, 
  CLIPART_FAMILIES, 
  ClipartCategory, 
  ClipartItem,
  ResolvedClipart,
  getClipartsByCategory, 
  resolveMultipleClipartItems,
  resolveClipartItem,
  parseOptionClipart
} from '../../../data/clipartRegistry';
import { ClipartImage, ClipartText } from '../../../common/ClipartRenderer';
import QuestionPreviewModal from './QuestionPreviewModal';
import { sounds } from '../../../utils/audio';
import { loadCurriculumMaster } from '../../../data/curriculumMasterData';
import { 
  loadQuestionBankMasters, 
  CategoryMasterRecord, 
  SkillMasterRecord,
  getGradeStandardTemplates,
  getGradeTemplateKey
} from '../../../data/questionBankMasterData';
import { INITIAL_GRADES } from '../../../mockData';
import { getNextQuestionId, getQuestionSubjectCode, getQuestionGradeCode } from '../../../utils/idAndUsernameGenerator';

export type ClipartTarget = 
  | 'prompt'
  | 'visual'
  | 'visualText'
  | 'openAnswer'
  | 'explanation'
  | 'hint'
  | `option-${number}`
  | `drag-${number}-item`
  | `drag-${number}-target`
  | `match-${number}-left`
  | `match-${number}-right`
  | `order-${number}`;

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
  lockAcademicHierarchy?: boolean;
  schoolName?: string;
  schoolId?: string;
  schoolPrefix?: string;
  schoolCountryName?: string;
  schoolStateName?: string;
  schoolCurriculumName?: string;
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
  existingQuestions = [],
  lockAcademicHierarchy = false,
  schoolName,
  schoolId,
  schoolPrefix,
  schoolCountryName,
  schoolStateName,
  schoolCurriculumName
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

  // 4. Categories (Topic) - Grade-specific & dynamically updated
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

  const gradeKey = useMemo(() => getGradeTemplateKey(grade), [grade]);
  const standardGradeTemplates = useMemo(() => getGradeStandardTemplates(grade), [grade]);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  const categoryOptions = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();

    // 1. Grade-specific standard categories
    standardGradeTemplates.forEach(tpl => {
      seen.add(tpl.category.toLowerCase());
      list.push({ 
        id: `CAT-${tpl.categoryCode || tpl.category.replace(/[^a-zA-Z0-9]/g, '')}`, 
        name: tpl.category 
      });
    });

    // 2. Merge from masters matching this grade
    mergedCategories.forEach(c => {
      const matchesGrade = !c.gradeId || 
        c.gradeId.toLowerCase().includes(gradeKey) || 
        (c.gradeId && grade.toLowerCase().includes(c.gradeId.toLowerCase()));
      if (matchesGrade && !seen.has(c.name.toLowerCase())) {
        seen.add(c.name.toLowerCase());
        list.push({ id: c.id, name: c.name });
      }
    });

    // 3. Question's existing category or initialCategory
    if (question?.category && !seen.has(question.category.toLowerCase())) {
      list.unshift({ id: question.categoryId || 'CAT-Q', name: question.category });
      seen.add(question.category.toLowerCase());
    } else if (initialCategory && !seen.has(initialCategory.toLowerCase())) {
      list.unshift({ id: 'CAT-INIT', name: initialCategory });
      seen.add(initialCategory.toLowerCase());
    }

    return list;
  }, [standardGradeTemplates, mergedCategories, grade, gradeKey, question?.category, question?.categoryId, initialCategory]);

  const [categoryId, setCategoryId] = useState<string>(() => {
    return question?.categoryId || categoryOptions[0]?.id || 'CAT-1';
  });

  // Keep category valid when grade changes
  useEffect(() => {
    if (!categoryOptions.some(c => c.id === categoryId)) {
      if (categoryOptions[0]) {
        setCategoryId(categoryOptions[0].id);
      }
    }
  }, [categoryOptions, categoryId]);

  const selectedCategory = useMemo(() => {
    if (isCustomCategory) {
      return { id: 'CAT-CUSTOM', name: customCategoryText.trim() || 'Custom Topic' };
    }
    return categoryOptions.find(c => c.id === categoryId) || categoryOptions[0] || { id: 'CAT-1', name: 'Topic Area' };
  }, [isCustomCategory, customCategoryText, categoryOptions, categoryId]);

  // 5. Skills - Grade & Category specific
  const [isCustomSkill, setIsCustomSkill] = useState(false);
  const [customSkillText, setCustomSkillText] = useState('');

  const skillOptions = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();

    // 1. Grade-specific standard skills for selected category
    const matchedTemplate = standardGradeTemplates.find(tpl =>
      tpl.category.toLowerCase() === selectedCategory.name.toLowerCase() ||
      `CAT-${tpl.categoryCode}`.toLowerCase() === selectedCategory.id.toLowerCase() ||
      `CAT-${tpl.category.replace(/[^a-zA-Z0-9]/g, '')}`.toLowerCase() === selectedCategory.id.toLowerCase()
    );

    if (matchedTemplate && matchedTemplate.skills && matchedTemplate.skills.length > 0) {
      matchedTemplate.skills.forEach(skl => {
        seen.add(skl.name.toLowerCase());
        list.push({ id: skl.code || `SKL-${selectedCategory.id}-${skl.name.replace(/[^a-zA-Z0-9]/g, '')}`, name: skl.name });
      });
    }

    // 2. Check mergedSkills matching this category and grade
    const matches = mergedSkills.filter(s =>
      s.categoryId === selectedCategory.id ||
      (selectedCategory.name && s.name && s.categoryId?.includes(selectedCategory.name))
    );
    matches.forEach(s => {
      if (!seen.has(s.name.toLowerCase())) {
        seen.add(s.name.toLowerCase());
        list.push({ id: s.id, name: s.name });
      }
    });

    // 3. Fallback skills for custom or non-template categories
    if (list.length === 0) {
      const defaultSkillNames = [
        `${selectedCategory.name} Practice Drill`,
        `${selectedCategory.name} Visual Challenge`,
        `Applied ${selectedCategory.name} Mastery`
      ];
      defaultSkillNames.forEach((name, idx) => {
        list.push({ id: `SK-${selectedCategory.id}-${idx + 1}`, name });
      });
    }

    if (question?.skill && !seen.has(question.skill.toLowerCase())) {
      list.unshift({ id: question.skillId || 'SK-Q', name: question.skill });
      seen.add(question.skill.toLowerCase());
    } else if (initialSkill && !seen.has(initialSkill.toLowerCase())) {
      list.unshift({ id: 'SK-INIT', name: initialSkill });
      seen.add(initialSkill.toLowerCase());
    }

    return list;
  }, [standardGradeTemplates, selectedCategory, mergedSkills, question?.skill, question?.skillId, initialSkill]);

  const [skillId, setSkillId] = useState<string>(() => {
    return question?.skillId || skillOptions[0]?.id || '';
  });

  // Keep skill valid when category or grade changes
  useEffect(() => {
    if (!skillOptions.some(s => s.id === skillId)) {
      if (skillOptions[0]) {
        setSkillId(skillOptions[0].id);
      }
    }
  }, [skillOptions, skillId]);

  const selectedSkill = useMemo(() => {
    if (isCustomSkill) {
      return { id: 'SK-CUSTOM', name: customSkillText.trim() || 'Custom Skill' };
    }
    return skillOptions.find(s => s.id === skillId) || skillOptions[0] || { id: 'SK-1', name: 'Core Skill' };
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
  const [clipartCategory, setClipartCategory] = useState<ClipartCategory | 'all'>('all');
  const [clipartSearch, setClipartSearch] = useState<string>('');
  const [isClipartDirectoryOpen, setIsClipartDirectoryOpen] = useState(true);
  const [clipartCopiedToast, setClipartCopiedToast] = useState<string>('');

  const currentCategoryCliparts = useMemo(() => {
    let list = clipartCategory === 'all' 
      ? CLIPART_REGISTRY 
      : getClipartsByCategory(clipartCategory);
    if (clipartSearch.trim()) {
      const q = clipartSearch.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.keywords.some(k => k.toLowerCase().includes(q)) ||
        (item.emojiEquivalent && item.emojiEquivalent.includes(q))
      );
    }
    return list;
  }, [clipartCategory, clipartSearch]);

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
      setActiveInputTarget('option-0');
    } else if (nextType === 'fill_blank' || nextType === 'open_box') {
      setOptions([openAnswer || '']);
      setCorrectIndex(0);
      setCorrectIndices([0]);
      setActiveInputTarget('openAnswer');
    } else if (nextType === 'select_objects') {
      setOptions([String(selectObjectsGoal || 4)]);
      setCorrectIndex(0);
      setCorrectIndices([0]);
      setActiveInputTarget('visual');
    } else if (nextType === 'drag_and_drop') {
      if (!dragItems || dragItems.length === 0) {
        setDragItems([
          { item: '🍎 Apple', target: '🧺 Fruit Basket', itemImage: 'apple' },
          { item: '🐶 Puppy', target: '🏠 Doghouse', itemImage: 'puppy' },
          { item: '🍌 Banana', target: '🧺 Fruit Basket', itemImage: 'banana' }
        ]);
      }
      setActiveInputTarget('drag-0-item');
    } else if (nextType === 'match_making') {
      if (!matchPairs || matchPairs.length === 0) {
        setMatchPairs([
          { left: '[apple] Apple', right: 'Red' },
          { left: '[banana] Banana', right: 'Yellow' },
          { left: '[grapes] Grapes', right: 'Purple' }
        ]);
      }
      setActiveInputTarget('match-0-left');
    } else if (nextType === 'ordering') {
      if (!orderSequence || orderSequence.length === 0) {
        setOrderSequence(['1. First', '2. Second', '3. Third']);
      }
      setActiveInputTarget('order-0');
    }
  };

  const isSingleChoice = type === 'single_choice' || type === 'radio_single';
  const isMultipleChoice = type === 'multiple_choice';

  // Specific question type states
  const [selectObjectsGoal, setSelectObjectsGoal] = useState<number>(
    Number(question?.openBoxAnswer || question?.options?.[0]) || 4
  );

  const [dragItems, setDragItems] = useState<DragItemConfig[]>(
    question?.dragItems && question.dragItems.length
      ? [...question.dragItems]
      : [
          { item: '🍎 Apple', target: '🧺 Fruit Basket', itemImage: 'apple' },
          { item: '🐶 Puppy', target: '🏠 Doghouse', itemImage: 'puppy' },
          { item: '🍌 Banana', target: '🧺 Fruit Basket', itemImage: 'banana' }
        ]
  );

  // Drag & Drop Image Picker Modal state
  const [dragItemImagePicker, setDragItemImagePicker] = useState<{
    itemIndex: number;
    field: 'itemImage' | 'targetImage';
  } | null>(null);
  const [dragImageSearch, setDragImageSearch] = useState('');
  const [dragImageCategory, setDragImageCategory] = useState<ClipartCategory | 'all'>('all');
  const [dragImageUrlInput, setDragImageUrlInput] = useState('');
  const [dragImageTab, setDragImageTab] = useState<'clipart' | 'upload' | 'url'>('clipart');
  const [selectedDragIndex, setSelectedDragIndex] = useState<number>(0);
  const dragFileInputRef = useRef<HTMLInputElement>(null);

  const [matchPairs, setMatchPairs] = useState<{ left: string; right: string }[]>(() => {
    if (question?.matchPairs && question.matchPairs.length) {
      return [...question.matchPairs];
    }
    if (question?.options && question.options.length) {
      const parsed = question.options
        .map(opt => {
          if (!opt) return null;
          const delim = opt.includes('->') ? '->' : opt.includes('→') ? '→' : opt.includes('➔') ? '➔' : opt.includes(':') ? ':' : null;
          if (delim) {
            const [l, r] = opt.split(delim);
            return { left: l.trim(), right: r.trim() };
          }
          return null;
        })
        .filter(Boolean) as { left: string; right: string }[];
      if (parsed.length > 0) return parsed;
    }
    return [
      { left: '[apple] Apple', right: 'Red' },
      { left: '[banana] Banana', right: 'Yellow' },
      { left: '[grapes] Grapes', right: 'Purple' }
    ];
  });

  const [orderSequence, setOrderSequence] = useState<string[]>(() => {
    if (question?.orderSequence && question.orderSequence.length) {
      return [...question.orderSequence];
    }
    if (question?.options && question.options.length) {
      return [...question.options];
    }
    return ['1. First', '2. Second', '3. Third'];
  });

  const [sortBuckets, setSortBuckets] = useState<{ bucketName: string; items: string[] }[]>(() => {
    if (question?.sortBuckets && question.sortBuckets.length) {
      return [...question.sortBuckets];
    }
    return [
      { bucketName: 'Fruits', items: ['[apple] Apple', '[banana] Banana'] },
      { bucketName: 'Vegetables', items: ['[carrot] Carrot', '[broccoli] Broccoli'] }
    ];
  });

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
    const currentTokens = visualClipartString.trim() 
      ? visualClipartString.split(/[,|]/).map(s => s.trim()).filter(Boolean) 
      : [];
    if (delta > 0) {
      currentTokens.push(rawKey);
    } else if (delta < 0) {
      const idx = currentTokens.findIndex(tok => {
        const resolved = resolveClipartItem(tok);
        const resolvedKey = resolveClipartItem(rawKey);
        return tok === rawKey || 
          tok.toLowerCase() === rawKey.toLowerCase() ||
          (resolved && resolvedKey && resolved.id === resolvedKey.id);
      });
      if (idx !== -1) {
        currentTokens.splice(idx, 1);
      }
    }
    setVisualClipartString(currentTokens.join(', '));
  };

  const handleRemoveChip = (rawKey: string) => {
    const currentTokens = visualClipartString.trim() 
      ? visualClipartString.split(/[,|]/).map(s => s.trim()).filter(Boolean) 
      : [];
    const filtered = currentTokens.filter(tok => {
      const resolved = resolveClipartItem(tok);
      const resolvedKey = resolveClipartItem(rawKey);
      if (tok === rawKey || tok.toLowerCase() === rawKey.toLowerCase()) return false;
      if (resolved && resolvedKey && resolved.id === resolvedKey.id) return false;
      return true;
    });
    setVisualClipartString(filtered.join(', '));
  };

  // 11. Difficulty, Points & Status
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(question?.difficulty || 'Easy');
  const [points, setPoints] = useState<number>(question?.points || 20);
  const [status, setStatus] = useState<'Draft' | 'Published'>(
    question?.status === 'Published' ? 'Published' : 'Draft'
  );
  const [hint, setHint] = useState<string>(question?.hint || '');
  const [explanation, setExplanation] = useState<string>(question?.explanation || '');

  // 11B. UNIFIED CLIPART INSERTION TARGET & HANDLER
  const [activeInputTarget, setActiveInputTarget] = useState<ClipartTarget>('prompt');

  const getTargetLabel = (target: ClipartTarget): string => {
    if (target === 'prompt') return 'Question Prompt';
    if (target === 'visual') return '🎨 Visual Canvas (Attached Clipart)';
    if (target === 'visualText') return 'Visual Caption / Instructions';
    if (target === 'openAnswer') return 'Answer (Fill-in Blank)';
    if (target === 'explanation') return 'Explanation';
    if (target === 'hint') return 'Hint';
    if (target.startsWith('option-')) {
      const idx = parseInt(target.replace('option-', ''), 10);
      return `Option ${String.fromCharCode(65 + idx)}`;
    }
    if (target.startsWith('drag-')) {
      const parts = target.split('-');
      const idx = parseInt(parts[1], 10);
      const field = parts[2];
      return `Drag Item #${idx + 1} (${field === 'target' ? 'Target Zone' : 'Object'})`;
    }
    if (target.startsWith('match-')) {
      const parts = target.split('-');
      const idx = parseInt(parts[1], 10);
      const side = parts[2];
      return `Match Pair #${idx + 1} (${side === 'left' ? 'Left Item' : 'Right Match'})`;
    }
    if (target.startsWith('order-')) {
      const idx = parseInt(target.replace('order-', ''), 10);
      return `Sequence Step #${idx + 1}`;
    }
    return 'Selected Field';
  };

  const handleInsertClipart = (item: ClipartItem) => {
    const tag = `[${item.keywords[0] || item.id}]`;

    if (activeInputTarget === 'visual') {
      handleAddVisualClipart(item.id);
      setClipartCopiedToast(`Added ${item.name} to Visual Canvas`);
      sounds.click();
    } else if (activeInputTarget === 'prompt') {
      setPrompt(prev => prev ? `${prev} ${tag}` : tag);
      setClipartCopiedToast(`Inserted ${tag} into Prompt`);
      sounds.click();
    } else if (activeInputTarget === 'visualText') {
      setVisualText(prev => prev ? `${prev} ${tag}` : tag);
      setClipartCopiedToast(`Inserted ${tag} into Visual Text`);
      sounds.click();
    } else if (activeInputTarget === 'openAnswer') {
      setOpenAnswer(prev => prev ? `${prev} ${tag}` : tag);
      setClipartCopiedToast(`Inserted ${tag} into Answer`);
      sounds.click();
    } else if (activeInputTarget === 'explanation') {
      setExplanation(prev => prev ? `${prev} ${tag}` : tag);
      setClipartCopiedToast(`Inserted ${tag} into Explanation`);
      sounds.click();
    } else if (activeInputTarget === 'hint') {
      setHint(prev => prev ? `${prev} ${tag}` : tag);
      setClipartCopiedToast(`Inserted ${tag} into Hint`);
      sounds.click();
    } else if (activeInputTarget.startsWith('option-')) {
      const idx = parseInt(activeInputTarget.replace('option-', ''), 10);
      if (!isNaN(idx)) {
        const next = [...options];
        next[idx] = next[idx] ? `${next[idx]} ${tag}` : tag;
        setOptions(next);
        setClipartCopiedToast(`Inserted ${tag} into Option ${String.fromCharCode(65 + idx)}`);
        sounds.click();
      }
    } else if (activeInputTarget.startsWith('drag-')) {
      const parts = activeInputTarget.split('-');
      const idx = parseInt(parts[1], 10);
      const field = parts[2] as 'item' | 'target';
      if (!isNaN(idx) && dragItems[idx]) {
        const next = [...dragItems];
        if (field === 'item') {
          next[idx] = {
            ...next[idx],
            item: next[idx].item ? `${next[idx].item} ${tag}` : `${item.name} ${tag}`,
            itemImage: item.id
          };
        } else {
          next[idx] = {
            ...next[idx],
            target: next[idx].target ? `${next[idx].target} ${tag}` : `${item.name} ${tag}`
          };
        }
        setDragItems(next);
        setClipartCopiedToast(`Added ${item.name} to Drag Item #${idx + 1}`);
        sounds.click();
      }
    } else if (activeInputTarget.startsWith('match-')) {
      const parts = activeInputTarget.split('-');
      const idx = parseInt(parts[1], 10);
      const side = parts[2] as 'left' | 'right';
      if (!isNaN(idx) && matchPairs[idx]) {
        const next = [...matchPairs];
        next[idx] = {
          ...next[idx],
          [side]: next[idx][side] ? `${next[idx][side]} ${tag}` : tag
        };
        setMatchPairs(next);
        setClipartCopiedToast(`Inserted ${tag} into Match Pair #${idx + 1} (${side})`);
        sounds.click();
      }
    } else if (activeInputTarget.startsWith('order-')) {
      const idx = parseInt(activeInputTarget.replace('order-', ''), 10);
      if (!isNaN(idx) && orderSequence[idx] !== undefined) {
        const next = [...orderSequence];
        next[idx] = next[idx] ? `${next[idx]} ${tag}` : tag;
        setOrderSequence(next);
        setClipartCopiedToast(`Inserted ${tag} into Step #${idx + 1}`);
        sounds.click();
      }
    }

    setTimeout(() => setClipartCopiedToast(''), 2500);
  };

  // 12. Preview & Validation
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const generatedId = useMemo(() => {
    if (question?.id) return question.id;
    if (lockAcademicHierarchy || schoolPrefix) {
      const pfx = schoolPrefix || 'SCH';
      const subjCode = getQuestionSubjectCode(subject || 'Mathematics');
      const grCode = getQuestionGradeCode(grade || 'Grade 1');
      const basePrefix = `${pfx}-${subjCode}-${grCode}`;
      const regex = new RegExp(`^${basePrefix}[-_]?(\\d+)$`, 'i');
      let max = 0;
      for (const q of existingQuestions) {
        const m = (q.id || '').match(regex);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > max) max = n;
        }
      }
      return `${basePrefix}-${String(max + 1).padStart(4, '0')}`;
    }
    return getNextQuestionId(grade as GradeLevel, existingQuestions, 0, subject as Subject);
  }, [question?.id, lockAcademicHierarchy, schoolPrefix, grade, subject, existingQuestions]);

  const targetGradeId = useMemo(() => {
    if (question?.gradeId) return question.gradeId;
    const matchedGrade = INITIAL_GRADES.find(g => g.name.toLowerCase() === grade.toLowerCase());
    return matchedGrade?.id || `GRD_${grade.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)}`;
  }, [question?.gradeId, grade]);

  const targetSubjectId = useMemo(() => {
    return question?.subjectId || 'SUB_MTH';
  }, [question?.subjectId]);

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
      gradeId: targetGradeId,
      subject: subject as Subject,
      subjectId: targetSubjectId,
      category: (selectedCategory.name || customCategoryText || 'General Practice').trim(),
      skill: (selectedSkill.name || customSkillText || 'Problem Solving').trim(),
      categoryId: selectedCategory.id,
      skillId: selectedSkill.id,
      curriculumId: activeCurriculum.id,
      curriculum: schoolCurriculumName || activeCurriculum.name,
      countryId: countryId,
      country: schoolCountryName || (countryId === 'CNT-US' ? 'United States' : 'Global'),
      state: schoolStateName,
      schoolId: schoolId || (question as any)?.schoolId,
      schoolName: schoolName || (question as any)?.schoolName,
      isCustom: lockAcademicHierarchy ? true : (question as any)?.isCustom,
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
      gradeId: targetGradeId,
      subject: subject as Subject,
      subjectId: targetSubjectId,
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
                {isCreate 
                  ? (lockAcademicHierarchy ? `🏫 School Custom #${generatedId}` : '✨ Create New Question') 
                  : `✏️ Edit #${generatedId}`}
              </span>
              <span className="text-xs font-bold text-stone-300 hidden sm:inline">
                {lockAcademicHierarchy 
                  ? `🔒 Private to ${schoolName || 'Your School'} (Applicable only to your school)` 
                  : 'Standard Question & Answer Creator'}
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

            {/* 1. HEADER -> ACADEMIC HIERARCHY */}
            {lockAcademicHierarchy ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 space-y-3">
                {/* School Standard Lock Banner */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                      🏫
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                        <span>School Academic Standards (Locked to {schoolName || 'Your School'})</span>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          🔒 Fixed Hierarchy
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-slate-800">{schoolCountryName || 'United States'}</span>
                        <span>•</span>
                        <span>{schoolStateName || 'California'}</span>
                        <span>•</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-900 font-bold text-[10px]">
                          {schoolCurriculumName || 'Common Core (US)'}
                        </span>
                        <span>•</span>
                        <span className="text-blue-700 font-bold text-[10px]">🔒 Private to {schoolName || 'Your School'} Question Bank</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 shrink-0 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Fixed to School Profile</span>
                  </div>
                </div>

                {/* 4-Field Grid for Teachers: Grade, Subject, Category, Skill */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {/* Grade */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1 uppercase tracking-wider">
                      Assigned Grade
                    </label>
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

                  {/* Subject */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1 uppercase tracking-wider">
                      Assigned Subject
                    </label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#10246f]"
                    >
                      {availableSubjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category / Topic */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Category (Topic)</label>
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(!isCustomCategory)}
                        className="text-[9px] text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        {isCustomCategory ? 'Select List' : '+ Type Custom'}
                      </button>
                    </div>
                    {isCustomCategory ? (
                      <input
                        value={customCategoryText}
                        onChange={e => setCustomCategoryText(e.target.value)}
                        placeholder="e.g. Numbers & Operations"
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

                  {/* Skill */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">Target Skill</label>
                      <button
                        type="button"
                        onClick={() => setIsCustomSkill(!isCustomSkill)}
                        className="text-[9px] text-emerald-600 font-bold hover:underline cursor-pointer"
                      >
                        {isCustomSkill ? 'Select List' : '+ Type Custom'}
                      </button>
                    </div>
                    {isCustomSkill ? (
                      <input
                        value={customSkillText}
                        onChange={e => setCustomSkillText(e.target.value)}
                        placeholder="e.g. Problem Solving"
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

                {/* Difficulty selector bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-stone-500">Question Difficulty Level:</span>
                  <div className="flex items-center gap-1.5">
                    {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                          difficulty === d
                            ? d === 'Easy'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : d === 'Medium'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
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
            )}

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
                <div className="flex items-center gap-2">
                  <label className="font-black text-stone-900 text-xs uppercase tracking-wider">
                    Question Prompt (Student-Facing Text):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInputTarget('prompt');
                      setIsClipartDirectoryOpen(true);
                      document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🎨</span> + Insert Clipart
                  </button>
                </div>
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

            {/* 4. CENTRALIZED CLIPART DIRECTORY (Used for Question, Visuals, Answers, Options & Draggables) */}
            <div id="universal-clipart-directory" className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 overflow-hidden shadow-2xs">
              {/* Directory Header with Toggle */}
              <div 
                onClick={() => setIsClipartDirectoryOpen(!isClipartDirectoryOpen)}
                className="p-3 bg-gradient-to-r from-amber-100 to-amber-200/90 flex items-center justify-between cursor-pointer select-none border-b border-amber-300"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎨</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-950 text-xs sm:text-sm">
                        Universal Clipart Directory ({CLIPART_REGISTRY.length} Vector Items)
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-300/80 px-2 py-0.5 rounded-full">
                        1-Click Insert
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-900 ml-0.5 hidden sm:inline">
                      Click any clipart below to add directly into your Question, Visuals, Options, or Draggables
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {clipartCopiedToast && (
                    <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs animate-pulse">
                      ✓ {clipartCopiedToast}
                    </span>
                  )}
                  <span className="p-1 rounded-lg hover:bg-amber-300/60 text-amber-900 font-bold transition">
                    {isClipartDirectoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {isClipartDirectoryOpen && (
                <div className="p-3.5 space-y-3">
                  
                  {/* UNIFIED INSERTION TARGET SELECTOR BAR */}
                  <div className="p-2.5 rounded-xl bg-white border border-amber-300 shadow-2xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-stone-800 flex items-center gap-1.5 shrink-0">
                          <Target className="w-4 h-4 text-amber-600" />
                          <span>Insert Clipart Into:</span>
                        </label>
                        <select
                          value={activeInputTarget}
                          onChange={(e) => setActiveInputTarget(e.target.value as ClipartTarget)}
                          className="px-2.5 py-1.5 bg-amber-50 border-2 border-amber-400 text-stone-900 font-black text-xs rounded-xl outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                        >
                          <option value="prompt">📝 Question Prompt</option>
                          <option value="visual">🎨 Visual Canvas (Attached Clipart)</option>
                          <option value="visualText">ℹ️ Visual Caption / Text</option>
                          {options.map((_, idx) => (
                            <option key={idx} value={`option-${idx}`}>
                              🔘 Option {String.fromCharCode(65 + idx)}
                            </option>
                          ))}
                          {(type === 'fill_blank' || type === 'open_box' || type === 'word_problem') && (
                            <option value="openAnswer">✏️ Answer (Fill-in Blank)</option>
                          )}
                          {type === 'drag_and_drop' && dragItems.map((_, idx) => (
                            <optgroup key={idx} label={`Drag Item #${idx + 1}`}>
                              <option value={`drag-${idx}-item`}>🔀 Drag Item #{idx + 1} (Object)</option>
                              <option value={`drag-${idx}-target`}>🧺 Drag Item #{idx + 1} (Target Zone)</option>
                            </optgroup>
                          ))}
                          {type === 'match_making' && matchPairs.map((_, idx) => (
                            <optgroup key={idx} label={`Match Pair #${idx + 1}`}>
                              <option value={`match-${idx}-left`}>🔗 Match Pair #{idx + 1} (Left Item)</option>
                              <option value={`match-${idx}-right`}>🔗 Match Pair #{idx + 1} (Right Match)</option>
                            </optgroup>
                          ))}
                          {type === 'ordering' && orderSequence.map((_, idx) => (
                            <option key={idx} value={`order-${idx}`}>
                              🔢 Step #{idx + 1}
                            </option>
                          ))}
                          <option value="explanation">📖 Explanation</option>
                          <option value="hint">💡 Hint</option>
                        </select>
                      </div>

                      {/* Search Bar for Clipart */}
                      <div className="relative flex-1 max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                        <input
                          value={clipartSearch}
                          onChange={e => setClipartSearch(e.target.value)}
                          placeholder="Search cliparts (e.g. apple, cat, star)..."
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 bg-stone-50/50"
                        />
                        {clipartSearch && (
                          <button
                            type="button"
                            onClick={() => setClipartSearch('')}
                            className="absolute right-2 top-2 text-stone-400 hover:text-stone-700 text-xs font-black cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Pill Buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-amber-100 scrollbar-thin">
                      <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider shrink-0">
                        Quick Targets:
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveInputTarget('prompt')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap ${
                          activeInputTarget === 'prompt' 
                            ? 'bg-[#10246f] text-white shadow-2xs' 
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        📝 Prompt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveInputTarget('visual');
                          setHasVisual(true);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap flex items-center gap-1 ${
                          activeInputTarget === 'visual' 
                            ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-300' 
                            : 'bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300'
                        }`}
                      >
                        <span>🎨</span> Visuals
                      </button>
                      {(type === 'single_choice' || type === 'multiple_choice' || type === 'image_choice' || type === 'radio_single') && options.slice(0, 4).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveInputTarget(`option-${idx}`)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap ${
                            activeInputTarget === `option-${idx}` 
                              ? 'bg-[#10246f] text-white shadow-2xs' 
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          Option {String.fromCharCode(65 + idx)}
                        </button>
                      ))}
                      {type === 'match_making' && matchPairs.map((_, idx) => (
                        <div key={idx} className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setActiveInputTarget(`match-${idx}-left`)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap ${
                              activeInputTarget === `match-${idx}-left`
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-purple-100 text-purple-950 hover:bg-purple-200'
                            }`}
                          >
                            🔗 Pair #{idx + 1} Left
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveInputTarget(`match-${idx}-right`)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap ${
                              activeInputTarget === `match-${idx}-right`
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'bg-purple-100 text-purple-950 hover:bg-purple-200'
                            }`}
                          >
                            🔗 Pair #{idx + 1} Right
                          </button>
                        </div>
                      ))}
                      {type === 'drag_and_drop' && (
                        <button
                          type="button"
                          onClick={() => setActiveInputTarget('drag-0-item')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap ${
                            activeInputTarget.startsWith('drag-') 
                              ? 'bg-purple-600 text-white shadow-2xs' 
                              : 'bg-purple-100 text-purple-950 hover:bg-purple-200'
                          }`}
                        >
                          🔀 Drag Items
                        </button>
                      )}
                      {type === 'ordering' && orderSequence.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveInputTarget(`order-${idx}`)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap ${
                            activeInputTarget === `order-${idx}`
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                          }`}
                        >
                          🔢 Step #{idx + 1}
                        </button>
                      ))}
                      {(type === 'fill_blank' || type === 'open_box') && (
                        <button
                          type="button"
                          onClick={() => setActiveInputTarget('openAnswer')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer transition whitespace-nowrap ${
                            activeInputTarget === 'openAnswer' 
                              ? 'bg-emerald-600 text-white shadow-2xs' 
                              : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                          }`}
                        >
                          ✏️ Answer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Family Selector Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setClipartCategory('all')}
                      className={`px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0 ${
                        clipartCategory === 'all'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-100/60'
                      }`}
                    >
                      <span>🌟</span>
                      <span>All ({CLIPART_REGISTRY.length})</span>
                    </button>
                    {CLIPART_FAMILIES.map(fam => {
                      const isActive = fam.id === clipartCategory;
                      return (
                        <button
                          key={fam.id}
                          type="button"
                          onClick={() => setClipartCategory(fam.id)}
                          className={`px-2.5 py-1 rounded-xl font-black text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-100/60'
                          }`}
                        >
                          <span>{fam.icon}</span>
                          <span>{fam.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Clipart Grid - Clean single-action cards */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-52 overflow-y-auto p-1 bg-white/60 rounded-xl border border-amber-200/80">
                    {currentCategoryCliparts.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleInsertClipart(item)}
                        className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-500 hover:bg-amber-50/90 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs group text-center"
                        title={`Click to insert ${item.name} into ${getTargetLabel(activeInputTarget)}`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center p-0.5">
                          <ClipartImage clipart={item} size="sm" />
                        </div>
                        <span className="text-[10px] font-extrabold text-stone-800 group-hover:text-amber-950 truncate w-full text-center">
                          {item.name}
                        </span>
                      </button>
                    ))}
                    {currentCategoryCliparts.length === 0 && (
                      <div className="col-span-full py-8 text-center text-xs text-stone-400 font-bold">
                        No cliparts found matching &quot;{clipartSearch}&quot;
                      </div>
                    )}
                  </div>

                  {/* Active Target Information Banner */}
                  <div className="px-3 py-1.5 rounded-xl bg-amber-100/70 border border-amber-200/80 text-[11px] font-bold text-amber-900 flex items-center justify-between">
                    <span>
                      Current Destination: <strong className="text-amber-950 bg-amber-200/80 px-1.5 py-0.5 rounded-md ml-1">{getTargetLabel(activeInputTarget)}</strong>
                    </span>
                    <span className="text-[10px] text-stone-500 hidden sm:inline">
                      Click any clipart above to insert immediately
                    </span>
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
                              onFocus={() => setActiveInputTarget(`option-${idx}`)}
                              onChange={e => {
                                const next = [...options];
                                next[idx] = e.target.value;
                                setOptions(next);
                              }}
                              placeholder={`Option ${letter} answer text or [clipart]...`}
                              className="flex-1 p-2 rounded-xl border border-stone-200 bg-white font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveInputTarget(`option-${idx}`);
                                setIsClipartDirectoryOpen(true);
                                document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }}
                              title={`Insert clipart into Option ${letter}`}
                              className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer shrink-0 ${
                                activeInputTarget === `option-${idx}`
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                  : 'bg-white text-stone-600 border-stone-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900'
                              }`}
                            >
                              🎨
                            </button>

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
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-xs text-stone-900 block">
                      Expected Correct Student Answer:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveInputTarget('openAnswer');
                        setIsClipartDirectoryOpen(true);
                        document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                      className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>🎨</span> + Insert Clipart
                    </button>
                  </div>
                  <input
                    required
                    value={openAnswer}
                    onFocus={() => setActiveInputTarget('openAnswer')}
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
                <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Draggable Items ➔ Target Drop Zones
                      </span>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        Each item can have a vector clipart image or custom uploaded picture attached!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newIdx = dragItems.length + 1;
                        setDragItems(prev => [
                          ...prev,
                          { item: `Item ${newIdx}`, target: 'Target Zone', itemImage: undefined }
                        ]);
                        setSelectedDragIndex(dragItems.length);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] cursor-pointer shadow-2xs transition"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {dragItems.map((d, i) => {
                      // Resolve item thumbnail
                      const currentImgNode = (() => {
                        if (d.itemImage) {
                          if (d.itemImage.startsWith('data:') || d.itemImage.startsWith('http') || d.itemImage.startsWith('/')) {
                            return <img src={d.itemImage} alt={d.item} className="w-8 h-8 object-contain rounded-lg" />;
                          }
                          const resolved = resolveClipartItem(d.itemImage);
                          if (resolved && resolved.isImage) {
                            return <ClipartImage clipart={resolved} size="xs" />;
                          }
                          if (resolved?.emoji) {
                            return <span className="text-xl">{resolved.emoji}</span>;
                          }
                        }
                        const parsed = parseOptionClipart(d.item);
                        if (parsed.hasClipart && parsed.clipart) {
                          return <ClipartImage clipart={parsed.clipart} size="xs" />;
                        }
                        return null;
                      })();

                      // Resolve target container thumbnail
                      const currentTargetImgNode = (() => {
                        if (d.targetImage) {
                          if (d.targetImage.startsWith('data:') || d.targetImage.startsWith('http') || d.targetImage.startsWith('/')) {
                            return <img src={d.targetImage} alt={d.target} className="w-7 h-7 object-contain rounded-lg" />;
                          }
                          const resolved = resolveClipartItem(d.targetImage);
                          if (resolved && resolved.isImage) {
                            return <ClipartImage clipart={resolved} size="xs" />;
                          }
                        }
                        return null;
                      })();

                      const isSelectedRow = selectedDragIndex === i;

                      return (
                        <div
                          key={i}
                          onClick={() => setSelectedDragIndex(i)}
                          className={`p-2.5 rounded-2xl border transition-all ${
                            isSelectedRow
                              ? 'bg-white border-amber-400 ring-2 ring-amber-300/60 shadow-xs'
                              : 'bg-white/90 border-amber-200/80 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-900 text-xs w-6 text-center shrink-0">
                              #{i + 1}
                            </span>

                            {/* Item Image Button / Thumbnail */}
                            <div className="relative group shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDragIndex(i);
                                  setDragItemImagePicker({ itemIndex: i, field: 'itemImage' });
                                }}
                                className={`w-11 h-11 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition cursor-pointer ${
                                  currentImgNode
                                    ? 'bg-amber-50 border-amber-300 hover:bg-amber-100/80 shadow-2xs'
                                    : 'bg-stone-50 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50 text-stone-400 hover:text-amber-700'
                                }`}
                                title={currentImgNode ? 'Click to change item image' : 'Click to add picture or clipart to this draggable item'}
                              >
                                {currentImgNode ? (
                                  currentImgNode
                                ) : (
                                  <>
                                    <ImageIcon className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
                                    <span className="text-[8px] font-black text-stone-400 group-hover:text-amber-600 leading-none mt-0.5">+Img</span>
                                  </>
                                )}
                              </button>
                              {d.itemImage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = [...dragItems];
                                    delete next[i].itemImage;
                                    setDragItems(next);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
                                  title="Remove image"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Item Text Input */}
                            <div className="flex-1 min-w-0">
                              <input
                                value={d.item}
                                onFocus={() => {
                                  setSelectedDragIndex(i);
                                  setActiveInputTarget(`drag-${i}-item`);
                                }}
                                onChange={e => {
                                  const next = [...dragItems];
                                  next[i].item = e.target.value;
                                  setDragItems(next);
                                }}
                                placeholder="Draggable Item (e.g. 🍎 Apple or Red Circle)"
                                className="w-full p-2 rounded-xl border border-stone-200 text-xs font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 bg-white"
                              />
                            </div>

                            <span className="text-amber-700 font-black text-xs shrink-0 flex items-center gap-0.5">
                              ➔
                            </span>

                            {/* Target Zone Text Input */}
                            <div className="flex-1 min-w-0">
                              <input
                                value={d.target}
                                onFocus={() => {
                                  setSelectedDragIndex(i);
                                  setActiveInputTarget(`drag-${i}-target`);
                                }}
                                onChange={e => {
                                  const next = [...dragItems];
                                  next[i].target = e.target.value;
                                  setDragItems(next);
                                }}
                                placeholder="Target Zone (e.g. 🧺 Basket or Red Box)"
                                className="w-full p-2 rounded-xl border border-stone-200 text-xs font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 bg-white"
                              />
                            </div>

                            {/* Target Zone Optional Image */}
                            <div className="relative group shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDragIndex(i);
                                  setDragItemImagePicker({ itemIndex: i, field: 'targetImage' });
                                }}
                                className={`w-9 h-9 rounded-xl border flex items-center justify-center p-1 transition cursor-pointer ${
                                  currentTargetImgNode
                                    ? 'bg-sky-50 border-sky-300 hover:bg-sky-100 shadow-2xs'
                                    : 'bg-stone-50 border-dashed border-stone-200 hover:border-sky-400 hover:bg-sky-50 text-stone-300 hover:text-sky-600'
                                }`}
                                title={currentTargetImgNode ? 'Target container image attached' : 'Optional: add picture to target drop zone'}
                              >
                                {currentTargetImgNode ? currentTargetImgNode : <span className="text-xs">🎯</span>}
                              </button>
                              {d.targetImage && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = [...dragItems];
                                    delete next[i].targetImage;
                                    setDragItems(next);
                                  }}
                                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs cursor-pointer"
                                  title="Remove target image"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Delete Button */}
                            {dragItems.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDragItems(prev => prev.filter((_, idx) => idx !== i));
                                }}
                                className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                                title="Remove item pair"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5F. Match Making */}
              {type === 'match_making' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-xs text-stone-800">Match Making Pairs</span>
                      <p className="text-[10px] text-stone-500">Pair each left item with its matching right item. You can insert clipart into both!</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMatchPairs(prev => [...prev, { left: `Item ${prev.length + 1}`, right: `Match ${prev.length + 1}` }])}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 hover:bg-purple-200 font-black text-xs cursor-pointer transition shadow-2xs"
                    >
                      + Add Pair
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {matchPairs.map((pair, i) => (
                      <div key={i} className="p-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <span className="font-mono font-black text-purple-900 text-xs w-6 shrink-0 text-center">
                          #{i + 1}
                        </span>

                        {/* Left Item */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-stone-600">Left Item:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveInputTarget(`match-${i}-left`);
                                setIsClipartDirectoryOpen(true);
                                document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }}
                              className="text-[9px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 cursor-pointer transition"
                            >
                              🎨 + Clipart
                            </button>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              value={pair.left}
                              onFocus={() => setActiveInputTarget(`match-${i}-left`)}
                              onChange={e => {
                                const next = [...matchPairs];
                                next[i].left = e.target.value;
                                setMatchPairs(next);
                              }}
                              placeholder="e.g. 5 + 5 or [apple] Red Apple"
                              className={`w-full p-2 pr-9 rounded-xl border text-xs font-bold bg-white outline-none ${
                                activeInputTarget === `match-${i}-left` ? 'border-purple-500 ring-2 ring-purple-300' : 'border-stone-200'
                              }`}
                            />
                            {pair.left && (
                              <div className="absolute right-2 pointer-events-none">
                                <ClipartText text={pair.left} imageSize="xs" />
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-purple-600 font-black text-base shrink-0 self-center">➔</span>

                        {/* Right Match */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-stone-600">Right Matching Target:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveInputTarget(`match-${i}-right`);
                                setIsClipartDirectoryOpen(true);
                                document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }}
                              className="text-[9px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 cursor-pointer transition"
                            >
                              🎨 + Clipart
                            </button>
                          </div>
                          <div className="relative flex items-center">
                            <input
                              value={pair.right}
                              onFocus={() => setActiveInputTarget(`match-${i}-right`)}
                              onChange={e => {
                                const next = [...matchPairs];
                                next[i].right = e.target.value;
                                setMatchPairs(next);
                              }}
                              placeholder="e.g. 10 or [banana] Yellow"
                              className={`w-full p-2 pr-9 rounded-xl border text-xs font-bold bg-white outline-none ${
                                activeInputTarget === `match-${i}-right` ? 'border-purple-500 ring-2 ring-purple-300' : 'border-stone-200'
                              }`}
                            />
                            {pair.right && (
                              <div className="absolute right-2 pointer-events-none">
                                <ClipartText text={pair.right} imageSize="xs" />
                              </div>
                            )}
                          </div>
                        </div>

                        {matchPairs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMatchPairs(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg self-center cursor-pointer transition"
                            title="Remove pair"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5G. Ordering */}
              {type === 'ordering' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-xs text-stone-800">Correct Sequence (Chronological or Logical Order)</span>
                      <p className="text-[10px] text-stone-500">Arrange items in the correct order from first to last.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrderSequence(prev => [...prev, `Step ${prev.length + 1}`])}
                      className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-black text-xs cursor-pointer transition shadow-2xs"
                    >
                      + Add Step
                    </button>
                  </div>
                  <div className="space-y-2">
                    {orderSequence.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 bg-stone-50/60">
                        <span className="w-7 text-center font-black text-emerald-800 text-xs shrink-0">#{i + 1}</span>
                        <div className="relative flex-1 flex items-center">
                          <input
                            value={item}
                            onFocus={() => setActiveInputTarget(`order-${i}` as ClipartTarget)}
                            onChange={e => {
                              const next = [...orderSequence];
                              next[i] = e.target.value;
                              setOrderSequence(next);
                            }}
                            className={`w-full p-2 pr-12 rounded-xl border text-xs font-bold bg-white outline-none ${
                              activeInputTarget === `order-${i}` ? 'border-emerald-500 ring-2 ring-emerald-300' : 'border-stone-200'
                            }`}
                          />
                          {item && (
                            <div className="absolute right-2 pointer-events-none">
                              <ClipartText text={item} imageSize="xs" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInputTarget(`order-${i}` as ClipartTarget);
                            setIsClipartDirectoryOpen(true);
                            document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 px-2 py-1 rounded-lg border border-amber-300 cursor-pointer shrink-0"
                        >
                          🎨 + Clipart
                        </button>
                        {orderSequence.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setOrderSequence(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
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
                    onChange={e => {
                      setHasVisual(e.target.checked);
                      if (e.target.checked) setActiveInputTarget('visual');
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable Visual Representation (Visual Layer)</span>
                </label>
                <div className="flex items-center gap-2">
                  {hasVisual && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveInputTarget('visual');
                        setIsClipartDirectoryOpen(true);
                        document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs cursor-pointer transition shadow-2xs flex items-center gap-1.5"
                    >
                      <span>🎨</span> + Add Clipart to Visual
                    </button>
                  )}
                  <span className="text-[10px] text-stone-400 font-semibold">
                    {hasVisual ? 'Active' : 'Optional visual display'}
                  </span>
                </div>
              </div>

              {hasVisual && (
                <div className="space-y-3 pt-2 border-t border-stone-100 animate-in fade-in">
                  
                  {/* Further below: Visual Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-stone-600 block">
                        Visual Instruction / Caption Text:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveInputTarget('visualText');
                          setIsClipartDirectoryOpen(true);
                          document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        className="text-[9px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 cursor-pointer"
                      >
                        🎨 + Insert Clipart
                      </button>
                    </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInputTarget('visual');
                            setIsClipartDirectoryOpen(true);
                            document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className="text-[10px] font-extrabold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 cursor-pointer transition flex items-center gap-1"
                        >
                          <span>🎨</span> + Add Clipart
                        </button>
                        {visualChips.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setVisualClipartString('')}
                            className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {visualChips.length === 0 ? (
                      <div className="p-4 text-center text-stone-500 text-xs bg-white rounded-xl border border-dashed border-amber-300 space-y-2">
                        <p className="font-bold text-stone-700">No clipart attached to visual canvas yet.</p>
                        <p className="text-[11px] text-stone-500">
                          Click the button below to open the Universal Clipart Directory and add items (apples, stars, animals, coins, etc.) to your visual!
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInputTarget('visual');
                            setIsClipartDirectoryOpen(true);
                            document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs cursor-pointer transition shadow-2xs"
                        >
                          <Sparkles className="w-4 h-4" /> Open Clipart Directory & Select Clipart
                        </button>
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
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 text-xs">💡 Student Hint (Optional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInputTarget('hint');
                      setIsClipartDirectoryOpen(true);
                      document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                    className="text-[9px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 cursor-pointer"
                  >
                    🎨 + Clipart
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={hint}
                  onFocus={() => setActiveInputTarget('hint')}
                  onChange={e => setHint(e.target.value)}
                  placeholder="e.g. Try counting by 2s or look at the colors..."
                  className="w-full p-2 rounded-lg border border-stone-200 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 text-xs">📖 Solution Explanation (Optional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInputTarget('explanation');
                      setIsClipartDirectoryOpen(true);
                      document.getElementById('universal-clipart-directory')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                    className="text-[9px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 cursor-pointer"
                  >
                    🎨 + Clipart
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={explanation}
                  onFocus={() => setActiveInputTarget('explanation')}
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

      {/* DRAG & DROP ITEM IMAGE & CLIPART PICKER MODAL */}
      {dragItemImagePicker !== null && (() => {
        const activeItem = dragItems[dragItemImagePicker.itemIndex];
        const isTargetZone = dragItemImagePicker.field === 'targetImage';
        const currentVal = activeItem ? activeItem[dragItemImagePicker.field] : undefined;

        const filteredCliparts = CLIPART_REGISTRY.filter(c => {
          const catMatches = dragImageCategory === 'all' || c.category === dragImageCategory;
          const searchMatches = !dragImageSearch.trim() || 
            c.name.toLowerCase().includes(dragImageSearch.toLowerCase()) ||
            c.keywords.some(k => k.toLowerCase().includes(dragImageSearch.toLowerCase()));
          return catMatches && searchMatches;
        });

        const handleSelectClipart = (clipartItem: ClipartItem) => {
          const next = [...dragItems];
          if (next[dragItemImagePicker.itemIndex]) {
            next[dragItemImagePicker.itemIndex] = {
              ...next[dragItemImagePicker.itemIndex],
              [dragItemImagePicker.field]: clipartItem.id,
              // If the text label is empty or default, suggest the clipart name
              item: !isTargetZone && (!next[dragItemImagePicker.itemIndex].item || next[dragItemImagePicker.itemIndex].item.startsWith('Item '))
                ? clipartItem.name
                : next[dragItemImagePicker.itemIndex].item
            };
            setDragItems(next);
          }
          sounds.click();
          setDragItemImagePicker(null);
        };

        const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUri = ev.target?.result as string;
            if (dataUri) {
              const next = [...dragItems];
              if (next[dragItemImagePicker.itemIndex]) {
                next[dragItemImagePicker.itemIndex] = {
                  ...next[dragItemImagePicker.itemIndex],
                  [dragItemImagePicker.field]: dataUri
                };
                setDragItems(next);
              }
              sounds.click();
              setDragItemImagePicker(null);
            }
          };
          reader.readAsDataURL(file);
        };

        const handleApplyUrl = () => {
          if (!dragImageUrlInput.trim()) return;
          const next = [...dragItems];
          if (next[dragItemImagePicker.itemIndex]) {
            next[dragItemImagePicker.itemIndex] = {
              ...next[dragItemImagePicker.itemIndex],
              [dragItemImagePicker.field]: dragImageUrlInput.trim()
            };
            setDragItems(next);
          }
          sounds.click();
          setDragImageUrlInput('');
          setDragItemImagePicker(null);
        };

        const handleRemoveImage = () => {
          const next = [...dragItems];
          if (next[dragItemImagePicker.itemIndex]) {
            delete next[dragItemImagePicker.itemIndex][dragItemImagePicker.field];
            setDragItems(next);
          }
          sounds.click();
          setDragItemImagePicker(null);
        };

        return (
          <div 
            className="fixed inset-0 z-[170] bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setDragItemImagePicker(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[88vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-200" />
                    {isTargetZone ? 'Choose Target Zone Image' : `Choose Image for Item #${dragItemImagePicker.itemIndex + 1}`}
                  </h3>
                  <p className="text-xs text-amber-100 mt-0.5">
                    {isTargetZone
                      ? `Drop container: "${activeItem?.target || 'Target Zone'}"`
                      : `Draggable object: "${activeItem?.item || 'Item'}"`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDragItemImagePicker(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-stone-100 px-5 pt-3 border-b border-stone-200 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDragImageTab('clipart')}
                  className={`px-3.5 py-2 rounded-t-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                    dragImageTab === 'clipart'
                      ? 'bg-white text-amber-900 border-t-2 border-amber-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Vector Clipart ({CLIPART_REGISTRY.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDragImageTab('upload')}
                  className={`px-3.5 py-2 rounded-t-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                    dragImageTab === 'upload'
                      ? 'bg-white text-amber-900 border-t-2 border-amber-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={() => setDragImageTab('url')}
                  className={`px-3.5 py-2 rounded-t-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                    dragImageTab === 'url'
                      ? 'bg-white text-amber-900 border-t-2 border-amber-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                  Image URL
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                {dragImageTab === 'clipart' && (
                  <div className="space-y-3">
                    {/* Search & Categories */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                        <input
                          value={dragImageSearch}
                          onChange={e => setDragImageSearch(e.target.value)}
                          placeholder="Search apple, dog, star, coin, bus..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300"
                        />
                      </div>
                    </div>

                    {/* Category pills */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDragImageCategory('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                          dragImageCategory === 'all'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        All
                      </button>
                      {CLIPART_FAMILIES.map(fam => (
                        <button
                          key={fam.id}
                          type="button"
                          onClick={() => setDragImageCategory(fam.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                            dragImageCategory === fam.id
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <span>{fam.icon}</span>
                          <span>{fam.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Clipart Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-1 border border-stone-100 rounded-2xl bg-stone-50/50">
                      {filteredCliparts.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectClipart(item)}
                          className="p-2 rounded-xl bg-white border border-stone-200 hover:border-amber-500 hover:bg-amber-50 hover:scale-105 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs group text-center"
                        >
                          <div className="w-10 h-10 flex items-center justify-center">
                            <ClipartImage clipart={item} size="md" />
                          </div>
                          <span className="text-[10px] font-extrabold text-stone-800 group-hover:text-amber-950 truncate w-full">
                            {item.name}
                          </span>
                        </button>
                      ))}
                      {filteredCliparts.length === 0 && (
                        <div className="col-span-full py-8 text-center text-xs text-stone-400 font-bold">
                          No cliparts found matching &quot;{dragImageSearch}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {dragImageTab === 'upload' && (
                  <div className="space-y-4 py-4 text-center">
                    <input
                      ref={dragFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => dragFileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-3xl p-8 hover:bg-amber-50/40 transition cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Upload className="w-7 h-7" />
                      </div>
                      <p className="font-black text-sm text-stone-800">
                        Click to select an image from your computer
                      </p>
                      <p className="text-xs text-stone-500">
                        Supports PNG, JPG, WebP, and SVG files. Converted instantly for 100% offline reliability.
                      </p>
                    </div>
                  </div>
                )}

                {dragImageTab === 'url' && (
                  <div className="space-y-3 py-2">
                    <label className="block text-xs font-bold text-stone-700">
                      Direct Web Image URL or App Asset Path:
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={dragImageUrlInput}
                        onChange={e => setDragImageUrlInput(e.target.value)}
                        placeholder="https://example.com/image.png or /assets/icon-bee.webp"
                        className="flex-1 p-2.5 rounded-xl border border-stone-200 text-xs font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        disabled={!dragImageUrlInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs cursor-pointer shadow-xs transition"
                      >
                        Apply
                      </button>
                    </div>
                    {dragImageUrlInput.trim() && (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                        <span className="text-[11px] font-bold text-stone-500">URL Preview:</span>
                        <img 
                          src={dragImageUrlInput.trim()} 
                          alt="Preview" 
                          className="w-12 h-12 object-contain rounded-lg border bg-white" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-stone-50 px-5 py-3 border-t border-stone-200 flex items-center justify-between">
                {currentVal ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs cursor-pointer transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Current Image
                  </button>
                ) : (
                  <span className="text-[11px] text-stone-400 font-bold">No image currently attached</span>
                )}
                <button
                  type="button"
                  onClick={() => setDragItemImagePicker(null)}
                  className="px-4 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 font-bold text-xs text-stone-700 cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LIVE PREVIEW MODAL */}
      {previewOpen && (
        <QuestionPreviewModal question={previewDraft} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}
