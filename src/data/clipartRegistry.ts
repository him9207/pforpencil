/**
 * Clipart Library Registry
 * Defines high-resolution vector and illustrative cliparts aggregated by family.
 * Supports embedded Data URIs for 100% fail-safe offline rendering,
 * public paths (/clipart/...), multi-item parsing, family grouping, and inline text tags.
 */

export type ClipartCategory =
  | 'fruits'
  | 'vegetables'
  | 'animals'
  | 'shapes'
  | 'colors'
  | 'numbers'
  | 'alphabet'
  | 'objects';

export interface ClipartFamily {
  id: ClipartCategory;
  name: string;
  icon: string;
  description: string;
}

export const CLIPART_FAMILIES: ClipartFamily[] = [
  { id: 'fruits', name: 'Fruits', icon: '🍎', description: 'Apples, bananas, strawberries, oranges & more' },
  { id: 'vegetables', name: 'Vegetables', icon: '🥕', description: 'Carrots, broccoli, tomatoes, corn & peas' },
  { id: 'animals', name: 'Animals', icon: '🦁', description: 'Puppies, kittens, monkeys, cows, lions & bears' },
  { id: 'shapes', name: 'Shapes', icon: '⭐', description: 'Stars, hearts, circles, triangles, squares & diamonds' },
  { id: 'colors', name: 'Colors', icon: '🎨', description: 'Red, blue, green, yellow, orange & purple paint' },
  { id: 'numbers', name: 'Numbers & Math', icon: '🔢', description: 'Numbers 1-5, plus, minus & equal signs' },
  { id: 'alphabet', name: 'Alphabet', icon: '🔤', description: 'Letters A, B, C, D phonics blocks' },
  { id: 'objects', name: 'Coins & Objects', icon: '🪙', description: 'Gold coins, dollars, cars, buses, rockets & balloons' }
];

export interface ClipartItem {
  id: string;
  name: string;
  category: ClipartCategory;
  path: string;
  dataUri: string;
  keywords: string[];
  emojiEquivalent?: string;
}

function toDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// ==========================================
// 1. FRUITS SVGS
// ==========================================
const APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="ag" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="55%" stop-color="#e02424"/><stop offset="100%" stop-color="#991b1b"/></radialGradient><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#86efac"/><stop offset="100%" stop-color="#16a34a"/></linearGradient><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a16207"/><stop offset="100%" stop-color="#713f12"/></linearGradient></defs><path d="M50 25 C49 14 55 10 58 7 C56 12 53 18 53 25 Z" fill="url(#sg)"/><path d="M52 18 C65 14 74 20 72 26 C63 28 55 24 52 18 Z" fill="url(#lg)" stroke="#15803d" stroke-width="1.5"/><path d="M50 32 C40 18 20 22 15 38 C9 58 20 85 42 90 C47 91 49 88 50 88 C51 88 53 91 58 90 C80 85 91 58 85 38 C80 22 60 18 50 32 Z" fill="url(#ag)"/><ellipse cx="32" cy="38" rx="8" ry="14" transform="rotate(-28 32 38)" fill="#ffffff" opacity="0.38"/><circle cx="28" cy="58" r="3" fill="#ffffff" opacity="0.25"/></svg>`;

const BANANA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bg" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="60%" stop-color="#facc15"/><stop offset="100%" stop-color="#eab308"/></linearGradient><linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#65a30d"/><stop offset="100%" stop-color="#4d7c0f"/></linearGradient></defs><path d="M22 24 C20 20 25 16 30 18 C55 24 78 45 84 72 C86 80 82 85 75 84 C68 83 40 68 25 45 C19 36 21 27 22 24 Z" fill="url(#bg)" stroke="#ca8a04" stroke-width="2"/><path d="M29 20 C50 32 68 52 74 74" fill="none" stroke="#eab308" stroke-width="3" stroke-linecap="round"/><path d="M23 23 C21 16 23 12 25 10 C27 12 29 16 28 20 Z" fill="url(#tg)"/><path d="M80 77 C84 82 82 85 78 84 Z" fill="#713f12"/><path d="M35 28 C52 40 64 56 68 68" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.45" stroke-linecap="round"/></svg>`;

const STRAWBERRY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="strg" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#fb7185"/><stop offset="60%" stop-color="#e11d48"/><stop offset="100%" stop-color="#9f1239"/></radialGradient></defs><path d="M35 20 C35 12 40 10 43 7" stroke="#65a30d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M25 28 C30 20 40 26 50 24 C60 26 70 20 75 28 C65 32 60 27 50 30 C40 27 35 32 25 28 Z" fill="#4ade80" stroke="#16a34a" stroke-width="1.5"/><path d="M22 34 C16 48 24 75 46 92 C48 94 52 94 54 92 C76 75 84 48 78 34 C72 26 28 26 22 34 Z" fill="url(#strg)" stroke="#be123c" stroke-width="2"/><g fill="#fef08a"><circle cx="34" cy="44" r="1.5"/><circle cx="50" cy="42" r="1.5"/><circle cx="66" cy="44" r="1.5"/><circle cx="42" cy="56" r="1.5"/><circle cx="58" cy="56" r="1.5"/><circle cx="32" cy="66" r="1.5"/><circle cx="48" cy="70" r="1.5"/><circle cx="64" cy="66" r="1.5"/><circle cx="50" cy="82" r="1.5"/></g></svg>`;

const ORANGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="org" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#fed7aa"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#ea580c"/></radialGradient></defs><path d="M50 22 Q52 14 55 10" stroke="#78350f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M52 18 C64 12 74 18 70 25 C60 25 54 22 52 18 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/><circle cx="50" cy="56" r="36" fill="url(#org)" stroke="#c2410c" stroke-width="2"/><ellipse cx="36" cy="44" rx="8" ry="12" transform="rotate(-25 36 44)" fill="#ffffff" opacity="0.3"/></svg>`;

const GRAPES_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="grg" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#c084fc"/><stop offset="70%" stop-color="#7e22ce"/><stop offset="100%" stop-color="#581c87"/></radialGradient></defs><path d="M50 18 C50 10 54 8 58 6" stroke="#713f12" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M48 14 C36 10 32 20 40 22 C46 22 48 18 48 14 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/><g fill="url(#grg)" stroke="#4c1d95" stroke-width="1.5"><circle cx="38" cy="30" r="10"/><circle cx="54" cy="30" r="10"/><circle cx="70" cy="32" r="9"/><circle cx="32" cy="46" r="10"/><circle cx="48" cy="46" r="10"/><circle cx="64" cy="46" r="10"/><circle cx="40" cy="62" r="10"/><circle cx="56" cy="62" r="10"/><circle cx="48" cy="78" r="9"/></g></svg>`;

const WATERMELON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="wmg" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#f87171"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#dc2626"/></radialGradient></defs><path d="M12 40 C16 78 48 88 50 88 C52 88 84 78 88 40 Z" fill="#15803d" stroke="#14532d" stroke-width="2"/><path d="M16 42 C20 74 48 84 50 84 C52 84 80 74 84 42 Z" fill="#bbf7d0"/><path d="M20 44 C24 70 48 78 50 78 C52 78 76 70 80 44 Z" fill="url(#wmg)"/><g fill="#1c1917"><ellipse cx="36" cy="52" rx="2" ry="3.5" transform="rotate(-15 36 52)"/><ellipse cx="50" cy="50" rx="2" ry="3.5"/><ellipse cx="64" cy="52" rx="2" ry="3.5" transform="rotate(15 64 52)"/><ellipse cx="43" cy="64" rx="2" ry="3.5" transform="rotate(-10 43 64)"/><ellipse cx="57" cy="64" rx="2" ry="3.5" transform="rotate(10 57 64)"/></g></svg>`;

