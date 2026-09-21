import React from 'react';

// 1. Hero 3D Math Kids Illustration
export function HeroKidsIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full max-w-lg mx-auto select-none ${className}`}>
      {/* Background Soft Glow Blob */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-200/50 via-amber-100/40 to-pink-200/50 rounded-full blur-2xl -z-10 transform scale-110" />

      {/* Main Container */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Top Floating Elements Row */}
        <div className="w-full flex items-start justify-between px-2 mb-2">
          {/* 3D Glowing Lightbulb */}
          <div className="transform -rotate-6 hover:scale-110 transition-transform cursor-pointer">
            <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="28" r="22" fill="url(#bulbGlow)" />
              <path d="M22 42C22 40 38 40 38 42L36 50C36 51.1 35.1 52 34 52H26C24.9 52 24 51.1 24 50L22 42Z" fill="#CBD5E1" />
              <rect x="25" y="52" width="10" height="4" rx="2" fill="#94A3B8" />
              <circle cx="30" cy="28" r="16" fill="#FFD700" />
              <circle cx="25" cy="22" r="5" fill="#FFF9C4" opacity="0.8" />
              {/* Rays */}
              <line x1="30" y1="2" x2="30" y2="6" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
              <line x1="10" y1="12" x2="13" y2="15" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
              <line x1="50" y1="12" x2="47" y2="15" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <radialGradient id="bulbGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30 28) scale(22)">
                  <stop stopColor="#FFE066" />
                  <stop offset="1" stopColor="#FFB800" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>

          {/* 3D Equation: 2 + 3 = 5 */}
          <div className="flex items-center gap-1 font-black text-3xl sm:text-4xl text-[#0088FF] tracking-wider drop-shadow-sm font-sans transform -rotate-3 animate-pulse">
            <span>2</span>
            <span className="text-[#FF2A7A]">+</span>
            <span>3</span>
            <span className="text-[#FFB800]">=</span>
            <span className="text-[#00C853]">5</span>
          </div>

          {/* 3D Yellow Star & Floating Arc */}
          <div className="flex flex-col items-end">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="transform rotate-12 drop-shadow-md">
              <path d="M24 2L29.8 15.5L44.5 16.4L33.2 26L36.8 40.3L24 32.5L11.2 40.3L14.8 26L3.5 16.4L18.2 15.5L24 2Z" fill="url(#starGrad)" />
              <defs>
                <linearGradient id="starGrad" x1="24" y1="2" x2="24" y2="40.3" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFEB3B" />
                  <stop offset="1" stopColor="#FF9800" />
                </linearGradient>
              </defs>
            </svg>

            {/* Curved Text: Small Steps Big Futures! */}
            <div className="text-right font-black transform rotate-6 select-none mt-1">
              <div className="text-stone-800 text-xs sm:text-sm font-black leading-none">Small Steps</div>
              <div className="text-[#FF2A7A] text-sm sm:text-base font-black leading-none mt-0.5">Big Futures!</div>
              <svg width="80" height="12" viewBox="0 0 80 12" fill="none" className="mt-0.5">
                <path d="M2 8C20 2 60 2 78 8" stroke="#FF2A7A" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Central 3D Kids Vector Illustration */}
        <div className="relative w-full max-w-md bg-gradient-to-b from-sky-50 via-white to-amber-50 rounded-3xl p-4 border-2 border-stone-200/80 shadow-xl overflow-hidden flex flex-col items-center">
          <svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-sm">
            {/* Soft background circle */}
            <circle cx="200" cy="140" r="130" fill="#EBF5FF" />

            {/* Stack of Math Books */}
            <rect x="110" y="220" width="180" height="18" rx="4" fill="#3B82F6" />
            <rect x="110" y="220" width="180" height="4" fill="#60A5FA" />
            <text x="120" y="233" fill="white" fontSize="10" fontWeight="900" fontFamily="sans-serif">MATH</text>
            
            <rect x="100" y="238" width="200" height="20" rx="4" fill="#EF4444" />
            <rect x="100" y="238" width="200" height="4" fill="#F87171" />

            {/* Laptop */}
            <rect x="140" y="150" width="120" height="75" rx="8" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
            <rect x="148" y="158" width="104" height="58" rx="4" fill="#1E293B" />
            {/* Screen Content */}
            <circle cx="200" cy="187" r="16" fill="#FF2A7A" />
            <text x="195" y="193" fill="white" fontSize="18" fontWeight="900" fontFamily="sans-serif">P</text>
            {/* Laptop Base */}
            <path d="M120 225C120 222 122 220 125 220H275C278 220 280 222 280 225L285 230H115L120 225Z" fill="#CBD5E1" />

            {/* Cup of Pencils */}
            <rect x="310" y="190" width="26" height="35" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="316" y1="170" x2="316" y2="190" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
            <line x1="323" y1="165" x2="323" y2="190" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
            <line x1="330" y1="172" x2="330" y2="190" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

            {/* BOY (Left) */}
            {/* Hair */}
            <path d="M100 80C100 55 120 40 145 45C160 35 185 50 180 75C185 85 180 100 170 105C160 110 110 110 100 80Z" fill="#4B2C20" />
            {/* Head */}
            <circle cx="140" cy="85" r="32" fill="#FCE7F3" />
            <circle cx="140" cy="85" r="30" fill="#FED7AA" />
            {/* Eyes & Smile */}
            <circle cx="130" cy="82" r="4" fill="#1E293B" />
            <circle cx="152" cy="82" r="4" fill="#1E293B" />
            <circle cx="131" cy="80" r="1.5" fill="white" />
            <circle cx="153" cy="80" r="1.5" fill="white" />
            <path d="M133 93C133 93 140 100 148 93" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            {/* Cheeks */}
            <circle cx="123" cy="88" r="4" fill="#F87171" opacity="0.5" />
            <circle cx="158" cy="88" r="4" fill="#F87171" opacity="0.5" />
            {/* Blue Hoodie Body */}
            <path d="M105 115C105 115 125 110 140 110C155 110 175 115 175 115L180 170H100L105 115Z" fill="#0088FF" />
            {/* Raised Fist (Left Boy) */}
            <path d="M85 100C80 95 75 110 85 120L105 125" stroke="#0088FF" strokeWidth="12" strokeLinecap="round" />
            <circle cx="82" cy="98" r="8" fill="#FED7AA" />

            {/* GIRL (Right) */}
            {/* Hair */}
            <path d="M220 75C220 45 250 35 280 45C300 55 300 90 295 120C285 110 275 125 260 120C240 125 220 105 220 75Z" fill="#311B0B" />
            {/* Head */}
            <circle cx="260" cy="85" r="30" fill="#FED7AA" />
            {/* Pink Hair Clip */}
            <circle cx="282" cy="72" r="6" fill="#FF2A7A" />
            {/* Eyes & Smile */}
            <circle cx="250" cy="82" r="4" fill="#1E293B" />
            <circle cx="272" cy="82" r="4" fill="#1E293B" />
            <circle cx="251" cy="80" r="1.5" fill="white" />
            <circle cx="273" cy="80" r="1.5" fill="white" />
            <path d="M253 93C253 93 260 100 268 93" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            {/* Cheeks */}
            <circle cx="243" cy="88" r="4" fill="#FF2A7A" opacity="0.5" />
            <circle cx="278" cy="88" r="4" fill="#FF2A7A" opacity="0.5" />
            {/* Pink Shirt Body */}
            <path d="M225 115C225 115 245 110 260 110C275 110 295 115 295 115L300 170H220L225 115Z" fill="#FF2A7A" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// 2. Parent & Child 3D Illustration
export function ParentChildIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg width="180" height="150" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        {/* Floating Heart */}
        <path d="M120 20C115 10 100 10 95 22C90 10 75 10 70 20C65 32 80 45 95 55C110 45 125 32 120 20Z" fill="#FF2A7A" />
        
        {/* MOTHER */}
        <circle cx="115" cy="55" r="24" fill="#FED7AA" />
        {/* Mother Hair */}
        <path d="M90 50C90 30 110 20 135 30C145 40 145 70 135 85C120 85 90 70 90 50Z" fill="#4A2810" />
        <circle cx="108" cy="52" r="3" fill="#1E293B" />
        <circle cx="124" cy="52" r="3" fill="#1E293B" />
        <path d="M110 62C110 62 116 67 122 62" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
        <path d="M85 80C85 80 105 75 120 75C135 75 155 80 155 80L160 130H80L85 80Z" fill="#FF2A7A" />

        {/* CHILD */}
        <circle cx="70" cy="75" r="18" fill="#FED7AA" />
        {/* Child Hair */}
        <path d="M52 70C52 55 65 50 82 55C88 65 85 85 82 92C72 92 52 85 52 70Z" fill="#291507" />
        <circle cx="64" cy="73" r="2.5" fill="#1E293B" />
        <circle cx="76" cy="73" r="2.5" fill="#1E293B" />
        <path d="M65 81C65 81 70 85 75 81" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M50 95C50 95 65 92 75 92C85 92 100 95 100 95L102 130H48L50 95Z" fill="#0088FF" />

        {/* Laptop in front */}
        <rect x="60" y="110" width="60" height="30" rx="4" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="90" cy="125" r="4" fill="#FF2A7A" />
      </svg>
    </div>
  );
}

// 3. Schoolhouse 3D Illustration
export function SchoolhouseIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg width="200" height="150" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        {/* Green Trees */}
        <circle cx="30" cy="115" r="20" fill="#10B981" />
        <rect x="27" y="125" width="6" height="20" fill="#78350F" />

        <circle cx="170" cy="115" r="20" fill="#10B981" />
        <rect x="167" y="125" width="6" height="20" fill="#78350F" />

        {/* Main School Building */}
        <rect x="50" y="70" width="100" height="70" rx="4" fill="#38BDF8" />
        {/* Roof */}
        <path d="M40 70L100 25L160 70H40Z" fill="#EF4444" />

        {/* Clock Tower / Bell */}
        <rect x="85" y="15" width="30" height="25" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
        <circle cx="100" cy="27" r="7" fill="#38BDF8" />
        <line x1="100" y1="27" x2="100" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="100" y1="27" x2="103" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        {/* Flag on top */}
        <line x1="100" y1="15" x2="100" y2="2" stroke="#64748B" strokeWidth="2" />
        <path d="M100 2L115 7L100 12V2Z" fill="#EF4444" />

        {/* SCHOOL Banner */}
        <rect x="75" y="65" width="50" height="14" rx="3" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
        <text x="80" y="75" fill="#1E293B" fontSize="8" fontWeight="900" fontFamily="sans-serif">SCHOOL</text>

        {/* Windows */}
        <rect x="62" y="85" width="14" height="20" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        <rect x="82" y="85" width="14" height="20" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        <rect x="104" y="85" width="14" height="20" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
        <rect x="124" y="85" width="14" height="20" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />

        {/* Door */}
        <path d="M90 140V115C90 112 92 110 95 110H105C108 110 110 112 110 115V140H90Z" fill="#1E293B" />
      </svg>
    </div>
  );
}

// 4. Sprout Plant 3D Illustration
export function SproutPlantIllustration({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        {/* Soil Mound */}
        <ellipse cx="50" cy="75" rx="35" ry="10" fill="#78350F" />
        <ellipse cx="50" cy="73" rx="30" ry="8" fill="#92400E" />

        {/* Stem */}
        <path d="M50 72C50 50 48 35 50 20" stroke="#16A34A" strokeWidth="5" strokeLinecap="round" />

        {/* Left Leaf */}
        <path d="M48 40C30 35 15 20 20 10C35 10 45 25 48 38Z" fill="url(#leafLeftGrad)" />

        {/* Right Leaf */}
        <path d="M52 35C70 30 85 15 80 5C65 5 55 20 52 33Z" fill="url(#leafRightGrad)" />

        {/* Water Droplets */}
        <path d="M28 8C28 4 24 0 24 0C24 0 20 4 20 8C20 10 22 12 24 12C26 12 28 10 28 8Z" fill="#38BDF8" />
        <path d="M78 18C78 15 75 12 75 12C75 12 72 15 72 18C72 20 73 21 75 21C77 21 78 20 78 18Z" fill="#38BDF8" />

        <defs>
          <linearGradient id="leafLeftGrad" x1="20" y1="10" x2="48" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4ADE80" />
            <stop offset="1" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="leafRightGrad" x1="80" y1="5" x2="52" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22C55E" />
            <stop offset="1" stopColor="#15803D" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
