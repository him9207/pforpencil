import * as XLSX from 'xlsx';
import { Question, QuestionType, VisualAnimation, VisualQuestionTemplate } from '../types';
import { CLIPART_LIBRARY, lookupClipart, resolveClipartString } from '../data/clipartLibraryData';

export interface ParsedExcelResult {
  questions: Question[];
  errors: string[];
  warnings: string[];
  totalRowsProcessed?: number;
  validRowsCount?: number;
  failedRowsCount?: number;
}

export interface ExcelGenerationOptions {
  countryCode?: string;
  regionCode?: string;
  curriculumCode?: string;
  subjectCode?: string;
  gradeCode?: string;
  categoryCode?: string;
  skillCode?: string;
  targetGradeName?: string;
  targetCategoryName?: string;
  targetSkillName?: string;
  masterCategories?: any[];
  masterSkills?: any[];
  gradesList?: any[];
  subjectsList?: any[];
  curriculaList?: any[];
}

export const MASTER_CATEGORY_SKILL_CATALOG = [
  // Numbers & Quantities
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-01', skName: 'Recognizing Numbers & Counting', subject: 'SUB_MTH', grades: 'Preschool, Foundation, Grade 1' },
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-02', skName: 'Number Sequencing & Order', subject: 'SUB_MTH', grades: 'Preschool, Foundation, Grade 1' },
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-03', skName: 'Number Line Counting', subject: 'SUB_MTH', grades: 'Grade 1, Grade 2' },
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-04', skName: 'Integers and Absolute Value', subject: 'SUB_MTH', grades: 'Grade 6' },
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-05', skName: 'Four-Quadrant Coordinate Graphing', subject: 'SUB_MTH', grades: 'Grade 6' },
  // Counting & Cardinality
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-01', skName: 'Counting 1 to 5', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-02', skName: 'One-to-One Correspondence', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-03', skName: 'Counting Objects to 5', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-04', skName: 'Counting 1 to 10', subject: 'SUB_MTH', grades: 'Foundation' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-05', skName: 'Counting Objects to 10', subject: 'SUB_MTH', grades: 'Foundation' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-06', skName: 'Comparing Quantities', subject: 'SUB_MTH', grades: 'Foundation' },
  // Operations & Basic Arithmetic
  { catCode: 'CAT-OPS', catName: 'Operations & Algebraic Thinking', skCode: 'SK-OPS-01', skName: 'Basic Addition within 5', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-OPS', catName: 'Operations & Algebraic Thinking', skCode: 'SK-OPS-02', skName: 'Basic Subtraction within 5', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-OPS', catName: 'Operations & Algebraic Thinking', skCode: 'SK-OPS-03', skName: 'Addition within 10', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-OPS', catName: 'Multi-Digit Operations', skCode: 'SK-OPS-04', skName: 'Multi-Digit Multiplication', subject: 'SUB_MTH', grades: 'Grade 4' },
  { catCode: 'CAT-OPS', catName: 'Multi-Digit Operations', skCode: 'SK-OPS-05', skName: 'Long Division with Quotients', subject: 'SUB_MTH', grades: 'Grade 4, Grade 5' },
  // Addition & Subtraction
  { catCode: 'CAT-ADD', catName: 'Addition & Subtraction', skCode: 'SK-ADD-01', skName: 'Addition within 20', subject: 'SUB_MTH', grades: 'Grade 1, Grade 2' },
  { catCode: 'CAT-ADD', catName: 'Addition & Subtraction', skCode: 'SK-ADD-02', skName: 'Subtraction within 20', subject: 'SUB_MTH', grades: 'Grade 1, Grade 2' },
  { catCode: 'CAT-ADD', catName: 'Addition & Subtraction', skCode: 'SK-ADD-03', skName: 'Two-Digit Addition', subject: 'SUB_MTH', grades: 'Grade 2, Grade 3' },
  { catCode: 'CAT-ADD', catName: 'Addition & Subtraction', skCode: 'SK-ADD-04', skName: 'Word Problems', subject: 'SUB_MTH', grades: 'Grade 2, Grade 3' },
  // Place Value
  { catCode: 'CAT-PV', catName: 'Place Value & Base Ten', skCode: 'SK-PV-01', skName: 'Tens and Ones', subject: 'SUB_MTH', grades: 'Grade 1, Grade 2' },
  { catCode: 'CAT-PV', catName: 'Place Value & Base Ten', skCode: 'SK-PV-02', skName: 'Hundreds, Tens and Ones', subject: 'SUB_MTH', grades: 'Grade 2, Grade 3' },
  // Multiplication & Division
  { catCode: 'CAT-MUL', catName: 'Multiplication & Division', skCode: 'SK-MUL-01', skName: 'Repeated Addition', subject: 'SUB_MTH', grades: 'Grade 2' },
  { catCode: 'CAT-MUL', catName: 'Multiplication & Division', skCode: 'SK-MUL-02', skName: 'Equal Groups', subject: 'SUB_MTH', grades: 'Grade 2, Grade 3' },
  { catCode: 'CAT-MUL', catName: 'Multiplication & Division', skCode: 'SK-MUL-03', skName: 'Times Tables Mastery', subject: 'SUB_MTH', grades: 'Grade 3, Grade 4' },
  { catCode: 'CAT-MUL', catName: 'Multiplication & Division', skCode: 'SK-MUL-04', skName: 'Division with Remainders', subject: 'SUB_MTH', grades: 'Grade 3, Grade 4' },
  // Fractions & Decimals
  { catCode: 'CAT-FRAC', catName: 'Fractions Foundations', skCode: 'SK-FRAC-01', skName: 'Halves and Quarters', subject: 'SUB_MTH', grades: 'Grade 2' },
  { catCode: 'CAT-FRAC', catName: 'Fractions', skCode: 'SK-FRAC-02', skName: 'Visual Fractions', subject: 'SUB_MTH', grades: 'Grade 3' },
  { catCode: 'CAT-FRAC', catName: 'Fractions', skCode: 'SK-FRAC-03', skName: 'Equivalent Fractions', subject: 'SUB_MTH', grades: 'Grade 3, Grade 4' },
  { catCode: 'CAT-FRAC', catName: 'Fractions & Decimals', skCode: 'SK-FRAC-04', skName: 'Adding Fractions with Like Denominators', subject: 'SUB_MTH', grades: 'Grade 4' },
  { catCode: 'CAT-FRAC', catName: 'Fractions & Decimals', skCode: 'SK-FRAC-05', skName: 'Decimals and Tenths/Hundredths', subject: 'SUB_MTH', grades: 'Grade 4' },
  { catCode: 'CAT-FRAC', catName: 'Fractions & Operations', skCode: 'SK-FRAC-06', skName: 'Adding & Subtracting Unlike Fractions', subject: 'SUB_MTH', grades: 'Grade 5' },
  { catCode: 'CAT-FRAC', catName: 'Fractions & Operations', skCode: 'SK-FRAC-07', skName: 'Multiplying Fractions', subject: 'SUB_MTH', grades: 'Grade 5' },
  // Geometry & Shapes
  { catCode: 'CAT-SHP', catName: 'Shapes & Colors', skCode: 'SK-SHP-01', skName: 'Circle Recognition', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-SHP', catName: 'Shapes & Colors', skCode: 'SK-SHP-02', skName: 'Shape Sorting', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-GEO', catName: 'Geometry & Shapes', skCode: 'SK-GEO-01', skName: 'Square vs Rectangle', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-GEO', catName: 'Geometry & Shapes', skCode: 'SK-GEO-02', skName: 'Identifying Triangles', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-GEO', catName: 'Geometry & Shapes', skCode: 'SK-GEO-03', skName: '2D and 3D Shapes', subject: 'SUB_MTH', grades: 'Grade 1, Grade 2' },
  { catCode: 'CAT-GEO', catName: 'Geometry & Measurement', skCode: 'SK-GEO-04', skName: 'Perimeter & Area', subject: 'SUB_MTH', grades: 'Grade 3, Grade 4' },
  { catCode: 'CAT-GEO', catName: 'Angles & Geometry', skCode: 'SK-GEO-05', skName: 'Measuring Angles (Protractor)', subject: 'SUB_MTH', grades: 'Grade 4' },
  { catCode: 'CAT-GEO', catName: 'Angles & Geometry', skCode: 'SK-GEO-06', skName: 'Classifying Triangles and Quadrilaterals', subject: 'SUB_MTH', grades: 'Grade 4' },
  // Patterns & Comparison
  { catCode: 'CAT-PAT', catName: 'Patterns & Logic', skCode: 'SK-PAT-01', skName: 'AB Color Pattern', subject: 'SUB_MTH', grades: 'Preschool, Foundation' },
  { catCode: 'CAT-PAT', catName: 'Patterns & Logic', skCode: 'SK-PAT-02', skName: 'Object Classification', subject: 'SUB_MTH', grades: 'Preschool, Foundation' },
  { catCode: 'CAT-PAT', catName: 'Patterns & Logic', skCode: 'SK-PAT-03', skName: 'Number & Shape Patterns', subject: 'SUB_MTH', grades: 'Grade 1, Grade 2' },
  { catCode: 'CAT-CMP', catName: 'Size & Comparison', skCode: 'SK-CMP-01', skName: 'Big vs Small', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-CMP', catName: 'Size & Comparison', skCode: 'SK-CMP-02', skName: 'Length Comparison', subject: 'SUB_MTH', grades: 'Preschool, Foundation' },
  { catCode: 'CAT-CMP', catName: 'Comparison & Sorting', skCode: 'SK-CMP-03', skName: 'Greater Than / Less Than', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  // Time & Measurement
  { catCode: 'CAT-TIME', catName: 'Time & Measurement', skCode: 'SK-TIME-01', skName: 'Telling Time (Hour)', subject: 'SUB_MTH', grades: 'Preschool, Foundation' },
  { catCode: 'CAT-TIME', catName: 'Time & Measurement', skCode: 'SK-TIME-02', skName: 'Reading Clocks to the Half Hour', subject: 'SUB_MTH', grades: 'Grade 1, Grade 2' },
  { catCode: 'CAT-MNY', catName: 'Money & Currency', skCode: 'SK-MNY-01', skName: 'Coins and Notes Value', subject: 'SUB_MTH', grades: 'Grade 2, Grade 3' },
  { catCode: 'CAT-MEAS', catName: 'Volume & Measurement', skCode: 'SK-MEAS-01', skName: 'Volume of Rectangular Prisms', subject: 'SUB_MTH', grades: 'Grade 5' },
  { catCode: 'CAT-MEAS', catName: 'Volume & Measurement', skCode: 'SK-MEAS-02', skName: 'Metric Unit Conversions', subject: 'SUB_MTH', grades: 'Grade 5' },
  // Decimals & Percentages & Ratios
  { catCode: 'CAT-DEC', catName: 'Decimals & Percentages', skCode: 'SK-DEC-01', skName: 'Decimal Multiplication and Division', subject: 'SUB_MTH', grades: 'Grade 5' },
  { catCode: 'CAT-DEC', catName: 'Decimals & Percentages', skCode: 'SK-DEC-02', skName: 'Introduction to Percentages', subject: 'SUB_MTH', grades: 'Grade 5' },
  { catCode: 'CAT-RATIO', catName: 'Ratios & Proportions', skCode: 'SK-RAT-01', skName: 'Understanding Ratios and Unit Rates', subject: 'SUB_MTH', grades: 'Grade 6' },
  { catCode: 'CAT-RATIO', catName: 'Ratios & Proportions', skCode: 'SK-RAT-02', skName: 'Solving Proportions and Percent Problems', subject: 'SUB_MTH', grades: 'Grade 6' },
  { catCode: 'CAT-ALG', catName: 'Algebraic Expressions & Equations', skCode: 'SK-ALG-01', skName: 'Writing Algebraic Expressions', subject: 'SUB_MTH', grades: 'Grade 6' },
  { catCode: 'CAT-ALG', catName: 'Algebraic Expressions & Equations', skCode: 'SK-ALG-02', skName: 'One-Step Linear Equations', subject: 'SUB_MTH', grades: 'Grade 6' },
  { catCode: 'CAT-DATA', catName: 'Word Problems & Data', skCode: 'SK-DATA-01', skName: 'Reading Bar Graphs', subject: 'SUB_MTH', grades: 'Grade 3' },
  { catCode: 'CAT-DATA', catName: 'Word Problems & Data', skCode: 'SK-DATA-02', skName: 'Two-Step Word Problems', subject: 'SUB_MTH', grades: 'Grade 3' }
];

export function resolveGradeMapping(raw: string, gradesList?: Array<{ id: string; name: string }>): { id: string; name: string } {
  const trimmed = (raw || '').trim();
  const lower = trimmed.toLowerCase().replace(/[\s_-]+/g, '');
  
  if (gradesList && gradesList.length > 0) {
    const matched = gradesList.find(g => 
      g.id.toLowerCase() === trimmed.toLowerCase() ||
      g.name.toLowerCase() === trimmed.toLowerCase() ||
      g.id.toLowerCase().replace(/[\s_-]+/g, '') === lower ||
      g.name.toLowerCase().replace(/[\s_-]+/g, '') === lower
    );
    if (matched) return { id: matched.id, name: matched.name };
  }

  if (lower.includes('pre') || lower === 'pk' || lower === 'grdpre' || lower === 'grdprek' || lower === 'preschool') {
    return { id: 'GRD_PRE_K', name: 'Preschool' };
  }
  if (lower.includes('found') || lower.includes('kinder') || lower === 'kg' || lower === 'fnd' || lower === 'grdkg' || lower === 'grdfnd') {
    return { id: 'GRD_KG', name: 'Foundation' };
  }
  if (lower === 'grdg1' || lower === 'g1' || lower === 'grade1' || lower === '1' || lower === 'year1' || lower === 'class1') {
    return { id: 'GRD_G1', name: 'Grade 1' };
  }
  if (lower === 'grdg2' || lower === 'g2' || lower === 'grade2' || lower === '2' || lower === 'year2' || lower === 'class2') {
    return { id: 'GRD_G2', name: 'Grade 2' };
  }
  if (lower === 'grdg3' || lower === 'g3' || lower === 'grade3' || lower === '3' || lower === 'year3' || lower === 'class3') {
    return { id: 'GRD_G3', name: 'Grade 3' };
  }
  if (lower === 'grdg4' || lower === 'g4' || lower === 'grade4' || lower === '4' || lower === 'year4' || lower === 'class4') {
    return { id: 'GRD_G4', name: 'Grade 4' };
  }
  if (lower === 'grdg5' || lower === 'g5' || lower === 'grade5' || lower === '5' || lower === 'year5' || lower === 'class5') {
    return { id: 'GRD_G5', name: 'Grade 5' };
  }
  if (lower === 'grdg6' || lower === 'g6' || lower === 'grade6' || lower === '6' || lower === 'year6' || lower === 'class6') {
    return { id: 'GRD_G6', name: 'Grade 6' };
  }

  return { id: trimmed || 'GRD_G1', name: trimmed || 'Grade 1' };
}

export function resolveSubjectMapping(raw: string, subjectsList?: Array<{ id: string; name: string }>): { id: string; name: string } {
  const trimmed = (raw || '').trim();
  const lower = trimmed.toLowerCase();
  if (subjectsList && subjectsList.length > 0) {
    const matched = subjectsList.find(s => 
      s.id.toLowerCase() === lower || s.name.toLowerCase() === lower
    );
    if (matched) return { id: matched.id, name: matched.name };
  }
  if (lower.includes('math') || lower === 'sub_mth') return { id: 'SUB_MTH', name: 'Mathematics' };
  if (lower.includes('sci') || lower === 'sub_sci') return { id: 'SUB_SCI', name: 'Science' };
  if (lower.includes('eng') || lower.includes('phon') || lower.includes('lang') || lower === 'sub_eng') return { id: 'SUB_ENG', name: 'English' };
  if (lower.includes('art') || lower === 'sub_art') return { id: 'SUB_ART', name: 'Art' };
  return { id: trimmed || 'SUB_MTH', name: trimmed || 'Mathematics' };
}

export function resolveCurriculumMapping(raw: string, curriculaList?: Array<{ id: string; code?: string; name: string }>): { id: string; code: string; name: string } {
  const trimmed = (raw || '').trim();
  const lower = trimmed.toLowerCase();
  if (curriculaList && curriculaList.length > 0) {
    const matched = curriculaList.find(c => 
      c.id.toLowerCase() === lower || (c.code && c.code.toLowerCase() === lower) || c.name.toLowerCase() === lower
    );
    if (matched) return { id: matched.id, code: matched.code || matched.id, name: matched.name };
  }
  if (lower.includes('vcaa')) return { id: 'CUR-VCAA20', code: 'CUR-VCAA20', name: 'Victorian Curriculum 2.0 (Australia)' };
  if (lower.includes('acara') || lower.includes('aust')) return { id: 'CUR-ACARA', code: 'CUR-ACARA', name: 'Australian Curriculum (ACARA)' };
  if (lower.includes('ccss') || lower.includes('common core') || lower.includes('us')) return { id: 'CUR-CCSS', code: 'CUR-CCSS', name: 'Common Core (US)' };
  if (lower.includes('cbse') || lower.includes('india')) return { id: 'CUR-CBSE', code: 'CUR-CBSE', name: 'CBSE (India)' };
  if (lower.includes('uk') || lower.includes('national')) return { id: 'CUR-UKNC', code: 'CUR-UKNC', name: 'UK National Curriculum' };
  if (lower.includes('pyp') || lower.includes('ib')) return { id: 'CUR-IBPYP', code: 'CUR-IBPYP', name: 'IB Primary Years Programme' };
  if (lower.includes('ontario') || lower.includes('canada')) return { id: 'CUR-ON', code: 'CUR-ON', name: 'Ontario Curriculum (Canada)' };
  return { id: trimmed || 'CUR-GLOBAL', code: trimmed || 'CUR-GLOBAL', name: trimmed || 'Global Standard Framework' };
}

export interface CategorySkillResolution {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  skillId: string;
  skillCode: string;
  skillName: string;
  curriculumReference?: string;
  isValid: boolean;
  errorReason?: string;
}

export function resolveCategoryAndSkill(
  catInput: string,
  skInput: string,
  gradeId?: string,
  masterCategories?: any[],
  masterSkills?: any[],
  strictValidation: boolean = true
): CategorySkillResolution {
  const trimmedCat = (catInput || '').trim();
  const trimmedSk = (skInput || '').trim();
  const catLower = trimmedCat.toLowerCase();
  const skLower = trimmedSk.toLowerCase();

  if (!trimmedCat) {
    return {
      categoryId: '',
      categoryCode: '',
      categoryName: '',
      skillId: '',
      skillCode: '',
      skillName: '',
      isValid: false,
      errorReason: 'Category Name is missing.'
    };
  }

  if (!trimmedSk) {
    return {
      categoryId: '',
      categoryCode: '',
      categoryName: '',
      skillId: '',
      skillCode: '',
      skillName: '',
      isValid: false,
      errorReason: 'Skill Name is missing.'
    };
  }

  // 1. Check live master categories from Admin
  let matchedCat: any = undefined;
  if (masterCategories && masterCategories.length > 0) {
    matchedCat = masterCategories.find(c => 
      (c.name && c.name.toLowerCase() === catLower) ||
      (c.code && c.code.toLowerCase() === catLower) ||
      (c.id && c.id.toLowerCase() === catLower) ||
      (c.name && c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === catLower.replace(/[^a-z0-9]/g, ''))
    );
  }

  // 2. Check catalog fallback if no live master or not found
  let catalogMatch: any = undefined;
  if (!matchedCat) {
    catalogMatch = MASTER_CATEGORY_SKILL_CATALOG.find(entry => 
      entry.catName.toLowerCase() === catLower || entry.catCode.toLowerCase() === catLower
    );
  }

  if (!matchedCat && !catalogMatch) {
    if (strictValidation) {
      return {
        categoryId: '',
        categoryCode: '',
        categoryName: trimmedCat,
        skillId: '',
        skillCode: '',
        skillName: trimmedSk,
        isValid: false,
        errorReason: `Category "${trimmedCat}" was not found in the Admin master catalog. Categories must be created by an Admin in the portal first.`
      };
    }
  }

  const categoryCode = matchedCat?.code || catalogMatch?.catCode || `CAT-${trimmedCat.toUpperCase().slice(0, 4)}`;
  const categoryName = matchedCat?.name || catalogMatch?.catName || trimmedCat;
  const categoryId = matchedCat?.id || `CAT-${categoryCode}`;

  // 3. Match Skill under the validated Category
  let matchedSk: any = undefined;
  if (masterSkills && masterSkills.length > 0) {
    matchedSk = masterSkills.find(s => {
      const isBelong = (!s.categoryId || s.categoryId === categoryId || s.categoryCode === categoryCode || s.category === categoryName);
      const isNameMatch = (s.name && s.name.toLowerCase() === skLower) ||
                          (s.code && s.code.toLowerCase() === skLower) ||
                          (s.id && s.id.toLowerCase() === skLower) ||
                          (s.name && s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === skLower.replace(/[^a-z0-9]/g, ''));
      return isBelong && isNameMatch;
    });

    if (!matchedSk) {
      // Check across all skills in case category ID format differs slightly
      matchedSk = masterSkills.find(s => 
        (s.name && s.name.toLowerCase() === skLower) ||
        (s.code && s.code.toLowerCase() === skLower) ||
        (s.id && s.id.toLowerCase() === skLower)
      );
    }
  }

  let catalogSkillMatch: any = undefined;
  if (!matchedSk) {
    catalogSkillMatch = MASTER_CATEGORY_SKILL_CATALOG.find(entry => 
      (entry.skName.toLowerCase() === skLower || entry.skCode.toLowerCase() === skLower) &&
      (entry.catName.toLowerCase() === catLower || entry.catCode.toLowerCase() === catLower)
    ) || MASTER_CATEGORY_SKILL_CATALOG.find(entry => 
      entry.skName.toLowerCase() === skLower || entry.skCode.toLowerCase() === skLower
    );
  }

  if (!matchedSk && !catalogSkillMatch) {
    if (strictValidation) {
      return {
        categoryId,
        categoryCode,
        categoryName,
        skillId: '',
        skillCode: '',
        skillName: trimmedSk,
        isValid: false,
        errorReason: `Skill "${trimmedSk}" does not exist in Category "${categoryName}". Skills must be created by an Admin in the portal first.`
      };
    }
  }

  const skillCode = matchedSk?.code || catalogSkillMatch?.skCode || `SK-${trimmedSk.toUpperCase().slice(0, 4)}`;
  const skillName = matchedSk?.name || catalogSkillMatch?.skName || trimmedSk;
  const skillId = matchedSk?.id || `SKL-${categoryId}-${skillCode}`;
  const curriculumReference = matchedSk?.curriculumReference || catalogSkillMatch?.curriculumReference;

  return {
    categoryId,
    categoryCode,
    categoryName,
    skillId,
    skillCode,
    skillName,
    curriculumReference,
    isValid: true
  };
}

/**
 * Generate a complete, teacher-friendly Excel Workbook (.xlsx)
 * with Clipart Library, Master Codes, and Ready-to-Test Question Types.
 */
export function generateQuestionMasterExcel(options: ExcelGenerationOptions = {}): Blob {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1 (Tab 1): Questions (Question Bank - Primary Interactive Sheet)
  // -------------------------------------------------------------
  const questionsHeaders = [
    'Question Text',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer',
    'Clipart Reference',
    'Visual Count',
    'Visual Animation',
    'Visual Template',
    'Visual Instructions',
    'Question Type',
    'Difficulty',
    'Explanation',
    'Hint',
    'Curriculum',
    'Subject',
    'Grade',
    'Category Name',
    'Skill Name'
  ];

  const curr = options.curriculumCode || 'Victorian Curriculum 2.0 (Australia)';
  const subj = 'Mathematics';
  const grd = options.targetGradeName || 'Grade 1';
  const cat = options.targetCategoryName || 'Counting & Cardinality';
  const sk = options.targetSkillName || 'Counting 1 to 5';

  const sampleQuestionsRows = [
    // =========================================================================
    // 1. PICTURE COUNTING (Math Counting 1-10)
    // =========================================================================
    [
      'How many red apples are on the screen?',
      '2', '3', '4', '5',
      'B', 'apple', '3', 'bounce', 'picture_counting',
      'Tap each apple to count them!',
      'picture_counting', 'Easy',
      'There are 3 red apples on the screen.',
      'Count them one by one: 1, 2, 3.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many shiny golden stars do you see?',
      '3', '4', '5', '6',
      'C', 'star', '5', 'pulse', 'picture_counting',
      'Count all the glowing stars!',
      'picture_counting', 'Easy',
      'There are 5 shining golden stars.',
      'Tap on each star to keep track of your count.',
      curr, subj, grd, cat, sk
    ],
    [
      'Count the sweet chocolate cookies on the tray:',
      '1', '2', '3', '4',
      'B', 'cookie', '2', 'bounce', 'picture_counting',
      'Count the yummy cookies!',
      'picture_counting', 'Easy',
      'There are 2 chocolate chip cookies.',
      'Look closely at the screen.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many blue toy cars are parked here?',
      '2', '4', '6', '8',
      'B', 'car', '4', 'bounce', 'picture_counting',
      'Count each car in the parking lot.',
      'picture_counting', 'Easy',
      'There are 4 toy cars parked.',
      'Point and count 1, 2, 3, 4.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many hopping green frogs are near the pond?',
      '4', '5', '6', '7',
      'C', 'frog', '6', 'pop', 'picture_counting',
      'Count all the green frogs!',
      'picture_counting', 'Medium',
      'There are 6 green frogs in total.',
      'Count row by row.',
      curr, subj, grd, cat, sk
    ],
    [
      'Count the yellow ripe bananas:',
      '1', '2', '3', '4',
      'A', 'banana', '1', 'bounce', 'picture_counting',
      'Count the yellow banana.',
      'picture_counting', 'Easy',
      'There is 1 banana.',
      'There is only one banana on screen.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many colorful party balloons are floating in the sky?',
      '5', '6', '7', '8',
      'C', 'balloon', '7', 'float', 'picture_counting',
      'Count all the floating balloons!',
      'picture_counting', 'Medium',
      'There are 7 balloons floating up.',
      'Count carefully up to 7.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many sweet strawberries are ready to eat?',
      '6', '7', '8', '9',
      'C', 'strawberry', '8', 'bounce', 'picture_counting',
      'Count all the red strawberries.',
      'picture_counting', 'Medium',
      'There are 8 strawberries in total.',
      'Count 4 and 4 to make 8.',
      curr, subj, grd, cat, sk
    ],
    [
      'Count the friendly puppies playing together:',
      '2', '3', '4', '5',
      'C', 'dog', '4', 'bounce', 'picture_counting',
      'Count each puppy on the screen.',
      'picture_counting', 'Easy',
      'There are 4 puppies playing.',
      'Count each puppy: 1, 2, 3, 4.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many glowing hearts are shown here?',
      '7', '8', '9', '10',
      'D', 'heart', '10', 'pulse', 'picture_counting',
      'Count all 10 glowing hearts.',
      'picture_counting', 'Hard',
      'There are 10 hearts on the screen.',
      'Count in pairs: 2, 4, 6, 8, 10.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 2. PICTURE CHOICE (Math Shapes, Sizes & Quantities)
    // =========================================================================
    [
      'Which shape is a triangle with 3 straight sides?',
      'Red Circle', 'Orange Triangle', 'Blue Square', 'Golden Star',
      'B', 'circle_red|triangle|square_blue|star', '1', 'pop', 'picture_choice',
      'Tap the triangle shape.',
      'picture_choice', 'Easy',
      'The triangle has 3 straight sides and 3 corners.',
      'Look for the 3-sided shape.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Which group has MORE items (3 stars or 1 star)?',
      'Group with 1 Star', 'Group with 3 Stars', 'Both are equal', 'None',
      'B', 'star', '3', 'pulse', 'picture_choice',
      'Tap the group with more items.',
      'picture_choice', 'Easy',
      '3 stars is more than 1 star.',
      '3 is greater than 1.',
      curr, subj, grd, 'CAT-CMP', 'SK-CMP-01'
    ],
    [
      'Which shape is completely round with 0 straight sides?',
      'Square', 'Red Circle', 'Triangle', 'Rectangle',
      'B', 'square|circle|triangle|rectangle', '1', 'bounce', 'picture_choice',
      'Tap the round circle.',
      'picture_choice', 'Easy',
      'A circle is round and has no straight sides or corners.',
      'Look for the perfectly round shape.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Which shape has 4 equal straight sides and 4 square corners?',
      'Circle', 'Triangle', 'Blue Square', 'Oval',
      'C', 'circle|triangle|square|oval', '1', 'pulse', 'picture_choice',
      'Tap the square shape.',
      'picture_choice', 'Easy',
      'A square has 4 equal sides and 4 corners.',
      'Count the 4 equal sides.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Which number quantity represents a pair (2 objects)?',
      '1 Apple', '2 Apples', '3 Apples', '4 Apples',
      'B', 'apple', '2', 'bounce', 'picture_choice',
      'Tap the pair of 2 apples.',
      'picture_choice', 'Easy',
      'A pair always means 2 objects.',
      'Count 1, 2.',
      curr, subj, grd, cat, sk
    ],
    [
      'Which group shows LESS objects (2 cookies vs 5 cookies)?',
      '2 Cookies', '5 Cookies', 'Both are equal', 'None',
      'A', 'cookie', '2', 'bounce', 'picture_choice',
      'Tap the smaller group.',
      'picture_choice', 'Easy',
      '2 cookies is less than 5 cookies.',
      '2 is smaller than 5.',
      curr, subj, grd, 'CAT-CMP', 'SK-CMP-01'
    ],
    [
      'Which shape looks like a doorway or postcard with 2 long and 2 short sides?',
      'Rectangle', 'Circle', 'Triangle', 'Star',
      'A', 'rectangle|circle|triangle|star', '1', 'pulse', 'picture_choice',
      'Tap the rectangle.',
      'picture_choice', 'Easy',
      'A rectangle has 4 sides: 2 long sides and 2 short sides.',
      'Look for the oblong 4-sided shape.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Which object represents zero (0) items?',
      'Empty Basket', 'Basket with 1 Apple', 'Basket with 2 Apples', 'Basket with 3 Apples',
      'A', '', '', '', 'picture_choice',
      'Tap the option with zero items.',
      'picture_choice', 'Easy',
      'Zero means empty or having no items.',
      'Zero means none.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 3. SELECT OBJECTS / TAP TO COUNT (Math Cardinality)
    // =========================================================================
    [
      'Tap to select exactly 4 glowing stars on the screen:',
      '4', '3', '5', '2',
      'A', 'star', '6', 'pulse', 'picture_counting',
      'Tap 4 stars to select them!',
      'select_objects', 'Easy',
      'You tapped and counted 4 stars.',
      'Count 1, 2, 3, 4 as you tap each star.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select exactly 3 juicy red apples:',
      '3', '2', '4', '5',
      'A', 'apple', '5', 'bounce', 'picture_counting',
      'Tap 3 apples to place them in your basket!',
      'select_objects', 'Easy',
      'You selected 3 delicious apples.',
      'Tap 3 apples one by one.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select exactly 5 chocolate chip cookies:',
      '5', '4', '6', '3',
      'A', 'cookie', '7', 'bounce', 'picture_counting',
      'Tap 5 cookies to collect them!',
      'select_objects', 'Medium',
      'You collected 5 cookies.',
      'Stop tapping after reaching 5.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select 2 friendly toy cars:',
      '2', '1', '3', '4',
      'A', 'car', '4', 'bounce', 'picture_counting',
      'Tap 2 cars on the screen!',
      'select_objects', 'Easy',
      'You selected 2 toy cars.',
      'Tap just two cars.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select 6 colorful party balloons:',
      '6', '5', '7', '4',
      'A', 'balloon', '8', 'float', 'picture_counting',
      'Tap 6 balloons to pop them!',
      'select_objects', 'Medium',
      'You selected 6 party balloons.',
      'Count carefully up to 6.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select 1 golden star:',
      '1', '2', '3', '4',
      'A', 'star', '3', 'pulse', 'picture_counting',
      'Tap 1 star!',
      'select_objects', 'Easy',
      'You selected 1 star.',
      'Tap only one star.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 4. STANDARD MULTIPLE CHOICE (Math Operations & Number Sense)
    // =========================================================================
    [
      'What is 3 + 2?',
      '4', '5', '6', '7',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      '3 plus 2 equals 5.',
      'Start at 3 and count up 2 numbers.',
      curr, subj, grd, cat, sk
    ],
    [
      'What is 5 - 2?',
      '2', '3', '4', '5',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      '5 take away 2 leaves 3.',
      'Count backwards 2 steps from 5.',
      curr, subj, grd, cat, sk
    ],
    [
      'Which number comes immediately after 4 when counting?',
      '3', '5', '6', '7',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      'When counting, 5 comes right after 4.',
      'Count 1, 2, 3, 4, __.',
      curr, subj, grd, cat, sk
    ],
    [
      'Which number is smaller than 6?',
      '8', '9', '4', '7',
      'C', '', '', '', '', '',
      'multiple_choice', 'Easy',
      '4 is less than 6.',
      'Look for the number that comes before 6.',
      curr, subj, grd, cat, sk
    ],
    [
      'What is double of 2 (2 + 2)?',
      '3', '4', '5', '6',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      '2 + 2 = 4.',
      'Add 2 and 2 together.',
      curr, subj, grd, cat, sk
    ],
    [
      'Which number represents having nothing or an empty set?',
      '0', '1', '5', '10',
      'A', '', '', '', '', '',
      'multiple_choice', 'Easy',
      'Zero (0) means having no objects.',
      'Zero means empty.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 5. OPEN BOX / KEYPAD FILL IN THE BLANK (Math Calculations)
    // =========================================================================
    [
      'Calculate: 3 + 2 = ?',
      '5', '', '', '',
      '5', 'apple', '5', 'bounce', 'picture_counting',
      'Type the correct answer number into the box.',
      'open_box', 'Easy',
      '3 + 2 = 5.',
      'Add 2 to 3.',
      curr, subj, grd, cat, sk
    ],
    [
      'Calculate: 5 - 1 = ?',
      '4', '', '', '',
      '4', 'cookie', '4', 'bounce', 'picture_counting',
      'Type the answer in the box.',
      'open_box', 'Easy',
      '5 take away 1 equals 4.',
      'Count back 1 from 5.',
      curr, subj, grd, cat, sk
    ],
    [
      'What number is 1 more than 4?',
      '5', '', '', '',
      '5', 'star', '5', 'pulse', 'picture_counting',
      'Type the number.',
      'open_box', 'Easy',
      '4 + 1 = 5.',
      'Add 1 to 4.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many straight sides does a triangle have?',
      '3', '', '', '',
      '3', 'triangle', '1', 'pop', 'picture_choice',
      'Type the number of sides.',
      'open_box', 'Easy',
      'A triangle always has 3 straight sides.',
      'Count the sides of a triangle.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Complete the counting sequence: 1, 2, 3, _',
      '4', '', '', '',
      '4', '', '', '', '', '',
      'open_box', 'Easy',
      'Counting sequence: 1, 2, 3, 4.',
      'What comes after 3?',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 6. TRUE / FALSE (Math Statements)
    // =========================================================================
    [
      'True or False: A square has 4 equal straight sides.',
      'True', 'False', '', '',
      'True', 'square', '1', 'pulse', 'picture_choice',
      'Choose True or False.',
      'true_false', 'Easy',
      'Yes, all four sides of a square are straight and equal.',
      'Look at a square shape.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'True or False: 5 is greater than 2.',
      'True', 'False', '', '',
      'True', '', '', '', '', '',
      'true_false', 'Easy',
      'True. 5 is a bigger number than 2.',
      '5 items is more than 2 items.',
      curr, subj, grd, cat, sk
    ],
    [
      'True or False: 2 + 2 equals 4.',
      'True', 'False', '', '',
      'True', 'cookie', '4', 'bounce', 'picture_counting',
      'Select True or False.',
      'true_false', 'Easy',
      '2 + 2 = 4 is correct.',
      'Add 2 and 2.',
      curr, subj, grd, cat, sk
    ],
    [
      'True or False: A circle has 3 sharp corners.',
      'True', 'False', '', '',
      'False', 'circle', '1', 'pop', 'picture_choice',
      'Choose True or False.',
      'true_false', 'Easy',
      'False. A circle is round and has 0 corners.',
      'Does a circle have any sharp corners?',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'True or False: 3 take away 1 leaves 2.',
      'True', 'False', '', '',
      'True', '', '', '', '', '',
      'true_false', 'Easy',
      'True. 3 - 1 = 2.',
      'Take away 1 from 3.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 7. MATCH MAKING (Math Fact Connections)
    // =========================================================================
    [
      'Match each number digit to its written word:',
      '1 -> One', '2 -> Two', '3 -> Three', '4 -> Four',
      'All', '', '', '', '', '',
      'match_making', 'Easy',
      '1 is One, 2 is Two, 3 is Three, 4 is Four.',
      'Read the number words.',
      curr, subj, grd, cat, sk
    ],
    [
      'Match each shape to its number of sides:',
      'Triangle -> 3 Sides', 'Square -> 4 Sides', 'Circle -> 0 Sides', 'Rectangle -> 4 Sides',
      'All', 'triangle|square|circle', '3', 'pulse', 'picture_choice',
      'Match each shape to the count of its sides.',
      'match_making', 'Medium',
      'Triangle has 3 sides, square has 4, and circle has 0.',
      'Count sides on each shape.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Match each double addition fact to its sum:',
      '1 + 1 -> 2', '2 + 2 -> 4', '3 + 3 -> 6', '4 + 4 -> 8',
      'All', '', '', '', '', '',
      'match_making', 'Easy',
      '1+1=2, 2+2=4, 3+3=6, 4+4=8.',
      'Double each number.',
      curr, subj, grd, cat, sk
    ],
    [
      'Match each subtraction equation to its result:',
      '5 - 1 -> 4', '4 - 2 -> 2', '3 - 2 -> 1', '5 - 5 -> 0',
      'All', '', '', '', '', '',
      'match_making', 'Easy',
      '5-1=4, 4-2=2, 3-2=1, 5-5=0.',
      'Subtract to find the match.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 8. DRAG AND DROP (Math Categorization)
    // =========================================================================
    [
      'Drag each number into the Small Numbers (1-3) or Bigger Numbers (4-6) bin:',
      '1 -> Small Numbers (1-3)', '2 -> Small Numbers (1-3)', '5 -> Bigger Numbers (4-6)', '6 -> Bigger Numbers (4-6)',
      'All', '', '', '', '', '',
      'drag_and_drop', 'Easy',
      '1 and 2 are small numbers (1-3); 5 and 6 are bigger numbers (4-6).',
      'Compare each number to 3.',
      curr, subj, grd, cat, sk
    ],
    [
      'Drag each shape into its matching target box:',
      'Red Circle -> Circles Box', 'Blue Triangle -> Triangles Box', 'Green Circle -> Circles Box', 'Yellow Triangle -> Triangles Box',
      'All', 'circle|triangle', '2', 'pulse', 'picture_choice',
      'Drag circles to Circles Box and triangles to Triangles Box.',
      'drag_and_drop', 'Easy',
      'Group matching shapes together.',
      'Look at the number of sides.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Drag each number into Even or Odd bucket:',
      '2 -> Even Numbers', '3 -> Odd Numbers', '4 -> Even Numbers', '5 -> Odd Numbers',
      'All', '', '', '', '', '',
      'drag_and_drop', 'Medium',
      '2 and 4 are even; 3 and 5 are odd.',
      'Even numbers can be paired up equally.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 9. ORDERING (Math Number Sequencing)
    // =========================================================================
    [
      'Arrange these numbers in counting order from smallest to largest:',
      '1', '2', '3', '4',
      '1, 2, 3, 4', 'star', '4', 'pop', 'pattern',
      'Place numbers in counting order.',
      'ordering', 'Easy',
      'The counting order is 1, 2, 3, 4.',
      'Start with the smallest number 1.',
      curr, subj, grd, cat, sk
    ],
    [
      'Arrange the counting sequence from 5 to 8:',
      '5', '6', '7', '8',
      '5, 6, 7, 8', 'apple', '4', 'bounce', 'pattern',
      'Order numbers from 5 to 8.',
      'ordering', 'Easy',
      'The sequence is 5, 6, 7, 8.',
      'Count forwards starting at 5.',
      curr, subj, grd, cat, sk
    ],
    [
      'Arrange the countdown numbers from 5 down to 2:',
      '5', '4', '3', '2',
      '5, 4, 3, 2', 'balloon', '4', 'float', 'pattern',
      'Order the numbers counting backwards.',
      'ordering', 'Easy',
      'Counting backwards: 5, 4, 3, 2.',
      'Start with 5 and count down.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 10. SORTING (Math Classification)
    // =========================================================================
    [
      'Sort each number into Even Numbers or Odd Numbers:',
      'Even Numbers: 2, 4, 6',
      'Odd Numbers: 1, 3, 5',
      '', '',
      'All', '', '', '', '', '',
      'sorting', 'Medium',
      'Even numbers: 2, 4, 6. Odd numbers: 1, 3, 5.',
      'Even numbers end in 2, 4, 6.',
      curr, subj, grd, cat, sk
    ],
    [
      'Sort numbers into Less than 5 vs 5 and Greater:',
      'Less than 5: 1, 2, 3, 4',
      '5 and Greater: 5, 6, 7, 8',
      '', '',
      'All', '', '', '', '', '',
      'sorting', 'Easy',
      '1, 2, 3, 4 are less than 5; 5, 6, 7, 8 are 5 and greater.',
      'Compare each number to 5.',
      curr, subj, grd, cat, sk
    ],
    [
      'Sort shapes into Round Shapes vs Straight-Sided Shapes:',
      'Round Shapes: Circle, Oval',
      'Straight-Sided Shapes: Triangle, Square, Rectangle',
      '', '',
      'All', 'circle|triangle|square', '3', 'pulse', 'picture_choice',
      'Sort shapes into Round or Straight-Sided buckets.',
      'sorting', 'Easy',
      'Circles and ovals are round; triangles, squares, and rectangles have straight sides.',
      'Check if the shape has straight edges.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ]
  ];

  const wsQuestions = XLSX.utils.aoa_to_sheet([questionsHeaders, ...sampleQuestionsRows]);
  wsQuestions['!cols'] = [
    { wch: 45 }, // Question Text
    { wch: 20 }, // Option A
    { wch: 20 }, // Option B
    { wch: 20 }, // Option C
    { wch: 20 }, // Option D
    { wch: 16 }, // Correct Answer
    { wch: 22 }, // Clipart Reference
    { wch: 14 }, // Visual Count
    { wch: 16 }, // Visual Animation
    { wch: 18 }, // Visual Template
    { wch: 32 }, // Visual Instructions
    { wch: 18 }, // Question Type
    { wch: 12 }, // Difficulty
    { wch: 32 }, // Explanation
    { wch: 25 }, // Hint
    { wch: 24 }, // Curriculum
    { wch: 15 }, // Subject
    { wch: 15 }, // Grade
    { wch: 25 }, // Category
    { wch: 28 }  // Skill
  ];
  XLSX.utils.book_append_sheet(wb, wsQuestions, 'Questions');

  // -------------------------------------------------------------
  // Sheet 2 (Tab 2): Master_Data (Clean Horizontal Tables)
  // -------------------------------------------------------------
  const currList = options.curriculaList && options.curriculaList.length > 0
    ? options.curriculaList.map(c => c.name || c.id)
    : [
        'Victorian Curriculum 2.0 (Australia)',
        'Australian Curriculum (ACARA)',
        'US Common Core State Standards',
        'CBSE (India)',
        'UK National Curriculum',
        'IB Primary Years Programme',
        'Ontario Curriculum (Canada)',
        'Global Standard Framework'
      ];

  const gradeNamesList = options.gradesList && options.gradesList.length > 0
    ? options.gradesList.map(g => g.name || g.id)
    : [
        'Preschool',
        'Foundation',
        'Grade 1',
        'Grade 2',
        'Grade 3',
        'Grade 4',
        'Grade 5',
        'Grade 6'
      ];

  const categorySkillRows: string[][] = [];
  const addedCodes = new Set<string>();

  // 1. Live Admin Portal master categories & skills (dynamically added by Admin)
  if (options.masterCategories && options.masterCategories.length > 0 && options.masterSkills && options.masterSkills.length > 0) {
    options.masterCategories.forEach(catItem => {
      const skills = options.masterSkills!.filter(s => s.categoryId === catItem.id || s.categoryCode === catItem.code);
      const cleanGrdName = resolveGradeMapping(catItem.gradeId || options.targetGradeName || 'Grade 1', options.gradesList).name;
      skills.forEach(skItem => {
        const key = `${cleanGrdName}:${catItem.name}:${skItem.name}`;
        if (!addedCodes.has(key)) {
          addedCodes.add(key);
          categorySkillRows.push([
            cleanGrdName,
            'Mathematics',
            catItem.name,
            skItem.name,
            skItem.curriculumReference || skItem.description || `${skItem.name} learning objective`
          ]);
        }
      });
    });
  }

  // 2. Standard master mathematics catalog
  MASTER_CATEGORY_SKILL_CATALOG.forEach(entry => {
    const rawGrades = entry.grades.split(',').map(g => g.trim());
    rawGrades.forEach(gStr => {
      const cleanGrd = resolveGradeMapping(gStr, options.gradesList).name;
      const key = `${cleanGrd}:${entry.catName}:${entry.skName}`;
      if (!addedCodes.has(key)) {
        addedCodes.add(key);
        categorySkillRows.push([
          cleanGrd,
          'Mathematics',
          entry.catName,
          entry.skName,
          `${entry.skName} learning objective`
        ]);
      }
    });
  });

  // Sort rows logically by Grade then Category
  const gradeRank: Record<string, number> = {
    'Preschool': 0,
    'Foundation': 1,
    'Foundation / Kindergarten': 1,
    'Kindergarten': 1,
    'Grade 1': 2,
    'Grade 2': 3,
    'Grade 3': 4,
    'Grade 4': 5,
    'Grade 5': 6,
    'Grade 6': 7
  };
  categorySkillRows.sort((a, b) => {
    const rA = gradeRank[a[0]] !== undefined ? gradeRank[a[0]] : 99;
    const rB = gradeRank[b[0]] !== undefined ? gradeRank[b[0]] : 99;
    if (rA !== rB) return rA - rB;
    if (a[2] !== b[2]) return a[2].localeCompare(b[2]);
    return a[3].localeCompare(b[3]);
  });

  const masterDataAOA: any[][] = [
    // Section 1 Header
    ['CATEGORIES & SKILLS (MATHEMATICS TAXONOMY)', '', '', '', ''],
    ['Target Grade Level', 'Subject', 'Category Name (Copy to Excel)', 'Skill Name (Copy to Excel)', 'Description / Standard'],
    ...categorySkillRows,
    ['', '', '', '', ''],
    // Section 2 Header
    ['SYSTEM ACCEPTED VALUES & OPTIONS', '', '', '', '', '', ''],
    ['Curriculum Options', 'Subject Options', 'Grade Level Options', 'Question Type Options', 'Difficulty Options', 'Visual Animation Options', 'Visual Template Options']
  ];

  const qTypes = ['multiple_choice', 'picture_counting', 'picture_choice', 'select_objects', 'open_box', 'true_false', 'drag_and_drop', 'ordering', 'sorting', 'match_making'];
  const diffs = ['Easy', 'Medium', 'Hard'];
  const anims = ['bounce', 'pulse', 'pop', 'float', 'spin', 'none'];
  const temps = ['picture_counting', 'picture_choice', 'pattern', 'drag_drop', 'matching', 'sorting', 'ordering', 'number_line'];
  const subjs = ['Mathematics'];

  const maxValRows = Math.max(currList.length, subjs.length, gradeNamesList.length, qTypes.length, diffs.length, anims.length, temps.length);

  for (let i = 0; i < maxValRows; i++) {
    masterDataAOA.push([
      currList[i] || '',
      subjs[i] || '',
      gradeNamesList[i] || '',
      qTypes[i] || '',
      diffs[i] || '',
      anims[i] || '',
      temps[i] || ''
    ]);
  }

  const wsMaster = XLSX.utils.aoa_to_sheet(masterDataAOA);
  wsMaster['!cols'] = [
    { wch: 25 },
    { wch: 18 },
    { wch: 32 },
    { wch: 36 },
    { wch: 36 },
    { wch: 25 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master_Data');

  // -------------------------------------------------------------
  // Sheet 3 (Tab 3): Clipart_Library (Visual Clipart Catalog)
  // -------------------------------------------------------------
  const clipartHeaders = ['Clipart Name / Code', 'Preview Emoji', 'Category', 'Default Animation', 'Keywords / Aliases'];
  const clipartRows = CLIPART_LIBRARY.map(c => [
    c.id,
    c.emoji,
    c.category,
    c.defaultAnimation,
    c.keywords.join(', ')
  ]);

  const wsClipart = XLSX.utils.aoa_to_sheet([clipartHeaders, ...clipartRows]);
  wsClipart['!cols'] = [
    { wch: 22 },
    { wch: 15 },
    { wch: 22 },
    { wch: 20 },
    { wch: 38 }
  ];
  XLSX.utils.book_append_sheet(wb, wsClipart, 'Clipart_Library');

  // -------------------------------------------------------------
  // Sheet 4 (Tab 4): Instructions (Quick Start & Syntax Guide)
  // -------------------------------------------------------------
  const instructionsData = [
    ['PforPencil Question Bank - Excel Master Template & Guide (Mathematics Focus)'],
    [''],
    ['1. WORKBOOK STRUCTURE & HOW TO USE:'],
    ['   - Tab 1 [Questions]: The primary question bank sheet where you write and edit questions.'],
    ['   - Tab 2 [Master_Data]: Contains all active Categories, Skills, Grade levels, and system-accepted options with clean horizontal headers.'],
    ['   - Tab 3 [Clipart_Library]: Over 100+ animated math cliparts and emojis you can use without uploading image files!'],
    ['   - Tab 4 [Instructions]: This quick start guide and syntax reference.'],
    [''],
    ['2. HOW CATEGORY & SKILL NAMES WORK (ADMIN-CONTROLLED TAXONOMY):'],
    ['   - Every question in PforPencil belongs to an Admin-created Category and Skill.'],
    ['   - In the Questions sheet, enter the natural names in the "Category Name" and "Skill Name" columns.'],
    ['   - Simply copy and paste exact Category and Skill names from Tab 2 [Master_Data].'],
    ['   - STRICT VALIDATION: If a row contains a Category or Skill not present in the Admin catalog, that row will fail validation.'],
    ['   - If you need a new Category or Skill, create it first in the Admin Portal under Master Question Bank.'],
    [''],
    ['3. HOW TO ADD VISUAL & TACTILE QUESTIONS (NO IMAGE UPLOADS NEEDED):'],
    ['   - For visual math questions, you do NOT need to upload image files!'],
    ['   - In the "Clipart Reference" column, enter any clipart name from Tab 3 [Clipart_Library] (e.g. "apple", "star", "cookie", "car", "triangle").'],
    ['   - Specify "Visual Count" (e.g. 3) and "Visual Animation" (bounce, pulse, pop, float, spin, none).'],
    [''],
    ['4. MATHEMATICS QUESTION TYPES & SYNTAX GUIDE:'],
    ['   - multiple_choice : Standard A, B, C, D choices (Correct Answer: A, B, C, or D).'],
    ['   - picture_counting: Interactive bouncing object counting (Correct Answer: e.g. 3, 4, 5).'],
    ['   - picture_choice  : Visual shape and object selection (Correct Answer: A, B, C, or D).'],
    ['   - select_objects  : Tap to count target objects (Correct Answer: Target count e.g. 4).'],
    ['   - open_box        : Direct number keypad entry (Correct Answer: e.g. 5 or 12).'],
    ['   - true_false      : True / False arithmetic & geometric statements (Correct Answer: True or False).'],
    ['   - drag_and_drop   : Drag numbers/shapes to match (Format options as: "Item -> Target Zone").'],
    ['   - ordering        : Ascending / Chronological order (Options: 1st, 2nd, 3rd, 4th item in sequence).'],
    ['   - sorting         : Sorting items into buckets (Format options as: "BucketName: item1, item2").'],
    ['   - match_making    : Equation to sum or shape to property matching (Format options as: "LeftItem -> RightMatch").'],
    [''],
    ['5. COLUMN DEFINITIONS (QUESTIONS SHEET):'],
    ['   - Question Text       : The question instructions displayed to the student.'],
    ['   - Option A / B / C / D: The answer choices.'],
    ['   - Correct Answer      : The correct answer choice ("A", "B", "C", "D" or direct answer value).'],
    ['   - Clipart Reference   : Clipart name from Tab 3 (e.g. "apple", "star", "cookie", "circle").'],
    ['   - Visual Count        : How many items to display (e.g. 1, 3, 5, 10).'],
    ['   - Visual Animation    : "bounce", "pulse", "pop", "float", "spin", or "none".'],
    ['   - Visual Template     : "picture_counting", "picture_choice", or leave blank.'],
    ['   - Visual Instructions : Hint or prompt for the visual interaction (e.g. "Tap each apple to count them!").'],
    ['   - Question Type       : One of the 10 supported question types listed above.'],
    ['   - Difficulty          : "Easy", "Medium", or "Hard".'],
    ['   - Curriculum          : Full Curriculum name (e.g. "Victorian Curriculum 2.0 (Australia)", "US Common Core").'],
    ['   - Subject             : "Mathematics".'],
    ['   - Grade               : Clean grade name (e.g. "Preschool", "Foundation", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6").'],
    ['   - Category Name       : Exact Category Name from Tab 2 [Master_Data].'],
    ['   - Skill Name          : Exact Skill Name from Tab 2 [Master_Data].']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Write workbook to binary buffer and return as Blob
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export interface ExcelParseContext {
  existingQuestions: Question[];
  getNextId: (grade: string, existing: Question[], offset: number, subject: string) => string;
  defaultCurriculumId?: string;
  defaultCountryId?: string;
  defaultRegionId?: string;
  defaultSubjectId?: string;
  defaultGradeId?: string;
  defaultCategoryId?: string;
  defaultSkillId?: string;
  defaultCountryName?: string;
  defaultRegionName?: string;
  defaultCurriculumName?: string;
  defaultSubjectName?: string;
  defaultGradeName?: string;
  defaultCategoryName?: string;
  defaultCategoryCode?: string;
  defaultSkillName?: string;
  defaultSkillCode?: string;
  defaultCurriculumReference?: string;
  useSelectedHierarchy?: boolean;
  masterCategories?: any[];
  masterSkills?: any[];
  gradesList?: any[];
  subjectsList?: any[];
  curriculaList?: any[];
}

/**
 * Parse an uploaded Excel (.xlsx or .xls) file
 */
export async function parseQuestionExcelFile(file: File, context: ExcelParseContext): Promise<ParsedExcelResult> {
  const questions: Question[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    // Intelligently find the Questions sheet (even with Instructions, Clipart, or Reference sheets present)
    let selectedSheetName = '';
    let ws: XLSX.WorkSheet | null = null;
    let rawRows: any[][] = [];
    let headerRow: string[] = [];
    let colPrompt = -1;

    // 1. Try finding a sheet explicitly named 'Question' or 'Questions' or 'Question Master'
    const candidateNames = [
      ...wb.SheetNames.filter(s => s.toLowerCase().includes('question')),
      ...wb.SheetNames.filter(s => !s.toLowerCase().includes('instruction') && !s.toLowerCase().includes('clipart') && !s.toLowerCase().includes('reference') && !s.toLowerCase().includes('master code')),
      ...wb.SheetNames
    ];

    for (const name of candidateNames) {
      const candidateWs = wb.Sheets[name];
      if (!candidateWs) continue;
      const rows: any[][] = XLSX.utils.sheet_to_json(candidateWs, { header: 1, defval: '' });
      if (rows.length >= 2) {
        const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
        const promptIdx = headers.findIndex(h => h === 'question text' || h === 'question prompt' || h === 'prompt');
        if (promptIdx >= 0) {
          selectedSheetName = name;
          ws = candidateWs;
          rawRows = rows;
          headerRow = rows[0].map((h: any) => String(h || '').trim());
          colPrompt = promptIdx;
          break;
        }
      }
    }

    if (!ws || colPrompt < 0 || rawRows.length < 2) {
      errors.push(`Could not find a sheet containing a "Question Text" column in this Excel workbook.`);
      return { questions, errors, warnings };
    }

    const findCol = (...names: string[]) => {
      for (const name of names) {
        const idx = headerRow.findIndex(h => h.toLowerCase() === name.toLowerCase());
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const colOptA = findCol('Option A', 'Choice A', 'A');
    const colOptB = findCol('Option B', 'Choice B', 'B');
    const colOptC = findCol('Option C', 'Choice C', 'C');
    const colOptD = findCol('Option D', 'Choice D', 'D');
    const colCorrect = findCol('Correct Answer', 'Answer', 'Correct Choice', 'Correct');
    const colClipartRef = findCol('Clipart Reference', 'Visual Objects', 'Clipart Code', 'Clipart Name', 'Emoji / Clipart');
    const colCount = findCol('Visual Count', 'Count', 'Object Count');
    const colAnimation = findCol('Visual Animation', 'Animation');
    const colTemplate = findCol('Visual Template', 'Template');
    const colInstructions = findCol('Visual Instructions', 'Instructions');
    const colType = findCol('Question Type', 'Type');
    const colDiff = findCol('Difficulty', 'Level');
    const colExp = findCol('Explanation', 'Explanation / Solution');
    const colHint = findCol('Hint');
    const colCurr = findCol('Curriculum', 'Curriculum Name', 'Curriculum Code');
    const colSub = findCol('Subject', 'Subject Name', 'Subject Code');
    const colGrd = findCol('Grade', 'Grade Level', 'Grade Name', 'Grade Code');
    const colCat = findCol('Category Name', 'Category', 'Category Code');
    const colSk = findCol('Skill Name', 'Skill', 'Skill Code');
    const colStatus = findCol('Status', 'Question Status', 'Publish Status', 'State');

    if (colPrompt < 0) {
      errors.push(`Missing required column "Question Text" in the Questions sheet.`);
      return { questions, errors, warnings };
    }

    const existingTracker = [...context.existingQuestions];

    for (let rIdx = 1; rIdx < rawRows.length; rIdx++) {
      const row = rawRows[rIdx];
      const getVal = (col: number) => (col >= 0 && row[col] !== undefined ? String(row[col]).trim() : '');

      const prompt = getVal(colPrompt);
      if (!prompt) continue; // skip blank rows

      const optA = getVal(colOptA);
      const optB = getVal(colOptB);
      const optC = getVal(colOptC);
      const optD = getVal(colOptD);

      let options = [optA, optB, optC, optD].filter(Boolean);

      const rawType = getVal(colType).toLowerCase();
      let type: QuestionType = 'multiple_choice';
      if (['picture_counting', 'picture_choice', 'drag_and_drop', 'match_making', 'ordering', 'sorting', 'fill_blank', 'open_box', 'true_false', 'image_choice', 'select_objects'].includes(rawType)) {
        type = rawType as QuestionType;
      }

      const rawCorrect = getVal(colCorrect);
      let correctIndex = 0;

      if (type === 'true_false') {
        const isTrue = ['TRUE', 'T', '1', 'YES', 'A', 'OPTION A'].includes(rawCorrect.toUpperCase());
        correctIndex = isTrue ? 0 : 1;
        if (options.length < 2) {
          options = ['True', 'False'];
        }
      } else if (['A', '0', 'OPTION A'].includes(rawCorrect.toUpperCase())) {
        correctIndex = 0;
      } else if (['B', '1', 'OPTION B'].includes(rawCorrect.toUpperCase())) {
        correctIndex = 1;
      } else if (['C', '2', 'OPTION C'].includes(rawCorrect.toUpperCase())) {
        correctIndex = 2;
      } else if (['D', '3', 'OPTION D'].includes(rawCorrect.toUpperCase())) {
        correctIndex = 3;
      } else {
        // Try matching text
        const matchedIdx = options.findIndex(o => o.toLowerCase() === rawCorrect.toLowerCase());
        if (matchedIdx >= 0) correctIndex = matchedIdx;
      }

      const rawDiff = getVal(colDiff);
      const difficulty: 'Easy' | 'Medium' | 'Hard' = ['Easy', 'Medium', 'Hard'].includes(rawDiff)
        ? (rawDiff as any)
        : 'Easy';

      const clipartRef = getVal(colClipartRef);
      const countNum = parseInt(getVal(colCount), 10) || ((type as string) === 'picture_counting' || (type as string) === 'select_objects' ? parseInt(options[correctIndex] || rawCorrect || '3', 10) || 3 : 1);
      const rawAnim = getVal(colAnimation).toLowerCase();
      const animation: VisualAnimation = ['bounce', 'pulse', 'pop', 'float', 'spin', 'none'].includes(rawAnim)
        ? (rawAnim as VisualAnimation)
        : 'bounce';
      const rawTemplate = getVal(colTemplate);
      const template: VisualQuestionTemplate = ['picture_counting', 'picture_choice', 'pattern', 'drag_drop', 'matching', 'sorting', 'ordering', 'number_line', 'interactive_story'].includes(rawTemplate)
        ? (rawTemplate as VisualQuestionTemplate)
        : ((type as string) === 'picture_counting' || (type as string) === 'select_objects' ? 'picture_counting' : (type as string) === 'picture_choice' ? 'picture_choice' : 'picture_counting');
      const instructions = getVal(colInstructions) || (type === 'select_objects' ? 'Tap the pictures to select them.' : 'Tap the pictures and choose the answer.');

      const explanation = getVal(colExp) || `The correct answer is ${options[correctIndex] || rawCorrect || 'Option A'}.`;
      const hint = getVal(colHint);
      const rawStatusVal = getVal(colStatus).toLowerCase();
      const status: 'Draft' | 'Published' = rawStatusVal.includes('draft') ? 'Draft' : 'Published';

      // Dynamic Hierarchy Resolution
      let currId = context.defaultCurriculumId || 'CUR-VCAA20';
      let currName = context.defaultCurriculumName || 'Victorian Curriculum 2.0';
      let subId = context.defaultSubjectId || 'SUB_MTH';
      let subName = context.defaultSubjectName || 'Mathematics';
      let grdId = context.defaultGradeId || 'GRD_G1';
      let grdName = context.defaultGradeName || 'Grade 1';
      let catId = context.defaultCategoryId || 'CAT-NUM';
      let catCode = context.defaultCategoryCode || 'CAT-NUM';
      let catName = context.defaultCategoryName || 'Numbers & Quantities';
      let skId = context.defaultSkillId || 'SK-NUM-01';
      let skCode = context.defaultSkillCode || 'SK-NUM-01';
      let skName = context.defaultSkillName || 'Recognizing Numbers & Counting';

      if (context.useSelectedHierarchy) {
        currId = context.defaultCurriculumId || currId;
        currName = context.defaultCurriculumName || currName;
        subId = context.defaultSubjectId || subId;
        subName = context.defaultSubjectName || subName;
        grdId = context.defaultGradeId || grdId;
        grdName = context.defaultGradeName || grdName;
        catId = context.defaultCategoryId || catId;
        catCode = context.defaultCategoryCode || catCode;
        catName = context.defaultCategoryName || catName;
        skId = context.defaultSkillId || skId;
        skCode = context.defaultSkillCode || skCode;
        skName = context.defaultSkillName || skName;
      } else {
        const rowCurr = getVal(colCurr);
        if (rowCurr) {
          const resolvedCurr = resolveCurriculumMapping(rowCurr, context.curriculaList);
          currId = resolvedCurr.id;
          currName = resolvedCurr.name;
        }

        const rowSub = getVal(colSub);
        if (rowSub) {
          const resolvedSub = resolveSubjectMapping(rowSub, context.subjectsList);
          subId = resolvedSub.id;
          subName = resolvedSub.name;
        }

        const rowGrd = getVal(colGrd);
        if (rowGrd) {
          const resolvedGrd = resolveGradeMapping(rowGrd, context.gradesList);
          grdId = resolvedGrd.id;
          grdName = resolvedGrd.name;
        }

        const rowCat = getVal(colCat);
        const rowSk = getVal(colSk);
        if (rowCat || rowSk) {
          // Strict validation: Categories and skills must be created by Admin
          const resolvedCatSk = resolveCategoryAndSkill(
            rowCat,
            rowSk,
            grdId,
            context.masterCategories,
            context.masterSkills,
            true // strict validation
          );

          if (!resolvedCatSk.isValid) {
            errors.push(`Row ${rIdx + 1} (${prompt.slice(0, 35)}...): FAILED - ${resolvedCatSk.errorReason}`);
            continue; // Fail this record so untracked categories/skills cannot be loaded via Excel
          }

          catId = resolvedCatSk.categoryId;
          catCode = resolvedCatSk.categoryCode;
          catName = resolvedCatSk.categoryName;
          skId = resolvedCatSk.skillId;
          skCode = resolvedCatSk.skillCode;
          skName = resolvedCatSk.skillName;
        }
      }

      // Build visual config if clipart reference is provided
      let visualClipart: string | undefined = undefined;
      let visualConfig: any = undefined;

      if (clipartRef) {
        const resolved = resolveClipartString(clipartRef, countNum);
        visualClipart = resolved.badge;
        const matchedItem = lookupClipart(clipartRef);

        visualConfig = {
          enabled: true,
          template,
          animation: rawAnim ? animation : (matchedItem?.defaultAnimation || 'bounce'),
          interaction: type === 'select_objects' ? 'tap' : 'tap',
          visualInstructions: instructions,
          background: 'playful',
          autoPlay: true,
          objects: [
            {
              id: 'obj-1',
              label: matchedItem?.name || clipartRef,
              emoji: resolved.emoji,
              count: countNum
            }
          ]
        };
      }

      // Specialized question type configurations
      let dragItems: any = undefined;
      let matchPairs: any = undefined;
      let orderSequence: any = undefined;
      let sortBuckets: any = undefined;
      let openBoxAnswer: string | undefined = undefined;

      if (type === 'drag_and_drop') {
        dragItems = options.map((opt, i) => {
          const parts = opt.split('->').map(s => s.trim());
          return {
            item: parts[0] || `Item ${i + 1}`,
            target: parts[1] || 'Target Zone'
          };
        });
      } else if (type === 'match_making') {
        matchPairs = options.map(opt => {
          const parts = opt.split('->').map(s => s.trim());
          return {
            left: parts[0] || 'Item A',
            right: parts[1] || 'Match A'
          };
        });
      } else if (type === 'ordering') {
        orderSequence = options.length > 0 ? options : ['1', '2', '3', '4'];
      } else if (type === 'sorting') {
        sortBuckets = options.map(opt => {
          const parts = opt.split(':').map(s => s.trim());
          return {
            bucketName: parts[0] || 'Bucket',
            items: parts[1] ? parts[1].split(',').map(x => x.trim()) : ['Item 1', 'Item 2']
          };
        });
      } else if (type === 'open_box' || type === 'fill_blank') {
        openBoxAnswer = rawCorrect || options[0] || '1';
        if (options.length === 0) {
          options = [openBoxAnswer];
        }
      }

      const qId = context.getNextId(grdName || grdId, existingTracker, 0, subName || subId);

      const q: Question = {
        id: qId,
        country: context.defaultCountryName || 'Australia',
        state: context.defaultRegionName || 'Victoria',
        curriculum: currName,
        countryId: context.defaultCountryId || 'CNT-AU',
        regionId: context.defaultRegionId || 'REG-VIC',
        curriculumId: currId,
        subject: subName,
        subjectId: subId,
        grade: grdName,
        gradeId: grdId,
        category: catName,
        categoryId: catId,
        categoryCode: catCode,
        skill: skName,
        skillId: skId,
        skillCode: skCode,
        curriculumReference: context.defaultCurriculumReference || '',
        difficulty,
        type,
        prompt,
        options: (type === 'open_box' || type === 'fill_blank') && options.length === 0 ? [openBoxAnswer || ''] : (options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D']),
        correctIndex: Math.max(0, Math.min(options.length - 1, correctIndex)),
        openBoxAnswer,
        explanation,
        hint,
        points: difficulty === 'Hard' ? 30 : difficulty === 'Medium' ? 20 : 10,
        status,
        visualClipart,
        visualConfig,
        dragItems,
        matchPairs,
        orderSequence,
        sortBuckets
      };

      questions.push(q);
      existingTracker.push(q);
    }

    if (questions.length === 0) {
      warnings.push('No valid question rows were found in the uploaded Excel file.');
    }

  } catch (err: any) {
    errors.push(`Failed to parse Excel file: ${err?.message || 'Unknown error'}`);
  }

  return { questions, errors, warnings };
}
