import React, { useState } from 'react';
import { LineConnectActivity, ConnectNode } from '../types';
import { sounds } from '../../../utils/audio';
import { CheckCircle2, RotateCcw, HelpCircle, Sparkles, Link as LinkIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LineConnectEngineProps {
  activity: LineConnectActivity;
  onComplete: (score: number) => void;
}

export default function LineConnectEngine({ activity, onComplete }: LineConnectEngineProps) {
  // Matched pairs: map of leftNodeId -> rightNodeId
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const handleLeftNodeClick = (node: ConnectNode) => {
    // If already matched, allow unmatching
    if (matchedPairs[node.id]) {
      sounds.click();
      const updated = { ...matchedPairs };
      delete updated[node.id];
      setMatchedPairs(updated);
      setSelectedLeftId(null);
      return;
    }

    sounds.click();
    setSelectedLeftId(selectedLeftId === node.id ? null : node.id);
    setErrorFeedback(null);
  };

  const handleRightNodeClick = (node: ConnectNode) => {
    if (!selectedLeftId) return;

    const leftNode = activity.leftNodes.find((l) => l.id === selectedLeftId);
    if (!leftNode) return;

    if (leftNode.pairId === node.pairId) {
      // Correct match!
      sounds.playCorrect();
      const nextMatched = {
        ...matchedPairs,
        [leftNode.id]: node.id,
      };
      setMatchedPairs(nextMatched);
      setSelectedLeftId(null);
      setErrorFeedback(null);

      if (Object.keys(nextMatched).length === activity.leftNodes.length) {
        setIsCompleted(true);
        sounds.playHappyCelebration();
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        onComplete(100);
      }
    } else {
      // Incorrect match
      sounds.playWrong();
      setErrorFeedback(`"${leftNode.label}" does not live in "${node.label}". Try matching another habitat!`);
    }
  };

  const handleReset = () => {
    sounds.click();
    setMatchedPairs({});
    setSelectedLeftId(null);
    setIsCompleted(false);
    setErrorFeedback(null);
  };

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200">
        <div className="text-xs text-slate-700 font-bold">
          Connected: <span className="text-blue-900">{Object.keys(matchedPairs).length}</span> of {activity.leftNodes.length} pairs
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
            <span>Reset</span>
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
            <span>All Habitats Connected Correctly!</span>
          </div>
        </div>
      )}

      {/* Two Column Connection Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 border-2 border-slate-200 rounded-3xl p-5">
        {/* Left column nodes */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 text-center sm:text-left">
            1. Select an Animal:
          </div>
          {activity.leftNodes.map((node) => {
            const isMatched = Boolean(matchedPairs[node.id]);
            const isSelected = selectedLeftId === node.id;

            return (
              <div
                key={node.id}
                onClick={() => handleLeftNodeClick(node)}
                className={`p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-between gap-3 cursor-pointer transition-all select-none ${
                  isMatched
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                    : isSelected
                    ? 'bg-blue-600 border-blue-600 text-white scale-102 shadow-md ring-4 ring-blue-100'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{node.emoji}</span>
                  <span>{node.label}</span>
                </div>
                {isMatched ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Matched
                  </span>
                ) : isSelected ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold animate-pulse">
                    Connecting...
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                )}
              </div>
            );
          })}
        </div>

        {/* Right column nodes */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 text-center sm:text-left">
            2. Match to its Habitat:
          </div>
          {activity.rightNodes.map((node) => {
            const matchedLeftKey = Object.keys(matchedPairs).find((k) => matchedPairs[k] === node.id);
            const isMatched = Boolean(matchedLeftKey);

            return (
              <div
                key={node.id}
                onClick={() => handleRightNodeClick(node)}
                className={`p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-between gap-3 transition-all select-none ${
                  isMatched
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                    : selectedLeftId
                    ? 'bg-white border-blue-300 text-slate-800 cursor-pointer hover:bg-blue-50/60 hover:scale-101'
                    : 'bg-white/60 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{node.emoji}</span>
                  <span>{node.label}</span>
                </div>
                {isMatched ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                    ✓
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
