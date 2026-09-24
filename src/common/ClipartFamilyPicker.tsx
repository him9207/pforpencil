import React, { useState } from 'react';
import { CLIPART_REGISTRY, CLIPART_FAMILIES, ClipartCategory, ClipartItem, getClipartsByCategory } from '../data/clipartRegistry';
import { ClipartImage } from './ClipartRenderer';

interface ClipartFamilyPickerProps {
  onSelect: (tag: string, item: ClipartItem) => void;
  selectedTag?: string;
  compact?: boolean;
  className?: string;
  label?: string;
}

export const ClipartFamilyPicker: React.FC<ClipartFamilyPickerProps> = ({
  onSelect,
  compact = false,
  className = '',
  label = 'Insert Clipart'
}) => {
  const [activeCategory, setActiveCategory] = useState<ClipartCategory>('fruits');
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);

  const items = getClipartsByCategory(activeCategory);

  return (
    <div className={`p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs space-y-2 ${className}`}>
      {/* Header with Active Family & Toggle if compact */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1">
            <span>🎨</span> {label}:
          </span>
          <span className="text-[10px] text-amber-800 bg-amber-100/90 font-bold px-2 py-0.5 rounded-full border border-amber-300/60">
            {CLIPART_REGISTRY.length} Vector Cliparts
          </span>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
          >
            {isExpanded ? 'Collapse' : 'Browse Families'}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Family / Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {CLIPART_FAMILIES.map(fam => {
              const isActive = fam.id === activeCategory;
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => setActiveCategory(fam.id)}
                  className={`px-2 py-1 rounded-xl font-bold text-[10px] sm:text-[11px] whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-black shadow-xs ring-2 ring-amber-300'
                      : 'bg-white text-stone-700 hover:bg-amber-100/80 border border-stone-200'
                  }`}
                  title={fam.description}
                >
                  <span>{fam.icon}</span>
                  <span>{fam.name}</span>
                </button>
              );
            })}
          </div>

          {/* Clipart Items in Selected Family */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-200/60">
            {items.map(c => {
              const tag = `[${c.keywords[0]}]`;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(tag, c)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-amber-200 bg-white hover:bg-amber-100 hover:border-amber-400 text-[11px] font-bold text-stone-800 cursor-pointer shadow-2xs transition active:scale-95 group"
                  title={`Insert ${c.name} (${tag})`}
                >
                  <ClipartImage clipart={c} size="xs" className="group-hover:scale-110 transition-transform" />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
