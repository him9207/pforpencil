import React, { useState } from 'react';
import { FeedingGameActivity } from '../types';
import { sounds } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Volume2, RotateCcw, CheckCircle2 } from 'lucide-react';

interface Props {
  activity: FeedingGameActivity;
  onComplete: (score: number) => void;
}

export default function FeedingCareEngine({ activity, onComplete }: Props) {
  const [taskIndex, setTaskIndex] = useState(0);
  const [isFeeding, setIsFeeding] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const currentTask = activity.tasks[taskIndex] || activity.tasks[0];

  const handleReadAloud = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getCharacterEmoji = () => {
    if (isWrong) return '🙈';
    if (isHappy) {
      switch (activity.character) {
        case 'bunny': return '🐰✨';
        case 'puppy': return '🐶💖';
        case 'bear': return '🐻🎉';
        case 'penguin': return '🐧❄️';
        default: return '🐒😋';
      }
    }
    if (isFeeding) {
      switch (activity.character) {
        case 'bunny': return '🐰🥕';
        case 'puppy': return '🐶🦴';
        case 'bear': return '🐻🍯';
        case 'penguin': return '🐧🐟';
        default: return '🐒🍌';
      }
    }
    switch (activity.character) {
      case 'bunny': return '🐰';
      case 'puppy': return '🐶';
      case 'bear': return '🐻';
      case 'penguin': return '🐧';
      default: return '🐒';
    }
  };

  const handleChooseOption = (optIndex: number) => {
    if (isFeeding || isHappy || completed) return;
    setSelectedIdx(optIndex);

    const isCorrect = optIndex === currentTask.correctItemIndex;

    if (isCorrect) {
      sounds.playCorrect();
      setIsFeeding(true);
      setTimeout(() => {
        setIsFeeding(false);
        setIsHappy(true);
        sounds.playLevelUp();
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
        setScore((prev) => prev + 25);

        setTimeout(() => {
          setIsHappy(false);
          setSelectedIdx(null);

          if (taskIndex + 1 < activity.tasks.length) {
            setTaskIndex((prev) => prev + 1);
          } else {
            setCompleted(true);
            sounds.playVictory();
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            onComplete(score + 25);
          }
        }, 1200);
      }, 900);
    } else {
      sounds.playWrong();
      setIsWrong(true);
      setTimeout(() => {
        setIsWrong(false);
        setSelectedIdx(null);
      }, 1000);
    }
  };

  const handleReset = () => {
    setTaskIndex(0);
    setIsFeeding(false);
    setIsHappy(false);
    setIsWrong(false);
    setSelectedIdx(null);
    setCompleted(false);
    setScore(0);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e1e6f1] p-6 sm:p-8 shadow-sm space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Feeding & Caring Challenge
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#10246f] mt-1">
            {activity.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleReadAloud(currentTask.targetQuestion)}
            className="p-2.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
            title="Read Question Aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold bg-[#eef4ff] text-[#10246f] px-3 py-1 rounded-full border border-[#d7def0]">
            Task {taskIndex + 1}/{activity.tasks.length}
          </span>
        </div>
      </div>

      {!completed ? (
        <div className="space-y-6 text-center">
          {/* Prompt / Question */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5">
            <h4 className="text-lg sm:text-xl font-black text-stone-900 leading-snug">
              {currentTask.targetQuestion}
            </h4>
            <p className="text-xs text-stone-600 mt-1 font-medium">
              Choose the correct {activity.foodName} below to feed {activity.characterName}!
            </p>
          </div>

          {/* Animated Character Stage */}
          <div className="relative py-4 flex flex-col items-center justify-center">
            <div className={`text-7xl sm:text-8xl transition-all duration-300 ${
              isFeeding ? 'scale-110 animate-bounce' : isHappy ? 'scale-125 rotate-6' : isWrong ? 'scale-90 animate-shake' : 'hover:scale-105'
            }`}>
              {getCharacterEmoji()}
            </div>

            <div className="mt-2 text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
              {isFeeding ? `Nom nom! Munching delicious ${activity.foodName}...` : isHappy ? `Yay! ${activity.characterName} loves it! 🎉` : isWrong ? 'Oops! That is not the right one.' : `${activity.characterName} is waiting for lunch!`}
            </div>
          </div>

          {/* Food Options Choices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {currentTask.options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isFeeding || isHappy}
                  onClick={() => handleChooseOption(idx)}
                  className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 ${
                    isSelected && isHappy
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 scale-105 shadow-md'
                      : isSelected && isWrong
                      ? 'bg-rose-50 border-rose-500 text-rose-950 animate-shake'
                      : 'bg-[#f8faff] border-[#e1e6f1] hover:border-blue-400 hover:bg-white hover:scale-102 active:scale-98 shadow-2xs'
                  }`}
                >
                  <span className="text-4xl">{opt.emoji || activity.foodEmoji}</span>
                  <span className="text-sm font-black text-stone-900">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Complete Screen */
        <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 text-4xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            🏆
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Full Bellies & Big Smiles!
            </span>
            <h3 className="text-2xl font-black text-[#10246f] mt-2">
              All Fed & Mastered!
            </h3>
            <p className="text-xs text-[#59627a] mt-1 max-w-md mx-auto">
              You correctly solved all questions and fed {activity.characterName} {activity.tasks.length} times!
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