const CHERRY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="chg" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#f43f5e"/><stop offset="60%" stop-color="#be123c"/><stop offset="100%" stop-color="#881337"/></radialGradient></defs><path d="M52 14 C40 30 35 48 34 60" fill="none" stroke="#713f12" stroke-width="3" stroke-linecap="round"/><path d="M52 14 C62 30 68 48 68 62" fill="none" stroke="#713f12" stroke-width="3" stroke-linecap="round"/><path d="M52 14 C60 10 70 12 72 18 C64 20 58 18 52 14 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/><circle cx="34" cy="68" r="18" fill="url(#chg)" stroke="#881337" stroke-width="2"/><ellipse cx="28" cy="62" rx="4" ry="7" transform="rotate(-30 28 62)" fill="#ffffff" opacity="0.4"/><circle cx="68" cy="70" r="18" fill="url(#chg)" stroke="#881337" stroke-width="2"/><ellipse cx="62" cy="64" rx="4" ry="7" transform="rotate(-30 62 64)" fill="#ffffff" opacity="0.4"/></svg>`;

// ==========================================
// 2. VEGETABLES SVGS
// ==========================================
const CARROT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdba74"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#c2410c"/></linearGradient><linearGradient id="clg" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#15803d"/><stop offset="100%" stop-color="#4ade80"/></linearGradient></defs><path d="M50 30 Q35 15 32 5 Q45 10 49 26 Z" fill="url(#clg)"/><path d="M50 30 Q50 10 50 2 Q55 10 52 26 Z" fill="url(#clg)"/><path d="M50 30 Q65 15 68 5 Q55 10 51 26 Z" fill="url(#clg)"/><path d="M34 32 C34 26 66 26 66 32 C66 38 56 86 51 96 C49 98 48 98 47 96 C42 86 34 38 34 32 Z" fill="url(#cg)" stroke="#c2410c" stroke-width="1.5"/><path d="M40 42 Q46 44 48 43" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/><path d="M52 54 Q58 56 61 54" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/><path d="M42 66 Q47 68 49 67" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/><path d="M48 78 Q52 80 54 79" fill="none" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/><path d="M39 36 Q42 55 45 70" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.45" stroke-linecap="round"/></svg>`;

const BROCCOLI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="brcg" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#86efac"/><stop offset="50%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></radialGradient></defs><path d="M44 65 L40 88 C40 92 60 92 60 88 L56 65 Z" fill="#86efac" stroke="#16a34a" stroke-width="2"/><g fill="url(#brcg)" stroke="#16a34a" stroke-width="2"><circle cx="50" cy="34" r="18"/><circle cx="32" cy="46" r="16"/><circle cx="68" cy="46" r="16"/><circle cx="48" cy="52" r="16"/><circle cx="34" cy="32" r="14"/><circle cx="66" cy="32" r="14"/></g></svg>`;

const TOMATO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="tomg" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#f87171"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></radialGradient></defs><path d="M50 20 Q52 12 56 8" stroke="#15803d" stroke-width="3" fill="none" stroke-linecap="round"/><polygon points="50,22 42,16 46,24 36,25 44,28 38,34 47,31 49,38 52,31 61,34 55,28 63,25 53,24 57,16" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/><circle cx="50" cy="58" r="34" fill="url(#tomg)" stroke="#991b1b" stroke-width="2"/><ellipse cx="36" cy="46" rx="8" ry="12" transform="rotate(-25 36 46)" fill="#ffffff" opacity="0.38"/></svg>`;

const CORN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="corng" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#facc15"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient></defs><path d="M30 40 C20 60 25 85 45 92 C32 78 30 55 35 40 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.5"/><path d="M70 40 C80 60 75 85 55 92 C68 78 70 55 65 40 Z" fill="#4ade80" stroke="#15803d" stroke-width="1.5"/><ellipse cx="50" cy="50" rx="18" ry="34" fill="url(#corng)" stroke="#a16207" stroke-width="2"/><g fill="#a16207" opacity="0.4"><circle cx="45" cy="30" r="2.5"/><circle cx="55" cy="30" r="2.5"/><circle cx="43" cy="42" r="2.5"/><circle cx="50" cy="42" r="2.5"/><circle cx="57" cy="42" r="2.5"/><circle cx="43" cy="54" r="2.5"/><circle cx="50" cy="54" r="2.5"/><circle cx="57" cy="54" r="2.5"/><circle cx="46" cy="66" r="2.5"/><circle cx="54" cy="66" r="2.5"/></g></svg>`;

