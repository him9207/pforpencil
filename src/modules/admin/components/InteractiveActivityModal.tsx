import React, { useMemo, useState } from 'react';
import { Activity, ActivityFormat, ActivityStep, GradeLevel, Question, Subject } from '../../../types';
import { Check, ChevronDown, ChevronUp, Eye, Gamepad2, GripVertical, Plus, Trash2, X } from 'lucide-react';
import InteractiveActivityPreviewModal from './InteractiveActivityPreviewModal';
import { getNextActivityId } from '../../../data/activityData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  availableGrades: string[];
  availableSubjects: string[];
  questions: Question[];
  activity?: Activity | null;
  onAddActivity: (activity: Activity) => void;
  onEditActivity?: (activity: Activity) => void;
}

const FORMATS: { id: ActivityFormat; label: string; emoji: string; desc: string }[] = [
  { id: 'balloon_pop', label: 'Balloon Pop Carnival', emoji: '🎈', desc: 'Floating balloons with popping physics and rewards' },
  { id: 'space_blaster', label: 'Space Crystal Blaster', emoji: '🚀', desc: 'Target orbital asteroids and fire starship lasers' },
  { id: 'feeding_game', label: 'Feeding Game', emoji: '🐒', desc: 'Solve a question, then feed the character' },
  { id: 'drag_drop', label: 'Drag & Drop', emoji: '🖱️', desc: 'Move objects to the right target' },
  { id: 'matching', label: 'Matching', emoji: '🧩', desc: 'Match objects, pictures or concepts' },
  { id: 'memory', label: 'Memory', emoji: '🃏', desc: 'Reveal and pair matching cards' },
  { id: 'sorting', label: 'Sorting', emoji: '🧺', desc: 'Put objects into the correct group' },
  { id: 'ordering', label: 'Ordering', emoji: '🔢', desc: 'Build the correct sequence' },
  { id: 'pattern', label: 'Pattern', emoji: '🎨', desc: 'Complete a visual pattern' },
  { id: 'story', label: 'Story Adventure', emoji: '📖', desc: 'Step through a learning story' },
  { id: 'arcade', label: 'Arcade', emoji: '🎮', desc: 'Collect objects and earn points' },
  { id: 'quiz_game', label: 'Quiz Game', emoji: '🏆', desc: 'Fast game using Question Bank content' },
  { id: 'question_run', label: 'Question Adventure', emoji: '🧠', desc: 'Use the Question Bank as a guided run' }
];

const ARCHETYPE: Record<ActivityFormat, Activity['type']> = {
  balloon_pop: 'game', space_blaster: 'game', question_run: 'daily_quiz', drag_drop: 'game', matching: 'game', memory: 'game', sorting: 'game', ordering: 'game', pattern: 'game', story: 'game', arcade: 'game', quiz_game: 'challenge', feeding_game: 'game'
};

const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

