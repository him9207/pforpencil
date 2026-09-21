import { CurriculumGrade, CurriculumSubject } from '../types';
import { loadCurriculumMaster } from './curriculumMasterData';
import { INITIAL_GRADES, INITIAL_SUBJECTS } from '../mockData';

export interface CategoryMasterRecord {
  id: string;
  code: string;
  curriculumId: string;
  subjectId: string;
  /** Category is scoped to Curriculum + Subject + Grade. */
  gradeId?: string;
  name: string;
  description: string;
  active: boolean;
}

export interface SkillMasterRecord {
  id: string;
  code: string;
  categoryId: string;
  gradeId: string;
  name: string;
  curriculumReference?: string;
  learningObjective?: string;
  description?: string;
  active: boolean;
}

export interface QuestionBankMasterData {
  categories: CategoryMasterRecord[];
  skills: SkillMasterRecord[];
}

export const QUESTION_BANK_MASTER_STORAGE_KEY = 'funlearn_question_bank_masters_v3';

const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const codeFromName = (v: string, prefix = 'CAT') => `${prefix}-${slug(v).split('-').filter(Boolean).map(x => x.slice(0,3)).join('').slice(0,8).toUpperCase() || 'ITEM'}`;

const normalizeCategoryKey = (curriculumId: string, subjectId: string, gradeId: string, name: string) =>
  `${curriculumId}::${subjectId}::${gradeId}::${String(name || '').trim().toLocaleLowerCase()}`;

/**
 * Normalise persisted master data without changing the public hierarchy.
 * Categories are unique, case-insensitively, within Curriculum + Subject + Grade.
 * If old data contains duplicates, keep the record with the most skills and
 * re-point the duplicate category's skills to the surviving category.
 */
function normalizeMasterData(data: QuestionBankMasterData, grades: CurriculumGrade[] = []): QuestionBankMasterData {
  const sourceCategories = [...(data.categories || [])];
  const sourceSkills = [...(data.skills || [])];
  const activeGrades = grades.filter(g => g.active);

  // Older v2/v3 records did not have gradeId on Category. Preserve existing
  // relationships where possible: if a legacy category has skills for one or
  // more grades, the original category becomes the first grade-specific record
  // and additional grade records are cloned. Categories with no grade clues are
  // assigned to the first active grade so they do not leak into every grade.
  const expanded: CategoryMasterRecord[] = [];
  const originalToGradeCategory = new Map<string, Map<string, string>>();
  for (const category of sourceCategories) {
    const relatedGrades = Array.from(new Set(
      sourceSkills.filter(s => s.categoryId === category.id).map(s => s.gradeId).filter(Boolean)
    ));
    const targetGrades = category.gradeId
      ? [category.gradeId]
      : (relatedGrades.length ? relatedGrades : (activeGrades[0] ? [activeGrades[0].id] : ['LEGACY-GRADE']));

    const gradeMap = new Map<string, string>();
    targetGrades.forEach((gradeId, index) => {
      const id = index === 0 && !category.gradeId ? category.id :
        (category.gradeId ? category.id : `${category.id}-${gradeId}`);
      const clone: CategoryMasterRecord = { ...category, id, gradeId };
      expanded.push(clone);
      gradeMap.set(gradeId, id);
    });
    originalToGradeCategory.set(category.id, gradeMap);
  }

  // Collapse duplicate Category records by Curriculum + Subject + Grade +
  // case-insensitive name. Prefer active records, then the record with more skills.
  const byKey = new Map<string, CategoryMasterRecord>();
  const duplicateToSurvivor = new Map<string, string>();
  for (const category of expanded) {
    const key = normalizeCategoryKey(category.curriculumId, category.subjectId, category.gradeId || '', category.name);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, category);
      continue;
    }
    const existingSkillCount = sourceSkills.filter(s => s.categoryId === existing.id).length;
    const currentSkillCount = sourceSkills.filter(s => s.categoryId === category.id).length;
    const currentWins = (category.active && !existing.active) ||
      (category.active === existing.active && currentSkillCount > existingSkillCount);
    const survivor = currentWins ? category : existing;
    const duplicate = currentWins ? existing : category;
    byKey.set(key, survivor);
    duplicateToSurvivor.set(duplicate.id, survivor.id);
  }

  // Re-point skills from duplicate/legacy category IDs to the grade-specific
  // survivor. Skills themselves remain grade-specific.
  const normalizedSkills = sourceSkills.map(skill => {
    const direct = duplicateToSurvivor.get(skill.categoryId);
    if (direct) return { ...skill, categoryId: direct };
    const gradeMap = originalToGradeCategory.get(skill.categoryId);
    const gradeSpecific = gradeMap?.get(skill.gradeId);
    return { ...skill, categoryId: gradeSpecific || skill.categoryId };
  });

  return { categories: Array.from(byKey.values()), skills: normalizedSkills };
}

