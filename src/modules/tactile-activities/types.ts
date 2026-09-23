export type TactileActivityType = 
  | 'drag_drop_sort'      // Bin & Category sorting
  | 'phonics_builder'     // Sound tiles & syllable construction
  | 'canvas_tracing'      // Guided stroke path & letter/number tracing
  | 'timeline_sequence'   // Ordering chronological steps or stories
  | 'line_connect'        // Connecting related pairs with lines
  | 'feeding_game'        // Feeding & caring character activity
  | 'memory_match'        // Flip-card concentration pairs
  | 'balloon_pop';        // Popping matching or target-sum balloons

export type GradeLevel = 
  | 'preschool' 
  | 'foundation' 
  | 'kindergarten' 
  | 'grade_1' 
  | 'grade_2' 
  | 'grade_3' 
  | 'grade_4' 
  | 'grade_5' 
  | 'grade_6';

export type SubjectCategory = 'literacy' | 'math' | 'science' | 'logic' | 'creativity';

export interface BaseTactileActivity {
  id: string;
  type: TactileActivityType;
  title: string;
  instruction: string;
  gradeLevel: GradeLevel;
  subject: SubjectCategory;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  hint?: string;
  audioPrompt?: string;
}

// 1. Drag & Drop Sorting Activity
export interface DragDropItem {
  id: string;
  label: string;
  emoji?: string;
  image?: string;
  targetBinId: string;
}

export interface DragDropBin {
  id: string;
  title: string;
  emoji?: string;
  colorScheme: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose';
  acceptedTypes?: string[];
}

export interface DragDropSortActivity extends BaseTactileActivity {
  type: 'drag_drop_sort';
  bins: DragDropBin[];
  items: DragDropItem[];
}

// 2. Phonics & Word Builder
export interface PhonicsTile {
  id: string;
  sound: string;
  phonemeType: 'onset' | 'rime' | 'vowel' | 'consonant' | 'blend';
  audioPronunciation?: string;
}

export interface PhonicsWordTarget {
  id: string;
  word: string;
  hintImageOrEmoji: string;
  clueText: string;
  requiredTiles: string[]; // Sound strings in order
  meaning?: string;
}

export interface PhonicsBuilderActivity extends BaseTactileActivity {
  type: 'phonics_builder';
  targetWords: PhonicsWordTarget[];
  availableTiles: PhonicsTile[];
}

// 3. Canvas Tracing Lab
export interface TracingCheckpoint {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  order: number;
}

export interface TracingPath {
  id: string;
  label: string;
  guideSvgPath: string; // SVG path data
  viewBox: string;
  checkpoints: TracingCheckpoint[];
  startingPoint: { x: number; y: number };
}

export interface CanvasTracingActivity extends BaseTactileActivity {
  type: 'canvas_tracing';
  characterOrShape: string;
  strokeColor: string;
  paths: TracingPath[];
}

// 4. Timeline & Sequence Activity
export interface SequenceCard {
  id: string;
  correctOrderIndex: number;
  label: string;
  emoji: string;
  description: string;
}

export interface TimelineSequenceActivity extends BaseTactileActivity {
  type: 'timeline_sequence';
  cards: SequenceCard[];
  storyTitle: string;
}

// 5. Line Connect / Pairing Activity
export interface ConnectNode {
  id: string;
  label: string;
  emoji?: string;
  pairId: string;
}

export interface LineConnectActivity extends BaseTactileActivity {
  type: 'line_connect';
  leftNodes: ConnectNode[];
  rightNodes: ConnectNode[];
}

// 6. Feeding Game Activity
export interface FeedingTarget {
  id: string;
  targetQuestion: string;
  correctItemIndex: number;
  options: {
    label: string;
    emoji: string;
    value: string | number;
  }[];
}

export interface FeedingGameActivity extends BaseTactileActivity {
  type: 'feeding_game';
  character: 'monkey' | 'bunny' | 'puppy' | 'bear' | 'penguin';
  characterName: string;
  foodEmoji: string;
  foodName: string;
  tasks: FeedingTarget[];
}

// 7. Memory Match Activity
export interface MemoryCard {
  id: string;
  matchKey: string;
  content: string;
  emoji?: string;
}

export interface MemoryMatchActivity extends BaseTactileActivity {
  type: 'memory_match';
  gridSize?: 4 | 6 | 8;
  cards: MemoryCard[];
}

// 8. Balloon Pop Activity
export interface BalloonItem {
  id: string;
  text: string;
  color: string;
  isCorrect: boolean;
}

export interface BalloonPopActivity extends BaseTactileActivity {
  type: 'balloon_pop';
  targetPrompt: string;
  balloons: BalloonItem[];
}

export type AnyTactileActivity = 
  | DragDropSortActivity 
  | PhonicsBuilderActivity 
  | CanvasTracingActivity 
  | TimelineSequenceActivity 
  | LineConnectActivity
  | FeedingGameActivity
  | MemoryMatchActivity
  | BalloonPopActivity;
