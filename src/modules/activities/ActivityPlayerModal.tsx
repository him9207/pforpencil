import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ActivityFormat, ActivityStep, Question } from '../../types';
import { ChevronRight, Clock, Gamepad2, RotateCcw, Sparkles, Star, Trophy, Volume2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import InteractiveGameEngine from './InteractiveGameEngine';
import { convertActivityToInteractiveSteps, detectQuestionGameMechanic, questionToGameTask } from './activityGameMapper';
import { sounds } from '../../utils/audio';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';

interface Props {
  activity: Activity | null;
  questions: Question[];
  studentName: string;
  onClose: () => void;
  onComplete?: (score: number, maxScore: number) => void;
}

export default function ActivityPlayerModal({ activity, questions, studentName, onClose, onComplete }: Props) {
  const defaultFormat = activity?.format || (activity?.grade === 'Preschool' || activity?.grade === 'Foundation' ? 'feeding_game' : 'balloon_pop');
  const [selectedFormat, setSelectedFormat] = useState<ActivityFormat>(defaultFormat);

  // Automatically transform question bank items into interactive game tasks
  const steps = useMemo<ActivityStep[]>(() => {
    return convertActivityToInteractiveSteps(activity, questions, selectedFormat);
  }, [activity, questions, selectedFormat]);

  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [seconds, setSeconds] = useState((activity?.durationMinutes || 5) * 60);
  const [lastPoints, setLastPoints] = useState(0);

  useEffect(() => {
    const nextFmt = activity?.format || (activity?.grade === 'Preschool' || activity?.grade === 'Foundation' ? 'feeding_game' : 'balloon_pop');
    setSelectedFormat(nextFmt);
    setIndex(0);
    setCompleted(false);
    setScore(0);
    setStars(0);
    setSeconds((activity?.durationMinutes || 5) * 60);
    setLastPoints(0);
  }, [activity]);

  // Countdown timer
  useEffect(() => {
    if (!activity || activity.timerEnabled === false || completed) return;
    const id = window.setInterval(() => setSeconds(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [activity, completed]);

  // Lock body scroll while game player modal is active
  useBodyScrollLock(Boolean(activity));

  if (!activity) return null;

  const step = steps[index];
  const question = step?.questionId
    ? questions.find(q => q.id === step.questionId)
    : step?.gameTask?.questionId
    ? questions.find(q => q.id === step.gameTask?.questionId)
    : undefined;

  const maxScore = Math.max(
    1,
    steps.reduce((s, x) => s + (x.gameTask?.rewardPoints || (x.questionId ? questions.find(q => q.id === x.questionId)?.points || 20 : 20)), 0)
  );

  const completeStep = (points = 20) => {
    if (completed) return;
    setLastPoints(points);
    setCompleted(true);
    setScore(v => v + points);
    setStars(v => Math.min(3, v + 1));
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
  };

  const next = () => {
    if (!completed) return;
    sounds.click();
    if (index + 1 < steps.length) {
      setIndex(v => v + 1);
      setCompleted(false);
      setLastPoints(0);
      return;
    }

    // Final Celebration
    sounds.playVictory();
    confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    onComplete?.(score + lastPoints, maxScore);
    onClose();
  };

  const currentTask = step?.gameTask || (question ? questionToGameTask(question, selectedFormat, index) : null);

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-5">
      <div className="w-full max-w-5xl h-[96vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <header className="px-5 py-3.5 bg-stone-950 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                Interactive Activity · {activity.id}
              </span>
              {activity.grade && (
                <span className="text-[10px] font-bold text-stone-300 bg-white/10 px-2 py-0.5 rounded-md">
                  {activity.grade}
                </span>
              )}
            </div>
            <h2 className="font-black text-base sm:text-xl truncate text-white mt-0.5">{activity.title}</h2>
          </div>

          {/* Interactive Game Format Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-[340px] sm:max-w-none">
              <span className="text-amber-300 text-[10px] px-1 font-black shrink-0">🎮 Mini-Game:</span>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setSelectedFormat('balloon_pop');
                  setCompleted(false);
                }}
                className={`px-2 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                  selectedFormat === 'balloon_pop'
                    ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                🎈 Balloons
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setSelectedFormat('space_blaster');
                  setCompleted(false);
                }}
                className={`px-2 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                  selectedFormat === 'space_blaster'
                    ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                🚀 Space
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setSelectedFormat('feeding_game');
                  setCompleted(false);
                }}
                className={`px-2 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                  selectedFormat === 'feeding_game'
                    ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                🐒 Animals
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setSelectedFormat('sorting');
                  setCompleted(false);
                }}
                className={`px-2 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                  selectedFormat === 'sorting'
                    ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                🧺 Baskets
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setSelectedFormat('matching');
                  setCompleted(false);
                }}
                className={`px-2 py-1 rounded-lg transition cursor-pointer shrink-0 ${
                  selectedFormat === 'matching'
                    ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                🃏 Memory
              </button>
            </div>

            {/* Score & Timer */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-black text-amber-300 text-sm bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{score} XP</span>
              </span>

              {activity.timerEnabled !== false && (
                <span className="inline-flex items-center gap-1 text-xs font-black text-stone-300 bg-white/10 px-2.5 py-1 rounded-xl">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/10 text-stone-300 hover:text-white transition cursor-pointer"
                title="Exit Game"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Top Progress bar */}
        <div className="h-2 bg-stone-100 shrink-0">
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${steps.length ? ((index + 1) / steps.length) * 100 : 0}%` }}
          />
        </div>

        {/* Active Interactive Game Engine */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-b from-white to-stone-50 flex items-center justify-center">
          {currentTask ? (
            <InteractiveGameEngine
              task={currentTask}
              question={question}
              done={completed}
              onComplete={completeStep}
            />
          ) : (
            <div className="text-center p-8 text-stone-500">
              <Gamepad2 className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="font-bold">Loading challenge questions...</p>
            </div>
          )}
        </main>

        {/* Footer controls */}
        <footer className="px-5 py-4 border-t border-stone-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-stone-600">
              Challenge {index + 1} of {steps.length}
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <span>⭐</span>
              <span>{stars}/3 Stars</span>
            </span>
          </div>

          <button
            type="button"
            onClick={next}
            disabled={!completed}
            className="px-6 py-3 rounded-2xl bg-stone-950 text-white font-black text-sm disabled:opacity-30 inline-flex items-center gap-2 hover:bg-stone-800 transition cursor-pointer shadow-md disabled:cursor-not-allowed"
          >
            <span>{index + 1 < steps.length ? 'Next Challenge' : 'Finish Game 🏆'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    </div>
  );
}