function makeDefaultTask(format: ActivityFormat, questionId?: string): ActivityStep {
  const base: ActivityStep = { id: newId('STEP'), type: 'game_task' };
  if (format === 'feeding_game') return { ...base, gameTask: { id: newId('TASK'), title: 'Feed the Monkey', instruction: 'Solve the challenge, choose the correct answer, then feed the monkey!', mechanic: 'feeding_game', questionId, targetCount: 1, rewardPoints: 25, items: [{ id: 'banana', label: 'Banana', emoji: '🍌' }] } };
  if (format === 'ordering') return { ...base, gameTask: { id: newId('TASK'), title: 'Put the numbers in order', instruction: 'Tap each number from smallest to largest.', mechanic: 'ordering', items: [{ id: '1', label: '1', emoji: '1️⃣' }, { id: '2', label: '2', emoji: '2️⃣' }, { id: '3', label: '3', emoji: '3️⃣' }], rewardPoints: 20 } };
  if (format === 'matching') return { ...base, gameTask: { id: newId('TASK'), title: 'Match the pairs', instruction: 'Select an item, then choose its matching target.', mechanic: 'matching', items: [{ id: 'apple', label: 'Apple', emoji: '🍎', target: 'fruit' }, { id: 'dog', label: 'Dog', emoji: '🐶', target: 'animal' }], targets: [{ id: 'fruit', label: 'Fruit', emoji: '🍓' }, { id: 'animal', label: 'Animal', emoji: '🐾' }], rewardPoints: 20 } };
  if (format === 'drag_drop' || format === 'sorting') return { ...base, gameTask: { id: newId('TASK'), title: format === 'drag_drop' ? 'Move each object' : 'Sort the objects', instruction: 'Choose an object and then its correct target.', mechanic: format, items: [{ id: 'apple', label: 'Apple', emoji: '🍎', target: 'fruit' }, { id: 'dog', label: 'Dog', emoji: '🐶', target: 'animal' }], targets: [{ id: 'fruit', label: 'Fruits', emoji: '🧺' }, { id: 'animal', label: 'Animals', emoji: '🐾' }], rewardPoints: 20 } };
  if (format === 'memory') return { ...base, gameTask: { id: newId('TASK'), title: 'Memory Match', instruction: 'Turn cards over and find matching pairs.', mechanic: 'memory', items: [{ id: 'apple', label: 'Apple', emoji: '🍎' }, { id: 'dog', label: 'Dog', emoji: '🐶' }, { id: 'star', label: 'Star', emoji: '⭐' }, { id: 'car', label: 'Car', emoji: '🚗' }], rewardPoints: 25 } };
  if (format === 'arcade') return { ...base, gameTask: { id: newId('TASK'), title: 'Collect the stars', instruction: 'Tap the stars to collect them all.', mechanic: 'arcade', targetCount: 5, items: ['s1','s2','s3','s4','s5'].map(id => ({ id, label: 'Star', emoji: '⭐' })), rewardPoints: 25 } };
  return { ...base, gameTask: { id: newId('TASK'), title: 'Explore and play', instruction: 'Complete the visual game challenge.', mechanic: format, items: [{ id: 'a', label: '🌟', emoji: '🌟' }, { id: 'b', label: '🚀', emoji: '🚀' }, { id: 'c', label: '🪐', emoji: '🪐' }], rewardPoints: 20 } };
}

