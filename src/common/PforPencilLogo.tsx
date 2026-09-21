import React from 'react';

interface PforPencilLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export default function PforPencilLogo({ 
  size = 'md', 
  showSubtitle = false,
  className = '' 
}: PforPencilLogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="relative inline-flex items-center gap-1.5 py-1 px-2 rounded-2xl bg-gradient-to-b from-stone-50 via-white to-purple-50/30 border border-purple-100 shadow-sm">
        {/* Colorful tear drops on top */}
        <div className="absolute -top-3 left-6 flex items-center gap-1 pointer-events-none">
          <span className="w-1.5 h-2.5 rounded-full bg-purple-500 transform -rotate-12" />
          <span className="w-2 h-3.5 rounded-full bg-amber-400 transform -rotate-6" />
          <span className="w-2 h-3.5 rounded-full bg-pink-500 transform rotate-6" />
          <span className="w-1.5 h-2.5 rounded-full bg-cyan-400 transform rotate-12" />
        </div>

        {/* 3D Purple P Badge */}
        <div className={`rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white font-black flex items-center justify-center shadow-md shadow-purple-500/30 transform -rotate-3 ${
          isSm ? 'w-7 h-7 text-base' : isLg ? 'w-12 h-12 text-2xl' : 'w-9 h-9 text-xl'
        }`}>
          P
        </div>

        {/* Pink "for" text */}
        <span className={`font-extrabold text-[#E91E63] italic ${
          isSm ? 'text-xs' : isLg ? 'text-xl' : 'text-base'
        }`}>
          for
        </span>

        {/* Teal 3D "Pencil" Pill */}
        <div className={`rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500 text-white font-extrabold flex items-center justify-center shadow-md shadow-teal-500/25 tracking-tight ${
          isSm ? 'px-2 py-0.5 text-xs' : isLg ? 'px-4 py-2 text-xl' : 'px-3 py-1 text-base'
        }`}>
          Pencil
        </div>
      </div>

      {showSubtitle && (
        <span className={`text-stone-500 font-bold tracking-wide ${
          isSm ? 'text-[9px]' : isLg ? 'text-xs mt-1' : 'text-[10px] mt-0.5'
        }`}>
          Preschool to Grade 8 Learning
        </span>
      )}
    </div>
  );
}
