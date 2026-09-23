import React, { useState } from 'react';
import { BalloonPopActivity, BalloonItem } from '../types';
import { sounds } from '../../../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, RotateCcw, Volume2 } from 'lucide-react';

interface Props {
  activity: BalloonPopActivity;
  onComplete: (score: number) => void;
}

export default function BalloonPopEngine({ activity, onComplete }: Props) {
  const [balloons, setBalloons] = useState<BalloonItem[]>(activity.balloons);
  const [poppedIds, setPoppedIds] = useState<string[]>([]);
  const [wrongPopId, setWrongPopId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const correctRemaining = balloons.filter((b) => b.isCorrect && !poppedIds.includes(b.id)).length;

  const handleReadAloud = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePop = (balloon: BalloonItem) => {
    if (poppedIds.includes(balloon.id) || completed) return;

    if (balloon.isCorrect) {
      sounds.playPop();
      confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 } });
      const nextPopped = [...poppedIds, balloon.id];
      setPoppedIds(nextPopped);
      setScore((s) => s + 20);

      // Check if all correct balloons are popped
      const remaining = balloons.filter((b) => b.isCorrect && !nextPopped.includes(b.id)).length;
      if (remaining === 0) {
        setCompleted(true);
        sounds.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        onComplete(score + 20);
      }
    } else {
      sounds.playWrong();
      setWrongPopId(balloon.id);
      setTimeout(() => setWrongPopId(null), 800);
    }
  };

  const handleReset = () => {
    setBalloons(activity.balloons);
    setPoppedIds([]);
    setWrongPopId(null);
    setCompleted(false);
    setScore(0);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e1e6f1] p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Balloon Carnival Lab
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#10246f] mt-1">
            {activity.title}
          </h3>
          <p className="text-xs text-[#59627a] mt-0.5">{activity.instruction}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleReadAloud(activity.targetPrompt)}
            className="p-2.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
            title="Read Prompt Aloud"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold bg-[#eef4ff] text-[#10246f] px-3 py-1 rounded-full border border-[#d7def0]">
            Target Left: {correctRemaining}
          </span>
        </div>
      </div>

      {/* Target Mission Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 text-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
          🎯 Mission Prompt
        </span>
        <h4 className="text-lg sm:text-xl font-black text-stone-900 mt-1">
          {activity.targetPrompt}
        </h4>
        <p className="text-xs text-stone-600 mt-0.5">
          Tap only the balloons that match the mission!
        </p>
      </div>

      {!completed ? (
        /* Balloons Playground Grid */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 py-6 min-h-[260px] items-center justify-items-center">
          {balloons.map((b) => {
            const isPopped = poppedIds.includes(b.id);
            const isWrong = wrongPopId === b.id;

            if (isPopped) {
              return (
                <div key={b.id} className="w-24 h-28 flex flex-col items-center justify-center opacity-30 select-none">
                  <span className="text-3xl">💥</span>
                  <span className="text-[10px] font-bold text-stone-400">POPPED</span>
                </div>
              );
            }

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handlePop(b)}
                className={`relative w-24 h-28 sm:w-28 sm:h-32 rounded-full border-2 transition-all duration-300 transform flex flex-col items-center justify-center p-2 cursor-pointer shadow-md hover:scale-110 active:scale-95 animate-float ${
                  isWrong ? 'animate-shake bg-rose-200 border-rose-500' : ''
                }`}
                style={{
                  backgroundColor: b.color || '#3b82f6',
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: '#ffffff'
                }}
              >
                {/* Balloon shine reflection */}
                <div className="absolute top-2 left-4 w-3 h-6 bg-white/40 rounded-full rotate-[-20deg] pointer-events-none" />

                {/* Text inside Balloon */}
                <span className="text-sm sm:text-base font-black text-center drop-shadow-md px-1">
                  {b.text}
                </span>

                {/* Balloon tie string */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-2 h-2.5 bg-stone-400 rounded-b-sm" />
              </button>
            );
          })}
        </div>
      ) : (
        /* Completed Screen */
        <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 text-4xl flex items-center justify-center mx-auto text-rose-600 shadow-sm">
            🎈
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
              Balloon Carnival Victory!
            </span>
            <h3 className="text-2xl font-black text-[#10246f] mt-2">
              All Target Balloons Popped!
            </h3>
            <p className="text-xs text-[#59627a] mt-1 max-w-md mx-auto">
              You correctly popped all matching balloons with pinpoint accuracy!
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
