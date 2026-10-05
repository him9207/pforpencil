import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  UserAccount, 
  CurriculumGrade, 
  CurriculumSubject, 
  Question, 
  Activity,
  UserRole,
  StudentProgress
} from '../types';
import { sounds } from '../utils/audio';
import { 
  ArrowRight, 
  Check, 
  BookOpen, 
  ShieldCheck, 
  Award, 
  Flame, 
  Coins, 
  Zap, 
  GraduationCap, 
  School, 
  TrendingUp, 
  BrainCircuit, 
  Calculator, 
  Shapes, 
  Clock, 
  PieChart, 
  BarChart3, 
  Layers, 
  HeartHandshake, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  RotateCcw, 
  Star, 
  Sparkles,
  Globe,
  Settings,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import PforPencilLogo from './PforPencilLogo';

interface GradeCurriculumSpec {
  id: string;
  name: string;
  shortLabel: string;
  ageRange: string;
  tagline: string;
  overview: string;
  keySkills: string[];
  samplePrompt: string;
  sampleAnswer: string;
  sampleVisual: string;
}

const GRADE_SPECS: GradeCurriculumSpec[] = [
  {
    id: 'preschool',
    name: 'Preschool & Early Years',
    shortLabel: 'Pre-K',
    ageRange: 'Ages 3–4',
    tagline: 'Number discovery, spatial play, and sensory pattern recognition.',
    overview: 'Nurtures foundational number awareness through counting everyday objects, identifying colors and basic shapes, and developing spatial orientation.',
    keySkills: ['Visual Counting (1–10)', 'Sorting by Color & Shape', 'Big vs Small Comparisons', 'Sensory Matching Patterns'],
    samplePrompt: 'How many apples are in the basket? 🍎 🍎 🍎',
    sampleAnswer: '3 apples',
    sampleVisual: '🍎 🍎 🍎'
  },
  {
    id: 'foundation',
    name: 'Foundation (Kindergarten)',
    shortLabel: 'Kinder',
    ageRange: 'Ages 4–5',
    tagline: 'Counting fluency, ten-frame visualization, and comparing quantities.',
    overview: 'Solidifies cardinal numbers up to 20, builds early subitizing skills using ten-frames, and introduces simple addition and subtraction with tactile manipulatives.',
    keySkills: ['Counting & Cardinality to 20', 'Ten-Frame Visual Subitizing', 'More, Less & Equal Quantities', 'Basic 2D Shapes & Attributes'],
    samplePrompt: 'Count the bright yellow stars: ⭐ ⭐ ⭐ ⭐ ⭐',
    sampleAnswer: '5 stars',
    sampleVisual: '⭐ ⭐ ⭐ ⭐ ⭐'
  },
  {
    id: 'grade-1',
    name: 'Grade 1',
    shortLabel: 'Grade 1',
    ageRange: 'Ages 5–6',
    tagline: 'Addition & subtraction fluency, place value fundamentals, and analog time.',
    overview: 'Moves young mathematicians from direct counting to mental math strategies within 20, understanding tens and ones place value, and reading analog clocks to the hour.',
    keySkills: ['Addition & Subtraction within 20', 'Place Value (Tens and Ones)', 'Analog Clock O\'Clock & Half-Past', 'Picture Graphs & Data Tallies'],
    samplePrompt: 'What is 8 + 6?',
    sampleAnswer: '14',
    sampleVisual: '8 + 6 = (8 + 2) + 4 = 14'
  },
  {
    id: 'grade-2',
    name: 'Grade 2',
    shortLabel: 'Grade 2',
    ageRange: 'Ages 6–7',
    tagline: 'Double-digit operations with regrouping, skip counting, and currency.',
    overview: 'Empowers students with standard algorithms for double-digit addition and subtraction, skip-counting sequences (2s, 5s, 10s), money problem-solving, and measuring lengths.',
    keySkills: ['2-Digit Addition with Regrouping', 'Skip Counting & Odd/Even Logic', 'Coin Values & Making Change', 'Measurement in Centimeters & Inches'],
    samplePrompt: '34 + 28 = ?',
    sampleAnswer: '62',
    sampleVisual: '34 + 28 = (30 + 20) + (4 + 8) = 50 + 12 = 62'
  },
  {
    id: 'grade-3',
    name: 'Grade 3',
    shortLabel: 'Grade 3',
    ageRange: 'Ages 7–8',
    tagline: 'Multiplication arrays, equal-sharing division, and fraction models.',
    overview: 'Introduces the core concepts of multiplication and division through arrays and groups, explores fractions as parts of a whole, and teaches area and perimeter of rectilinear shapes.',
    keySkills: ['Multiplication Tables (2 to 10)', 'Division as Equal Grouping', 'Fractions on a Number Line', 'Area & Perimeter Calculations'],
    samplePrompt: '7 × 8 = ?',
    sampleAnswer: '56',
    sampleVisual: '7 × 8 = 56 (7 rows of 8 dots)'
  },
  {
    id: 'grade-4',
    name: 'Grade 4',
    shortLabel: 'Grade 4',
    ageRange: 'Ages 8–9',
    tagline: 'Multi-digit multiplication, equivalent fractions, and decimal tenths.',
    overview: 'Expands computational mastery with multi-digit operations, decimal place values (tenths and hundredths), operations on fractions with like denominators, and classifying angles.',
    keySkills: ['Multi-digit Long Operations', 'Equivalent Fractions & Mixed Numbers', 'Decimals & Money Conversions', 'Angles (Acute, Right, Obtuse)'],
    samplePrompt: 'Which fraction is equivalent to 3/4?',
    sampleAnswer: '6/8',
    sampleVisual: '3/4 = (3 × 2) / (4 × 2) = 6/8'
  },
  {
    id: 'grade-5',
    name: 'Grade 5',
    shortLabel: 'Grade 5',
    ageRange: 'Ages 9–10',
    tagline: 'Unlike fractions, decimal multiplication, 3D volume, and coordinates.',
    overview: 'Prepares students for higher reasoning with unlike fraction addition/subtraction, decimal multiplication and division, calculating volume of rectangular prisms, and plotting (x, y) coordinates.',
    keySkills: ['Adding Unlike Fractions', 'Decimal Multiplication & Division', 'Volume of 3D Rectangular Prisms', 'Coordinate Plane Graphing (x, y)'],
    samplePrompt: 'What is 1/2 + 1/4?',
    sampleAnswer: '3/4',
    sampleVisual: '2/4 + 1/4 = 3/4'
  },
  {
    id: 'grade-6',
    name: 'Grade 6',
    shortLabel: 'Grade 6',
    ageRange: 'Ages 10–11',
    tagline: 'Ratios, negative integers, algebraic expressions, and statistical data.',
    overview: 'Transitions primary learners to algebraic thinking through ratios and proportions, integers on extended number lines, single-variable equations, and statistical measures (mean, median).',
    keySkills: ['Ratios, Unit Rates & Percentages', 'Negative Numbers & Absolute Value', 'One-Step Linear Equations', 'Mean, Median, Mode & Range'],
    samplePrompt: 'If 4 notebooks cost $12, what is the price of 6 notebooks?',
    sampleAnswer: '$18',
    sampleVisual: 'Unit price = $12 ÷ 4 = $3. 6 × $3 = $18'
  }
];

interface LiveDemoChallenge {
  id: number;
  gradeBadge: string;
  topic: string;
  question: string;
  modelClue: string;
  options: string[];
  answer: string;
  explanation: string;
}

const DEMO_CHALLENGES: LiveDemoChallenge[] = [
  {
    id: 1,
    gradeBadge: 'Grade 2',
    topic: 'Mental Addition',
    question: 'What is 26 + 17?',
    modelClue: 'Decompose: (20 + 10) + (6 + 7) = 30 + 13',
    options: ['39', '41', '43', '45'],
    answer: '43',
    explanation: '26 + 17 = 43. 6 + 7 equals 13, and adding that to the 30 gives 43!'
  },
  {
    id: 2,
    gradeBadge: 'Grade 3',
    topic: 'Fractions & Models',
    question: 'Which fraction is equal to one half (1/2)?',
    modelClue: 'Look for a numerator that is exactly half of the denominator',
    options: ['2/3', '3/6', '4/10', '5/8'],
    answer: '3/6',
    explanation: '3/6 simplifies directly to 1/2 because 3 is half of 6.'
  },
  {
    id: 3,
    gradeBadge: 'Grade 4',
    topic: 'Multiplication Tables',
    question: 'What is 8 × 9?',
    modelClue: 'Think: 8 × 10 = 80, then subtract 8',
    options: ['68', '72', '74', '76'],
    answer: '72',
    explanation: '8 × 9 = 72. Fast mental trick: 80 - 8 = 72!'
  },
  {
    id: 4,
    gradeBadge: 'Grade 5',
    topic: 'Geometry & Area',
    question: 'Find the area of a rectangle with length 8 cm and width 7 cm:',
    modelClue: 'Formula: Area = Length × Width',
    options: ['48 cm²', '54 cm²', '56 cm²', '64 cm²'],
    answer: '56 cm²',
    explanation: 'Area = 8 cm × 7 cm = 56 cm².'
  }
];

const CURRICULUM_DOMAINS = [
  {
    title: 'Numbers & Operations',
    shortDesc: 'From early counting and number bonds to multi-digit arithmetic and negative integers.',
    icon: Calculator,
    count: '240+ Competencies',
    topics: ['Place Value & Expanded Form', 'Addition & Subtraction Fluency', 'Multiplication & Division Mastery', 'Order of Operations (PEMDAS)']
  },
  {
    title: 'Fractions, Decimals & Ratios',
    shortDesc: 'Visual part-whole bar models, decimal operations, percentages, and proportional reasoning.',
    icon: PieChart,
    count: '175+ Competencies',
    topics: ['Visual Fraction Bars & Circles', 'Equivalent Fractions & Operations', 'Decimal Conversions & Rounding', 'Ratios, Rates & Percentages']
  },
  {
    title: 'Geometry & Spatial Sense',
    shortDesc: '2D and 3D attributes, angles, symmetry, coordinate grids, perimeter, area, and volume.',
    icon: Shapes,
    count: '140+ Competencies',
    topics: ['Polygons, Prisms & Pyramids', 'Angle Measurement & Rotation', 'Area, Perimeter & Volume Formulas', 'Coordinate Plane Navigation']
  },
  {
    title: 'Measurement & Time',
    shortDesc: 'Analog and digital clocks, calendar intervals, metric and customary conversions, and money.',
    icon: Clock,
    count: '115+ Competencies',
    topics: ['Analog Clock & Elapsed Time', 'Metric & Customary Standards', 'Currency, Coin Combinations & Change', 'Mass, Capacity & Length Units']
  },
  {
    title: 'Patterns & Pre-Algebra',
    shortDesc: 'Number sequences, geometric patterns, balance scale equations, and functional tables.',
    icon: BrainCircuit,
    count: '100+ Competencies',
    topics: ['Arithmetic & Geometric Sequences', 'Balance Scale Unknowns', 'Input-Output Function Rules', 'Inequalities & One-Step Equations']
  },
  {
    title: 'Data & Probability',
    shortDesc: 'Picture charts, bar graphs, dot plots, statistical averages (mean/median), and probability.',
    icon: BarChart3,
    count: '85+ Competencies',
    topics: ['Picture & Bar Graph Interpretation', 'Line Plots & Histograms', 'Mean, Median, Mode & Range', 'Predictive Chance & Experiments']
  }
];

const PEDAGOGY_PILLARS = [
  {
    number: '01',
    title: 'Concrete to Abstract (CPA)',
    description: 'Every abstract mathematical concept starts with tactile and pictorial representations—number bonds, ten-frames, and visual fraction bars—before advancing to formal equations.',
    icon: Layers
  },
  {
    number: '02',
    title: 'Intelligent Scaffolding',
    description: 'When a child encounters difficulty, gentle step-by-step clues and visual decomposition appear automatically, transforming potential frustration into genuine problem-solving joy.',
    icon: Zap
  },
  {
    number: '03',
    title: 'Daily Joyful Practice',
    description: 'Bite-sized 10-minute daily challenge sessions with audio narration, celebratory confetti, streak fires, and avatar customization make math an anticipated daily highlight.',
    icon: Flame
  },
  {
    number: '04',
    title: 'Diagnostic Mastery Insights',
    description: 'Teachers and parents receive transparent, real-time analytics on specific skill gaps and curriculum progress, eliminating guesswork from homework and revision.',
    icon: TrendingUp
  }
];

const REVIEWS = [
  {
    quote: 'P for Pencil transformed our evening homework routine. The visual bar models helped my 7-year-old truly understand regrouping instead of just memorizing steps.',
    name: 'Sarah Jenkins',
    role: 'Parent of Grade 2 Student',
    location: 'Sydney, Australia'
  },
  {
    quote: 'The Master Question Bank and curriculum alignment give our teaching team complete flexibility. Creating targeted assignments takes minutes, and student engagement has soared.',
    name: 'Marcus Vance',
    role: 'Primary Mathematics Lead',
    location: 'Oakridge International Academy'
  },
  {
    quote: 'The audio read-aloud and gamified question cards enabled my young learners to practice independently. They genuinely look forward to earning their daily streak coins.',
    name: 'Priya Sharma',
    role: 'Foundation Year Educator',
    location: 'New Delhi, India'
  }
];

interface HomePageProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  grades?: CurriculumGrade[];
  subjects?: CurriculumSubject[];
  questions?: Question[];
  activities?: Activity[];
  onSelectRoleUser: (user: UserAccount) => void;
  onNavigateView: (view: string) => void;
  onOpenPricing: () => void;
  onOpenRegionModal: () => void;
  onOpenAuthModal: (options?: { screen?: 'signin' | 'register'; role?: UserRole }) => void;
  onOpenSupabaseModal: () => void;
  onDirectLogin: (user: UserAccount) => void;
  onRegisterUser?: (newUser: UserAccount, newProgress?: StudentProgress) => void;
  onSaveRegion?: (country: string, state: string, curriculum: string, grade?: string) => void;
}

