import React, { useState, useEffect } from 'react';
import { Question, QuestionType, VisualQuestionConfig, VisualQuestionTemplate, VisualAnimation } from '../../../types';
import { X, Check, Eye, Sparkles, Trash2, HelpCircle } from 'lucide-react';
import { fixMojibake, parseVisualObjectsString } from '../../../utils/visualUtils';
import QuestionPreviewModal from './QuestionPreviewModal';
import { sounds } from '../../../utils/audio';

interface Props {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => void;
  availableGrades?: string[];
  availableSubjects?: string[];
}

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice (Single Answer)' },
  { value: 'open_box', label: 'Fill in the Blank / Open Box' },
  { value: 'fill_blank', label: 'Fill in Blank' },
  { value: 'true_false', label: 'True / False' },
  { value: 'select_objects', label: 'Select Objects (Tap to Count)' },
  { value: 'drag_and_drop', label: 'Drag & Drop' },
  { value: 'match_making', label: 'Match Making' },
  { value: 'ordering', label: 'Ordering / Sequencing' },
  { value: 'sorting', label: 'Sorting into Buckets' },
  { value: 'clock', label: 'Clock / Time' },
  { value: 'data_graph', label: 'Data / Graph' },
  { value: 'word_problem', label: 'Word Problem' },
  { value: 'interactive', label: 'Interactive Activity' }
];

const CLIPART = ['🍎', '🍌', '🍓', '🍊', '⭐', '🐶', '🐱', '🦁', '🔺', '🔵', '🟩', '🎈', '🚗', '🍪'];

