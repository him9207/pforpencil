import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import iconBee from '../../assets/icon-bee.webp';
import iconDino from '../../assets/icon-dino.webp';
import iconElephant from '../../assets/icon-elephant.webp';
import iconFox from '../../assets/icon-fox.webp';
import iconLion from '../../assets/icon-lion.webp';
import iconPanda from '../../assets/icon-panda.webp';
import iconPenguin from '../../assets/icon-penguin.webp';
import iconRocket from '../../assets/icon-rocket.webp';

export interface GradeItem {
  id: string;
  name: string;
  shortLabel: string;
  ageRange: string;
  icon: string;
  fallbackSvg: string;
  bgGrad: string;
  borderColor: string;
  tagline: string;
  skills: string[];
}

export const GRADES_LIST: GradeItem[] = [
  {
    id: 'preschool',
    name: 'Preschool & Pre-K',
    shortLabel: 'Pre-K',
    ageRange: 'Ages 3–4',
    icon: iconBee,
    fallbackSvg: '/assets/icon-bee.svg',
    bgGrad: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-300',
    tagline: 'Counting items, bright colors, sorting, and shape recognition.',
    skills: ['Visual Counting (1–10)', 'Color & Shape Sorting', 'Bigger vs Smaller']
  },
  {
    id: 'foundation',
    name: 'Foundation (Kindergarten)',
    shortLabel: 'Kinder',
    ageRange: 'Ages 4–5',
    icon: iconDino,
    fallbackSvg: '/assets/icon-dino.svg',
    bgGrad: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-300',
    tagline: 'Ten-frames, cardinality up to 20, and hands-on addition.',
    skills: ['Counting up to 20', 'Ten-Frame Subitizing', 'Early Add & Subtract']
  },
  {
    id: 'grade-1',
    name: 'Grade 1',
    shortLabel: 'Grade 1',
    ageRange: 'Ages 5–6',
    icon: iconElephant,
    fallbackSvg: '/assets/icon-elephant.svg',
    bgGrad: 'from-sky-50 to-blue-50',
    borderColor: 'border-sky-300',
    tagline: 'Place value (tens and ones), analog clock hours, and sums within 20.',
    skills: ['Addition/Subtraction to 20', 'Place Value (10s & 1s)', 'Analog Clock Time']
  },
  {
    id: 'grade-2',
    name: 'Grade 2',
    shortLabel: 'Grade 2',
    ageRange: 'Ages 6–7',
    icon: iconFox,
    fallbackSvg: '/assets/icon-fox.svg',
    bgGrad: 'from-orange-50 to-amber-50',
    borderColor: 'border-orange-300',
    tagline: 'Double-digit regrouping, skip counting, money, and measurements.',
    skills: ['2-Digit Mental Math', 'Skip Counting Sequences', 'Coin Values & Change']
  },
  {
    id: 'grade-3',
    name: 'Grade 3',
    shortLabel: 'Grade 3',
    ageRange: 'Ages 7–8',
    icon: iconLion,
    fallbackSvg: '/assets/icon-lion.svg',
    bgGrad: 'from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-400',
    tagline: 'Multiplication tables (1 to 10), equal-sharing division, and fractions.',
    skills: ['Times Tables (1–10)', 'Division Equal Sharing', 'Fractions on Number Line']
  },
  {
    id: 'grade-4',
    name: 'Grade 4',
    shortLabel: 'Grade 4',
    ageRange: 'Ages 8–9',
    icon: iconPanda,
    fallbackSvg: '/assets/icon-panda.svg',
    bgGrad: 'from-stone-50 to-emerald-50',
    borderColor: 'border-teal-300',
    tagline: 'Multi-digit multiplication, equivalent fractions, and angles.',
    skills: ['Multi-digit Operations', 'Equivalent Fractions', 'Angle Classifications']
  },
  {
    id: 'grade-5',
    name: 'Grade 5',
    shortLabel: 'Grade 5',
    ageRange: 'Ages 9–10',
    icon: iconPenguin,
    fallbackSvg: '/assets/icon-penguin.svg',
    bgGrad: 'from-indigo-50 to-blue-50',
    borderColor: 'border-indigo-300',
    tagline: 'Unlike fractions, decimal math, 3D volume, and coordinate planes.',
    skills: ['Unlike Fraction Add/Sub', 'Decimals & Percents', 'Coordinate Graphs']
  },
  {
    id: 'grade-6',
    name: 'Grade 6',
    shortLabel: 'Grade 6',
    ageRange: 'Ages 10–11',
    icon: iconRocket,
    fallbackSvg: '/assets/icon-rocket.svg',
    bgGrad: 'from-purple-50 to-rose-50',
    borderColor: 'border-purple-300',
    tagline: 'Ratios, negative numbers, algebraic expressions, and statistics.',
    skills: ['Ratios & Percentages', 'Negative Integers', 'One-Step Equations']
  }
];

