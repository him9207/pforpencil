import React, { useMemo, useState, useEffect } from 'react';
import { Check, Volume2, RotateCcw } from 'lucide-react';
import { Question } from '../../types';
import InteractiveQuestionCard from './InteractiveQuestionCard';
import { ClipartText } from '../../common/ClipartRenderer';

interface Props {
  question: Question;
  onAnswer?: (correct: boolean) => void;
  interactive?: boolean;
  showExplanation?: boolean;
  compact?: boolean;
}

export default function QuestionRenderer({ 
  question, 
  onAnswer, 
  interactive = true, 
  showExplanation = true, 
  compact = false 
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Interactive states
  const [userDragPlacements, setUserDragPlacements] = useState<Record<string, string>>({});
  const [userMatchPairs, setUserMatchPairs] = useState<Record<string, string>>({});
  const [userOrderedList, setUserOrderedList] = useState<string[]>([]);
  const [userBuckets, setUserBuckets] = useState<Record<string, string[]>>({});
  const [tappedObjectIds, setTappedObjectIds] = useState<string[]>([]);
  const [multiSelected, setMultiSelected] = useState<number[]>([]);

  // Reset when question changes
  useEffect(() => {
    reset();
  }, [question.id]);

  const reset = () => {
    setSelected(null);
    setTextAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
    setUserDragPlacements({});
    setUserMatchPairs({});
    setUserOrderedList(question.orderSequence ? [...question.orderSequence] : question.options ? [...question.options] : []);
    setUserBuckets({});
    setTappedObjectIds([]);
    setMultiSelected([]);
  };

  const normalized = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');

  const check = (idx?: number) => {
    const type = question.type || 'multiple_choice';
    let correct = false;

    if (type === 'open_box' || type === 'fill_blank') {
      const answer = textAnswer || '';
      const target = question.openBoxAnswer || question.options[0] || '';
      correct = normalized(answer) === normalized(target);
    } else if (type === 'select_objects') {
      const target = Number(question.openBoxAnswer || question.options[0] || question.correctIndex || 4);
      correct = tappedObjectIds.length === target;
    } else if (type === 'drag_and_drop') {
      const dragTargets = question.dragItems || [];
      correct = dragTargets.length > 0 && dragTargets.every((d) => userDragPlacements[d.item] === d.target);
    } else if (type === 'match_making') {
      const expectedPairs = question.matchPairs || [];
      correct = expectedPairs.length > 0 && expectedPairs.every((p) => userMatchPairs[p.left] === p.right);
    } else if (type === 'ordering') {
      const expectedOrder = question.orderSequence || question.options || [];
      correct = expectedOrder.length > 0 && userOrderedList.join(',') === expectedOrder.join(',');
    } else if (type === 'sorting') {
      const expectedBuckets = question.sortBuckets || [];
      correct = expectedBuckets.length > 0 && expectedBuckets.every((b) => {
        const userItems = userBuckets[b.bucketName] || [];
        return b.items.length === userItems.length && b.items.every((it) => userItems.includes(it));
      });
    } else if (type === 'multiple_choice' && question.correctIndices && question.correctIndices.length > 0) {
      const targetIndices = question.correctIndices.slice().sort((a, b) => a - b);
      const userSorted = multiSelected.slice().sort((a, b) => a - b);
      correct = targetIndices.length === userSorted.length && targetIndices.every((val, i) => val === userSorted[i]);
    } else {
      const answerIndex = idx !== undefined ? idx : selected;
      correct = answerIndex === question.correctIndex;
    }

    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer?.(correct);
  };

  const canSubmit = useMemo(() => {
    if (submitted) return false;
    const type = question.type || 'multiple_choice';
    if (type === 'open_box' || type === 'fill_blank') {
      return textAnswer.trim().length > 0;
    }
    if (type === 'select_objects') {
      return tappedObjectIds.length > 0;
    }
    if (type === 'drag_and_drop') {
      return Object.keys(userDragPlacements).length > 0;
    }
    if (type === 'match_making') {
      return Object.keys(userMatchPairs).length > 0;
    }
    if (type === 'ordering') {
      return userOrderedList.length > 0;
    }
    if (type === 'sorting') {
      return Object.values(userBuckets).some((arr) => arr.length > 0);
    }
    if (type === 'multiple_choice') {
      return multiSelected.length > 0 || selected !== null;
    }
    return selected !== null;
  }, [submitted, question.type, textAnswer, tappedObjectIds, userDragPlacements, userMatchPairs, userOrderedList, userBuckets, selected, multiSelected]);

  const readAloud = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(question.prompt);
      u.rate = 0.9;
      u.pitch = 1.08;
      window.speechSynthesis.speak(u);
    }
  };

  const bg = question.visualConfig?.background === 'playful'
    ? 'bg-gradient-to-br from-amber-50 via-white to-emerald-50'
    : question.visualConfig?.background === 'soft' ? 'bg-stone-50' : 'bg-white';

  return (
    <div className={`${bg} rounded-3xl border border-stone-200 p-5 sm:p-7 ${compact ? 'text-sm' : ''}`}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Media (if present) */}
        {question.mediaUrl && (
          <div className="flex justify-center">
            {question.mediaUrl.match(/\.(mp4|webm)$/i) ? (
              <video 
                src={question.mediaUrl} 
                autoPlay 
                loop 
                muted 
                playsInline
                className="max-h-48 rounded-2xl border border-stone-200 bg-stone-100"
              />
            ) : (
              <img 
                src={question.mediaUrl} 
                alt="Question Illustration" 
                className="max-h-48 rounded-2xl border border-stone-200 bg-stone-100 object-contain"
              />
            )}
          </div>
        )}

        {/* Prompt Header */}
        <div className="flex items-start gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200">
          <h2 className="flex-1 text-lg sm:text-xl md:text-2xl font-black text-stone-900 leading-snug">
            <ClipartText text={question.prompt} imageSize="md" />
          </h2>
          <button 
            type="button" 
            onClick={readAloud} 
            className="shrink-0 p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 cursor-pointer" 
            title="Listen"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Question Card */}
        <InteractiveQuestionCard
          question={question}
          isSubmitted={submitted}
          selectedOption={selected}
          multiSelected={multiSelected}
          onToggleMultiSelected={(idx) => {
            setMultiSelected((prev) =>
              prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
            );
          }}
          onSelectOption={(idx) => {
            setSelected(idx);
            if (['true_false', 'radio_single', 'single_choice'].includes(question.type || '')) {
              check(idx);
            }
          }}
          openBoxInput={textAnswer}
          onChangeOpenBoxInput={setTextAnswer}
          userDragPlacements={userDragPlacements}
          onUpdateDragPlacements={setUserDragPlacements}
          userMatchPairs={userMatchPairs}
          onUpdateMatchPairs={setUserMatchPairs}
          userOrderedList={userOrderedList}
          onUpdateOrderedList={setUserOrderedList}
          userBuckets={userBuckets}
          onUpdateBuckets={setUserBuckets}
          tappedObjectIds={tappedObjectIds}
          onToggleTapObject={(id) => {
            setTappedObjectIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            );
          }}
          onReadAloud={readAloud}
          compact={compact}
        />

        {/* Action button */}
        {interactive && !submitted && !['true_false', 'radio_single', 'single_choice'].includes(question.type || '') && (
          <div className="flex justify-center pt-2">
            <button 
              type="button" 
              onClick={() => check()} 
              disabled={!canSubmit} 
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-all"
            >
              <Check className="w-4 h-4" /> Check Answer
            </button>
          </div>
        )}

        {/* Feedback message */}
        {submitted && (
          <div className={`rounded-2xl p-4 text-center font-black ${
            isCorrect 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {isCorrect ? '🌟 Outstanding! Correct!' : '💪 Good effort! Check the explanation below:'}
          </div>
        )}

        {/* Explanation */}
        {submitted && showExplanation && question.explanation && (
          <div className="p-4 rounded-2xl bg-white border border-stone-200 text-sm text-stone-600">
            <strong className="text-stone-900">Explanation:</strong> {question.explanation}
          </div>
        )}

        {/* Reset button */}
        {submitted && interactive && (
          <div className="flex justify-center">
            <button 
              type="button" 
              onClick={reset} 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold hover:bg-stone-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
