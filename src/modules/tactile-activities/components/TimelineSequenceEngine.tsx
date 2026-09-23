import React, { useState } from 'react';
import { TimelineSequenceActivity, SequenceCard } from '../types';
import { sounds } from '../../../utils/audio';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, HelpCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TimelineSequenceEngineProps {
  activity: TimelineSequenceActivity;
  onComplete: (score: number) => void;
}

export default function TimelineSequenceEngine({ activity, onComplete }: TimelineSequenceEngineProps) {
  // Scrambled cards initially
  const [orderedCards, setOrderedCards] = useState<SequenceCard[]>(() => {
    return [...activity.cards].sort(() => Math.random() - 0.5);
  });

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const moveCard = (currentIndex: number, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= orderedCards.length) return;
    sounds.click();

    const newCards = [...orderedCards];
    const [moved] = newCards.splice(currentIndex, 1);
    newCards.splice(targetIndex, 0, moved);
    setOrderedCards(newCards);
    setErrorFeedback(null);
  };

  const handleCardClick = (cardId: string) => {
    sounds.click();
    if (!selectedCardId) {
      setSelectedCardId(cardId);
      return;
    }

    if (selectedCardId === cardId) {
      setSelectedCardId(null);
      return;
    }

    // Swap two cards
    const idxA = orderedCards.findIndex((c) => c.id === selectedCardId);
    const idxB = orderedCards.findIndex((c) => c.id === cardId);

    if (idxA !== -1 && idxB !== -1) {
      const newCards = [...orderedCards];
      const temp = newCards[idxA];
      newCards[idxA] = newCards[idxB];
      newCards[idxB] = temp;
      setOrderedCards(newCards);
    }
    setSelectedCardId(null);
    setErrorFeedback(null);
  };

  const handleCheckOrder = () => {
    const isCorrect = orderedCards.every((card, idx) => card.correctOrderIndex === idx);

    if (isCorrect) {
      sounds.playHappyCelebration();
      setIsCompleted(true);
      setErrorFeedback(null);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onComplete(100);
    } else {
      sounds.playWrong();
      setErrorFeedback('The timeline sequence is not quite in order yet. Check which stage happens first!');
    }
  };

  const handleReset = () => {
    sounds.click();
    setOrderedCards([...activity.cards].sort(() => Math.random() - 0.5));
    setSelectedCardId(null);
    setIsCompleted(false);
    setErrorFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200">
        <div className="text-xs text-slate-700 font-bold">
          Story: <span className="text-blue-900">{activity.storyTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {activity.hint && (
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hint</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {showHint && activity.hint && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium animate-in fade-in">
          💡 <strong>Tip:</strong> {activity.hint}
        </div>
      )}

      {errorFeedback && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold text-center animate-bounce">
          ❌ {errorFeedback}
        </div>
      )}

      {isCompleted && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-1 animate-in zoom-in-95">
          <div className="text-emerald-900 font-black text-sm flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Story Sequence Solved Perfectly!</span>
          </div>
          <p className="text-xs text-emerald-700">
            You successfully ordered the stages from start to finish.
          </p>
        </div>
      )}

      {/* Timeline Steps Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {orderedCards.map((card, idx) => {
          const isSelected = selectedCardId === card.id;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all select-none cursor-pointer relative bg-white shadow-xs ${
                isSelected
                  ? 'border-blue-600 ring-4 ring-blue-100 scale-102 shadow-md'
                  : 'border-slate-200 hover:border-blue-300 hover:scale-101'
              }`}
            >
              {/* Step number badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-black text-xs flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span className="text-3xl">{card.emoji}</span>
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-[#10246f] mb-1">{card.label}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">{card.description}</p>
              </div>

              {/* Move arrows for quick reordering on mobile */}
              <div className="flex items-center justify-between gap-1 pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveCard(idx, idx - 1);
                  }}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 cursor-pointer"
                  title="Move Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400 font-medium">Tap to swap</span>
                <button
                  type="button"
                  disabled={idx === orderedCards.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveCard(idx, idx + 1);
                  }}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 cursor-pointer"
                  title="Move Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verify sequence button */}
      {!isCompleted && (
        <button
          type="button"
          onClick={handleCheckOrder}
          className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-101 active:scale-99"
        >
          <Sparkles className="w-4 h-4" />
          <span>Check Timeline Sequence</span>
        </button>
      )}
    </div>
  );
}