export default function PForPencilHomePage({
  currentUser,
  allUsers,
  onSelectRoleUser,
  onNavigateView,
  onOpenPricing,
  onOpenRegionModal,
  onOpenAuthModal,
  onOpenSupabaseModal,
}: HomePageProps) {
  const [selectedGradeId, setSelectedGradeId] = useState<string>('grade-2');
  const [demoIndex, setDemoIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);

  const activeGrade = useMemo(() => {
    return GRADE_SPECS.find((g) => g.id === selectedGradeId) || GRADE_SPECS[3];
  }, [selectedGradeId]);

  const activeChallenge = DEMO_CHALLENGES[demoIndex];

  const handleSelectAnswer = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === activeChallenge.answer) {
      sounds.playCorrect();
      setScore((s) => s + 15);
      confetti({
        particleCount: 36,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      sounds.playWrong();
    }
  };

  const handleNextChallenge = () => {
    sounds.playCorrect();
    setSelectedAnswer(null);
    setShowHint(false);
    setDemoIndex((idx) => (idx + 1) % DEMO_CHALLENGES.length);
  };

  const handleResetChallenge = () => {
    sounds.click();
    setDemoIndex(0);
    setSelectedAnswer(null);
    setShowHint(false);
    setScore(0);
  };

  const jumpToStudentPractice = (gradeId?: string) => {
    sounds.playCorrect();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.55 } });
    if (currentUser.role === 'student') {
      onNavigateView('dashboard');
    } else {
      const studentUser = allUsers.find((u) => u.role === 'student');
      if (studentUser) {
        onSelectRoleUser(studentUser);
      } else {
        onOpenAuthModal({ screen: 'signin', role: 'student' });
      }
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 font-sans selection:bg-amber-200 selection:text-slate-950">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: EDITORIAL, REFINED, PURPOSEFUL */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-28 bg-white border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            
            {/* Left Column: Mission & Core Offering */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Unboxed Metadata Header (Zero-Pill Compliance) */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 tracking-wide uppercase">
                <span className="text-amber-700 font-bold">P for Pencil Academy</span>
                <span aria-hidden="true" className="text-stone-300">/</span>
                <span>Foundation to Grade 6</span>
                <span aria-hidden="true" className="text-stone-300">/</span>
                <span className="text-emerald-700 font-bold">Curriculum Aligned</span>
              </div>

              {/* Bold, Distinctive Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.08] text-balance">
                Master math through visual clarity and joyful daily practice.
              </h1>

              {/* Authoritative Subtext */}
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
                Ground your child’s mathematical intuition in concrete manipulatives, pictorial models, and interactive challenges. Designed by primary educators to build lasting confidence from early counting through pre-algebra.
              </p>

              {/* Functional CTA Button Group */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => jumpToStudentPractice()}
                  className="px-7 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm sm:text-base shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center gap-2.5"
                >
                  <span>Start Free Practice</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo('interactive-lab')}
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-stone-300 hover:border-slate-400 font-bold text-sm sm:text-base transition-colors cursor-pointer inline-flex items-center gap-2 shadow-2xs"
                >
                  <Play className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span>Try Challenge Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollTo('grade-roadmap')}
                  className="px-5 py-3.5 rounded-xl text-slate-600 hover:text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Explore Grades ↓
                </button>
              </div>

              {/* Trust & Accreditations Ribbon */}
              <div className="pt-6 border-t border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Aligned to US Common Core, UK, ACARA & CBSE</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Ad-Free, COPPA & Child-Safe Protected</span>
                </div>
              </div>

            </div>

            {/* Right Column: Authentic Visual Anchor & Live Quick-Challenge */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Card Container with Single Elevation */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                
                {/* Visual Header with Photography Anchor */}
                <div className="relative rounded-xl overflow-hidden aspect-16/10 border border-stone-200 bg-stone-100">
                  <img
                    src="/hero-student.jpg"
                    alt="Young student engaging happily with mathematics learning"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image path differs
                      (e.target as HTMLImageElement).src = '/assets/hero-student.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                    <div className="text-white space-y-0.5">
                      <p className="text-xs font-semibold text-amber-300">Hands-on Learning</p>
                      <p className="text-sm font-bold text-white">Visual Manipulatives · Concrete Understanding</p>
                    </div>
                  </div>
                </div>

                {/* Quick Interactive Mini-Test */}
                <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3 shadow-2xs" id="interactive-lab">
                  
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-slate-800">{activeChallenge.gradeBadge}</span>
                      <span className="text-stone-300">·</span>
                      <span className="text-slate-500">{activeChallenge.topic}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-800">
                      +{score} XP
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-stone-400 font-mono">
                      Question {demoIndex + 1} of {DEMO_CHALLENGES.length}
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      {activeChallenge.question}
                    </h3>
                  </div>

                  {showHint && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-950 font-medium">
                      💡 <strong>Hint:</strong> {activeChallenge.modelClue}
                    </div>
                  )}

                  {/* 4 Clean Option Tiles */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {activeChallenge.options.map((option) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = isSelected && option === activeChallenge.answer;
                      const isWrong = isSelected && option !== activeChallenge.answer;
                      const isSolution = selectedAnswer !== null && option === activeChallenge.answer;

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={selectedAnswer !== null}
                          onClick={() => handleSelectAnswer(option)}
                          className={`h-11 rounded-lg text-sm font-bold border transition-all cursor-pointer flex items-center justify-center ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200'
                              : isWrong
                              ? 'bg-rose-50 border-rose-400 text-rose-900'
                              : isSolution
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-black'
                              : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100 hover:border-slate-300'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Strip */}
                  <div className="min-h-[36px] flex items-center justify-between text-xs pt-1">
                    {selectedAnswer === activeChallenge.answer ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Brilliant! {activeChallenge.explanation}</span>
                      </span>
                    ) : selectedAnswer ? (
                      <span className="text-rose-700 font-bold">
                        Correct answer: <strong>{activeChallenge.answer}</strong>. {activeChallenge.explanation}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                      >
                        {showHint ? 'Hide Clue' : '💡 Need a visual clue?'}
                      </button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={handleResetChallenge}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                        title="Reset challenge"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextChallenge}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DEDICATED PORTAL WORKSPACES (FOR ALL 5 ROLES) */}
      {/* ========================================================================= */}
      <section className="py-16 bg-stone-100/70 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Seamless Collaboration
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Tailored portals for every learning stakeholder
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Switch roles seamlessly or sign in to experience the unified ecosystem connecting learners, teachers, parents, and school administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Student Card */}
            <div 
              onClick={() => jumpToStudentPractice()}
              className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-800">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    Student Arena
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Interactive math challenges, audio read-aloud, streak fires, collectible avatars, and joy-filled mastery.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-amber-700">
                <span>Enter Practice Mode</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Teacher Card */}
            <div 
              onClick={() => onOpenAuthModal({ screen: 'signin', role: 'teacher' })}
              className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-800 transition-colors">
                    Teacher Workspace
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Curriculum question builder, bulk spreadsheet import, classroom assignments, and automated report cards.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-blue-700">
                <span>Open Teacher Desk</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Parent Card */}
            <div 
              onClick={() => onOpenAuthModal({ screen: 'signin', role: 'parent' })}
              className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    Parent Dashboard
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Real-time practice time, accuracy breakdown by topic, PIN-protected security, and milestone celebration.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                <span>View Parent Insights</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* School Card */}
            <div 
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'school' })}
              className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-800">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-800 transition-colors">
                    School & Admin
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Whole-school curriculum pacing, multi-class roster administration, teacher vouchers, and audit trails.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-purple-700">
                <span>School Enterprise</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE GRADE ROADMAP: FOUNDATION TO GRADE 6 */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-b border-stone-200/80" id="grades">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Grade-by-Grade Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Curriculum standards from early years to pre-algebra
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every level is structured around internationally recognized developmental milestones, ensuring children never jump to abstract algorithms before mastering concrete concepts.
            </p>
          </div>

          {/* Clean Segmented Grade Filter (Functional Buttons with Active State) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-stone-100 rounded-xl max-w-4xl mx-auto border border-stone-200">
            {GRADE_SPECS.map((spec) => {
              const isSelected = spec.id === selectedGradeId;
              return (
                <button
                  key={spec.id}
                  type="button"
                  onClick={() => {
                    setSelectedGradeId(spec.id);
                    sounds.click();
                  }}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-sm border border-stone-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {spec.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Detailed Grade Showcase Card */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200/90 p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <span className="text-amber-800 font-bold">{activeGrade.ageRange}</span>
                  <span aria-hidden="true">·</span>
                  <span>Primary Milestone</span>
                </div>
                <h3 className="text-2xl font-black text-slate-950">
                  {activeGrade.name}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {activeGrade.tagline}
                </p>
              </div>

              <button
                type="button"
                onClick={() => jumpToStudentPractice(activeGrade.id)}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Practice {activeGrade.shortLabel}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            {/* Overview & Key Competencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Pedagogical Focus
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {activeGrade.overview}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    Interactive Sample Problem
                  </span>
                  <p className="text-base font-bold text-slate-900">
                    {activeGrade.samplePrompt}
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold pt-1">
                    ✓ Verified Solution: <strong>{activeGrade.sampleAnswer}</strong>
                  </p>
                  {activeGrade.sampleVisual && (
                    <p className="text-xs font-mono text-slate-500 bg-stone-50 p-2 rounded-md mt-1 border border-stone-100">
                      Visual Model: {activeGrade.sampleVisual}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Key Curriculum Competencies
                </h4>
                <div className="space-y-2">
                  {activeGrade.keySkills.map((skill, sIdx) => (
                    <div 
                      key={sIdx} 
                      className="p-3 rounded-xl bg-white border border-stone-200/80 flex items-start gap-3 shadow-2xs"
                    >
                      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 leading-snug">
                        {skill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CURRICULUM STRANDS & MATHEMATICAL MASTERY */}
      {/* ========================================================================= */}
      <section className="py-20 bg-stone-100/60 border-b border-stone-200/80" id="topics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Core Math Pillars
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Six comprehensive mathematical strands
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every topic is engineered with rich visual clipart, tap-to-count objects, bucket sorting, and multi-choice challenges to ensure multi-sensory retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CURRICULUM_DOMAINS.map((domain) => {
              const Icon = domain.icon;
              return (
                <div 
                  key={domain.title}
                  className="p-6 rounded-2xl bg-white border border-stone-200 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-slate-800">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {domain.count}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {domain.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {domain.shortDesc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-1.5">
                      {domain.topics.map((t, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => jumpToStudentPractice()}
                    className="w-full py-2.5 rounded-xl bg-stone-50 hover:bg-slate-950 hover:text-white text-slate-800 text-xs font-bold border border-stone-200 transition-colors cursor-pointer text-center"
                  >
                    Practice {domain.title}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PEDAGOGY: WHY P FOR PENCIL WORKS */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Evidence-Based Pedagogy
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Designed around how young minds actually learn
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PEDAGOGY_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={pillar.title}
                  className="p-6 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {pillar.number}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-slate-800">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 pt-1">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SOCIAL PROOF & EDUCATOR TESTIMONIALS */}
      {/* ========================================================================= */}
      <section className="py-20 bg-stone-100/60 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Community Voices
            </span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">
              Trusted by parents and primary educators worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((rev, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-white border border-stone-200 flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    "{rev.quote}"
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 text-xs">
                  <p className="font-bold text-slate-900">{rev.name}</p>
                  <p className="text-slate-500">{rev.role} · {rev.location}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. HIGH-CONVERTING CLOSING INVITATION */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-14 rounded-3xl bg-slate-950 text-white text-center space-y-6 shadow-xl relative overflow-hidden">
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Start Today · No Credit Card Required
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Give your child the gift of mathematical confidence.
              </h2>
              <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                Join thousands of students turning daily math anxiety into joyful problem-solving mastery with P for Pencil.
              </p>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal({ screen: 'register', role: 'student' })}
                  className="px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-sm transition-all hover:scale-102 cursor-pointer"
                >
                  Create Free Student Account
                </button>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors cursor-pointer"
                >
                  View School & Family Plans
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER WITH ACCESSIBLE NAVIGATION */}
      {/* ========================================================================= */}
      <footer className="bg-stone-100 border-t border-stone-200 py-12 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
            
            <div className="md:col-span-2 space-y-3">
              <PforPencilLogo size="md" showSubtitle={true} />
              <p className="text-xs text-slate-500 max-w-sm pt-2 leading-relaxed">
                P for Pencil is a primary mathematics learning platform dedicated to making foundational concepts clear, tactile, and joyful for every child.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Curriculum</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button type="button" onClick={() => scrollTo('grades')} className="hover:text-slate-950 cursor-pointer">Grade Progression</button></li>
                <li><button type="button" onClick={() => scrollTo('topics')} className="hover:text-slate-950 cursor-pointer">Math Strands</button></li>
                <li><button type="button" onClick={onOpenRegionModal} className="hover:text-slate-950 cursor-pointer">National Standards Scope</button></li>
                <li><button type="button" onClick={onOpenPricing} className="hover:text-slate-950 cursor-pointer">Subscription Plans</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Portals</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button type="button" onClick={() => onOpenAuthModal({ screen: 'signin', role: 'student' })} className="hover:text-slate-950 cursor-pointer">Student Arena</button></li>
                <li><button type="button" onClick={() => onOpenAuthModal({ screen: 'signin', role: 'teacher' })} className="hover:text-slate-950 cursor-pointer">Teacher Workspace</button></li>
                <li><button type="button" onClick={() => onOpenAuthModal({ screen: 'signin', role: 'parent' })} className="hover:text-slate-950 cursor-pointer">Parent Hub</button></li>
                <li><button type="button" onClick={() => onOpenAuthModal({ screen: 'signin', role: 'school' })} className="hover:text-slate-950 cursor-pointer">School Admin</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Infrastructure</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button type="button" onClick={onOpenSupabaseModal} className="hover:text-emerald-800 font-semibold text-emerald-700 cursor-pointer">Supabase Database Hub</button></li>
                <li><span className="text-slate-400">COPPA & Child Safe</span></li>
                <li><span className="text-slate-400">100% Ad-Free Guarantee</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <span>© 2026 P for Pencil Academy. All rights reserved.</span>
            <span className="font-semibold text-slate-800">Small steps for a brighter tomorrow.</span>
          </div>
        </div>
      </footer>

      {/* Floating Demo Role Switcher Tool */}
      <aside className="fixed bottom-3 right-3 z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-stone-200/90 p-1.5 flex items-center gap-1 text-xs">
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider pl-1.5">Portal:</span>
        {allUsers.filter((u) => ['student', 'parent', 'teacher', 'school', 'admin'].includes(u.role)).slice(0, 5).map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => {
              onSelectRoleUser(user);
              sounds.playCorrect();
            }}
            className={`px-2 py-1 rounded-md transition-all capitalize cursor-pointer text-[11px] font-semibold ${
              currentUser.id === user.id 
                ? 'bg-slate-950 text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-950 hover:bg-stone-100'
            }`}
          >
            {user.role}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenSupabaseModal}
          className="px-2 py-1 rounded-md text-emerald-700 hover:bg-emerald-50 border border-emerald-200/70 font-bold transition-colors cursor-pointer text-[11px] flex items-center gap-1"
          title="Open Database Hub"
        >
          <span>DB Hub</span>
        </button>
      </aside>

    </div>
  );
}
