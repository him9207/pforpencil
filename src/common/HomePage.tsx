import React, { useEffect, useMemo, useState } from 'react';
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
  COUNTRY_FLAG_MAP, 
  COUNTRY_STATE_MAP, 
  COUNTRY_CURRICULUM_MAP 
} from '../data/curriculumData';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  BookOpen, 
  ShieldCheck, 
  Award, 
  Flame, 
  Coins, 
  Zap, 
  Database,
  GraduationCap,
  Users,
  School,
  FileCheck2,
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
  Quote
} from 'lucide-react';
import PforPencilLogo from './PforPencilLogo';

type GradeInfo = {
  id: string;
  name: string;
  age: string;
  short: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  focus: string;
  skills: string[];
  sampleQuestion: string;
  sampleAnswer: string;
};

const gradesData: GradeInfo[] = [
  {
    id: 'foundation',
    name: 'Foundation (Kindergarten)',
    age: 'Ages 4–5',
    short: 'K',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    focus: 'Early number sense, counting objects up to 20, 2D shapes, and basic comparison.',
    skills: ['Counting & Cardinality', 'More vs Less Comparison', 'Shapes & Colors', 'Ten-Frame Visuals'],
    sampleQuestion: 'Count the stars: ⭐ ⭐ ⭐ ⭐ ⭐',
    sampleAnswer: '5 stars'
  },
  {
    id: 'grade-1',
    name: 'Grade 1',
    age: 'Ages 5–6',
    short: 'G1',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    focus: 'Addition & subtraction within 20, place value tens/ones, telling time to the hour.',
    skills: ['Add & Subtract within 20', 'Place Value (Tens & Ones)', 'O\'Clock Time & Halves', 'Simple Bar Graphs'],
    sampleQuestion: '7 + 5 = ?',
    sampleAnswer: '12'
  },
  {
    id: 'grade-2',
    name: 'Grade 2',
    age: 'Ages 6–7',
    short: 'G2',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-200',
    focus: 'Double-digit operations, skip counting by 2s, 5s & 10s, money coins, and measurement.',
    skills: ['Double-digit Addition with Regrouping', 'Skip Counting & Odd/Even', 'Money & Coin Values', 'Analog Clocks (5-min intervals)'],
    sampleQuestion: '34 + 28 = ?',
    sampleAnswer: '62'
  },
  {
    id: 'grade-3',
    name: 'Grade 3',
    age: 'Ages 7–8',
    short: 'G3',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    focus: 'Multiplication & division foundations, fractions as parts of a whole, area and perimeter.',
    skills: ['Multiplication Tables (2–10)', 'Division as Equal Sharing', 'Visual Fraction Models', 'Area & Perimeter of Rectangles'],
    sampleQuestion: '6 × 7 = ?',
    sampleAnswer: '42'
  },
  {
    id: 'grade-4',
    name: 'Grade 4',
    age: 'Ages 8–9',
    short: 'G4',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
    focus: 'Multi-digit multiplication, equivalent fractions, decimals intro, angles and geometric symmetry.',
    skills: ['Multi-digit Operations', 'Equivalent Fractions & Adding Liked Fractions', 'Decimal Place Value (Tenths/Hundredths)', 'Angles & Line Symmetry'],
    sampleQuestion: '2/4 + 1/4 = ?',
    sampleAnswer: '3/4'
  },
  {
    id: 'grade-5',
    name: 'Grade 5',
    age: 'Ages 9–10',
    short: 'G5',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    focus: 'Fraction multiplication/division, decimals operations, 3D volume, and coordinate graphing.',
    skills: ['Unlike Fractions & Mixed Numbers', 'Decimal Multiplication & Division', 'Volume of 3D Prisms', 'Coordinate Grid (x, y)'],
    sampleQuestion: '0.4 × 0.5 = ?',
    sampleAnswer: '0.2'
  },
  {
    id: 'grade-6',
    name: 'Grade 6',
    age: 'Ages 10–11',
    short: 'G6',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    focus: 'Ratios & proportional relationships, negative integers, algebraic expressions and statistics.',
    skills: ['Ratios, Rates & Percentages', 'Negative Integers on Number Line', 'One-step Algebraic Equations', 'Mean, Median, Range & Data Sets'],
    sampleQuestion: 'If 3 pencils cost $6, what is the cost of 5 pencils?',
    sampleAnswer: '$10'
  }
];

