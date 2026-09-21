export interface ClipartItem {
  id: string; // clean identifier e.g. 'apple', 'star', 'cookie'
  code: string; // uppercase code e.g. 'CLIP_APPLE'
  name: string; // friendly name
  emoji: string; // default emoji or icon symbol
  category: 'Fruits & Food' | 'Shapes & Geometry' | 'Animals & Nature' | 'Objects & School' | 'Numbers & Counters' | 'Vehicles & Transport';
  defaultAnimation: 'bounce' | 'pulse' | 'spin' | 'pop' | 'float';
  keywords: string[];
}

export const CLIPART_LIBRARY: ClipartItem[] = [
  // Fruits & Food
  { id: 'apple', code: 'CLIP_APPLE', name: 'Red Apple', emoji: '🍎', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['apple', 'fruit', 'red'] },
  { id: 'green_apple', code: 'CLIP_GREEN_APPLE', name: 'Green Apple', emoji: '🍏', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['green apple', 'fruit'] },
  { id: 'banana', code: 'CLIP_BANANA', name: 'Yellow Banana', emoji: '🍌', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['banana', 'fruit', 'yellow'] },
  { id: 'cookie', code: 'CLIP_COOKIE', name: 'Chocolate Cookie', emoji: '🍪', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['cookie', 'biscuit', 'snack'] },
  { id: 'strawberry', code: 'CLIP_STRAWBERRY', name: 'Sweet Strawberry', emoji: '🍓', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['strawberry', 'berry', 'fruit'] },
  { id: 'orange', code: 'CLIP_ORANGE', name: 'Juicy Orange', emoji: '🍊', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['orange', 'citrus', 'fruit'] },
  { id: 'grapes', code: 'CLIP_GRAPES', name: 'Purple Grapes', emoji: '🍇', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['grapes', 'bunch', 'fruit'] },
  { id: 'watermelon', code: 'CLIP_WATERMELON', name: 'Watermelon Slice', emoji: '🍉', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['watermelon', 'slice', 'melon'] },
  { id: 'cupcake', code: 'CLIP_CUPCAKE', name: 'Sweet Cupcake', emoji: '🧁', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['cupcake', 'cake', 'dessert'] },
  { id: 'pizza', code: 'CLIP_PIZZA', name: 'Pizza Slice', emoji: '🍕', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['pizza', 'fraction', 'slice'] },
  { id: 'icecream', code: 'CLIP_ICECREAM', name: 'Ice Cream Cone', emoji: '🍦', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['ice cream', 'cone', 'cold'] },
  { id: 'carrot', code: 'CLIP_CARROT', name: 'Crunchy Carrot', emoji: '🥕', category: 'Fruits & Food', defaultAnimation: 'bounce', keywords: ['carrot', 'vegetable'] },

  // Shapes & Geometry
  { id: 'star', code: 'CLIP_STAR', name: 'Golden Star', emoji: '⭐', category: 'Shapes & Geometry', defaultAnimation: 'pulse', keywords: ['star', 'yellow', 'gold', 'shape'] },
  { id: 'sparkles', code: 'CLIP_SPARKLES', name: 'Glitter Sparkles', emoji: '✨', category: 'Shapes & Geometry', defaultAnimation: 'pulse', keywords: ['sparkle', 'shine', 'star'] },
  { id: 'circle_red', code: 'CLIP_CIRCLE_RED', name: 'Red Circle', emoji: '🔴', category: 'Shapes & Geometry', defaultAnimation: 'pop', keywords: ['circle', 'red circle', 'round'] },
  { id: 'circle_blue', code: 'CLIP_CIRCLE_BLUE', name: 'Blue Circle', emoji: '🔵', category: 'Shapes & Geometry', defaultAnimation: 'pop', keywords: ['blue circle', 'round'] },
  { id: 'triangle', code: 'CLIP_TRIANGLE', name: 'Orange Triangle', emoji: '🔺', category: 'Shapes & Geometry', defaultAnimation: 'pop', keywords: ['triangle', 'delta', '3 sides'] },
  { id: 'square_blue', code: 'CLIP_SQUARE_BLUE', name: 'Blue Square', emoji: '🟦', category: 'Shapes & Geometry', defaultAnimation: 'pop', keywords: ['square', 'blue square', '4 sides'] },
  { id: 'square_green', code: 'CLIP_SQUARE_GREEN', name: 'Green Square', emoji: '🟩', category: 'Shapes & Geometry', defaultAnimation: 'pop', keywords: ['green square', 'box'] },
  { id: 'diamond', code: 'CLIP_DIAMOND', name: 'Purple Diamond', emoji: '🔷', category: 'Shapes & Geometry', defaultAnimation: 'pop', keywords: ['diamond', 'rhombus', 'shape'] },
  { id: 'heart', code: 'CLIP_HEART', name: 'Red Heart', emoji: '❤️', category: 'Shapes & Geometry', defaultAnimation: 'pulse', keywords: ['heart', 'love', 'red'] },

  // Animals & Nature
  { id: 'cat', code: 'CLIP_CAT', name: 'Playful Kitten', emoji: '🐱', category: 'Animals & Nature', defaultAnimation: 'bounce', keywords: ['cat', 'kitten', 'meow', 'pet'] },
  { id: 'dog', code: 'CLIP_DOG', name: 'Puppy Dog', emoji: '🐶', category: 'Animals & Nature', defaultAnimation: 'bounce', keywords: ['dog', 'puppy', 'woof', 'pet'] },
  { id: 'bunny', code: 'CLIP_BUNNY', name: 'Fluffy Bunny', emoji: '🐰', category: 'Animals & Nature', defaultAnimation: 'bounce', keywords: ['rabbit', 'bunny', 'hare'] },
  { id: 'bear', code: 'CLIP_BEAR', name: 'Teddy Bear', emoji: '🐻', category: 'Animals & Nature', defaultAnimation: 'bounce', keywords: ['bear', 'teddy'] },
  { id: 'duck', code: 'CLIP_DUCK', name: 'Yellow Duckling', emoji: '🦆', category: 'Animals & Nature', defaultAnimation: 'bounce', keywords: ['duck', 'bird', 'pond'] },
  { id: 'frog', code: 'CLIP_FROG', name: 'Green Treefrog', emoji: '🐸', category: 'Animals & Nature', defaultAnimation: 'bounce', keywords: ['frog', 'toad', 'green'] },
  { id: 'fish', code: 'CLIP_FISH', name: 'Tropical Fish', emoji: '🐠', category: 'Animals & Nature', defaultAnimation: 'float', keywords: ['fish', 'sea', 'ocean', 'water'] },
  { id: 'butterfly', code: 'CLIP_BUTTERFLY', name: 'Colorful Butterfly', emoji: '🦋', category: 'Animals & Nature', defaultAnimation: 'float', keywords: ['butterfly', 'insect', 'fly'] },
  { id: 'flower', code: 'CLIP_FLOWER', name: 'Blooming Flower', emoji: '🌸', category: 'Animals & Nature', defaultAnimation: 'pulse', keywords: ['flower', 'blossom', 'plant'] },
  { id: 'tree', code: 'CLIP_TREE', name: 'Green Forest Tree', emoji: '🌳', category: 'Animals & Nature', defaultAnimation: 'pulse', keywords: ['tree', 'forest', 'nature'] },
  { id: 'sun', code: 'CLIP_SUN', name: 'Bright Sun', emoji: '☀️', category: 'Animals & Nature', defaultAnimation: 'spin', keywords: ['sun', 'sunny', 'weather', 'light'] },

  // Objects & School
  { id: 'balloon', code: 'CLIP_BALLOON', name: 'Party Balloon', emoji: '🎈', category: 'Objects & School', defaultAnimation: 'float', keywords: ['balloon', 'party', 'red'] },
  { id: 'gift', code: 'CLIP_GIFT', name: 'Surprise Present Box', emoji: '🎁', category: 'Objects & School', defaultAnimation: 'bounce', keywords: ['gift', 'present', 'box'] },
  { id: 'pencil', code: 'CLIP_PENCIL', name: 'Writing Pencil', emoji: '✏️', category: 'Objects & School', defaultAnimation: 'bounce', keywords: ['pencil', 'write', 'draw'] },
  { id: 'book', code: 'CLIP_BOOK', name: 'Open Book', emoji: '📖', category: 'Objects & School', defaultAnimation: 'pulse', keywords: ['book', 'read', 'story'] },
  { id: 'bell', code: 'CLIP_BELL', name: 'School Bell', emoji: '🔔', category: 'Objects & School', defaultAnimation: 'pulse', keywords: ['bell', 'ring', 'sound'] },
  { id: 'clock', code: 'CLIP_CLOCK', name: 'Analog Clock', emoji: '🕒', category: 'Objects & School', defaultAnimation: 'pulse', keywords: ['clock', 'time', 'hour'] },
  { id: 'music_note', code: 'CLIP_MUSIC', name: 'Musical Notes', emoji: '🎵', category: 'Objects & School', defaultAnimation: 'bounce', keywords: ['music', 'song', 'sound'] },

  // Numbers & Counters
  { id: 'counter_num1', code: 'CLIP_NUM1', name: 'Number One Tile', emoji: '1️⃣', category: 'Numbers & Counters', defaultAnimation: 'pop', keywords: ['1', 'one', 'number'] },
  { id: 'counter_num2', code: 'CLIP_NUM2', name: 'Number Two Tile', emoji: '2️⃣', category: 'Numbers & Counters', defaultAnimation: 'pop', keywords: ['2', 'two', 'number'] },
  { id: 'counter_num3', code: 'CLIP_NUM3', name: 'Number Three Tile', emoji: '3️⃣', category: 'Numbers & Counters', defaultAnimation: 'pop', keywords: ['3', 'three', 'number'] },
  { id: 'counter_num4', code: 'CLIP_NUM4', name: 'Number Four Tile', emoji: '4️⃣', category: 'Numbers & Counters', defaultAnimation: 'pop', keywords: ['4', 'four', 'number'] },
  { id: 'counter_num5', code: 'CLIP_NUM5', name: 'Number Five Tile', emoji: '5️⃣', category: 'Numbers & Counters', defaultAnimation: 'pop', keywords: ['5', 'five', 'number'] },
  { id: 'dice', code: 'CLIP_DICE', name: 'Rolling Dice', emoji: '🎲', category: 'Numbers & Counters', defaultAnimation: 'spin', keywords: ['dice', 'game', 'math', 'probability'] },

  // Vehicles & Transport
  { id: 'car', code: 'CLIP_CAR', name: 'Red Toy Car', emoji: '🚗', category: 'Vehicles & Transport', defaultAnimation: 'bounce', keywords: ['car', 'auto', 'drive'] },
  { id: 'bus', code: 'CLIP_BUS', name: 'Yellow School Bus', emoji: '🚌', category: 'Vehicles & Transport', defaultAnimation: 'bounce', keywords: ['bus', 'school bus', 'ride'] },
  { id: 'train', code: 'CLIP_TRAIN', name: 'Steam Train', emoji: '🚂', category: 'Vehicles & Transport', defaultAnimation: 'bounce', keywords: ['train', 'locomotive', 'rail'] },
  { id: 'rocket', code: 'CLIP_ROCKET', name: 'Space Rocket', emoji: '🚀', category: 'Vehicles & Transport', defaultAnimation: 'float', keywords: ['rocket', 'space', 'ship'] }
];

