import React, { useEffect, useMemo, useState } from 'react';
import { Question, Subject, GradeLevel, QuestionType, CurriculumGrade, CurriculumSubject, VisualQuestionConfig, VisualQuestionTemplate, VisualAnimation } from '../../../types';
import { X, HelpCircle, Sparkles, Check, Plus, AlertCircle, Download, Upload, FileSpreadsheet, Eye, Globe, Trash2, Palette, Search, Edit3, Copy } from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { getNextQuestionId } from '../../../utils/idAndUsernameGenerator';
import { loadCurriculumMaster } from '../../../data/curriculumMasterData';
import { CategoryMasterRecord, SkillMasterRecord } from '../../../data/questionBankMasterData';
import { fixMojibake, parseVisualObjectsString } from '../../../utils/visualUtils';
import { generateQuestionMasterExcel, parseQuestionExcelFile } from '../../../utils/questionExcelHelper';
import { CLIPART_LIBRARY } from '../../../data/clipartLibraryData';
import QuestionPreviewModal from './QuestionPreviewModal';
import QuestionEditModal from './QuestionEditModal';

interface Props {
  isOpen: boolean; onClose: () => void; availableGrades: string[]; availableSubjects: string[]; questions?: Question[];
  onAddQuestion: (q: Question) => void; onAddBatchQuestions?: (q: Question[]) => void;
  nextQuestionId?: string;
  initialGrade?: string; initialSubject?: string; initialCategory?: string; initialSkill?: string;
  initialCountryId?: string; initialRegionId?: string; initialCurriculumId?: string;
  categoryMasters?: CategoryMasterRecord[]; skillMasters?: SkillMasterRecord[];
  grades?: CurriculumGrade[]; subjects?: CurriculumSubject[];
}

const TYPES: { value: QuestionType; label: string }[] = [
  {value:'multiple_choice',label:'Multiple Choice'},{value:'radio_single',label:'Single Choice'},{value:'fill_blank',label:'Fill in the Blank'},
  {value:'true_false',label:'True / False'},{value:'image_choice',label:'Image Choice'},{value:'image_mcq',label:'Image + MCQ'},
  {value:'select_objects',label:'Select Objects'},{value:'drag_and_drop',label:'Drag & Drop'},{value:'match_making',label:'Matching'},
  {value:'ordering',label:'Ordering'},{value:'sorting',label:'Sorting'},{value:'number_line',label:'Number Line'},
  {value:'clock',label:'Clock'},{value:'data_graph',label:'Data / Graph'},{value:'word_problem',label:'Word Problem'},{value:'interactive',label:'Interactive'}
];
const CLIPART=['🍎','🍌','🍓','🍊','⭐','🐶','🐱','🦁','🔺','🔵','🟩','🎈','🚗','🍪'];
const typeLabel = (q: Question) => TYPES.find(t => t.value === q.type)?.label || (q.type ? String(q.type).replace(/_/g, ' ') : 'Multiple Choice');
const csvEscape=(v:any)=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
const parseCsv=(text:string)=>{const rows:string[][]=[];let row:string[]=[];let cell='';let quote=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(ch===','&&!quote){row.push(cell.trim());cell='';}else if((ch==='\n'||ch==='\r')&&!quote){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());cell='';if(row.some(x=>x!==''))rows.push(row);row=[];}else cell+=ch;}row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);return rows;};