interface CurriculumStandardTemplate {
  category: string;
  categoryCode: string;
  skills: { name: string; code: string }[];
}

const STANDARD_CURRICULUM_TEMPLATES: Record<string, CurriculumStandardTemplate[]> = {
  preschool: [
    {
      category: 'Counting & Cardinality',
      categoryCode: 'CAT-CNT',
      skills: [
        { name: 'Counting 1 to 5', code: 'SK-CNT-01' },
        { name: 'One-to-One Correspondence', code: 'SK-CNT-02' },
        { name: 'Counting Objects to 5', code: 'SK-CNT-03' }
      ]
    },
    {
      category: 'Shapes & Colors',
      categoryCode: 'CAT-SHP',
      skills: [
        { name: 'Circle Recognition', code: 'SK-SHP-01' },
        { name: 'Shape Sorting', code: 'SK-SHP-02' }
      ]
    },
    {
      category: 'Size & Comparison',
      categoryCode: 'CAT-CMP',
      skills: [
        { name: 'Big vs Small', code: 'SK-CMP-01' },
        { name: 'Length Comparison', code: 'SK-CMP-02' }
      ]
    },
    {
      category: 'Patterns & Sorting',
      categoryCode: 'CAT-PAT',
      skills: [
        { name: 'AB Color Pattern', code: 'SK-PAT-01' },
        { name: 'Object Classification', code: 'SK-PAT-02' }
      ]
    },
    {
      category: 'Numbers & Quantities',
      categoryCode: 'CAT-NUM',
      skills: [
        { name: 'Recognizing Number 4', code: 'SK-NUM-01' },
        { name: 'Number Sequencing', code: 'SK-NUM-02' },
        { name: 'Number Line Counting', code: 'SK-NUM-03' }
      ]
    },
    {
      category: 'Living Things & Nature',
      categoryCode: 'CAT-BIO',
      skills: [
        { name: 'Baby Animals', code: 'SK-BIO-01' },
        { name: 'Animal Habitats', code: 'SK-BIO-02' },
        { name: 'Animal Families', code: 'SK-BIO-03' },
        { name: 'Animal Diets', code: 'SK-BIO-04' }
      ]
    },
    {
      category: 'Time & Measurement',
      categoryCode: 'CAT-TIME',
      skills: [
        { name: 'Telling Time (Hour)', code: 'SK-TIME-01' }
      ]
    }
  ],
  foundation: [
    {
      category: 'Counting & Cardinality',
      categoryCode: 'CAT-CNT',
      skills: [
        { name: 'Counting 1 to 10', code: 'SK-CNT-04' },
        { name: 'Counting Objects to 10', code: 'SK-CNT-05' },
        { name: 'Comparing Quantities', code: 'SK-CNT-06' }
      ]
    },
    {
      category: 'Operations & Algebraic Thinking',
      categoryCode: 'CAT-OPS',
      skills: [
        { name: 'Basic Addition within 5', code: 'SK-OPS-01' },
        { name: 'Basic Subtraction within 5', code: 'SK-OPS-02' },
        { name: 'Addition Within 10', code: 'SK-OPS-03' }
      ]
    },
    {
      category: 'Geometry',
      categoryCode: 'CAT-GEO',
      skills: [
        { name: 'Square vs Rectangle', code: 'SK-GEO-01' },
        { name: 'Identifying Triangles', code: 'SK-GEO-02' }
      ]
    },
    {
      category: 'Comparison & Sorting',
      categoryCode: 'CAT-CMP',
      skills: [
        { name: 'Greater Than / Less Than', code: 'SK-CMP-03' }
      ]
    }
  ],
  grade1: [
    {
      category: 'Addition & Subtraction',
      categoryCode: 'CAT-ADD',
      skills: [
        { name: 'Addition within 20', code: 'SK-ADD-01' },
        { name: 'Subtraction within 20', code: 'SK-ADD-02' }
      ]
    },
    {
      category: 'Place Value & Base Ten',
      categoryCode: 'CAT-PV',
      skills: [
        { name: 'Tens and Ones', code: 'SK-PV-01' }
      ]
    },
    {
      category: 'Time & Measurement',
      categoryCode: 'CAT-TIME',
      skills: [
        { name: 'Reading Clocks to the Half Hour', code: 'SK-TIME-02' }
      ]
    },
    {
      category: 'Geometry',
      categoryCode: 'CAT-GEO',
      skills: [
        { name: '2D and 3D Shapes', code: 'SK-GEO-03' }
      ]
    },
    {
      category: 'Patterns & Logic',
      categoryCode: 'CAT-PAT',
      skills: [
        { name: 'Number Patterns', code: 'SK-PAT-03' }
      ]
    }
  ],
  grade2: [
    {
      category: 'Addition & Subtraction',
      categoryCode: 'CAT-ADD',
      skills: [
        { name: 'Two-Digit Addition', code: 'SK-ADD-03' },
        { name: 'Word Problems', code: 'SK-ADD-04' }
      ]
    },
    {
      category: 'Place Value & Base Ten',
      categoryCode: 'CAT-PV',
      skills: [
        { name: 'Hundreds, Tens and Ones', code: 'SK-PV-02' }
      ]
    },
    {
      category: 'Multiplication Foundations',
      categoryCode: 'CAT-MUL',
      skills: [
        { name: 'Repeated Addition', code: 'SK-MUL-01' },
        { name: 'Equal Groups', code: 'SK-MUL-02' }
      ]
    },
    {
      category: 'Money & Currency',
      categoryCode: 'CAT-MNY',
      skills: [
        { name: 'Coins and Notes Value', code: 'SK-MNY-01' }
      ]
    },
    {
      category: 'Fractions Foundations',
      categoryCode: 'CAT-FRAC',
      skills: [
        { name: 'Halves and Quarters', code: 'SK-FRAC-01' }
      ]
    }
  ],
  grade3: [
    {
      category: 'Multiplication & Division',
      categoryCode: 'CAT-MUL',
      skills: [
        { name: 'Times Tables Mastery', code: 'SK-MUL-03' },
        { name: 'Division with Remainders', code: 'SK-MUL-04' }
      ]
    },
    {
      category: 'Fractions',
      categoryCode: 'CAT-FRAC',
      skills: [
        { name: 'Visual Fractions', code: 'SK-FRAC-02' },
        { name: 'Equivalent Fractions', code: 'SK-FRAC-03' }
      ]
    },
    {
      category: 'Geometry & Measurement',
      categoryCode: 'CAT-GEO',
      skills: [
        { name: 'Perimeter & Area', code: 'SK-GEO-04' }
      ]
    }
  ]
};