const topicCards = [
  {
    title: 'Numbers & Operations',
    subtitle: 'From counting up to multi-digit arithmetic & negative numbers',
    icon: Calculator,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    skillsCount: '240+ Skills',
    highlights: ['Place Value & Expanded Form', 'Addition & Subtraction Fluency', 'Times Tables & Division Mastery', 'Order of Operations (PEMDAS)']
  },
  {
    title: 'Fractions & Decimals',
    subtitle: 'Visual part-whole models, decimal math & percentages',
    icon: PieChart,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50',
    skillsCount: '160+ Skills',
    highlights: ['Visual Fraction Bars & Pies', 'Equivalent & Mixed Fractions', 'Decimal Conversions & Rounding', 'Percent of a Number']
  },
  {
    title: 'Geometry & Shapes',
    subtitle: '2D & 3D properties, angles, perimeter, area & volume',
    icon: Shapes,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    skillsCount: '130+ Skills',
    highlights: ['Polygons & 3D Polyhedra', 'Acute, Right & Obtuse Angles', 'Perimeter & Area Formulas', 'Symmetry & Rotations']
  },
  {
    title: 'Measurement & Time',
    subtitle: 'Clocks, calendar, metric & customary units, money calculation',
    icon: Clock,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    skillsCount: '110+ Skills',
    highlights: ['Analog Clocks & Elapsed Time', 'Metric (m, cm, kg, L) & Customary', 'Currency Exchange & Change', 'Unit Conversions']
  },
  {
    title: 'Patterns & Pre-Algebra',
    subtitle: 'Sequences, algebraic balance scales & functional equations',
    icon: BrainCircuit,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    skillsCount: '95+ Skills',
    highlights: ['Number & Shape Patterns', 'Unknown Variable Balance Scales', 'Input-Output Function Tables', 'Inequalities & Rules']
  },
  {
    title: 'Data & Statistics',
    subtitle: 'Tally marks, bar graphs, line plots, frequency & probability',
    icon: BarChart3,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50',
    skillsCount: '80+ Skills',
    highlights: ['Picture & Bar Charts', 'Line Plots & Histograms', 'Mean, Median, Mode & Range', 'Chance & Probability Events']
  }
];

const interactiveDemoChallenges = [
  {
    id: 1,
    grade: 'Grade 2 · Addition',
    question: 'What is 14 + 18?',
    visualHint: 'Break it down: (10 + 10) + (4 + 8) = 20 + 12',
    options: ['28', '32', '34', '36'],
    answer: '32',
    explanation: '14 + 18 = 32. 4 + 8 makes 12, plus the two tens makes 32!'
  },
  {
    id: 2,
    grade: 'Grade 3 · Fractions',
    question: 'Which fraction is equal to 1/2?',
    visualHint: 'Look for half the numerator in the denominator',
    options: ['2/3', '2/4', '3/8', '4/10'],
    answer: '2/4',
    explanation: '2/4 simplifies to 1/2 because both numerator and denominator divide by 2.'
  },
  {
    id: 3,
    grade: 'Grade 4 · Multiplication',
    question: '8 × 7 = ?',
    visualHint: 'Think: 8 × 5 = 40, plus 8 × 2 = 16',
    options: ['48', '54', '56', '63'],
    answer: '56',
    explanation: '8 × 7 = 56. Master your 7 and 8 times tables for instant speed!'
  },
  {
    id: 4,
    grade: 'Grade 5 · Geometry',
    question: 'What is the area of a rectangle with length 9 cm and width 6 cm?',
    visualHint: 'Formula: Area = length × width',
    options: ['30 cm²', '45 cm²', '54 cm²', '63 cm²'],
    answer: '54 cm²',
    explanation: 'Area = 9 cm × 6 cm = 54 cm².'
  }
];

