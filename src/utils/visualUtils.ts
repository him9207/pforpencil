// Helper to sanitize text, clean garbled unicode (mojibake like ðŸŽ or Ã©),
// and convert friendly English word names into high-resolution colorful emojis.

const EMOJI_MAP: Record<string, string> = {
  // Fruits & food
  apple: '🍎',
  apples: '🍎',
  banana: '🍌',
  bananas: '🍌',
  orange: '🍊',
  oranges: '🍊',
  strawberry: '🍓',
  strawberries: '🍓',
  cookie: '🍪',
  cookies: '🍪',
  cake: '🍰',
  donut: '🍩',
  candy: '🍬',
  icecream: '🍦',
  pizza: '🍕',
  watermelon: '🍉',
  carrot: '🥕',
  grape: '🍇',
  grapes: '🍇',

  // Shapes & symbols
  star: '⭐',
  stars: '⭐',
  circle: '🔴',
  redcircle: '🔴',
  bluecircle: '🔵',
  square: '🟩',
  greensquare: '🟩',
  triangle: '🔺',
  heart: '❤️',
  diamond: '💎',
  sun: '☀️',
  moon: '🌙',
  cloud: '☁️',

  // Animals
  dog: '🐶',
  puppy: '🐶',
  cat: '🐱',
  kitten: '🐱',
  lion: '🦁',
  elephant: '🐘',
  mouse: '🐁',
  bird: '🐦',
  duck: '🦆',
  fish: '🐟',
  butterfly: '🦋',
  rabbit: '🐰',
  bunny: '🐰',
  bear: '🐻',
  frog: '🐸',
  monkey: '🐵',
  chick: '🐥',
  cow: '🐮',
  pig: '🐷',

  // Objects & toys
  ball: '⚽',
  car: '🚗',
  balloon: '🎈',
  bell: '🔔',
  book: '📚',
  pencil: '✏️',
  flower: '🌸',
  tree: '🌳',
  clock: '⏰',
  gift: '🎁',
  present: '🎁'
};

/**
 * Repairs common mojibake where UTF-8 bytes were misinterpreted as Windows-1252 / ISO-8859-1 (Latin1)
 * Example: 'ðŸ Ž' -> '🍎', 'Ã©' -> 'é'
 */
export function fixMojibake(str: string): string {
  if (!str) return '';
  // Check if string contains typical mojibake patterns
  if (/[ÃÂð][\x80-\xBF]/.test(str) || str.includes('ðŸ')) {
    try {
      // Decode byte-by-byte
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i) & 0xff;
      }
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (decoded && !decoded.includes('')) {
        return decoded;
      }
    } catch {
      // Fallback: return original
    }
  }
  return str;
}

/**
 * Converts words or emojis into clean emojis.
 * Users can type simple words like "apple|apple|apple" or emojis "🍎|🍎|🍎"
 * and both work seamlessly!
 */
export function resolveVisualEmoji(item: string): { label: string; emoji: string } {
  if (!item) return { label: 'item', emoji: '🍎' };
  const cleaned = fixMojibake(item).trim();
  const normalizedKey = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (EMOJI_MAP[normalizedKey]) {
    return {
      label: cleaned,
      emoji: EMOJI_MAP[normalizedKey]
    };
  }

  // If already emoji or special symbol, keep it
  return {
    label: cleaned,
    emoji: cleaned
  };
}

export function parseVisualObjectsString(raw: string): { id: string; label: string; emoji: string }[] {
  if (!raw || !raw.trim()) return [];
  const fixed = fixMojibake(raw);
  // Support pipe `|`, comma `,`, or multiple spaces as delimiters
  const tokens = fixed.includes('|')
    ? fixed.split('|')
    : fixed.includes(',')
    ? fixed.split(',')
    : fixed.split(/\s+/);

  return tokens
    .map((token, i) => {
      const trimmed = token.trim();
      if (!trimmed) return null;
      const { label, emoji } = resolveVisualEmoji(trimmed);
      return {
        id: `obj-${i + 1}`,
        label,
        emoji
      };
    })
    .filter((x): x is { id: string; label: string; emoji: string } => Boolean(x && x.label));
}
