import React, { useEffect, useMemo, useState } from 'react';
import { Question, Subject, GradeLevel, QuestionType, CurriculumGrade, CurriculumSubject, VisualQuestionConfig, VisualQuestionTemplate, VisualAnimation } from '../../../types';
import { X, HelpCircle, Sparkles, Check, Plus, AlertCircle, Download, Upload, FileSpreadsheet, Eye, Globe, Trash2 } from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { getNextQuestionId } from '../../../utils/idAndUsernameGenerator';
import { loadCurriculumMaster } from '../../../data/curriculumMasterData';
import { CategoryMasterRecord, SkillMasterRecord } from '../../../data/questionBankMasterData';
import { fixMojibake, parseVisualObjectsString } from '../../../utils/visualUtils';

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
const csvEscape=(v:any)=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
const parseCsv=(text:string)=>{const rows:string[][]=[];let row:string[]=[];let cell='';let quote=false;for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(ch===','&&!quote){row.push(cell.trim());cell='';}else if((ch==='\n'||ch==='\r')&&!quote){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());cell='';if(row.some(x=>x!==''))rows.push(row);row=[];}else cell+=ch;}row.push(cell.trim());if(row.some(x=>x!==''))rows.push(row);return rows;};

export default function QuestionBankModal({isOpen,onClose,availableGrades,availableSubjects,questions=[],onAddQuestion,onAddBatchQuestions,initialGrade,initialSubject,initialCategory,initialSkill,initialCountryId,initialRegionId,initialCurriculumId,categoryMasters=[],skillMasters=[],grades=[],subjects=[]}:Props){
  const cm=loadCurriculumMaster();
  const countries=cm.countries.filter(x=>x.active).sort((a,b)=>a.displayOrder-b.displayOrder);
  const [mode,setMode]=useState<'single'|'batch'|'csv_upload'>('single');
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
  const [visualClipart,setVisualClipart]=useState(''); const [mediaUrl,setMediaUrl]=useState('');
  const [visualEnabled,setVisualEnabled]=useState(false); const [visualTemplate,setVisualTemplate]=useState<VisualQuestionTemplate>('picture_counting');
  const [visualAnimation,setVisualAnimation]=useState<VisualAnimation>('bounce'); const [visualInteraction,setVisualInteraction]=useState<VisualQuestionConfig['interaction']>('tap');
  const [visualInstructions,setVisualInstructions]=useState(''); const [visualImageUrl,setVisualImageUrl]=useState(''); const [visualAudioUrl,setVisualAudioUrl]=useState('');
  const [visualObjects,setVisualObjects]=useState(''); const [visualBackground,setVisualBackground]=useState<NonNullable<VisualQuestionConfig['background']>>('playful'); const [visualAutoPlay,setVisualAutoPlay]=useState(true); const [explanation,setExplanation]=useState(''); const [hint,setHint]=useState(''); const [points,setPoints]=useState(20);
  const [batchCount,setBatchCount]=useState(10); const [batchDifficulty,setBatchDifficulty]=useState<'Easy'|'Medium'|'Hard'|'Mixed'>('Easy'); const [batchType,setBatchType]=useState<'same'|'mixed'>('same'); const [batchVisualMode,setBatchVisualMode]=useState<'text'|'visual'|'mixed'>('text'); const [generated,setGenerated]=useState<Question[]>([]);
  const [useSelectedForCsv,setUseSelectedForCsv]=useState(false); const [csvFileName,setCsvFileName]=useState(''); const [csvErrors,setCsvErrors]=useState<string[]>([]); const [parsed,setParsed]=useState<Question[]>([]); const [csvInput,setCsvInput]=useState<HTMLInputElement|null>(null);

  useEffect(()=>{if(!isOpen)return;setMode('single');setCountryId(initialCountryId||countries[0]?.id||'');setRegionId(initialRegionId||'');setCurriculumId(initialCurriculumId||'');setGrade((initialGrade as GradeLevel)||availableGrades[0]||'Grade 1');setSubject((initialSubject as Subject)||availableSubjects[0]||'Mathematics');setCategoryId('');setSkillId('');setGenerated([]);setCsvErrors([]);setBatchVisualMode('text');setParsed([]);setVisualEnabled(false);setVisualTemplate('picture_counting');setVisualAnimation('bounce');setVisualInteraction('tap');setVisualInstructions('');setVisualImageUrl('');setVisualAudioUrl('');setVisualObjects('');setVisualBackground('playful');setVisualAutoPlay(true);},[isOpen]);
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
      objects: visualObjects.trim() ? visualObjects.split('|').map((item,index)=>({id:`obj-${index+1}`,label:item.trim(),emoji:item.trim()})).filter(x=>x.label) : undefined
    } : undefined);
    return {id,subject,grade,category:names.category,skill:names.skill,prompt:p,options:opts,correctIndex:correct,explanation:extra.explanation||explanation||'Review the answer and try again.',hint:extra.hint||hint||undefined,points:extra.points||points,difficulty:diff,type,country:names.country,state:names.region,curriculum:names.curriculum,countryId,regionId,curriculumId,subjectId:selectedSubject?.id,gradeId:selectedGrade?.id,categoryId:selectedCategory?.id,categoryCode:selectedCategory?.code,skillId:selectedSkill?.id,skillCode:selectedSkill?.code,curriculumReference:selectedSkill?.curriculumReference,status:'Draft',visualClipart:extra.visualClipart||visualClipart||undefined,mediaUrl:extra.mediaUrl||mediaUrl||undefined,openBoxAnswer:extra.openBoxAnswer,visualConfig};
  };

  const saveSingle=(e:React.FormEvent)=>{e.preventDefault();if(!canCreate||!prompt.trim())return;const id=getNextQuestionId(grade,questions,0,subject);const q=buildQuestion(id,prompt.trim(),questionType==='open_box'||questionType==='fill_blank'?[openAnswer.trim()]:options.map(x=>x.trim()),questionType==='open_box'||questionType==='fill_blank'?0:correctIndex,difficulty,questionType,{openBoxAnswer:(questionType==='open_box'||questionType==='fill_blank')?openAnswer.trim():undefined});onAddQuestion(q);onSuccess();};
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
        p = `Drag and place each item into its correct target!`;
      } else if (type === 'match_making') {
        matchPairs = [
          { left: '🐱 Cat', right: 'Meow' },
          { left: '🐶 Dog', right: 'Woof' },
          { left: '🐮 Cow', right: 'Moo' }
        ];
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

  const downloadQuickVisualTemplate=()=>{
    const sampleRows=[
      ['How many apples are on the screen?','2','3','4','5','B','apple|apple|apple','bounce','🍎 🍎 🍎','picture_counting','Tap each apple to count them.','Easy'],
      ['Which shape is a star?','Circle','Triangle','Star','Square','C','circle|triangle|star|square','pulse','⭐','picture_choice','Tap the star.','Easy'],
      ['Which animal is the largest?','Mouse','Dog','Elephant','','C','mouse|dog|elephant|','bounce','🐘','picture_choice','Tap the biggest animal.','Easy'],
      ['What is 2 + 2?','3','4','5','6','B','cookie|cookie|cookie|cookie','bounce','🍪 🍪 🍪 🍪','picture_counting','Count all the cookies.','Easy']
    ];
    const csv=['\uFEFF' + quickVisualHeaders.map(csvEscape).join(','),...sampleRows.map(r=>r.map(csvEscape).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='pforpencil_quick_visual_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate=()=>{const sample=['','CNT-AU','REG-VIC','CUR-VCAA20','SUB_MTH','GRD_G3','CAT-NUM','SK-NUM-01','Easy','multiple_choice','Which number is greater?','25','32','18','21','B','32 is greater than 25, 18 and 21.','Compare the numbers.','🔢','', 'Yes','picture_counting','bounce','tap','Tap the pictures and choose the answer.','','','apple|apple|apple','playful','Yes',20,'Draft'];const masterSheet=[['MASTER DATA CODES'],['Countries'],...cm.countries.map(x=>[x.code,x.name]),['Regions'],...cm.regions.map(x=>[x.code,x.name,x.countryId]),['Curricula'],...cm.curricula.map(x=>[x.code,x.name,x.regionId])];const csv=[templateHeaders.map(csvEscape).join(','),sample.map(csvEscape).join(','),'','','# Master Data Reference','','','',...masterSheet.map(r=>r.map(csvEscape).join(','))].join('\n');const blob=new Blob(['\uFEFF' + csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='pforpencil_question_master_template.csv';a.click();URL.revokeObjectURL(url);};
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

      const opts=[val('Option A'),val('Option B'),val('Option C'),val('Option D')];
      const ca=(val('Correct Answer')||'A').toUpperCase();
      const ci=Math.max(0,['A','B','C','D'].indexOf(ca));

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
        options:opts,
        correctIndex:ci,
        explanation:val('Explanation')||'Review the answer and try again.',
        hint:val('Hint')||undefined,
        visualClipart:finalClipart,
        mediaUrl:val('Media URL')||undefined,
        visualConfig,
        points:Number(val('Points'))||20,
        status:(val('Status') as any)||'Draft'
      };
      out.push(q);
      existing.push(q);
    });
    setCsvErrors(errs);
    setParsed(out);
  };
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];
    if(!f)return;
    setCsvFileName(f.name);
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
  };
  const importCsv=()=>{if(!parsed.length||csvErrors.length)return;if(onAddBatchQuestions)onAddBatchQuestions(parsed);else parsed.forEach(onAddQuestion);onSuccess();};
  const onSuccess=()=>{sounds.success();onClose();};
  if(!isOpen)return null;
  const hierarchyBlock=<div className="p-3.5 bg-[#f8faff] border border-[#d7def0] rounded-2xl"><div className="flex items-center gap-1.5 font-bold text-xs text-[#10246f] mb-2"><Globe className="w-3.5 h-3.5 text-[#10246f]"/> Curriculum Hierarchy</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="text-[11px] font-semibold text-stone-700">Country<select value={countryId} onChange={e=>setCountry(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{countries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">State / Region<select value={regionId} onChange={e=>setRegion(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{regions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Curriculum<select value={curriculumId} onChange={e=>setCurriculum(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{curricula.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3"><label className="text-[11px] font-semibold text-stone-700">Subject<select value={subject} onChange={e=>setSubjectAndReset(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{availableSubjects.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Grade / Level<select value={grade} onChange={e=>setGradeAndReset(e.target.value)} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800">{availableGrades.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Category<select value={selectedCategory?.id||''} onChange={e=>{setCategoryId(e.target.value);setSkillId('')}} disabled={!categoryOptions.length} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 disabled:bg-stone-50"><option value="">{categoryOptions.length?'Select category':'No category'}</option>{categoryOptions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-semibold text-stone-700">Skill<select value={selectedSkill?.id||''} onChange={e=>setSkillId(e.target.value)} disabled={!skillOptions.length} className="w-full mt-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 disabled:bg-stone-50"><option value="">{skillOptions.length?'Select skill':'No skill'}</option>{skillOptions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>{!canCreate&&<div className="mt-2 text-[10px] text-amber-700">Select a valid Curriculum → Subject → Grade → Category → Skill combination before creating a question.</div>}</div>;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-5xl w-full my-4 overflow-hidden flex flex-col max-h-[94vh]"><div className="bg-stone-900 text-white p-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Master Question Bank Creator</h2><p className="text-xs text-stone-300">Single create, batch generate and CSV import all use the same master hierarchy and question structure.</p></div><button onClick={onClose}><X className="w-5 h-5"/></button></div><div className="bg-stone-100 px-6 py-2.5 border-b flex gap-2 text-xs font-bold"><button onClick={()=>setMode('single')} className={`px-3 py-1.5 rounded-xl ${mode==='single'?'bg-white shadow-xs':'text-stone-600'}`}>Single Interactive Question</button><button onClick={()=>setMode('batch')} className={`px-3 py-1.5 rounded-xl ${mode==='batch'?'bg-white shadow-xs':'text-stone-600'}`}><Sparkles className="inline w-3.5 h-3.5 text-amber-500 mr-1"/>Batch Multi-Question Generator</button><button onClick={()=>setMode('csv_upload')} className={`px-3 py-1.5 rounded-xl ${mode==='csv_upload'?'bg-white shadow-xs':'text-stone-600'}`}><FileSpreadsheet className="inline w-3.5 h-3.5 text-emerald-600 mr-1"/>Excel / CSV Bulk Upload & Template</button></div><div className="p-6 overflow-y-auto flex-1 text-stone-800 text-xs">
    {mode==='single'&&<form onSubmit={saveSingle} className="space-y-4">{hierarchyBlock}<div className="grid grid-cols-2 gap-3"><label className="font-semibold">Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)} className="w-full mt-1 p-2 rounded-xl border"><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label className="font-semibold">Question Type<select value={questionType} onChange={e=>setQuestionType(e.target.value as QuestionType)} className="w-full mt-1 p-2 rounded-xl border">{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label></div><label className="font-semibold block">Question Text<textarea required value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} className="w-full mt-1 p-3 rounded-xl border" placeholder="Enter the student-facing question..."/></label>{(questionType==='open_box'||questionType==='fill_blank')?<label className="font-semibold block">Correct Answer<input required value={openAnswer} onChange={e=>setOpenAnswer(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border"/></label>:<div className="p-3 rounded-2xl bg-stone-50 border"><div className="font-bold mb-2">Answer Options</div>{options.map((o,i)=><div key={i} className="flex gap-2 mb-2"><input type="radio" checked={correctIndex===i} onChange={()=>setCorrectIndex(i)}/><input value={o} onChange={e=>setOptions(p=>p.map((x,j)=>j===i?e.target.value:x))} placeholder={`Option ${String.fromCharCode(65+i)}`} className="flex-1 p-2 rounded-lg border"/></div>)}</div>}<div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-3"><div className="flex items-center justify-between"><div><div className="font-black text-stone-900">Visual / Animated Layer</div><div className="text-[10px] text-stone-600 mt-0.5">Optional. Existing text questions work exactly as before.</div></div><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={visualEnabled} onChange={e=>setVisualEnabled(e.target.checked)}/> Enable visuals</label></div>{visualEnabled&&<><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><label>Template<select value={visualTemplate} onChange={e=>setVisualTemplate(e.target.value as VisualQuestionTemplate)} className="w-full mt-1 p-2 rounded-xl border bg-white"><option value="picture_counting">Picture Counting</option><option value="picture_choice">Picture Choice</option><option value="drag_drop">Drag & Drop</option><option value="matching">Matching</option><option value="sorting">Sorting</option><option value="ordering">Ordering</option><option value="pattern">Pattern</option><option value="number_line">Number Line</option><option value="interactive_story">Interactive Story</option></select></label><label>Animation<select value={visualAnimation} onChange={e=>setVisualAnimation(e.target.value as VisualAnimation)} className="w-full mt-1 p-2 rounded-xl border bg-white"><option>none</option><option>bounce</option><option>float</option><option>pulse</option><option>wiggle</option><option>pop</option><option>spin</option></select></label><label>Interaction<select value={visualInteraction} onChange={e=>setVisualInteraction(e.target.value as VisualQuestionConfig['interaction'])} className="w-full mt-1 p-2 rounded-xl border bg-white"><option value="tap">Tap</option><option value="count">Count</option><option value="drag">Drag</option><option value="match">Match</option><option value="sort">Sort</option><option value="order">Order</option><option value="none">None</option></select></label></div><label className="block">Visual Instructions<textarea value={visualInstructions} onChange={e=>setVisualInstructions(e.target.value)} rows={2} className="w-full mt-1 p-2 rounded-xl border bg-white" placeholder="e.g. Tap all the apples, then choose how many you counted."/></label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><label>Visual Image / GIF URL<input value={visualImageUrl} onChange={e=>setVisualImageUrl(e.target.value)} className="w-full mt-1 p-2 rounded-xl border bg-white" placeholder="https://..."/></label><label>Audio URL<input value={visualAudioUrl} onChange={e=>setVisualAudioUrl(e.target.value)} className="w-full mt-1 p-2 rounded-xl border bg-white" placeholder="https://...mp3"/></label></div><label>Visual Objects <span className="font-normal text-stone-500">(separate with |, e.g. 🍎|🍎|🍎)</span><input value={visualObjects} onChange={e=>setVisualObjects(e.target.value)} className="w-full mt-1 p-2 rounded-xl border bg-white" placeholder="🍎|🍎|🍎|🍎|🍎"/></label><div className="flex flex-wrap gap-2 items-center"><label>Background<select value={visualBackground} onChange={e=>setVisualBackground(e.target.value as any)} className="ml-1 p-1.5 rounded-lg border bg-white"><option value="playful">Playful</option><option value="soft">Soft</option><option value="none">None</option></select></label><label className="flex items-center gap-1.5"><input type="checkbox" checked={visualAutoPlay} onChange={e=>setVisualAutoPlay(e.target.checked)}/> Auto-play animation/audio</label></div><div className="p-3 rounded-xl bg-white border flex items-center justify-center min-h-20"><div className="text-center"><div className="text-[10px] text-stone-400 mb-1">Live visual preview</div><div className="text-3xl">{visualObjects||visualClipart||'🍎 🍎 🍎'}</div><div className="text-[10px] text-stone-600 mt-1">{visualInstructions||'Your visual question will appear here.'}</div></div></div></>}</div><div className="flex flex-wrap gap-1.5">{CLIPART.map(x=><button key={x} type="button" onClick={()=>setVisualClipart(p=>p+x)} className="w-8 h-8 border rounded-lg bg-white">{x}</button>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><textarea value={explanation} onChange={e=>setExplanation(e.target.value)} rows={2} placeholder="Explanation" className="p-2 rounded-xl border"/><textarea value={hint} onChange={e=>setHint(e.target.value)} rows={2} placeholder="Hint (optional)" className="p-2 rounded-xl border"/></div><div className="flex justify-between items-center border-t pt-3"><div className="text-[10px] text-stone-500">Questions are saved as Draft and can be reviewed before publishing.</div><button disabled={!canCreate||!prompt.trim()} className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold disabled:opacity-40"><Plus className="inline w-4 h-4 mr-1"/>Save Draft Question</button></div></form>}
    {mode==='batch'&&<div className="space-y-4">{hierarchyBlock}<div className="grid grid-cols-1 sm:grid-cols-4 gap-3"><label className="font-semibold">Questions<input type="number" min={1} max={1000} value={batchCount} onChange={e=>setBatchCount(Math.min(1000,Math.max(1,Number(e.target.value)||1)))} className="w-full mt-1 p-2.5 rounded-xl border"/></label><label className="font-semibold">Difficulty<select value={batchDifficulty} onChange={e=>setBatchDifficulty(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border"><option>Easy</option><option>Medium</option><option>Hard</option><option>Mixed</option></select></label><label className="font-semibold">Question Type<select value={batchType} onChange={e=>setBatchType(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border"><option value="same">Multiple Choice</option><option value="mixed">Mixed Types</option></select></label><label className="font-semibold">Visual Style<select value={batchVisualMode} onChange={e=>setBatchVisualMode(e.target.value as any)} className="w-full mt-1 p-2.5 rounded-xl border"><option value="text">Text (existing)</option><option value="visual">Visual / Animated</option><option value="mixed">Mixed</option></select></label></div><div className="flex justify-between"><div className="text-stone-500">Generate questions for <strong>{names.skill||'selected skill'}</strong>. Generated questions remain Draft.</div><button onClick={generateBatch} disabled={!canCreate} className="px-4 py-2 rounded-xl bg-amber-500 font-bold disabled:opacity-40"><Sparkles className="inline w-4 h-4 mr-1"/>Generate {batchCount}</button></div>{generated.length>0&&<div className="border rounded-2xl overflow-hidden"><div className="p-3 bg-stone-50 border-b flex justify-between font-bold"><span>Generated Preview ({generated.length})</span><button onClick={()=>setGenerated([])}><Trash2 className="w-4 h-4"/></button></div><div className="max-h-72 overflow-y-auto">{generated.map((q,i)=><div key={q.id} className="p-3 border-b"><div className="font-mono text-[10px] text-stone-400">{i+1}. {q.id} · {q.difficulty}</div><div className="font-semibold mt-1">{q.prompt}</div><div className="text-stone-500 mt-1">{q.options.join(' · ')}</div></div>)}</div><div className="p-3 flex justify-end"><button onClick={saveGenerated} className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold">Save {generated.length} Draft Questions</button></div></div>}</div>}
    {mode==='csv_upload'&&<div className="space-y-4"><div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200"><div className="font-black text-emerald-950 flex items-center justify-between"><span>Simplified Visual & Animated CSV Upload</span><span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">New: Quick Visual Mode</span></div><p className="text-[11px] text-emerald-800 mt-1">To create visual questions easily, you only need <strong>Question Text, Options, Correct Answer, and Visual Objects</strong>. You can write emojis like <strong>🍎|🍎|🍎</strong> or plain English words like <strong>apple|apple|apple</strong>, <strong>star|circle|square</strong>, or <strong>cat|dog|lion</strong>. The system automatically converts them and fixes Excel encoding!</p></div><div className="flex flex-wrap gap-2"><button onClick={downloadQuickVisualTemplate} className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"><Download className="w-4 h-4"/>Download Quick Visual CSV (Simple)</button><button onClick={downloadTemplate} className="px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition flex items-center gap-1.5"><Download className="w-4 h-4"/>Full Master Template (Advanced)</button><button onClick={()=>csvInput?.click()} className="px-4 py-2 rounded-xl bg-[#10246f] hover:bg-[#0c1b54] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"><Upload className="w-4 h-4"/>Choose CSV</button><input ref={setCsvInput} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden"/></div><label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50"><input type="checkbox" checked={useSelectedForCsv} onChange={e=>setUseSelectedForCsv(e.target.checked)}/><span><strong>Use current Question Bank hierarchy for all rows</strong><span className="block text-[10px] text-stone-500">Attach questions directly to the active Grade, Category & Skill selected above without needing hierarchy codes.</span></span></label>{useSelectedForCsv&&hierarchyBlock}<div className="text-[10px] text-stone-500">{csvFileName?`File: ${csvFileName}`:'No file selected'}</div>{csvErrors.length>0&&<div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-1"><div className="font-bold"><AlertCircle className="inline w-4 h-4 mr-1"/>Validation errors</div>{csvErrors.slice(0,20).map((e,i)=><div key={i}>{e}</div>)}{csvErrors.length>20&&<div>+ {csvErrors.length-20} more errors</div>}</div>}{parsed.length>0&&<div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200"><div className="font-bold text-emerald-900">✓ {parsed.length} questions ready to import</div><p className="text-[10px] text-emerald-800 mt-1">All imported questions will be created as Draft.</p></div>}<div className="flex justify-end"><button onClick={importCsv} disabled={!parsed.length||csvErrors.length>0} className="px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold disabled:opacity-40">Import {parsed.length||''} Draft Questions</button></div></div>}
  </div></div></div>;
}
