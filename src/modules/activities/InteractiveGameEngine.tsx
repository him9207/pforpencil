import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { ActivityGameTask, Question } from '../../types';
import { Check, GripVertical, RotateCcw, Sparkles, Target, Trophy, Volume2 } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Props {
  task: ActivityGameTask;
  question?: Question;
  done: boolean;
  onComplete: (points?: number) => void;
  preview?: boolean;
}

const pointsFor = (task: ActivityGameTask, question?: Question) => task.rewardPoints || question?.points || 20;

const handleSpeechReadAloud = (text: string) => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }
};

export default function InteractiveGameEngine({ task, question, done, onComplete, preview = false }: Props) {
  switch (task.mechanic) {
    case 'balloon_pop': return <BalloonPopGame task={task} question={question} done={done} onComplete={onComplete} />;
    case 'space_blaster': return <SpaceBlasterGame task={task} question={question} done={done} onComplete={onComplete} />;
    case 'feeding_game': return <FeedingGame task={task} question={question} done={done} onComplete={onComplete} />;
    case 'drag_drop':
    case 'sorting': return <SortingGame task={task} done={done} onComplete={onComplete} />;
    case 'matching': return <MatchingGame task={task} done={done} onComplete={onComplete} />;
    case 'memory': return <MemoryGame task={task} done={done} onComplete={onComplete} />;
    case 'ordering': return <OrderingGame task={task} done={done} onComplete={onComplete} />;
    case 'pattern': return <PatternGame task={task} done={done} onComplete={onComplete} />;
    case 'arcade': return <ArcadeGame task={task} done={done} onComplete={onComplete} />;
    case 'quiz_game': return <QuizGame task={task} question={question} done={done} onComplete={onComplete} />;
    case 'question_run': return <QuizGame task={task} question={question} done={done} onComplete={onComplete} />;
    case 'story': return <StoryGame task={task} done={done} onComplete={onComplete} />;
    default: return <BalloonPopGame task={task} question={question} done={done} onComplete={onComplete} />;
  }
}