const MUSHROOM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="mshg" cx="45%" cy="35%" r="65%"><stop offset="0%" stop-color="#f87171"/><stop offset="60%" stop-color="#dc2626"/><stop offset="100%" stop-color="#991b1b"/></radialGradient></defs><path d="M42 55 L38 86 C38 90 62 90 62 86 L58 55 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><path d="M15 55 C15 28 40 18 50 18 C60 18 85 28 85 55 Z" fill="url(#mshg)" stroke="#7f1d1d" stroke-width="2"/><circle cx="34" cy="38" r="6" fill="#ffffff"/><circle cx="52" cy="30" r="7" fill="#ffffff"/><circle cx="68" cy="42" r="5" fill="#ffffff"/><circle cx="50" cy="48" r="4.5" fill="#ffffff"/></svg>`;

// ==========================================
// 3. ANIMALS SVGS
// ==========================================
const MONKEY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="mf" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#b45309"/><stop offset="70%" stop-color="#78350f"/><stop offset="100%" stop-color="#451a03"/></radialGradient><radialGradient id="mfc" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="#fed7aa"/><stop offset="100%" stop-color="#fbd38d"/></radialGradient></defs><circle cx="20" cy="46" r="14" fill="url(#mf)"/><circle cx="20" cy="46" r="8" fill="url(#mfc)"/><circle cx="80" cy="46" r="14" fill="url(#mf)"/><circle cx="80" cy="46" r="8" fill="url(#mfc)"/><ellipse cx="50" cy="50" rx="34" ry="32" fill="url(#mf)"/><circle cx="41" cy="43" r="14" fill="url(#mfc)"/><circle cx="59" cy="43" r="14" fill="url(#mfc)"/><ellipse cx="50" cy="60" rx="20" ry="16" fill="url(#mfc)"/><ellipse cx="41" cy="42" rx="4.5" ry="6" fill="#1c1917"/><circle cx="39.5" cy="40" r="2" fill="#ffffff"/><ellipse cx="59" cy="42" rx="4.5" ry="6" fill="#1c1917"/><circle cx="57.5" cy="40" r="2" fill="#ffffff"/><circle cx="47" cy="56" r="1.8" fill="#78350f"/><circle cx="53" cy="56" r="1.8" fill="#78350f"/><path d="M40 64 Q50 74 60 64" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/><circle cx="33" cy="56" r="3.5" fill="#fca5a5" opacity="0.6"/><circle cx="67" cy="56" r="3.5" fill="#fca5a5" opacity="0.6"/></svg>`;

const PUPPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="pf" cx="40%" cy="30%" r="70%"><stop offset="0%" stop-color="#fef3c7"/><stop offset="60%" stop-color="#fde68a"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient><radialGradient id="pe" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#92400e"/></radialGradient></defs><ellipse cx="23" cy="46" rx="10" ry="18" transform="rotate(25 23 46)" fill="url(#pe)"/><ellipse cx="77" cy="46" rx="10" ry="18" transform="rotate(-25 77 46)" fill="url(#pe)"/><ellipse cx="50" cy="50" rx="32" ry="30" fill="url(#pf)" stroke="#d97706" stroke-width="1.5"/><ellipse cx="50" cy="62" rx="18" ry="14" fill="#ffffff"/><ellipse cx="50" cy="56" rx="5.5" ry="4" fill="#1c1917"/><circle cx="48.5" cy="54.5" r="1.5" fill="#ffffff"/><ellipse cx="38" cy="45" rx="5" ry="6" fill="#1e293b"/><circle cx="36" cy="43" r="2" fill="#ffffff"/><ellipse cx="62" cy="45" rx="5" ry="6" fill="#1e293b"/><circle cx="60" cy="43" r="2" fill="#ffffff"/><path d="M50 60 L50 66 Q44 70 42 66" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round"/><path d="M50 66 Q56 70 58 66" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round"/><path d="M48 66 Q50 75 53 72 Q54 66 50 66 Z" fill="#f87171"/><circle cx="30" cy="56" r="4" fill="#fda4af" opacity="0.6"/><circle cx="70" cy="56" r="4" fill="#fda4af" opacity="0.6"/></svg>`;

const CAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cf" cx="40%" cy="30%" r="70%"><stop offset="0%" stop-color="#fed7aa"/><stop offset="60%" stop-color="#fb923c"/><stop offset="100%" stop-color="#ea580c"/></radialGradient></defs><polygon points="22,42 16,14 42,26" fill="#ea580c"/><polygon points="25,38 21,20 38,28" fill="#fda4af"/><polygon points="78,42 84,14 58,26" fill="#ea580c"/><polygon points="75,38 79,20 62,28" fill="#fda4af"/><circle cx="50" cy="54" r="32" fill="url(#cf)" stroke="#c2410c" stroke-width="1.5"/><ellipse cx="38" cy="48" rx="5" ry="6" fill="#1c1917"/><circle cx="36" cy="46" r="2" fill="#ffffff"/><ellipse cx="62" cy="48" rx="5" ry="6" fill="#1c1917"/><circle cx="60" cy="46" r="2" fill="#ffffff"/><polygon points="46,57 54,57 50,62" fill="#f43f5e"/><path d="M50 62 Q44 68 40 64" fill="none" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/><path d="M50 62 Q56 68 60 64" fill="none" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/><line x1="20" y1="52" x2="32" y2="54" stroke="#7c2d12" stroke-width="2"/><line x1="18" y1="60" x2="32" y2="58" stroke="#7c2d12" stroke-width="2"/><line x1="80" y1="52" x2="68" y2="54" stroke="#7c2d12" stroke-width="2"/><line x1="82" y1="60" x2="68" y2="58" stroke="#7c2d12" stroke-width="2"/><circle cx="28" cy="58" r="4" fill="#fda4af" opacity="0.6"/><circle cx="72" cy="58" r="4" fill="#fda4af" opacity="0.6"/></svg>`;

const COW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="20" cy="32" rx="6" ry="12" transform="rotate(-35 20 32)" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/><ellipse cx="80" cy="32" rx="6" ry="12" transform="rotate(35 80 32)" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/><ellipse cx="50" cy="50" rx="34" ry="30" fill="#f8fafc" stroke="#64748b" stroke-width="2"/><path d="M22 40 C28 32 38 36 34 50 C24 52 20 44 22 40 Z" fill="#1e293b"/><path d="M68 34 C76 36 82 48 74 54 C66 48 64 36 68 34 Z" fill="#1e293b"/><ellipse cx="38" cy="45" rx="4.5" ry="5.5" fill="#1e293b"/><circle cx="36.5" cy="43.5" r="1.5" fill="#ffffff"/><ellipse cx="62" cy="45" rx="4.5" ry="5.5" fill="#1e293b"/><circle cx="60.5" cy="43.5" r="1.5" fill="#ffffff"/><ellipse cx="50" cy="66" rx="22" ry="15" fill="#fbcfe8" stroke="#f472b6" stroke-width="1.5"/><circle cx="43" cy="66" r="3.5" fill="#831843"/><circle cx="57" cy="66" r="3.5" fill="#831843"/><path d="M44 73 Q50 78 56 73" fill="none" stroke="#831843" stroke-width="2" stroke-linecap="round"/></svg>`;

const LION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="lm" cx="45%" cy="45%" r="55%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="60%" stop-color="#d97706"/><stop offset="100%" stop-color="#92400e"/></radialGradient><radialGradient id="lf" cx="40%" cy="30%" r="70%"><stop offset="0%" stop-color="#fef3c7"/><stop offset="60%" stop-color="#fde68a"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient></defs><circle cx="50" cy="50" r="42" fill="url(#lm)" stroke="#78350f" stroke-width="2"/><circle cx="50" cy="52" r="28" fill="url(#lf)" stroke="#d97706" stroke-width="1.5"/><ellipse cx="40" cy="46" rx="4" ry="5" fill="#1e293b"/><circle cx="38.5" cy="44.5" r="1.5" fill="#ffffff"/><ellipse cx="60" cy="46" rx="4" ry="5" fill="#1e293b"/><circle cx="58.5" cy="44.5" r="1.5" fill="#ffffff"/><polygon points="46,55 54,55 50,60" fill="#92400e"/><path d="M50 60 Q44 65 42 62" fill="none" stroke="#78350f" stroke-width="2" stroke-linecap="round"/><path d="M50 60 Q56 65 58 62" fill="none" stroke="#78350f" stroke-width="2" stroke-linecap="round"/></svg>`;

const BUNNY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="34" cy="24" rx="8" ry="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><ellipse cx="34" cy="24" rx="4.5" ry="16" fill="#fbcfe8"/><ellipse cx="66" cy="24" rx="8" ry="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><ellipse cx="66" cy="24" rx="4.5" ry="16" fill="#fbcfe8"/><ellipse cx="50" cy="60" rx="30" ry="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><ellipse cx="40" cy="54" rx="4.5" ry="5.5" fill="#1e293b"/><circle cx="38" cy="52" r="1.5" fill="#ffffff"/><ellipse cx="60" cy="54" rx="4.5" ry="5.5" fill="#1e293b"/><circle cx="58" cy="52" r="1.5" fill="#ffffff"/><polygon points="47,62 53,62 50,66" fill="#f472b6"/><path d="M50 66 Q45 71 43 68" fill="none" stroke="#475569" stroke-width="1.8" stroke-linecap="round"/><path d="M50 66 Q55 71 57 68" fill="none" stroke="#475569" stroke-width="1.8" stroke-linecap="round"/><circle cx="30" cy="62" r="4" fill="#fda4af" opacity="0.6"/><circle cx="70" cy="62" r="4" fill="#fda4af" opacity="0.6"/></svg>`;

const FROG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="frg" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#86efac"/><stop offset="50%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></radialGradient></defs><circle cx="32" cy="35" r="14" fill="url(#frg)" stroke="#15803d" stroke-width="2"/><circle cx="32" cy="35" r="9" fill="#ffffff"/><circle cx="32" cy="35" r="5" fill="#1c1917"/><circle cx="30" cy="33" r="1.8" fill="#ffffff"/><circle cx="68" cy="35" r="14" fill="url(#frg)" stroke="#15803d" stroke-width="2"/><circle cx="68" cy="35" r="9" fill="#ffffff"/><circle cx="68" cy="35" r="5" fill="#1c1917"/><circle cx="66" cy="33" r="1.8" fill="#ffffff"/><ellipse cx="50" cy="58" rx="34" ry="26" fill="url(#frg)" stroke="#15803d" stroke-width="2"/><ellipse cx="50" cy="66" rx="22" ry="14" fill="#dcfce7"/><path d="M30 60 Q50 78 70 60" fill="none" stroke="#14532d" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="62" r="4" fill="#fda4af" opacity="0.7"/><circle cx="72" cy="62" r="4" fill="#fda4af" opacity="0.7"/></svg>`;

const BEAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="brg" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#d97706"/><stop offset="70%" stop-color="#92400e"/><stop offset="100%" stop-color="#78350f"/></radialGradient></defs><circle cx="24" cy="30" r="12" fill="url(#brg)" stroke="#78350f" stroke-width="2"/><circle cx="24" cy="30" r="7" fill="#fed7aa"/><circle cx="76" cy="30" r="12" fill="url(#brg)" stroke="#78350f" stroke-width="2"/><circle cx="76" cy="30" r="7" fill="#fed7aa"/><circle cx="50" cy="55" r="32" fill="url(#brg)" stroke="#78350f" stroke-width="2"/><ellipse cx="38" cy="48" rx="4.5" ry="5.5" fill="#1c1917"/><circle cx="36.5" cy="46.5" r="1.5" fill="#ffffff"/><ellipse cx="62" cy="48" rx="4.5" ry="5.5" fill="#1c1917"/><circle cx="60.5" cy="46.5" r="1.5" fill="#ffffff"/><ellipse cx="50" cy="64" rx="16" ry="12" fill="#fed7aa"/><ellipse cx="50" cy="60" rx="6" ry="4.5" fill="#1c1917"/><path d="M45 68 Q50 74 55 68" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round"/></svg>`;

const DUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="dkg" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#fef08a"/><stop offset="60%" stop-color="#facc15"/><stop offset="100%" stop-color="#eab308"/></radialGradient></defs><ellipse cx="50" cy="62" rx="30" ry="24" fill="url(#dkg)" stroke="#ca8a04" stroke-width="2"/><circle cx="60" cy="38" r="20" fill="url(#dkg)" stroke="#ca8a04" stroke-width="2"/><ellipse cx="78" cy="42" rx="12" ry="6" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/><ellipse cx="64" cy="34" rx="3.5" ry="4.5" fill="#1c1917"/><circle cx="63" cy="32.5" r="1.2" fill="#ffffff"/><circle cx="56" cy="42" r="3" fill="#fca5a5" opacity="0.6"/><path d="M35 62 Q45 74 55 62" fill="none" stroke="#ca8a04" stroke-width="2.5" stroke-linecap="round"/></svg>`;

// ==========================================
// 4. SHAPES SVGS
// ==========================================
const STAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="starg" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="#fef08a"/><stop offset="40%" stop-color="#facc15"/><stop offset="100%" stop-color="#eab308"/></radialGradient></defs><polygon points="50,6 63,34 95,38 72,60 78,92 50,76 22,92 28,60 5,38 37,34" fill="url(#starg)" stroke="#ca8a04" stroke-width="2.5" stroke-linejoin="round"/><circle cx="43" cy="48" r="3" fill="#854d0e"/><circle cx="57" cy="48" r="3" fill="#854d0e"/><path d="M46 54 Q50 58 54 54" fill="none" stroke="#854d0e" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="52" r="2.5" fill="#f87171" opacity="0.6"/><circle cx="62" cy="52" r="2.5" fill="#f87171" opacity="0.6"/></svg>`;

const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="htg" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#fda4af"/><stop offset="40%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#be123c"/></radialGradient></defs><path d="M50 88 C20 65 8 46 8 30 C8 16 20 8 32 8 C40 8 46 14 50 20 C54 14 60 8 68 8 C80 8 92 16 92 30 C92 46 80 65 50 88 Z" fill="url(#htg)" stroke="#9f1239" stroke-width="2.5"/><ellipse cx="32" cy="24" rx="7" ry="12" transform="rotate(-30 32 24)" fill="#ffffff" opacity="0.45"/></svg>`;

const CIRCLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cirg" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="50%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></radialGradient></defs><circle cx="50" cy="50" r="42" fill="url(#cirg)" stroke="#1e40af" stroke-width="3"/><ellipse cx="36" cy="34" rx="10" ry="16" transform="rotate(-35 36 34)" fill="#ffffff" opacity="0.45"/></svg>`;

const SQUARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="sqg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fdba74"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#c2410c"/></linearGradient></defs><rect x="12" y="12" width="76" height="76" rx="16" fill="url(#sqg)" stroke="#9a3412" stroke-width="3"/><rect x="18" y="18" width="64" height="24" rx="8" fill="#ffffff" opacity="0.25"/></svg>`;

const TRIANGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="trig" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#86efac"/><stop offset="50%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></linearGradient></defs><polygon points="50,10 90,86 10,86" fill="url(#trig)" stroke="#14532d" stroke-width="3" stroke-linejoin="round"/><polygon points="50,22 80,80 20,80" fill="#ffffff" opacity="0.18"/></svg>`;

const DIAMOND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="dmg" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#e879f9"/><stop offset="50%" stop-color="#c026d3"/><stop offset="100%" stop-color="#86198f"/></radialGradient></defs><polygon points="50,8 90,50 50,92 10,50" fill="url(#dmg)" stroke="#701a75" stroke-width="3" stroke-linejoin="round"/><polygon points="50,18 78,50 50,82 22,50" fill="#ffffff" opacity="0.25"/></svg>`;

// ==========================================
// 5. COLORS SVGS (SPLASHES / SWATCHES)
// ==========================================
const COLOR_RED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cred" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#fca5a5"/><stop offset="50%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></radialGradient></defs><path d="M50 10 C62 25 88 45 88 64 C88 85 71 94 50 94 C29 94 12 85 12 64 C12 45 38 25 50 10 Z" fill="url(#cred)" stroke="#991b1b" stroke-width="3"/><ellipse cx="36" cy="50" rx="8" ry="18" transform="rotate(-25 36 50)" fill="#ffffff" opacity="0.45"/></svg>`;

const COLOR_BLUE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cblue" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="50%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></radialGradient></defs><path d="M50 10 C62 25 88 45 88 64 C88 85 71 94 50 94 C29 94 12 85 12 64 C12 45 38 25 50 10 Z" fill="url(#cblue)" stroke="#1e40af" stroke-width="3"/><ellipse cx="36" cy="50" rx="8" ry="18" transform="rotate(-25 36 50)" fill="#ffffff" opacity="0.45"/></svg>`;

const COLOR_GREEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cgrn" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#86efac"/><stop offset="50%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></radialGradient></defs><path d="M50 10 C62 25 88 45 88 64 C88 85 71 94 50 94 C29 94 12 85 12 64 C12 45 38 25 50 10 Z" fill="url(#cgrn)" stroke="#14532d" stroke-width="3"/><ellipse cx="36" cy="50" rx="8" ry="18" transform="rotate(-25 36 50)" fill="#ffffff" opacity="0.45"/></svg>`;

const COLOR_YELLOW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cyel" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#facc15"/><stop offset="100%" stop-color="#eab308"/></radialGradient></defs><path d="M50 10 C62 25 88 45 88 64 C88 85 71 94 50 94 C29 94 12 85 12 64 C12 45 38 25 50 10 Z" fill="url(#cyel)" stroke="#ca8a04" stroke-width="3"/><ellipse cx="36" cy="50" rx="8" ry="18" transform="rotate(-25 36 50)" fill="#ffffff" opacity="0.55"/></svg>`;

const COLOR_PURPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cpur" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#d8b4fe"/><stop offset="50%" stop-color="#a855f7"/><stop offset="100%" stop-color="#7e22ce"/></radialGradient></defs><path d="M50 10 C62 25 88 45 88 64 C88 85 71 94 50 94 C29 94 12 85 12 64 C12 45 38 25 50 10 Z" fill="url(#cpur)" stroke="#6b21a8" stroke-width="3"/><ellipse cx="36" cy="50" rx="8" ry="18" transform="rotate(-25 36 50)" fill="#ffffff" opacity="0.45"/></svg>`;

const COLOR_ORANGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="cora" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#fed7aa"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#c2410c"/></radialGradient></defs><path d="M50 10 C62 25 88 45 88 64 C88 85 71 94 50 94 C29 94 12 85 12 64 C12 45 38 25 50 10 Z" fill="url(#cora)" stroke="#9a3412" stroke-width="3"/><ellipse cx="36" cy="50" rx="8" ry="18" transform="rotate(-25 36 50)" fill="#ffffff" opacity="0.45"/></svg>`;

// ==========================================
// 6. NUMBERS & MATH SVGS
// ==========================================
const NUM_1_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/><text x="50" y="70" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">1</text></svg>`;

const NUM_2_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#10b981" stroke="#047857" stroke-width="3"/><text x="50" y="70" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">2</text></svg>`;

const NUM_3_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#f59e0b" stroke="#b45309" stroke-width="3"/><text x="50" y="70" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">3</text></svg>`;

const NUM_4_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#8b5cf6" stroke="#6d28d9" stroke-width="3"/><text x="50" y="70" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">4</text></svg>`;

const NUM_5_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/><text x="50" y="70" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">5</text></svg>`;

const PLUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#06b6d4" stroke="#0e7490" stroke-width="3"/><rect x="42" y="24" width="16" height="52" rx="6" fill="#ffffff"/><rect x="24" y="42" width="52" height="16" rx="6" fill="#ffffff"/></svg>`;

const MINUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#f97316" stroke="#c2410c" stroke-width="3"/><rect x="24" y="42" width="52" height="16" rx="6" fill="#ffffff"/></svg>`;

const EQUALS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#8b5cf6" stroke="#6d28d9" stroke-width="3"/><rect x="24" y="32" width="52" height="14" rx="5" fill="#ffffff"/><rect x="24" y="54" width="52" height="14" rx="5" fill="#ffffff"/></svg>`;

// ==========================================
// 7. ALPHABET SVGS
// ==========================================
const LETTER_A_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/><text x="50" y="71" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">A</text></svg>`;

const LETTER_B_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/><text x="50" y="71" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">B</text></svg>`;

const LETTER_C_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#10b981" stroke="#047857" stroke-width="3"/><text x="50" y="71" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">C</text></svg>`;

const LETTER_D_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="20" fill="#f59e0b" stroke="#b45309" stroke-width="3"/><text x="50" y="71" font-size="58" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#ffffff">D</text></svg>`;

// ==========================================
// 8. COINS & EVERYDAY OBJECTS SVGS
// ==========================================
const COIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="coing" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#facc15"/><stop offset="100%" stop-color="#ca8a04"/></radialGradient></defs><circle cx="50" cy="50" r="42" fill="url(#coing)" stroke="#a16207" stroke-width="3.5"/><circle cx="50" cy="50" r="34" fill="none" stroke="#ca8a04" stroke-width="2" stroke-dasharray="3,3"/><polygon points="50,26 56,40 70,42 60,52 63,66 50,59 37,66 40,52 30,42 44,40" fill="#eab308" stroke="#a16207" stroke-width="1.5"/><ellipse cx="36" cy="34" rx="8" ry="14" transform="rotate(-30 36 34)" fill="#ffffff" opacity="0.45"/></svg>`;

const DOLLAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="24" width="80" height="52" rx="8" fill="#16a34a" stroke="#14532d" stroke-width="3"/><rect x="16" y="30" width="68" height="40" rx="4" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/><circle cx="50" cy="50" r="14" fill="#bbf7d0"/><text x="50" y="60" font-size="28" font-family="Arial, sans-serif" font-weight="900" text-anchor="middle" fill="#14532d">$</text></svg>`;

const CAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="carg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f87171"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></linearGradient></defs><path d="M22 55 L32 32 C34 28 42 26 55 26 L68 26 C75 26 80 32 82 42 L88 55 C92 56 94 60 94 66 L94 72 C94 75 90 78 86 78 L14 78 C10 78 6 75 6 72 L6 66 C6 60 10 56 22 55 Z" fill="url(#carg)" stroke="#991b1b" stroke-width="2.5"/><path d="M36 34 L52 34 L52 52 L26 52 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/><path d="M58 34 L72 34 L78 52 L58 52 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/><circle cx="28" cy="78" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="2"/><circle cx="28" cy="78" r="4.5" fill="#cbd5e1"/><circle cx="72" cy="78" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="2"/><circle cx="72" cy="78" r="4.5" fill="#cbd5e1"/><circle cx="12" cy="64" r="3" fill="#fef08a"/><circle cx="88" cy="64" r="3" fill="#fef08a"/></svg>`;

const BUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="busg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#facc15"/><stop offset="100%" stop-color="#eab308"/></linearGradient></defs><rect x="12" y="24" width="76" height="52" rx="12" fill="url(#busg)" stroke="#ca8a04" stroke-width="2.5"/><rect x="18" y="32" width="18" height="16" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/><rect x="42" y="32" width="18" height="16" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/><rect x="66" y="32" width="18" height="16" rx="3" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/><rect x="12" y="56" width="76" height="6" fill="#1e293b"/><circle cx="28" cy="78" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="2"/><circle cx="28" cy="78" r="4" fill="#cbd5e1"/><circle cx="72" cy="78" r="11" fill="#1e293b" stroke="#0f172a" stroke-width="2"/><circle cx="72" cy="78" r="4" fill="#cbd5e1"/></svg>`;

const ROCKET_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="rktg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="70%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#94a3b8"/></linearGradient></defs><polygon points="40,74 50,96 60,74" fill="#f97316"/><polygon points="44,74 50,88 56,74" fill="#fde047"/><path d="M26 62 L14 74 L30 76 Z" fill="#ef4444"/><path d="M74 62 L86 74 L70 76 Z" fill="#ef4444"/><path d="M50 8 C34 26 32 60 32 74 L68 74 C68 60 66 26 50 8 Z" fill="url(#rktg)" stroke="#64748b" stroke-width="2"/><path d="M50 8 C42 16 38 24 38 30 L62 30 C62 24 58 16 50 8 Z" fill="#ef4444"/><circle cx="50" cy="46" r="10" fill="#38bdf8" stroke="#0284c7" stroke-width="2.5"/><circle cx="48" cy="44" r="3" fill="#ffffff" opacity="0.6"/></svg>`;

const BALLOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="blng" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#f87171"/><stop offset="50%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></radialGradient></defs><ellipse cx="50" cy="44" rx="32" ry="36" fill="url(#blng)" stroke="#991b1b" stroke-width="2"/><polygon points="46,80 54,80 50,86" fill="#b91c1c"/><path d="M50 86 Q54 94 48 98" fill="none" stroke="#78716c" stroke-width="2" stroke-linecap="round"/><ellipse cx="36" cy="30" rx="7" ry="14" transform="rotate(-25 36 30)" fill="#ffffff" opacity="0.45"/></svg>`;

const COOKIE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="ckg" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="#fde68a"/><stop offset="60%" stop-color="#d97706"/><stop offset="100%" stop-color="#b45309"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#ckg)" stroke="#92400e" stroke-width="2.5"/><circle cx="34" cy="36" r="5" fill="#451a03"/><circle cx="62" cy="34" r="5" fill="#451a03"/><circle cx="46" cy="50" r="5.5" fill="#451a03"/><circle cx="32" cy="64" r="5" fill="#451a03"/><circle cx="65" cy="62" r="5" fill="#451a03"/><circle cx="52" cy="74" r="4" fill="#451a03"/></svg>`;

const CAKE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="flmg" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#fef08a"/><stop offset="60%" stop-color="#f97316"/><stop offset="100%" stop-color="#ef4444"/></radialGradient></defs><rect x="47" y="18" width="6" height="18" rx="2" fill="#38bdf8"/><path d="M50 6 C47 12 45 15 50 18 C55 15 53 12 50 6 Z" fill="url(#flmg)"/><path d="M22 50 C22 36 34 32 50 32 C66 32 78 36 78 50 Z" fill="#fbcfe8" stroke="#f472b6" stroke-width="2"/><circle cx="28" cy="50" r="7" fill="#f43f5e"/><circle cx="42" cy="52" r="7" fill="#f43f5e"/><circle cx="58" cy="52" r="7" fill="#f43f5e"/><circle cx="72" cy="50" r="7" fill="#f43f5e"/><path d="M26 52 L32 86 C32 90 68 90 68 86 L74 52 Z" fill="#fed7aa" stroke="#ea580c" stroke-width="2"/></svg>`;

const PENCIL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="png" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#facc15"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient></defs><g transform="rotate(45 50 50)"><rect x="40" y="24" width="20" height="50" fill="url(#png)" stroke="#a16207" stroke-width="1.5"/><rect x="40" y="74" width="20" height="12" rx="4" fill="#f472b6" stroke="#db2777" stroke-width="1.5"/><polygon points="40,24 60,24 50,6" fill="#fed7aa" stroke="#d97706" stroke-width="1.5"/><polygon points="46,14 54,14 50,6" fill="#1c1917"/></g></svg>`;

const BOOK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M12 28 C30 24 48 30 50 34 C52 30 70 24 88 28 L88 76 C70 72 52 76 50 82 C48 76 30 72 12 76 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2.5"/><path d="M16 32 C32 28 46 32 50 36 C54 32 68 28 84 32 L84 72 C68 68 54 72 50 76 C46 72 32 68 16 72 Z" fill="#f8fafc"/><line x1="50" y1="36" x2="50" y2="76" stroke="#94a3b8" stroke-width="2"/></svg>`;

// ==========================================
// FULL REGISTRY DEFINITION
// ==========================================
export const CLIPART_REGISTRY: ClipartItem[] = [
  // --- FRUITS ---
  {
    id: 'fruit-apple',
    name: 'Red Apple',
    category: 'fruits',
    path: '/clipart/fruits/apple.svg',
    dataUri: toDataUri(APPLE_SVG),
    keywords: ['apple', 'apples', 'red apple', 'fruit'],
    emojiEquivalent: '🍎'
  },
  {
    id: 'fruit-banana',
    name: 'Yellow Banana',
    category: 'fruits',
    path: '/clipart/fruits/banana.svg',
    dataUri: toDataUri(BANANA_SVG),
    keywords: ['banana', 'bananas', 'yellow banana'],
    emojiEquivalent: '🍌'
  },
  {
    id: 'fruit-strawberry',
    name: 'Sweet Strawberry',
    category: 'fruits',
    path: '/clipart/fruits/strawberry.svg',
    dataUri: toDataUri(STRAWBERRY_SVG),
    keywords: ['strawberry', 'strawberries', 'berry'],
    emojiEquivalent: '🍓'
  },
  {
    id: 'fruit-orange',
    name: 'Juicy Orange',
    category: 'fruits',
    path: '/clipart/fruits/orange.svg',
    dataUri: toDataUri(ORANGE_SVG),
    keywords: ['orange', 'oranges', 'citrus'],
    emojiEquivalent: '🍊'
  },
  {
    id: 'fruit-grapes',
    name: 'Purple Grapes',
    category: 'fruits',
    path: '/clipart/fruits/grapes.svg',
    dataUri: toDataUri(GRAPES_SVG),
    keywords: ['grapes', 'grape', 'purple grapes'],
    emojiEquivalent: '🍇'
  },
  {
    id: 'fruit-watermelon',
    name: 'Watermelon Slice',
    category: 'fruits',
    path: '/clipart/fruits/watermelon.svg',
    dataUri: toDataUri(WATERMELON_SVG),
    keywords: ['watermelon', 'melon', 'watermelon slice'],
    emojiEquivalent: '🍉'
  },
  {
    id: 'fruit-cherry',
    name: 'Twin Cherries',
    category: 'fruits',
    path: '/clipart/fruits/cherry.svg',
    dataUri: toDataUri(CHERRY_SVG),
    keywords: ['cherry', 'cherries', 'red cherry'],
    emojiEquivalent: '🍒'
  },

  // --- VEGETABLES ---
  {
    id: 'veg-carrot',
    name: 'Crunchy Carrot',
    category: 'vegetables',
    path: '/clipart/vegetables/carrot.svg',
    dataUri: toDataUri(CARROT_SVG),
    keywords: ['carrot', 'carrots', 'vegetable'],
    emojiEquivalent: '🥕'
  },
  {
    id: 'veg-broccoli',
    name: 'Green Broccoli',
    category: 'vegetables',
    path: '/clipart/vegetables/broccoli.svg',
    dataUri: toDataUri(BROCCOLI_SVG),
    keywords: ['broccoli', 'green broccoli'],
    emojiEquivalent: '🥦'
  },
  {
    id: 'veg-tomato',
    name: 'Red Tomato',
    category: 'vegetables',
    path: '/clipart/vegetables/tomato.svg',
    dataUri: toDataUri(TOMATO_SVG),
    keywords: ['tomato', 'tomatoes'],
    emojiEquivalent: '🍅'
  },
  {
    id: 'veg-corn',
    name: 'Sweet Corn',
    category: 'vegetables',
    path: '/clipart/vegetables/corn.svg',
    dataUri: toDataUri(CORN_SVG),
    keywords: ['corn', 'sweetcorn', 'maize'],
    emojiEquivalent: '🌽'
  },
  {
    id: 'veg-mushroom',
    name: 'Spotted Mushroom',
    category: 'vegetables',
    path: '/clipart/vegetables/mushroom.svg',
    dataUri: toDataUri(MUSHROOM_SVG),
    keywords: ['mushroom', 'mushrooms', 'fungi'],
    emojiEquivalent: '🍄'
  },

  // --- ANIMALS ---
  {
    id: 'animal-monkey',
    name: 'Playful Monkey',
    category: 'animals',
    path: '/clipart/animals/monkey.svg',
    dataUri: toDataUri(MONKEY_SVG),
    keywords: ['monkey', 'monkeys', 'ape', 'chimp'],
    emojiEquivalent: '🐒'
  },
  {
    id: 'animal-puppy',
    name: 'Happy Puppy',
    category: 'animals',
    path: '/clipart/animals/puppy.svg',
    dataUri: toDataUri(PUPPY_SVG),
    keywords: ['puppy', 'dog', 'doggy', 'canine', 'pup'],
    emojiEquivalent: '🐶'
  },
  {
    id: 'animal-cat',
    name: 'Cute Kitten',
    category: 'animals',
    path: '/clipart/animals/cat.svg',
    dataUri: toDataUri(CAT_SVG),
    keywords: ['cat', 'kitten', 'kitty', 'feline'],
    emojiEquivalent: '🐱'
  },
  {
    id: 'animal-cow',
    name: 'Friendly Cow',
    category: 'animals',
    path: '/clipart/animals/cow.svg',
    dataUri: toDataUri(COW_SVG),
    keywords: ['cow', 'cattle', 'dairy cow', 'calf'],
    emojiEquivalent: '🐮'
  },
  {
    id: 'animal-lion',
    name: 'Brave Lion',
    category: 'animals',
    path: '/clipart/animals/lion.svg',
    dataUri: toDataUri(LION_SVG),
    keywords: ['lion', 'cub', 'king'],
    emojiEquivalent: '🦁'
  },
  {
    id: 'animal-bunny',
    name: 'Fluffy Bunny',
    category: 'animals',
    path: '/clipart/animals/bunny.svg',
    dataUri: toDataUri(BUNNY_SVG),
    keywords: ['bunny', 'rabbit', 'hare'],
    emojiEquivalent: '🐰'
  },
  {
    id: 'animal-frog',
    name: 'Green Frog',
    category: 'animals',
    path: '/clipart/animals/frog.svg',
    dataUri: toDataUri(FROG_SVG),
    keywords: ['frog', 'toad', 'treefrog'],
    emojiEquivalent: '🐸'
  },
  {
    id: 'animal-bear',
    name: 'Teddy Bear',
    category: 'animals',
    path: '/clipart/animals/bear.svg',
    dataUri: toDataUri(BEAR_SVG),
    keywords: ['bear', 'teddy', 'grizzly'],
    emojiEquivalent: '🐻'
  },
  {
    id: 'animal-duck',
    name: 'Yellow Duckling',
    category: 'animals',
    path: '/clipart/animals/duck.svg',
    dataUri: toDataUri(DUCK_SVG),
    keywords: ['duck', 'duckling', 'bird'],
    emojiEquivalent: '🦆'
  },

  // --- SHAPES ---
  {
    id: 'shape-star',
    name: 'Golden Star',
    category: 'shapes',
    path: '/clipart/shapes/star.svg',
    dataUri: toDataUri(STAR_SVG),
    keywords: ['star', 'stars', 'golden star', 'shining star'],
    emojiEquivalent: '⭐'
  },
  {
    id: 'shape-heart',
    name: 'Love Heart',
    category: 'shapes',
    path: '/clipart/shapes/heart.svg',
    dataUri: toDataUri(HEART_SVG),
    keywords: ['heart', 'love', 'red heart'],
    emojiEquivalent: '❤️'
  },
  {
    id: 'shape-circle',
    name: 'Blue Circle',
    category: 'shapes',
    path: '/clipart/shapes/circle.svg',
    dataUri: toDataUri(CIRCLE_SVG),
    keywords: ['circle', 'round', 'blue circle'],
    emojiEquivalent: '🔵'
  },
  {
    id: 'shape-square',
    name: 'Orange Square',
    category: 'shapes',
    path: '/clipart/shapes/square.svg',
    dataUri: toDataUri(SQUARE_SVG),
    keywords: ['square', 'box', 'orange square'],
    emojiEquivalent: '🟧'
  },
  {
    id: 'shape-triangle',
    name: 'Green Triangle',
    category: 'shapes',
    path: '/clipart/shapes/triangle.svg',
    dataUri: toDataUri(TRIANGLE_SVG),
    keywords: ['triangle', 'delta', 'green triangle'],
    emojiEquivalent: '🔺'
  },
  {
    id: 'shape-diamond',
    name: 'Purple Diamond',
    category: 'shapes',
    path: '/clipart/shapes/diamond.svg',
    dataUri: toDataUri(DIAMOND_SVG),
    keywords: ['diamond', 'rhombus', 'gem'],
    emojiEquivalent: '🔷'
  },

  // --- COLORS ---
  {
    id: 'color-red',
    name: 'Ruby Red',
    category: 'colors',
    path: '/clipart/colors/red.svg',
    dataUri: toDataUri(COLOR_RED_SVG),
    keywords: ['red', 'color red', 'red color', 'red paint'],
    emojiEquivalent: '🔴'
  },
  {
    id: 'color-blue',
    name: 'Ocean Blue',
    category: 'colors',
    path: '/clipart/colors/blue.svg',
    dataUri: toDataUri(COLOR_BLUE_SVG),
    keywords: ['blue', 'color blue', 'blue color', 'blue paint'],
    emojiEquivalent: '🔵'
  },
  {
    id: 'color-green',
    name: 'Leaf Green',
    category: 'colors',
    path: '/clipart/colors/green.svg',
    dataUri: toDataUri(COLOR_GREEN_SVG),
    keywords: ['green', 'color green', 'green color', 'green paint'],
    emojiEquivalent: '🟢'
  },
  {
    id: 'color-yellow',
    name: 'Sun Yellow',
    category: 'colors',
    path: '/clipart/colors/yellow.svg',
    dataUri: toDataUri(COLOR_YELLOW_SVG),
    keywords: ['yellow', 'color yellow', 'yellow color', 'yellow paint'],
    emojiEquivalent: '🟡'
  },
  {
    id: 'color-purple',
    name: 'Grape Purple',
    category: 'colors',
    path: '/clipart/colors/purple.svg',
    dataUri: toDataUri(COLOR_PURPLE_SVG),
    keywords: ['purple', 'color purple', 'violet', 'purple paint'],
    emojiEquivalent: '🟣'
  },
  {
    id: 'color-orange',
    name: 'Tangy Orange',
    category: 'colors',
    path: '/clipart/colors/orange.svg',
    dataUri: toDataUri(COLOR_ORANGE_SVG),
    keywords: ['orange color', 'color orange', 'orange paint'],
    emojiEquivalent: '🟠'
  },

  // --- NUMBERS & MATH ---
  {
    id: 'num-1',
    name: 'Number 1',
    category: 'numbers',
    path: '/clipart/numbers/1.svg',
    dataUri: toDataUri(NUM_1_SVG),
    keywords: ['1', 'number 1', 'one', 'num 1'],
    emojiEquivalent: '1️⃣'
  },
  {
    id: 'num-2',
    name: 'Number 2',
    category: 'numbers',
    path: '/clipart/numbers/2.svg',
    dataUri: toDataUri(NUM_2_SVG),
    keywords: ['2', 'number 2', 'two', 'num 2'],
    emojiEquivalent: '2️⃣'
  },
  {
    id: 'num-3',
    name: 'Number 3',
    category: 'numbers',
    path: '/clipart/numbers/3.svg',
    dataUri: toDataUri(NUM_3_SVG),
    keywords: ['3', 'number 3', 'three', 'num 3'],
    emojiEquivalent: '3️⃣'
  },
  {
    id: 'num-4',
    name: 'Number 4',
    category: 'numbers',
    path: '/clipart/numbers/4.svg',
    dataUri: toDataUri(NUM_4_SVG),
    keywords: ['4', 'number 4', 'four', 'num 4'],
    emojiEquivalent: '4️⃣'
  },
  {
    id: 'num-5',
    name: 'Number 5',
    category: 'numbers',
    path: '/clipart/numbers/5.svg',
    dataUri: toDataUri(NUM_5_SVG),
    keywords: ['5', 'number 5', 'five', 'num 5'],
    emojiEquivalent: '5️⃣'
  },
  {
    id: 'math-plus',
    name: 'Plus Sign',
    category: 'numbers',
    path: '/clipart/numbers/plus.svg',
    dataUri: toDataUri(PLUS_SVG),
    keywords: ['plus', 'add', 'addition', '+'],
    emojiEquivalent: '➕'
  },
  {
    id: 'math-minus',
    name: 'Minus Sign',
    category: 'numbers',
    path: '/clipart/numbers/minus.svg',
    dataUri: toDataUri(MINUS_SVG),
    keywords: ['minus', 'subtract', 'subtraction', '-'],
    emojiEquivalent: '➖'
  },
  {
    id: 'math-equals',
    name: 'Equals Sign',
    category: 'numbers',
    path: '/clipart/numbers/equals.svg',
    dataUri: toDataUri(EQUALS_SVG),
    keywords: ['equals', 'equal', '='],
    emojiEquivalent: '🟰'
  },

  // --- ALPHABET ---
  {
    id: 'alpha-a',
    name: 'Letter A',
    category: 'alphabet',
    path: '/clipart/alphabet/a.svg',
    dataUri: toDataUri(LETTER_A_SVG),
    keywords: ['a', 'letter a', 'alpha a'],
    emojiEquivalent: '🅰️'
  },
  {
    id: 'alpha-b',
    name: 'Letter B',
    category: 'alphabet',
    path: '/clipart/alphabet/b.svg',
    dataUri: toDataUri(LETTER_B_SVG),
    keywords: ['b', 'letter b', 'alpha b'],
    emojiEquivalent: '🅱️'
  },
  {
    id: 'alpha-c',
    name: 'Letter C',
    category: 'alphabet',
    path: '/clipart/alphabet/c.svg',
    dataUri: toDataUri(LETTER_C_SVG),
    keywords: ['c', 'letter c', 'alpha c'],
    emojiEquivalent: '©️'
  },
  {
    id: 'alpha-d',
    name: 'Letter D',
    category: 'alphabet',
    path: '/clipart/alphabet/d.svg',
    dataUri: toDataUri(LETTER_D_SVG),
    keywords: ['d', 'letter d', 'alpha d'],
    emojiEquivalent: '🇩'
  },

  // --- COINS & OBJECTS ---
  {
    id: 'obj-coin',
    name: 'Gold Coin',
    category: 'objects',
    path: '/clipart/objects/coin.svg',
    dataUri: toDataUri(COIN_SVG),
    keywords: ['coin', 'coins', 'gold coin', 'token', 'money'],
    emojiEquivalent: '🪙'
  },
  {
    id: 'obj-dollar',
    name: 'Dollar Bill',
    category: 'objects',
    path: '/clipart/objects/dollar.svg',
    dataUri: toDataUri(DOLLAR_SVG),
    keywords: ['dollar', 'dollars', 'bill', 'note', 'cash'],
    emojiEquivalent: '💵'
  },
  {
    id: 'obj-car',
    name: 'Red Toy Car',
    category: 'objects',
    path: '/clipart/objects/car.svg',
    dataUri: toDataUri(CAR_SVG),
    keywords: ['car', 'cars', 'toy car', 'vehicle', 'automobile'],
    emojiEquivalent: '🚗'
  },
  {
    id: 'obj-bus',
    name: 'School Bus',
    category: 'objects',
    path: '/clipart/objects/bus.svg',
    dataUri: toDataUri(BUS_SVG),
    keywords: ['bus', 'school bus', 'yellow bus'],
    emojiEquivalent: '🚌'
  },
  {
    id: 'obj-rocket',
    name: 'Space Rocket',
    category: 'objects',
    path: '/clipart/objects/rocket.svg',
    dataUri: toDataUri(ROCKET_SVG),
    keywords: ['rocket', 'spaceship', 'blastoff'],
    emojiEquivalent: '🚀'
  },
  {
    id: 'obj-balloon',
    name: 'Red Balloon',
    category: 'objects',
    path: '/clipart/objects/balloon.svg',
    dataUri: toDataUri(BALLOON_SVG),
    keywords: ['balloon', 'balloons', 'party balloon'],
    emojiEquivalent: '🎈'
  },
  {
    id: 'obj-cookie',
    name: 'Choc-Chip Cookie',
    category: 'objects',
    path: '/clipart/objects/cookie.svg',
    dataUri: toDataUri(COOKIE_SVG),
    keywords: ['cookie', 'cookies', 'biscuit'],
    emojiEquivalent: '🍪'
  },
  {
    id: 'obj-cake',
    name: 'Birthday Cupcake',
    category: 'objects',
    path: '/clipart/objects/cake.svg',
    dataUri: toDataUri(CAKE_SVG),
    keywords: ['cake', 'cupcake', 'birthday cake'],
    emojiEquivalent: '🧁'
  },
  {
    id: 'obj-pencil',
    name: 'School Pencil',
    category: 'objects',
    path: '/clipart/objects/pencil.svg',
    dataUri: toDataUri(PENCIL_SVG),
    keywords: ['pencil', 'pen', 'draw', 'write'],
    emojiEquivalent: '✏️'
  },
  {
    id: 'obj-book',
    name: 'Story Book',
    category: 'objects',
    path: '/clipart/objects/book.svg',
    dataUri: toDataUri(BOOK_SVG),
    keywords: ['book', 'storybook', 'read'],
    emojiEquivalent: '📖'
  }
];

export interface ResolvedClipart {
  id: string;
  isImage: boolean;
  src: string;
  fallbackSrc?: string;
  emoji?: string;
  alt: string;
}

/**
 * Returns all cliparts for a given category/family
 */
export function getClipartsByCategory(category: ClipartCategory): ClipartItem[] {
  return CLIPART_REGISTRY.filter(item => item.category === category);
}

/**
 * Resolves any single clipart item (ID, name, keyword, emoji, or path)
 */
export function resolveClipartItem(input: string | undefined | null): ResolvedClipart | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // Extract from bracket tag [clipart:apple] or [apple]
  const bracketMatch = raw.match(/^\[(?:clipart:)?([^\]]+)\]$/i);
  const cleanInput = bracketMatch ? bracketMatch[1].trim() : raw;

  // 1. Direct path/url check against registry
  const matchedByPath = CLIPART_REGISTRY.find(item => item.path === cleanInput || cleanInput.includes(item.path));
  if (matchedByPath) {
    return {
      id: matchedByPath.id,
      isImage: true,
      src: matchedByPath.dataUri,
      fallbackSrc: matchedByPath.path,
      alt: matchedByPath.name,
      emoji: matchedByPath.emojiEquivalent
    };
  }

  // 2. Direct external image or SVG URL
  if (cleanInput.startsWith('/') || cleanInput.startsWith('http://') || cleanInput.startsWith('https://') || cleanInput.startsWith('data:image/')) {
    const fileName = cleanInput.split('/').pop()?.split('.')[0] || 'clipart';
    return {
      id: fileName,
      isImage: true,
      src: cleanInput,
      alt: fileName.charAt(0).toUpperCase() + fileName.slice(1)
    };
  }

  // 3. Keyword or ID match in Registry
  const cleanKey = cleanInput.toLowerCase().replace(/[\-_]/g, ' ').trim();
  const match = CLIPART_REGISTRY.find(item => 
    item.id.toLowerCase() === cleanInput.toLowerCase() ||
    item.name.toLowerCase() === cleanKey ||
    item.keywords.includes(cleanKey) ||
    item.keywords.some(k => cleanKey.includes(k)) ||
    (item.emojiEquivalent && cleanInput.includes(item.emojiEquivalent))
  );

  if (match) {
    return {
      id: match.id,
      isImage: true,
      src: match.dataUri,
      fallbackSrc: match.path,
      alt: match.name,
      emoji: match.emojiEquivalent
    };
  }

  // 4. Fallback: treat as Unicode emoji string
  return {
    id: cleanInput,
    isImage: false,
    src: '',
    emoji: cleanInput,
    alt: cleanInput
  };
}

