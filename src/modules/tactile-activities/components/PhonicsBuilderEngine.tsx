import React, { useState } from 'react';
import { PhonicsBuilderActivity, PhonicsWordTarget, PhonicsTile } from '../types';
import { sounds } from '../../../utils/audio';
import { Volume2, CheckCircle2, RotateCcw, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PhonicsBuilderEngineProps {
  activity: PhonicsBuilderActivity;
  onComplete: (score: number) => void;
}

export default function PhonicsBuilderEngine({ activity, onComplete }: PhonicsBuilderEngineProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const target: PhonicsWordTarget = activity.targetWords[currentWordIndex] || activity.targetWords[0];

  // Selected tiles placed into slots: array of strings
  const [placedLetters, setPlacedLetters] = useState<string[]>([]);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [solvedWordIds, setSolvedWordIds] = useState<string[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Play audio voice pronunciation of target word or letter
  const speakSound = (text: string) => {
    sounds.click();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.85;
      utter.pitch = 1.1;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleTileClick = (sound: string) => {
    if (placedLetters.length >= target.requiredTiles.length) return;

    sounds.click();
    speakSound(sound);
    const updated = [...placedLetters, sound];
    setPlacedLetters(updated);
    setErrorFeedback(null);

    // Check if word is complete
    if (updated.length === target.requiredTiles.length) {
      const spelledWord = updated.join('').toUpperCase();
      const targetSpelling = target.requiredTiles.join('').toUpperCase();

      if (spelledWord === targetSpelling) {
        // Solved!
        sounds.playHappyCelebration();
        speakSound(target.word);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

        const nextSolved = [...new Set([...solvedWordIds, target.id])];
        setSolvedWordIds(nextSolved);

        if (nextSolved.length >= activity.targetWords.length) {
          setTimeout(() => {
            onComplete(100);
          }, 1200);
        }
      } else {
        sounds.playWrong();
        setErrorFeedback(`Not quite "${spelledWord}". Try listening to the sound clue again!`);
      }
    }
  };

  const handleRemoveLetter = (index: number) => {
    sounds.click();
    const updated = [...placedLetters];
    updated.splice(index, 1);
    setPlacedLetters(updated);
    setErrorFeedback(null);
  };

  const handleClearSlots = () => {
    sounds.click();
    setPlacedLetters([]);
    setErrorFeedback(null);
  };

  const handleNextWord = () => {
    sounds.click();
    const nextIdx = (currentWordIndex + 1) % activity.targetWords.length;
    setCurrentWordIndex(nextIdx);
    setPlacedLetters([]);
    setErrorFeedback(null);
    setShowHint(false);
  };

  const isWordSolved = solvedWordIds.includes(target.id);

  return (
    <div className="space-y-6">
      {/* Top Header bar with word progress */}
      <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span>Word {currentWordIndex + 1} of {activity.targetWords.length}:</span>
          <div className="flex gap-1.5">
            {activity.targetWords.map((w, idx) => (
              <span
                key={w.id}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  solvedWordIds.includes(w.id)
                    ? 'bg-emerald-500'
                    : idx === currentWordIndex
                    ? 'bg-blue-600 ring-2 ring-blue-200'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
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
            onClick={handleClearSlots}
            className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {showHint && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium animate-in fade-in">
          💡 <strong>Clue:</strong> {target.clueText} (Sounds like: <em>{target.requiredTiles.join(' - ')}</em>)
        </div>
      )}

      {errorFeedback && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold text-center animate-bounce">
          ❌ {errorFeedback}
        </div>
      )}

      {/* Target Word Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-sm">
        <div className="text-5xl sm:text-6xl animate-pulse">{target.hintImageOrEmoji}</div>
        <div>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">{target.clueText}</p>
        </div>

        {/* Audio Listen Button */}
        <button
          type="button"
          onClick={() => speakSound(target.word)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-all cursor-pointer shadow-2xs hover:scale-102"
        >
          <Volume2 className="w-4 h-4 text-blue-600" />
          <span>Listen to Word</span>
        </button>

        {/* Word Construction Slots */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {target.requiredTiles.map((_, idx) => {
            const letter = placedLetters[idx];
            return (
              <div
                key={idx}
                onClick={() => letter && handleRemoveLetter(idx)}
                className={`w-14 sm:w-16 h-16 sm:h-20 rounded-2xl border-3 flex items-center justify-center text-2xl sm:text-3xl font-black font-mono select-none transition-all ${
                  letter
                    ? isWordSolved
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-md animate-in zoom-in-75'
                      : 'border-blue-600 bg-blue-50 text-blue-950 shadow-sm cursor-pointer hover:border-rose-400'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-300'
                }`}
              >
                {letter || ''}
              </div>
            );
          })}
        </div>

        {isWordSolved && (
          <div className="pt-2 animate-in zoom-in-95">
            <div className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Great job! You built <strong>{target.word}</strong>!</span>
            </div>
            {currentWordIndex < activity.targetWords.length - 1 && (
              <button
                type="button"
                onClick={handleNextWord}
                className="mt-3 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-102"
              >
                <span>Next Word</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Available Sound Tiles Tray */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
          Tap Sound Tiles to Assemble the Word:
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {activity.availableTiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handleTileClick(tile.sound)}
              className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 text-slate-900 font-black font-mono text-lg sm:text-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              {tile.sound}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