export default function InteractiveActivityModal({ isOpen, onClose, availableGrades, availableSubjects, questions, activity, onAddActivity, onEditActivity }: Props) {
  const editing = Boolean(activity);
  const [title, setTitle] = useState(activity?.title || 'Feed the Monkey');
  const [description, setDescription] = useState(activity?.description || 'Solve fun maths challenges and feed the monkey with the correct answer.');
  const [grades, setGrades] = useState<string[]>(activity?.grades?.length ? activity.grades : activity?.grade ? [activity.grade] : [availableGrades[0] || 'Preschool']);
  const [subject, setSubject] = useState<Subject>(activity?.subject || availableSubjects[0] || 'Mathematics');
  const [format, setFormat] = useState<ActivityFormat>(activity?.format || 'feeding_game');
  const [difficulty, setDifficulty] = useState<'Easy'|'Medium'|'Hard'>(activity?.difficulty || 'Easy');
  const [instructions, setInstructions] = useState(activity?.instructions || 'Choose the correct answer and help the monkey eat!');
  const [tags, setTags] = useState((activity?.learningTags || []).join(', '));
  const [rewardXP, setRewardXP] = useState(activity?.rewardXP ?? 100);
  const [rewardCoins, setRewardCoins] = useState(activity?.rewardCoins ?? 20);
  const [duration, setDuration] = useState(activity?.durationMinutes ?? 5);
  const [timerEnabled, setTimerEnabled] = useState(activity?.timerEnabled ?? true);
  const [scoreEnabled, setScoreEnabled] = useState(activity?.scoreEnabled ?? true);
  const [starsEnabled, setStarsEnabled] = useState(activity?.starsEnabled ?? true);
  const [soundEnabled, setSoundEnabled] = useState(activity?.soundEnabled ?? true);
  const [animationEnabled, setAnimationEnabled] = useState(activity?.animationEnabled ?? true);
  const [status, setStatus] = useState<'Draft'|'Published'|'Archived'>(activity ? (activity.status || 'Published') : 'Draft');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(activity?.questionIds || []);
  const [steps, setSteps] = useState<ActivityStep[]>(activity?.steps || []);
  const [preview, setPreview] = useState<Activity | null>(null);
  const [questionSearch, setQuestionSearch] = useState('');

  const gradeQuestions = useMemo(() => questions.filter(q => {
    const gradeMatches = grades.some(g => g === q.grade || g === (q as any).gradeId);
    const subjectMatches = q.subject === subject || (q as any).subjectId === subject;
    const text = `${q.prompt} ${q.id}`.toLowerCase();
    return gradeMatches && subjectMatches && q.status !== 'Archived' && (!questionSearch.trim() || text.includes(questionSearch.toLowerCase()));
  }).slice(0, 80), [questions, grades, subject, questionSearch]);

  if (!isOpen) return null;

  const toggleGrade = (g: string) => setGrades(prev => prev.includes(g) ? (prev.length === 1 ? prev : prev.filter(x => x !== g)) : [...prev, g]);

  const linkQuestion = (id: string) => {
    setSelectedQuestionIds(prev => prev.includes(id) ? prev : [...prev, id]);
    if (format === 'question_run') {
      setSteps(prev => prev.some(s => s.type === 'question' && s.questionId === id) ? prev : [...prev, { id: newId('STEP'), type: 'question', questionId: id }]);
      return;
    }
    setSteps(prev => prev.some(s => s.type === 'game_task' && s.gameTask?.questionId === id) ? prev : [...prev, makeDefaultTask(format, id)]);
  };

  const unlinkQuestion = (id: string) => {
    setSelectedQuestionIds(prev => prev.filter(x => x !== id));
    setSteps(prev => prev.filter(s => !(s.type === 'question' && s.questionId === id) && !(s.type === 'game_task' && s.gameTask?.questionId === id)));
  };

  const addGameStep = () => setSteps(prev => [...prev, makeDefaultTask(format, undefined)]);
  const moveStep = (index: number, direction: -1 | 1) => setSteps(prev => { const next = [...prev]; const target = index + direction; if (target < 0 || target >= next.length) return next; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const removeStep = (index: number) => setSteps(prev => prev.filter((_, i) => i !== index));

  const build = (nextStatus = status): Activity => {
    const normalizedSteps: ActivityStep[] = steps.length ? steps : (format === 'question_run' ? selectedQuestionIds.map(id => ({ id: `STEP_${id}`, type: 'question' as const, questionId: id })) : selectedQuestionIds.map(id => makeDefaultTask(format, id)));
    const qids = Array.from(new Set([
      ...selectedQuestionIds,
      ...normalizedSteps.filter(s => s.type === 'question' && s.questionId).map(s => String(s.questionId)),
      ...normalizedSteps.filter(s => s.type === 'game_task' && s.gameTask?.questionId).map(s => String(s.gameTask?.questionId))
    ]));
    const primaryGrade = (grades[0] || availableGrades[0] || 'Preschool') as GradeLevel;
    const id = activity?.id || getNextActivityId();
    return {
      id,
      type: ARCHETYPE[format],
      title: title.trim(),
      description: description.trim(),
      subject,
      grade: primaryGrade,
      grades: grades as GradeLevel[],
      format,
      status: nextStatus,
      instructions: instructions.trim(),
      learningTags: tags.split(',').map(x => x.trim()).filter(Boolean),
      questionIds: qids,
      steps: normalizedSteps,
      rewardXP: Number(rewardXP) || 0,
      rewardCoins: Number(rewardCoins) || 0,
      durationMinutes: Number(duration) || 5,
      timerEnabled, scoreEnabled, starsEnabled, soundEnabled, animationEnabled,
      unlocked: nextStatus === 'Published',
      recurrence: activity?.recurrence || 'permanent',
      difficulty,
      createdAt: activity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const save = (publish: boolean) => {
    const built = build(publish ? 'Published' : status);
    editing ? onEditActivity?.(built) : onAddActivity(built);
    onClose();
  };

  return <>
    <div className="fixed inset-0 z-[150] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-6xl max-h-[94vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 bg-stone-950 text-white flex items-center justify-between">
          <div><div className="text-[10px] uppercase tracking-wider font-bold text-amber-300">Interactive Activity Builder</div><h2 className="text-xl font-black">{editing ? 'Edit Interactive Activity' : 'Create Interactive Activity'}</h2><p className="text-xs text-stone-300 mt-1">Activities are separate game experiences. Question Bank content is linked, not duplicated.</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-stone-800">
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="font-black block mb-1">Activity ID</label><div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono font-bold">{activity?.id || 'Auto-generated on save'}</div></div>
                <div><label className="font-black block mb-1">Activity Name *</label><input value={title} onChange={e=>setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-300 outline-none focus:border-stone-900"/></div>
              </div>
              <div><label className="font-black block mb-1">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-stone-300"/></div>
              <div><label className="font-black block mb-2">Applicable Grade(s) *</label><div className="flex flex-wrap gap-2">{availableGrades.map(g=><button type="button" key={g} onClick={()=>toggleGrade(g)} className={`px-3 py-2 rounded-xl border font-bold ${grades.includes(g)?'bg-stone-900 text-white border-stone-900':'bg-white border-stone-200 text-stone-700'}`}>{g}</button>)}</div></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="font-black block mb-1">Subject</label><select value={subject} onChange={e=>setSubject(e.target.value as Subject)} className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white">{availableSubjects.map(s=><option key={s}>{s}</option>)}</select></div><div><label className="font-black block mb-1">Difficulty</label><select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)} className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white"><option>Easy</option><option>Medium</option><option>Hard</option></select></div></div>
              <div><div className="flex items-center justify-between gap-2 mb-2"><label className="font-black block">Game Format</label>{steps.length>0&&<span className="text-[10px] font-bold text-stone-400">Changing format can rebuild the current steps</span>}</div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{FORMATS.map(f=><button type="button" key={f.id} onClick={()=>{if(f.id===format)return; if(steps.length>0 && !window.confirm(`Change format to ${f.label}? The current play sequence will be rebuilt using the linked questions.`)) return; setFormat(f.id); setSteps(selectedQuestionIds.map(id=>f.id==='question_run'?({id:newId('STEP'),type:'question' as const,questionId:id}):makeDefaultTask(f.id,id)));}} className={`p-3 rounded-2xl border-2 text-left transition-all ${format===f.id?'border-amber-500 bg-amber-50 shadow-sm':'border-stone-200 bg-white hover:bg-stone-50'}`}><div className="text-xl">{f.emoji}</div><div className="font-black mt-1">{f.label}</div><div className="text-[10px] text-stone-500 mt-0.5">{f.desc}</div></button>)}</div></div>
            </div>
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3"><h3 className="font-black text-sm">Game Settings</h3>{[['Timer',timerEnabled,setTimerEnabled],['Score',scoreEnabled,setScoreEnabled],['Stars / Rewards',starsEnabled,setStarsEnabled],['Sound',soundEnabled,setSoundEnabled],['Animation',animationEnabled,setAnimationEnabled]].map(([label,val,setter]: any)=><label key={label} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-stone-200 font-bold"><span>{label}</span><input type="checkbox" checked={val} onChange={e=>setter(e.target.checked)}/></label>)}<div className="grid grid-cols-2 gap-2"><div><label className="font-bold block mb-1">Minutes</label><input type="number" min={1} value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-stone-300"/></div><div><label className="font-bold block mb-1">XP</label><input type="number" min={0} value={rewardXP} onChange={e=>setRewardXP(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-stone-300"/></div></div><div><label className="font-bold block mb-1">Coins</label><input type="number" min={0} value={rewardCoins} onChange={e=>setRewardCoins(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-stone-300"/></div><div><label className="font-bold block mb-1">Status</label><select value={status} onChange={e=>setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"><option>Draft</option><option>Published</option><option>Archived</option></select></div></div>
          </section>

          <section className="border border-stone-200 rounded-2xl overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between"><div><h3 className="font-black text-sm">Activity Content & Game Steps</h3><p className="text-[10px] text-stone-500">For game formats, selecting a Question Bank question creates a game challenge linked to that question. It does not turn the question into the activity.</p></div><button type="button" onClick={addGameStep} className="px-3 py-2 rounded-xl bg-stone-900 text-white font-bold inline-flex items-center gap-1"><Gamepad2 className="w-3.5 h-3.5"/> Add Standalone Game</button></div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2"><input value={questionSearch} onChange={e=>setQuestionSearch(e.target.value)} placeholder="Search Question Bank by ID or prompt..." className="flex-1 px-3 py-2 rounded-xl border border-stone-300"/><span className="text-[10px] font-bold text-stone-500">{selectedQuestionIds.length} linked</span></div>
              <div className="max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">{gradeQuestions.map(q=>{
                const linked=selectedQuestionIds.includes(q.id); return <div key={q.id} className={`p-3 rounded-xl border ${linked?'border-stone-900 bg-stone-50':'border-stone-200 bg-white'}`}><div className="flex items-start gap-2"><div className="flex-1 min-w-0"><div className="font-black truncate">{q.prompt}</div><div className="text-[10px] text-stone-500">{q.id} · {q.grade} · {q.difficulty}</div></div><button type="button" onClick={()=>linked?unlinkQuestion(q.id):linkQuestion(q.id)} className={`px-2.5 py-1.5 rounded-lg font-black ${linked?'bg-stone-900 text-white':'border border-stone-200 bg-white'}`}>{linked?'Linked':'Link'}</button></div></div>;
              })}{gradeQuestions.length===0 && <div className="col-span-full text-center text-stone-500 p-6">No questions for the selected grade(s) and subject.</div>}</div>
            </div>
            <div className="border-t border-stone-200 p-4"><h4 className="font-black mb-2">Play Sequence ({steps.length})</h4>{steps.length===0?<div className="p-5 rounded-xl border border-dashed border-stone-300 text-center text-stone-500">Link a Question Bank item or add a standalone Game Task.</div>:<div className="space-y-2">{steps.map((step,i)=>{const q=step.questionId?questions.find(x=>x.id===step.questionId):step.gameTask?.questionId?questions.find(x=>x.id===step.gameTask?.questionId):undefined; return <div key={step.id} className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-white"><GripVertical className="w-4 h-4 text-stone-400"/><span className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center font-black">{i+1}</span><div className="flex-1 min-w-0"><div className="font-black truncate">{step.type==='question' ? q?.prompt || step.questionId : step.gameTask?.title || 'Game Task'}</div><div className="text-[10px] text-stone-500">{step.type==='question' ? `${q?.id || ''} · Question Bank` : `${step.gameTask?.mechanic || 'game'} · ${q ? `linked to ${q.id}` : 'Standalone Game'}`}</div></div><button type="button" onClick={()=>moveStep(i,-1)} className="p-1.5 rounded-lg border border-stone-200"><ChevronUp className="w-3.5 h-3.5"/></button><button type="button" onClick={()=>moveStep(i,1)} className="p-1.5 rounded-lg border border-stone-200"><ChevronDown className="w-3.5 h-3.5"/></button><button type="button" onClick={()=>removeStep(i)} className="p-1.5 rounded-lg border border-rose-200 text-rose-700"><Trash2 className="w-3.5 h-3.5"/></button></div>})}</div>}</div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="font-black block mb-1">Student Instructions</label><textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-stone-300"/></div><div><label className="font-black block mb-1">Learning Tags <span className="font-normal text-stone-400">(optional)</span></label><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="counting, patterns, phonics" className="w-full px-3 py-2.5 rounded-xl border border-stone-300"/><p className="text-[10px] text-stone-500 mt-1">Tags help discovery; they do not create another Category/Skill master.</p></div></section>
        </div>
        <div className="px-5 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2"><div className="text-[10px] text-stone-500"><strong>ID:</strong> {activity?.id || 'Auto-generated'} · <strong>Grades:</strong> {grades.join(', ')} · <strong>Linked Questions:</strong> {selectedQuestionIds.length}</div><div className="flex gap-2"><button type="button" onClick={()=>setPreview(build())} className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white font-bold inline-flex items-center gap-1.5"><Eye className="w-4 h-4"/> Preview Game</button><button type="button" onClick={()=>save(false)} disabled={!title.trim() || grades.length===0} className="px-4 py-2.5 rounded-xl bg-stone-700 text-white font-bold disabled:opacity-40">Save Draft</button><button type="button" onClick={()=>save(true)} disabled={!title.trim() || steps.length===0} className="px-4 py-2.5 rounded-xl bg-stone-950 text-white font-black disabled:opacity-40 inline-flex items-center gap-1.5"><Check className="w-4 h-4"/> Publish</button></div></div>
      </div>
    </div>
    <InteractiveActivityPreviewModal activity={preview} questions={questions} onClose={()=>setPreview(null)} />
  </>;
}
