import React, { useState } from 'react';
import { DragDropSortActivity, DragDropItem } from '../types';
import { sounds } from '../../../utils/audio';
import { CheckCircle2, RotateCcw, Sparkles, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DragDropSortEngineProps {
  activity: DragDropSortActivity;
  onComplete: (score: number) => void;
}

export default function DragDropSortEngine({ activity, onComplete }: DragDropSortEngineProps) {
  // Unsorted items pool
  const [unassignedItems, setUnassignedItems] = useState<DragDropItem[]>(activity.items);
  // Placed items in bins: { binId: DragDropItem[] }
  const [binAssignments, setBinAssignments] = useState<Record<string, DragDropItem[]>>(() => {
    const init: Record<string, DragDropItem[]> = {};
    activity.bins.forEach((b) => (init[b.id] = []));
    return init;
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Check if item belongs to bin
  const handlePlaceItemInBin = (binId: string, itemIdToPlace?: string) => {
    const activeId = itemIdToPlace || selectedItemId;
    if (!activeId) return;

    const targetItem = unassignedItems.find((i) => i.id === activeId);
    if (!targetItem) return;

    if (targetItem.targetBinId === binId) {
      // Correct!
      sounds.playCorrect();
      setErrorFeedback(null);

      const nextUnassigned = unassignedItems.filter((i) => i.id !== activeId);
      const nextBins = {
        ...binAssignments,
        [binId]: [...binAssignments[binId], targetItem],
      };

      setUnassignedItems(nextUnassigned);
      setBinAssignments(nextBins);
      setSelectedItemId(null);

      if (nextUnassigned.length === 0) {
        setIsCompleted(true);
        sounds.playHappyCelebration();
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        onComplete(100);
      }
    } else {
      // Wrong bin
      sounds.playWrong();
      setErrorFeedback(`"${targetItem.label}" belongs in the other bin. Give it another try!`);
      setTimeout(() => setErrorFeedback(null), 2500);
    }
  };

  const handleReset = () => {
    sounds.click();
    setUnassignedItems(activity.items);
    const resetBins: Record<string, DragDropItem[]> = {};
    activity.bins.forEach((b) => (resetBins[b.id] = []));
    setBinAssignments(resetBins);
    setSelectedItemId(null);
    setIsCompleted(false);
    setErrorFeedback(null);
  };

  const getBinColorClasses = (scheme: string) => {
    switch (scheme) {
      case 'emerald':
        return 'border-emerald-300 bg-emerald-50/70 text-emerald-950';
      case 'purple':
        return 'border-purple-300 bg-purple-50/70 text-purple-950';
      case 'amber':
        return 'border-amber-300 bg-amber-50/70 text-amber-950';
      case 'rose':
        return 'border-rose-300 bg-rose-50/70 text-rose-950';
      case 'blue':
      default:
        return 'border-blue-300 bg-blue-50/70 text-blue-950';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action bar / Hint */}
      <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200">
        <div className="text-xs text-slate-700 font-medium">
          Remaining items: <strong className="text-blue-700 font-bold">{unassignedItems.length}</strong> of {activity.items.length}
        </div>
        <div className="flex items-center gap-2">
          {activity.hint && (
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
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

      {/* Unassigned Items Pool */}
      {unassignedItems.length > 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center">
            Tap or Drag an Item to Place It into a Target Bin:
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {unassignedItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedItemId(item.id)}
                  onDragEnd={() => setDraggedItemId(null)}
                  onClick={() => {
                    sounds.click();
                    setSelectedItemId(isSelected ? null : item.id);
                  }}
                  className={`px-4 py-2.5 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all select-none shadow-xs ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white scale-105 shadow-md ring-4 ring-blue-100'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400 hover:scale-102'
                  }`}
                >
                  {item.emoji && <span className="text-xl">{item.emoji}</span>}
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2 animate-in zoom-in-95">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-2xl">
            🎉
          </div>
          <h3 className="text-base font-black text-emerald-950">Sorting Complete! Perfect Score!</h3>
          <p className="text-xs text-emerald-800 font-medium">
            All {activity.items.length} items have been sorted into their correct categories accurately.
          </p>
        </div>
      )}

      {/* Drop Target Bins */}
      <div className={`grid gap-4 ${activity.bins.length > 2 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {activity.bins.map((bin) => {
          const placedItems = binAssignments[bin.id] || [];
          const colorClass = getBinColorClasses(bin.colorScheme);

          return (
            <div
              key={bin.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedItemId) {
                  handlePlaceItemInBin(bin.id, draggedItemId);
                  setDraggedItemId(null);
                }
              }}
              onClick={() => {
                if (selectedItemId) {
                  handlePlaceItemInBin(bin.id);
                }
              }}
              className={`border-2 rounded-2xl p-4 min-h-[170px] flex flex-col justify-between transition-all relative ${colorClass} ${
                selectedItemId ? 'ring-2 ring-blue-400 ring-offset-2 cursor-pointer' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-2 mb-3">
                  <div className="flex items-center gap-2 font-black text-sm">
                    {bin.emoji && <span className="text-xl">{bin.emoji}</span>}
                    <span>{bin.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-mono font-bold shadow-2xs">
                    {placedItems.length}
                  </span>
                </div>

                {/* Placed item badges */}
                <div className="flex flex-wrap gap-2">
                  {placedItems.map((item) => (
                    <span
                      key={item.id}
                      className="px-2.5 py-1.5 rounded-xl bg-white text-slate-900 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-in zoom-in-75"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {item.emoji && <span>{item.emoji}</span>}
                      <span>{item.label}</span>
                    </span>
                  ))}
                  {placedItems.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-4 text-center w-full">
                      Drop items here or tap an item then tap this bin
                    </div>
                  )}
                </div>
              </div>

              {selectedItemId && (
                <div className="mt-3 pt-2 border-t border-black/10 text-center">
                  <button
                    type="button"
                    className="w-full py-1.5 rounded-xl bg-white/90 hover:bg-white text-xs font-bold text-slate-800 shadow-xs transition-all"
                  >
                    Place Selected Item Here ↵
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
