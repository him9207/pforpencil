import os
import subprocess

os.makedirs('src/assets', exist_ok=True)
os.makedirs('public/assets', exist_ok=True)

svgs = {
    "hero-boy": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="400" height="480">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#E0F2FE"/>
      <stop offset="100%" stop-color="#BAE6FD" stop-opacity="0.1"/>
    </radialGradient>
    <linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>
    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFE4D6"/>
      <stop offset="100%" stop-color="#FBCFE8"/>
    </linearGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#451A03"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>
    <linearGradient id="backpackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.15"/>
    </filter>
  </defs>
  
  <ellipse cx="200" cy="450" rx="140" ry="20" fill="#0284C7" opacity="0.15" />
  
  <!-- Backpack in back -->
  <rect x="130" y="210" width="140" height="150" rx="36" fill="url(#backpackGrad)" filter="url(#dropShadow)" />
  <rect x="150" y="195" width="100" height="30" rx="12" fill="#D97706" />

  <!-- Arms - Right Hand Raised Cheering -->
  <path d="M 270 240 C 310 210, 325 150, 315 120" stroke="#FFFFFF" stroke-width="38" stroke-linecap="round" fill="none" filter="url(#dropShadow)"/>
  <circle cx="315" cy="115" r="22" fill="#FED7AA" />
  <!-- Fist details -->
  <circle cx="310" cy="110" r="8" fill="#FDBA74" />
  <circle cx="322" cy="112" r="7" fill="#FDBA74" />

  <!-- Left Arm relaxed jumping -->
  <path d="M 130 250 C 90 270, 75 310, 85 340" stroke="#FFFFFF" stroke-width="34" stroke-linecap="round" fill="none" filter="url(#dropShadow)"/>
  <circle cx="88" cy="345" r="20" fill="#FED7AA" />

  <!-- Legs Jumping -->
  <path d="M 170 360 L 155 425" stroke="#1E40AF" stroke-width="32" stroke-linecap="round" />
  <ellipse cx="145" cy="435" rx="28" ry="16" fill="#EF4444" />
  <ellipse cx="145" cy="433" rx="22" ry="10" fill="#FFFFFF" opacity="0.8"/>
  
  <path d="M 230 360 L 255 415" stroke="#1E40AF" stroke-width="32" stroke-linecap="round" />
  <ellipse cx="265" cy="425" rx="28" ry="16" fill="#EF4444" />
  <ellipse cx="265" cy="423" rx="22" ry="10" fill="#FFFFFF" opacity="0.8"/>

  <!-- Body / White Hoodie -->
  <path d="M 140 230 C 130 340, 140 370, 200 370 C 260 370, 270 340, 260 230 Z" fill="url(#hoodieGrad)" filter="url(#dropShadow)" />
  <!-- Hoodie Green P Logo -->
  <circle cx="200" cy="285" r="30" fill="#16C47F" />
  <text x="200" y="296" font-family="Arial, sans-serif" font-weight="900" font-size="32" fill="#FFFFFF" text-anchor="middle">P</text>
  <!-- Hoodie drawstrings -->
  <path d="M 185 225 L 185 260" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>
  <path d="M 215 225 L 215 260" stroke="#CBD5E1" stroke-width="4" stroke-linecap="round"/>

  <!-- Head & Ears -->
  <circle cx="128" cy="155" r="16" fill="#FED7AA" />
  <circle cx="272" cy="155" r="16" fill="#FED7AA" />
  <ellipse cx="200" cy="155" rx="66" ry="70" fill="#FED7AA" filter="url(#dropShadow)" />

  <!-- Hair Tousled Pixar 3D -->
  <path d="M 130 135 C 120 70, 220 50, 270 95 C 285 110, 280 145, 275 145 C 265 115, 240 100, 200 105 C 160 110, 140 125, 130 135 Z" fill="url(#hairGrad)" />
  <path d="M 155 75 C 180 55, 225 60, 245 78 C 220 70, 185 70, 155 75 Z" fill="#92400E" />

  <!-- Eyes - Big cartoon expressive -->
  <ellipse cx="178" cy="155" rx="14" ry="18" fill="#1E293B" />
  <ellipse cx="222" cy="155" rx="14" ry="18" fill="#1E293B" />
  <circle cx="174" cy="150" r="6" fill="#FFFFFF" />
  <circle cx="218" cy="150" r="6" fill="#FFFFFF" />
  <circle cx="182" cy="160" r="2.5" fill="#FFFFFF" opacity="0.8"/>
  <circle cx="226" cy="160" r="2.5" fill="#FFFFFF" opacity="0.8"/>

  <!-- Eyebrows Cheerful -->
  <path d="M 165 132 C 175 128, 190 132, 192 136" stroke="#451A03" stroke-width="4" stroke-linecap="round" fill="none" />
  <path d="M 235 132 C 225 128, 210 132, 208 136" stroke="#451A03" stroke-width="4" stroke-linecap="round" fill="none" />

  <!-- Rosy Cheeks -->
  <circle cx="160" cy="172" r="12" fill="#F43F5E" opacity="0.3" />
  <circle cx="240" cy="172" r="12" fill="#F43F5E" opacity="0.3" />

  <!-- Cheerful Open Mouth Smile -->
  <path d="M 180 178 C 185 202, 215 202, 220 178 Z" fill="#991B1B" />
  <path d="M 185 180 C 190 188, 210 188, 215 180 Z" fill="#FFFFFF" />
  <path d="M 190 196 C 195 190, 205 190, 210 196 Z" fill="#F87171" />
</svg>''',

    "pencil-mascot": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <linearGradient id="pencilBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="50%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <linearGradient id="eraserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FB7185"/>
      <stop offset="50%" stop-color="#FDA4AF"/>
      <stop offset="100%" stop-color="#F43F5E"/>
    </linearGradient>
    <linearGradient id="ferruleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#94A3B8"/>
      <stop offset="50%" stop-color="#E2E8F0"/>
      <stop offset="100%" stop-color="#64748B"/>
    </linearGradient>
  </defs>
  
  <!-- Shadow -->
  <ellipse cx="160" cy="295" rx="75" ry="14" fill="#0F172A" opacity="0.15"/>

  <!-- Legs in Green Sneakers -->
  <path d="M 135 240 L 125 275" stroke="#047857" stroke-width="12" stroke-linecap="round" />
  <rect x="100" y="270" width="36" height="20" rx="8" fill="#16C47F" />
  <rect x="100" y="285" width="36" height="6" rx="3" fill="#FFFFFF" />

  <path d="M 185 240 L 195 275" stroke="#047857" stroke-width="12" stroke-linecap="round" />
  <rect x="185" y="270" width="36" height="20" rx="8" fill="#16C47F" />
  <rect x="185" y="285" width="36" height="6" rx="3" fill="#FFFFFF" />

  <!-- Left Waving Glove Hand -->
  <path d="M 105 160 C 70 140, 60 110, 68 85" stroke="#F59E0B" stroke-width="14" stroke-linecap="round" fill="none"/>
  <!-- White Cartoon Glove Hand -->
  <circle cx="68" cy="80" r="18" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
  <circle cx="64" cy="65" r="7" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
  <circle cx="75" cy="68" r="7" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

  <!-- Right Hand Akimbo -->
  <path d="M 215 165 C 245 175, 255 195, 240 215" stroke="#F59E0B" stroke-width="14" stroke-linecap="round" fill="none"/>
  <circle cx="236" cy="216" r="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

  <!-- Pink Eraser Top -->
  <path d="M 120 70 C 120 40, 200 40, 200 70 Z" fill="url(#eraserGrad)"/>

  <!-- Metal Ferrule Ring -->
  <rect x="118" y="70" width="84" height="22" rx="4" fill="url(#ferruleGrad)"/>
  <line x1="120" y1="77" x2="200" y2="77" stroke="#475569" stroke-width="2"/>
  <line x1="120" y1="84" x2="200" y2="84" stroke="#475569" stroke-width="2"/>

  <!-- Main Yellow Pencil Shaft -->
  <rect x="120" y="92" width="80" height="120" rx="6" fill="url(#pencilBody)"/>
  <line x1="147" y1="92" x2="147" y2="212" stroke="#D97706" stroke-width="2.5" opacity="0.6"/>
  <line x1="173" y1="92" x2="173" y2="212" stroke="#FDE68A" stroke-width="2.5" opacity="0.8"/>

  <!-- Sharpened Wood Point -->
  <polygon points="120,212 200,212 160,265" fill="#FED7AA"/>
  <!-- Graphite Lead Tip -->
  <polygon points="150,250 170,250 160,265" fill="#1E293B"/>

  <!-- Face on the Pencil -->
  <!-- Big Eyes -->
  <ellipse cx="145" cy="140" rx="12" ry="15" fill="#0F172A"/>
  <ellipse cx="175" cy="140" rx="12" ry="15" fill="#0F172A"/>
  <circle cx="142" cy="135" r="5" fill="#FFFFFF"/>
  <circle cx="172" cy="135" r="5" fill="#FFFFFF"/>
  <circle cx="148" cy="144" r="2.5" fill="#FFFFFF"/>
  <circle cx="178" cy="144" r="2.5" fill="#FFFFFF"/>

  <!-- Cheeks -->
  <ellipse cx="132" cy="154" rx="8" ry="5" fill="#F43F5E" opacity="0.4"/>
  <ellipse cx="188" cy="154" rx="8" ry="5" fill="#F43F5E" opacity="0.4"/>

  <!-- Big Grin -->
  <path d="M 146 156 C 150 172, 170 172, 174 156 Z" fill="#991B1B"/>
  <path d="M 152 166 C 156 162, 164 162, 168 166 Z" fill="#FDA4AF"/>
</svg>''',

    "schools": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE"/>
      <stop offset="100%" stop-color="#BAE6FD"/>
    </linearGradient>
    <linearGradient id="schoolGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#B91C1C"/>
    </linearGradient>
    <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80"/>
      <stop offset="100%" stop-color="#16A34A"/>
    </linearGradient>
  </defs>

  <rect width="400" height="300" rx="16" fill="url(#skyGrad)"/>
  
  <!-- Cheerful Sun -->
  <circle cx="340" cy="60" r="32" fill="#FBBF24"/>
  <circle cx="340" cy="60" r="28" fill="#FDE047"/>
  <circle cx="332" cy="56" r="3" fill="#78350F"/>
  <circle cx="348" cy="56" r="3" fill="#78350F"/>
  <path d="M 334 66 C 337 72, 343 72, 346 66" stroke="#78350F" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- Clouds -->
  <circle cx="80" cy="65" r="20" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="105" cy="55" r="28" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="130" cy="65" r="20" fill="#FFFFFF" opacity="0.9"/>

  <!-- Trees -->
  <circle cx="50" cy="170" r="32" fill="#15803D"/>
  <rect x="44" y="180" width="12" height="40" rx="4" fill="#78350F"/>
  <circle cx="350" cy="170" r="32" fill="#15803D"/>
  <rect x="344" y="180" width="12" height="40" rx="4" fill="#78350F"/>

  <!-- School Building -->
  <rect x="100" y="110" width="200" height="110" rx="6" fill="url(#schoolGrad)"/>
  <!-- Roof -->
  <polygon points="80,110 200,40 320,110" fill="url(#roofGrad)"/>
  
  <!-- Clock Tower -->
  <rect x="175" y="25" width="50" height="45" rx="4" fill="#FFFFFF"/>
  <polygon points="170,25 200,2 230,25" fill="#EF4444"/>
  <circle cx="200" cy="45" r="14" fill="#0284C7"/>
  <circle cx="200" cy="45" r="11" fill="#FFFFFF"/>
  <line x1="200" y1="45" x2="200" y2="38" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>
  <line x1="200" y1="45" x2="206" y2="45" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/>

  <!-- Windows -->
  <rect x="120" y="130" width="28" height="35" rx="4" fill="#E0F2FE" stroke="#BAE6FD" stroke-width="2"/>
  <line x1="134" y1="130" x2="134" y2="165" stroke="#0284C7" stroke-width="1.5"/>
  <line x1="120" y1="147" x2="148" y2="147" stroke="#0284C7" stroke-width="1.5"/>

  <rect x="252" y="130" width="28" height="35" rx="4" fill="#E0F2FE" stroke="#BAE6FD" stroke-width="2"/>
  <line x1="266" y1="130" x2="266" y2="165" stroke="#0284C7" stroke-width="1.5"/>
  <line x1="252" y1="147" x2="280" y2="147" stroke="#0284C7" stroke-width="1.5"/>

  <!-- Entrance Door -->
  <path d="M 180 220 L 180 180 C 180 170, 220 170, 220 180 L 220 220 Z" fill="#F8FAFC"/>
  <circle cx="212" cy="195" r="3" fill="#D97706"/>

  <!-- School Banner -->
  <rect x="150" y="115" width="100" height="20" rx="4" fill="#FEF08A"/>
  <text x="200" y="130" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#854D0E" text-anchor="middle">PRIMARY ACADEMY</text>

  <!-- Green Grass Lawn -->
  <path d="M 0 215 Q 200 200, 400 215 L 400 300 L 0 300 Z" fill="url(#grassGrad)"/>

  <!-- Children Walking Together -->
  <!-- Child 1 (Left) -->
  <circle cx="140" cy="235" r="12" fill="#FED7AA"/>
  <path d="M 132 230 C 130 220, 150 220, 148 230" fill="#451A03"/>
  <rect x="130" y="247" width="20" height="25" rx="4" fill="#EF4444"/>
  <line x1="135" y1="272" x2="132" y2="292" stroke="#1E3A8A" stroke-width="6" stroke-linecap="round"/>
  <line x1="145" y1="272" x2="148" y2="292" stroke="#1E3A8A" stroke-width="6" stroke-linecap="round"/>

  <!-- Child 2 (Center) -->
  <circle cx="180" cy="230" r="13" fill="#FED7AA"/>
  <path d="M 170 225 C 170 215, 190 215, 190 225" fill="#78350F"/>
  <rect x="170" y="243" width="20" height="26" rx="4" fill="#10B981"/>
  <line x1="175" y1="269" x2="173" y2="292" stroke="#1E3A8A" stroke-width="6" stroke-linecap="round"/>
  <line x1="185" y1="269" x2="187" y2="292" stroke="#1E3A8A" stroke-width="6" stroke-linecap="round"/>

  <!-- Child 3 (Right) -->
  <circle cx="220" cy="235" r="12" fill="#FED7AA"/>
  <path d="M 212 230 C 210 220, 230 220, 228 230" fill="#1F2937"/>
  <rect x="210" y="247" width="20" height="25" rx="4" fill="#3B82F6"/>
  <line x1="215" y1="272" x2="213" y2="292" stroke="#1E3A8A" stroke-width="6" stroke-linecap="round"/>
  <line x1="225" y1="272" x2="227" y2="292" stroke="#1E3A8A" stroke-width="6" stroke-linecap="round"/>
</svg>''',

    "parents": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="parentRoomGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB"/>
      <stop offset="100%" stop-color="#FEF3C7"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
  </defs>

  <rect width="400" height="300" rx="16" fill="url(#parentRoomGrad)"/>

  <!-- Floating Heart Sparkles -->
  <path d="M 230 50 C 225 40, 210 40, 205 52 C 200 40, 185 40, 180 50 C 175 62, 190 75, 205 85 C 220 75, 235 62, 230 50 Z" fill="#F43F5E"/>
  <circle cx="280" cy="65" r="5" fill="#FBBF24"/>
  <circle cx="130" cy="75" r="4" fill="#38BDF8"/>

  <!-- Potted plant on shelf -->
  <rect x="50" y="90" width="60" height="8" rx="2" fill="#78350F"/>
  <polygon points="70,90 90,90 85,75 75,75" fill="#DC2626"/>
  <circle cx="80" cy="65" r="14" fill="#22C55E"/>

  <!-- MOTHER (Left) -->
  <circle cx="160" cy="115" r="32" fill="#FED7AA"/>
  <!-- Mother Hair -->
  <path d="M 125 110 C 120 75, 175 60, 195 85 C 205 100, 200 135, 190 145 C 180 145, 130 140, 125 110 Z" fill="#451A03"/>
  <circle cx="152" cy="115" r="4" fill="#0F172A"/>
  <circle cx="172" cy="115" r="4" fill="#0F172A"/>
  <circle cx="150" cy="112" r="1.5" fill="#FFFFFF"/>
  <circle cx="170" cy="112" r="1.5" fill="#FFFFFF"/>
  <path d="M 155 128 C 158 135, 168 135, 171 128" stroke="#991B1B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Mother Body in Warm Coral -->
  <path d="M 120 150 C 120 150, 150 145, 175 145 C 200 145, 205 150, 205 150 L 215 230 H 110 Z" fill="#F43F5E"/>
  <!-- Gentle Arm around Child -->
  <path d="M 185 160 C 215 165, 235 180, 240 200" stroke="#F43F5E" stroke-width="20" stroke-linecap="round" fill="none"/>
  <circle cx="240" cy="200" r="12" fill="#FED7AA"/>

  <!-- CHILD (Right) -->
  <circle cx="250" cy="140" r="28" fill="#FED7AA"/>
  <!-- Child Hair -->
  <path d="M 220 135 C 220 105, 275 105, 280 135 Z" fill="#1E293B"/>
  <circle cx="242" cy="140" r="4" fill="#0F172A"/>
  <circle cx="260" cy="140" r="4" fill="#0F172A"/>
  <circle cx="240" cy="138" r="1.5" fill="#FFFFFF"/>
  <circle cx="258" cy="138" r="1.5" fill="#FFFFFF"/>
  <path d="M 244 152 C 248 158, 256 158, 260 152" stroke="#991B1B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Child Body in Bright Blue -->
  <path d="M 220 170 C 220 170, 245 165, 265 165 C 285 165, 290 170, 290 170 L 295 230 H 215 Z" fill="#0284C7"/>

  <!-- Study Desk in foreground -->
  <rect x="60" y="225" width="280" height="20" rx="6" fill="url(#deskGrad)"/>
  <rect x="80" y="245" width="20" height="55" fill="#92400E"/>
  <rect x="300" y="245" width="20" height="55" fill="#92400E"/>

  <!-- Tablet on Desk showing Math 100% -->
  <rect x="180" y="195" width="80" height="50" rx="6" fill="#1E293B" stroke="#94A3B8" stroke-width="3"/>
  <rect x="185" y="200" width="70" height="40" rx="3" fill="#0284C7"/>
  <text x="220" y="220" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">MATH 100%</text>
  <circle cx="220" cy="230" r="4" fill="#22C55E"/>

  <!-- Pencil & Cup -->
  <rect x="120" y="205" width="24" height="28" rx="4" fill="#F8FAFC"/>
  <line x1="126" y1="188" x2="126" y2="205" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
  <line x1="134" y1="185" x2="134" y2="205" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
</svg>''',

    "icon-bee": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="beeBody" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#EAB308"/>
    </radialGradient>
  </defs>
  <!-- Wings -->
  <ellipse cx="60" cy="50" rx="28" ry="36" fill="#E0F2FE" opacity="0.8" transform="rotate(-25 60 50)"/>
  <ellipse cx="100" cy="50" rx="28" ry="36" fill="#E0F2FE" opacity="0.8" transform="rotate(25 100 50)"/>
  <!-- Body -->
  <ellipse cx="80" cy="95" rx="52" ry="46" fill="url(#beeBody)"/>
  <!-- Stripes -->
  <path d="M 52 75 Q 80 82 108 75 L 105 88 Q 80 96 55 88 Z" fill="#1E293B"/>
  <path d="M 45 100 Q 80 110 115 100 L 112 112 Q 80 122 48 112 Z" fill="#1E293B"/>
  <!-- Cheerful Face -->
  <circle cx="68" cy="90" r="6" fill="#0F172A"/>
  <circle cx="92" cy="90" r="6" fill="#0F172A"/>
  <circle cx="66" cy="88" r="2" fill="#FFFFFF"/>
  <circle cx="90" cy="88" r="2" fill="#FFFFFF"/>
  <circle cx="56" cy="98" r="6" fill="#F43F5E" opacity="0.5"/>
  <circle cx="104" cy="98" r="6" fill="#F43F5E" opacity="0.5"/>
  <path d="M 72 102 Q 80 110 88 102" stroke="#1E293B" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Antennae -->
  <path d="M 68 55 Q 60 35 50 35" stroke="#1E293B" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="35" r="6" fill="#EAB308"/>
  <path d="M 92 55 Q 100 35 110 35" stroke="#1E293B" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="110" cy="35" r="6" fill="#EAB308"/>
</svg>''',

    "icon-dino": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="dinoGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#86EFAC"/>
      <stop offset="100%" stop-color="#16A34A"/>
    </radialGradient>
  </defs>
  <!-- Spikes on back -->
  <polygon points="40,50 48,32 58,52" fill="#F59E0B"/>
  <polygon points="58,45 68,26 78,48" fill="#F59E0B"/>
  <polygon points="78,45 88,28 98,52" fill="#F59E0B"/>
  <!-- Body & Head -->
  <path d="M 45 110 C 40 70 80 50 110 50 C 130 50 142 65 140 85 C 135 100 115 102 110 112 C 105 130 90 140 65 138 C 50 136 45 125 45 110 Z" fill="url(#dinoGrad)"/>
  <!-- Belly -->
  <ellipse cx="80" cy="115" rx="24" ry="20" fill="#DCFCE7"/>
  <!-- Big Friendly Eye -->
  <circle cx="115" cy="70" r="10" fill="#FFFFFF"/>
  <circle cx="118" cy="70" r="6" fill="#0F172A"/>
  <circle cx="116" cy="67" r="2.5" fill="#FFFFFF"/>
  <!-- Rosy Cheek & Smile -->
  <circle cx="108" cy="85" r="6" fill="#F43F5E" opacity="0.4"/>
  <path d="M 120 86 Q 128 94 135 86" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Legs -->
  <rect x="58" y="132" width="14" height="18" rx="7" fill="#15803D"/>
  <rect x="82" y="132" width="14" height="18" rx="7" fill="#15803D"/>
</svg>''',

    "icon-elephant": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="eleGrad" cx="45%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#BAE6FD"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </radialGradient>
  </defs>
  <!-- Big Round Ears -->
  <circle cx="45" cy="80" r="32" fill="#0284C7"/>
  <circle cx="45" cy="80" r="22" fill="#FBCFE8"/>
  <circle cx="115" cy="80" r="32" fill="#0284C7"/>
  <circle cx="115" cy="80" r="22" fill="#FBCFE8"/>
  <!-- Head & Body -->
  <circle cx="80" cy="88" r="42" fill="url(#eleGrad)"/>
  <!-- Trunk curled upward joyfully -->
  <path d="M 80 98 Q 80 128 96 128 Q 106 128 106 116" stroke="url(#eleGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
  <!-- Big Eyes -->
  <circle cx="66" cy="82" r="6" fill="#0F172A"/>
  <circle cx="94" cy="82" r="6" fill="#0F172A"/>
  <circle cx="64" cy="79" r="2" fill="#FFFFFF"/>
  <circle cx="92" cy="79" r="2" fill="#FFFFFF"/>
  <circle cx="56" cy="94" r="7" fill="#F43F5E" opacity="0.4"/>
  <circle cx="104" cy="94" r="7" fill="#F43F5E" opacity="0.4"/>
</svg>''',

    "icon-fox": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="foxGrad" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#FB923C"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </radialGradient>
  </defs>
  <!-- Ears -->
  <polygon points="35,70 50,25 75,55" fill="#EA580C"/>
  <polygon points="45,65 52,35 68,55" fill="#FFFFFF"/>
  <polygon points="125,70 110,25 85,55" fill="#EA580C"/>
  <polygon points="115,65 108,35 92,55" fill="#FFFFFF"/>
  <!-- Head -->
  <polygon points="30,80 80,138 130,80 110,60 50,60" fill="url(#foxGrad)"/>
  <!-- White Cheeks -->
  <polygon points="30,80 80,138 55,95" fill="#FFFFFF"/>
  <polygon points="130,80 80,138 105,95" fill="#FFFFFF"/>
  <!-- Black Nose -->
  <circle cx="80" cy="132" r="7" fill="#0F172A"/>
  <!-- Fox Eyes -->
  <ellipse cx="62" cy="85" rx="6" ry="8" fill="#0F172A"/>
  <ellipse cx="98" cy="85" rx="6" ry="8" fill="#0F172A"/>
  <circle cx="60" cy="82" r="2.5" fill="#FFFFFF"/>
  <circle cx="96" cy="82" r="2.5" fill="#FFFFFF"/>
</svg>''',

    "icon-lion": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <radialGradient id="maneGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </radialGradient>
  </defs>
  <!-- Fluffy Mane -->
  <circle cx="80" cy="80" r="58" fill="url(#maneGrad)"/>
  <!-- Face -->
  <circle cx="80" cy="82" r="40" fill="#FDE047"/>
  <!-- Round Ears -->
  <circle cx="48" cy="48" r="14" fill="#B45309"/>
  <circle cx="48" cy="48" r="8" fill="#FDE047"/>
  <circle cx="112" cy="48" r="14" fill="#B45309"/>
  <circle cx="112" cy="48" r="8" fill="#FDE047"/>
  <!-- Eyes -->
  <circle cx="66" cy="76" r="6" fill="#0F172A"/>
  <circle cx="94" cy="76" r="6" fill="#0F172A"/>
  <circle cx="64" cy="73" r="2" fill="#FFFFFF"/>
  <circle cx="92" cy="73" r="2" fill="#FFFFFF"/>
  <!-- Cute Snout -->
  <ellipse cx="80" cy="94" rx="16" ry="12" fill="#FFFFFF"/>
  <polygon points="74,90 86,90 80,97" fill="#78350F"/>
  <path d="M 75 99 Q 80 104 85 99" stroke="#78350F" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>''',

    "icon-panda": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <!-- Black Round Ears -->
  <circle cx="45" cy="48" r="18" fill="#0F172A"/>
  <circle cx="115" cy="48" r="18" fill="#0F172A"/>
  <!-- White Round Face -->
  <circle cx="80" cy="86" r="48" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
  <!-- Black Eye Patches -->
  <ellipse cx="60" cy="82" rx="14" ry="18" fill="#0F172A" transform="rotate(-15 60 82)"/>
  <ellipse cx="100" cy="82" rx="14" ry="18" fill="#0F172A" transform="rotate(15 100 82)"/>
  <!-- White Pupils -->
  <circle cx="62" cy="80" r="5" fill="#FFFFFF"/>
  <circle cx="98" cy="80" r="5" fill="#FFFFFF"/>
  <circle cx="64" cy="82" r="2" fill="#0F172A"/>
  <circle cx="96" cy="82" r="2" fill="#0F172A"/>
  <!-- Nose & Mouth -->
  <ellipse cx="80" cy="100" rx="7" ry="5" fill="#0F172A"/>
  <path d="M 74 106 Q 80 112 86 106" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Rosy cheeks -->
  <circle cx="48" cy="98" r="6" fill="#F43F5E" opacity="0.3"/>
  <circle cx="112" cy="98" r="6" fill="#F43F5E" opacity="0.3"/>
</svg>''',

    "icon-penguin": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <!-- Body -->
  <ellipse cx="80" cy="88" rx="46" ry="54" fill="#0F172A"/>
  <!-- White Belly -->
  <ellipse cx="80" cy="94" rx="34" ry="42" fill="#FFFFFF"/>
  <!-- Flippers -->
  <ellipse cx="32" cy="92" rx="12" ry="24" fill="#0F172A" transform="rotate(20 32 92)"/>
  <ellipse cx="128" cy="92" rx="12" ry="24" fill="#0F172A" transform="rotate(-20 128 92)"/>
  <!-- Big Eyes -->
  <circle cx="68" cy="68" r="8" fill="#0F172A"/>
  <circle cx="92" cy="68" r="8" fill="#0F172A"/>
  <circle cx="66" cy="66" r="3" fill="#FFFFFF"/>
  <circle cx="90" cy="66" r="3" fill="#FFFFFF"/>
  <!-- Yellow Beak -->
  <polygon points="70,76 90,76 80,90" fill="#F59E0B"/>
  <!-- Feet -->
  <ellipse cx="65" cy="142" rx="14" ry="8" fill="#F59E0B"/>
  <ellipse cx="95" cy="142" rx="14" ry="8" fill="#F59E0B"/>
</svg>''',

    "icon-rocket": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>
    <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
  </defs>
  <!-- Flame Blast -->
  <polygon points="68,118 92,118 80,152" fill="url(#flameGrad)"/>
  <polygon points="74,118 86,118 80,140" fill="#FDE047"/>
  <!-- Fins -->
  <polygon points="50,115 65,85 65,115" fill="#EF4444"/>
  <polygon points="110,115 95,85 95,115" fill="#EF4444"/>
  <!-- Rocket Body -->
  <path d="M 65 65 C 65 30 80 15 80 15 C 80 15 95 30 95 65 L 95 115 L 65 115 Z" fill="url(#rocketBody)"/>
  <!-- Rocket Red Cone -->
  <path d="M 67 50 C 70 30 80 15 80 15 C 80 15 90 30 93 50 Z" fill="#EF4444"/>
  <!-- Porthole Window -->
  <circle cx="80" cy="72" r="14" fill="#0284C7"/>
  <circle cx="80" cy="72" r="10" fill="#BAE6FD"/>
  <circle cx="77" cy="69" r="3" fill="#FFFFFF"/>
  <!-- Sparkle Stars -->
  <circle cx="35" cy="35" r="4" fill="#FCD34D"/>
  <circle cx="125" cy="45" r="3" fill="#FCD34D"/>
  <circle cx="135" cy="115" r="5" fill="#FCD34D"/>
</svg>'''
}

for name, svg_content in svgs.items():
    svg_path = f"/tmp/{name}.svg"
    with open(svg_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)
    
    # Generate webp to src/assets and public/assets
    out_src = f"src/assets/{name}.webp"
    out_pub = f"public/assets/{name}.webp"
    
    # Also save svg fallbacks
    with open(f"src/assets/{name}.svg", 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open(f"public/assets/{name}.svg", 'w', encoding='utf-8') as f:
        f.write(svg_content)

    cmd1 = f"ffmpeg -i {svg_path} {out_src} -y -loglevel error"
    cmd2 = f"ffmpeg -i {svg_path} {out_pub} -y -loglevel error"
    subprocess.run(cmd1, shell=True)
    subprocess.run(cmd2, shell=True)
    print(f"Generated {name}.webp in src/assets/ and public/assets/")