export default function QuestionEditModal({ question, isOpen, onClose, onSave }: Props) {
  if (!isOpen || !question) return null;

  const [prompt, setPrompt] = useState(question.prompt || '');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(question.difficulty || 'Easy');
  const [type, setType] = useState<QuestionType>(question.type || 'multiple_choice');
  const [options, setOptions] = useState<string[]>(
    question.options && question.options.length ? [...question.options] : ['', '', '', '']
  );
  const [correctIndex, setCorrectIndex] = useState<number>(question.correctIndex ?? 0);
  const [openAnswer, setOpenAnswer] = useState<string>(question.openBoxAnswer || '');
  const [matchPairs, setMatchPairs] = useState<{ left: string; right: string }[]>(
    question.matchPairs && question.matchPairs.length
      ? [...question.matchPairs]
      : [
          { left: '🐱 Cat', right: 'Meow' },
          { left: '🐶 Dog', right: 'Woof' },
          { left: '🐮 Cow', right: 'Moo' }
        ]
  );
  const [dragItems, setDragItems] = useState<{ item: string; target: string }[]>(
    question.dragItems && question.dragItems.length
      ? [...question.dragItems]
      : [
          { item: '🍎 Apple', target: '🧺 Fruit Basket' },
          { item: '🚗 Toy Car', target: '🧸 Toy Box' },
          { item: '🍌 Banana', target: '🧺 Fruit Basket' }
        ]
  );
  const [orderSequence, setOrderSequence] = useState<string[]>(
    question.orderSequence && question.orderSequence.length
      ? [...question.orderSequence]
      : ['Step 1', 'Step 2', 'Step 3', 'Step 4']
  );
  const [sortBuckets, setSortBuckets] = useState<{ bucketName: string; items: string[] }[]>(
    question.sortBuckets && question.sortBuckets.length
      ? [...question.sortBuckets]
      : [
          { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
          { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
        ]
  );
  const [selectObjectsGoal, setSelectObjectsGoal] = useState<number>(
    Number(question.openBoxAnswer || question.options?.[0]) || 4
  );
  const [explanation, setExplanation] = useState<string>(question.explanation || '');
  const [hint, setHint] = useState<string>(question.hint || '');
  const [points, setPoints] = useState<number>(question.points || 20);
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Archived'>(
    (question.status === 'Published' || question.status === 'Archived' || question.status === 'Draft')
      ? question.status
      : 'Draft'
  );

  // Unified Visual & Clipart Layer
  const hasVisual = Boolean(question.visualConfig?.enabled || question.visualClipart);
  const [visualEnabled, setVisualEnabled] = useState<boolean>(hasVisual);
  const [visualClipart, setVisualClipart] = useState<string>(question.visualClipart || '');
  const [visualTemplate, setVisualTemplate] = useState<VisualQuestionTemplate>(
    question.visualConfig?.template || 'picture_counting'
  );
  const [visualAnimation, setVisualAnimation] = useState<VisualAnimation>(
    question.visualConfig?.animation || 'bounce'
  );
  const [visualInteraction, setVisualInteraction] = useState<VisualQuestionConfig['interaction']>(
    question.visualConfig?.interaction || 'tap'
  );
  const [visualInstructions, setVisualInstructions] = useState<string>(
    question.visualConfig?.visualInstructions || ''
  );
  const [visualObjects, setVisualObjects] = useState<string>(
    question.visualConfig?.objects?.map(o => o.emoji || o.label).join('|') || ''
  );
  const [visualBackground, setVisualBackground] = useState<NonNullable<VisualQuestionConfig['background']>>(
    question.visualConfig?.background || 'playful'
  );
  const [visualAutoPlay, setVisualAutoPlay] = useState<boolean>(
    question.visualConfig?.autoPlay ?? true
  );

  const [previewOpen, setPreviewOpen] = useState(false);

  // Sync state whenever opened question changes
  useEffect(() => {
    if (!question) return;
    setPrompt(question.prompt || '');
    setDifficulty(question.difficulty || 'Easy');
    setType(question.type || 'multiple_choice');
    setOptions(question.options && question.options.length ? [...question.options] : ['', '', '', '']);
    setCorrectIndex(question.correctIndex ?? 0);
    setOpenAnswer(question.openBoxAnswer || '');
    setExplanation(question.explanation || '');
    setHint(question.hint || '');
    setPoints(question.points || 20);
    setStatus(
      (question.status === 'Published' || question.status === 'Archived' || question.status === 'Draft')
        ? question.status
        : 'Draft'
    );

    const vEnabled = Boolean(question.visualConfig?.enabled || question.visualClipart);
    setVisualEnabled(vEnabled);
    setVisualClipart(question.visualClipart || '');
    setVisualTemplate(question.visualConfig?.template || 'picture_counting');
    setVisualAnimation(question.visualConfig?.animation || 'bounce');
    setVisualInteraction(question.visualConfig?.interaction || 'tap');
    setVisualInstructions(question.visualConfig?.visualInstructions || '');
    setVisualObjects(question.visualConfig?.objects?.map(o => o.emoji || o.label).join('|') || '');
    setVisualBackground(question.visualConfig?.background || 'playful');
    setVisualAutoPlay(question.visualConfig?.autoPlay ?? true);

    if (question.type === 'true_false') {
      const isFalse = question.correctIndex === 1 || (question.options && question.options[question.correctIndex]?.toLowerCase() === 'false');
      setCorrectIndex(isFalse ? 1 : 0);
      setOptions(['True', 'False']);
    } else if (question.type === 'select_objects') {
      setSelectObjectsGoal(Number(question.openBoxAnswer || question.options?.[0]) || 4);
    }

    if (question.matchPairs && question.matchPairs.length) {
      setMatchPairs([...question.matchPairs]);
    } else if (question.type === 'match_making') {
      if (question.options && question.options.some(o => o.includes('->'))) {
        const parsed = question.options.filter(o => o.includes('->')).map(o => {
          const parts = o.split('->').map(s => s.trim());
          return { left: parts[0] || '', right: parts[1] || '' };
        });
        setMatchPairs(parsed.length ? parsed : [
          { left: '🐱 Cat', right: 'Meow' },
          { left: '🐶 Dog', right: 'Woof' },
          { left: '🐮 Cow', right: 'Moo' }
        ]);
      } else {
        setMatchPairs([
          { left: '🐱 Cat', right: 'Meow' },
          { left: '🐶 Dog', right: 'Woof' },
          { left: '🐮 Cow', right: 'Moo' }
        ]);
      }
    }

    if (question.dragItems && question.dragItems.length) {
      setDragItems([...question.dragItems]);
    } else if (question.type === 'drag_and_drop') {
      if (question.options && question.options.some(o => o.includes('->'))) {
        const parsed = question.options.filter(o => o.includes('->')).map(o => {
          const parts = o.split('->').map(s => s.trim());
          return { item: parts[0] || '', target: parts[1] || '' };
        });
        setDragItems(parsed.length ? parsed : [
          { item: '🍎 Apple', target: '🧺 Fruit Basket' },
          { item: '🚗 Toy Car', target: '🧸 Toy Box' },
          { item: '🍌 Banana', target: '🧺 Fruit Basket' }
        ]);
      } else {
        setDragItems([
          { item: '🍎 Apple', target: '🧺 Fruit Basket' },
          { item: '🚗 Toy Car', target: '🧸 Toy Box' },
          { item: '🍌 Banana', target: '🧺 Fruit Basket' }
        ]);
      }
    }

    if (question.orderSequence && question.orderSequence.length) {
      setOrderSequence([...question.orderSequence]);
    } else if (question.type === 'ordering') {
      setOrderSequence(question.options && question.options.length ? [...question.options] : ['1', '2', '3', '4']);
    }

    if (question.sortBuckets && question.sortBuckets.length) {
      setSortBuckets([...question.sortBuckets]);
    } else if (question.type === 'sorting') {
      setSortBuckets([
        { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
        { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
      ]);
    }
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    let visualConfig: VisualQuestionConfig | undefined = undefined;
    if (visualEnabled) {
      const parsedObjs = visualObjects.trim()
        ? parseVisualObjectsString(visualObjects)
        : (visualClipart ? parseVisualObjectsString(visualClipart) : undefined);

      visualConfig = {
        enabled: true,
        template: visualTemplate,
        animation: visualAnimation,
        interaction: visualInteraction,
        visualInstructions: visualInstructions.trim() || undefined,
        background: visualBackground,
        autoPlay: visualAutoPlay,
        objects: parsedObjs && parsedObjs.length > 0 ? parsedObjs : undefined
      };
    }

    let finalOptions = options.map(o => o.trim()).filter(Boolean);
    if (finalOptions.length === 0) finalOptions = ['Option 1', 'Option 2'];
    let finalCorrectIndex = correctIndex;
    let finalOpenAnswer: string | undefined = undefined;

    if (type === 'open_box' || type === 'fill_blank') {
      finalOptions = [openAnswer.trim()];
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
    }

    const updated: Question = {
      ...question,
      prompt: prompt.trim(),
      difficulty,
      type,
      options: finalOptions,
      correctIndex: finalCorrectIndex,
      openBoxAnswer: finalOpenAnswer,
      matchPairs: type === 'match_making' ? matchPairs.filter(p => p.left.trim() && p.right.trim()) : undefined,
      dragItems: type === 'drag_and_drop' ? dragItems.filter(d => d.item.trim() && d.target.trim()) : undefined,
      orderSequence: type === 'ordering' ? orderSequence.filter(s => s.trim()) : undefined,
      sortBuckets: type === 'sorting' ? sortBuckets.filter(b => b.bucketName.trim()) : undefined,
      explanation: explanation.trim(),
      hint: hint.trim() || undefined,
      points: Number(points) || 20,
      status,
      visualClipart: visualEnabled && visualClipart.trim() ? visualClipart.trim() : undefined,
      visualConfig
    };

    onSave(updated);
    sounds.success();
    onClose();
  };

  const currentPreviewDraft: Question = {
    ...question,
    prompt: prompt.trim() || question.prompt,
    difficulty,
    type,
    options: type === 'match_making' ? matchPairs.map(p => `${p.left} -> ${p.right}`) : options,
    correctIndex,
    openBoxAnswer: (type === 'open_box' || type === 'fill_blank') ? openAnswer.trim() : undefined,
    matchPairs: type === 'match_making' ? matchPairs : undefined,
    dragItems: type === 'drag_and_drop' ? dragItems : undefined,
    orderSequence: type === 'ordering' ? orderSequence : undefined,
    sortBuckets: type === 'sorting' ? sortBuckets : undefined,
    explanation: explanation.trim(),
    hint: hint.trim(),
    points: Number(points) || 20,
    status,
    visualClipart: visualEnabled && visualClipart.trim() ? visualClipart.trim() : undefined,
    visualConfig: visualEnabled ? {
      enabled: true,
      template: visualTemplate,
      animation: visualAnimation,
      interaction: visualInteraction,
      visualInstructions: visualInstructions.trim() || undefined,
      background: visualBackground,
      autoPlay: visualAutoPlay,
      objects: visualObjects.trim() ? parseVisualObjectsString(visualObjects) : undefined
    } : undefined
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
          {/* Header */}
          <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 font-mono">#{question.id}</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/10 text-stone-300">
                  {question.grade} · {question.subject}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold mt-0.5">Edit Question in Question Bank</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold flex items-center gap-1 transition"
                title="Preview this question as student"
              >
                <Eye className="w-3.5 h-3.5 text-amber-300" /> Preview
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-stone-800">
            {/* Category & Skill Hierarchy Summary */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-stone-600">
              <div className="font-semibold">
                Category: <strong className="text-stone-900">{question.category || 'N/A'}</strong>
                <span className="mx-2 text-stone-400">→</span>
                Skill: <strong className="text-stone-900">{question.skill || 'N/A'}</strong>
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                {question.curriculum || 'Standard Curriculum'}
              </div>
            </div>

            {/* Type & Difficulty & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="font-bold text-stone-700">
                Question Type
                <select
                  value={type}
                  onChange={e => {
                    const nextType = e.target.value as QuestionType;
                    setType(nextType);
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
                  className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white font-semibold outline-none"
                >
                  {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>

              <label className="font-bold text-stone-700">
                Difficulty Level
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white font-semibold outline-none"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </label>

              <label className="font-bold text-stone-700">
                Publish Status
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className={`w-full mt-1 p-2 rounded-xl border font-bold outline-none ${
                    status === 'Published'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : status === 'Archived'
                      ? 'border-stone-300 bg-stone-100 text-stone-500'
                      : 'border-amber-300 bg-amber-50 text-amber-900'
                  }`}
                >
                  <option value="Draft">Draft (Review first)</option>
                  <option value="Published">Published (Active for students)</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
            </div>

            {/* Question Text / Prompt */}
            <label className="block font-bold text-stone-800">
              Question Prompt / Text
              <textarea
                required
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl border border-stone-200 font-semibold text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500/20 outline-none"
                placeholder="Enter student question prompt..."
              />
            </label>

            {/* Answer Configuration by Question Type */}
            {(type === 'open_box' || type === 'fill_blank') ? (
              <label className="block font-bold text-stone-800">
                Correct Expected Answer
                <input
                  required
                  value={openAnswer}
                  onChange={e => setOpenAnswer(e.target.value)}
                  placeholder="e.g. 5 or Blue or 12"
                  className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 font-semibold"
                />
              </label>
            ) : type === 'match_making' ? (
              /* MATCH MAKING PAIRS BUILDER */
              <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Matching Pairs (Left Item ➔ Right Match)
                    </div>
                    <div className="text-[10px] text-purple-700 mt-0.5">
                      Students will drag or tap items on the left to pair them with the matching item on the right.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatchPairs(prev => [...prev, { left: '', right: '' }])}
                    className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    + Add Pair
                  </button>
                </div>

                <div className="space-y-2">
                  {matchPairs.map((pair, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-purple-200 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-purple-800 w-5">
                          #{idx + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                              Left Item (e.g. 🐱 Cat)
                            </label>
                            <input
                              value={pair.left}
                              onChange={e => {
                                const next = [...matchPairs];
                                next[idx].left = e.target.value;
                                setMatchPairs(next);
                              }}
                              placeholder="e.g. 🐱 Cat or 🐒 Monkey"
                              className="w-full p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-purple-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                              Right Match (e.g. Meow)
                            </label>
                            <input
                              value={pair.right}
                              onChange={e => {
                                const next = [...matchPairs];
                                next[idx].right = e.target.value;
                                setMatchPairs(next);
                              }}
                              placeholder="e.g. Meow or 🍌 Banana"
                              className="w-full p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-purple-400"
                            />
                          </div>
                        </div>

                        {matchPairs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setMatchPairs(prev => prev.filter((_, i) => i !== idx))}
                            className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                            title="Delete pair"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 pl-7 flex-wrap">
                        <span className="text-[10px] text-stone-400">Insert left:</span>
                        {['🐱', '🐶', '🐮', '🦁', '🐒', '🐰', '🐸', '🍎', '⭐'].map(em => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => {
                              const next = [...matchPairs];
                              next[idx].left = next[idx].left ? `${next[idx].left} ${em}` : em;
                              setMatchPairs(next);
                            }}
                            className="px-1.5 py-0.2 rounded border border-stone-200 bg-stone-50 hover:bg-purple-50 text-xs"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : type === 'drag_and_drop' ? (
              /* DRAG AND DROP BUILDER */
              <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sky-950 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      Drag & Drop Items (Item ➔ Target Zone)
                    </div>
                    <div className="text-[10px] text-sky-700 mt-0.5">
                      Students will drag items into corresponding targets or containers.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDragItems(prev => [...prev, { item: '', target: '' }])}
                    className="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {dragItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-sky-200 flex items-center gap-2 shadow-2xs">
                      <span className="font-black text-xs text-sky-800 w-5">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                            Draggable Item
                          </label>
                          <input
                            value={item.item}
                            onChange={e => {
                              const next = [...dragItems];
                              next[idx].item = e.target.value;
                              setDragItems(next);
                            }}
                            placeholder="e.g. 🍎 Apple or 🐱 Kitten"
                            className="w-full p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-sky-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                            Target Drop Zone
                          </label>
                          <input
                            value={item.target}
                            onChange={e => {
                              const next = [...dragItems];
                              next[idx].target = e.target.value;
                              setDragItems(next);
                            }}
                            placeholder="e.g. 🧺 Fruit Basket or 🐈 Mama Cat"
                            className="w-full p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-sky-400"
                          />
                        </div>
                      </div>

                      {dragItems.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setDragItems(prev => prev.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : type === 'ordering' ? (
              /* ORDERING SEQUENCE BUILDER */
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Sequence Items (Correct Order from 1 to End)
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      Enter items in their correct sequential order. They will be shuffled for students to arrange.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderSequence(prev => [...prev, `Step ${prev.length + 1}`])}
                    className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2">
                  {orderSequence.map((seq, idx) => (
                    <div key={idx} className="p-2 bg-white rounded-xl border border-amber-200 flex items-center gap-2 shadow-2xs">
                      <span className="font-black text-xs text-amber-800 w-6">
                        {idx + 1}.
                      </span>
                      <input
                        value={seq}
                        onChange={e => {
                          const next = [...orderSequence];
                          next[idx] = e.target.value;
                          setOrderSequence(next);
                        }}
                        placeholder={`Sequence item ${idx + 1}`}
                        className="flex-1 p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none focus:border-amber-400"
                      />
                      {orderSequence.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setOrderSequence(prev => prev.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : type === 'true_false' ? (
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
            ) : type === 'select_objects' ? (
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
            ) : type === 'sorting' ? (
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
              /* MULTIPLE CHOICE / STANDARD OPTIONS BUILDER */
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-stone-900 text-xs">
                    Answer Options (Select the correct radio button)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-stone-500">
                      Radio button indicates correct answer
                    </div>
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

                {options.map((opt, i) => (
                  <div key={i} className="p-2 bg-white rounded-xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="editQuestionCorrectIndex"
                        checked={correctIndex === i}
                        onChange={() => setCorrectIndex(i)}
                        className="cursor-pointer text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-xs text-stone-600 w-5">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        value={opt}
                        onChange={e => {
                          const next = [...options];
                          next[i] = e.target.value;
                          setOptions(next);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                        className="flex-1 p-2 rounded-lg border border-stone-200 text-xs font-semibold outline-none"
                      />
                      {opt && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...options];
                            next[i] = '';
                            setOptions(next);
                          }}
                          className="text-stone-400 hover:text-stone-700 px-1 text-xs"
                          title="Clear option"
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
                      <span className="text-[10px] text-stone-400">Insert:</span>
                      {['🍎', '🍌', '⭐', '🔵', '🐶', '🚗', '🍪', '🎈', '🔺', '🟩'].map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => {
                            const next = [...options];
                            next[i] = next[i] ? `${next[i]} ${em}` : em;
                            setOptions(next);
                          }}
                          className="px-1.5 py-0.5 rounded border border-stone-200 bg-stone-50 hover:bg-amber-50 text-xs"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* UNIFIED VISUAL & ANIMATED LAYER (Single Section with toggle) */}
            <div className={`p-4 rounded-2xl border transition ${
              visualEnabled
                ? 'bg-amber-50/40 border-amber-300'
                : 'bg-stone-50 border-stone-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-black text-stone-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Visual Clipart & Interactive Layer
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {visualEnabled
                      ? 'Interactive visual layer & clipart badges are enabled for this question.'
                      : 'Disabled — this question uses standard text & clean options without clipart.'}
                  </div>
                </div>

                <label className="flex items-center gap-2 font-black text-xs cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
                  <input
                    type="checkbox"
                    checked={visualEnabled}
                    onChange={e => setVisualEnabled(e.target.checked)}
                    className="cursor-pointer rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>{visualEnabled ? 'Visuals Enabled' : 'Enable Visuals'}</span>
                </label>
              </div>

              {/* Expanded ONLY when visualEnabled is true */}
              {visualEnabled && (
                <div className="mt-4 pt-3 border-t border-amber-200/70 space-y-3.5 animate-in fade-in">
                  {/* Clipart / Objects Row */}
                  <div className="p-3 bg-white rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-800 text-xs">
                        Question Header Clipart & Symbols:
                      </span>
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

                    <input
                      value={visualClipart}
                      onChange={e => setVisualClipart(e.target.value)}
                      placeholder="e.g. 🍎 🍎 🍎"
                      className="w-full p-2 border border-stone-200 rounded-lg text-sm bg-white font-semibold"
                    />

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] text-stone-400 py-1">Quick pick:</span>
                      {CLIPART.map(x => (
                        <button
                          key={x}
                          type="button"
                          onClick={() => setVisualClipart(p => p ? `${p} ${x}` : x)}
                          className="w-7 h-7 rounded-lg border border-stone-200 bg-stone-50 hover:bg-amber-100 flex items-center justify-center text-xs"
                        >
                          {x}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template, Animation, Interaction */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label className="text-xs font-semibold">
                      Activity Template
                      <select
                        value={visualTemplate}
                        onChange={e => setVisualTemplate(e.target.value as VisualQuestionTemplate)}
                        className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                      >
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

                    <label className="text-xs font-semibold">
                      Animation
                      <select
                        value={visualAnimation}
                        onChange={e => setVisualAnimation(e.target.value as VisualAnimation)}
                        className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                      >
                        <option value="none">None</option>
                        <option value="bounce">Bounce</option>
                        <option value="pulse">Pulse</option>
                        <option value="wiggle">Wiggle</option>
                        <option value="float">Float</option>
                        <option value="pop">Pop</option>
                        <option value="spin">Spin</option>
                      </select>
                    </label>

                    <label className="text-xs font-semibold">
                      Student Interaction
                      <select
                        value={visualInteraction}
                        onChange={e => setVisualInteraction(e.target.value as any)}
                        className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                      >
                        <option value="tap">Tap</option>
                        <option value="count">Count</option>
                        <option value="drag">Drag</option>
                        <option value="match">Match</option>
                        <option value="sort">Sort</option>
                        <option value="order">Order</option>
                        <option value="none">None</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-semibold">
                    Visual Instructions for Student (Optional)
                    <input
                      value={visualInstructions}
                      onChange={e => setVisualInstructions(e.target.value)}
                      placeholder="e.g. Tap all the apples to count them."
                      className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                    />
                  </label>

                  <label className="block text-xs font-semibold">
                    Visual Objects (pipe separated: 🍎|🍎|🍎)
                    <input
                      value={visualObjects}
                      onChange={e => setVisualObjects(e.target.value)}
                      placeholder="🍎|🍎|🍎"
                      className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold"
                    />
                  </label>

                  {/* Live Mini Preview Box */}
                  <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-center min-h-[70px]">
                    <div className="text-center space-y-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Live Visual Preview
                      </div>
                      <div className="text-2xl">
                        {visualObjects || visualClipart || '🍎 🍎 🍎'}
                      </div>
                      <div className="text-[10px] text-stone-600 font-medium">
                        {visualInstructions || 'Student visual prompt will appear here.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation & Hint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block font-semibold">
                Explanation (Shown after answer)
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  placeholder="Explain why the answer is correct..."
                  className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-xs"
                />
              </label>

              <label className="block font-semibold">
                Hint (Optional)
                <textarea
                  rows={2}
                  value={hint}
                  onChange={e => setHint(e.target.value)}
                  placeholder="Provide a helpful hint for students..."
                  className="w-full mt-1 p-2 rounded-xl border border-stone-200 bg-white text-xs"
                />
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 font-bold text-xs text-stone-700"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Test in Interactive Solver
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" /> Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <QuestionPreviewModal
        question={previewOpen ? currentPreviewDraft : null}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
