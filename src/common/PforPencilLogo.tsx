import React, { useState } from 'react';

interface PforPencilLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

/**
 * P for Pencil Brand Logo
 * Loads the authentic high-resolution image asset (`/pforpencil-logo.png`),
 * with automatic fallback to vector rendering if image fails.
 * 
 * Every page/portal across the platform imports this single component:
 * - HomePage
 * - Navbar
 * - Student Portal (including Question Arena)
 * - Teacher / School / Parent Portals
 * - Auth Modals
 */
export default function PforPencilLogo({ 
  size = 'md', 
  showSubtitle = false,
  className = '' 
}: PforPencilLogoProps) {
  const [imageError, setImageError] = useState(false);

  // Height configurations optimized for crisp display across viewports
  const sizeMap = {
    xs: { hClass: 'h-8 sm:h-9', width: 110, height: 43 },
    sm: { hClass: 'h-10 sm:h-11', width: 140, height: 55 },
    md: { hClass: 'h-12 sm:h-14', width: 180, height: 71 },
    lg: { hClass: 'h-16 sm:h-18', width: 230, height: 90 },
    xl: { hClass: 'h-20 sm:h-24', width: 300, height: 118 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      {!imageError ? (
        <img
          src="/pforpencil-logo.png"
          alt="P for Pencil Logo"
          className={`${currentSize.hClass} w-auto object-contain drop-shadow-xs transition-transform duration-200 hover:scale-102`}
          onError={() => setImageError(true)}
          draggable={false}
        />
      ) : (
        /* Vector Fallback if PNG is unavailable */
        <svg
          viewBox="0 0 840 330"
          width={currentSize.width}
          height={currentSize.height}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible drop-shadow-xs"
          style={{ aspectRatio: '840 / 330' }}
          aria-label="P for Pencil Logo"
        >
          <defs>
            <linearGradient id="fallbackBlue" x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0%" stopColor="#5599F8" />
              <stop offset="100%" stopColor="#2467D4" />
            </linearGradient>
            <linearGradient id="fallbackGreen" x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0%" stopColor="#80B892" />
              <stop offset="100%" stopColor="#508360" />
            </linearGradient>
            <linearGradient id="fallbackCoral" x1="0" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#FFA299" />
              <stop offset="100%" stopColor="#EF6458" />
            </linearGradient>
            <radialGradient id="fallbackYellow" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFF280" />
              <stop offset="100%" stopColor="#F2A007" />
            </radialGradient>
          </defs>
          <g>
            {/* Coral Pill ("Pencil") */}
            <g transform="translate(370, 78)">
              <rect x="0" y="0" width="415" height="162" rx="46" fill="url(#fallbackCoral)" />
              <text x="32" y="119" fontFamily="system-ui, sans-serif" fontSize="118" fontWeight="900" fill="#1C2E3D">
                Penc<tspan fill="#1C2E3D">ı</tspan><tspan fill="#1C2E3D">l</tspan>
              </text>
              <circle cx="295" cy="56" r="21" fill="url(#fallbackYellow)" />
            </g>
            {/* Green Block ("for") */}
            <g transform="translate(275, 160) rotate(5)">
              <rect x="-72" y="-72" width="146" height="146" rx="40" fill="url(#fallbackGreen)" />
              <text x="6" y="28" fontFamily="system-ui, sans-serif" fontSize="78" fontWeight="900" fill="#FFFFFF" textAnchor="middle">
                for
              </text>
            </g>
            {/* Blue Block ("P") */}
            <g transform="translate(162, 162) rotate(-9)">
              <rect x="-95" y="-95" width="190" height="190" rx="50" fill="url(#fallbackBlue)" />
              <path d="M -44,62 L -44,-48 C -44,-62 -32,-68 -15,-68 L 16,-68 C 48,-68 70,-46 70,-14 C 70,20 46,38 16,38 L -10,38 L -10,62 C -10,68 -17,72 -27,72 C -37,72 -44,68 -44,62 Z M -10,10 L 12,10 C 26,10 37,-1 37,-14 C 37,-27 26,-38 12,-38 L -10,-38 Z" fill="#FFFFFF" />
            </g>
          </g>
        </svg>
      )}

      {showSubtitle && (
        <span className={`text-[#59627a] font-semibold tracking-wide ${
          size === 'xs' || size === 'sm' ? 'text-[9px]' : size === 'lg' || size === 'xl' ? 'text-xs mt-1' : 'text-[10px] mt-0.5'
        }`}>
          Small Steps. A Brighter Tomorrow.
        </span>
      )}
    </div>
  );
}
