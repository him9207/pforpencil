import React from 'react';
import { Sprout, Quote } from 'lucide-react';

interface PortalFooterBannerProps {
  variant: 'school' | 'teacher' | 'parent' | 'student';
}

export default function PortalFooterBanner({ variant }: PortalFooterBannerProps) {
  if (variant === 'school') {
    return (
      <div className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-100/60 via-teal-50/70 to-emerald-100/40 p-4 sm:p-5 border border-emerald-200/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Soft decorative background circles */}
        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-200/40 pointer-events-none blur-xl" />
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-amber-200/30 pointer-events-none blur-xl" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-emerald-700" />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-emerald-950">
            Better mathematical foundations for a brighter tomorrow.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <span className="font-extrabold text-sm tracking-tight text-emerald-900">
            PforPencil
          </span>
          <Sprout className="w-4 h-4 text-emerald-600" />
        </div>
      </div>
    );
  }

  if (variant === 'teacher') {
    return (
      <div className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-emerald-50/50 p-4 sm:p-5 border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-emerald-200/30 pointer-events-none blur-2xl" />
        
        <div className="flex items-center gap-3.5 relative z-10 max-w-2xl">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Quote className="w-4 h-4 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 italic">
              "Mathematics gives us the power to understand, explore and shape the world."
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              — A brighter tomorrow with PforPencil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 relative z-10 shrink-0">
          <span>Small steps</span>
          <span className="text-emerald-600 font-bold">Big progress</span>
          <Sprout className="w-4 h-4 text-emerald-600 ml-0.5" />
        </div>
      </div>
    );
  }

  if (variant === 'parent') {
    return (
      <div className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-emerald-50/60 p-4 sm:p-5 border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-amber-100/90 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
            <Sprout className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Support today. A brighter tomorrow.
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-600">
              Your encouragement helps build confidence and a love for learning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 text-xs font-bold text-slate-700">
          <span className="text-amber-800">P for Pencil</span>
          <span className="text-slate-300">·</span>
          <span className="text-emerald-700">Family Growth</span>
        </div>
      </div>
    );
  }

  // Student variant
  return (
    <div className="mt-8 pt-4 pb-2 border-t border-slate-200/60 flex items-center justify-end gap-2 text-xs font-semibold text-slate-600">
      <span>Small Steps</span>
      <span className="text-emerald-700 font-bold">Big Progress</span>
      <Sprout className="w-4 h-4 text-emerald-600" />
    </div>
  );
}
