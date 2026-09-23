import React, { useRef, useState, useEffect } from 'react';
import { CanvasTracingActivity, TracingPath } from '../types';
import { sounds } from '../../../utils/audio';
import { CheckCircle2, RotateCcw, HelpCircle, Sparkles, Pencil, Eraser } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CanvasTracingEngineProps {
  activity: CanvasTracingActivity;
  onComplete: (score: number) => void;
}

export default function CanvasTracingEngine({ activity, onComplete }: CanvasTracingEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawnPointsCount, setDrawnPointsCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const activePath: TracingPath = activity.paths[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = activity.strokeColor || '#3b82f6';
    ctx.lineWidth = 14;
  }, [activity]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawnPointsCount((c) => c + 1);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setDrawnPointsCount((c) => c + 1);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    sounds.click();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnPointsCount(0);
    setIsCompleted(false);
    setErrorFeedback(null);
  };

  const handleVerifyTracing = () => {
    if (drawnPointsCount < 25) {
      sounds.playWrong();
      setErrorFeedback('Trace the entire figure following the checkpoints to complete the stroke!');
      return;
    }

    sounds.playHappyCelebration();
    setIsCompleted(true);
    setErrorFeedback(null);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    onComplete(100);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200">
        <div className="text-xs text-slate-700 font-bold">
          Character: <span className="text-blue-900 font-mono text-base font-black">{activity.characterOrShape}</span>
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
            onClick={handleClear}
            className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear Canvas</span>
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
            <span>Beautiful Tracing Completed!</span>
          </div>
          <p className="text-xs text-emerald-700">
            You accurately formed the figure following the checkpoints.
          </p>
        </div>
      )}

      {/* Tracing Canvas Stage */}
      <div className="relative bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-sm h-[320px] sm:h-[380px] flex items-center justify-center">
        {/* Background SVG Guide Path */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
          <svg viewBox={activePath.viewBox} className="w-full h-full p-6 stroke-slate-300 fill-none" strokeWidth="24" strokeDasharray="10 8" strokeLinecap="round">
            <path d={activePath.guideSvgPath} />
          </svg>
        </div>

        {/* Checkpoints with order numbers */}
        {activePath.checkpoints.map((cp) => (
          <div
            key={cp.order}
            style={{ left: `${cp.x}%`, top: `${cp.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-[10px] flex items-center justify-center shadow-md pointer-events-none z-10"
          >
            {cp.order}
          </div>
        ))}

        {/* Interactive drawing canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-20"
        />
      </div>

      {/* Complete Button */}
      {!isCompleted && (
        <button
          type="button"
          onClick={handleVerifyTracing}
          className="w-full py-3.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-101 active:scale-99"
        >
          <Sparkles className="w-4 h-4" />
          <span>Verify Tracing Stroke</span>
        </button>
      )}
    </div>
  );
}
