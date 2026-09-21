import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, FolderPlus, HelpCircle, Layers3, Plus, Search, Trash2, X, Globe2, ToggleLeft, ToggleRight, Eye, Sparkles } from 'lucide-react';
import { Question, CurriculumGrade, CurriculumSubject } from '../../../types';
import QuestionBankModal from './QuestionBankModal';
import QuestionPreviewModal from './QuestionPreviewModal';
import { loadCurriculumMaster } from '../../../data/curriculumMasterData';
import { CategoryMasterRecord, SkillMasterRecord, loadQuestionBankMasters, saveQuestionBankMasters } from '../../../data/questionBankMasterData';

interface Props { grades: CurriculumGrade[]; subjects: CurriculumSubject[]; questions: Question[]; onAddQuestion: (q: Question) => void; onEditQuestion?: (q: Question) => void; onDeleteQuestion?: (id: string) => void; onSuccessMessage?: (message: string) => void; }
const slug=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const code=(v:string,p='CAT')=>`${p}-${slug(v).split('-').filter(Boolean).map(x=>x.slice(0,3)).join('').slice(0,8).toUpperCase()||'ITEM'}`;
const TYPE_LABELS: Record<string,string>={multiple_choice:'Multiple Choice',radio_single:'Single Choice',fill_blank:'Fill in the Blank',open_box:'Fill in the Blank',true_false:'True / False',image_choice:'Image Choice',image_mcq:'Image + MCQ',select_objects:'Select Objects',drag_and_drop:'Drag & Drop',match_making:'Matching',ordering:'Ordering',sorting:'Sorting',number_line:'Number Line',clock:'Clock',data_graph:'Data / Graph',word_problem:'Word Problem',interactive:'Interactive'};
function typeLabel(q:Question){return TYPE_LABELS[String(q.type||'')]||String(q.type||'Not set').replace(/_/g,' ');}

