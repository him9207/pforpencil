import React, { useState, useEffect } from 'react';
import { MemoryMatchActivity, MemoryCard } from '../types';
import { sounds } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, RotateCcw, CheckCircle2 } from 'lucide-react';

interface Props {
  activity: MemoryMatchActivity;
  onComplete: (score: number) => void;
}

interface CardState extends MemoryCard {
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryMatchEngine({ activity, onComplete }: Props) {
  const [deck, setDeck] = useState<CardState[]>(() => {
    return [...activity.cards]
      .sort(() => Math.random() - 0.5)
      .map((c) => ({ ...c, isFlipped: false, isMatched: false }));
  });

  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [isLock, setIsLock] = useState(false);

  const matchedCount = deck.filter((c) => c.isMatched).length;
  const totalCards = deck.length;

  const handleCardClick = (index: number) => {
    if (isLock || deck[index].isFlipped || deck[index].isMatched) return;

    sounds.click();

    // Flip this card
    const nextDeck = [...deck];
    nextDeck[index].isFlipped = true;
    setDeck(nextDeck);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setIsLock(true);
      setMoves((m) => m + 1);

      const [firstIdx, secondIdx] = nextFlipped;
      const card1 = nextDeck[firstIdx];
      const card2 = nextDeck[secondIdx];

      if (card1.matchKey === card2.matchKey) {
        // MATCH!
        sounds.playCorrect();
        setTimeout(() => {
          const matchedDeck = [...nextDeck];
          matchedDeck[firstIdx].isMatched = true;
          matchedDeck[secondIdx].isMatched = true;
          setDeck(matchedDeck);
          setFlippedIndices([]);
          setIsLock(false);

          // Check if all matched
          if (matchedDeck.every((c) => c.isMatched)) {
            setCompleted(true);
            sounds.playVictory();
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            onComplete(100);
          }
        }, 500);
      } else {
        // NO MATCH -> Flip back
        sounds.playWrong();
        setTimeout(() => {
          const resetDeck = [...nextDeck];
          resetDeck[firstIdx].isFlipped = false;
          resetDeck[secondIdx].isFlipped = false;
          setDeck(resetDeck);
          setFlippedIndices([]);
          setIsLock(false);
        }, 1100);
      }
    }
  };

  const handleReset = () => {
    setDeck(
      [...activity.cards]
        .sort(() => Math.random() - 0.5)
        .map((c) => ({ ...c, isFlipped: false, isMatched: false }))
    );
    setFlippedIndices([]);
    setMoves(0);
    setCompleted(false);
    setIsLock(false);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e1e6f1] p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            Memory Concentration Lab
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#10246f] mt-1">
            {activity.title}
          </h3>
          <p className="text-xs text-[#59627a] mt-0.5">{activity.instruction}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-[#eef4ff] text-[#10246f] px-3 py-1 rounded-full border border-[#d7def0]">
            Pairs: {matchedCount / 2} / {totalCards / 2}
          </span>
          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
            Moves: {moves}
          </span>
        </div>
      </div>

      {!completed ? (
        /* Cards Grid */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 pt-2">
          {deck.map((card, idx) => {
            const showFace = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(idx)}
                disabled={card.isMatched || isLock}
                className={`h-28 sm:h-32 rounded-2xl border-2 transition-all duration-300 transform perspective-1000 flex flex-col items-center justify-center p-3 cursor-pointer select-none ${
                  card.isMatched
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 scale-95 opacity-90 shadow-2xs'
                    : showFace
                    ? 'bg-white border-blue-500 text-blue-950 shadow-md scale-102 ring-2 ring-blue-200'
                    : 'bg-gradient-to-br from-[#10246f] to-[#1c399b] border-[#10246f] text-white hover:scale-102 hover:shadow-md active:scale-98'
                }`}
              >
                {showFace ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 animate-in zoom-in-75 duration-200">
                    {card.emoji && <span className="text-3xl sm:text-4xl">{card.emoji}</span>}
                    <span className="text-xs sm:text-sm font-black text-center text-stone-900 leading-tight">
                      {card.content}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl opacity-70">❓</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mt-1">
                      Tap to Flip
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Completed Screen */
        <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-purple-50 border border-purple-200 text-4xl flex items-center justify-center mx-auto text-purple-600 shadow-sm">
            🎉
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
              Super Memory Mastered!
            </span>
            <h3 className="text-2xl font-black text-[#10246f] mt-2">
              All Pairs Found!
            </h3>
            <p className="text-xs text-[#59627a] mt-1 max-w-md mx-auto">
              You cleared the whole board in just <strong className="text-purple-700 font-bold">{moves} moves</strong>!
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