function purgeLegacyPreschoolMasters(data: QuestionBankMasterData): QuestionBankMasterData {
  const cleanCategories = data.categories.filter(c => 
    c.name.trim().toLowerCase() !== 'preschool wonder world' &&
    !c.id.includes('CAT-PRE-WNDR')
  );
  const cleanSkills = data.skills.filter(s => 
    s.name.trim().toLowerCase() !== 'early discovery & play quest' &&
    !s.id.includes('SKL-PRE-QUEST')
  );
  return { categories: cleanCategories, skills: cleanSkills };
}

function ensureCurriculumStandards(data: QuestionBankMasterData, grades: CurriculumGrade[], subjects: CurriculumSubject[]): QuestionBankMasterData {
  const mathSubject = subjects.find(s => s.name.toLowerCase().includes('math')) || { id: 'SUB_MTH', name: 'Mathematics', active: true };
  const categories = [...data.categories];
  const skills = [...data.skills];

  const curriculaIds = [
    'CUR-CCSS', 'CUR-CBSE', 'CUR-UKNC', 'CUR-ACARA', 'CUR-GLOBAL', 'CUR-VCAA20', 'CUR-ON', 'CUR-IBPYP'
  ];

  grades.forEach(grade => {
    const gradeNameLower = grade.name.toLowerCase();
    let templateKey: string | null = null;
    if (gradeNameLower.includes('pre')) templateKey = 'preschool';
    else if (gradeNameLower.includes('found')) templateKey = 'foundation';
    else if (gradeNameLower.includes('1') || gradeNameLower.includes('one')) templateKey = 'grade1';
    else if (gradeNameLower.includes('2') || gradeNameLower.includes('two')) templateKey = 'grade2';
    else if (gradeNameLower.includes('3') || gradeNameLower.includes('three')) templateKey = 'grade3';

    if (!templateKey || !STANDARD_CURRICULUM_TEMPLATES[templateKey]) return;

    const templates = STANDARD_CURRICULUM_TEMPLATES[templateKey];

    curriculaIds.forEach(currId => {
      templates.forEach(tpl => {
        const catId = `CAT-${currId}-${grade.id}-${slug(tpl.category)}`;
        let catIndex = categories.findIndex(c => 
          c.id === catId || 
          (c.curriculumId === currId && c.gradeId === grade.id && c.name.toLowerCase() === tpl.category.toLowerCase())
        );

        let actualCatId = catId;
        if (catIndex >= 0) {
          actualCatId = categories[catIndex].id;
          // Retain existing active status if set by user
          if (categories[catIndex].active === undefined) {
            categories[catIndex].active = true;
          }
        } else {
          categories.push({
            id: catId,
            code: tpl.categoryCode,
            curriculumId: currId,
            subjectId: mathSubject.id,
            gradeId: grade.id,
            name: tpl.category,
            description: `${tpl.category} standard curriculum area`,
            active: true
          });
        }

        tpl.skills.forEach(skl => {
          const skillId = `SKL-${actualCatId}-${grade.id}-${slug(skl.name)}`;
          const skillIndex = skills.findIndex(s => 
            s.id === skillId || 
            (s.categoryId === actualCatId && s.gradeId === grade.id && s.name.toLowerCase() === skl.name.toLowerCase())
          );

          if (skillIndex >= 0) {
            // Retain existing active status if set by user
            if (skills[skillIndex].active === undefined) {
              skills[skillIndex].active = true;
            }
          } else {
            skills.push({
              id: skillId,
              code: skl.code,
              categoryId: actualCatId,
              gradeId: grade.id,
              name: skl.name,
              description: `Practice drill for ${skl.name}`,
              active: true
            });
          }
        });
      });
    });
  });

  return { categories, skills };
}

export function loadQuestionBankMasters(grades: CurriculumGrade[] = INITIAL_GRADES, subjects: CurriculumSubject[] = INITIAL_SUBJECTS): QuestionBankMasterData {
  const activeGrades = grades.filter(g => g.active);
  try {
    const raw = localStorage.getItem(QUESTION_BANK_MASTER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.categories) && Array.isArray(parsed?.skills)) {
        const cleaned = purgeLegacyPreschoolMasters(parsed);
        const enriched = ensureCurriculumStandards(cleaned, grades, subjects);
        return normalizeMasterData(enriched, grades);
      }
    }
  } catch {}

  const initial = ensureCurriculumStandards({ categories: [], skills: [] }, grades, subjects);
  return normalizeMasterData(initial, grades);
}
export function saveQuestionBankMasters(data: QuestionBankMasterData) {
  localStorage.setItem(QUESTION_BANK_MASTER_STORAGE_KEY, JSON.stringify(data));
}
