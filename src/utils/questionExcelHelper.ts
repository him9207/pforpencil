import * as XLSX from 'xlsx';
import { Question, QuestionType, VisualAnimation, VisualQuestionTemplate } from '../types';
import { CLIPART_LIBRARY, lookupClipart, resolveClipartString } from '../data/clipartLibraryData';

export interface ParsedExcelResult {
  questions: Question[];
  errors: string[];
  warnings: string[];
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
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-03', skName: 'Number Line Counting', subject: 'SUB_MTH', grades: 'Preschool, Foundation, Grade 1, Grade 2' },
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-04', skName: 'Integers and Absolute Value', subject: 'SUB_MTH', grades: 'Grade 6' },
  { catCode: 'CAT-NUM', catName: 'Numbers & Quantities', skCode: 'SK-NUM-05', skName: 'Four-Quadrant Coordinate Graphing', subject: 'SUB_MTH', grades: 'Grade 6' },
  // Counting & Cardinality
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-01', skName: 'Counting 1 to 5', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-02', skName: 'One-to-One Correspondence', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-03', skName: 'Counting Objects to 5', subject: 'SUB_MTH', grades: 'Preschool' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-04', skName: 'Counting 1 to 10', subject: 'SUB_MTH', grades: 'Foundation' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-05', skName: 'Counting Objects to 10', subject: 'SUB_MTH', grades: 'Foundation' },
  { catCode: 'CAT-CNT', catName: 'Counting & Cardinality', skCode: 'SK-CNT-06', skName: 'Comparing Quantities', subject: 'SUB_MTH', grades: 'Foundation' },
  // Addition & Subtraction / Operations
  { catCode: 'CAT-OPS', catName: 'Operations & Algebraic Thinking', skCode: 'SK-OPS-01', skName: 'Basic Addition within 5', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-OPS', catName: 'Operations & Algebraic Thinking', skCode: 'SK-OPS-02', skName: 'Basic Subtraction within 5', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-OPS', catName: 'Operations & Algebraic Thinking', skCode: 'SK-OPS-03', skName: 'Addition within 10', subject: 'SUB_MTH', grades: 'Foundation, Grade 1' },
  { catCode: 'CAT-OPS', catName: 'Multi-Digit Operations', skCode: 'SK-OPS-04', skName: 'Multi-Digit Multiplication', subject: 'SUB_MTH', grades: 'Grade 4' },
  { catCode: 'CAT-OPS', catName: 'Multi-Digit Operations', skCode: 'SK-OPS-05', skName: 'Long Division with Quotients', subject: 'SUB_MTH', grades: 'Grade 4' },
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
  // Fractions
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
  { catCode: 'CAT-DATA', catName: 'Word Problems & Data', skCode: 'SK-DATA-02', skName: 'Two-Step Word Problems', subject: 'SUB_MTH', grades: 'Grade 3' },
  // Science & Nature
  { catCode: 'CAT-SCI', catName: 'Living Things & Science', skCode: 'SK-SCI-01', skName: 'Animal & Nature Characteristics', subject: 'SUB_SCI', grades: 'Preschool, Foundation, Grade 1' },
  { catCode: 'CAT-SCI', catName: 'Living Things & Science', skCode: 'SK-SCI-02', skName: 'Habitats & Living Things', subject: 'SUB_SCI', grades: 'Preschool, Foundation, Grade 1' },
  { catCode: 'CAT-BIO', catName: 'Living Things & Nature', skCode: 'SK-BIO-01', skName: 'Baby Animals', subject: 'SUB_SCI', grades: 'Preschool' },
  { catCode: 'CAT-BIO', catName: 'Living Things & Nature', skCode: 'SK-BIO-02', skName: 'Animal Habitats', subject: 'SUB_SCI', grades: 'Preschool' },
  { catCode: 'CAT-BIO', catName: 'Living Things & Nature', skCode: 'SK-BIO-03', skName: 'Animal Families', subject: 'SUB_SCI', grades: 'Preschool' },
  { catCode: 'CAT-BIO', catName: 'Living Things & Nature', skCode: 'SK-BIO-04', skName: 'Animal Diets', subject: 'SUB_SCI', grades: 'Preschool' },
  // English & Phonics
  { catCode: 'CAT-ENG', catName: 'English & Phonics', skCode: 'SK-ENG-01', skName: 'Letter Sounds & Phonics', subject: 'SUB_ENG', grades: 'Preschool, Foundation, Grade 1' },
  { catCode: 'CAT-ENG', catName: 'English & Phonics', skCode: 'SK-ENG-02', skName: 'Vocabulary & Sight Words', subject: 'SUB_ENG', grades: 'Preschool, Foundation, Grade 1' },
  // Art & Creativity
  { catCode: 'CAT-ART', catName: 'Art & Creativity', skCode: 'SK-ART-01', skName: 'Color Mixing & Primary Colors', subject: 'SUB_ART', grades: 'Preschool, Foundation, Grade 1' },
  { catCode: 'CAT-ART', catName: 'Art & Creativity', skCode: 'SK-ART-02', skName: 'Drawing Basic Shapes', subject: 'SUB_ART', grades: 'Foundation, Grade 1, Grade 2' }
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

export function resolveCategoryAndSkill(
  catInput: string,
  skInput: string,
  gradeId?: string,
  masterCategories?: any[],
  masterSkills?: any[]
): {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  skillId: string;
  skillCode: string;
  skillName: string;
} {
  const trimmedCat = (catInput || '').trim();
  const trimmedSk = (skInput || '').trim();
  const catLower = trimmedCat.toLowerCase();
  const skLower = trimmedSk.toLowerCase();

  // 1. Try matching in live master categories/skills if available
  let matchedCat = masterCategories?.find(c => 
    c.code?.toLowerCase() === catLower ||
    c.id?.toLowerCase() === catLower ||
    c.name?.toLowerCase() === catLower
  );

  let matchedSk = masterSkills?.find(s => 
    s.code?.toLowerCase() === skLower ||
    s.id?.toLowerCase() === skLower ||
    s.name?.toLowerCase() === skLower
  );

  // 2. Try matching from comprehensive catalog
  const catalogMatch = MASTER_CATEGORY_SKILL_CATALOG.find(entry => 
    (entry.catCode.toLowerCase() === catLower || entry.catName.toLowerCase() === catLower) &&
    (entry.skCode.toLowerCase() === skLower || entry.skName.toLowerCase() === skLower)
  ) || MASTER_CATEGORY_SKILL_CATALOG.find(entry => 
    entry.skCode.toLowerCase() === skLower || entry.skName.toLowerCase() === skLower
  ) || MASTER_CATEGORY_SKILL_CATALOG.find(entry => 
    entry.catCode.toLowerCase() === catLower || entry.catName.toLowerCase() === catLower
  );

  const categoryCode = matchedCat?.code || catalogMatch?.catCode || trimmedCat || 'CAT-NUM';
  const categoryName = matchedCat?.name || catalogMatch?.catName || trimmedCat || 'Numbers & Quantities';
  const categoryId = matchedCat?.id || `CAT-${categoryCode}`;

  const skillCode = matchedSk?.code || catalogMatch?.skCode || trimmedSk || 'SK-NUM-01';
  const skillName = matchedSk?.name || catalogMatch?.skName || trimmedSk || 'Recognizing Numbers & Counting';
  const skillId = matchedSk?.id || `SKL-${categoryId}-${skillCode}`;

  return {
    categoryId,
    categoryCode,
    categoryName,
    skillId,
    skillCode,
    skillName
  };
}

/**
 * Generate a complete, teacher-friendly Excel Workbook (.xlsx)
 * with Clipart Library, Master Codes, and Ready-to-Test Question Types.
 */
export function generateQuestionMasterExcel(options: ExcelGenerationOptions = {}): Blob {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Quick Start Instructions & Guide
  // -------------------------------------------------------------
  const instructionsData = [
    ['PforPencil Question Bank - Excel Master Template & Guide'],
    [''],
    ['HOW TO USE THIS EXCEL TEMPLATE:'],
    ['1. Go to the "Questions" sheet to add or edit questions for ANY Grade, Category, or Skill.'],
    ['2. For visual questions, you do NOT need to upload or paste images!'],
    ['   Simply use the "Clipart Reference" column with codes from the "Clipart_Library" sheet (e.g. "apple", "star", "cookie").'],
    ['3. Specify the "Visual Count" (e.g. 3) and "Animation" (bounce, pulse, pop, float, spin).'],
    ['4. Save the file and upload it in the Question Bank modal!'],
    [''],
    ['QUESTION TYPES SUPPORTED:'],
    ['- multiple_choice : Standard A, B, C, D multiple choice.'],
    ['- picture_counting: Interactive counting of bouncing or animated objects.'],
    ['- picture_choice  : Multiple choice with visual object options.'],
    ['- select_objects  : Tap to select and count target objects on screen.'],
    ['- open_box        : Direct number/word input with quick option buttons.'],
    ['- true_false      : True / False question format.'],
    ['- drag_and_drop   : Drag items into matching destination zones (Option format: "Item -> Target").'],
    ['- ordering        : Arrange sequence in correct order (Options: 1, 2, 3, 4).'],
    ['- sorting         : Sort items into distinct buckets (Option format: "BucketName: item1, item2").'],
    ['- match_making    : Connect matching pairs on left and right (Option format: "LeftItem -> RightMatch").'],
    [''],
    ['COLUMN GUIDE (QUESTIONS SHEET):'],
    ['Question Text       : The question prompt displayed to students.'],
    ['Option A / B / C / D: The choices offered to students.'],
    ['Correct Answer      : The correct choice ("A", "B", "C", "D" or direct answer text).'],
    ['Clipart Reference   : Clipart ID or Code from the Clipart_Library sheet (e.g. "apple", "CLIP_STAR").'],
    ['Visual Count        : How many items to show (e.g. 1, 3, 5).'],
    ['Visual Animation    : "bounce", "pulse", "pop", "float", "spin", or "none".'],
    ['Visual Template     : "picture_counting", "picture_choice", "pattern", or leave blank.'],
    ['Visual Instructions : Hint or prompt for the visual action (e.g. "Tap each apple to count them!").'],
    ['Question Type       : One of the supported question types listed above.'],
    ['Difficulty          : "Easy", "Medium", or "Hard".'],
    ['Curriculum Code     : Reference code from Master_Codes sheet (e.g. "CUR-VCAA20", "CUR-CCSS").'],
    ['Subject Code        : Reference code (e.g. "SUB_MTH", "SUB_SCI", "SUB_ENG", "SUB_ART").'],
    ['Grade Code          : Reference code (e.g. "GRD_PRE_K", "GRD_KG", "GRD_G1", "GRD_G2", "GRD_G3", "GRD_G4", "GRD_G5", "GRD_G6").'],
    ['Category Code       : Category Code from Master_Codes sheet (e.g. "CAT-NUM", "CAT-ADD", "CAT-GEO").'],
    ['Skill Code          : Skill Code from Master_Codes sheet (e.g. "SK-NUM-01", "SK-ADD-01").']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions_Guide');

  // -------------------------------------------------------------
  // Sheet 2: Questions (Sample question for each major type)
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
    'Curriculum Code',
    'Subject Code',
    'Grade Code',
    'Category Code',
    'Skill Code'
  ];

  const curr = options.curriculumCode || 'CUR-VCAA20';
  const subj = options.subjectCode || 'SUB_MTH';
  const grd = options.gradeCode || 'GRD_G1';
  const cat = options.categoryCode || 'CAT-NUM';
  const sk = options.skillCode || 'SK-NUM-01';

  const sampleQuestionsRows = [
    // =========================================================================
    // 1. PICTURE COUNTING (10 Grade 1 Questions)
    // =========================================================================
    [
      'How many red apples are on the screen?',
      '2', '3', '4', '5',
      'B', 'apple', '3', 'bounce', 'picture_counting',
      'Tap each apple to count them!',
      'picture_counting', 'Easy',
      'There are 3 red apples on the screen.',
      'Count them one by one from left to right.',
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
      'How many happy green frogs are hopping near the pond?',
      '4', '5', '6', '7',
      'C', 'frog', '6', 'pop', 'picture_counting',
      'Count all the hopping green frogs!',
      'picture_counting', 'Medium',
      'There are 6 green frogs in total.',
      'Count row by row.',
      curr, subj, grd, cat, sk
    ],
    [
      'Count the yellow ripe bananas:',
      '1', '2', '3', '4',
      'A', 'banana', '1', 'bounce', 'picture_counting',
      'Count the delicious yellow banana.',
      'picture_counting', 'Easy',
      'There is 1 banana.',
      'There is only one fruit on screen.',
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
      'Count the friendly playful puppies:',
      '2', '3', '4', '5',
      'C', 'dog', '4', 'bounce', 'picture_counting',
      'Count each puppy on the screen.',
      'picture_counting', 'Easy',
      'There are 4 puppies playing.',
      'Count each friendly puppy.',
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
    // 2. PICTURE CHOICE (10 Grade 1 Questions)
    // =========================================================================
    [
      'Which shape is an orange triangle with 3 sides?',
      'Red Circle', 'Orange Triangle', 'Blue Square', 'Golden Star',
      'B', 'circle_red|triangle|square_blue|star', '1', 'pop', 'picture_choice',
      'Tap the triangle shape.',
      'picture_choice', 'Easy',
      'The triangle has 3 straight sides and 3 corners.',
      'Look for the 3-sided shape.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Which animal is the tallest in the safari?',
      'Mouse', 'Dog', 'Giraffe', 'Cat',
      'C', 'mouse|dog|giraffe|cat', '1', 'bounce', 'picture_choice',
      'Tap the tallest animal.',
      'picture_choice', 'Easy',
      'The giraffe has a very long neck and is the tallest.',
      'Look for the animal with the longest neck.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Which item is a sweet healthy fruit?',
      'Toy Car', 'Red Apple', 'Wall Clock', 'Party Balloon',
      'B', 'car|apple|clock|balloon', '1', 'bounce', 'picture_choice',
      'Tap the healthy fruit.',
      'picture_choice', 'Easy',
      'An apple is a sweet, healthy fruit you can eat.',
      'Which of these can you eat for a snack?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Which vehicle flies up high in the sky?',
      'Car', 'Boat', 'Airplane', 'Bicycle',
      'C', 'car|boat|airplane|bicycle', '1', 'float', 'picture_choice',
      'Tap the vehicle that flies.',
      'picture_choice', 'Easy',
      'An airplane flies high in the air.',
      'Look for wings that fly.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Which creature swims and lives in the ocean?',
      'Swimming Fish', 'Roaring Lion', 'Playful Monkey', 'Hopping Rabbit',
      'A', 'fish|lion|monkey|rabbit', '1', 'float', 'picture_choice',
      'Tap the ocean creature.',
      'picture_choice', 'Easy',
      'Fish live and swim in water with fins.',
      'Look for the swimming animal with fins.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Which shape has 4 straight equal sides?',
      'Round Circle', 'Blue Square', 'Pointy Star', 'Heart Shape',
      'B', 'circle|square|star|heart', '1', 'pulse', 'picture_choice',
      'Tap the square.',
      'picture_choice', 'Easy',
      'A square has 4 equal straight sides.',
      'Look for 4 equal sides.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Which object tells us what time of day it is?',
      'Storybook', 'Wall Clock', 'Golden Star', 'Sweet Apple',
      'B', 'book|clock|star|apple', '1', 'bounce', 'picture_choice',
      'Tap the object that tells time.',
      'picture_choice', 'Easy',
      'A clock has numbers and hands to tell time.',
      'Look for numbers on a dial.',
      curr, subj, grd, 'CAT-MSR', 'SK-MSR-01'
    ],
    [
      'Which animal says "Meow"?',
      'Friendly Dog', 'Fluffy Cat', 'Spotted Cow', 'Green Frog',
      'B', 'dog|cat|cow|frog', '1', 'bounce', 'picture_choice',
      'Tap the animal that purrs and meows.',
      'picture_choice', 'Easy',
      'Cats purr and make the meow sound.',
      'Think about pet sounds.',
      curr, subj, grd, 'CAT-ENG', 'SK-ENG-01'
    ],
    [
      'Which animal loves to hop and eat fresh carrots?',
      'Cute Rabbit', 'Big Elephant', 'Brown Bear', 'Yellow Duck',
      'A', 'rabbit|elephant|bear|duck', '1', 'bounce', 'picture_choice',
      'Tap the hopping animal with long ears.',
      'picture_choice', 'Easy',
      'Rabbits have long ears and love carrots.',
      'Look for long fluffy ears.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Which object shines brightly in the night sky?',
      'Sunny Sun', 'Crescent Moon', 'Green Tree', 'Blue Car',
      'B', 'sun|moon|tree|car', '1', 'pulse', 'picture_choice',
      'Tap the moon in the night sky.',
      'picture_choice', 'Easy',
      'The moon shines during nighttime.',
      'Look for the night sky object.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],

    // =========================================================================
    // 3. SELECT OBJECTS / TAP TO COUNT (10 Grade 1 Questions)
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
      'Tap to select 2 friendly dogs:',
      '2', '1', '3', '4',
      'A', 'dog', '4', 'bounce', 'picture_counting',
      'Tap 2 dogs on the screen!',
      'select_objects', 'Easy',
      'You selected 2 friendly dogs.',
      'Tap just two puppies.',
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
      'Tap to select 1 golden crown:',
      '1', '2', '3', '4',
      'A', 'crown', '3', 'pulse', 'picture_counting',
      'Tap 1 crown to wear it!',
      'select_objects', 'Easy',
      'You selected 1 crown.',
      'Tap only one crown.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select 4 blue toy cars:',
      '4', '3', '5', '6',
      'A', 'car', '6', 'bounce', 'picture_counting',
      'Tap 4 cars to start the race!',
      'select_objects', 'Easy',
      'You selected 4 toy cars.',
      'Tap 4 cars.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select 5 green hopping frogs:',
      '5', '4', '6', '7',
      'A', 'frog', '7', 'pop', 'picture_counting',
      'Tap 5 frogs to help them jump!',
      'select_objects', 'Medium',
      'You selected 5 hopping frogs.',
      'Count each frog as you tap.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select 3 yellow sweet bananas:',
      '3', '2', '4', '5',
      'A', 'banana', '5', 'bounce', 'picture_counting',
      'Tap 3 bananas to feed the monkey!',
      'select_objects', 'Easy',
      'You selected 3 bananas.',
      'Tap 3 times.',
      curr, subj, grd, cat, sk
    ],
    [
      'Tap to select 7 glowing hearts:',
      '7', '6', '8', '5',
      'A', 'heart', '9', 'pulse', 'picture_counting',
      'Tap 7 hearts to light them up!',
      'select_objects', 'Hard',
      'You selected 7 glowing hearts.',
      'Count 1 to 7 carefully.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 4. STANDARD MULTIPLE CHOICE (10 Grade 1 Questions)
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
      'What is 7 - 3?',
      '3', '4', '5', '6',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      '7 take away 3 leaves 4.',
      'Count backwards 3 steps from 7.',
      curr, subj, grd, cat, sk
    ],
    [
      'Which number comes immediately after 9?',
      '8', '10', '11', '12',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      'When counting, 10 comes right after 9.',
      'Think of standard 1 to 10 counting.',
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
      'How many days are in one full week?',
      '5', '6', '7', '8',
      'C', '', '', '', '', '',
      'multiple_choice', 'Easy',
      'There are 7 days in a week (Monday to Sunday).',
      'Count the days from Monday to Sunday.',
      curr, subj, grd, cat, sk
    ],
    [
      'What is double of 4 (4 + 4)?',
      '6', '8', '10', '12',
      'B', '', '', '', '', '',
      'multiple_choice', 'Medium',
      '4 + 4 = 8.',
      'Add 4 and 4 together.',
      curr, subj, grd, cat, sk
    ],
    [
      'Which of these numbers is an even number?',
      '3', '5', '7', '8',
      'D', '', '', '', '', '',
      'multiple_choice', 'Medium',
      '8 can be split into two equal groups of 4, so it is even.',
      'Even numbers end in 0, 2, 4, 6, 8.',
      curr, subj, grd, cat, sk
    ],
    [
      'If you have 5 candies and eat 2, how many candies do you have left?',
      '2', '3', '4', '5',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      '5 minus 2 equals 3 candies.',
      'Subtract 2 from 5.',
      curr, subj, grd, cat, sk
    ],
    [
      'Which number comes between 14 and 16?',
      '13', '15', '17', '18',
      'B', '', '', '', '', '',
      'multiple_choice', 'Easy',
      'The number 15 is between 14 and 16.',
      'Count: 14, __, 16.',
      curr, subj, grd, cat, sk
    ],
    [
      'What is 10 + 5?',
      '12', '14', '15', '16',
      'C', '', '', '', '', '',
      'multiple_choice', 'Medium',
      '10 + 5 = 15.',
      'Add 5 onto 10.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 5. OPEN BOX / KEYPAD FILL IN THE BLANK (10 Grade 1 Questions)
    // =========================================================================
    [
      'Calculate: 5 + 3 = ?',
      '8', '', '', '',
      '8', 'apple', '8', 'bounce', 'picture_counting',
      'Type the correct answer number into the box.',
      'open_box', 'Easy',
      '5 + 3 = 8.',
      'Add 3 to 5.',
      curr, subj, grd, cat, sk
    ],
    [
      'Calculate: 9 - 4 = ?',
      '5', '', '', '',
      '5', 'cookie', '5', 'bounce', 'picture_counting',
      'Type the answer in the box.',
      'open_box', 'Easy',
      '9 take away 4 equals 5.',
      'Count back 4 from 9.',
      curr, subj, grd, cat, sk
    ],
    [
      'What number is 2 more than 6?',
      '8', '', '', '',
      '8', 'star', '8', 'pulse', 'picture_counting',
      'Type the number.',
      'open_box', 'Easy',
      '6 + 2 = 8.',
      'Add 2 to 6.',
      curr, subj, grd, cat, sk
    ],
    [
      'Count the total wheels on 2 standard bicycles:',
      '4', '', '', '',
      '4', 'car', '4', 'bounce', 'picture_counting',
      'Type the total number of wheels.',
      'open_box', 'Easy',
      'Each bike has 2 wheels: 2 + 2 = 4.',
      '2 wheels + 2 wheels.',
      curr, subj, grd, cat, sk
    ],
    [
      'Complete the counting sequence: 2, 4, 6, _',
      '8', '', '', '',
      '8', '', '', '', '', '',
      'open_box', 'Medium',
      'Counting by 2s: 2, 4, 6, 8.',
      'Add 2 to 6.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many straight sides does a triangle have?',
      '3', '', '', '',
      '3', 'triangle', '1', 'pop', 'picture_choice',
      'Type the number of sides.',
      'open_box', 'Easy',
      'A triangle always has 3 sides.',
      'Count the corners of a triangle.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Calculate: 10 - 7 = ?',
      '3', '', '', '',
      '3', 'balloon', '3', 'float', 'picture_counting',
      'Type the answer in the box.',
      'open_box', 'Medium',
      '10 - 7 = 3.',
      'How much more does 7 need to reach 10?',
      curr, subj, grd, cat, sk
    ],
    [
      'What is 6 + 4?',
      '10', '', '', '',
      '10', 'heart', '10', 'pulse', 'picture_counting',
      'Type the sum.',
      'open_box', 'Medium',
      '6 + 4 = 10 (number bond of 10).',
      'Friends of 10: 6 + 4.',
      curr, subj, grd, cat, sk
    ],
    [
      'What number is 1 less than 20?',
      '19', '', '', '',
      '19', '', '', '', '', '',
      'open_box', 'Medium',
      'The number right before 20 is 19.',
      'Count down 1 from 20.',
      curr, subj, grd, cat, sk
    ],
    [
      'How many legs does a dog have?',
      '4', '', '', '',
      '4', 'dog', '1', 'bounce', 'picture_choice',
      'Type the number of legs.',
      'open_box', 'Easy',
      'Dogs have 4 legs.',
      'Two front legs and two back legs.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],

    // =========================================================================
    // 6. TRUE / FALSE (10 Grade 1 Questions)
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
      'True or False: 5 is greater than 8.',
      'True', 'False', '', '',
      'False', '', '', '', '', '',
      'true_false', 'Easy',
      'False. 8 is bigger than 5.',
      '5 is smaller than 8.',
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
      'Does a circle have any corners?',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'True or False: 10 is an even number.',
      'True', 'False', '', '',
      'True', '', '', '', '', '',
      'true_false', 'Easy',
      'True. 10 splits into 5 and 5 with no remainder.',
      'Even numbers end in 0.',
      curr, subj, grd, cat, sk
    ],
    [
      'True or False: There are 12 months in one full year.',
      'True', 'False', '', '',
      'True', '', '', '', '', '',
      'true_false', 'Easy',
      'True. There are 12 months from January to December.',
      'Think of months in the year.',
      curr, subj, grd, cat, sk
    ],
    [
      'True or False: 7 minus 2 equals 6.',
      'True', 'False', '', '',
      'False', '', '', '', '', '',
      'true_false', 'Easy',
      'False. 7 - 2 = 5, not 6.',
      'Count back 2 from 7.',
      curr, subj, grd, cat, sk
    ],
    [
      'True or False: A triangle has exactly 3 straight sides.',
      'True', 'False', '', '',
      'True', 'triangle', '1', 'pop', 'picture_choice',
      'Choose True or False.',
      'true_false', 'Easy',
      'True. Every triangle has 3 sides.',
      'Count the sides on a triangle.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'True or False: The number zero (0) means empty or nothing.',
      'True', 'False', '', '',
      'True', '', '', '', '', '',
      'true_false', 'Easy',
      'True. Zero represents having no items.',
      'Zero means none.',
      curr, subj, grd, cat, sk
    ],
    [
      'True or False: 15 comes before 14 when counting up.',
      'True', 'False', '', '',
      'False', '', '', '', '', '',
      'true_false', 'Easy',
      'False. We count 14, then 15.',
      '14 comes first, then 15.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 7. MATCH MAKING (10 Grade 1 Questions)
    // =========================================================================
    [
      'Match each animal with its sound:',
      'Cat -> Meow', 'Dog -> Woof', 'Cow -> Moo', 'Duck -> Quack',
      'All', 'cat|dog|cow|duck', '4', 'bounce', 'picture_choice',
      'Connect each animal on the left to its sound on the right.',
      'match_making', 'Easy',
      'Cat goes meow, dog goes woof, cow goes moo, and duck goes quack.',
      'Think of animal sounds.',
      curr, subj, grd, 'CAT-ENG', 'SK-ENG-01'
    ],
    [
      'Match each number digit to its written word:',
      '1 -> One', '2 -> Two', '3 -> Three', '4 -> Four',
      'All', '', '', '', '', '',
      'match_making', 'Easy',
      '1 is One, 2 is Two, 3 is Three, 4 is Four.',
      'Read number words.',
      curr, subj, grd, cat, sk
    ],
    [
      'Match each baby animal to its mother:',
      'Puppy -> Dog', 'Kitten -> Cat', 'Calf -> Cow', 'Duckling -> Duck',
      'All', 'dog|cat|cow|duck', '4', 'bounce', 'picture_choice',
      'Connect each baby animal with its parent.',
      'match_making', 'Easy',
      'Puppies grow into dogs, kittens into cats, calves into cows, and ducklings into ducks.',
      'Pair babies with grown-ups.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Match each shape to its number of sides:',
      'Triangle -> 3 Sides', 'Square -> 4 Sides', 'Pentagon -> 5 Sides', 'Circle -> 0 Sides',
      'All', 'triangle|square|circle', '3', 'pulse', 'picture_choice',
      'Match each shape to the count of its sides.',
      'match_making', 'Medium',
      'Triangle has 3 sides, square has 4, pentagon has 5, and circle has 0.',
      'Count sides on each shape.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Match each word with its opposite word:',
      'Big -> Small', 'Hot -> Cold', 'Up -> Down', 'Fast -> Slow',
      'All', '', '', '', '', '',
      'match_making', 'Easy',
      'Big is opposite to small, hot to cold, up to down, and fast to slow.',
      'Think of opposite meanings.',
      curr, subj, grd, 'CAT-ENG', 'SK-ENG-01'
    ],
    [
      'Match each healthy fruit to its natural color:',
      'Apple -> Red', 'Banana -> Yellow', 'Grape -> Purple', 'Orange -> Orange',
      'All', 'apple|banana|strawberry', '3', 'bounce', 'picture_choice',
      'Connect each fruit to its color.',
      'match_making', 'Easy',
      'Apples are red, bananas are yellow, grapes are purple, and oranges are orange.',
      'What color is each fruit?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
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
      'Match the rhyming words together:',
      'Cat -> Hat', 'Sun -> Fun', 'Frog -> Log', 'Star -> Car',
      'All', '', '', '', '', '',
      'match_making', 'Easy',
      'Cat rhymes with hat, sun with fun, frog with log, star with car.',
      'Listen for matching ending sounds.',
      curr, subj, grd, 'CAT-ENG', 'SK-ENG-01'
    ],
    [
      'Match each creature to where it lives (habitat):',
      'Bird -> Nest', 'Fish -> Water', 'Bear -> Cave', 'Bee -> Hive',
      'All', 'fish|bear', '2', 'bounce', 'picture_choice',
      'Connect each animal to its home.',
      'match_making', 'Easy',
      'Birds live in nests, fish in water, bears in caves, bees in hives.',
      'Where does each animal sleep?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Match each vehicle to how it travels:',
      'Car -> Road', 'Boat -> Water', 'Airplane -> Sky', 'Train -> Tracks',
      'All', 'car|boat|airplane', '3', 'bounce', 'picture_choice',
      'Connect each vehicle to its route.',
      'match_making', 'Easy',
      'Cars travel on roads, boats on water, planes in the sky, trains on tracks.',
      'Where does each vehicle move?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],

    // =========================================================================
    // 8. DRAG AND DROP (10 Grade 1 Questions)
    // =========================================================================
    [
      'Drag each object into its correct category basket:',
      'Apple -> Fruit Basket', 'Toy Car -> Toy Box', 'Banana -> Fruit Basket', 'Balloon -> Toy Box',
      'All', 'apple|car|banana|balloon', '4', 'bounce', 'picture_choice',
      'Drag each item to its matching target zone.',
      'drag_and_drop', 'Easy',
      'Fruits go into the fruit basket and cars/balloons go to the toy box.',
      'Separate fruits from toys.',
      curr, subj, grd, cat, sk
    ],
    [
      'Drag each animal to where it lives:',
      'Goldfish -> Water Pond', 'Lion -> Jungle Land', 'Dolphin -> Water Pond', 'Monkey -> Jungle Land',
      'All', 'fish|lion|monkey', '3', 'bounce', 'picture_choice',
      'Drag each animal to Water Pond or Jungle Land.',
      'drag_and_drop', 'Easy',
      'Fish and dolphins belong in water; lions and monkeys belong on land.',
      'Water swimmers vs Land climbers.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Drag each number into the Even or Odd bucket:',
      '2 -> Even Numbers', '3 -> Odd Numbers', '4 -> Even Numbers', '5 -> Odd Numbers',
      'All', '', '', '', '', '',
      'drag_and_drop', 'Medium',
      '2 and 4 are even; 3 and 5 are odd.',
      'Even numbers can be split in half evenly.',
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
      'Drag each clothing item to the correct weather:',
      'Warm Coat -> Cold Winter', 'Swimsuit -> Sunny Summer', 'Wool Scarf -> Cold Winter', 'Sunglasses -> Sunny Summer',
      'All', '', '', '', '', '',
      'drag_and_drop', 'Easy',
      'Coats and scarves are for winter; swimsuits and sunglasses are for summer.',
      'What do you wear when it is cold vs hot?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Drag each food to Healthy Food or Sweet Treat:',
      'Broccoli -> Healthy Food', 'Lollipop -> Sweet Treat', 'Carrot -> Healthy Food', 'Candy Bar -> Sweet Treat',
      'All', 'apple|cookie', '2', 'bounce', 'picture_choice',
      'Drag vegetables/fruits to Healthy and candies to Sweet Treat.',
      'drag_and_drop', 'Easy',
      'Broccoli and carrots are healthy foods; lollipops and candies are sweet treats.',
      'Which foods are good for your body?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Drag each tool to the worker who uses it:',
      'Stethoscope -> Doctor', 'Fire Hose -> Firefighter', 'Thermometer -> Doctor', 'Ladder -> Firefighter',
      'All', '', '', '', '', '',
      'drag_and_drop', 'Easy',
      'Doctors use stethoscopes and thermometers; firefighters use hoses and ladders.',
      'Match tools to community helpers.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Drag each word to its starting letter sound:',
      'Sun -> S Sound', 'Apple -> A Sound', 'Star -> S Sound', 'Ant -> A Sound',
      'All', 'sun|apple|star', '3', 'bounce', 'picture_choice',
      'Drag words to the S Sound box or A Sound box.',
      'drag_and_drop', 'Easy',
      'Sun and Star start with S; Apple and Ant start with A.',
      'Say the first sound out loud.',
      curr, subj, grd, 'CAT-ENG', 'SK-ENG-01'
    ],
    [
      'Drag each item into Light Weight or Heavy Weight:',
      'Feather -> Light Weight', 'Big Elephant -> Heavy Weight', 'Party Balloon -> Light Weight', 'Giant Rock -> Heavy Weight',
      'All', 'balloon|elephant', '2', 'float', 'picture_choice',
      'Drag light items to Light Weight and heavy items to Heavy Weight.',
      'drag_and_drop', 'Easy',
      'Feathers and balloons are light; elephants and big rocks are heavy.',
      'Which items can float in air?',
      curr, subj, grd, 'CAT-MSR', 'SK-MSR-01'
    ],
    [
      'Drag each animal into Mammal or Bird:',
      'Puppy -> Mammal', 'Parrot -> Bird', 'Cat -> Mammal', 'Penguin -> Bird',
      'All', 'dog|cat', '2', 'bounce', 'picture_choice',
      'Drag animals with fur to Mammal and animals with feathers to Bird.',
      'drag_and_drop', 'Medium',
      'Dogs and cats are mammals with fur; parrots and penguins are birds with feathers.',
      'Look for feathers or fur.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],

    // =========================================================================
    // 9. ORDERING (10 Grade 1 Questions)
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
      'Arrange the sizes in order from smallest to largest:',
      'Small', 'Medium', 'Large', 'Extra Large',
      'Small, Medium, Large, Extra Large', '', '', '', '', '',
      'ordering', 'Easy',
      'The sizes grow from Small to Medium to Large to Extra Large.',
      'Smallest comes first.',
      curr, subj, grd, 'CAT-MSR', 'SK-MSR-01'
    ],
    [
      'Arrange the morning routine in the correct order:',
      'Wake up', 'Brush teeth', 'Eat breakfast', 'Go to school',
      'Wake up, Brush teeth, Eat breakfast, Go to school', '', '', '', '', '',
      'ordering', 'Easy',
      'First wake up, then brush teeth, eat breakfast, and head to school.',
      'What do you do first when you get out of bed?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Arrange the life cycle of a butterfly in correct order:',
      'Tiny Egg', 'Caterpillar', 'Chrysalis', 'Butterfly',
      'Tiny Egg, Caterpillar, Chrysalis, Butterfly', '', '', '', '', '',
      'ordering', 'Medium',
      'A butterfly starts as an egg, becomes a caterpillar, makes a chrysalis, and emerges as a butterfly.',
      'First is the egg on a leaf.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Arrange the days of the school week in order:',
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Monday, Tuesday, Wednesday, Thursday', '', '', '', '', '',
      'ordering', 'Easy',
      'The order of weekdays is Monday, Tuesday, Wednesday, Thursday.',
      'Start with Monday.',
      curr, subj, grd, cat, sk
    ],
    [
      'Arrange the numbers skip counting by 2s:',
      '2', '4', '6', '8',
      '2, 4, 6, 8', 'cookie', '4', 'bounce', 'pattern',
      'Order by counting in 2s.',
      'ordering', 'Medium',
      'Skip counting by 2s: 2, 4, 6, 8.',
      'Add 2 each time.',
      curr, subj, grd, cat, sk
    ],
    [
      'Arrange the plant growth cycle in order:',
      'Seed in Soil', 'Tiny Sprout', 'Young Plant', 'Blooming Flower',
      'Seed in Soil, Tiny Sprout, Young Plant, Blooming Flower', 'tree', '1', 'bounce', 'picture_choice',
      'Order the plant stages from seed to flower.',
      'ordering', 'Easy',
      'First plant the seed, it sprouts, grows into a plant, and blooms a flower.',
      'Everything begins with a seed.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Arrange these letters in alphabetical order:',
      'A', 'B', 'C', 'D',
      'A, B, C, D', '', '', '', '', '',
      'ordering', 'Easy',
      'Alphabetical order is A, B, C, D.',
      'Sing the ABC song in your head.',
      curr, subj, grd, 'CAT-ENG', 'SK-ENG-01'
    ],
    [
      'Arrange the countdown numbers from 10 down to 7:',
      '10', '9', '8', '7',
      '10, 9, 8, 7', 'balloon', '4', 'float', 'pattern',
      'Order the numbers counting backwards.',
      'ordering', 'Medium',
      'Counting backwards: 10, 9, 8, 7.',
      'Start with 10 and count down.',
      curr, subj, grd, cat, sk
    ],

    // =========================================================================
    // 10. SORTING (10 Grade 1 Questions)
    // =========================================================================
    [
      'Sort the items into Fruit Basket or Toy Box:',
      'Fruit Basket: Apple, Banana, Strawberry',
      'Toy Box: Toy Car, Party Balloon',
      '', '',
      'All', 'apple|banana|strawberry|car|balloon', '5', 'bounce', 'picture_choice',
      'Sort each object into its bucket.',
      'sorting', 'Easy',
      'Apples, bananas, and strawberries are fruits; cars and balloons are toys.',
      'Place food in Fruit Basket and toys in Toy Box.',
      curr, subj, grd, cat, sk
    ],
    [
      'Sort each number into Even or Odd group:',
      'Even Group: 2, 4, 6, 8',
      'Odd Group: 1, 3, 5, 7',
      '', '',
      'All', '', '', '', '', '',
      'sorting', 'Medium',
      'Even numbers: 2, 4, 6, 8. Odd numbers: 1, 3, 5, 7.',
      'Even numbers end in 0, 2, 4, 6, 8.',
      curr, subj, grd, cat, sk
    ],
    [
      'Sort animals into Land Animals or Water Creatures:',
      'Land Animals: Lion, Dog, Brown Bear',
      'Water Creatures: Goldfish, Dolphin',
      '', '',
      'All', 'lion|dog|bear|fish', '4', 'bounce', 'picture_choice',
      'Sort animals into land vs water habitats.',
      'sorting', 'Easy',
      'Lions, dogs, and bears live on land; fish and dolphins live in water.',
      'Where does each animal swim or walk?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Sort items into Hot Temperature or Cold Temperature:',
      'Hot Temperature: Campfire, Sun',
      'Cold Temperature: Ice Cube, Snowman',
      '', '',
      'All', 'sun|fire', '2', 'pulse', 'picture_choice',
      'Sort items by whether they are hot or cold.',
      'sorting', 'Easy',
      'The sun and fire are hot; ice cubes and snowmen are cold.',
      'Feel the heat or chill.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Sort objects by their primary color (Red vs Yellow):',
      'Red Objects: Red Apple, Strawberry, Red Heart',
      'Yellow Objects: Ripe Banana, Shiny Sun, Star',
      '', '',
      'All', 'apple|strawberry|heart|banana|sun|star', '6', 'bounce', 'picture_choice',
      'Group objects by Red or Yellow color.',
      'sorting', 'Easy',
      'Apples, strawberries, and hearts are red; bananas, sun, and stars are yellow.',
      'Look at the color of each item.',
      curr, subj, grd, cat, sk
    ],
    [
      'Sort into Living Things vs Non-Living Objects:',
      'Living Things: Green Tree, Fluffy Cat, Puppy',
      'Non-Living Objects: Stone Rock, Wooden Chair, Pencil',
      '', '',
      'All', 'tree|cat|dog', '3', 'bounce', 'picture_choice',
      'Sort things into Living or Non-Living.',
      'sorting', 'Medium',
      'Trees, cats, and dogs grow and need water; rocks, chairs, and pencils do not.',
      'Living things grow and breathe.',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Sort by geometric shape (Round vs Pointy):',
      'Round Shapes: Circle, Wheel, Coin',
      'Pointy Shapes: Triangle, Star',
      '', '',
      'All', 'circle|triangle|star', '3', 'pulse', 'picture_choice',
      'Sort shapes into Round or Pointy buckets.',
      'sorting', 'Easy',
      'Circles, wheels, and coins are round; triangles and stars have pointy corners.',
      'Look for sharp corners.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    [
      'Sort vehicles by Land Vehicles vs Air Vehicles:',
      'Land Vehicles: Blue Car, School Bus',
      'Air Vehicles: Airplane, Helicopter, Rocket',
      '', '',
      'All', 'car|airplane', '2', 'bounce', 'picture_choice',
      'Sort vehicles into Land or Air.',
      'sorting', 'Easy',
      'Cars and buses drive on land; planes, helicopters, and rockets fly in the air.',
      'Does it drive on a road or fly?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Sort food items into Healthy Meal vs Sweet Treat:',
      'Healthy Meal: Fresh Salad, Red Apple, Steamed Rice',
      'Sweet Treat: Chocolate Cookie, Cupcake, Candy',
      '', '',
      'All', 'apple|cookie', '2', 'bounce', 'picture_choice',
      'Sort foods into healthy meals or sweet desserts.',
      'sorting', 'Easy',
      'Salads, apples, and rice are healthy meals; cookies, cupcakes, and candy are sweet treats.',
      'Which foods give your body good energy?',
      curr, subj, grd, 'CAT-SCI', 'SK-SCI-01'
    ],
    [
      'Sort English letters into Vowels vs Consonants:',
      'Vowels: A, E, I, O, U',
      'Consonants: B, C, D, F, G',
      '', '',
      'All', '', '', '', '', '',
      'sorting', 'Medium',
      'A, E, I, O, U are vowels; B, C, D, F, G are consonants.',
      'Remember the 5 special vowels: A, E, I, O, U.',
      curr, subj, grd, 'CAT-ENG', 'SK-ENG-01'
    ]
  ];

  const wsQuestions = XLSX.utils.aoa_to_sheet([questionsHeaders, ...sampleQuestionsRows]);
  wsQuestions['!cols'] = [
    { wch: 45 }, // Question Text
    { wch: 18 }, // Option A
    { wch: 18 }, // Option B
    { wch: 18 }, // Option C
    { wch: 18 }, // Option D
    { wch: 16 }, // Correct Answer
    { wch: 22 }, // Clipart Reference
    { wch: 14 }, // Visual Count
    { wch: 16 }, // Visual Animation
    { wch: 18 }, // Visual Template
    { wch: 32 }, // Visual Instructions
    { wch: 18 }, // Question Type
    { wch: 12 }, // Difficulty
    { wch: 30 }, // Explanation
    { wch: 25 }, // Hint
    { wch: 16 }, // Curriculum
    { wch: 14 }, // Subject
    { wch: 14 }, // Grade
    { wch: 14 }, // Category
    { wch: 14 }  // Skill
  ];
  XLSX.utils.book_append_sheet(wb, wsQuestions, 'Questions');

  // -------------------------------------------------------------
  // Sheet 3: Clipart Library Catalog
  // -------------------------------------------------------------
  const clipartHeaders = ['Clipart Code / ID', 'Clipart Name', 'Emoji Preview', 'Category', 'Default Animation', 'Keywords / Aliases'];
  const clipartRows = CLIPART_LIBRARY.map(c => [
    c.id,
    c.name,
    c.emoji,
    c.category,
    c.defaultAnimation,
    c.keywords.join(', ')
  ]);

  const wsClipart = XLSX.utils.aoa_to_sheet([clipartHeaders, ...clipartRows]);
  wsClipart['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 22 },
    { wch: 18 },
    { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, wsClipart, 'Clipart_Library');

  // -------------------------------------------------------------
  // Sheet 4: Master Reference Codes & Category/Skill Mappings
  // -------------------------------------------------------------
  const currList = options.curriculaList && options.curriculaList.length > 0
    ? options.curriculaList.map(c => [c.code || c.id, c.name])
    : [
        ['CUR-VCAA20', 'Victorian Curriculum 2.0 (Australia)'],
        ['CUR-ACARA', 'Australian Curriculum (ACARA)'],
        ['CUR-CCSS', 'US Common Core State Standards'],
        ['CUR-CBSE', 'CBSE (India)'],
        ['CUR-UKNC', 'UK National Curriculum'],
        ['CUR-IBPYP', 'IB Primary Years Programme'],
        ['CUR-ON', 'Ontario Curriculum (Canada)'],
        ['CUR-GLOBAL', 'Global Standard Framework']
      ];

  const subjList = options.subjectsList && options.subjectsList.length > 0
    ? options.subjectsList.map(s => [s.id, s.name])
    : [
        ['SUB_MTH', 'Mathematics'],
        ['SUB_SCI', 'Science & Nature'],
        ['SUB_ENG', 'English / Language Arts'],
        ['SUB_ART', 'Art & Creativity']
      ];

  const gradeList = options.gradesList && options.gradesList.length > 0
    ? options.gradesList.map(g => [g.id, g.name])
    : [
        ['GRD_PRE_K', 'Preschool (Ages 3-4)'],
        ['GRD_KG', 'Foundation / Kindergarten (Ages 5-6)'],
        ['GRD_G1', 'Grade 1 (Ages 6-7)'],
        ['GRD_G2', 'Grade 2 (Ages 7-8)'],
        ['GRD_G3', 'Grade 3 (Ages 8-9)'],
        ['GRD_G4', 'Grade 4 (Ages 9-10)'],
        ['GRD_G5', 'Grade 5 (Ages 10-11)'],
        ['GRD_G6', 'Grade 6 (Ages 11-12)']
      ];

  // Dynamic Category & Skill List (Combined catalog + any system master categories)
  const categorySkillRows: string[][] = [];
  const addedCodes = new Set<string>();

  if (options.masterCategories && options.masterCategories.length > 0 && options.masterSkills && options.masterSkills.length > 0) {
    options.masterCategories.forEach(cat => {
      const skills = options.masterSkills!.filter(s => s.categoryId === cat.id || s.categoryCode === cat.code);
      skills.forEach(sk => {
        const key = `${cat.code || cat.id}:${sk.code || sk.id}`;
        if (!addedCodes.has(key)) {
          addedCodes.add(key);
          categorySkillRows.push([
            cat.code || cat.id,
            cat.name,
            sk.code || sk.id,
            sk.name,
            cat.subjectId || 'SUB_MTH',
            cat.gradeId || 'All Grades'
          ]);
        }
      });
    });
  }

  // Add all comprehensive catalog mappings
  MASTER_CATEGORY_SKILL_CATALOG.forEach(entry => {
    const key = `${entry.catCode}:${entry.skCode}`;
    if (!addedCodes.has(key)) {
      addedCodes.add(key);
      categorySkillRows.push([
        entry.catCode,
        entry.catName,
        entry.skCode,
        entry.skName,
        entry.subject,
        entry.grades
      ]);
    }
  });

  const maxTopRows = Math.max(currList.length, subjList.length, gradeList.length);
  const masterRefData: any[][] = [
    ['CURRICULUM CODES', 'Curriculum Name', 'SUBJECT CODES', 'Subject Name', 'GRADE CODES', 'Grade Level']
  ];

  for (let i = 0; i < maxTopRows; i++) {
    const c = currList[i] || ['', ''];
    const s = subjList[i] || ['', ''];
    const g = gradeList[i] || ['', ''];
    masterRefData.push([c[0], c[1], s[0], s[1], g[0], g[1]]);
  }

  masterRefData.push(['', '', '', '', '', '']);
  masterRefData.push(['CATEGORY & SKILL CODE MAPPINGS (DYNAMIC ACROSS ALL GRADES)', '', '', '', '', '']);
  masterRefData.push(['Category Code', 'Category Name', 'Skill Code', 'Skill Name', 'Subject', 'Target Grades']);

  categorySkillRows.forEach(row => {
    masterRefData.push(row);
  });

  masterRefData.push(['', '', '', '', '', '']);
  masterRefData.push(['ANIMATION OPTIONS', 'Description', 'DIFFICULTY OPTIONS', 'Description', 'QUESTION TYPE OPTIONS', 'Description']);
  masterRefData.push(['bounce', 'Bounces up and down', 'Easy', 'Primary / Beginner level', 'multiple_choice', 'Standard multiple choice (A, B, C, D)']);
  masterRefData.push(['pulse', 'Gentle pulsing scale effect', 'Medium', 'Intermediate level', 'picture_counting', 'Count interactive bouncing objects']);
  masterRefData.push(['pop', 'Snappy popping entrance', 'Hard', 'Advanced challenge', 'picture_choice', 'Choose from picture tiles']);
  masterRefData.push(['float', 'Floating wave motion', '', '', 'open_box', 'Type answer with number pad']);
  masterRefData.push(['spin', 'Gentle 360 degree spin', '', '', 'true_false', 'True or False choice']);
  masterRefData.push(['none', 'Static display', '', '', 'drag_and_drop', 'Drag items to targets']);
  masterRefData.push(['', '', '', '', 'ordering', 'Number or item sequencing']);
  masterRefData.push(['', '', '', '', 'sorting', 'Sort items into buckets']);
  masterRefData.push(['', '', '', '', 'match_making', 'Connect matching pairs']);
  masterRefData.push(['', '', '', '', 'select_objects', 'Interactive object counting & target tagging']);

  const wsMaster = XLSX.utils.aoa_to_sheet(masterRefData);
  wsMaster['!cols'] = [{ wch: 18 }, { wch: 36 }, { wch: 18 }, { wch: 36 }, { wch: 18 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master_Codes');

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

    const findCol = (name: string) => headerRow.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const colOptA = findCol('Option A');
    const colOptB = findCol('Option B');
    const colOptC = findCol('Option C');
    const colOptD = findCol('Option D');
    const colCorrect = findCol('Correct Answer');
    const colClipartRef = findCol('Clipart Reference') >= 0 ? findCol('Clipart Reference') : findCol('Visual Objects');
    const colCount = findCol('Visual Count');
    const colAnimation = findCol('Visual Animation');
    const colTemplate = findCol('Visual Template');
    const colInstructions = findCol('Visual Instructions');
    const colType = findCol('Question Type');
    const colDiff = findCol('Difficulty');
    const colExp = findCol('Explanation');
    const colHint = findCol('Hint');
    const colCurr = findCol('Curriculum Code');
    const colSub = findCol('Subject Code');
    const colGrd = findCol('Grade Code');
    const colCat = findCol('Category Code');
    const colSk = findCol('Skill Code');

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
          const resolvedCatSk = resolveCategoryAndSkill(
            rowCat,
            rowSk,
            grdId,
            context.masterCategories,
            context.masterSkills
          );
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
        status: 'Draft',
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