export default function MasterQuestionBank({grades,subjects,questions,onAddQuestion,onEditQuestion,onDeleteQuestion,onSuccessMessage}:Props){
  const [curriculumMaster, setCurriculumMaster] = useState(loadCurriculumMaster);
  useEffect(() => { setCurriculumMaster(loadCurriculumMaster()); }, []);
  const activeCountries=curriculumMaster.countries.filter(x=>x.active).sort((a,b)=>a.displayOrder-b.displayOrder);
  const [countryId,setCountryId]=useState(activeCountries[0]?.id||'CNT-AU');
  useEffect(() => { if (countryId && !activeCountries.some(c => c.id === countryId)) setCountryId(activeCountries[0]?.id || ''); }, [activeCountries, countryId]);
  const regions=useMemo(()=>curriculumMaster.regions.filter(x=>x.active&&x.countryId===countryId).sort((a,b)=>a.displayOrder-b.displayOrder),[countryId]);
  const [regionId,setRegionId]=useState('');
  const curricula=useMemo(()=>curriculumMaster.curricula.filter(x=>x.active&&x.countryId===countryId&&x.regionId===regionId).sort((a,b)=>a.displayOrder-b.displayOrder),[countryId,regionId]);
  const [curriculumId,setCurriculumId]=useState('');
  const activeGrades=useMemo(()=>grades.filter(g=>g.active),[grades]);
  const activeSubjects=useMemo(()=>subjects.filter(s=>s.active),[subjects]);
  const [selectedGradeId,setSelectedGradeId]=useState(activeGrades[0]?.id||'');
  const [selectedSubjectId,setSelectedSubjectId]=useState(activeSubjects[0]?.id||'');
  const [masters,setMasters]=useState(()=>loadQuestionBankMasters(grades,subjects));
  const [selectedCategoryId,setSelectedCategoryId]=useState<string|null>(null);
  const [selectedSkillId,setSelectedSkillId]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [showCreator,setShowCreator]=useState(false);
  const [showCategoryForm,setShowCategoryForm]=useState(false);
  const [showSkillForm,setShowSkillForm]=useState(false);
  const [previewQuestion,setPreviewQuestion]=useState<Question|null>(null);
  const [newCategory,setNewCategory]=useState('');
  const [newSkill,setNewSkill]=useState('');

  useEffect(()=>{ if(!regionId&&regions[0]) setRegionId(regions[0].id); else if(regionId&&!regions.some(r=>r.id===regionId)) setRegionId(regions[0]?.id||''); },[regions,regionId]);
  useEffect(()=>{ if(!curriculumId&&curricula[0]) setCurriculumId(curricula[0].id); else if(curriculumId&&!curricula.some(c=>c.id===curriculumId)) setCurriculumId(curricula[0]?.id||''); },[curricula,curriculumId]);
  useEffect(()=>{ if(!selectedGradeId&&activeGrades[0]) setSelectedGradeId(activeGrades[0].id); if(selectedGradeId&&!activeGrades.some(g=>g.id===selectedGradeId)) setSelectedGradeId(activeGrades[0]?.id||''); if(!selectedSubjectId&&activeSubjects[0]) setSelectedSubjectId(activeSubjects[0].id); if(selectedSubjectId&&!activeSubjects.some(s=>s.id===selectedSubjectId)) setSelectedSubjectId(activeSubjects[0]?.id||''); },[activeGrades,activeSubjects,selectedGradeId,selectedSubjectId]);
  useEffect(()=>{ saveQuestionBankMasters(masters); },[masters]);

  const selectedCountry=activeCountries.find(x=>x.id===countryId);
  const selectedRegion=regions.find(x=>x.id===regionId);
  const selectedCurriculum=curricula.find(x=>x.id===curriculumId);
  const selectedGrade=activeGrades.find(x=>x.id===selectedGradeId);
  const selectedSubject=activeSubjects.find(x=>x.id===selectedSubjectId);

  const [showInactive, setShowInactive] = useState(true);

  const categories=useMemo(()=>{
    return masters.categories.filter(c=>(showInactive || c.active)&&c.curriculumId===curriculumId&&c.subjectId===selectedSubjectId&&c.gradeId===selectedGradeId);
  },[masters,curriculumId,selectedSubjectId,selectedGradeId,showInactive]);

  const selectedCategory=categories.find(c=>c.id===selectedCategoryId)||categories.find(c=>c.active)||categories[0];
  const skills=useMemo(()=>{
    return masters.skills.filter(s=>(showInactive || s.active)&&s.categoryId===selectedCategory?.id&&s.gradeId===selectedGradeId);
  },[masters,selectedCategory,selectedGradeId,showInactive]);

  const selectedSkill=skills.find(s=>s.id===selectedSkillId)||skills.find(s=>s.active)||skills[0];
  useEffect(()=>{setSelectedCategoryId(prev=>categories.some(c=>c.id===prev)?prev:(categories[0]?.id||null));},[categories]);
  useEffect(()=>{setSelectedSkillId(prev=>skills.some(s=>s.id===prev)?prev:(skills[0]?.id||null));},[skills]);

  const visibleQuestions=useMemo(()=>{
    const term=search.trim().toLowerCase(); 
    return questions.filter(q=>{
      const normCurriculum = (curriculumId || '').toLowerCase();
      const qNormCurriculum = (q.curriculumId || q.curriculum || '').toLowerCase();
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

      return !term||[q.id,q.prompt,q.category,q.skill,q.difficulty,typeLabel(q)].some(v=>String(v||'').toLowerCase().includes(term));
    });
  },[questions,curriculumId,selectedCurriculum,selectedSubjectId,selectedSubject,selectedGradeId,selectedGrade,selectedCategory,selectedSkill,search]);

  const categoryCount=(c:CategoryMasterRecord)=>{
    return questions.filter(q=>{
      const categoryMatch=q.categoryId===c.id||q.category?.trim().toLowerCase()===c.name.trim().toLowerCase();
      const gradeMatch=!q.gradeId||q.gradeId===c.gradeId||(selectedGrade&&q.grade?.toLowerCase()===selectedGrade.name.toLowerCase());
      return categoryMatch&&gradeMatch;
    }).length;
  };

  const skillCount=(s:SkillMasterRecord)=>{
    return questions.filter(q=>{
      const skillMatch=q.skillId===s.id||q.skill?.trim().toLowerCase()===s.name.trim().toLowerCase();
      const gradeMatch=!q.gradeId||q.gradeId===s.gradeId||(selectedGrade&&q.grade?.toLowerCase()===selectedGrade.name.toLowerCase());
      return skillMatch&&gradeMatch;
    }).length;
  };

  const addCategory=()=>{const name=newCategory.trim(); if(!name||!selectedCurriculum||!selectedSubject||!selectedGrade)return; if(categories.some(c=>c.name.trim().toLowerCase()===name.toLowerCase()))return onSuccessMessage?.(`Category '${name}' already exists for ${selectedGrade.name} in this curriculum and subject.`); const item:CategoryMasterRecord={id:`CAT-${Date.now()}`,code:code(name),curriculumId:selectedCurriculum.id,subjectId:selectedSubject.id,gradeId:selectedGrade.id,name,description:`${name} curriculum area`,active:true}; setMasters(p=>({...p,categories:[...p.categories,item]})); setSelectedCategoryId(item.id);setSelectedSkillId(null);setNewCategory('');setShowCategoryForm(false);onSuccessMessage?.(`Created category: ${name} for ${selectedGrade.name}`);};
  const addSkill=()=>{const name=newSkill.trim();if(!name||!selectedCategory||!selectedGrade)return;if(skills.some(s=>s.name.toLowerCase()===name.toLowerCase()))return onSuccessMessage?.('Skill already exists for this category and grade.');const n=skills.length+1;const item:SkillMasterRecord={id:`SKL-${Date.now()}`,code:`SK-${slug(selectedCategory.code)}-${slug(selectedGrade.name).replace(/-/g,'').slice(0,6).toUpperCase()}-${String(n).padStart(3,'0')}`,categoryId:selectedCategory.id,gradeId:selectedGrade.id,name,active:true};setMasters(p=>({...p,skills:[...p.skills,item]}));setSelectedSkillId(item.id);setNewSkill('');setShowSkillForm(false);onSuccessMessage?.(`Created skill: ${name}`);};
  const toggleCategory=(id:string)=>setMasters(p=>{
    const nextCategories = p.categories.map(c=>c.id===id?{...c,active:!c.active}:c);
    const updatedCategory = nextCategories.find(c=>c.id===id);
    window.dispatchEvent(new CustomEvent('funlearn_master_data_updated', { detail: { type: 'category', id, active: updatedCategory?.active } }));
    return {...p, categories: nextCategories};
  });
  const toggleSkill=(id:string)=>setMasters(p=>{
    const nextSkills = p.skills.map(s=>s.id===id?{...s,active:!s.active}:s);
    const updatedSkill = nextSkills.find(s=>s.id===id);
    window.dispatchEvent(new CustomEvent('funlearn_master_data_updated', { detail: { type: 'skill', id, active: updatedSkill?.active } }));
    return {...p, skills: nextSkills};
  });

  const handleCountry=(id:string)=>{setCountryId(id);const r=curriculumMaster.regions.find(x=>x.active&&x.countryId===id);setRegionId(r?.id||'');setCurriculumId('');setSelectedCategoryId(null);setSelectedSkillId(null);};
  const handleRegion=(id:string)=>{setRegionId(id);const c=curriculumMaster.curricula.find(x=>x.active&&x.regionId===id);setCurriculumId(c?.id||'');setSelectedCategoryId(null);setSelectedSkillId(null);};
  const handleCurriculum=(id:string)=>{setCurriculumId(id);setSelectedCategoryId(null);setSelectedSkillId(null);};

  const jumpToPreschool=()=>{
    const preG=activeGrades.find(g=>g.name.toLowerCase().includes('pre'))||activeGrades[0];
    if(preG) setSelectedGradeId(preG.id);
    const mathS=activeSubjects.find(s=>s.name.toLowerCase().includes('math'))||activeSubjects[0];
    if(mathS) setSelectedSubjectId(mathS.id);
    const preCat=masters.categories.find(c=>c.name.toLowerCase()==='preschool wonder world');
    if(preCat) setSelectedCategoryId(preCat.id);
    const preSkl=masters.skills.find(s=>s.name.toLowerCase()==='early discovery & play quest');
    if(preSkl) setSelectedSkillId(preSkl.id);
    onSuccessMessage?.('Directly switched to Preschool Wonder World → Early Discovery & Play Quest');
  };

  return <div className="space-y-5">
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-5"><div className="flex flex-col gap-4"><div><div className="flex items-center gap-2 text-xs font-bold text-stone-700 uppercase tracking-wider"><Layers3 className="w-4 h-4"/> Master Question Bank</div><h2 className="text-2xl font-black text-stone-900 mt-1">Curriculum → Category → Skill → Questions</h2><p className="text-xs text-stone-500 mt-1">One dynamic hierarchy powers manual creation, batch generation and Excel/CSV import.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl"><label className="text-[11px] font-bold">Country<select value={countryId} onChange={e=>handleCountry(e.target.value)} className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white">{activeCountries.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-bold">State / Region<select value={regionId} onChange={e=>handleRegion(e.target.value)} className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white">{regions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label className="text-[11px] font-bold">Curriculum<select value={curriculumId} onChange={e=>handleCurriculum(e.target.value)} className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white">{curricula.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>

      {/* Preschool Fast Access Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50 via-rose-50 to-indigo-50 border border-amber-200/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧸</span>
          <div>
            <div className="text-xs font-black text-stone-900 flex items-center gap-2">
              Preschool Wonder World
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">11 Interactive Formats</span>
            </div>
            <div className="text-[11px] text-stone-600">
              Category: <strong className="text-stone-900">Preschool Wonder World</strong> · Skill: <strong className="text-stone-900">Early Discovery & Play Quest</strong> (All 11 Question Formats)
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={jumpToPreschool}
          className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          View Preschool Questions
        </button>
      </div>

      <div className="flex flex-wrap gap-2"><button onClick={()=>setShowCategoryForm(true)} className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold flex items-center gap-1.5"><FolderPlus className="w-3.5 h-3.5"/> + Category</button><button onClick={()=>setShowSkillForm(true)} disabled={!selectedCategory||!selectedGrade||!selectedCategory.active} className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition"><Plus className="w-3.5 h-3.5"/> + Skill</button><button onClick={()=>setShowCreator(true)} disabled={!selectedCategory||!selectedSkill||!selectedCategory.active||!selectedSkill.active} className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 transition"><HelpCircle className="w-3.5 h-3.5"/> + Create Question</button></div><div className="text-[10px] text-stone-500 mt-2">Inactive categories and skills remain visible here so you can activate them again. Only active Category + Skill combinations can receive new questions.</div>
    </div></div>
    <div className="flex flex-wrap gap-2">{activeGrades.map(g=>{
      const isPre=g.name.toLowerCase().includes('pre');
      return <button key={g.id} onClick={()=>{setSelectedGradeId(g.id);setSelectedSkillId(null);}} className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${selectedGradeId===g.id?'bg-stone-900 text-white border-stone-900':'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}>{isPre ? `🧸 ${g.name} (11)` : g.name}</button>;
    })}</div>
    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200"><BookOpen className="w-4 h-4 text-stone-400 ml-2"/><select value={selectedSubjectId} onChange={e=>{setSelectedSubjectId(e.target.value);setSelectedCategoryId(null);setSelectedSkillId(null);}} className="flex-1 bg-transparent text-sm font-bold outline-none">{activeSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><div className="text-[10px] font-bold text-stone-400 pr-2">{selectedCountry?.name} · {selectedRegion?.name} · {selectedCurriculum?.name}</div></div>
    <div className="grid grid-cols-1 lg:grid-cols-[280px_320px_1fr] gap-4"><div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3"><div className="flex justify-between items-center"><div className="flex items-center gap-2"><h3 className="text-xs font-black uppercase tracking-wider text-stone-500">Categories</h3><button onClick={()=>setShowInactive(!showInactive)} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${showInactive?'bg-stone-100 text-stone-700 border-stone-300':'bg-amber-50 text-amber-700 border-amber-200'}`} title="Toggle inactive visibility">{showInactive?'Showing All':'Only Active'}</button></div><span className="text-[10px] text-stone-400">{categories.length}</span></div>{categories.map(c=><div key={c.id} className={`p-3 rounded-xl border ${selectedCategory?.id===c.id?'border-stone-900 bg-stone-50':'border-stone-200'} ${!c.active?'opacity-75 bg-stone-50/60 border-dashed':''}`}><button onClick={()=>{setSelectedCategoryId(c.id);setSelectedSkillId(null);}} className="w-full text-left"><div className="flex justify-between items-start"><span className="text-sm font-black">{c.name}</span><div className="flex items-center gap-1">{!c.active&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-600">Inactive</span>}<ChevronRight className="w-3.5 h-3.5 text-stone-400"/></div></div><div className="text-[10px] text-stone-500 mt-1">{c.code} · {masters.skills.filter(s=>s.categoryId===c.id).length} skills · {categoryCount(c)} questions</div></button><div className="flex justify-end mt-2"><button onClick={()=>toggleCategory(c.id)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${c.active?'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100':'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100'}`}>{c.active?<><ToggleRight className="inline w-3.5 h-3.5"/> Active · Deactivate</>:<><ToggleLeft className="inline w-3.5 h-3.5"/> Inactive · Activate</>}</button></div></div>)}{!categories.length&&<div className="text-xs text-stone-400 text-center py-8">No categories yet. Add one.</div>}</div>
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3"><div className="flex justify-between items-center"><h3 className="text-xs font-black uppercase tracking-wider text-stone-500">Skills · {selectedGrade?.name}</h3><span className="text-[10px] text-stone-400">{skills.length}</span></div>{selectedCategory&&<div className="text-xs font-black text-stone-700 flex items-center justify-between"><span>{selectedCategory.name}</span>{!selectedCategory.active&&<span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Category Inactive</span>}</div>}{skills.map(s=><div key={s.id} className={`p-3 rounded-xl border ${selectedSkill?.id===s.id?'border-stone-900 bg-stone-50':'border-stone-200'} ${!s.active?'opacity-75 bg-stone-50/60 border-dashed':''}`}><button onClick={()=>setSelectedSkillId(s.id)} className="w-full text-left"><div className="flex justify-between items-start"><span className="text-xs font-bold">{s.name}</span><div className="flex items-center gap-1">{!s.active&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-600">Inactive</span>}<span className="text-[10px] font-mono text-stone-400">{s.code}</span></div></div><div className="text-[10px] text-stone-400 mt-1">{skillCount(s)} questions</div></button><div className="flex justify-end mt-2"><button onClick={()=>toggleSkill(s.id)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${s.active?'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100':'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100'}`}>{s.active?'Active · Deactivate':'Inactive · Activate'}</button></div></div>)}{selectedCategory&&!skills.length&&<div className="text-xs text-stone-400 text-center py-8">No skill for this grade yet.</div>}</div>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden"><div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row gap-3 justify-between"><div><div className="text-[10px] font-bold text-stone-400">{selectedCurriculum?.name} · {selectedGrade?.name} · {selectedSubject?.name}</div><h3 className="text-base font-black">{selectedCategory?.name||'Select a category'} {selectedSkill?`· ${selectedSkill.name}`:''}</h3></div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions..." className="pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-xs w-56"/></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-stone-50 text-[10px] uppercase text-stone-500"><tr><th className="p-3">QID</th><th className="p-3">Question</th><th className="p-3">Type</th><th className="p-3">Difficulty</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>{visibleQuestions.map(q=><tr key={q.id} className="border-t border-stone-100"><td className="p-3 font-mono font-bold">{q.id}</td><td className="p-3 max-w-md"><div className="font-semibold truncate">{q.prompt}</div></td><td className="p-3 text-stone-500">{typeLabel(q)}</td><td className="p-3"><span className="px-2 py-1 rounded-lg bg-stone-100 font-bold">{q.difficulty}</span></td><td className="p-3"><div className="flex items-center gap-2"><select value={q.status||'Draft'} onChange={e=>onEditQuestion?.({...q,status:e.target.value as Question['status']})} disabled={!onEditQuestion} className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${q.status==='Published'?'border-emerald-200 bg-emerald-50 text-emerald-700':q.status==='Archived'?'border-stone-200 bg-stone-100 text-stone-500':'border-amber-200 bg-amber-50 text-amber-700'}`}><option value="Draft">Draft</option><option value="Published">Published / Ready</option><option value="Archived">Archived</option></select>{(q.status||'Draft')==='Draft'&&onEditQuestion&&<button onClick={()=>{onEditQuestion({...q,status:'Published'});onSuccessMessage?.(`Published ${q.id}. It is now Ready.`);}} className="px-2 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold transition">Publish</button>}</div></td><td className="p-3"><div className="flex items-center gap-2"><button onClick={()=>setPreviewQuestion(q)} className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200" title="Preview question"><Eye className="w-3.5 h-3.5"/></button>{onDeleteQuestion&&<button onClick={()=>{if(confirm(`Delete question ${q.id}?`))onDeleteQuestion(q.id)}} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Delete question"><Trash2 className="w-3.5 h-3.5"/></button>}</div></td></tr>)}{!visibleQuestions.length&&<tr><td colSpan={6} className="p-10 text-center text-stone-400">No questions in this skill yet.</td></tr>}</tbody></table></div></div>
    </div>
    {showCategoryForm&&<div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-5 w-full max-w-md"><h3 className="font-black">Create Category</h3><p className="text-xs text-stone-500 mt-1">{selectedCurriculum?.name} · {selectedSubject?.name} · {selectedGrade?.name}</p><input autoFocus value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="e.g. Number" className="w-full mt-4 p-3 rounded-xl border"/><div className="flex justify-end gap-2 mt-4"><button onClick={()=>setShowCategoryForm(false)} className="px-3 py-2 rounded-xl border text-xs font-bold">Cancel</button><button onClick={addCategory} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">Create</button></div></div></div>}
    {showSkillForm&&<div className="fixed inset-0 z-[100] bg-black/30 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-5 w-full max-w-md"><h3 className="font-black">Create Skill</h3><p className="text-xs text-stone-500 mt-1">{selectedCurriculum?.name} · {selectedGrade?.name} · {selectedCategory?.name}</p><input autoFocus value={newSkill} onChange={e=>setNewSkill(e.target.value)} placeholder="e.g. Compare and order numbers" className="w-full mt-4 p-3 rounded-xl border"/><div className="flex justify-end gap-2 mt-4"><button onClick={()=>setShowSkillForm(false)} className="px-3 py-2 rounded-xl border text-xs font-bold">Cancel</button><button onClick={addSkill} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">Create</button></div></div></div>}
    <QuestionPreviewModal question={previewQuestion} onClose={()=>setPreviewQuestion(null)} />
    <QuestionBankModal isOpen={showCreator} onClose={()=>setShowCreator(false)} availableGrades={activeGrades.map(g=>g.name)} availableSubjects={activeSubjects.map(s=>s.name)} questions={questions} onAddQuestion={q=>{onAddQuestion(q);onSuccessMessage?.(`Added ${q.id} to ${selectedCategory?.name} → ${selectedSkill?.name}`);setShowCreator(false);}} initialGrade={selectedGrade?.name} initialSubject={selectedSubject?.name} initialCategory={selectedCategory?.name} initialSkill={selectedSkill?.name} initialCountryId={countryId} initialRegionId={regionId} initialCurriculumId={curriculumId} categoryMasters={masters.categories} skillMasters={masters.skills} grades={activeGrades} subjects={activeSubjects} onAddBatchQuestions={qs=>{qs.forEach(onAddQuestion);onSuccessMessage?.(`Added ${qs.length} questions to the Master Question Bank.`);setShowCreator(false);}} />
  </div>;
}
