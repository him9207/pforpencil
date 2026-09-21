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

  const logoWidth = isSm ? '130px' : isLg ? '220px' : '175px';

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <img
        src="/assets/pforpencil-logo.svg"
        alt="P for Pencil"
        style={{ width: logoWidth, height: 'auto', objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const n = e.currentTarget.nextElementSibling as HTMLElement | null;
          if (n) n.style.display = 'inline-flex';
        }}
      />
      <span className="text-xl font-black text-[#101d5d] tracking-tight" style={{ display: 'none' }}>
        P<b className="text-[#ed197b]">for</b>Pencil
      </span>

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