const learningPillars = [
  {
    title: 'Concrete to Abstract',
    description: 'Every abstract math concept begins with visual manipulatives, number lines, and step-by-step models before moving to mental math.',
    icon: Layers,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    title: 'Instant Gentle Hints',
    description: 'When a student gets stuck, they receive friendly breakdown clues rather than just a buzzer, building real problem-solving confidence.',
    icon: Zap,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    title: 'Daily Streak & Badges',
    description: 'Celebrate consistent effort with daily learning streaks, animated badges, and avatar rewards that make practice a daily joy.',
    icon: Flame,
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  },
  {
    title: 'Diagnostic Mastery',
    description: 'Teachers and parents view comprehensive skill breakdown reports, tracking exact strengths and targeted improvement areas.',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
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
  const [selectedDemoAnswer, setSelectedDemoAnswer] = useState<string | null>(null);
  const [demoScore, setDemoScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const activeGrade = useMemo(() => {
    return gradesData.find(g => g.id === selectedGradeId) || gradesData[1];
  }, [selectedGradeId]);

  const activeDemo = interactiveDemoChallenges[demoIndex];

  const handleSelectDemoOption = (option: string) => {
    if (selectedDemoAnswer) return;
    setSelectedDemoAnswer(option);
    if (option === activeDemo.answer) {
      sounds.playCorrect();
      setDemoScore(prev => prev + 10);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 }
      });
    } else {
      sounds.playWrong();
    }
  };

  const handleNextDemoQuestion = () => {
    sounds.playCorrect();
    setSelectedDemoAnswer(null);
    setShowHint(false);
    setDemoIndex(prev => (prev + 1) % interactiveDemoChallenges.length);
  };

  const handleResetDemo = () => {
    setDemoIndex(0);
    setSelectedDemoAnswer(null);
    setShowHint(false);
    setDemoScore(0);
  };

  const launchPracticeForGrade = (grade: GradeInfo) => {
    sounds.playCorrect();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (currentUser.role === 'student') {
      onNavigateView('dashboard');
    } else {
      const student = allUsers.find(u => u.role === 'student');
      if (student) {
        onSelectRoleUser(student);
      } else {
        onOpenAuthModal({ screen: 'signin', role: 'student' });
      }
    }
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-[#10246f] font-sans antialiased selection:bg-blue-100 selection:text-[#1a56db]">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-[#f8faff] via-white to-white border-b border-[#e1e6f1]">
        
        {/* Subtle background decorative shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/50 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-80 h-80 bg-amber-100/60 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/3 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Unboxed Metadata Tagline */}
              <div className="flex items-center gap-2 text-xs font-bold text-[#1a56db]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1a56db]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Foundational Mathematics (K – Grade 6)</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className="text-slate-500 hidden sm:inline">Curriculum Aligned</span>
              </div>

              {/* Master Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#10246f] leading-[1.12]">
                Small steps <br />
                <span className="text-[#1a56db]">for a brighter</span>{' '}
                <span className="text-[#f43f5e]">tomorrow.</span>
              </h1>

              {/* High-legibility Subtext */}
              <p className="text-base sm:text-lg text-[#59627a] font-normal leading-relaxed max-w-xl">
                Structured math practice that turns confusion into confidence. Engaging question challenges, visual tactile aids, and instant feedback for young learners.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onOpenAuthModal({ screen: 'register', role: 'student' })}
                  className="px-8 py-3.5 rounded-full bg-[#ffbf32] hover:bg-[#f59e0b] text-[#10246f] font-black text-sm sm:text-base shadow-md hover:shadow-lg transition-all transform hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <span>Start Free Practice</span>
                  <ArrowRight className="w-4 h-4 text-[#10246f]" />
                </button>

                <button
                  onClick={() => scrollToSection('interactive-demo')}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-slate-50 text-[#10246f] border border-[#e1e6f1] hover:border-blue-300 font-bold text-sm sm:text-base transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
                  <span>Try Demo Challenge</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Curriculum Aligned (US, UK, CBSE, Singapore)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Safe, COPPA Compliant & Ad-Free</span>
                </div>
              </div>

            </div>

            {/* Right Column: Live Interactive Math Card */}
            <div className="lg:col-span-5" id="interactive-demo">
              <div className="bg-white rounded-3xl border-2 border-[#e1e6f1] shadow-xl p-6 sm:p-7 space-y-5 relative">
                
                {/* Header of the Live Card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">{activeDemo.grade}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span>+{demoScore} XP</span>
                  </div>
                </div>

                {/* Question Prompt */}
                <div className="text-center py-2 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Question {demoIndex + 1} of {interactiveDemoChallenges.length}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#10246f] pt-1">
                    {activeDemo.question}
                  </h3>
                </div>

                {/* Visual Hint Toggle */}
                {showHint && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 animate-in fade-in flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <span>{activeDemo.visualHint}</span>
                  </div>
                )}

                {/* Multiple Choice Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {activeDemo.options.map((option, optIdx) => {
                    const isSelected = selectedDemoAnswer === option;
                    const isCorrect = isSelected && option === activeDemo.answer;
                    const isWrong = isSelected && option !== activeDemo.answer;

                    return (
                      <button
                        key={`${option}-${optIdx}`}
                        onClick={() => handleSelectDemoOption(option)}
                        disabled={selectedDemoAnswer !== null}
                        className={`h-12 rounded-xl text-base sm:text-lg font-bold border transition-all cursor-pointer flex items-center justify-center ${
                          isCorrect 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm scale-102 font-black' 
                            : isWrong 
                            ? 'bg-rose-50 border-rose-400 text-rose-700' 
                            : selectedDemoAnswer && option === activeDemo.answer
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-200 text-[#10246f] hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Answer Feedback Banner */}
                <div className="min-h-[44px] flex items-center justify-center text-center">
                  {selectedDemoAnswer === activeDemo.answer ? (
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-in zoom-in-95">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Brilliant! {activeDemo.explanation}</span>
                    </div>
                  ) : selectedDemoAnswer ? (
                    <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-in fade-in">
                      <span>Correct answer is <strong>{activeDemo.answer}</strong></span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      <span>💡 Need a hint? Click to reveal</span>
                    </button>
                  )}
                </div>

                {/* Next & Reset Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={handleResetDemo}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={handleNextDemoQuestion}
                    className="px-4 py-2 rounded-full bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Next Challenge</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FOUR PORTAL GATEWAYS */}
      {/* ========================================================================= */}
      <section className="py-14 bg-white border-b border-[#e1e6f1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a56db]">
              Dedicated Portals
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#10246f]">
              Designed for every member of the learning team
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* For Students */}
            <div 
              onClick={() => {
                const s = allUsers.find(u => u.role === 'student');
                if (s) onSelectRoleUser(s);
                else onOpenAuthModal({ screen: 'signin', role: 'student' });
              }}
              className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#10246f]">For Students</h3>
                <p className="text-xs text-[#59627a] mt-1.5 leading-relaxed">
                  Interactive question challenges, streak fires, coins, ID card, audio read-aloud and fun leaderboard ranks.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Enter Student Arena</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* For Teachers */}
            <div 
              onClick={() => onOpenAuthModal({ screen: 'signin', role: 'teacher' })}
              className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#10246f]">For Teachers</h3>
                <p className="text-xs text-[#59627a] mt-1.5 leading-relaxed">
                  Master question bank, skill categorization, classroom assignment creation and auto-generated report cards.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform">
                <span>Teacher Workspace</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* For Parents */}
            <div 
              onClick={() => onOpenAuthModal({ screen: 'signin', role: 'parent' })}
              className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#10246f]">For Parents</h3>
                <p className="text-xs text-[#59627a] mt-1.5 leading-relaxed">
                  Daily practice tracking, accuracy insights, pin-protected child safety, and celebrating milestone badges.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                <span>Parent Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* For Schools */}
            <div 
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'school' })}
              className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <School className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#10246f]">For Schools</h3>
                <p className="text-xs text-[#59627a] mt-1.5 leading-relaxed">
                  Whole-grade curriculum standards alignment, multi-class roster administration, and bulk student onboarding.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>School Administration</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE GRADE PATHWAY EXPLORER */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#f8faff] border-b border-[#e1e6f1]" id="grades">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a56db]">
              Structured Grade Roadmap
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#10246f]">
              Targeted Math for Foundation to Grade 6
            </h2>
            <p className="text-xs sm:text-sm text-[#59627a]">
              Select a grade level below to explore core competencies, focus areas, and sample practice problems.
            </p>
          </div>

          {/* Grade Selector Pills / Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl max-w-3xl mx-auto shadow-xs">
            {gradesData.map((grade) => {
              const isActive = grade.id === selectedGradeId;
              return (
                <button
                  key={grade.id}
                  onClick={() => {
                    setSelectedGradeId(grade.id);
                    sounds.playCorrect();
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isActive 
                      ? 'bg-[#10246f] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{grade.name.split(' (')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Grade Deep Dive Card */}
          <div className="bg-white rounded-3xl border-2 border-[#e1e6f1] p-6 sm:p-8 shadow-sm max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${activeGrade.badgeBg} ${activeGrade.badgeText}`}>
                    {activeGrade.age}
                  </span>
                  <span className="text-xs font-bold text-slate-400">·</span>
                  <span className="text-xs font-bold text-slate-600">Curriculum Standard</span>
                </div>
                <h3 className="text-2xl font-black text-[#10246f]">{activeGrade.name}</h3>
              </div>

              <button
                onClick={() => launchPracticeForGrade(activeGrade)}
                className="px-6 py-3 rounded-full bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Jump into {activeGrade.name.split(' (')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Focus & Key Competencies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Core Learning Focus
                </h4>
                <p className="text-sm text-[#10246f] leading-relaxed font-medium">
                  {activeGrade.focus}
                </p>

                <div className="pt-2">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Sample Challenge
                    </span>
                    <p className="text-sm font-bold text-[#10246f]">
                      {activeGrade.sampleQuestion}
                    </p>
                    <p className="text-xs text-emerald-700 font-semibold pt-1">
                      ✓ Answer: {activeGrade.sampleAnswer}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Key Math Competencies
                </h4>
                <div className="space-y-2">
                  {activeGrade.skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CURRICULUM TOPICS SHOWCASE */}
      {/* ========================================================================= */}
      <section className="py-16 bg-white border-b border-[#e1e6f1]" id="topics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Mastery Strands
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#10246f]">
              Comprehensive Mathematical Strands
            </h2>
            <p className="text-xs sm:text-sm text-[#59627a]">
              Every concept is built on concrete visual scaffolding and interactive practice questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topicCards.map((topic) => {
              const IconComponent = topic.icon;
              return (
                <div 
                  key={topic.title}
                  className="p-6 rounded-2xl border border-[#e1e6f1] bg-white hover:border-blue-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${topic.iconBg} flex items-center justify-center ${topic.iconColor} border border-slate-100`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                        {topic.skillsCount}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#10246f]">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-[#59627a] leading-relaxed">
                      {topic.subtitle}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {topic.highlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenAuthModal({ screen: 'signin', role: 'student' })}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-[#10246f] text-xs font-bold border border-slate-200 transition-colors cursor-pointer text-center"
                  >
                    Practice {topic.title}
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY P FOR PENCIL WORKS */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#f8faff] border-b border-[#e1e6f1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a56db]">
              Proven Methodology
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#10246f]">
              Why children thrive with P for Pencil
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningPillars.map((pillar) => {
              const PillarIcon = pillar.icon;
              return (
                <div 
                  key={pillar.title}
                  className="p-6 rounded-2xl bg-white border border-[#e1e6f1] shadow-xs space-y-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${pillar.bg} ${pillar.color} flex items-center justify-center`}>
                    <PillarIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-[#10246f]">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-[#59627a] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-[#10246f] text-white text-center space-y-6 shadow-xl relative overflow-hidden">
            
            {/* Background sparkle accents */}
            <div className="absolute top-4 left-6 text-2xl opacity-40">✨</div>
            <div className="absolute bottom-4 right-8 text-2xl opacity-40">🌟</div>

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#ffbf32]">
                Start Today · Free Access
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Give every child the confidence to excel in math.
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 max-w-lg mx-auto">
                Join students, teachers, and parents transforming daily math practice with joyful mastery.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => onOpenAuthModal({ screen: 'register', role: 'student' })}
                  className="px-8 py-3.5 rounded-full bg-[#ffbf32] hover:bg-[#f59e0b] text-[#10246f] font-black text-sm shadow-md transition-all transform hover:scale-102 cursor-pointer"
                >
                  Get Started Free
                </button>
                <button
                  onClick={onOpenPricing}
                  className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors cursor-pointer"
                >
                  View Membership Plans
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CLEAN FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-[#f8faff] border-t border-[#e1e6f1] py-12 text-[#59627a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10">
            
            {/* Brand column */}
            <div className="md:col-span-2 space-y-3">
              <PforPencilLogo size="md" showSubtitle={true} />
              <p className="text-xs text-[#59627a] max-w-sm pt-2 leading-relaxed">
                Structured math practice designed to build deep foundational understanding and lasting learning confidence for primary students.
              </p>
            </div>

            {/* Column: Platform */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#10246f]">Platform</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button onClick={() => scrollToSection('grades')} className="hover:text-[#10246f] cursor-pointer">Grade Standards</button></li>
                <li><button onClick={() => scrollToSection('topics')} className="hover:text-[#10246f] cursor-pointer">Curriculum Strands</button></li>
                <li><button onClick={onOpenPricing} className="hover:text-[#10246f] cursor-pointer">Pricing Plans</button></li>
                <li><button onClick={onOpenRegionModal} className="hover:text-[#10246f] cursor-pointer">Country & Region Scope</button></li>
              </ul>
            </div>

            {/* Column: Portals */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#10246f]">Portals</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button onClick={() => onOpenAuthModal({ screen: 'signin', role: 'student' })} className="hover:text-[#10246f] cursor-pointer">Student Practice</button></li>
                <li><button onClick={() => onOpenAuthModal({ screen: 'signin', role: 'teacher' })} className="hover:text-[#10246f] cursor-pointer">Teacher Workspace</button></li>
                <li><button onClick={() => onOpenAuthModal({ screen: 'signin', role: 'parent' })} className="hover:text-[#10246f] cursor-pointer">Parent Hub</button></li>
                <li><button onClick={() => onOpenAuthModal({ screen: 'signin', role: 'school' })} className="hover:text-[#10246f] cursor-pointer">School Admin</button></li>
              </ul>
            </div>

            {/* Column: Compliance */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#10246f]">Trust & Database</h4>
              <ul className="space-y-1.5 text-xs">
                <li><button onClick={onOpenSupabaseModal} className="hover:text-[#10246f] cursor-pointer font-semibold text-emerald-700">Supabase Database Hub</button></li>
                <li><span className="text-xs text-slate-500">100% Ad-Free & Kid-Safe</span></li>
                <li><span className="text-xs text-slate-500">COPPA & Privacy Compliant</span></li>
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-[#e1e6f1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#59627a] gap-3">
            <span>© 2026 P for Pencil. All rights reserved.</span>
            <span className="font-semibold text-[#10246f]">Small Steps. A Brighter Tomorrow.</span>
          </div>
        </div>
      </footer>

      {/* Floating tester sandbox button */}
      <aside className="fixed bottom-3 right-3 z-50 bg-white rounded-2xl shadow-lg border border-[#e1e6f1] p-2 flex items-center gap-1.5 text-xs font-bold text-[#10246f]">
        <span className="text-[10px] text-[#59627a] font-extrabold uppercase tracking-wider pl-1">🎭 Portal:</span>
        {allUsers.filter((u) => ['student', 'parent', 'teacher', 'school', 'admin'].includes(u.role)).slice(0, 5).map((user) => (
          <button
            key={user.id}
            onClick={() => {
              onSelectRoleUser(user);
              sounds.playCorrect();
            }}
            className={`px-2 py-0.5 rounded-lg transition-all capitalize cursor-pointer text-[11px] ${
              currentUser.id === user.id 
                ? 'bg-[#10246f] text-white shadow-2xs font-black' 
                : 'hover:bg-[#f8faff] text-[#59627a]'
            }`}
          >
            {user.role}
          </button>
        ))}
        <button
          onClick={onOpenSupabaseModal}
          className="px-2 py-0.5 rounded-lg hover:bg-[#ecfdf5] text-[#16c47f] border border-[#a7f3d0] font-bold transition-colors cursor-pointer text-[11px] flex items-center gap-1"
          title="Open Supabase Database Hub to test connection and live data sync"
        >
          <span>🗄️</span>
          <span>DB Hub</span>
        </button>
      </aside>

    </div>
  );
}