function Shell({ icon, title, instruction, promptToRead, children }: { icon: string; title: string; instruction: string; promptToRead?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 text-4xl shadow-sm mb-3">
          {icon}
        </div>
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">{title}</h3>
          {promptToRead && (
            <button
              type="button"
              onClick={() => handleSpeechReadAloud(promptToRead)}
              className="p-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer hover:scale-105 active:scale-95"
              title="Listen to question"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base text-stone-500 mt-2">{instruction}</p>
      </div>
      {children}
    </div>
  );
}

function FeedingGame({ task, question, done, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [tappedCount, setTappedCount] = useState(0);

  // Character detection
  const charEmoji = task.title?.includes('Bunny') ? '🐰' :
    task.title?.includes('Bear') ? '🐻' :
    task.title?.includes('Puppy') ? '🐶' :
    task.title?.includes('Penguin') ? '🐧' : '🐒';

  const eatingEmoji = task.title?.includes('Bunny') ? '🐰🥕' :
    task.title?.includes('Bear') ? '🐻🍯' :
    task.title?.includes('Puppy') ? '🐶🦴' :
    task.title?.includes('Penguin') ? '🐧🐟' : '🐒🍌';

  const happyEmoji = task.title?.includes('Bunny') ? '🐰✨' :
    task.title?.includes('Bear') ? '🐻🎉' :
    task.title?.includes('Puppy') ? '🐶💖' :
    task.title?.includes('Penguin') ? '🐧❄️' : '🐒😋';

  const wrongEmoji = '🙈';

  const foodEmoji = task.items?.[0]?.emoji || (
    task.title?.includes('Bunny') ? '🥕' :
    task.title?.includes('Bear') ? '🍯' :
    task.title?.includes('Puppy') ? '🦴' :
    task.title?.includes('Penguin') ? '🐟' : '🍌'
  );

  if (!question) return <Empty text="Link a Question Bank question to this feeding challenge." />;

  const choose = (i: number) => {
    if (done || feeding) return;
    sounds.click();
    setSelected(i);
    setWrong(false);
  };

  const feed = () => {
    if (selected === null || done || feeding) return;
    if (selected !== question.correctIndex) {
      sounds.playWrong();
      setWrong(true);
      return;
    }
    sounds.playHappyCelebration();
    setFeeding(true);
    window.setTimeout(() => onComplete(pointsFor(task, question)), 700);
  };

  return (
    <Shell
      icon={done ? happyEmoji : feeding ? eatingEmoji : wrong ? wrongEmoji : charEmoji}
      title={task.title || 'Feed the Character!'}
      instruction={task.instruction || 'Pick the correct answer, then tap Feed!'}
      promptToRead={question.prompt}
    >
      <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 sm:p-8 shadow-sm space-y-4">
        {/* Interactive Counting Clipart (if question has visualClipart) */}
        {question.visualClipart && (
          <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Tap to count items:</span>
            </div>
            <div className="flex items-center gap-2 select-none flex-wrap text-2xl">
              {question.visualClipart.split(' ').map((token, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setTappedCount(c => c + 1);
                  }}
                  className="p-1.5 bg-amber-50 rounded-xl hover:scale-110 active:scale-95 transition cursor-pointer border border-amber-200"
                >
                  {token}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 rounded-lg text-amber-950 font-mono">
              Counted: {tappedCount} ✨
            </span>
          </div>
        )}

        {/* Question Prompt */}
        <div className="rounded-2xl bg-white/90 border border-stone-200 p-5 text-center text-xl sm:text-3xl font-black text-stone-900 flex items-center justify-center gap-3">
          <span>{question.prompt}</span>
          <button
            type="button"
            onClick={() => handleSpeechReadAloud(question.prompt)}
            className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition cursor-pointer"
            title="Read aloud"
          >
            <Volume2 className="w-5 h-5 text-amber-600" />
          </button>
        </div>

        {/* Options styled as Feedable Treats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-5">
          {question.options.map((option, i) => (
            <button
              key={i}
              disabled={done || feeding}
              onClick={() => choose(i)}
              className={`group relative min-h-28 sm:min-h-32 rounded-2xl border-2 bg-white p-4 font-black text-lg sm:text-2xl transition-all duration-200 cursor-pointer ${
                selected === i
                  ? wrong
                    ? 'border-rose-400 bg-rose-50 animate-shake'
                    : 'border-amber-500 bg-amber-50 -translate-y-1 shadow-md'
                  : 'border-stone-200 hover:border-amber-400 hover:-translate-y-1 hover:shadow-md'
              }`}
            >
              <span className="block text-4xl mb-2 transition-transform group-hover:scale-110">{foodEmoji}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center mt-6">
          <button
            disabled={done || feeding || selected === null}
            onClick={feed}
            className="px-8 py-3.5 rounded-2xl bg-stone-950 text-white font-black text-base sm:text-lg shadow-lg disabled:opacity-40 hover:-translate-y-0.5 transition cursor-pointer flex items-center gap-2"
          >
            <span>{feeding ? 'Eating yum yum… ' : wrong ? 'Try Again' : `Feed ${foodEmoji}`}</span>
          </button>
          {wrong && <div className="mt-3 text-sm font-black text-rose-700">Not quite! Pick another one and feed again.</div>}
          {done && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black">
              <Check className="w-4 h-4" /> Correct! Yummy! ⭐
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

function SortingGame({ task, done, onComplete }: Omit<Props, 'question'>) {
  const items = task.items || [];
  const targets = task.targets || [];
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const remaining = items.filter(i => !placed[i.id]);

  const place = (itemId: string, targetId: string) => {
    if (done) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    if (item.target === targetId) {
      sounds.click();
      setPlaced(v => ({ ...v, [itemId]: targetId }));
      setWrong(null);
      if (Object.keys(placed).length + 1 >= items.length) {
        sounds.playHappyCelebration();
        window.setTimeout(() => onComplete(pointsFor(task)), 450);
      }
    } else {
      sounds.playWrong();
      setWrong(itemId);
      window.setTimeout(() => setWrong(null), 700);
    }
    setDragging(null);
  };

  return (
    <Shell icon="🧺" title={task.title || 'Sort the Objects'} instruction={task.instruction || 'Drag each object into the correct basket. Or tap an item and then tap a basket.'}>
      <div className="rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-5 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="font-black text-stone-700">Objects left: {remaining.length}</div>
          <div className="text-sm font-black text-stone-400">{Object.keys(placed).length}/{items.length} sorted</div>
        </div>
        <div className="min-h-32 rounded-3xl border-2 border-dashed border-stone-300 bg-white p-4 flex flex-wrap justify-center gap-3">
          {remaining.map(item => (
            <button
              key={item.id}
              draggable={!done}
              onDragStart={() => setDragging(item.id)}
              onDragEnd={() => setDragging(null)}
              onClick={() => {
                sounds.click();
                setDragging(v => v === item.id ? null : item.id);
              }}
              className={`relative min-w-24 px-5 py-4 rounded-2xl border-2 bg-white font-black text-lg transition-all cursor-pointer ${
                dragging === item.id
                  ? 'border-amber-500 bg-amber-50 -translate-y-2 shadow-lg scale-105'
                  : wrong === item.id
                  ? 'border-rose-400 bg-rose-50 animate-shake'
                  : 'border-stone-200 hover:border-amber-400 hover:-translate-y-1'
              }`}
            >
              <GripVertical className="absolute top-1 left-1 w-3 h-3 text-stone-300" />
              <span className="text-4xl block">{item.emoji || '🔹'}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {!remaining.length && <div className="w-full text-center py-6 font-black text-emerald-700 text-xl">🎉 Everything is sorted!</div>}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {targets.map(target => {
            const count = Object.values(placed).filter(v => v === target.id).length;
            return (
              <button
                key={target.id}
                onDragOver={e => e.preventDefault()}
                onDrop={() => dragging && place(dragging, target.id)}
                onClick={() => dragging && place(dragging, target.id)}
                className={`min-h-36 rounded-3xl border-2 border-dashed p-4 font-black transition-all cursor-pointer ${
                  dragging ? 'border-amber-400 bg-amber-50 hover:scale-[1.02]' : 'border-stone-300 bg-stone-50 hover:border-stone-400'
                }`}
              >
                <div className="text-5xl">{target.emoji || '🧺'}</div>
                <div className="text-lg mt-2">{target.label}</div>
                <div className="text-xs text-stone-400 mt-1">{count} object{count === 1 ? '' : 's'}</div>
              </button>
            );
          })}
        </div>
        {dragging && <div className="mt-4 text-center text-sm font-black text-amber-700 animate-pulse">Now tap a target basket above ↑</div>}
      </div>
    </Shell>
  );
}

function MatchingGame({ task, done, onComplete }: Omit<Props, 'question'>) {
  const items = task.items || [];
  const targets = task.targets || [];
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);

  const match = (targetId: string) => {
    if (!selected || done) return;
    const item = items.find(i => i.id === selected);
    if (item?.target === targetId) {
      sounds.click();
      const next = [...matched, selected];
      setMatched(next);
      setSelected(null);
      if (next.length >= items.length) {
        sounds.playHappyCelebration();
        window.setTimeout(() => onComplete(pointsFor(task)), 400);
      }
    } else {
      sounds.playWrong();
      setWrong(true);
      window.setTimeout(() => setWrong(false), 600);
    }
  };

  return (
    <Shell icon="🧩" title={task.title || 'Match the Pairs'} instruction={task.instruction || 'Choose an item on the left, then choose its matching partner on the right.'}>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-3xl bg-stone-50 border border-stone-200 p-4">
          <h4 className="font-black mb-3">Items</h4>
          <div className="space-y-3">
            {items.map(item => (
              <button
                key={item.id}
                disabled={done || matched.includes(item.id)}
                onClick={() => {
                  sounds.click();
                  setSelected(item.id);
                  setWrong(false);
                }}
                className={`w-full p-4 rounded-2xl border-2 bg-white flex items-center gap-3 font-black cursor-pointer transition ${
                  matched.includes(item.id)
                    ? 'opacity-40'
                    : selected === item.id
                    ? 'border-amber-500 bg-amber-50 shadow-md'
                    : 'border-stone-200 hover:border-amber-400'
                }`}
              >
                <span className="text-4xl">{item.emoji}</span>
                <span>{item.label}</span>
                {matched.includes(item.id) && <Check className="ml-auto text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4">
          <h4 className="font-black mb-3">Matches</h4>
          <div className="space-y-3">
            {targets.map(t => (
              <button
                key={t.id}
                disabled={done}
                onClick={() => match(t.id)}
                className={`w-full p-5 rounded-2xl border-2 bg-white font-black text-lg hover:-translate-y-0.5 hover:shadow-md transition cursor-pointer ${
                  wrong ? 'border-rose-300' : 'border-stone-200'
                }`}
              >
                <span className="text-4xl block">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {selected && <div className="text-center mt-4 text-sm font-black text-amber-700 animate-pulse">Now tap the matching target on the right.</div>}
      {done && <Success />}
    </Shell>
  );
}

function MemoryGame({ task, done, onComplete }: Omit<Props, 'question'>) {
  const source = task.items || [];
  const cards = useMemo(() => [...source.slice(0, 6), ...source.slice(0, 6)].map((x, i) => ({ ...x, cardId: `${x.id}-${i}` })), [task.id]);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);

  const flip = (id: string) => {
    if (done || locked || open.includes(id) || matched.includes(id)) return;
    sounds.click();
    const next = [...open, id];
    setOpen(next);
    if (next.length === 2) {
      setLocked(true);
      const a = cards.find(c => c.cardId === next[0])!;
      const b = cards.find(c => c.cardId === next[1])!;
      window.setTimeout(() => {
        if (a.id === b.id) {
          sounds.playCorrect();
          const m = [...matched, a.id];
          setMatched(m);
          if (m.length >= Math.min(6, source.length)) {
            sounds.playHappyCelebration();
            window.setTimeout(() => onComplete(pointsFor(task)), 350);
          }
        } else {
          sounds.playWrong();
        }
        setOpen([]);
        setLocked(false);
      }, 650);
    }
  };

  return (
    <Shell icon="🃏" title={task.title || 'Memory Match'} instruction={task.instruction || 'Turn over two cards and find the matching pair.'}>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {cards.map(card => {
          const shown = open.includes(card.cardId) || matched.includes(card.id);
          return (
            <button
              key={card.cardId}
              disabled={done || locked || shown}
              onClick={() => flip(card.cardId)}
              className={`aspect-square rounded-2xl border-2 text-3xl sm:text-4xl font-black transition-all duration-300 cursor-pointer ${
                shown ? 'bg-white border-amber-400 rotate-0 shadow-md' : 'bg-stone-900 text-white border-stone-900 hover:-translate-y-1'
              }`}
            >
              {shown ? (card.emoji || card.label) : '?'}
            </button>
          );
        })}
      </div>
      {done && <Success />}
    </Shell>
  );
}

function OrderingGame({ task, done, onComplete }: Omit<Props, 'question'>) {
  const items = task.items || [];
  const correct = task.correctOrder?.length ? task.correctOrder : items.map(x => x.id).sort((a, b) => Number(a) - Number(b));
  const [picked, setPicked] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);

  const choose = (id: string) => {
    if (done || picked.includes(id)) return;
    sounds.click();
    const next = [...picked, id];
    if (correct[next.length - 1] !== id) {
      sounds.playWrong();
      setWrong(true);
      window.setTimeout(() => setWrong(false), 600);
      setPicked([]);
      return;
    }
    setPicked(next);
    if (next.length === correct.length) {
      sounds.playHappyCelebration();
      window.setTimeout(() => onComplete(pointsFor(task)), 400);
    }
  };

  return (
    <Shell icon="🔢" title={task.title || 'Put Them in Order'} instruction={task.instruction || 'Tap the items in the correct order.'}>
      <div className="flex flex-wrap justify-center gap-3">
        {items.map(item => (
          <button
            key={item.id}
            disabled={done || picked.includes(item.id)}
            onClick={() => choose(item.id)}
            className={`min-w-24 p-5 rounded-2xl border-2 font-black text-2xl transition cursor-pointer ${
              picked.includes(item.id)
                ? 'bg-stone-900 text-white border-stone-900'
                : wrong
                ? 'border-rose-300'
                : 'bg-white border-stone-200 hover:border-amber-400 hover:-translate-y-1'
            }`}
          >
            <span className="block text-4xl">{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-stone-50 border border-stone-200 p-4 text-center font-black">
        {picked.length ? `Your sequence: ${picked.map(id => items.find(i => i.id === id)?.label).join(' → ')}` : 'Start with the first item.'}
      </div>
      {wrong && <div className="mt-3 text-center text-sm font-black text-rose-700">Oops! Start the sequence again.</div>}
    </Shell>
  );
}

function PatternGame({ task, done, onComplete }: Omit<Props, 'question'>) {
  const items = task.items || [];
  const answer = task.correctOrder?.[0] || items[items.length - 1]?.id;
  const choices = items.length ? items : [{ id: 'a', label: '⭐', emoji: '⭐' }, { id: 'b', label: '🍎', emoji: '🍎' }, { id: 'c', label: '🔵', emoji: '🔵' }];
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Shell icon="🎨" title={task.title || 'Complete the Pattern'} instruction={task.instruction || 'Find the missing item in the pattern.'}>
      <div className="rounded-3xl bg-stone-50 border border-stone-200 p-6 text-center">
        <div className="flex justify-center items-center gap-3 text-4xl sm:text-6xl">
          {choices.slice(0, 4).map(x => (
            <span key={x.id}>{x.emoji}</span>
          ))}
          <span className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-amber-400 flex items-center justify-center text-3xl">?</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-7 max-w-xl mx-auto">
          {choices.map(x => (
            <button
              key={x.id}
              disabled={done}
              onClick={() => {
                sounds.click();
                setSelected(x.id);
                if (x.id === answer) {
                  sounds.playHappyCelebration();
                  window.setTimeout(() => onComplete(pointsFor(task)), 300);
                } else {
                  sounds.playWrong();
                }
              }}
              className={`p-4 rounded-2xl border-2 font-black text-xl cursor-pointer ${
                selected === x.id
                  ? x.id === answer
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-rose-400 bg-rose-50'
                  : 'bg-white border-stone-200 hover:border-amber-400'
              }`}
            >
              {x.emoji}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

function ArcadeGame({ task, done, onComplete }: Omit<Props, 'question'>) {
  const count = task.targetCount || task.items?.length || 5;
  const [caught, setCaught] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => setTick(v => v + 1), 900);
    return () => window.clearInterval(id);
  }, [done]);

  const items = (task.items || Array.from({ length: count }, (_, i) => ({ id: `star-${i}`, label: 'Star', emoji: '⭐' }))).slice(0, count);

  const collect = (id: string) => {
    if (done || caught.includes(id)) return;
    sounds.click();
    const next = [...caught, id];
    setCaught(next);
    if (next.length >= items.length) {
      sounds.playHappyCelebration();
      window.setTimeout(() => onComplete(pointsFor(task)), 350);
    }
  };

  return (
    <Shell icon="🚀" title={task.title || 'Star Collector'} instruction={task.instruction || 'Tap and collect every star before time runs out!'}>
      <div className="relative h-[340px] rounded-[2rem] overflow-hidden bg-stone-950 border border-stone-800 shadow-inner">
        {items.map((item, i) => {
          const x = (i * 23 + tick * 7) % 88 + 4;
          const y = (i * 31 + tick * 11) % 78 + 5;
          return (
            <button
              key={item.id}
              disabled={done || caught.includes(item.id)}
              onClick={() => collect(item.id)}
              className="absolute text-4xl sm:text-5xl transition-all duration-700 hover:scale-125 active:scale-90 disabled:opacity-20 cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {item.emoji || '⭐'}
            </button>
          );
        })}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm font-black">
          Collected {caught.length}/{items.length} ⭐
        </div>
      </div>
    </Shell>
  );
}

function QuizGame({ task, question, done, onComplete }: Props) {
  if (!question) return <Empty text="Link a Question Bank question to this quiz challenge." />;
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (i: number) => {
    sounds.click();
    setSelected(i);
    if (i === question.correctIndex) {
      sounds.playHappyCelebration();
      window.setTimeout(() => onComplete(pointsFor(task, question)), 300);
    } else {
      sounds.playWrong();
    }
  };

  return (
    <Shell
      icon="🏆"
      title={task.title || 'Quiz Challenge'}
      instruction={task.instruction || 'Choose the correct answer.'}
      promptToRead={question.prompt}
    >
      <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-6 space-y-4">
        {/* Clipart Visual Stage (if present) */}
        {question.visualClipart && (
          <div className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center justify-center gap-2 text-3xl select-none">
            {question.visualClipart}
          </div>
        )}

        <div className="text-2xl sm:text-3xl font-black text-center text-stone-900 flex items-center justify-center gap-3">
          <span>{question.prompt}</span>
          <button
            type="button"
            onClick={() => handleSpeechReadAloud(question.prompt)}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-600 transition cursor-pointer"
            title="Read aloud"
          >
            <Volume2 className="w-5 h-5 text-amber-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          {question.options.map((o, i) => (
            <button
              key={i}
              disabled={done}
              onClick={() => handleSelect(i)}
              className={`p-5 rounded-2xl border-2 bg-white font-black text-lg transition cursor-pointer ${
                selected === i
                  ? i === question.correctIndex
                    ? 'border-emerald-500 bg-emerald-50 scale-[1.02]'
                    : 'border-rose-400 bg-rose-50 animate-shake'
                  : 'border-stone-200 hover:border-amber-400 hover:scale-[1.01]'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        {done && <Success />}
      </div>
    </Shell>
  );
}

function BalloonPopGame({ task, question, done, onComplete }: Props) {
  const options = question?.options || task.items?.map(i => i.label) || ['A', 'B', 'C', 'D'];
  const correctIdx = question?.correctIndex ?? 0;
  const [poppedIdx, setPoppedIdx] = useState<number | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [tappedCount, setTappedCount] = useState(0);

  const colors = [
    { bg: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/30', border: 'border-rose-400', shine: 'bg-rose-300' },
    { bg: 'from-sky-500 to-blue-600', shadow: 'shadow-sky-500/30', border: 'border-sky-400', shine: 'bg-sky-300' },
    { bg: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/30', border: 'border-emerald-400', shine: 'bg-emerald-300' },
    { bg: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/30', border: 'border-amber-400', shine: 'bg-amber-300' },
    { bg: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/30', border: 'border-purple-400', shine: 'bg-purple-300' },
    { bg: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/30', border: 'border-pink-400', shine: 'bg-pink-300' },
  ];

  const handlePop = (idx: number) => {
    if (done || poppedIdx !== null) return;
    if (idx === correctIdx) {
      sounds.playPop();
      setPoppedIdx(idx);
      setCombo(c => c + 1);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      window.setTimeout(() => {
        sounds.playHappyCelebration();
        onComplete(pointsFor(task, question) * combo);
      }, 500);
    } else {
      sounds.playWrong();
      setWrongIdx(idx);
      setLives(l => Math.max(1, l - 1));
      setCombo(1);
      window.setTimeout(() => setWrongIdx(null), 700);
    }
  };

  return (
    <Shell
      icon="🎈"
      title={task.title || 'Balloon Pop Carnival'}
      instruction={task.instruction || 'Pop the balloon holding the correct answer!'}
      promptToRead={question?.prompt}
    >
      <div className="rounded-[2.5rem] border-2 border-sky-200 bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 p-5 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Floating Clouds Background */}
        <div className="absolute top-2 left-6 text-4xl opacity-30 select-none pointer-events-none animate-pulse">☁️</div>
        <div className="absolute top-8 right-12 text-5xl opacity-30 select-none pointer-events-none">☁️</div>
        <div className="absolute bottom-4 left-1/4 text-3xl opacity-20 select-none pointer-events-none">☁️</div>

        {/* Top Game HUD: Lives & Combo */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-sky-200 shadow-xs">
            <span className="text-xs font-black text-stone-600 uppercase tracking-wider">Lives:</span>
            <span className="text-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={`inline-block transition-transform ${i < lives ? 'scale-100 text-rose-500' : 'scale-75 opacity-30 text-stone-400'}`}>
                  ❤️
                </span>
              ))}
            </span>
          </div>

          {combo > 1 && (
            <div className="animate-bounce flex items-center gap-1 bg-amber-400 text-stone-950 px-3 py-1 rounded-full font-black text-xs shadow-md">
              <span>🔥</span>
              <span>{combo}X STREAK!</span>
            </div>
          )}
        </div>

        {/* Clipart Visual Stage (if present) */}
        {question?.visualClipart && (
          <div className="p-3.5 mb-4 rounded-2xl bg-white/90 border border-sky-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-black text-sky-900">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Tap to count items:</span>
            </div>
            <div className="flex items-center gap-2 select-none flex-wrap text-2xl">
              {question.visualClipart.split(' ').map((token, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setTappedCount(c => c + 1);
                  }}
                  className="p-1.5 bg-sky-50 rounded-xl hover:scale-110 active:scale-95 transition cursor-pointer border border-sky-200"
                >
                  {token}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-sky-100 rounded-lg text-sky-950 font-mono">
              Counted: {tappedCount} ✨
            </span>
          </div>
        )}

        {/* Question Prompt Stage */}
        <div className="rounded-2xl bg-white/95 border-2 border-sky-200 p-5 text-center shadow-sm">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight">
              {question?.prompt || task.instruction}
            </span>
            {question?.prompt && (
              <button
                type="button"
                onClick={() => handleSpeechReadAloud(question.prompt)}
                className="p-2.5 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-800 transition cursor-pointer hover:scale-110"
                title="Read aloud"
              >
                <Volume2 className="w-5 h-5 text-sky-700" />
              </button>
            )}
          </div>
        </div>

        {/* Floating Balloons Arena */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-8 pt-4 pb-2">
          {options.map((opt, i) => {
            const isPopped = poppedIdx === i;
            const isWrong = wrongIdx === i;
            const style = colors[i % colors.length];
            const floatDelay = `${(i * 0.2).toFixed(1)}s`;

            return (
              <div key={i} className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={done || poppedIdx !== null}
                  onClick={() => handlePop(i)}
                  style={{ animationDelay: floatDelay }}
                  className={`relative w-28 h-36 sm:w-36 sm:h-44 rounded-[50%] bg-gradient-to-br ${style.bg} ${style.shadow} ${style.border} text-white font-black p-3 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-xl hover:scale-105 active:scale-95 animate-bounce ${
                    isPopped
                      ? 'scale-150 opacity-0 pointer-events-none duration-500'
                      : isWrong
                      ? 'animate-shake ring-4 ring-rose-500'
                      : ''
                  }`}
                >
                  {/* Glossy Reflection Bubble */}
                  <div className={`absolute top-3 left-4 w-6 h-10 rounded-[50%] ${style.shine} opacity-40 rotate-[-25deg]`} />
                  
                  {/* Option Label */}
                  <span className="text-xl sm:text-2xl font-black text-center text-white drop-shadow-md z-10 px-2 line-clamp-3">
                    {opt}
                  </span>

                  {/* Pop target icon */}
                  <span className="text-xs text-white/80 mt-1 uppercase tracking-widest font-black">
                    Pop 🎯
                  </span>

                  {/* Balloon Knot */}
                  <div className="absolute -bottom-2 w-3 h-3 bg-inherit rotate-45 rounded-xs" />
                </button>

                {/* Balloon String */}
                <div className="w-0.5 h-12 bg-stone-400/70 mt-1" />
              </div>
            );
          })}
        </div>

        {done && <Success />}
      </div>
    </Shell>
  );
}

function SpaceBlasterGame({ task, question, done, onComplete }: Props) {
  const options = question?.options || task.items?.map(i => i.label) || ['A', 'B', 'C', 'D'];
  const correctIdx = question?.correctIndex ?? 0;
  const [blastedIdx, setBlastedIdx] = useState<number | null>(null);
  const [wrongIdx, setWrongIdx] = useState<number | null>(null);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [laserTarget, setLaserTarget] = useState<number | null>(null);

  const asteroidIcons = ['☄️', '💎', '🪐', '⭐', '🚀', '🔮'];

  const handleBlast = (idx: number) => {
    if (done || blastedIdx !== null) return;
    sounds.playLaser();
    setLaserTarget(idx);

    window.setTimeout(() => {
      if (idx === correctIdx) {
        setBlastedIdx(idx);
        setScoreMultiplier(m => m + 1);
        confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
        sounds.playHappyCelebration();
        window.setTimeout(() => {
          onComplete(pointsFor(task, question) * scoreMultiplier);
        }, 500);
      } else {
        sounds.playWrong();
        setWrongIdx(idx);
        setScoreMultiplier(1);
        window.setTimeout(() => {
          setWrongIdx(null);
          setLaserTarget(null);
        }, 600);
      }
    }, 200);
  };

  return (
    <Shell
      icon="🚀"
      title={task.title || 'Space Crystal Blaster'}
      instruction={task.instruction || 'Aim your laser cannon and blast the correct crystal asteroid!'}
      promptToRead={question?.prompt}
    >
      <div className="rounded-[2.5rem] border-2 border-indigo-900 bg-stone-950 p-5 sm:p-8 shadow-2xl relative overflow-hidden text-white">
        {/* Deep Space Background Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-stone-950 to-stone-950 pointer-events-none" />
        
        {/* HUD Header */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-800/80 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>RADAR ACTIVE</span>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-black text-amber-300">
            <span>⚡ POWER: {scoreMultiplier}X</span>
          </div>
        </div>

        {/* Prompt Terminal */}
        <div className="relative z-10 rounded-2xl bg-indigo-950/70 border border-indigo-700/60 p-5 text-center shadow-inner">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {question?.prompt || task.instruction}
            </span>
            {question?.prompt && (
              <button
                type="button"
                onClick={() => handleSpeechReadAloud(question.prompt)}
                className="p-2.5 rounded-full bg-indigo-900 hover:bg-indigo-800 text-cyan-300 transition cursor-pointer"
                title="Read aloud"
              >
                <Volume2 className="w-5 h-5 text-cyan-400" />
              </button>
            )}
          </div>
        </div>

        {/* Floating Asteroid Targets */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {options.map((opt, i) => {
            const isBlasted = blastedIdx === i;
            const isWrong = wrongIdx === i;
            const isTargeted = laserTarget === i;

            return (
              <button
                key={i}
                type="button"
                disabled={done || blastedIdx !== null}
                onClick={() => handleBlast(i)}
                className={`relative p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[140px] text-center ${
                  isBlasted
                    ? 'border-emerald-400 bg-emerald-950/80 scale-125 opacity-0'
                    : isWrong
                    ? 'border-rose-500 bg-rose-950/80 animate-shake ring-4 ring-rose-500'
                    : isTargeted
                    ? 'border-cyan-400 bg-cyan-950/80 scale-105 ring-4 ring-cyan-400'
                    : 'border-indigo-800/80 bg-indigo-950/40 hover:border-cyan-400 hover:bg-indigo-900/60 hover:-translate-y-1 shadow-lg shadow-indigo-950/50'
                }`}
              >
                <span className="text-3xl mb-2">{asteroidIcons[i % asteroidIcons.length]}</span>
                <span className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                  {opt}
                </span>
                <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800">
                  Target {i + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Player Starship Turret at Bottom */}
        <div className="relative z-10 mt-8 flex flex-col items-center">
          <div className="text-5xl sm:text-6xl animate-bounce">
            🚀
          </div>
          <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono mt-1">
            {laserTarget !== null ? '⚡ FIRING LASER CANNONS ⚡' : 'TAP AN ASTEROID TO TARGET & FIRE'}
          </div>
        </div>

        {done && <Success />}
      </div>
    </Shell>
  );
}

function StoryGame({ task, done, onComplete }: Omit<Props, 'question'>) {
  const [page, setPage] = useState(0);
  const pages = task.items?.length
    ? task.items
    : [
        { id: '1', label: 'Welcome to your adventure!', emoji: '🌟' },
        { id: '2', label: 'You found a learning treasure!', emoji: '💎' },
        { id: '3', label: 'Adventure complete!', emoji: '🏆' }
      ];

  return (
    <Shell icon="📖" title={task.title || 'Story Adventure'} instruction={task.instruction || 'Read each scene and continue the adventure.'}>
      <div className="rounded-[2rem] bg-gradient-to-br from-indigo-50 via-white to-amber-50 border border-stone-200 p-8 text-center">
        <div className="text-8xl">{pages[page].emoji}</div>
        <h4 className="text-2xl font-black mt-5">{pages[page].label}</h4>
        <div className="mt-6 flex justify-center gap-2">
          {pages.map((_, i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${i === page ? 'bg-stone-900' : 'bg-stone-300'}`} />
          ))}
        </div>
        <button
          disabled={done}
          onClick={() => {
            sounds.click();
            if (page + 1 < pages.length) setPage(v => v + 1);
            else {
              sounds.playHappyCelebration();
              onComplete(pointsFor(task));
            }
          }}
          className="mt-7 px-8 py-3 rounded-2xl bg-stone-950 text-white font-black cursor-pointer hover:scale-105 transition"
        >
          {page + 1 < pages.length ? 'Continue →' : 'Finish Adventure 🏆'}
        </button>
      </div>
    </Shell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="max-w-xl mx-auto p-10 text-center rounded-3xl border border-dashed border-stone-300 bg-stone-50 text-stone-500 font-bold">
      {text}
    </div>
  );
}

function Success() {
  return (
    <div className="mt-5 flex justify-center">
      <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black">
        <Trophy className="w-5 h-5" /> Challenge complete!
      </div>
    </div>
  );
}