/**
 * Look up a clipart item by ID, code, name, or emoji
 */
export function lookupClipart(ref: string | undefined): ClipartItem | undefined {
  if (!ref) return undefined;
  const clean = ref.trim().toLowerCase();
  if (!clean) return undefined;

  // Direct match by ID or Code
  const direct = CLIPART_LIBRARY.find(
    item =>
      item.id.toLowerCase() === clean ||
      item.code.toLowerCase() === clean ||
      item.emoji === ref.trim() ||
      item.name.toLowerCase() === clean
  );
  if (direct) return direct;

  // Keyword match
  const byKeyword = CLIPART_LIBRARY.find(item =>
    item.keywords.some(k => clean.includes(k) || k.includes(clean))
  );
  return byKeyword;
}

/**
 * Resolve a clipart reference string into emojis or repeated clipart badges
 * e.g. "apple" with count 4 -> "🍎 🍎 🍎 🍎"
 * e.g. "CLIP_STAR|CLIP_STAR" -> "⭐ ⭐"
 */
export function resolveClipartString(ref: string | undefined, count: number = 1): {
  emoji: string;
  badge: string;
  animation: 'bounce' | 'pulse' | 'spin' | 'pop' | 'float';
  item?: ClipartItem;
} {
  if (!ref || !ref.trim()) {
    return {
      emoji: '🍎',
      badge: '🍎',
      animation: 'bounce'
    };
  }

  // Check if multiple references are pipe separated (e.g. apple|banana|star)
  if (ref.includes('|')) {
    const tokens = ref.split('|').map(t => t.trim()).filter(Boolean);
    const resolvedTokens = tokens.map(t => {
      const match = lookupClipart(t);
      return match ? match.emoji : t;
    });
    return {
      emoji: resolvedTokens[0] || '🍎',
      badge: resolvedTokens.join(' '),
      animation: 'bounce'
    };
  }

  const match = lookupClipart(ref);
  if (match) {
    const repeatCount = Math.max(1, Math.min(20, count || 1));
    const badge = Array(repeatCount).fill(match.emoji).join(' ');
    return {
      emoji: match.emoji,
      badge,
      animation: match.defaultAnimation,
      item: match
    };
  }

  // Fallback: If it's raw text/emoji
  const repeatCount = Math.max(1, Math.min(20, count || 1));
  const cleanRef = ref.trim();
  const isEmoji = /\p{Extended_Pictographic}/u.test(cleanRef);
  const badge = isEmoji ? Array(repeatCount).fill(cleanRef).join(' ') : cleanRef;

  return {
    emoji: cleanRef,
    badge,
    animation: 'bounce'
  };
}