/**
 * Resolves MULTIPLE clipart items from a string, supporting delimiters like:
 * "apple, banana, star"
 * "apple|banana|apple"
 * "apple x 3"
 * "🍎 🍎 🍌"
 */
export function resolveMultipleClipartItems(raw: string | undefined | null): ResolvedClipart[] {
  if (!raw || !raw.trim()) return [];

  // Check for "item x count" or "item*count" pattern (e.g. "apple x 4" or "fruit-apple * 3")
  const repeatMatch = raw.trim().match(/^(.+?)\s*(?:[xX*])\s*(\d+)$/);
  if (repeatMatch) {
    const itemKey = repeatMatch[1].trim();
    const count = Math.min(30, Math.max(1, parseInt(repeatMatch[2], 10)));
    const resolved = resolveClipartItem(itemKey);
    if (resolved) {
      return Array.from({ length: count }, (_, idx) => ({
        ...resolved,
        id: `${resolved.id}-${idx}`
      }));
    }
  }

  // Check for delimiter: comma, pipe, slash, or spaces between bracket tags
  let tokens: string[] = [];
  if (raw.includes('|')) {
    tokens = raw.split('|');
  } else if (raw.includes(',')) {
    tokens = raw.split(',');
  } else if (raw.includes('] [')) {
    tokens = raw.split(/(?<=\])\s*(?=\[)/);
  } else {
    // Check if it's multiple emojis space-separated
    tokens = raw.split(/\s+/);
  }

  const result: ResolvedClipart[] = [];
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    const resolved = resolveClipartItem(trimmed);
    if (resolved) {
      result.push(resolved);
    }
  }

  return result.length > 0 ? result : (resolveClipartItem(raw) ? [resolveClipartItem(raw)!] : []);
}

