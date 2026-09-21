import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  X, 
  RotateCcw, 
  Volume2, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  CheckCircle2,
  Trash2,
  Move
} from 'lucide-react';
import { Question } from '../../types';
import { fixMojibake, resolveVisualEmoji } from '../../utils/visualUtils';

export interface InteractiveQuestionCardProps {
  question: Question;
  isSubmitted: boolean;
  selectedOption: number | null;
  onSelectOption: (idx: number) => void;
  openBoxInput: string;
  onChangeOpenBoxInput: (val: string) => void;
  // For drag & drop
  userDragPlacements: Record<string, string>;
  onUpdateDragPlacements: (placements: Record<string, string>) => void;
  // For match making
  userMatchPairs: Record<string, string>;
  onUpdateMatchPairs: (pairs: Record<string, string>) => void;
  // For ordering
  userOrderedList: string[];
  onUpdateOrderedList: (ordered: string[]) => void;
  // For sorting
  userBuckets: Record<string, string[]>;
  onUpdateBuckets: (buckets: Record<string, string[]>) => void;
  // For tap to count
  tappedObjectIds: string[];
  onToggleTapObject: (id: string) => void;
  // Helper
  onReadAloud?: (text: string) => void;
  // Compact / preview mode
  compact?: boolean;
}

export default function InteractiveQuestionCard({
  question,
  isSubmitted,
  selectedOption,
  onSelectOption,
  openBoxInput,
  onChangeOpenBoxInput,
  userDragPlacements,
  onUpdateDragPlacements,
  userMatchPairs,
  onUpdateMatchPairs,
  userOrderedList,
  onUpdateOrderedList,
  userBuckets,
  onUpdateBuckets,
  tappedObjectIds,
  onToggleTapObject,
  onReadAloud,
  compact = false
}: InteractiveQuestionCardProps) {
  const type = question.type || 'multiple_choice';

  // Internal selection helpers for Drag & Drop tap-to-place
  const [selectedDragItem, setSelectedDragItem] = useState<string | null>(null);

  // Internal selection helper for Match Making
  const [selectedMatchLeft, setSelectedMatchLeft] = useState<string | null>(null);

  // Internal selection helper for Sorting
  const [selectedSortItem, setSelectedSortItem] = useState<string | null>(null);

  // Card-to-card swap selection for Ordering
  const [selectedOrderIdx, setSelectedOrderIdx] = useState<number | null>(null);

  // Active pointer / touch drag state
  interface ActiveDragState {
    type: 'drag_and_drop' | 'sorting' | 'match_making' | 'ordering';
    itemId: string;
    itemData?: any;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
  }

  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);
  const activeDragRef = React.useRef<ActiveDragState | null>(null);
  activeDragRef.current = activeDrag;

  // Read aloud helper
  const handleListen = (text: string) => {
    if (onReadAloud) {
      onReadAloud(text);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    }
  };

  // Play audio click sound
  const playPop = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  };

  // Helper to extract or supply an appropriate friendly clipart for an option or item
  const getOptionClipart = (rawText: string, defaultEmoji = '✨') => {
    const text = fixMojibake(rawText || '');
    // Check if text already has emoji
    const matched = text.match(/[\p{Emoji}\u200d]+/gu);
    if (matched && matched.length > 0) return matched[0];

    const lower = text.toLowerCase();
    if (lower.includes('apple')) return '🍎';
    if (lower.includes('banana')) return '🍌';
    if (lower.includes('berry') || lower.includes('straw')) return '🍓';
    if (lower.includes('car') || lower.includes('vehicle')) return '🚗';
    if (lower.includes('ball')) return '⚽';
    if (lower.includes('balloon')) return '🎈';
    if (lower.includes('star')) return '⭐';
    if (lower.includes('circle') || lower.includes('round')) return '⭕';
    if (lower.includes('square')) return '⏹️';
    if (lower.includes('triangle')) return '🔺';
    if (lower.includes('elephant')) return '🐘';
    if (lower.includes('mouse')) return '🐭';
    if (lower.includes('duck')) return '🦆';
    if (lower.includes('dog') || lower.includes('puppy')) return '🐶';
    if (lower.includes('cat') || lower.includes('kitten')) return '🐱';
    if (lower.includes('lion') || lower.includes('cub')) return '🦁';
    if (lower.includes('hen') || lower.includes('chick')) return '🐥';
    if (lower.includes('monkey')) return '🐒';
    if (lower.includes('bunny') || lower.includes('rabbit')) return '🐰';
    if (lower.includes('fish')) return '🐠';
    if (lower.includes('sun')) return '☀️';
    if (lower.includes('moon')) return '🌙';
    if (lower.includes('cookie')) return '🍪';
    if (lower.includes('bone')) return '🦴';
    if (lower.includes('carrot')) return '🥕';
    if (lower.includes('clock') || lower.includes('time')) return '🕒';
    if (lower.includes('true') || lower.includes('yes')) return '👍';
    if (lower.includes('false') || lower.includes('no')) return '👎';
    return defaultEmoji;
  };

  // Execute drop logic
  const executeDrop = (
    dragType: 'drag_and_drop' | 'sorting' | 'match_making' | 'ordering',
    itemId: string,
    dropId: string,
    itemData?: any
  ) => {
    if (isSubmitted) return;

    if (dragType === 'sorting') {
      playPop();
      const next: Record<string, string[]> = {};
      const sortBucketsList = question.sortBuckets || [
        { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
        { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
      ];

      sortBucketsList.forEach((b) => {
        next[b.bucketName] = [...(userBuckets[b.bucketName] || [])].filter((x) => x !== itemId);
      });
      Object.keys(userBuckets).forEach((bName) => {
        if (!next[bName]) {
          next[bName] = (userBuckets[bName] || []).filter((x) => x !== itemId);
        }
      });

      if (dropId !== '__tray__') {
        if (!next[dropId]) next[dropId] = [];
        if (!next[dropId].includes(itemId)) {
          next[dropId].push(itemId);
        }
      }
      onUpdateBuckets(next);
      setSelectedSortItem(null);
    } else if (dragType === 'drag_and_drop') {
      playPop();
      const next = { ...userDragPlacements };
      if (dropId === '__tray__') {
        delete next[itemId];
      } else {
        next[itemId] = dropId;
      }
      onUpdateDragPlacements(next);
      setSelectedDragItem(null);
    } else if (dragType === 'match_making') {
      playPop();
      const next = { ...userMatchPairs };
      if (dropId === '__tray__') {
        delete next[itemId];
      } else {
        next[itemId] = dropId;
      }
      onUpdateMatchPairs(next);
      setSelectedMatchLeft(null);
    } else if (dragType === 'ordering') {
      playPop();
      const fromIdx = itemData?.idx ?? userOrderedList.indexOf(itemId);
      const toIdx = parseInt(dropId.replace('order-', ''), 10);
      if (!isNaN(toIdx) && fromIdx >= 0 && fromIdx !== toIdx) {
        const copy = [...userOrderedList];
        const itemToMove = copy.splice(fromIdx, 1)[0];
        copy.splice(toIdx, 0, itemToMove);
        onUpdateOrderedList(copy);
      }
      setSelectedOrderIdx(null);
    }
  };

  // Fallback tap/click handler
  const handleTapFallback = (
    dragType: 'drag_and_drop' | 'sorting' | 'match_making' | 'ordering',
    itemId: string,
    itemData?: any
  ) => {
    if (isSubmitted) return;
    playPop();

    if (dragType === 'sorting') {
      setSelectedSortItem((prev) => (prev === itemId ? null : itemId));
    } else if (dragType === 'drag_and_drop') {
      setSelectedDragItem((prev) => (prev === itemId ? null : itemId));
    } else if (dragType === 'match_making') {
      setSelectedMatchLeft((prev) => (prev === itemId ? null : itemId));
    } else if (dragType === 'ordering') {
      const idx = itemData?.idx ?? userOrderedList.indexOf(itemId);
      if (selectedOrderIdx === null) {
        setSelectedOrderIdx(idx);
      } else if (selectedOrderIdx === idx) {
        setSelectedOrderIdx(null);
      } else {
        const copy = [...userOrderedList];
        const temp = copy[selectedOrderIdx];
        copy[selectedOrderIdx] = copy[idx];
        copy[idx] = temp;
        onUpdateOrderedList(copy);
        setSelectedOrderIdx(null);
      }
    }
  };

  // Start pointer drag handler
  const startPointerDrag = (
    e: React.PointerEvent,
    dragType: 'drag_and_drop' | 'sorting' | 'match_making' | 'ordering',
    itemId: string,
    itemData?: any
  ) => {
    if (isSubmitted) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const dragObj: ActiveDragState = {
      type: dragType,
      itemId,
      itemData,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false
    };
    activeDragRef.current = dragObj;
    setActiveDrag(dragObj);
    setHoveredDropId(null);
  };

  // Window listeners for pointermove & pointerup
  useEffect(() => {
    if (!activeDrag) return;

    const onPointerMove = (e: PointerEvent) => {
      const cur = activeDragRef.current;
      if (!cur) return;

      const dist = Math.hypot(e.clientX - cur.startX, e.clientY - cur.startY);
      const isDragging = cur.isDragging || dist > 4;

      const nextState: ActiveDragState = {
        ...cur,
        currentX: e.clientX,
        currentY: e.clientY,
        isDragging
      };
      activeDragRef.current = nextState;
      setActiveDrag(nextState);

      if (isDragging) {
        const targetEl = document.elementFromPoint(e.clientX, e.clientY);
        const dropZone = targetEl?.closest('[data-drop-zone-id]');
        const dropId = dropZone?.getAttribute('data-drop-zone-id') || null;
        setHoveredDropId(dropId);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const cur = activeDragRef.current;
      if (!cur) return;

      if (cur.isDragging) {
        const targetEl = document.elementFromPoint(e.clientX, e.clientY);
        const dropZone = targetEl?.closest('[data-drop-zone-id]');
        const dropId = dropZone?.getAttribute('data-drop-zone-id');

        if (dropId) {
          executeDrop(cur.type, cur.itemId, dropId, cur.itemData);
        }
      } else {
        handleTapFallback(cur.type, cur.itemId, cur.itemData);
      }

      activeDragRef.current = null;
      setActiveDrag(null);
      setHoveredDropId(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [activeDrag, isSubmitted]);

  // -------------------------------------------------------------
  // 1. SELECT OBJECTS (TAP TO COUNT)
  // -------------------------------------------------------------
  const visualObjects = useMemo(() => {
    if (question.visualConfig?.objects?.length) {
      return question.visualConfig.objects.flatMap((o) =>
        Array.from({ length: Math.max(1, o.count || 1) }, (_, i) => {
          const raw = o.emoji || o.label || '🍎';
          const resolved = resolveVisualEmoji(raw);
          return {
            id: `${o.id}-${i}`,
            label: resolved.label,
            emoji: resolved.emoji
          };
        })
      );
    }
    const fixedClips = fixMojibake(question.visualClipart || '🍎 🍎 🍎 🍎 🍎 🍎');
    const clips = fixedClips.split(/\s+/).filter(Boolean);
    return clips.map((item, i) => {
      const resolved = resolveVisualEmoji(item);
      return {
        id: `clip-${i}`,
        label: resolved.label,
        emoji: resolved.emoji
      };
    });
  }, [question]);

  // -------------------------------------------------------------
  // 2. MATCH MAKING PAIRS
  // -------------------------------------------------------------
  const matchPairsConfig = useMemo(() => {
    return question.matchPairs || [
      { left: '🐒 Monkey', right: '🍌 Banana' },
      { left: '🐰 Bunny', right: '🥕 Carrot' },
      { left: '🐶 Puppy', right: '🦴 Bone' }
    ];
  }, [question.matchPairs]);

  const leftItems = useMemo(() => matchPairsConfig.map((p) => p.left), [matchPairsConfig]);
  const rightItems = useMemo(() => {
    // Return deterministic right options
    return [...matchPairsConfig.map((p) => p.right)].sort();
  }, [matchPairsConfig]);

  // -------------------------------------------------------------
  // 3. DRAG & DROP ITEMS
  // -------------------------------------------------------------
  const dragItemsConfig = useMemo(() => {
    return question.dragItems || [
      { item: '🐱 Kitten', target: '🐈 Mama Cat' },
      { item: '🦁 Cub', target: '🦁 Mama Lion' },
      { item: '🐥 Chick', target: '🐔 Mama Hen' }
    ];
  }, [question.dragItems]);

  const unplacedDragItems = useMemo(() => {
    return dragItemsConfig.filter((d) => !userDragPlacements[d.item]);
  }, [dragItemsConfig, userDragPlacements]);

  // -------------------------------------------------------------
  // 4. ORDERING
  // -------------------------------------------------------------
  const initialOrderItems = useMemo(() => {
    return question.orderSequence || question.options || ['1', '2', '3', '4'];
  }, [question.orderSequence, question.options]);

  // Initialize ordering if empty
  useEffect(() => {
    if (type === 'ordering' && userOrderedList.length === 0 && initialOrderItems.length > 0) {
      onUpdateOrderedList([...initialOrderItems]);
    }
  }, [type, initialOrderItems, userOrderedList.length, onUpdateOrderedList]);

  // -------------------------------------------------------------
  // 5. SORTING BUCKETS
  // -------------------------------------------------------------
  const sortBucketsConfig = useMemo(() => {
    return question.sortBuckets || [
      { bucketName: '🧺 Fruit Basket', items: ['🍎 Apple', '🍌 Banana', '🍓 Berry'] },
      { bucketName: '🧸 Toy Box', items: ['🚗 Toy Car', '⚽ Ball', '🎈 Balloon'] }
    ];
  }, [question.sortBuckets]);

  const allSortItems = useMemo(() => {
    return sortBucketsConfig.flatMap((b) => b.items);
  }, [sortBucketsConfig]);

  const unplacedSortItems = useMemo(() => {
    const placed = new Set<string>();
    Object.values(userBuckets).forEach((arr) => arr.forEach((item) => placed.add(item)));
    return allSortItems.filter((it) => !placed.has(it));
  }, [allSortItems, userBuckets]);

  // -------------------------------------------------------------
  // RENDER QUESTION BY TYPE
  // -------------------------------------------------------------
  return (
    <div className="w-full space-y-5">
      {/* Question Visual Clipart & Context Banner (if available) */}
      {(question.visualConfig?.visualInstructions || question.visualClipart) && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200/80 shadow-2xs">
          {question.visualConfig?.visualInstructions ? (
            <div className="inline-flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
              <span>{question.visualConfig.visualInstructions}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-stone-600 font-bold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Fun Learning Activity</span>
            </div>
          )}

          {question.visualClipart && (
            <div className={`text-xl sm:text-2xl px-3 py-1 bg-white/90 rounded-xl border border-amber-200/60 shadow-2xs tracking-wider select-none font-bold ${
              question.visualConfig?.animation === 'bounce' ? 'animate-bounce' :
              question.visualConfig?.animation === 'pulse' ? 'animate-pulse' :
              question.visualConfig?.animation === 'spin' ? 'animate-spin' : ''
            }`}>
              {fixMojibake(question.visualClipart)}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: SELECT_OBJECTS (TAP TO COUNT)
      ------------------------------------------------------------- */}
      {type === 'select_objects' && (
        <div className="w-full max-w-xl mx-auto space-y-4">
          <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 border-2 border-amber-200/80 shadow-sm text-center">
            <div className="text-xs sm:text-sm font-black text-amber-900 uppercase tracking-wider mb-2">
              🍎 Interactive Harvest Orchard
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mb-4 font-bold">
              Tap the items below to count them into your basket!
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 py-2">
              {visualObjects.map((obj, idx) => {
                const isTapped = tappedObjectIds.includes(obj.id);
                const tapOrderIndex = tappedObjectIds.indexOf(obj.id) + 1;

                return (
                  <button
                    key={obj.id}
                    id={`tap-object-${idx}`}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => {
                      playPop();
                      onToggleTapObject(obj.id);
                    }}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
                      isTapped
                        ? 'bg-amber-100/90 border-3 border-amber-500 scale-105 shadow-md -translate-y-1'
                        : 'bg-white border-2 border-stone-200 hover:border-amber-300 hover:scale-105'
                    }`}
                  >
                    <span className={`select-none ${
                      question.visualConfig?.animation === 'pulse' ? 'animate-pulse' :
                      question.visualConfig?.animation === 'spin' ? 'animate-spin' :
                      question.visualConfig?.animation === 'none' ? '' : 'animate-bounce'
                    }`}>{obj.emoji}</span>
                    {isTapped && (
                      <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shadow-sm border-2 border-white animate-in zoom-in">
                        {tapOrderIndex}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-amber-200/60 flex items-center justify-between px-3">
              <span className="text-xs sm:text-sm font-black text-stone-700">
                Items Selected: <strong className="text-amber-600 text-base">{tappedObjectIds.length}</strong>
              </span>
              <span className="text-xs font-bold text-stone-500">
                Goal: {question.openBoxAnswer || question.options[0] || '4'} items
              </span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: DRAG_AND_DROP (BABY ANIMALS TO MAMAS / TARGET ZONES)
      ------------------------------------------------------------- */}
      {type === 'drag_and_drop' && (
        <div className="w-full max-w-2xl mx-auto space-y-4 select-none">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-sky-700 bg-sky-100 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
              <Move className="w-3.5 h-3.5 text-sky-600" />
              <span>Click & drag each item to its target zone (or tap to place)!</span>
            </span>
          </div>

          {/* Unplaced Items Pool (Also acts as drop tray) */}
          <div 
            data-drop-zone-id="__tray__"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setHoveredDropId('__tray__');
            }}
            onDragLeave={() => {
              if (hoveredDropId === '__tray__') setHoveredDropId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setHoveredDropId(null);
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data?.type === 'drag_and_drop') {
                  executeDrop('drag_and_drop', data.itemId, '__tray__');
                }
              } catch {}
            }}
            className={`p-3 sm:p-4 rounded-3xl transition-all border-2 ${
              activeDrag?.isDragging && hoveredDropId === '__tray__'
                ? 'bg-amber-100 border-amber-400 ring-4 ring-amber-300'
                : 'bg-stone-100/90 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2 px-1">
              <span>Items to place:</span>
              <span className="text-[11px] text-stone-400">Drag or tap</span>
            </div>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {unplacedDragItems.length === 0 ? (
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 py-1">
                  <CheckCircle2 className="w-4 h-4" /> All items have been placed in their targets!
                </div>
              ) : (
                unplacedDragItems.map((d) => {
                  const isSelected = selectedDragItem === d.item;
                  const isCurrentlyDragged = activeDrag?.isDragging && activeDrag.itemId === d.item;

                  return (
                    <button
                      key={d.item}
                      type="button"
                      disabled={isSubmitted}
                      draggable={!isSubmitted}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'drag_and_drop', itemId: d.item }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onPointerDown={(e) => startPointerDrag(e, 'drag_and_drop', d.item)}
                      className={`px-4 py-2.5 rounded-2xl font-black text-sm sm:text-base border-2 transition-all cursor-grab active:cursor-grabbing shadow-xs touch-none select-none flex items-center gap-1.5 ${
                        isCurrentlyDragged
                          ? 'opacity-30 border-dashed border-stone-400 scale-95'
                          : isSelected
                          ? 'bg-amber-100 border-amber-500 text-amber-950 scale-105 ring-4 ring-amber-300'
                          : 'bg-white border-stone-300 hover:border-amber-400 hover:scale-102 text-stone-800'
                      }`}
                    >
                      <Move className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{d.item}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Target Zones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dragItemsConfig.map((d) => {
              const placed = Object.entries(userDragPlacements).find(([_, target]) => target === d.target);
              const placedItem = placed ? placed[0] : null;
              const isHoveredTarget = activeDrag?.isDragging && hoveredDropId === d.target;
              const isDragActive = activeDrag?.isDragging && activeDrag.type === 'drag_and_drop';

              return (
                <div
                  key={d.target}
                  data-drop-zone-id={d.target}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setHoveredDropId(d.target);
                  }}
                  onDragLeave={() => {
                    if (hoveredDropId === d.target) setHoveredDropId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHoveredDropId(null);
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data?.type === 'drag_and_drop') {
                        executeDrop('drag_and_drop', data.itemId, d.target);
                      }
                    } catch {}
                  }}
                  onClick={() => {
                    if (isSubmitted) return;
                    if (selectedDragItem) {
                      executeDrop('drag_and_drop', selectedDragItem, d.target);
                    }
                  }}
                  className={`p-4 rounded-3xl border-3 transition-all flex flex-col items-center justify-between min-h-36 text-center cursor-pointer ${
                    isHoveredTarget
                      ? 'bg-sky-100 border-sky-500 ring-4 ring-sky-400 scale-[1.03] shadow-lg'
                      : placedItem
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-sm'
                      : isDragActive
                      ? 'bg-sky-50/60 border-sky-400 border-dashed animate-pulse'
                      : selectedDragItem
                      ? 'bg-sky-50 border-sky-400 border-dashed hover:bg-sky-100/70 scale-[1.02]'
                      : 'bg-white border-stone-200 hover:border-sky-300'
                  }`}
                >
                  <div className="font-black text-sm sm:text-base text-stone-900 mb-2">
                    {d.target}
                  </div>

                  {placedItem ? (
                    <div 
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        startPointerDrag(e, 'drag_and_drop', placedItem, { sourceTarget: d.target });
                      }}
                      draggable={!isSubmitted}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'drag_and_drop', itemId: placedItem }));
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-2xl bg-white border-2 border-emerald-400 text-emerald-950 font-black text-xs sm:text-sm shadow-xs cursor-grab active:cursor-grabbing touch-none select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        <Move className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{placedItem}</span>
                      </div>
                      {!isSubmitted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPop();
                            const next = { ...userDragPlacements };
                            delete next[placedItem];
                            onUpdateDragPlacements(next);
                          }}
                          className="w-5 h-5 rounded-full hover:bg-rose-100 text-stone-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : isHoveredTarget ? (
                    <div className="text-xs font-black text-sky-900 bg-sky-200/90 py-2 px-3 rounded-xl animate-bounce border border-sky-300">
                      📥 Release to drop {activeDrag?.itemId}!
                    </div>
                  ) : isDragActive ? (
                    <div className="text-xs font-bold text-sky-700 py-3">
                      Drop {activeDrag?.itemId} here!
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-stone-400 py-3">
                      {selectedDragItem ? 'Tap to place!' : 'Empty Target'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: MATCH_MAKING (PAIR LEFT WITH RIGHT)
      ------------------------------------------------------------- */}
      {type === 'match_making' && (
        <div className="w-full max-w-xl mx-auto space-y-4 select-none">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
              <Move className="w-3.5 h-3.5 text-purple-600" />
              <span>Click & drag from Left onto Right (or tap to pair)!</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider text-center">
                Animals / Items
              </div>
              {leftItems.map((left) => {
                const matchedRight = userMatchPairs[left];
                const isSelected = selectedMatchLeft === left;
                const isCurrentlyDragged = activeDrag?.isDragging && activeDrag.itemId === left;

                return (
                  <button
                    key={left}
                    type="button"
                    disabled={isSubmitted}
                    draggable={!isSubmitted}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'match_making', itemId: left }));
                      e.dataTransfer.effectAllowed = 'link';
                    }}
                    onPointerDown={(e) => startPointerDrag(e, 'match_making', left)}
                    className={`w-full p-3 sm:p-4 rounded-2xl border-2 text-left font-black text-xs sm:text-sm transition-all cursor-grab active:cursor-grabbing shadow-xs flex items-center justify-between touch-none select-none ${
                      isCurrentlyDragged
                        ? 'opacity-30 border-dashed border-purple-400 scale-98'
                        : isSelected
                        ? 'bg-purple-100 border-purple-500 text-purple-950 scale-102 ring-4 ring-purple-300'
                        : matchedRight
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-white border-stone-200 hover:border-purple-300 hover:scale-[1.01] text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Move className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>{left}</span>
                    </div>
                    {matchedRight && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Column (Drop Targets) */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-stone-500 uppercase tracking-wider text-center">
                Favorite Foods / Matches
              </div>
              {rightItems.map((right) => {
                const matchedLeft = Object.entries(userMatchPairs).find(([_, r]) => r === right)?.[0];
                const isHoveredTarget = activeDrag?.isDragging && hoveredDropId === right;

                return (
                  <button
                    key={right}
                    type="button"
                    data-drop-zone-id={right}
                    disabled={isSubmitted}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'link';
                      setHoveredDropId(right);
                    }}
                    onDragLeave={() => {
                      if (hoveredDropId === right) setHoveredDropId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoveredDropId(null);
                      try {
                        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                        if (data?.type === 'match_making') {
                          executeDrop('match_making', data.itemId, right);
                        }
                      } catch {}
                    }}
                    onClick={() => {
                      if (!selectedMatchLeft) return;
                      executeDrop('match_making', selectedMatchLeft, right);
                    }}
                    className={`w-full p-3 sm:p-4 rounded-2xl border-2 text-left font-black text-xs sm:text-sm transition-all cursor-pointer shadow-xs flex items-center justify-between ${
                      isHoveredTarget
                        ? 'bg-purple-100 border-purple-500 ring-4 ring-purple-300 scale-102 shadow-md'
                        : matchedLeft
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : selectedMatchLeft || activeDrag?.isDragging
                        ? 'bg-purple-50/60 border-purple-300 hover:bg-purple-100 text-purple-900 border-dashed'
                        : 'bg-white border-stone-200 text-stone-700 opacity-70'
                    }`}
                  >
                    <span>{right}</span>
                    {isHoveredTarget ? (
                      <span className="text-[10px] font-black text-purple-800 bg-purple-200 px-2 py-0.5 rounded-md animate-pulse">
                        Drop to match!
                      </span>
                    ) : matchedLeft ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        Paired
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formed Matches Summary */}
          {Object.keys(userMatchPairs).length > 0 && (
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex flex-wrap gap-2 items-center justify-center">
              {Object.entries(userMatchPairs).map(([l, r]) => (
                <div
                  key={l}
                  className="px-3 py-1 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-800 flex items-center gap-2 shadow-2xs"
                >
                  <span>{l} ➔ {r}</span>
                  {!isSubmitted && (
                    <button
                      type="button"
                      onClick={() => {
                        playPop();
                        const next = { ...userMatchPairs };
                        delete next[l];
                        onUpdateMatchPairs(next);
                      }}
                      className="text-stone-400 hover:text-rose-500 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: ORDERING (ARRANGE IN SEQUENCE)
      ------------------------------------------------------------- */}
      {type === 'ordering' && (
        <div className="w-full max-w-xl mx-auto space-y-4 select-none">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
              <Move className="w-3.5 h-3.5 text-emerald-600" />
              <span>Drag cards to reorder sequence (or tap to swap)!</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {userOrderedList.map((item, idx) => {
              const isSelected = selectedOrderIdx === idx;
              const isCurrentlyDragged = activeDrag?.isDragging && activeDrag.itemId === item;
              const isHoveredTarget = activeDrag?.isDragging && hoveredDropId === `order-${idx}`;
              const stepLabel = ['1st', '2nd', '3rd', '4th', '5th', '6th'][idx] || `${idx + 1}`;

              return (
                <div
                  key={`${item}-${idx}`}
                  data-drop-zone-id={`order-${idx}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setHoveredDropId(`order-${idx}`);
                  }}
                  onDragLeave={() => {
                    if (hoveredDropId === `order-${idx}`) setHoveredDropId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHoveredDropId(null);
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data?.type === 'ordering') {
                        executeDrop('ordering', data.itemId, `order-${idx}`, data.itemData);
                      }
                    } catch {}
                  }}
                  className={`relative flex flex-col items-center p-3 sm:p-4 rounded-3xl border-2 transition-all min-w-[80px] sm:min-w-[100px] ${
                    isHoveredTarget
                      ? 'bg-amber-100 border-amber-500 ring-4 ring-amber-400 scale-105 shadow-md'
                      : isCurrentlyDragged
                      ? 'opacity-30 border-dashed border-amber-400 scale-95'
                      : isSelected
                      ? 'bg-amber-100 border-amber-500 ring-4 ring-amber-300 scale-105'
                      : 'bg-white border-stone-200 hover:border-amber-300 shadow-xs'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mb-1">
                    {stepLabel}
                  </span>

                  <button
                    type="button"
                    disabled={isSubmitted}
                    draggable={!isSubmitted}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'ordering', itemId: item, itemData: { idx } }));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onPointerDown={(e) => startPointerDrag(e, 'ordering', item, { idx })}
                    className="text-2xl sm:text-3xl font-black text-stone-900 py-2 cursor-grab active:cursor-grabbing touch-none select-none flex items-center gap-1"
                  >
                    <span>{item}</span>
                  </button>

                  {!isSubmitted && (
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          playPop();
                          const copy = [...userOrderedList];
                          const temp = copy[idx - 1];
                          copy[idx - 1] = copy[idx];
                          copy[idx] = temp;
                          onUpdateOrderedList(copy);
                        }}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black flex items-center justify-center disabled:opacity-20 cursor-pointer"
                        title="Move Left"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        disabled={idx === userOrderedList.length - 1}
                        onClick={() => {
                          playPop();
                          const copy = [...userOrderedList];
                          const temp = copy[idx + 1];
                          copy[idx + 1] = copy[idx];
                          copy[idx] = temp;
                          onUpdateOrderedList(copy);
                        }}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-black flex items-center justify-center disabled:opacity-20 cursor-pointer"
                        title="Move Right"
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: SORTING (BUCKET CATEGORIES)
      ------------------------------------------------------------- */}
      {type === 'sorting' && (
        <div className="w-full max-w-2xl mx-auto space-y-4 select-none">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
              <Move className="w-3.5 h-3.5 text-amber-600" />
              <span>Click & drag items to drop into baskets (or tap to place)!</span>
            </span>
          </div>

          {/* Unplaced Items Pool (Also acts as drop tray to return items) */}
          <div 
            data-drop-zone-id="__tray__"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setHoveredDropId('__tray__');
            }}
            onDragLeave={() => {
              if (hoveredDropId === '__tray__') setHoveredDropId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setHoveredDropId(null);
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data?.type === 'sorting') {
                  executeDrop('sorting', data.itemId, '__tray__');
                }
              } catch {}
            }}
            className={`p-3 sm:p-4 rounded-3xl transition-all border-2 ${
              activeDrag?.isDragging && hoveredDropId === '__tray__'
                ? 'bg-amber-100 border-amber-400 ring-4 ring-amber-300'
                : 'bg-stone-100/90 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2 px-1">
              <span>Items to sort:</span>
              <span className="text-[11px] text-stone-400">Click & hold icon to drag</span>
            </div>
            <div className="flex flex-wrap gap-2.5 justify-center">
              {unplacedSortItems.length === 0 ? (
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 py-1">
                  <CheckCircle2 className="w-4 h-4" /> All items have been placed into baskets!
                </div>
              ) : (
                unplacedSortItems.map((item) => {
                  const isSelected = selectedSortItem === item;
                  const isCurrentlyDragged = activeDrag?.isDragging && activeDrag.itemId === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={isSubmitted}
                      draggable={!isSubmitted}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'sorting', itemId: item }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onPointerDown={(e) => startPointerDrag(e, 'sorting', item)}
                      className={`px-4 py-2.5 rounded-2xl font-black text-sm sm:text-base border-2 transition-all cursor-grab active:cursor-grabbing shadow-xs touch-none select-none flex items-center gap-1.5 ${
                        isCurrentlyDragged
                          ? 'opacity-30 border-dashed border-amber-400 scale-95'
                          : isSelected
                          ? 'bg-amber-100 border-amber-500 text-amber-950 scale-105 ring-4 ring-amber-300'
                          : 'bg-white border-stone-300 hover:border-amber-400 hover:scale-102 text-stone-800'
                      }`}
                    >
                      <Move className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{item}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Buckets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortBucketsConfig.map((bucket) => {
              const bucketItems = userBuckets[bucket.bucketName] || [];
              const isHoveredTarget = activeDrag?.isDragging && hoveredDropId === bucket.bucketName;
              const isDragActive = activeDrag?.isDragging && activeDrag.type === 'sorting';

              return (
                <div
                  key={bucket.bucketName}
                  data-drop-zone-id={bucket.bucketName}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setHoveredDropId(bucket.bucketName);
                  }}
                  onDragLeave={() => {
                    if (hoveredDropId === bucket.bucketName) setHoveredDropId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHoveredDropId(null);
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      if (data?.type === 'sorting') {
                        executeDrop('sorting', data.itemId, bucket.bucketName);
                      }
                    } catch {}
                  }}
                  onClick={() => {
                    if (isSubmitted) return;
                    if (selectedSortItem) {
                      executeDrop('sorting', selectedSortItem, bucket.bucketName);
                    }
                  }}
                  className={`p-4 rounded-3xl border-3 transition-all min-h-44 flex flex-col justify-between cursor-pointer ${
                    isHoveredTarget
                      ? 'bg-amber-100/95 border-amber-500 ring-4 ring-amber-400 scale-[1.03] shadow-lg'
                      : isDragActive
                      ? 'bg-amber-50/50 border-amber-400 border-dashed hover:border-amber-500'
                      : selectedSortItem
                      ? 'bg-amber-50/70 border-amber-400 border-dashed hover:bg-amber-100/80 scale-[1.01]'
                      : 'bg-white border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <div>
                    <div className="font-black text-base sm:text-lg text-stone-900 mb-2 pb-2 border-b border-stone-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>{bucket.bucketName}</span>
                      </div>
                      <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                        {bucketItems.length} items
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 py-2">
                      {bucketItems.length === 0 ? (
                        <div className="text-xs font-bold text-stone-400 py-3 italic">
                          Basket is currently empty. Drop items here!
                        </div>
                      ) : (
                        bucketItems.map((item) => (
                          <div
                            key={item}
                            draggable={!isSubmitted}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'sorting', itemId: item, sourceBucket: bucket.bucketName }));
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              startPointerDrag(e, 'sorting', item, { sourceBucket: bucket.bucketName });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-black text-stone-800 flex items-center gap-2 shadow-2xs cursor-grab active:cursor-grabbing touch-none select-none hover:border-amber-400"
                          >
                            <Move className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{item}</span>
                            {!isSubmitted && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPop();
                                  const next = { ...userBuckets };
                                  next[bucket.bucketName] = next[bucket.bucketName].filter((x) => x !== item);
                                  onUpdateBuckets(next);
                                }}
                                className="text-stone-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                                title="Remove item"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {isHoveredTarget ? (
                    <div className="text-center text-xs font-black text-amber-950 bg-amber-200/90 py-2 rounded-xl mt-2 animate-bounce border border-amber-300">
                      📥 Release to drop <strong>{activeDrag?.itemId}</strong> in {bucket.bucketName}!
                    </div>
                  ) : isDragActive ? (
                    <div className="text-center text-xs font-bold text-amber-700 bg-amber-50 py-1.5 rounded-xl mt-2 border border-dashed border-amber-300">
                      Drop <strong>{activeDrag?.itemId}</strong> here!
                    </div>
                  ) : selectedSortItem ? (
                    <div className="text-center text-xs font-bold text-amber-700 bg-amber-100/80 py-1.5 rounded-xl mt-2 animate-pulse">
                      Tap here to put <strong>{selectedSortItem}</strong> in this bucket!
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: OPEN_BOX / FILL_BLANK (INLINE EQUATION / TEXT INPUT)
      ------------------------------------------------------------- */}
      {(type === 'open_box' || type === 'fill_blank') && (
        <div className="w-full max-w-xl mx-auto space-y-4">
          {/* If the prompt has a blank/fill-in placeholder or math equation, show the focused formula box */}
          {(question.prompt.includes('__') || question.prompt.includes('...') || question.prompt.includes('=')) ? (
            <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-3.5 sm:p-4.5 flex flex-wrap items-center justify-center gap-2.5 text-lg sm:text-xl font-black text-stone-900 shadow-2xs">
              <span className="leading-snug text-center">
                {question.prompt.includes('__') ? (
                  question.prompt.split('__')[0]
                ) : question.prompt.includes('...') ? (
                  question.prompt.split('...')[0]
                ) : (
                  question.prompt
                )}
              </span>
              {/* The inline answer box */}
              <input
                id="fill-blank-input"
                type="text"
                disabled={isSubmitted}
                value={openBoxInput}
                onChange={(e) => onChangeOpenBoxInput(e.target.value)}
                placeholder="?"
                className="w-24 sm:w-32 text-center text-xl sm:text-2xl font-black tracking-wider py-1 px-3 rounded-xl border-3 border-amber-500 focus:outline-none focus:ring-3 focus:ring-amber-300 bg-white text-stone-900 shadow-inner"
              />
              {question.prompt.includes('__') && question.prompt.split('__')[1] && (
                <span>{question.prompt.split('__')[1]}</span>
              )}
              {question.prompt.includes('...') && question.prompt.split('...')[1] && (
                <span>{question.prompt.split('...')[1]}</span>
              )}
            </div>
          ) : (!question.options || question.options.length <= 1) ? (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
              <label htmlFor="fill-blank-input" className="block text-xs font-bold text-amber-800 uppercase tracking-wider">
                Type your answer below:
              </label>
              <input
                id="fill-blank-input"
                type="text"
                disabled={isSubmitted}
                value={openBoxInput}
                onChange={(e) => onChangeOpenBoxInput(e.target.value)}
                placeholder="Enter answer here..."
                className="w-full max-w-sm mx-auto text-center text-xl font-bold py-2.5 px-4 rounded-xl border-2 border-amber-400 focus:outline-none focus:ring-3 focus:ring-amber-200 bg-white text-stone-900 shadow-xs"
              />
            </div>
          ) : null}

          {/* Quick-Select Options below (if options are provided) */}
          {question.options && question.options.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider text-center">
                Select your answer:
              </div>
              <div className={`grid gap-2.5 ${question.options.length > 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'}`}>
                {question.options.map((opt, oIdx) => {
                  const isSelected = (selectedOption === oIdx) || (openBoxInput.trim().toLowerCase() === opt.trim().toLowerCase() && openBoxInput.trim() !== '');
                  const targetAnswer = (question.openBoxAnswer || question.options[question.correctIndex] || question.options[0] || '').trim().toLowerCase();
                  const isTarget = opt.trim().toLowerCase() === targetAnswer;

                  let optClass = 'bg-white border-2 border-stone-200 hover:border-amber-400 hover:bg-amber-50/60 text-stone-800';
                  if (isSubmitted) {
                    if (isTarget) {
                      optClass = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-300/50 shadow-md';
                    } else if (isSelected && !isTarget) {
                      optClass = 'bg-rose-50 border-2 border-rose-400 text-rose-900';
                    } else {
                      optClass = 'bg-stone-50 border-2 border-stone-200 text-stone-400 opacity-50';
                    }
                  } else if (isSelected) {
                    optClass = 'bg-amber-500 border-2 border-amber-600 text-stone-950 font-black shadow-md ring-4 ring-amber-300/50 scale-[1.01]';
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => {
                        playPop();
                        onChangeOpenBoxInput(opt);
                        if (onSelectOption) onSelectOption(oIdx);
                      }}
                      className={`py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-between text-left gap-2 ${optClass}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-black flex items-center justify-center shrink-0 border border-stone-200">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {isSelected && !isSubmitted && <span className="font-black text-amber-950">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Number Pad ONLY when no options are given and numeric input is needed */}
          {!isSubmitted && (!question.options || question.options.length <= 1) && (
            <div className="bg-stone-100 p-3 rounded-2xl border border-stone-200 shadow-inner max-w-sm mx-auto">
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      playPop();
                      if (key === 'clear') {
                        onChangeOpenBoxInput('');
                      } else if (key === 'backspace') {
                        onChangeOpenBoxInput(openBoxInput.slice(0, -1));
                      } else {
                        if (openBoxInput.length < 8) {
                          onChangeOpenBoxInput(openBoxInput + key);
                        }
                      }
                    }}
                    className={`py-2 rounded-xl font-black text-base transition-all shadow-2xs active:scale-95 cursor-pointer ${
                      key === 'clear'
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs'
                        : key === 'backspace'
                        ? 'bg-stone-300 hover:bg-stone-400 text-stone-900 text-xs'
                        : 'bg-white hover:bg-amber-50 hover:text-amber-900 border border-stone-200 text-stone-800'
                    }`}
                  >
                    {key === 'clear' ? 'CLEAR' : key === 'backspace' ? '⌫ DEL' : key}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: TRUE_FALSE (TWO FRIENDLY PRESCHOOL BUTTONS)
      ------------------------------------------------------------- */}
      {type === 'true_false' && (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
          {question.options.slice(0, 2).map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === question.correctIndex;
            const isTrueBtn = idx === 0;

            let cardStyle = isTrueBtn
              ? 'bg-white hover:bg-emerald-50/60 border-stone-200 hover:border-emerald-400 text-stone-900'
              : 'bg-white hover:bg-amber-50/60 border-stone-200 hover:border-amber-400 text-stone-900';

            if (isSubmitted) {
              if (isCorrectOption) {
                cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-400/40 scale-[1.02] shadow-md';
              } else if (isSelected && !isCorrectOption) {
                cardStyle = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400';
              } else {
                cardStyle = 'bg-stone-50 border-stone-200 text-stone-400 opacity-40';
              }
            } else if (isSelected) {
              cardStyle = isTrueBtn
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-400/40 scale-[1.02] shadow-md'
                : 'bg-amber-50 border-amber-500 text-amber-950 font-black ring-4 ring-amber-400/40 scale-[1.02] shadow-md';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted}
                onClick={() => {
                  playPop();
                  onSelectOption(idx);
                }}
                className={`p-6 sm:p-8 rounded-3xl border-3 text-center transition-all flex flex-col items-center justify-center gap-3.5 cursor-pointer shadow-sm active:scale-95 ${cardStyle}`}
              >
                <span className="text-5xl sm:text-6xl drop-shadow-xs">{isTrueBtn ? '👍' : '👎'}</span>
                <span className="text-lg sm:text-xl font-black tracking-tight leading-snug">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: IMAGE_CHOICE (4 PICTURE CARDS)
      ------------------------------------------------------------- */}
      {type === 'image_choice' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === question.correctIndex;
            const optionClipart = getOptionClipart(option, '🌟');

            let cardStyle = 'bg-white border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 text-stone-800';

            if (isSubmitted) {
              if (isCorrectOption) {
                cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black ring-4 ring-emerald-400/40 scale-[1.02] shadow-md';
              } else if (isSelected && !isCorrectOption) {
                cardStyle = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400';
              } else {
                cardStyle = 'bg-stone-50 border-stone-200 text-stone-400 opacity-40';
              }
            } else if (isSelected) {
              cardStyle = 'bg-amber-50 border-amber-500 text-amber-950 font-black ring-4 ring-amber-400/40 scale-[1.02] shadow-md';
            }

            return (
              <button
                key={idx}
                id={`image-option-btn-${idx}`}
                disabled={isSubmitted}
                onClick={() => {
                  playPop();
                  onSelectOption(idx);
                }}
                className={`p-4 sm:p-5 rounded-3xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2.5 cursor-pointer shadow-xs ${cardStyle}`}
              >
                <div className="text-4xl sm:text-5xl py-1 transform transition-transform hover:scale-110 drop-shadow-xs">
                  {optionClipart}
                </div>
                <span className="font-black text-base sm:text-lg leading-snug">{option}</span>
                {isSubmitted && isCorrectOption && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct!
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE: MULTIPLE_CHOICE / RADIO_SINGLE / NUMBER_LINE / CLOCK / WORD_PROBLEM / DATA_GRAPH / FALLBACK
      ------------------------------------------------------------- */}
      {(['multiple_choice', 'radio_single', 'number_line', 'clock', 'word_problem', 'data_graph', 'interactive'].includes(type) || 
        (!['select_objects', 'drag_and_drop', 'match_making', 'ordering', 'sorting', 'fill_blank', 'open_box', 'true_false', 'image_choice'].includes(type) && question.options && question.options.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full">
          {(question.options && question.options.length > 0 ? question.options : ['Option A', 'Option B', 'Option C', 'Option D']).map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectOption = idx === question.correctIndex;
            const optionClipart = getOptionClipart(option, '');

            let cardStyle = 'bg-white hover:bg-[#f8faff] border-[#e1e6f1] hover:border-[#10246f]/50 text-[#10246f] shadow-xs';

            if (isSubmitted) {
              if (isCorrectOption) {
                cardStyle = 'bg-[#ecfdf5] border-[#16c47f] text-[#065f46] font-bold ring-2 ring-[#16c47f]/40 shadow-sm';
              } else if (isSelected && !isCorrectOption) {
                cardStyle = 'bg-[#fff1f2] border-[#f43f5e] text-[#9f1239] ring-2 ring-[#f43f5e]/40';
              } else {
                cardStyle = 'bg-[#f8faff] border-[#e1e6f1] text-stone-400 opacity-40';
              }
            } else if (isSelected) {
              cardStyle = 'bg-[#fdf2f8] border-[#f20b86] text-[#10246f] font-bold ring-2 ring-[#f20b86]/30 shadow-sm scale-[1.01]';
            }

            return (
              <button
                key={idx}
                id={`option-btn-${idx}`}
                disabled={isSubmitted}
                onClick={() => {
                  playPop();
                  onSelectOption(idx);
                }}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-[#f20b86] text-white border-[#f20b86]'
                        : isSubmitted && isCorrectOption
                        ? 'bg-[#16c47f] text-white border-[#16c47f]'
                        : 'bg-[#f8faff] text-[#10246f] border-[#e1e6f1]'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  
                  {optionClipart && !option.includes(optionClipart) && (
                    <span className="text-xl sm:text-2xl shrink-0 drop-shadow-2xs">
                      {optionClipart}
                    </span>
                  )}

                  <span className="font-bold text-sm sm:text-base text-[#10246f] break-words leading-snug">
                    {option}
                  </span>
                </div>

                {isSubmitted && isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-[#16c47f] shrink-0 ml-2" />
                )}
                {isSubmitted && isSelected && !isCorrectOption && (
                  <span className="w-5 h-5 rounded-full bg-[#f43f5e] text-white flex items-center justify-center text-xs font-bold shrink-0 ml-2">
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------
          FLOATING DRAG PREVIEW (FOLLOWS CURSOR / TOUCH POINTER)
      ------------------------------------------------------------- */}
      {activeDrag?.isDragging && (
        <div
          style={{
            position: 'fixed',
            left: `${activeDrag.currentX}px`,
            top: `${activeDrag.currentY}px`,
            transform: 'translate(-50%, -50%) rotate(-4deg) scale(1.12)',
            pointerEvents: 'none',
            zIndex: 99999,
          }}
          className="px-4 py-2.5 rounded-2xl bg-white/95 border-3 border-amber-500 text-stone-950 font-black text-sm sm:text-base shadow-2xl ring-4 ring-amber-300/70 flex items-center gap-2 select-none pointer-events-none"
        >
          <Move className="w-4 h-4 text-amber-600 animate-spin" />
          <span>{activeDrag.itemId}</span>
          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Release to Drop
          </span>
        </div>
      )}
    </div>
  );
}