interface GradePickerProps {
  selectedGradeId: string;
  onSelectGrade: (gradeId: string) => void;
  onStartPracticing: (gradeId: string) => void;
}

export function GradePicker({ selectedGradeId, onSelectGrade, onStartPracticing }: GradePickerProps) {
  const selectedGrade = GRADES_LIST.find((g) => g.id === selectedGradeId) || GRADES_LIST[3];

  return (
    <section className="py-16 bg-white border-y border-stone-200/60" id="grades-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#1a56db] text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Progression</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#10246f] font-baloo tracking-tight">
            Choose Your Grade to Start Practicing
          </h2>
          <p className="mt-3 text-stone-600 font-nunito text-base sm:text-lg font-medium">
            Every grade features structured learning paths, adaptive visual questions, and instant rewards. Click any grade to see its curriculum focus.
          </p>
        </div>

        {/* 8-Grade Grid of Cute Animal Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {GRADES_LIST.map((grade) => {
            const isSelected = grade.id === selectedGradeId;
            return (
              <button
                key={grade.id}
                onClick={() => onSelectGrade(grade.id)}
                className={`flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none group ${
                  isSelected
                    ? `bg-gradient-to-b ${grade.bgGrad} ${grade.borderColor} shadow-lg scale-105 ring-2 ring-[#1a56db]/30`
                    : 'bg-stone-50/70 border-stone-200/80 hover:bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-2">
                  <img
                    src={grade.icon}
                    alt={grade.name}
                    className={`w-full h-full object-contain transition-transform duration-200 ${
                      isSelected ? 'scale-110 drop-shadow-md' : 'group-hover:scale-108'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = grade.fallbackSvg;
                    }}
                  />
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1a56db] text-white rounded-full flex items-center justify-center text-[10px] font-black">
                      ✓
                    </span>
                  )}
                </div>

                <div className="font-baloo font-black text-sm sm:text-base text-[#10246f] leading-tight">
                  {grade.shortLabel}
                </div>
                <div className="text-[11px] font-bold text-stone-500 mt-0.5">
                  {grade.ageRange}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Grade Detail Feature Card */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-6 sm:p-8 rounded-3xl border-2 border-blue-200/70 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl bg-white p-2 shadow-sm border border-stone-200 flex items-center justify-center">
              <img
                src={selectedGrade.icon}
                alt={selectedGrade.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = selectedGrade.fallbackSvg;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#10246f] text-white uppercase tracking-wider">
                  {selectedGrade.ageRange}
                </span>
                <span className="text-xs font-bold text-stone-500">Curriculum Framework</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#10246f] font-baloo mt-1">
                {selectedGrade.name}
              </h3>
              <p className="text-stone-600 font-nunito text-sm sm:text-base font-medium mt-1 max-w-xl">
                {selectedGrade.tagline}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedGrade.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={() => onStartPracticing(selectedGrade.id)}
              className="w-full md:w-auto px-6 py-3.5 bg-[#1a56db] hover:bg-[#10246f] text-white font-baloo font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Practice {selectedGrade.shortLabel} Now</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

export default GradePicker;