export default function QuestionBankModal({isOpen,onClose,availableGrades,availableSubjects,questions=[],onAddQuestion,onAddBatchQuestions,initialGrade,initialSubject,initialCategory,initialSkill,initialCountryId,initialRegionId,initialCurriculumId,categoryMasters=[],skillMasters=[],grades=[],subjects=[]}:Props){
  const cm=loadCurriculumMaster();
  const countries=cm.countries.filter(x=>x.active).sort((a,b)=>a.displayOrder-b.displayOrder);
  const [mode,setMode]=useState<'single'|'batch'|'csv_upload'|'clipart_library'>('single');
  const [countryId,setCountryId]=useState(initialCountryId||countries[0]?.id||'');
  const regions=useMemo(()=>cm.regions.filter(x=>x.active&&x.countryId===countryId).sort((a,b)=>a.displayOrder-b.displayOrder),[countryId]);
  const [regionId,setRegionId]=useState(initialRegionId||'');
  const curricula=useMemo(()=>cm.curricula.filter(x=>x.active&&x.countryId===countryId&&x.regionId===regionId).sort((a,b)=>a.displayOrder-b.displayOrder),[countryId,regionId]);
  const [curriculumId,setCurriculumId]=useState(initialCurriculumId||'');
  const [grade,setGrade]=useState<GradeLevel>((initialGrade as GradeLevel)||availableGrades[0]||'Grade 1');
  const [subject,setSubject]=useState<Subject>((initialSubject as Subject)||availableSubjects[0]||'Mathematics');
  const selectedGrade=grades.find(g=>g.name===grade); const selectedSubject=subjects.find(s=>s.name===subject);
  const categoryOptions=useMemo(()=>categoryMasters.filter(c=>c.active&&c.curriculumId===curriculumId&&c.subjectId===(selectedSubject?.id||'')&&c.gradeId===(selectedGrade?.id||'')),[categoryMasters,curriculumId,selectedSubject,selectedGrade]);
  const [categoryId,setCategoryId]=useState('');
  const [clipartSearch, setClipartSearch] = useState('');
  const [clipartCategoryFilter, setClipartCategoryFilter] = useState('All');
  const [copiedClipartCode, setCopiedClipartCode] = useState<string | null>(null);
  // When opened from a selected Skill, resolve the exact master category from
  // that Skill first. This prevents a stale/duplicate category name from
  // selecting an empty category and showing "No skill" in the creator.
  const initialSkillRecord=useMemo(()=>{
    if(!initialSkill||!selectedGrade)return undefined;
    return skillMasters.find(s=>s.active&&s.gradeId===selectedGrade.id&&s.name.trim().toLowerCase()===String(initialSkill).trim().toLowerCase());
  },[skillMasters,initialSkill,selectedGrade]);
  const selectedCategory=categoryOptions.find(c=>c.id===categoryId)
    || (initialSkillRecord ? categoryOptions.find(c=>c.id===initialSkillRecord.categoryId) : undefined)
    || categoryOptions.find(c=>c.name.trim().toLowerCase()===String(initialCategory||'').trim().toLowerCase())
    || categoryOptions[0];
  const skillOptions=useMemo(()=>skillMasters.filter(s=>s.active&&s.categoryId===selectedCategory?.id&&s.gradeId===(selectedGrade?.id||'')),[skillMasters,selectedCategory,selectedGrade]);
  const [skillId,setSkillId]=useState('');
  const selectedSkill=skillOptions.find(s=>s.id===skillId)||skillOptions.find(s=>s.name===initialSkill)||skillOptions[0];
  const [difficulty,setDifficulty]=useState<'Easy'|'Medium'|'Hard'>('Easy');
  const [questionType,setQuestionType]=useState<QuestionType>('multiple_choice');
  const [prompt,setPrompt]=useState(''); const [options,setOptions]=useState(['','','','']); const [correctIndex,setCorrectIndex]=useState(0); const [openAnswer,setOpenAnswer]=useState('');
  const [matchPairs, setMatchPairs] = useState<{ left: string; right: string }[]>([
    { left: '🐱 Cat', right: 'Meow' },
    { left: '🐶 Dog', right: 'Woof' },
    { left: '🐮 Cow', right: 'Moo' }
  ]);
  const [dragItems, setDragItems] = useState<{ item: string; target: string }[]>([
    { item: '🍎 Apple', target: '🧺 Fruit Basket' },
    { item: '🚗 Toy Car', target: '🧸 Toy Box' },
    { item: '🍌 Banana', target: '🧺 Fruit Basket' }
  ]);
  const [orderSequence, setOrderSequence] = useState<string[]>(['1', '2', '3', '4']);
  const [sortBuckets, setSortBuckets] = useState<{ bucketName: string; items: string[] }[]>([
    { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
    { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
  ]);
  const [selectObjectsGoal, setSelectObjectsGoal] = useState<number>(4);
  const [visualClipart,setVisualClipart]=useState(''); const [mediaUrl,setMediaUrl]=useState('');
  const [visualEnabled,setVisualEnabled]=useState(false); const [visualTemplate,setVisualTemplate]=useState<VisualQuestionTemplate>('picture_counting');
  const [visualAnimation,setVisualAnimation]=useState<VisualAnimation>('bounce'); const [visualInteraction,setVisualInteraction]=useState<VisualQuestionConfig['interaction']>('tap');
  const [visualInstructions,setVisualInstructions]=useState(''); const [visualImageUrl,setVisualImageUrl]=useState(''); const [visualAudioUrl,setVisualAudioUrl]=useState('');
  const [visualObjects,setVisualObjects]=useState(''); const [visualBackground,setVisualBackground]=useState<NonNullable<VisualQuestionConfig['background']>>('playful'); const [visualAutoPlay,setVisualAutoPlay]=useState(true); const [explanation,setExplanation]=useState(''); const [hint,setHint]=useState(''); const [points,setPoints]=useState(20);
  const [batchCount,setBatchCount]=useState(10); const [batchDifficulty,setBatchDifficulty]=useState<'Easy'|'Medium'|'Hard'|'Mixed'>('Easy'); const [batchType,setBatchType]=useState<'same'|'mixed'>('same'); const [batchVisualMode,setBatchVisualMode]=useState<'text'|'visual'|'mixed'>('text'); const [generated,setGenerated]=useState<Question[]>([]);
  const [useSelectedForCsv,setUseSelectedForCsv]=useState(false); const [csvFileName,setCsvFileName]=useState(''); const [csvErrors,setCsvErrors]=useState<string[]>([]); const [parsed,setParsed]=useState<Question[]>([]); const [csvInput,setCsvInput]=useState<HTMLInputElement|null>(null);
  const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(null);
  const [editingCsvIndex, setEditingCsvIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const resetSingleForm = () => {
    setPrompt('');
    setOptions(['','','','']);
    setCorrectIndex(0);
    setOpenAnswer('');
    setMatchPairs([
      { left: '🐱 Cat', right: 'Meow' },
      { left: '🐶 Dog', right: 'Woof' },
      { left: '🐮 Cow', right: 'Moo' }
    ]);
    setDragItems([
      { item: '🍎 Apple', target: '🧺 Fruit Basket' },
      { item: '🚗 Toy Car', target: '🧸 Toy Box' },
      { item: '🍌 Banana', target: '🧺 Fruit Basket' }
    ]);
    setOrderSequence(['1', '2', '3', '4']);
    setSortBuckets([
      { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
      { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
    ]);
    setSelectObjectsGoal(4);
    setVisualClipart('');
    setMediaUrl('');
    setVisualEnabled(false);
    setVisualTemplate('picture_counting');
    setVisualAnimation('bounce');
    setVisualInteraction('tap');
    setVisualInstructions('');
    setVisualImageUrl('');
    setVisualAudioUrl('');
    setVisualObjects('');
    setVisualBackground('playful');
    setVisualAutoPlay(true);
    setExplanation('');
    setHint('');
    setPoints(20);
  };

  useEffect(()=>{
    if(!isOpen) return;
    setMode('single');
    setCountryId(initialCountryId||countries[0]?.id||'');
    setRegionId(initialRegionId||'');
    setCurriculumId(initialCurriculumId||'');
    setGrade((initialGrade as GradeLevel)||availableGrades[0]||'Grade 1');
    setSubject((initialSubject as Subject)||availableSubjects[0]||'Mathematics');
    setCategoryId('');
    setSkillId('');
    setGenerated([]);
    setCsvErrors([]);
    setBatchVisualMode('text');
    setParsed([]);
    resetSingleForm();
  },[isOpen]);
  useEffect(()=>{if(!regionId||!regions.some(r=>r.id===regionId))setRegionId(regions[0]?.id||'');},[regions,regionId]);
  useEffect(()=>{if(!curriculumId||!curricula.some(c=>c.id===curriculumId))setCurriculumId(curricula[0]?.id||'');},[curricula,curriculumId]);
  useEffect(()=>{if(selectedCategory&&selectedCategory.id!==categoryId)setCategoryId(selectedCategory.id);else if(!selectedCategory)setCategoryId('');},[selectedCategory,categoryId]);
  useEffect(()=>{if(selectedSkill&&selectedSkill.id!==skillId)setSkillId(selectedSkill.id);else if(!selectedSkill)setSkillId('');},[selectedSkill,skillId]);

  const hierarchy={countryId,regionId,curriculumId,subjectId:selectedSubject?.id||'',gradeId:selectedGrade?.id||'',categoryId:selectedCategory?.id||'',skillId:selectedSkill?.id||''};
  const names={country:countries.find(x=>x.id===countryId)?.name||'',region:regions.find(x=>x.id===regionId)?.name||'',curriculum:curricula.find(x=>x.id===curriculumId)?.name||'',subject,grade,category:selectedCategory?.name||'',skill:selectedSkill?.name||''};
  const canCreate=Boolean(hierarchy.curriculumId&&hierarchy.subjectId&&hierarchy.gradeId&&hierarchy.categoryId&&hierarchy.skillId);
  const setCountry=(id:string)=>{setCountryId(id);const r=cm.regions.find(x=>x.active&&x.countryId===id);setRegionId(r?.id||'');setCurriculumId('');setCategoryId('');setSkillId('');};
  const setRegion=(id:string)=>{setRegionId(id);const c=cm.curricula.find(x=>x.active&&x.regionId===id);setCurriculumId(c?.id||'');setCategoryId('');setSkillId('');};
  const setCurriculum=(id:string)=>{setCurriculumId(id);setCategoryId('');setSkillId('');};
  const setSubjectAndReset=(v:string)=>{setSubject(v);setCategoryId('');setSkillId('');};
  const setGradeAndReset=(v:string)=>{setGrade(v as GradeLevel);setCategoryId('');setSkillId('');};

  const buildQuestion=(id:string, p:string, opts:string[], correct:number, diff:'Easy'|'Medium'|'Hard', type:QuestionType, extra:any={}):Question=>{
    const visualConfig: VisualQuestionConfig | undefined = extra.visualConfig ?? (visualEnabled ? {
      enabled:true, template:visualTemplate, animation:visualAnimation, interaction:visualInteraction,
      visualInstructions:visualInstructions.trim()||undefined, imageUrl:visualImageUrl.trim()||undefined,
      audioUrl:visualAudioUrl.trim()||undefined, background:visualBackground, autoPlay:visualAutoPlay,
      objects: visualObjects.trim() ? visualObjects.split('|').map((item,index)=>({id:`obj-${index+1}`,label:item.trim(),emoji:item.trim()})).filter(x=>x.label) : (visualClipart.trim() ? visualClipart.trim().split(/\s+/).map((item,index)=>({id:`obj-${index+1}`,label:item.trim(),emoji:item.trim()})).filter(x=>x.label) : undefined)
    } : undefined);
    return {
      id,
      subject,
      grade,
      category:names.category,
      skill:names.skill,
      prompt:p,
      options:opts,
      correctIndex:correct,
      explanation:extra.explanation||explanation||'Review the answer and try again.',
      hint:extra.hint||hint||undefined,
      points:extra.points||points,
      difficulty:diff,
      type,
      country:names.country,
      state:names.region,
      curriculum:names.curriculum,
      countryId,
      regionId,
      curriculumId,
      subjectId:selectedSubject?.id,
      gradeId:selectedGrade?.id,
      categoryId:selectedCategory?.id,
      categoryCode:selectedCategory?.code,
      skillId:selectedSkill?.id,
      skillCode:selectedSkill?.code,
      curriculumReference:selectedSkill?.curriculumReference,
      status:'Draft',
      visualClipart:visualEnabled ? (extra.visualClipart || visualClipart.trim() || undefined) : undefined,
      mediaUrl:extra.mediaUrl||mediaUrl||undefined,
      openBoxAnswer:extra.openBoxAnswer,
      matchPairs:extra.matchPairs,
      dragItems:extra.dragItems,
      orderSequence:extra.orderSequence,
      sortBuckets:extra.sortBuckets,
      visualConfig
    };
  };

  const saveSingle=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!canCreate||!prompt.trim())return;
    const id=getNextQuestionId(grade,questions,0,subject);
    
    let finalOptions = options.map(x=>x.trim()).filter(Boolean);
    if (finalOptions.length === 0) finalOptions = ['Option 1', 'Option 2'];
    let finalCorrectIndex = correctIndex;
    let finalOpenAnswer: string | undefined = undefined;
    let extraPairs: any = undefined;
    let extraDrag: any = undefined;
    let extraOrder: any = undefined;
    let extraBuckets: any = undefined;

    if (questionType === 'open_box' || questionType === 'fill_blank') {
      finalOptions = [openAnswer.trim()];
      finalCorrectIndex = 0;
      finalOpenAnswer = openAnswer.trim();
    } else if (questionType === 'true_false') {
      finalOptions = ['True', 'False'];
      finalCorrectIndex = correctIndex === 1 ? 1 : 0;
    } else if (questionType === 'select_objects') {
      finalOptions = [String(selectObjectsGoal)];
      finalCorrectIndex = 0;
      finalOpenAnswer = String(selectObjectsGoal);
    } else if (questionType === 'match_making') {
      finalOptions = matchPairs.map(p => `${p.left.trim()} -> ${p.right.trim()}`);
      finalCorrectIndex = 0;
      extraPairs = matchPairs;
    } else if (questionType === 'drag_and_drop') {
      finalOptions = dragItems.map(d => `${d.item.trim()} -> ${d.target.trim()}`);
      finalCorrectIndex = 0;
      extraDrag = dragItems;
    } else if (questionType === 'ordering') {
      finalOptions = orderSequence.map(s => s.trim());
      finalCorrectIndex = 0;
      extraOrder = orderSequence;
    } else if (questionType === 'sorting') {
      finalOptions = sortBuckets.map(b => `${b.bucketName}: ${b.items.join(', ')}`);
      finalCorrectIndex = 0;
      extraBuckets = sortBuckets;
    }

    const q=buildQuestion(id,prompt.trim(),finalOptions,finalCorrectIndex,difficulty,questionType,{
      openBoxAnswer: finalOpenAnswer,
      matchPairs: extraPairs,
      dragItems: extraDrag,
      orderSequence: extraOrder,
      sortBuckets: extraBuckets
    });
    onAddQuestion(q);
    resetSingleForm();
    onSuccess();
  };
  const generateBatch=()=>{
    if(!canCreate) return;
    const list:Question[]=[];
    const existing=[...questions];
    
    for(let i=0; i<batchCount; i++){
      const diff = batchDifficulty==='Mixed' ? (i%3===0?'Easy':i%3===1?'Medium':'Hard') as any : batchDifficulty;
      let type: QuestionType = batchType==='mixed' ? TYPES[i%TYPES.length].value : (batchType as QuestionType || 'multiple_choice');
      let a = (i % 8) + 2, b = (i % 6) + 2;
      let p = '', opts: string[] = ['', '', '', ''], ci = 0, answer = '';
      const cat = (names.category || '').toLowerCase();
      const sk = (names.skill || '').toLowerCase();
      
      const isMath = cat.includes('number') || cat.includes('algebra') || cat.includes('add') || cat.includes('sub') || cat.includes('count') || cat.includes('math') || sk.includes('add') || sk.includes('sub') || sk.includes('count') || sk.includes('number');
      const isGeometry = cat.includes('geometry') || cat.includes('shape') || sk.includes('shape') || sk.includes('triangle') || sk.includes('square');
      const isMeasurement = cat.includes('measurement') || cat.includes('time') || sk.includes('time') || sk.includes('clock');

      if (isMath) {
        if (sk.includes('sub') || cat.includes('sub')) {
          const total = a + b;
          p = `What is ${total} - ${a}?`;
          answer = String(b);
          opts = [String(b), String(b + 1), String(Math.max(0, b - 1)), String(b + 2)];
        } else if (sk.includes('count') || cat.includes('count')) {
          p = `How many objects are shown in total?`;
          answer = String(a);
          opts = [String(a), String(a + 1), String(Math.max(1, a - 1)), String(a + 2)];
        } else {
          const sum = a + b;
          p = `What is ${a} + ${b}?`;
          answer = String(sum);
          opts = [String(sum), String(sum + 1), String(sum + 2), String(Math.max(0, sum - 1))];
        }
      } else if (isGeometry) {
        p = `Which of the following is a 2D shape with straight sides?`;
        answer = 'Triangle';
        opts = ['Triangle', 'Circle', 'Sphere', 'Cylinder'];
      } else if (isMeasurement) {
        const total = (i % 5) + 2;
        p = `How many units are shown in this measurement example?`;
        answer = String(total);
        opts = [String(total), String(total + 1), String(Math.max(1, total - 1)), String(total + 2)];
      } else {
        p = `Which example best demonstrates ${names.skill || 'this concept'}?`;
        answer = `Correct Concept Option ${i + 1}`;
        opts = [`Correct Concept Option ${i + 1}`, `Incorrect Choice A`, `Incorrect Choice B`, `None of the above`];
      }

      // Shuffle options deterministically
      ci = i % 4;
      if (ci !== 0) {
        const temp = opts[0];
        opts[0] = opts[ci];
        opts[ci] = temp;
      }

      // Special configs for specialized question types so they never freeze
      let dragItems: any = undefined;
      let matchPairs: any = undefined;
      let orderSequence: any = undefined;
      let sortBuckets: any = undefined;

      if (type === 'drag_and_drop') {
        dragItems = [
          { item: '🍎 Apple', target: '🧺 Fruit Basket' },
          { item: '🚗 Toy Car', target: '🧸 Toy Box' },
          { item: '🍌 Banana', target: '🧺 Fruit Basket' }
        ];
        opts = ['🍎 Apple -> 🧺 Fruit Basket', '🚗 Toy Car -> 🧸 Toy Box', '🍌 Banana -> 🧺 Fruit Basket'];
        p = `Drag and place each item into its correct target!`;
      } else if (type === 'match_making') {
        matchPairs = [
          { left: '🐱 Cat', right: 'Meow' },
          { left: '🐶 Dog', right: 'Woof' },
          { left: '🐮 Cow', right: 'Moo' }
        ];
        opts = ['🐱 Cat -> Meow', '🐶 Dog -> Woof', '🐮 Cow -> Moo'];
        p = `Match each animal with its sound!`;
      } else if (type === 'ordering') {
        orderSequence = ['1', '2', '3', '4'];
        opts = ['1', '2', '3', '4'];
        p = `Arrange the numbers in counting order from smallest to largest!`;
      } else if (type === 'sorting') {
        sortBuckets = [
          { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
          { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
        ];
        p = `Sort each item into the correct category!`;
      } else if (type === 'true_false') {
        opts = ['True', 'False'];
        ci = (a % 2 === 0) ? 0 : 1;
        p = `True or False: ${a} + ${b} equals ${ci === 0 ? a + b : a + b + 1}.`;
        answer = opts[ci];
      } else if (type === 'open_box' || type === 'fill_blank') {
        opts = [answer];
        ci = 0;
      }

      const id = getNextQuestionId(grade, existing, 0, subject);
      const shouldVisual = batchVisualMode === 'visual' || (batchVisualMode === 'mixed' && i % 2 === 0);
      
      const q = buildQuestion(id, p, opts, ci, diff, type, {
        visualClipart: shouldVisual ? (i % 2 === 0 ? '🍎 🍎' : '⭐ ⭐') : undefined,
        openBoxAnswer: answer,
        explanation: `The correct answer is ${answer || opts[ci]}.`,
        hint: `Think carefully about ${names.skill || 'the question'}!`,
        dragItems,
        matchPairs,
        orderSequence,
        sortBuckets,
        visualConfig: shouldVisual ? {
          enabled: true,
          template: (i % 3 === 0 ? 'picture_counting' : i % 3 === 1 ? 'pattern' : 'picture_choice') as VisualQuestionTemplate,
          animation: (i % 2 === 0 ? 'bounce' : 'pulse') as VisualAnimation,
          interaction: 'tap',
          visualInstructions: 'Tap the pictures and choose the answer.',
          background: 'playful',
          autoPlay: true,
          objects: (i % 2 === 0 
            ? [{ id: 'obj-1', label: 'apple', emoji: '🍎', count: a }, { id: 'obj-2', label: 'star', emoji: '⭐', count: b }]
            : [{ id: 'obj-1', label: 'cookie', emoji: '🍪', count: a }])
        } : undefined
      });
      
      list.push(q);
      existing.push(q);
    }
    setGenerated(list);
  };
  const saveGenerated=()=>{if(!generated.length)return;if(onAddBatchQuestions)onAddBatchQuestions(generated);else generated.forEach(onAddQuestion);onSuccess();};

  const templateHeaders=['Question ID','Country Code','Region Code','Curriculum Code','Subject Code','Grade Code','Category Code','Skill Code','Difficulty','Question Type','Question Text','Option A','Option B','Option C','Option D','Correct Answer','Explanation','Hint','Visual Clipart','Media URL','Visual Enabled','Visual Template','Visual Animation','Visual Interaction','Visual Instructions','Visual Image URL','Visual Audio URL','Visual Objects','Visual Background','Visual Auto Play','Points','Status'];
  const quickVisualHeaders=['Question Text','Option A','Option B','Option C','Option D','Correct Answer','Visual Objects','Visual Animation','Visual Clipart','Visual Template','Visual Instructions','Difficulty'];

  const downloadExcelMasterWorkbook = () => {
    const curObj = cm.curricula.find(c => c.id === curriculumId);
    const blob = generateQuestionMasterExcel({
      curriculumCode: curObj?.code || 'CUR-VCAA20',
      subjectCode: selectedSubject?.id || 'SUB_MTH',
      gradeCode: selectedGrade?.id || 'GRD_G1',
      categoryCode: selectedCategory?.code || 'CAT-NUM',
      skillCode: selectedSkill?.code || 'SK-NUM-01'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pforpencil_grade1_all_types_master_workbook.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processCsv=(rawInputText:string)=>{
    const textData=fixMojibake(rawInputText);
    const rows=parseCsv(textData);
    if(rows.length<2){setCsvErrors(['CSV must include a header and at least one question row.']);setParsed([]);return;}
    const headers=rows[0].map(h=>fixMojibake(h).trim());
    const index=(n:string)=>headers.findIndex(h=>h.toLowerCase()===n.toLowerCase());
    const out:Question[]=[];const existing=[...questions];const errs:string[]=[];

    if(index('Question Text')<0){
      setCsvErrors(['Missing required column: "Question Text"']);
      setParsed([]);
      return;
    }

    rows.slice(1).forEach((r,ri)=>{
      const row=ri+2;
      const val=(h:string)=>{
        const idx=index(h);
        return idx>=0?fixMojibake(r[idx]||''):'';
      };
      const text=val('Question Text');
      if(!text)return; // skip empty rows

      const cc=useSelectedForCsv?countryId:val('Country Code')||countryId;
      const rc=useSelectedForCsv?regionId:val('Region Code')||regionId;
      const cuc=useSelectedForCsv?curriculumId:val('Curriculum Code')||curriculumId;
      const sc=useSelectedForCsv?(selectedSubject?.id||''):val('Subject Code')||(selectedSubject?.id||'');
      const gc=useSelectedForCsv?(selectedGrade?.id||''):val('Grade Code')||(selectedGrade?.id||'');
      const catc=useSelectedForCsv?(selectedCategory?.code||''):val('Category Code')||(selectedCategory?.code||'');
      const skc=useSelectedForCsv?(selectedSkill?.code||''):val('Skill Code')||(selectedSkill?.code||'');

      const country=cm.countries.find(x=>x.code===cc&&x.active)||countries[0];
      const region=cm.regions.find(x=>x.code===rc&&x.active)||regions[0];
      const cur=cm.curricula.find(x=>x.code===cuc&&x.active)||curricula[0];
      const sub=(subjects.length?subjects:[]).find(x=>x.id===sc&&x.active)||selectedSubject;
      const grd=(grades.length?grades:[]).find(x=>x.id===gc&&x.active)||selectedGrade;
      const cat=categoryMasters.find(x=>(x.code===catc||x.name.toLowerCase()===catc.toLowerCase())&&x.active)||selectedCategory;
      const skill=skillMasters.find(x=>(x.code===skc||x.name.toLowerCase()===skc.toLowerCase())&&x.active)||selectedSkill;

      if(!country)errs.push(`Row ${row}: Invalid Country`);
      if(!region)errs.push(`Row ${row}: Invalid Region`);
      if(!cur)errs.push(`Row ${row}: Invalid Curriculum`);
      if(!sub)errs.push(`Row ${row}: Invalid Subject`);
      if(!grd)errs.push(`Row ${row}: Invalid Grade`);
      if(!cat)errs.push(`Row ${row}: Select or specify a Category`);
      if(!skill)errs.push(`Row ${row}: Select or specify a Skill`);

      const rawDiff=val('Difficulty')||'Easy';
      const diff:( 'Easy' | 'Medium' | 'Hard' )=['Easy','Medium','Hard'].includes(rawDiff)?rawDiff as any:'Easy';
      const rawType=val('Question Type')||'multiple_choice';
      const type:QuestionType=TYPES.some(t=>t.value===rawType)?rawType as QuestionType:'multiple_choice';

      if(!country||!region||!cur||!sub||!grd||!cat||!skill)return;

      let opts=[val('Option A'),val('Option B'),val('Option C'),val('Option D')].filter(Boolean);
      const ca=val('Correct Answer')||'A';
      let ci=0;

      if (type === 'true_false') {
        const isTrue = ['TRUE', 'T', '1', 'YES', 'A', 'OPTION A'].includes(ca.toUpperCase());
        ci = isTrue ? 0 : 1;
        if (opts.length < 2) opts = ['True', 'False'];
      } else if (['A', '0', 'OPTION A'].includes(ca.toUpperCase())) {
        ci = 0;
      } else if (['B', '1', 'OPTION B'].includes(ca.toUpperCase())) {
        ci = 1;
      } else if (['C', '2', 'OPTION C'].includes(ca.toUpperCase())) {
        ci = 2;
      } else if (['D', '3', 'OPTION D'].includes(ca.toUpperCase())) {
        ci = 3;
      } else {
        const matchedIdx = opts.findIndex(o => o.toLowerCase() === ca.toLowerCase());
        if (matchedIdx >= 0) ci = matchedIdx;
      }

      const visualObjectsRaw=val('Visual Objects');
      const hasVisualObjects=Boolean(visualObjectsRaw && visualObjectsRaw.trim());
      const visualEnabledStr=val('Visual Enabled').toLowerCase();
      const isVisualEnabled=hasVisualObjects || ['yes','true','1'].includes(visualEnabledStr);

      let visualConfig: VisualQuestionConfig | undefined = undefined;
      let finalClipart = val('Visual Clipart') || undefined;

      if(isVisualEnabled){
        const tpl=(val('Visual Template') || (rawType==='image_choice'?'picture_choice':'picture_counting')) as VisualQuestionTemplate;
        const anim=(val('Visual Animation') || (tpl==='picture_choice'?'pulse':'bounce')) as VisualAnimation;
        const interaction=(val('Visual Interaction') || 'tap') as VisualQuestionConfig['interaction'];
        const instructions=val('Visual Instructions') || (tpl==='picture_counting'?'Tap the pictures to count them.':'Tap the correct picture.');
        const bg=(val('Visual Background') || 'playful') as VisualQuestionConfig['background'];
        const autoPlay=!['no','false','0'].includes(val('Visual Auto Play').toLowerCase());
        
        const parsedObjects = hasVisualObjects ? parseVisualObjectsString(visualObjectsRaw) : undefined;

        if (parsedObjects && parsedObjects.length > 0 && !finalClipart) {
          finalClipart = parsedObjects.map(o => o.emoji || o.label).join(' ');
        }

        visualConfig={
          enabled: true,
          template: tpl,
          animation: anim,
          interaction,
          visualInstructions: instructions,
          imageUrl: val('Visual Image URL') || undefined,
          audioUrl: val('Visual Audio URL') || undefined,
          objects: parsedObjects && parsedObjects.length > 0 ? parsedObjects : undefined,
          background: bg,
          autoPlay
        };
      }

      // Specialized question type configurations
      let dragItems: any = undefined;
      let matchPairs: any = undefined;
      let orderSequence: any = undefined;
      let sortBuckets: any = undefined;
      let openBoxAnswer: string | undefined = undefined;

      if (type === 'drag_and_drop') {
        dragItems = opts.map((opt, i) => {
          const parts = opt.split('->').map(s => s.trim());
          return {
            item: parts[0] || `Item ${i + 1}`,
            target: parts[1] || 'Target Zone'
          };
        });
      } else if (type === 'match_making') {
        matchPairs = opts.map(opt => {
          const parts = opt.split('->').map(s => s.trim());
          return {
            left: parts[0] || 'Item A',
            right: parts[1] || 'Match A'
          };
        });
      } else if (type === 'ordering') {
        orderSequence = opts.length > 0 ? opts : ['1', '2', '3', '4'];
      } else if (type === 'sorting') {
        sortBuckets = opts.map(opt => {
          const parts = opt.split(':').map(s => s.trim());
          return {
            bucketName: parts[0] || 'Bucket',
            items: parts[1] ? parts[1].split(',').map(x => x.trim()) : ['Item 1', 'Item 2']
          };
        });
      } else if (type === 'open_box' || type === 'fill_blank') {
        openBoxAnswer = ca || opts[0] || '1';
        if (opts.length === 0) {
          opts = [openBoxAnswer];
        }
      }

      const q:Question={
        id:getNextQuestionId(grd.name,existing,0,sub.name),
        country:country.name,
        state:region.name,
        curriculum:cur.name,
        countryId:country.id,
        regionId:region.id,
        curriculumId:cur.id,
        subject:sub.name,
        subjectId:sub.id,
        grade:grd.name,
        gradeId:grd.id,
        category:cat.name,
        categoryId:cat.id,
        categoryCode:cat.code,
        skill:skill.name,
        skillId:skill.id,
        skillCode:skill.code,
        curriculumReference:skill.curriculumReference,
        difficulty:diff,
        type,
        prompt:text,
        options: (type === 'open_box' || type === 'fill_blank') && opts.length === 0 ? [openBoxAnswer || ''] : (opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C', 'Option D']),
        correctIndex:ci,
        openBoxAnswer,
        explanation:val('Explanation')||'Review the answer and try again.',
        hint:val('Hint')||undefined,
        visualClipart:finalClipart,
        mediaUrl:val('Media URL')||undefined,
        visualConfig,
        dragItems,
        matchPairs,
        orderSequence,
        sortBuckets,
        points:Number(val('Points'))||20,
        status:(val('Status') as any)||'Draft'
      };
      out.push(q);
      existing.push(q);
    });
    setCsvErrors(errs);
    setParsed(out);
  };
  const onFile=async (e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];
    if(!f)return;
    setCsvFileName(f.name);
    const isExcel = f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls');

    if (isExcel) {
      try {
        const curObj = cm.curricula.find(c => c.id === curriculumId);
        const cntObj = cm.countries.find(c => c.id === countryId);
        const regObj = cm.regions.find(r => r.id === regionId);
        const result = await parseQuestionExcelFile(f, {
          existingQuestions: questions,
          getNextId: (grd, existing, offset, sub) => getNextQuestionId(grd, existing, offset, sub),
          defaultCurriculumId: curriculumId,
          defaultCountryId: countryId,
          defaultRegionId: regionId,
          defaultSubjectId: selectedSubject?.id,
          defaultGradeId: selectedGrade?.id,
          defaultCategoryId: selectedCategory?.id,
          defaultSkillId: selectedSkill?.id,
          defaultCountryName: cntObj?.name || 'Australia',
          defaultRegionName: regObj?.name || 'Victoria',
          defaultCurriculumName: curObj?.name || 'Victorian Curriculum 2.0',
          defaultSubjectName: selectedSubject?.name || subject,
          defaultGradeName: selectedGrade?.name || grade,
          defaultCategoryName: selectedCategory?.name,
          defaultCategoryCode: selectedCategory?.code,
          defaultSkillName: selectedSkill?.name,
          defaultSkillCode: selectedSkill?.code,
          defaultCurriculumReference: selectedSkill?.curriculumReference,
          useSelectedHierarchy: useSelectedForCsv
        });
        setCsvErrors(result.errors);
        setParsed(result.questions);
      } catch (err: any) {
        setCsvErrors([`Failed to read Excel workbook: ${err?.message || 'Unknown error'}`]);
        setParsed([]);
      }
    } else {
      const reader=new FileReader();
      reader.onload=ev=>{
        try {
          const buffer = ev.target?.result;
          if (buffer instanceof ArrayBuffer) {
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const text = decoder.decode(buffer);
            processCsv(text);
          } else {
            processCsv(String(buffer || ''));
          }
        } catch (err) {
          processCsv(String(ev.target?.result||''));
        }
      };
      reader.readAsArrayBuffer(f);
    }
  };
  const importCsv=()=>{if(!parsed.length||csvErrors.length)return;if(onAddBatchQuestions)onAddBatchQuestions(parsed);else parsed.forEach(onAddQuestion);onSuccess();};
  const onSuccess=()=>{sounds.success();onClose();};
  if(!isOpen)return null;
  const hierarchyBlock=<div className="p-3.5 bg-[#f8faff] border border-[#d7def0] rounded-2xl"><div className="flex items-center gap-1.5 font-bold text-xs text-[#10246f] mb-2"><Globe className="w-3.5 h-3.5 text-[#10246f]"/> Curriculum Hierarchy</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="text-[11px] font-semibold text-stone-700">Country<select value={countryId} onChange={e=>setCountry(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{countries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">State / Region<select value={regionId} onChange={e=>setRegion(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{regions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Curriculum<select value={curriculumId} onChange={e=>setCurriculum(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{curricula.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3"><label className="text-[11px] font-semibold text-stone-700">Subject<select value={subject} onChange={e=>setSubjectAndReset(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{availableSubjects.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Grade / Level<select value={grade} onChange={e=>setGradeAndReset(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{availableGrades.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Category<select value={selectedCategory?.id||''} onChange={e=>{setCategoryId(e.target.value);setSkillId('')}} disabled={!categoryOptions.length} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 disabled:bg-stone-50"><option value="">{categoryOptions.length?'Select category':'No category'}</option>{categoryOptions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Skill<select value={selectedSkill?.id||''} onChange={e=>setSkillId(e.target.value)} disabled={!skillOptions.length} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 disabled:bg-stone-50"><option value="">{skillOptions.length?'Select skill':'No skill'}</option>{skillOptions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>{!canCreate&&<div className="mt-2 text-[10px] text-amber-700">Select a valid Curriculum → Subject → Grade → Category → Skill combination before creating a question.</div>}</div>;

  const clipartCategories = ['All', ...Array.from(new Set(CLIPART_LIBRARY.map(c => c.category)))];
  const filteredClipart = CLIPART_LIBRARY.filter(c => {
    const matchCat = clipartCategoryFilter === 'All' || c.category === clipartCategoryFilter;
    const q = clipartSearch.toLowerCase().trim();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.keywords.some(k => k.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-5xl w-full my-4 overflow-hidden flex flex-col max-h-[94vh]"><div className="bg-stone-900 text-white p-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Master Question Bank Creator</h2><p className="text-xs text-stone-300">Single create, batch generate, Excel workbook upload, and Clipart library all use the same master hierarchy and visual engine.</p></div><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="bg-stone-100 px-6 py-2.5 border-b flex flex-wrap gap-2 text-xs font-bold"><button onClick={()=>setMode('single')} className={`px-3 py-1.5 rounded-xl ${mode==='single'?'bg-white shadow-xs':'text-stone-600'}`}>Single Interactive Question</button><button onClick={()=>setMode('batch')} className={`px-3 py-1.5 rounded-xl ${mode==='batch'?'bg-white shadow-xs':'text-stone-600'}`}><Sparkles className="inline w-3.5 h-3.5 text-amber-500 mr-1"/>Batch Multi-Question Generator</button><button onClick={()=>setMode('csv_upload')} className={`px-3 py-1.5 rounded-xl ${mode==='csv_upload'?'bg-white shadow-xs':'text-stone-600'}`}><FileSpreadsheet className="inline w-3.5 h-3.5 text-emerald-600 mr-1"/>Excel Bulk Upload & Master Template</button><button onClick={()=>setMode('clipart_library')} className={`px-3 py-1.5 rounded-xl ${mode==='clipart_library'?'bg-white shadow-xs':'text-stone-600'}`}><Palette className="inline w-3.5 h-3.5 text-indigo-600 mr-1"/>Clipart & Visual Library ({CLIPART_LIBRARY.length})</button></div><div className="p-6 overflow-y-auto flex-1 text-stone-800 text-xs">
    {mode==='single'&&<form onSubmit={saveSingle} className="space-y-4">
      {hierarchyBlock}
      <div className="grid grid-cols-2 gap-3">
        <label className="font-semibold">Difficulty
          <select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)} className="w-full mt-1 p-2 rounded-xl border">
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </label>
        <label className="font-semibold">Question Type
          <select
            value={questionType}
            onChange={e => {
              const nextType = e.target.value as QuestionType;
              setQuestionType(nextType);
              if (nextType === 'true_false') {
                setOptions(['True', 'False']);
                if (correctIndex > 1) setCorrectIndex(0);
              } else if (nextType === 'open_box' || nextType === 'fill_blank') {
                if (!openAnswer && options[correctIndex]) setOpenAnswer(options[correctIndex]);
              } else if (nextType === 'match_making') {
                if (!matchPairs || matchPairs.length === 0) {
                  setMatchPairs([
                    { left: '🐱 Cat', right: 'Meow' },
                    { left: '🐶 Dog', right: 'Woof' },
                    { left: '🐮 Cow', right: 'Moo' }
                  ]);
                }
              } else if (nextType === 'drag_and_drop') {
                if (!dragItems || dragItems.length === 0) {
                  setDragItems([
                    { item: '🍎 Apple', target: '🧺 Fruit Basket' },
                    { item: '🚗 Toy Car', target: '🧸 Toy Box' },
                    { item: '🍌 Banana', target: '🧺 Fruit Basket' }
                  ]);
                }
              } else if (nextType === 'ordering') {
                if (!orderSequence || orderSequence.length === 0) {
                  setOrderSequence(['1', '2', '3', '4']);
                }
              } else if (nextType === 'sorting') {
                if (!sortBuckets || sortBuckets.length === 0) {
                  setSortBuckets([
                    { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
                    { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
                  ]);
                }
              } else {
                if (!options || options.length < 2) {
                  setOptions(['Option A', 'Option B', 'Option C', 'Option D']);
                }
              }
            }}
            className="w-full mt-1 p-2 rounded-xl border bg-white"
          >
            {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
      </div>

      <label className="font-semibold block">
        Question Text
        <textarea required value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} className="w-full mt-1 p-3 rounded-xl border" placeholder="Enter the student-facing question..."/>
      </label>

      {/* DEDICATED BUILDER ACCORDING TO QUESTION TYPE */}
      {questionType === 'open_box' || questionType === 'fill_blank' ? (
        <label className="font-semibold block p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200">
          <span className="text-xs font-bold text-amber-950 block mb-1">Expected Correct Answer:</span>
          <input
            required
            value={openAnswer}
            onChange={e => setOpenAnswer(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-stone-200 bg-white font-bold outline-none focus:border-amber-400 text-sm"
            placeholder="e.g. 9 or Cat or 4 + 5 = 9"
          />
        </label>
      ) : questionType === 'true_false' ? (
        /* TRUE / FALSE BUILDER */
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              True / False Answer Selection
            </div>
            <div className="text-[10px] text-emerald-700">
              Click the correct answer statement below
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setCorrectIndex(0);
                setOptions(['True', 'False']);
              }}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer font-bold flex flex-col items-center justify-center gap-1.5 ${
                correctIndex === 0
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-950 ring-3 ring-emerald-300 shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
                ✓
              </div>
              <span className="text-sm font-black">TRUE</span>
              <span className="text-[10px] font-semibold text-stone-500">
                {correctIndex === 0 ? '★ Correct Answer' : 'Click to set correct'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCorrectIndex(1);
                setOptions(['True', 'False']);
              }}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer font-bold flex flex-col items-center justify-center gap-1.5 ${
                correctIndex === 1
                  ? 'bg-rose-100 border-rose-500 text-rose-950 ring-3 ring-rose-300 shadow-xs'
                  : 'bg-white border-stone-200 text-stone-700 hover:border-rose-300'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
                ✕
              </div>
              <span className="text-sm font-black">FALSE</span>
              <span className="text-[10px] font-semibold text-stone-500">
                {correctIndex === 1 ? '★ Correct Answer' : 'Click to set correct'}
              </span>
            </button>
          </div>
        </div>
      ) : questionType === 'match_making' ? (
        /* MATCH MAKING BUILDER */
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Match Pairs (Left Item ➔ Right Target Match)
              </div>
              <div className="text-[10px] text-indigo-700 mt-0.5">
                Students will match items on the left with their corresponding match on the right.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMatchPairs(prev => [...prev, { left: '', right: '' }])}
              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              + Add Pair
            </button>
          </div>

          <div className="space-y-2">
            {matchPairs.map((pair, pIdx) => (
              <div key={pIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-indigo-200 shadow-2xs">
                <span className="font-mono font-bold text-indigo-900 text-xs w-6 text-center">
                  #{pIdx + 1}
                </span>
                <input
                  value={pair.left}
                  onChange={e => {
                    const next = [...matchPairs];
                    next[pIdx].left = e.target.value;
                    setMatchPairs(next);
                  }}
                  placeholder="Left item (e.g. 🐱 Cat)"
                  className="flex-1 p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-indigo-400"
                />
                <span className="text-stone-400 font-bold text-sm">➔</span>
                <input
                  value={pair.right}
                  onChange={e => {
                    const next = [...matchPairs];
                    next[pIdx].right = e.target.value;
                    setMatchPairs(next);
                  }}
                  placeholder="Right match (e.g. Meow)"
                  className="flex-1 p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-indigo-400"
                />
                {matchPairs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setMatchPairs(prev => prev.filter((_, i) => i !== pIdx))}
                    className="text-stone-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="Remove pair"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : questionType === 'drag_and_drop' ? (
        /* DRAG AND DROP BUILDER */
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Drag & Drop Items & Targets
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                Define the draggable items and their designated target drop zones.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDragItems(prev => [...prev, { item: '', target: '' }])}
              className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-2">
            {dragItems.map((item, dIdx) => (
              <div key={dIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200 shadow-2xs">
                <span className="font-mono font-bold text-amber-900 text-xs w-6 text-center">
                  #{dIdx + 1}
                </span>
                <input
                  value={item.item}
                  onChange={e => {
                    const next = [...dragItems];
                    next[dIdx].item = e.target.value;
                    setDragItems(next);
                  }}
                  placeholder="Draggable Item (e.g. 🍎 Apple)"
                  className="flex-1 p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-amber-400"
                />
                <span className="text-stone-400 font-bold text-sm">➔ Drop Zone:</span>
                <input
                  value={item.target}
                  onChange={e => {
                    const next = [...dragItems];
                    next[dIdx].target = e.target.value;
                    setDragItems(next);
                  }}
                  placeholder="Target Container (e.g. 🧺 Fruit Basket)"
                  className="flex-1 p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-amber-400"
                />
                {dragItems.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setDragItems(prev => prev.filter((_, i) => i !== dIdx))}
                    className="text-stone-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : questionType === 'ordering' ? (
        /* ORDERING / SEQUENCING BUILDER */
        <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Ordering Sequence (Correct Chronological / Numerical Order)
              </div>
              <div className="text-[10px] text-purple-700 mt-0.5">
                List the items below in the exact correct sequence from first to last.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOrderSequence(prev => [...prev, `Item ${prev.length + 1}`])}
              className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              + Add Step
            </button>
          </div>

          <div className="space-y-2">
            {orderSequence.map((step, sIdx) => (
              <div key={sIdx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-purple-200 shadow-2xs">
                <span className="font-black text-purple-700 text-xs w-16 text-center bg-purple-100/70 py-1 rounded-md">
                  Step {sIdx + 1}
                </span>
                <input
                  value={step}
                  onChange={e => {
                    const next = [...orderSequence];
                    next[sIdx] = e.target.value;
                    setOrderSequence(next);
                  }}
                  placeholder={`Correct step #${sIdx + 1}`}
                  className="flex-1 p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-purple-400"
                />
                {orderSequence.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setOrderSequence(prev => prev.filter((_, i) => i !== sIdx))}
                    className="text-stone-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="Remove step"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : questionType === 'select_objects' ? (
        /* SELECT OBJECTS (TAP TO COUNT) BUILDER */
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Select Objects (Tap to Count Goal)
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">
                Define the target number of objects the student needs to tap or count.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-amber-200">
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Target Count Goal
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={selectObjectsGoal}
                onChange={e => setSelectObjectsGoal(Number(e.target.value) || 1)}
                className="w-full p-2 rounded-lg border border-stone-200 text-sm font-bold outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                Objects to Count (Emojis / Badges)
              </label>
              <input
                value={visualObjects || visualClipart}
                onChange={e => {
                  setVisualObjects(e.target.value);
                  if (!visualClipart) setVisualClipart(e.target.value);
                }}
                placeholder="e.g. 🍎 🍎 🍎 🍎 or 🐶|🐶|🐶"
                className="w-full p-2 rounded-lg border border-stone-200 text-sm font-bold outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      ) : questionType === 'sorting' ? (
        /* SORTING INTO BUCKETS BUILDER */
        <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Sorting Buckets & Items
              </div>
              <div className="text-[10px] text-teal-700 mt-0.5">
                Configure target buckets and the items assigned to each bucket.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSortBuckets(prev => [...prev, { bucketName: `Bucket ${prev.length + 1}`, items: [] }])}
              className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              + Add Bucket
            </button>
          </div>

          <div className="space-y-3">
            {sortBuckets.map((bucket, bIdx) => (
              <div key={bIdx} className="p-3 bg-white rounded-xl border border-teal-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-black text-xs text-teal-800">
                      Bucket #{bIdx + 1}:
                    </span>
                    <input
                      value={bucket.bucketName}
                      onChange={e => {
                        const next = [...sortBuckets];
                        next[bIdx].bucketName = e.target.value;
                        setSortBuckets(next);
                      }}
                      placeholder="Bucket name (e.g. 🧺 Fruit Basket)"
                      className="flex-1 p-1.5 rounded-lg border border-stone-200 text-xs font-bold outline-none focus:border-teal-400"
                    />
                  </div>
                  {sortBuckets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSortBuckets(prev => prev.filter((_, i) => i !== bIdx))}
                      className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="Delete bucket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Assigned Items (comma-separated):
                  </label>
                  <input
                    value={bucket.items.join(', ')}
                    onChange={e => {
                      const next = [...sortBuckets];
                      next[bIdx].items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setSortBuckets(next);
                    }}
                    placeholder="e.g. 🍎 Apple, 🍌 Banana, 🍓 Berry"
                    className="w-full p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* MULTIPLE CHOICE / GENERAL OPTIONS BUILDER */
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-stone-900 text-xs">Answer Options (Select the correct radio button)</div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-stone-500">Radio button indicates correct answer</div>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => setOptions(prev => [...prev, ''])}
                  className="px-2 py-0.5 rounded-md bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] font-bold cursor-pointer"
                >
                  + Add Option
                </button>
              )}
            </div>
          </div>
          {options.map((o,i)=>(
            <div key={i} className="p-2 bg-white rounded-xl border border-stone-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <input type="radio" name="singleCorrectOption" checked={correctIndex===i} onChange={()=>setCorrectIndex(i)} className="cursor-pointer"/>
                <span className="font-bold text-xs text-stone-600 w-5">
                  {String.fromCharCode(65+i)}
                </span>
                <input
                  value={o}
                  onChange={e=>setOptions(p=>p.map((x,j)=>j===i?e.target.value:x))}
                  placeholder={`Option ${String.fromCharCode(65+i)} text or clipart`}
                  className="flex-1 p-2 rounded-lg border text-xs"
                />
                {o && (
                  <button
                    type="button"
                    onClick={()=>setOptions(p=>p.map((x,j)=>j===i?'':x))}
                    className="text-[10px] text-stone-400 hover:text-stone-700 px-1.5"
                    title="Clear this option"
                  >
                    ✕
                  </button>
                )}
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = options.filter((_, idx) => idx !== i);
                      setOptions(next);
                      if (correctIndex >= next.length) {
                        setCorrectIndex(0);
                      }
                    }}
                    className="text-stone-300 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                    title="Remove option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 pl-7 flex-wrap">
                <span className="text-[10px] text-stone-400">Quick insert:</span>
                {['🍎','🍌','⭐','🔵','🐶','🚗','🍪','🎈','🔺','🟩'].map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={()=>setOptions(p=>p.map((x,j)=>j===i?(x ? `${x} ${em}` : em):x))}
                    className="px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-amber-50 text-xs"
                    title={`Insert ${em} into Option ${String.fromCharCode(65+i)}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UNIFIED VISUAL & ANIMATED LAYER (Single Section) */}
      <div className={`p-4 rounded-2xl border transition ${
        visualEnabled
          ? 'bg-amber-50/40 border-amber-300 space-y-3'
          : 'bg-stone-50 border-stone-200 space-y-2'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-stone-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Visual / Animated Layer & Clipart
            </div>
            <div className="text-[10px] text-stone-600 mt-0.5">
              {visualEnabled
                ? 'Interactive visual layer, counting templates, and clipart badges are active for this question.'
                : 'Disabled — standard clean text question without clipart banners or counting templates.'}
            </div>
          </div>
          <label className="flex items-center gap-2 font-black text-xs cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
            <input
              type="checkbox"
              checked={visualEnabled}
              onChange={e => {
                setVisualEnabled(e.target.checked);
                if (!e.target.checked) {
                  setVisualClipart('');
                }
              }}
              className="cursor-pointer rounded text-amber-500 focus:ring-amber-400"
            />
            <span>{visualEnabled ? 'Visuals Enabled' : 'Enable Visuals'}</span>
          </label>
        </div>

        {visualEnabled && (
          <div className="pt-2 border-t border-amber-200/70 space-y-3">
            {/* Clipart / Header Badge */}
            <div className="p-3 rounded-xl bg-white border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-800 text-xs flex items-center gap-2">
                  <span>Question Clipart Badge / Symbols</span>
                  {visualClipart && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-bold">
                      {visualClipart}
                    </span>
                  )}
                </div>
                {visualClipart && (
                  <button
                    type="button"
                    onClick={() => setVisualClipart('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {CLIPART.map(x => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setVisualClipart(p => p ? `${p} ${x}` : x)}
                    className="w-8 h-8 border border-stone-200 rounded-lg bg-stone-50 hover:bg-amber-100 transition flex items-center justify-center text-sm shadow-2xs"
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="text-xs font-semibold">Template
                <select value={visualTemplate} onChange={e=>setVisualTemplate(e.target.value as VisualQuestionTemplate)} className="w-full mt-1 p-2 rounded-xl border bg-white text-xs">
                  <option value="picture_counting">Picture Counting</option>
                  <option value="picture_choice">Picture Choice</option>
                  <option value="drag_drop">Drag & Drop</option>
                  <option value="matching">Matching</option>
                  <option value="sorting">Sorting</option>
                  <option value="ordering">Ordering</option>
                  <option value="pattern">Pattern</option>
                  <option value="number_line">Number Line</option>
                  <option value="interactive_story">Interactive Story</option>
                </select>
              </label>
              <label className="text-xs font-semibold">Animation
                <select value={visualAnimation} onChange={e=>setVisualAnimation(e.target.value as VisualAnimation)} className="w-full mt-1 p-2 rounded-xl border bg-white text-xs">
                  <option>none</option><option>bounce</option><option>float</option><option>pulse</option><option>wiggle</option><option>pop</option><option>spin</option>
                </select>
              </label>
              <label className="text-xs font-semibold">Interaction
                <select value={visualInteraction} onChange={e=>setVisualInteraction(e.target.value as VisualQuestionConfig['interaction'])} className="w-full mt-1 p-2 rounded-xl border bg-white text-xs">
                  <option value="tap">Tap</option><option value="count">Count</option><option value="drag">Drag</option><option value="match">Match</option><option value="sort">Sort</option><option value="order">Order</option><option value="none">None</option>
                </select>
              </label>
            </div>
            <label className="block text-xs font-semibold">Visual Instructions
              <textarea value={visualInstructions} onChange={e=>setVisualInstructions(e.target.value)} rows={2} className="w-full mt-1 p-2 rounded-xl border bg-white text-xs" placeholder="e.g. Tap all the apples, then choose how many you counted."/>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="font-semibold">Visual Image / GIF URL
                <input value={visualImageUrl} onChange={e=>setVisualImageUrl(e.target.value)} className="w-full mt-1 p-2 rounded-xl border bg-white text-xs" placeholder="https://..."/>
              </label>
              <label className="font-semibold">Audio URL
                <input value={visualAudioUrl} onChange={e=>setVisualAudioUrl(e.target.value)} className="w-full mt-1 p-2 rounded-xl border bg-white text-xs" placeholder="https://...mp3"/>
              </label>
            </div>
            <label className="text-xs font-semibold block">Visual Objects <span className="font-normal text-stone-500">(separate with |, e.g. 🍎|🍎|🍎)</span>
              <input value={visualObjects} onChange={e=>setVisualObjects(e.target.value)} className="w-full mt-1 p-2 rounded-xl border bg-white text-xs" placeholder="🍎|🍎|🍎|🍎|🍎"/>
            </label>
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <label className="font-semibold">Background
                <select value={visualBackground} onChange={e=>setVisualBackground(e.target.value as any)} className="ml-1 p-1.5 rounded-lg border bg-white text-xs">
                  <option value="playful">Playful</option><option value="soft">Soft</option><option value="none">None</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 font-semibold">
                <input type="checkbox" checked={visualAutoPlay} onChange={e=>setVisualAutoPlay(e.target.checked)}/> Auto-play animation/audio
              </label>
            </div>
            <div className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-center min-h-20">
              <div className="text-center">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Live visual preview</div>
                <div className="text-3xl">{visualObjects||visualClipart||'🍎 🍎 🍎'}</div>
                <div className="text-[10px] text-stone-600 mt-1 font-medium">{visualInstructions||'Your visual question will appear here.'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <textarea value={explanation} onChange={e=>setExplanation(e.target.value)} rows={2} placeholder="Explanation" className="p-2 rounded-xl border text-xs"/>
        <textarea value={hint} onChange={e=>setHint(e.target.value)} rows={2} placeholder="Hint (optional)" className="p-2 rounded-xl border text-xs"/>
      </div>

      <div className="flex flex-wrap justify-between items-center border-t pt-3 gap-2">
        <div className="text-[10px] text-stone-500">Questions are saved as Draft and can be reviewed before publishing.</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetSingleForm}
            className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={!canCreate||!prompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs disabled:opacity-40 shadow-xs transition"
          >
            <Plus className="inline w-4 h-4 mr-1"/>Save Draft Question
          </button>
        </div>
      </div>
    </form>}
    {mode==='batch'&&<div className="space-y-4">
      {hierarchyBlock}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <label className="font-semibold">Questions
          <input type="number" min={1} max={1000} value={batchCount} onChange={e=>setBatchCount(Math.min(1000,Math.max(1,Number(e.target.value)||1)))} className="w-full mt-1 p-2.5 rounded-xl border text-xs"/>
        </label>
        <label className="font-semibold">Difficulty
          <select value={batchDifficulty} onChange={e=>setBatchDifficulty(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border text-xs">
            <option>Easy</option><option>Medium</option><option>Hard</option><option>Mixed</option>
          </select>
        </label>
        <label className="font-semibold">Question Type
          <select value={batchType} onChange={e=>setBatchType(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border text-xs">
            <option value="same">Multiple Choice</option><option value="mixed">Mixed Types</option>
          </select>
        </label>
        <label className="font-semibold">Visual Style
          <select value={batchVisualMode} onChange={e=>setBatchVisualMode(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border text-xs">
            <option value="text">Text (standard)</option><option value="visual">Visual / Animated</option><option value="mixed">Mixed</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="text-stone-500 text-xs">
          Generate questions for <strong>{names.skill||'selected skill'}</strong>. Generated questions can be edited below before saving to Draft.
        </div>
        <button
          onClick={generateBatch}
          disabled={!canCreate}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 font-black text-xs disabled:opacity-40 shadow-xs transition flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-stone-900"/> Generate {batchCount} Questions
        </button>
      </div>

      {generated.length>0&&(
        <div className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
          <div className="p-3.5 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
            <div className="font-bold text-xs text-stone-900 flex items-center gap-2">
              <span>Generated Batch Preview ({generated.length} questions)</span>
              <span className="text-[10px] text-stone-500 font-normal">Click "Edit" on any question to tweak options, prompt, or answers.</span>
            </div>
            <button
              onClick={()=>{ setGenerated([]); setEditingBatchIndex(null); }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5"/> Clear All
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-200 p-2 space-y-2">
            {generated.map((q,i)=>(
              <div key={q.id || i} className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        #{i+1} · {q.id}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        q.difficulty==='Easy'?'bg-emerald-100 text-emerald-800':q.difficulty==='Hard'?'bg-rose-100 text-rose-800':'bg-amber-100 text-amber-800'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] text-stone-500 font-semibold bg-stone-100 px-1.5 py-0.5 rounded">
                        {typeLabel(q)}
                      </span>
                      {q.visualClipart && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded">
                          {q.visualClipart}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewQuestion(q)}
                        className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Preview Question in Student Mode"
                      >
                        <Eye className="w-3 h-3"/> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBatchIndex(i);
                          setEditingDraft({ ...q });
                        }}
                        className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Edit Question"
                      >
                        <Edit3 className="w-3 h-3 text-amber-600"/> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cloneId = `${q.id}-CLONE-${Date.now().toString().slice(-4)}`;
                          const clone = { ...q, id: cloneId, prompt: `${q.prompt} (Copy)` };
                          const next = [...generated];
                          next.splice(i + 1, 0, clone);
                          setGenerated(next);
                        }}
                        className="p-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 cursor-pointer"
                        title="Duplicate Question"
                      >
                        <Copy className="w-3 h-3"/>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerated(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-rose-50 text-rose-600 cursor-pointer"
                        title="Delete from batch"
                      >
                        <Trash2 className="w-3 h-3"/>
                      </button>
                    </div>
                  </div>

                  <div className="font-bold text-xs text-stone-900 mt-2">
                    {q.prompt}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-stone-50 border-stone-200 text-stone-700'
                          }`}
                        >
                          <span className="font-mono text-[10px] text-stone-400">
                            {String.fromCharCode(65 + optIdx)}:
                          </span>
                          <span className="truncate">{opt || '(empty)'}</span>
                          {isCorrect && <Check className="w-3 h-3 text-emerald-600 ml-auto shrink-0"/>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-stone-100 border-t border-stone-200 flex justify-between items-center">
            <div className="text-xs font-semibold text-stone-700">
              Ready to save {generated.length} validated draft questions into the bank.
            </div>
            <button
              onClick={saveGenerated}
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400"/> Save All {generated.length} Draft Questions
            </button>
          </div>
        </div>
      )}
    </div>}
    {mode==='csv_upload'&&<div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
        <div className="font-black text-emerald-950 flex items-center justify-between text-sm">
          <span>Excel Master Workbook (.xlsx) Importer</span>
          <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-xs">Standard Format: Excel (.xlsx)</span>
        </div>
        <p className="text-[11px] text-emerald-900 mt-1 leading-relaxed">
          Standardized <strong>Microsoft Excel (.xlsx)</strong> workbook with 100 Grade 1 questions across all 10 question types, instructions, and full Clipart Library references.
          You never need to embed or paste image files: just reference clipart names like <code>apple</code>, <code>star</code>, <code>cookie</code>, or <code>car</code>!
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
          <Download className="w-4 h-4 text-emerald-600" /> Step 1: Download Master Excel Workbook
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button onClick={downloadExcelMasterWorkbook} className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Download Grade 1 Master Excel Workbook (100 Sample Questions & Clipart Catalog)
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
        <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
          <Upload className="w-4 h-4 text-[#10246f]" /> Step 2: Upload Completed Excel Workbook
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>csvInput?.click()} className="px-5 py-2.5 rounded-xl bg-[#10246f] hover:bg-[#0c1b54] text-white font-bold text-xs shadow-xs transition flex items-center gap-2">
            <Upload className="w-4 h-4" /> Select Excel Workbook (.xlsx, .xls)
          </button>
          <span className="text-[11px] font-semibold text-stone-600">{csvFileName ? `Selected: ${csvFileName}` : 'No file chosen yet'}</span>
          <input ref={setCsvInput} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={onFile} className="hidden" />
        </div>
      </div>

      <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50">
        <input type="checkbox" checked={useSelectedForCsv} onChange={e=>setUseSelectedForCsv(e.target.checked)}/>
        <span>
          <strong>Use current Question Bank hierarchy for all rows</strong>
          <span className="block text-[10px] text-stone-500">Attach questions directly to the active Grade, Category & Skill selected above without needing hierarchy codes in the file.</span>
        </span>
      </label>
      {useSelectedForCsv&&hierarchyBlock}

      {csvErrors.length>0&&<div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-1">
        <div className="font-bold text-xs"><AlertCircle className="inline w-4 h-4 mr-1 text-red-600"/>Validation errors</div>
        {csvErrors.slice(0,20).map((e,i)=><div key={i} className="text-[11px]">{e}</div>)}
        {csvErrors.length>20&&<div className="text-[11px] font-semibold">+ {csvErrors.length-20} more errors</div>}
      </div>}

      {parsed.length>0&&<div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-700"/> {parsed.length} Questions Loaded & Ready
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Review and click <strong>Preview</strong> to test each question as a student, or <strong>Edit</strong> to modify prompts, clipart, pairs, or answer choices before importing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextStatus = parsed.every(q => q.status === 'active' || q.status === 'Published') ? 'Draft' : 'Published';
                setParsed(prev => prev.map(q => ({ ...q, status: nextStatus })));
              }}
              className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition flex items-center gap-1"
            >
              {parsed.every(q => q.status === 'active' || q.status === 'Published') ? 'Set All to Draft' : 'Publish All'}
            </button>
            <button
              type="button"
              onClick={() => {
                setParsed([]);
                setCsvFileName('');
                setCsvErrors([]);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-500"/> Clear List
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {parsed.map((q, i) => (
            <div
              key={q.id || i}
              className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-emerald-300 shadow-2xs transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                    #{i + 1}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-stone-700">
                    {q.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    q.difficulty === 'Hard' ? 'bg-rose-100 text-rose-700' :
                    q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="text-[10px] text-stone-600 font-semibold bg-stone-100 px-1.5 py-0.5 rounded">
                    {typeLabel(q)}
                  </span>
                  {q.visualClipart && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded">
                      {q.visualClipart}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    q.status === 'active' || q.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {q.status || 'Draft'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewQuestion(q)}
                    className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Preview Question in Student Mode"
                  >
                    <Eye className="w-3 h-3 text-stone-600"/> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCsvIndex(i);
                      setEditingDraft({ ...q });
                    }}
                    className="px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-stone-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Edit Question"
                  >
                    <Edit3 className="w-3 h-3 text-emerald-700"/> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cloneId = `${q.id}-COPY-${Date.now().toString().slice(-4)}`;
                      const clone = { ...q, id: cloneId, prompt: `${q.prompt} (Copy)` };
                      const next = [...parsed];
                      next.splice(i + 1, 0, clone);
                      setParsed(next);
                    }}
                    className="p-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 cursor-pointer"
                    title="Duplicate Question"
                  >
                    <Copy className="w-3 h-3"/>
                  </button>
                  <button
                    type="button"
                    onClick={() => setParsed(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-rose-50 text-rose-600 cursor-pointer"
                    title="Delete from list"
                  >
                    <Trash2 className="w-3 h-3"/>
                  </button>
                </div>
              </div>

              <div className="font-bold text-xs text-stone-900 mt-2">
                {q.prompt}
              </div>

              {/* Type-Specific Answer Preview */}
              {q.type === 'match_making' && q.matchPairs && q.matchPairs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                  {q.matchPairs.map((p, pIdx) => (
                    <div key={pIdx} className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-[11px] flex items-center justify-between">
                      <span className="font-semibold text-stone-800">{p.left}</span>
                      <span className="text-stone-400">➔</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">{p.right}</span>
                    </div>
                  ))}
                </div>
              ) : q.type === 'drag_and_drop' && q.dragItems && q.dragItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                  {q.dragItems.map((d, dIdx) => (
                    <div key={dIdx} className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-[11px] flex items-center justify-between">
                      <span className="font-semibold text-stone-800">{d.item}</span>
                      <span className="text-stone-400">➔</span>
                      <span className="font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">{d.target}</span>
                    </div>
                  ))}
                </div>
              ) : q.type === 'sorting' && q.sortBuckets && q.sortBuckets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                  {q.sortBuckets.map((b, bIdx) => (
                    <div key={bIdx} className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-[11px]">
                      <span className="font-bold text-indigo-900">{b.bucketName}:</span>
                      <span className="text-stone-700 ml-1">{b.items.join(', ')}</span>
                    </div>
                  ))}
                </div>
              ) : q.type === 'ordering' && q.orderSequence && q.orderSequence.length > 0 ? (
                <div className="p-1.5 rounded-lg bg-stone-50 border border-stone-200 text-[11px] mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-stone-500">Order:</span>
                  {q.orderSequence.map((step, sIdx) => (
                    <span key={sIdx} className="flex items-center gap-1">
                      <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">{step}</span>
                      {sIdx < q.orderSequence!.length - 1 && <span className="text-stone-400">➔</span>}
                    </span>
                  ))}
                </div>
              ) : (q.type === 'open_box' || q.type === 'fill_blank') ? (
                <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] mt-2 flex items-center gap-2">
                  <span className="font-bold text-emerald-900">Accepted Answer:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {q.openBoxAnswer || q.options[0] || '1'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className="font-mono text-[10px] text-stone-400">
                          {String.fromCharCode(65 + optIdx)}:
                        </span>
                        <span className="truncate">{opt || '(empty)'}</span>
                        {isCorrect && <Check className="w-3 h-3 text-emerald-600 ml-auto shrink-0"/>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>}

      <div className="flex justify-end pt-2">
        <button
          onClick={importCsv}
          disabled={!parsed.length || csvErrors.length > 0}
          className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs disabled:opacity-40 transition shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4 text-emerald-400"/> Import All {parsed.length ? `${parsed.length} Questions` : 'Questions'}
        </button>
      </div>
    </div>}

    {mode==='clipart_library'&&<div className="space-y-4">
      <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-black text-indigo-950 text-sm flex items-center gap-1.5"><Palette className="w-4 h-4 text-indigo-600"/> Master Clipart & Visual Assets Library</div>
          <p className="text-[11px] text-indigo-900 mt-0.5">Use these Clipart IDs or Names in your Excel or Single Question creator. Click any card to copy its reference ID!</p>
        </div>
        <button onClick={downloadExcelMasterWorkbook} className="px-3 py-1.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[11px] transition shrink-0 flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5"/> Export Clipart Excel
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400"/>
          <input
            type="text"
            value={clipartSearch}
            onChange={e=>setClipartSearch(e.target.value)}
            placeholder="Search clipart by name, ID, or keywords (e.g. apple, star, animal)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-1 items-center">
          {clipartCategories.map(cat => (
            <button
              key={cat}
              onClick={()=>setClipartCategoryFilter(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${clipartCategoryFilter===cat?'bg-indigo-600 text-white':'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[55vh] overflow-y-auto p-1">
        {filteredClipart.map(item => {
          const isCopied = copiedClipartCode === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                navigator.clipboard.writeText(item.id);
                setCopiedClipartCode(item.id);
                sounds.click();
                setTimeout(() => setCopiedClipartCode(null), 2000);
              }}
              className="p-3 bg-white border border-stone-200 hover:border-indigo-400 hover:shadow-md rounded-2xl cursor-pointer transition flex flex-col items-center text-center group relative"
            >
              <div className="text-3xl mb-1 transition-transform group-hover:scale-110">{item.emoji}</div>
              <div className="font-bold text-stone-800 text-xs line-clamp-1">{item.name}</div>
              <div className="font-mono text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded mt-1">{item.id}</div>
              <div className="text-[9px] text-stone-600 mt-1">{item.category} · {item.defaultAnimation}</div>
              {isCopied && (
                <div className="absolute inset-0 bg-indigo-900/90 rounded-2xl flex items-center justify-center text-white text-[11px] font-bold">
                  ✓ Copied ID!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>}
  </div></div>
  <QuestionPreviewModal question={previewQuestion} onClose={()=>setPreviewQuestion(null)} />
  <QuestionEditModal
    question={editingDraft}
    isOpen={Boolean(editingDraft)}
    onClose={() => {
      setEditingDraft(null);
      setEditingBatchIndex(null);
      setEditingCsvIndex(null);
    }}
    onSave={(updated) => {
      if (editingBatchIndex !== null) {
        setGenerated(prev => prev.map((item, idx) => idx === editingBatchIndex ? updated : item));
      } else if (editingCsvIndex !== null) {
        setParsed(prev => prev.map((item, idx) => idx === editingCsvIndex ? updated : item));
      }
      setEditingDraft(null);
      setEditingBatchIndex(null);
      setEditingCsvIndex(null);
    }}
  />
  </div>;
}
