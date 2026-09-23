import { AnyTactileActivity } from '../types';

export const SAMPLE_TACTILE_ACTIVITIES: AnyTactileActivity[] = [
  // =========================================================================
  // PRESCHOOL & FOUNDATION (AGES 3–5)
  // =========================================================================

  // 1. Feeding Care: Feed the Hungry Monkey (Counting Bananas)
  {
    id: 'act-feed-monkey-count',
    type: 'feeding_game',
    title: 'Feed the Hungry Monkey: Counting Bananas',
    instruction: 'Count the bananas and tap the matching basket to feed the cheerful monkey!',
    gradeLevel: 'preschool',
    subject: 'math',
    topic: 'Number Sense & Counting 1–5',
    difficulty: 'beginner',
    icon: '🐒',
    hint: 'Count the bright yellow bananas one by one!',
    character: 'monkey',
    characterName: 'Milo the Monkey',
    foodEmoji: '🍌',
    foodName: 'Bananas',
    tasks: [
      {
        id: 't-1',
        targetQuestion: 'How many bananas are here? 🍌 🍌 🍌',
        correctItemIndex: 1,
        options: [
          { label: '2 Bananas', emoji: '🍌🍌', value: 2 },
          { label: '3 Bananas', emoji: '🍌🍌🍌', value: 3 },
          { label: '4 Bananas', emoji: '🍌🍌🍌🍌', value: 4 },
          { label: '5 Bananas', emoji: '🍌🍌🍌🍌🍌', value: 5 }
        ]
      },
      {
        id: 't-2',
        targetQuestion: 'Feed Milo 2 sweet bananas! 🍌 🍌',
        correctItemIndex: 0,
        options: [
          { label: '2 Bananas', emoji: '🍌🍌', value: 2 },
          { label: '1 Banana', emoji: '🍌', value: 1 },
          { label: '3 Bananas', emoji: '🍌🍌🍌', value: 3 },
          { label: '4 Bananas', emoji: '🍌🍌🍌🍌', value: 4 }
        ]
      },
      {
        id: 't-3',
        targetQuestion: 'Find 4 bananas for Milo’s snack! 🍌 🍌 🍌 🍌',
        correctItemIndex: 2,
        options: [
          { label: '1 Banana', emoji: '🍌', value: 1 },
          { label: '3 Bananas', emoji: '🍌🍌🍌', value: 3 },
          { label: '4 Bananas', emoji: '🍌🍌🍌🍌', value: 4 },
          { label: '2 Bananas', emoji: '🍌🍌', value: 2 }
        ]
      }
    ]
  },

  // 2. Feeding Care: Feed the Bunny (Colors & Shapes)
  {
    id: 'act-feed-bunny-colors',
    type: 'feeding_game',
    title: 'Feed the Fluffy Bunny: Orange Carrots',
    instruction: 'Find the fresh orange carrots to feed Bella the hungry Bunny!',
    gradeLevel: 'foundation',
    subject: 'logic',
    topic: 'Color & Attribute Recognition',
    difficulty: 'beginner',
    icon: '🐰',
    hint: 'Look for the bright orange vegetable with green leaves!',
    character: 'bunny',
    characterName: 'Bella the Bunny',
    foodEmoji: '🥕',
    foodName: 'Crunchy Carrots',
    tasks: [
      {
        id: 'b-1',
        targetQuestion: 'Bella is looking for a Crunchy Orange Carrot 🥕!',
        correctItemIndex: 0,
        options: [
          { label: 'Orange Carrot', emoji: '🥕', value: 'carrot' },
          { label: 'Purple Eggplant', emoji: '🍆', value: 'eggplant' },
          { label: 'Green Broccoli', emoji: '🥦', value: 'broccoli' },
          { label: 'Red Chili', emoji: '🌶️', value: 'chili' }
        ]
      },
      {
        id: 'b-2',
        targetQuestion: 'Choose the bunch of 3 Crispy Carrots 🥕🥕🥕!',
        correctItemIndex: 2,
        options: [
          { label: '1 Carrot', emoji: '🥕', value: 1 },
          { label: '2 Carrots', emoji: '🥕🥕', value: 2 },
          { label: '3 Carrots', emoji: '🥕🥕🥕', value: 3 },
          { label: '4 Carrots', emoji: '🥕🥕🥕🥕', value: 4 }
        ]
      }
    ]
  },

  // 3. Drag & Drop Sorting: Big vs Small Animals
  {
    id: 'act-sort-big-small',
    type: 'drag_drop_sort',
    title: 'Big Animals vs. Small Animals Sorter',
    instruction: 'Drag each animal into the Big Animals bin or Small Animals bin!',
    gradeLevel: 'preschool',
    subject: 'science',
    topic: 'Size Comparison & Animal Classification',
    difficulty: 'beginner',
    icon: '🐘',
    hint: 'Elephants and Whales are huge, while ladybugs and mice are tiny!',
    bins: [
      { id: 'bin-big', title: '🐘 Big Animals', emoji: '🐘', colorScheme: 'blue' },
      { id: 'bin-small', title: '🐭 Small Animals', emoji: '🐭', colorScheme: 'emerald' }
    ],
    items: [
      { id: 'item-ele', label: 'Elephant', emoji: '🐘', targetBinId: 'bin-big' },
      { id: 'item-mouse', label: 'Little Mouse', emoji: '🐭', targetBinId: 'bin-small' },
      { id: 'item-whale', label: 'Blue Whale', emoji: '🐋', targetBinId: 'bin-big' },
      { id: 'item-ant', label: 'Tiny Ant', emoji: '🐜', targetBinId: 'bin-small' },
      { id: 'item-giraffe', label: 'Tall Giraffe', emoji: '🦒', targetBinId: 'bin-big' },
      { id: 'item-ladybug', label: 'Ladybug', emoji: '🐞', targetBinId: 'bin-small' }
    ]
  },

  // 4. Guided Tracing: Number 8 & Infinity Loop
  {
    id: 'act-trace-number-eight',
    type: 'canvas_tracing',
    title: 'Precision Tracing: Number 8 Figure-Loop',
    instruction: 'Trace the figure-8 loop following the numbered checkpoints smoothly with your finger or mouse!',
    gradeLevel: 'preschool',
    subject: 'math',
    topic: 'Number Formation & Fine Motor Control',
    difficulty: 'beginner',
    icon: '✍️',
    hint: 'Start at the top dot, loop down to the left, cross over, loop up, and return to start!',
    characterOrShape: '8',
    strokeColor: '#3b82f6',
    paths: [
      {
        id: 'p-8',
        label: 'Figure 8 Loop',
        guideSvgPath: 'M 150 60 C 100 60 70 110 110 150 C 150 190 230 240 190 280 C 150 320 80 300 80 260 C 80 210 160 170 190 130 C 220 90 200 60 150 60 Z',
        viewBox: '0 0 300 350',
        startingPoint: { x: 50, y: 17 },
        checkpoints: [
          { x: 50, y: 17, order: 1 },
          { x: 30, y: 35, order: 2 },
          { x: 50, y: 50, order: 3 },
          { x: 65, y: 70, order: 4 },
          { x: 50, y: 85, order: 5 },
          { x: 30, y: 70, order: 6 },
          { x: 50, y: 50, order: 7 },
          { x: 65, y: 30, order: 8 }
        ]
      }
    ]
  },

  // 5. Guided Tracing: Letter A
  {
    id: 'act-trace-letter-a',
    type: 'canvas_tracing',
    title: 'Alphabet Formation: Capital Letter A',
    instruction: 'Trace the uppercase letter A starting from the bottom-left up to the peak, down to the right, and across!',
    gradeLevel: 'kindergarten',
    subject: 'literacy',
    topic: 'Letter Formation & Handwriting',
    difficulty: 'beginner',
    icon: '🔤',
    hint: 'Follow strokes: 1. Slant up, 2. Slant down, 3. Cross the bridge in the middle!',
    characterOrShape: 'A',
    strokeColor: '#8b5cf6',
    paths: [
      {
        id: 'p-a',
        label: 'Letter A',
        guideSvgPath: 'M 70 300 L 150 60 L 230 300 M 105 200 L 195 200',
        viewBox: '0 0 300 350',
        startingPoint: { x: 23, y: 85 },
        checkpoints: [
          { x: 23, y: 85, order: 1 },
          { x: 50, y: 17, order: 2 },
          { x: 77, y: 85, order: 3 },
          { x: 35, y: 57, order: 4 },
          { x: 65, y: 57, order: 5 }
        ]
      }
    ]
  },

  // =========================================================================
  // GRADE 1 & GRADE 2 (PRIMARY FOUNDATIONS)
  // =========================================================================

  // 6. Phonics Word Builder: CVC Lab
  {
    id: 'act-phonics-cvc-builder',
    type: 'phonics_builder',
    title: 'CVC Phonics Lab: Word Maker',
    instruction: 'Listen to the word clue and drag sound tiles into the slots to construct the correct word!',
    gradeLevel: 'grade_1',
    subject: 'literacy',
    topic: 'CVC Word Families',
    difficulty: 'beginner',
    icon: '🎧',
    hint: 'Listen to the starting sound, the middle vowel sound, and the ending sound!',
    targetWords: [
      {
        id: 'target-cat',
        word: 'CAT',
        hintImageOrEmoji: '🐱',
        clueText: 'A furry pet that loves to purr and say meow!',
        requiredTiles: ['C', 'A', 'T'],
        meaning: 'Domestic feline animal'
      },
      {
        id: 'target-sun',
        word: 'SUN',
        hintImageOrEmoji: '☀️',
        clueText: 'The big bright star that gives daylight and warmth!',
        requiredTiles: ['S', 'U', 'N'],
        meaning: 'Celestial light source'
      },
      {
        id: 'target-pen',
        word: 'PEN',
        hintImageOrEmoji: '🖊️',
        clueText: 'A tool filled with ink used for writing notes!',
        requiredTiles: ['P', 'E', 'N'],
        meaning: 'Writing instrument'
      }
    ],
    availableTiles: [
      { id: 't-c', sound: 'C', phonemeType: 'consonant' },
      { id: 't-a', sound: 'A', phonemeType: 'vowel' },
      { id: 't-t', sound: 'T', phonemeType: 'consonant' },
      { id: 't-s', sound: 'S', phonemeType: 'consonant' },
      { id: 't-u', sound: 'U', phonemeType: 'vowel' },
      { id: 't-n', sound: 'N', phonemeType: 'consonant' },
      { id: 't-p', sound: 'P', phonemeType: 'consonant' },
      { id: 't-e', sound: 'E', phonemeType: 'vowel' },
      { id: 't-b', sound: 'B', phonemeType: 'consonant' },
      { id: 't-g', sound: 'G', phonemeType: 'consonant' }
    ]
  },

  // 7. Drag & Drop Sorting: Even vs Odd Numbers
  {
    id: 'act-sort-even-odd',
    type: 'drag_drop_sort',
    title: 'Even vs. Odd Numbers Sorter',
    instruction: 'Sort each numbered gem into the Even Numbers bin (2, 4, 6, 8, 10) or Odd Numbers bin (1, 3, 5, 7, 9)!',
    gradeLevel: 'grade_2',
    subject: 'math',
    topic: 'Number Properties & Parity',
    difficulty: 'intermediate',
    icon: '🔢',
    hint: 'Even numbers can be split evenly into 2 equal teams with no leftover!',
    bins: [
      { id: 'bin-even', title: 'Even Numbers (2, 4, 6, 8...)', emoji: '🟢', colorScheme: 'emerald' },
      { id: 'bin-odd', title: 'Odd Numbers (1, 3, 5, 7...)', emoji: '🟣', colorScheme: 'purple' }
    ],
    items: [
      { id: 'num-2', label: 'Number 2', emoji: '2️⃣', targetBinId: 'bin-even' },
      { id: 'num-7', label: 'Number 7', emoji: '7️⃣', targetBinId: 'bin-odd' },
      { id: 'num-4', label: 'Number 4', emoji: '4️⃣', targetBinId: 'bin-even' },
      { id: 'num-9', label: 'Number 9', emoji: '9️⃣', targetBinId: 'bin-odd' },
      { id: 'num-6', label: 'Number 6', emoji: '6️⃣', targetBinId: 'bin-even' },
      { id: 'num-3', label: 'Number 3', emoji: '3️⃣', targetBinId: 'bin-odd' }
    ]
  },

  // 8. Balloon Pop: Sum to 10 Carnival
  {
    id: 'act-balloon-sum-10',
    type: 'balloon_pop',
    title: 'Carnival Balloon Pop: Make Sum = 10',
    instruction: 'Pop all the balloons containing addition pairs that equal exactly 10!',
    gradeLevel: 'grade_1',
    subject: 'math',
    topic: 'Addition Number Bonds to 10',
    difficulty: 'beginner',
    icon: '🎈',
    hint: 'Pairs that make 10: 5+5, 6+4, 7+3, 8+2, 9+1!',
    targetPrompt: 'Pop only the balloons that equal 10!',
    balloons: [
      { id: 'b-1', text: '7 + 3', color: '#ec4899', isCorrect: true },
      { id: 'b-2', text: '4 + 5', color: '#3b82f6', isCorrect: false },
      { id: 'b-3', text: '6 + 4', color: '#10b981', isCorrect: true },
      { id: 'b-4', text: '8 + 1', color: '#f59e0b', isCorrect: false },
      { id: 'b-5', text: '5 + 5', color: '#8b5cf6', isCorrect: true },
      { id: 'b-6', text: '9 + 1', color: '#06b6d4', isCorrect: true },
      { id: 'b-7', text: '2 + 6', color: '#64748b', isCorrect: false },
      { id: 'b-8', text: '8 + 2', color: '#ef4444', isCorrect: true }
    ]
  },

  // 9. Memory Match: Addition Double Facts
  {
    id: 'act-memory-doubles',
    type: 'memory_match',
    title: 'Memory Match: Addition Doubles Fact Cards',
    instruction: 'Flip the cards to match each addition double equation with its correct sum!',
    gradeLevel: 'grade_2',
    subject: 'math',
    topic: 'Mental Math & Doubles Facts',
    difficulty: 'intermediate',
    icon: '🃏',
    hint: '3+3=6, 4+4=8, 5+5=10, 6+6=12!',
    cards: [
      { id: 'c-1', matchKey: 'pair-3', content: '3 + 3', emoji: '➕' },
      { id: 'c-2', matchKey: 'pair-3', content: '= 6', emoji: '6️⃣' },
      { id: 'c-3', matchKey: 'pair-4', content: '4 + 4', emoji: '➕' },
      { id: 'c-4', matchKey: 'pair-4', content: '= 8', emoji: '8️⃣' },
      { id: 'c-5', matchKey: 'pair-5', content: '5 + 5', emoji: '➕' },
      { id: 'c-6', matchKey: 'pair-5', content: '= 10', emoji: '🔟' },
      { id: 'c-7', matchKey: 'pair-6', content: '6 + 6', emoji: '➕' },
      { id: 'c-8', matchKey: 'pair-6', content: '= 12', emoji: '⭐' }
    ]
  },

  // 10. Timeline Sequence: Butterfly Life Cycle
  {
    id: 'act-seq-butterfly-lifecycle',
    type: 'timeline_sequence',
    title: 'Life Cycle Sequencing: The Butterfly Story',
    instruction: 'Arrange the 4 life cycle stages in correct chronological order from beginning to end!',
    gradeLevel: 'grade_1',
    subject: 'science',
    topic: 'Metamorphosis & Life Cycles',
    difficulty: 'intermediate',
    icon: '🐛',
    hint: 'It starts with tiny eggs on a leaf, then hatches into a caterpillar!',
    storyTitle: 'The Miracle of Metamorphosis',
    cards: [
      {
        id: 'card-egg',
        correctOrderIndex: 0,
        label: 'Stage 1: Tiny Eggs',
        emoji: '🥚',
        description: 'A mother butterfly lays tiny eggs securely on a green plant leaf.'
      },
      {
        id: 'card-caterpillar',
        correctOrderIndex: 1,
        label: 'Stage 2: Hungry Caterpillar',
        emoji: '🐛',
        description: 'The egg hatches into a larva that munches leaves and grows quickly.'
      },
      {
        id: 'card-chrysalis',
        correctOrderIndex: 2,
        label: 'Stage 3: Chrysalis / Pupa',
        emoji: '🪴',
        description: 'The caterpillar forms a protective cocoon shell to undergo its transformation.'
      },
      {
        id: 'card-butterfly',
        correctOrderIndex: 3,
        label: 'Stage 4: Adult Butterfly',
        emoji: '🦋',
        description: 'A beautiful winged butterfly emerges and takes flight into the sky!'
      }
    ]
  },

  // =========================================================================
  // GRADE 3 & GRADE 4 (INTERMEDIATE MASTERY)
  // =========================================================================

  // 11. Drag & Drop Sorting: States of Matter (Solid, Liquid, Gas)
  {
    id: 'act-sort-matter-states',
    type: 'drag_drop_sort',
    title: 'States of Matter Sorting Lab',
    instruction: 'Sort each item into Solid, Liquid, or Gas based on its physical properties!',
    gradeLevel: 'grade_3',
    subject: 'science',
    topic: 'Physical Science & Matter',
    difficulty: 'intermediate',
    icon: '🧪',
    hint: 'Solids keep their shape, liquids flow into cups, and gases expand to fill spaces!',
    bins: [
      { id: 'bin-solid', title: '🧊 Solid', emoji: '🧊', colorScheme: 'blue' },
      { id: 'bin-liquid', title: '💧 Liquid', emoji: '💧', colorScheme: 'emerald' },
      { id: 'bin-gas', title: '💨 Gas', emoji: '💨', colorScheme: 'purple' }
    ],
    items: [
      { id: 'item-ice', label: 'Ice Cube', emoji: '🧊', targetBinId: 'bin-solid' },
      { id: 'item-water', label: 'Glass of Water', emoji: '🥛', targetBinId: 'bin-liquid' },
      { id: 'item-steam', label: 'Kettle Steam', emoji: '♨️', targetBinId: 'bin-gas' },
      { id: 'item-rock', label: 'Granite Rock', emoji: '🪨', targetBinId: 'bin-solid' },
      { id: 'item-juice', label: 'Orange Juice', emoji: '🧃', targetBinId: 'bin-liquid' },
      { id: 'item-balloon-gas', label: 'Helium Gas', emoji: '🎈', targetBinId: 'bin-gas' }
    ]
  },

  // 12. Line Connect: Multiplication Facts to Products
  {
    id: 'act-connect-multiplication',
    type: 'line_connect',
    title: 'Multiplication Array & Product Connector',
    instruction: 'Connect each multiplication fact equation on the left to its correct product on the right!',
    gradeLevel: 'grade_3',
    subject: 'math',
    topic: 'Multiplication Tables & Mental Math',
    difficulty: 'intermediate',
    icon: '✖️',
    hint: 'Multiply rows by columns: 6 × 7 = 42, 8 × 4 = 32!',
    leftNodes: [
      { id: 'eq-6x7', label: '6 × 7', emoji: '✖️', pairId: 'pair-42' },
      { id: 'eq-8x4', label: '8 × 4', emoji: '✖️', pairId: 'pair-32' },
      { id: 'eq-9x5', label: '9 × 5', emoji: '✖️', pairId: 'pair-45' },
      { id: 'eq-7x7', label: '7 × 7', emoji: '✖️', pairId: 'pair-49' }
    ],
    rightNodes: [
      { id: 'ans-32', label: '32', emoji: '🎯', pairId: 'pair-32' },
      { id: 'ans-42', label: '42', emoji: '🎯', pairId: 'pair-42' },
      { id: 'ans-49', label: '49', emoji: '🎯', pairId: 'pair-49' },
      { id: 'ans-45', label: '45', emoji: '🎯', pairId: 'pair-45' }
    ]
  },

  // 13. Drag & Drop Sorting: Prime vs Composite Numbers
  {
    id: 'act-sort-prime-composite',
    type: 'drag_drop_sort',
    title: 'Prime vs. Composite Number Sorter',
    instruction: 'Sort each integer into Prime Numbers (only 2 factors: 1 and itself) or Composite Numbers!',
    gradeLevel: 'grade_4',
    subject: 'math',
    topic: 'Number Theory & Factors',
    difficulty: 'advanced',
    icon: '⚡',
    hint: 'Prime numbers cannot be divided evenly by any other number except 1 and itself (e.g. 2, 3, 5, 7, 11, 13)!',
    bins: [
      { id: 'bin-prime', title: '⭐ Prime Numbers', emoji: '⭐', colorScheme: 'amber' },
      { id: 'bin-composite', title: '🧱 Composite Numbers', emoji: '🧱', colorScheme: 'blue' }
    ],
    items: [
      { id: 'num-7', label: 'Number 7', emoji: '7️⃣', targetBinId: 'bin-prime' },
      { id: 'num-12', label: 'Number 12', emoji: '1️⃣2️⃣', targetBinId: 'bin-composite' },
      { id: 'num-13', label: 'Number 13', emoji: '1️⃣3️⃣', targetBinId: 'bin-prime' },
      { id: 'num-15', label: 'Number 15', emoji: '1️⃣5️⃣', targetBinId: 'bin-composite' },
      { id: 'num-19', label: 'Number 19', emoji: '1️⃣9️⃣', targetBinId: 'bin-prime' },
      { id: 'num-20', label: 'Number 20', emoji: '2️⃣0️⃣', targetBinId: 'bin-composite' }
    ]
  },

  // 14. Timeline Sequence: The Water Cycle
  {
    id: 'act-seq-water-cycle',
    type: 'timeline_sequence',
    title: 'Earth Science: The Water Cycle Journey',
    instruction: 'Order the four key stages of the natural water cycle from evaporation to collection!',
    gradeLevel: 'grade_4',
    subject: 'science',
    topic: 'Hydrology & Earth Systems',
    difficulty: 'intermediate',
    icon: '💧',
    hint: 'Sun warms the water -> Vapor rises -> Forms clouds -> Falls as rain -> Flows back to ocean!',
    storyTitle: 'The Continuous Loop of Earth’s Water',
    cards: [
      {
        id: 'stage-evap',
        correctOrderIndex: 0,
        label: '1. Evaporation',
        emoji: '☀️',
        description: 'Solar heat warms ocean water, turning liquid into rising invisible water vapor.'
      },
      {
        id: 'stage-cond',
        correctOrderIndex: 1,
        label: '2. Condensation',
        emoji: '☁️',
        description: 'Water vapor cools high in the atmosphere and condenses into dense rain clouds.'
      },
      {
        id: 'stage-precip',
        correctOrderIndex: 2,
        label: '3. Precipitation',
        emoji: '🌧️',
        description: 'Heavy droplets fall from clouds as rain, hail, sleet, or fresh snow.'
      },
      {
        id: 'stage-collect',
        correctOrderIndex: 3,
        label: '4. Collection / Runoff',
        emoji: '🌊',
        description: 'Water flows down rivers and lakes back into the oceans to restart the cycle.'
      }
    ]
  },

  // =========================================================================
  // GRADE 5 & GRADE 6 (UPPER ELEMENTARY & PRE-ALGEBRA)
  // =========================================================================

  // 15. Line Connect: Equivalent Fractions, Decimals & Percentages
  {
    id: 'act-connect-fractions-decimals',
    type: 'line_connect',
    title: 'Fractions, Decimals & Percentages Converter',
    instruction: 'Connect each fraction on the left with its identical decimal & percent value on the right!',
    gradeLevel: 'grade_5',
    subject: 'math',
    topic: 'Rational Number Equivalences',
    difficulty: 'advanced',
    icon: '📊',
    hint: '1/2 = 0.5 (50%), 1/4 = 0.25 (25%), 3/4 = 0.75 (75%), 1/5 = 0.2 (20%)!',
    leftNodes: [
      { id: 'f-half', label: '1/2 (Half)', emoji: '🍕', pairId: 'p-50' },
      { id: 'f-quarter', label: '1/4 (One Fourth)', emoji: '🥧', pairId: 'p-25' },
      { id: 'f-three-q', label: '3/4 (Three Fourths)', emoji: '🍰', pairId: 'p-75' },
      { id: 'f-fifth', label: '1/5 (One Fifth)', emoji: '🍪', pairId: 'p-20' }
    ],
    rightNodes: [
      { id: 'd-25', label: '0.25 (25%)', emoji: '🎯', pairId: 'p-25' },
      { id: 'd-50', label: '0.50 (50%)', emoji: '🎯', pairId: 'p-50' },
      { id: 'd-20', label: '0.20 (20%)', emoji: '🎯', pairId: 'p-20' },
      { id: 'd-75', label: '0.75 (75%)', emoji: '🎯', pairId: 'p-75' }
    ]
  },

  // 16. Timeline Sequence: Planets in Distance from the Sun
  {
    id: 'act-seq-planets-solar-system',
    type: 'timeline_sequence',
    title: 'Astronomy: Planet Distance from Sun',
    instruction: 'Order the inner and outer planets in order starting closest to the Sun outward!',
    gradeLevel: 'grade_5',
    subject: 'science',
    topic: 'Solar System & Planetary Science',
    difficulty: 'advanced',
    icon: '🪐',
    hint: 'Mercury -> Venus -> Earth -> Mars -> Jupiter!',
    storyTitle: 'Voyage Through Our Solar System',
    cards: [
      {
        id: 'pl-mercury',
        correctOrderIndex: 0,
        label: '1. Mercury',
        emoji: '🌑',
        description: 'The smallest rocky planet closest to the Sun with extreme temperatures.'
      },
      {
        id: 'pl-venus',
        correctOrderIndex: 1,
        label: '2. Venus',
        emoji: '🌕',
        description: 'The hottest planet wrapped in thick greenhouse gas clouds.'
      },
      {
        id: 'pl-earth',
        correctOrderIndex: 2,
        label: '3. Earth',
        emoji: '🌍',
        description: 'Our vibrant blue home planet rich in liquid water, oxygen, and life.'
      },
      {
        id: 'pl-mars',
        correctOrderIndex: 3,
        label: '4. Mars',
        emoji: '🔴',
        description: 'The Red Planet with iron-rich dust and the solar system’s tallest volcano.'
      },
      {
        id: 'pl-jupiter',
        correctOrderIndex: 4,
        label: '5. Jupiter',
        emoji: '🪐',
        description: 'The largest gas giant planet featuring the famous Great Red Spot storm.'
      }
    ]
  },

  // 17. Drag & Drop Sorting: Positive vs Negative Integers
  {
    id: 'act-sort-positive-negative',
    type: 'drag_drop_sort',
    title: 'Integers Lab: Positive vs. Negative Values',
    instruction: 'Sort each signed number into Positive (> 0) or Negative (< 0) integers!',
    gradeLevel: 'grade_6',
    subject: 'math',
    topic: 'Signed Numbers & Number Line',
    difficulty: 'advanced',
    icon: '➕➖',
    hint: 'Negative numbers have a minus sign (-) and represent values below zero (e.g. freezing temperatures, debts)!',
    bins: [
      { id: 'bin-pos', title: '➕ Positive Numbers (> 0)', emoji: '🟢', colorScheme: 'emerald' },
      { id: 'bin-neg', title: '➖ Negative Numbers (< 0)', emoji: '🔴', colorScheme: 'rose' }
    ],
    items: [
      { id: 'int-pos-8', label: '+8 Pts', emoji: '📈', targetBinId: 'bin-pos' },
      { id: 'int-neg-5', label: '-5°C Cold', emoji: '📉', targetBinId: 'bin-neg' },
      { id: 'int-pos-12', label: '+12 Height', emoji: '🏔️', targetBinId: 'bin-pos' },
      { id: 'int-neg-15', label: '-15 Depth', emoji: '🌊', targetBinId: 'bin-neg' },
      { id: 'int-pos-3', label: '+3 Gains', emoji: '💰', targetBinId: 'bin-pos' },
      { id: 'int-neg-8', label: '-8 Balance', emoji: '💳', targetBinId: 'bin-neg' }
    ]
  }
];
