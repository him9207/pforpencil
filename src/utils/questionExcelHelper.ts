import * as XLSX from 'xlsx';
import { Question, QuestionType, VisualAnimation, VisualQuestionTemplate } from '../types';
import { CLIPART_LIBRARY, lookupClipart, resolveClipartString } from '../data/clipartLibraryData';

export interface ParsedExcelResult {
  questions: Question[];
  errors: string[];
  warnings: string[];
}

/**
 * Generate a complete, teacher-friendly Excel Workbook (.xlsx)
 * with Clipart Library, Master Codes, and Ready-to-Test Question Types.
 */
export function generateQuestionMasterExcel(options: {
  countryCode?: string;
  regionCode?: string;
  curriculumCode?: string;
  subjectCode?: string;
  gradeCode?: string;
  categoryCode?: string;
  skillCode?: string;
}): Blob {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Quick Start Instructions & Guide
  // -------------------------------------------------------------
  const instructionsData = [
    ['PforPencil Question Bank - Excel Master Template & Guide'],
    [''],
    ['HOW TO USE THIS EXCEL TEMPLATE:'],
    ['1. Go to the "Questions" sheet to add or edit questions.'],
    ['2. For visual questions, you do NOT need to upload or paste images!'],
    ['   Simply use the "Clipart Reference" column with codes from the "Clipart_Library" sheet (e.g. "apple", "star", "cookie").'],
    ['3. Specify the "Visual Count" (e.g. 3) and "Animation" (bounce, pulse, pop, float, spin).'],
    ['4. Save the file and upload it in the Question Bank modal!'],
    [''],
    ['QUESTION TYPES SUPPORTED:'],
    ['- multiple_choice : Standard A, B, C, D multiple choice.'],
    ['- picture_counting: Interactive counting of bouncing or animated objects.'],
    ['- picture_choice  : Multiple choice with visual object options.'],
    ['- open_box        : Direct number/word input with quick option buttons.'],
    ['- true_false      : True / False question format.'],
    ['- drag_and_drop   : Drag items into matching destination zones.'],
    ['- ordering        : Arrange sequence in correct order (e.g. 1, 2, 3, 4).'],
    ['- sorting         : Sort items into distinct buckets/categories.'],
    ['- match_making    : Connect matching pairs on left and right.'],
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
    ['Subject Code        : e.g. "SUB_MTH", "SUB_ENG".'],
    ['Grade Code          : e.g. "GRD_G1", "GRD_G2", "GRD_PRE_K".']
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
    // 1. Picture Counting
    [
      'How many apples are shown on the screen?',
      '2',
      '3',
      '4',
      '5',
      'B',
      'apple',
      '3',
      'bounce',
      'picture_counting',
      'Tap each apple to count them!',
      'picture_counting',
      'Easy',
      'There are 3 red apples.',
      'Count them one by one from left to right.',
      curr, subj, grd, cat, sk
    ],
    // 2. Picture Choice
    [
      'Which shape is an orange triangle?',
      'Red Circle',
      'Orange Triangle',
      'Blue Square',
      'Golden Star',
      'B',
      'circle_red|triangle|square_blue|star',
      '1',
      'pop',
      'picture_choice',
      'Tap the triangle shape.',
      'picture_choice',
      'Easy',
      'The triangle has 3 straight sides.',
      'Look for the shape with 3 corners.',
      curr, subj, grd, 'CAT-GEO', 'SK-GEO-01'
    ],
    // 3. Open Box / Fill in the Blank
    [
      'Count the cookies and write the number in the box:',
      '4',
      '5',
      '6',
      '',
      '5',
      'cookie',
      '5',
      'bounce',
      'picture_counting',
      'Count all the yummy cookies!',
      'open_box',
      'Easy',
      'There are 5 cookies in total.',
      'Count each cookie.',
      curr, subj, grd, cat, sk
    ],
    // 4. True / False
    [
      'True or False: There are 4 glowing stars on the screen.',
      'True',
      'False',
      '',
      '',
      'True',
      'star',
      '4',
      'pulse',
      'picture_counting',
      'Count the stars carefully.',
      'true_false',
      'Easy',
      'There are exactly 4 stars shown.',
      'Count the yellow stars.',
      curr, subj, grd, cat, sk
    ],
    // 5. Standard Multiple Choice (No visuals / pure math)
    [
      'What is 14 + 5?',
      '18',
      '19',
      '20',
      '21',
      'B',
      '',
      '',
      '',
      '',
      '',
      'multiple_choice',
      'Medium',
      '14 + 5 = 19.',
      'Add 5 to 14.',
      curr, subj, grd, cat, sk
    ],
    // 6. Number Ordering
    [
      'Arrange these numbers in order from least to greatest:',
      '1',
      '2',
      '3',
      '4',
      '1, 2, 3, 4',
      'star',
      '4',
      'pop',
      'pattern',
      'Drag or place numbers into counting order.',
      'ordering',
      'Easy',
      'The counting sequence is 1, 2, 3, 4.',
      'Start with the smallest number 1.',
      curr, subj, grd, cat, sk
    ],
    // 7. Drag and Drop
    [
      'Place each item into its correct basket or box:',
      'Apple -> Fruit Basket',
      'Car -> Toy Box',
      'Banana -> Fruit Basket',
      '',
      'All',
      'apple|car|banana',
      '3',
      'bounce',
      'picture_choice',
      'Drag each item to its matching target zone.',
      'drag_and_drop',
      'Easy',
      'Fruits go into the fruit basket and cars go to the toy box.',
      'Separate fruits from toys.',
      curr, subj, grd, cat, sk
    ],
    // 8. Sorting
    [
      'Sort the items into Fruit Basket or Toy Box:',
      'Fruit Basket: Apple, Banana, Strawberry',
      'Toy Box: Toy Car, Balloon',
      '',
      '',
      'All',
      'apple|banana|strawberry|car|balloon',
      '5',
      'bounce',
      'picture_choice',
      'Sort each object into its bucket.',
      'sorting',
      'Easy',
      'Place food in Fruit Basket and toys in Toy Box.',
      'Group matching objects together.',
      curr, subj, grd, cat, sk
    ],
    // 9. Match Making
    [
      'Match each animal with its sound:',
      'Cat -> Meow',
      'Dog -> Woof',
      'Cow -> Moo',
      '',
      'All',
      'cat|dog',
      '2',
      'bounce',
      'picture_choice',
      'Connect each animal on the left to its sound on the right.',
      'match_making',
      'Easy',
      'Cats say meow and dogs say woof.',
      'Think about animal noises.',
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
  // Sheet 4: Master Reference Codes
  // -------------------------------------------------------------
  const masterRefData = [
    ['CURRICULUM CODES', '', 'SUBJECT CODES', '', 'GRADE CODES', ''],
    ['CUR-VCAA20', 'Victorian Curriculum 2.0 (Australia)', 'SUB_MTH', 'Mathematics', 'GRD_PRE_K', 'Pre-Kindergarten'],
    ['CUR-ACARA', 'Australian Curriculum (ACARA)', 'SUB_ENG', 'English / Language Arts', 'GRD_KG', 'Kindergarten'],
    ['CUR-CCSS', 'US Common Core State Standards', 'SUB_SCI', 'Science', 'GRD_G1', 'Grade 1'],
    ['CUR-CBSE', 'CBSE (India)', 'SUB_ART', 'Art & Creativity', 'GRD_G2', 'Grade 2'],
    ['CUR-UKNC', 'UK National Curriculum', '', '', 'GRD_G3', 'Grade 3'],
    ['CUR-GLOBAL', 'Global Standard Framework', '', '', 'GRD_G4', 'Grade 4'],
    ['', '', '', '', 'GRD_G5', 'Grade 5'],
    ['ANIMATION OPTIONS:', '', 'DIFFICULTY OPTIONS:', '', 'QUESTION TYPE OPTIONS:', ''],
    ['bounce', 'Bounces up and down', 'Easy', 'Primary / Beginner level', 'multiple_choice', 'Standard multiple choice (A, B, C, D)'],
    ['pulse', 'Gentle pulsing scale effect', 'Medium', 'Intermediate level', 'picture_counting', 'Count interactive bouncing objects'],
    ['pop', 'Snappy popping entrance', 'Hard', 'Advanced challenge', 'picture_choice', 'Choose from picture tiles'],
    ['float', 'Floating wave motion', '', '', 'open_box', 'Type answer with number pad'],
    ['spin', 'Gentle 360 degree spin', '', '', 'true_false', 'True or False choice'],
    ['none', 'Static display', '', '', 'drag_and_drop', 'Drag items to targets'],
    ['', '', '', '', 'ordering', 'Number or item sequencing'],
    ['', '', '', '', 'sorting', 'Sort items into buckets'],
    ['', '', '', '', 'match_making', 'Connect matching pairs']
  ];

  const wsMaster = XLSX.utils.aoa_to_sheet(masterRefData);
  wsMaster['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 16 }, { wch: 25 }, { wch: 16 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master_Codes');

  // Write workbook to binary buffer and return as Blob
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Parse an uploaded Excel (.xlsx or .xls) file
 */
export async function parseQuestionExcelFile(file: File, context: {
  existingQuestions: Question[];
  getNextId: (grade: string, existing: Question[], offset: number, subject: string) => string;
  defaultCurriculumId?: string;
  defaultCountryId?: string;
  defaultRegionId?: string;
  defaultSubjectId?: string;
  defaultGradeId?: string;
  defaultCategoryId?: string;
  defaultSkillId?: string;
}): Promise<ParsedExcelResult> {
  const questions: Question[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuffer, { type: 'array' });

    // Locate the Questions sheet (or first non-instruction sheet)
    let sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('question')) || wb.SheetNames[0];
    if (sheetName.toLowerCase().includes('instruction') && wb.SheetNames.length > 1) {
      sheetName = wb.SheetNames[1];
    }

    const ws = wb.Sheets[sheetName];
    if (!ws) {
      errors.push(`Could not find a valid Questions sheet in the workbook.`);
      return { questions, errors, warnings };
    }

    const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rawRows.length < 2) {
      errors.push(`The Questions sheet is empty or missing data rows.`);
      return { questions, errors, warnings };
    }

    const headerRow = rawRows[0].map((h: any) => String(h || '').trim());
    const findCol = (name: string) => headerRow.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const colPrompt = findCol('Question Text');
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
      const rowNum = rIdx + 1;
      const getVal = (col: number) => (col >= 0 && row[col] !== undefined ? String(row[col]).trim() : '');

      const prompt = getVal(colPrompt);
      if (!prompt) continue; // skip blank rows

      const optA = getVal(colOptA);
      const optB = getVal(colOptB);
      const optC = getVal(colOptC);
      const optD = getVal(colOptD);
      const options = [optA, optB, optC, optD].filter(Boolean);

      const rawCorrect = getVal(colCorrect);
      let correctIndex = 0;
      if (['A', '0', 'OPTION A'].includes(rawCorrect.toUpperCase())) correctIndex = 0;
      else if (['B', '1', 'OPTION B'].includes(rawCorrect.toUpperCase())) correctIndex = 1;
      else if (['C', '2', 'OPTION C'].includes(rawCorrect.toUpperCase())) correctIndex = 2;
      else if (['D', '3', 'OPTION D'].includes(rawCorrect.toUpperCase())) correctIndex = 3;
      else {
        // Try matching text
        const matchedIdx = options.findIndex(o => o.toLowerCase() === rawCorrect.toLowerCase());
        if (matchedIdx >= 0) correctIndex = matchedIdx;
      }

      const rawType = getVal(colType).toLowerCase();
      let type: QuestionType = 'multiple_choice';
      if (['picture_counting', 'picture_choice', 'drag_and_drop', 'match_making', 'ordering', 'sorting', 'fill_blank', 'open_box', 'true_false', 'image_choice'].includes(rawType)) {
        type = rawType as QuestionType;
      }

      const rawDiff = getVal(colDiff);
      const difficulty: 'Easy' | 'Medium' | 'Hard' = ['Easy', 'Medium', 'Hard'].includes(rawDiff)
        ? (rawDiff as any)
        : 'Easy';

      const clipartRef = getVal(colClipartRef);
      const countNum = parseInt(getVal(colCount), 10) || ((type as string) === 'picture_counting' ? parseInt(options[correctIndex] || '3', 10) || 3 : 1);
      const rawAnim = getVal(colAnimation).toLowerCase();
      const animation: VisualAnimation = ['bounce', 'pulse', 'pop', 'float', 'spin', 'none'].includes(rawAnim)
        ? (rawAnim as VisualAnimation)
        : 'bounce';
      const rawTemplate = getVal(colTemplate);
      const template: VisualQuestionTemplate = ['picture_counting', 'picture_choice', 'pattern', 'drag_drop', 'matching', 'sorting', 'ordering', 'number_line', 'interactive_story'].includes(rawTemplate)
        ? (rawTemplate as VisualQuestionTemplate)
        : ((type as string) === 'picture_counting' ? 'picture_counting' : (type as string) === 'picture_choice' ? 'picture_choice' : 'picture_counting');
      const instructions = getVal(colInstructions) || 'Tap the pictures and choose the answer.';

      const explanation = getVal(colExp) || `The correct answer is ${options[correctIndex] || rawCorrect}.`;
      const hint = getVal(colHint);

      const currCode = getVal(colCurr) || context.defaultCurriculumId || 'CUR-VCAA20';
      const subCode = getVal(colSub) || context.defaultSubjectId || 'SUB_MTH';
      const grdCode = getVal(colGrd) || context.defaultGradeId || 'GRD_G1';
      const catCode = getVal(colCat) || context.defaultCategoryId || 'CAT-NUM';
      const skCode = getVal(colSk) || context.defaultSkillId || 'SK-NUM-01';

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
          interaction: 'tap',
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
      }

      const qId = context.getNextId(grdCode, existingTracker, 0, subCode);

      const q: Question = {
        id: qId,
        curriculumId: currCode,
        countryId: context.defaultCountryId || 'CNT-AU',
        regionId: context.defaultRegionId || 'REG-VIC',
        subjectId: subCode,
        gradeId: grdCode,
        categoryId: catCode,
        skillId: skCode,
        grade: grdCode,
        subject: subCode,
        category: catCode,
        skill: skCode,
        difficulty,
        type,
        prompt,
        options: (type === 'open_box' || type === 'fill_blank') && options.length === 0 ? [rawCorrect] : (options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D']),
        correctIndex: Math.max(0, Math.min(options.length - 1, correctIndex)),
        openBoxAnswer: (type === 'open_box' || type === 'fill_blank') ? rawCorrect : undefined,
        explanation,
        hint,
        points: difficulty === 'Hard' ? 30 : difficulty === 'Medium' ? 20 : 10,
        status: 'draft',
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
