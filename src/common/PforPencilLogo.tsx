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
        src="/assets/pforpencil-logo.png"
        alt="P for Pencil"
        style={{ width: logoWidth, height: 'auto', objectFit: 'contain' }}
        onError={(e) => {
          e.currentTarget.src = '/assets/pforpencil-logo.svg';
        }}
      />
      <span className="text-xl font-black text-[#10246f] tracking-tight" style={{ display: 'none' }}>
        P<b className="text-[#f20b86]">for</b>Pencil
      </span>

      {showSubtitle && (
        <span className={`text-[#59627a] font-semibold tracking-wide ${
          isSm ? 'text-[9px]' : isLg ? 'text-xs mt-1' : 'text-[10px] mt-0.5'
        }`}>
          Practice Today. Brighter Tomorrows.
        </span>
      )}
    </div>
  );
}