/**
 * Helper to parse an option string like "[apple] Fresh Apple" or "monkey" or "[star]"
 */
export function parseOptionClipart(optionText: string | undefined | null): {
  hasClipart: boolean;
  clipart: ResolvedClipart | null;
  cleanText: string;
} {
  if (!optionText || !optionText.trim()) {
    return { hasClipart: false, clipart: null, cleanText: '' };
  }

  const raw = optionText.trim();

  // Pattern A: "[apple] Red Apple" or "[apple]"
  const bracketMatch = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (bracketMatch) {
    const tag = bracketMatch[1].trim();
    const rest = bracketMatch[2].trim();
    const resolved = resolveClipartItem(tag);
    if (resolved) {
      return {
        hasClipart: true,
        clipart: resolved,
        cleanText: rest
      };
    }
  }

  // Pattern B: Option is EXACTLY a known clipart keyword or ID or emoji (e.g. "apple", "monkey", "star", "🍎")
  const directMatch = CLIPART_REGISTRY.find(
    c => c.keywords.includes(raw.toLowerCase()) || 
         c.id.toLowerCase() === raw.toLowerCase() ||
         (c.emojiEquivalent && raw === c.emojiEquivalent)
  );

  if (directMatch) {
    return {
      hasClipart: true,
      clipart: {
        id: directMatch.id,
        isImage: true,
        src: directMatch.dataUri,
        fallbackSrc: directMatch.path,
        alt: directMatch.name,
        emoji: directMatch.emojiEquivalent
      },
      cleanText: ''
    };
  }

  return {
    hasClipart: false,
    clipart: null,
    cleanText: raw
  };
}
