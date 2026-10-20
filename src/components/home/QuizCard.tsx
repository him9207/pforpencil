import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, XCircle, Lightbulb, ArrowRight, RotateCcw, Trophy, Star } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface QuizQuestion {
  gradeId: string;
  gradeBadge: string;
  topic: string;
  question: string;
  visual?: string;
  hint: string;
  options: string[];
  answer: string;
  explanation: string;
}

const GRADE_QUESTIONS: Record<string, QuizQuestion[]> = {
  preschool: [
    {
      gradeId: 'preschool',
      gradeBadge: 'Pre-K',
      topic: 'Fruit Counting',
      question: 'Count the sweet red strawberries in the basket:',
      visual: '🍓 🍓 🍓 🍓',
      hint: 'Point and count them one by one: 1, 2, 3, 4!',
      options: ['2', '3', '4', '5'],
      answer: '4',
      explanation: 'Great job! There are 4 delicious strawberries: 1, 2, 3, 4! 🍓'
    },
    {
      gradeId: 'preschool',
      gradeBadge: 'Pre-K',
      topic: 'Shape Discovery',
      question: 'Which shape has 3 straight sides?',
      visual: '🔺',
      hint: 'Think of a slice of pizza or a party hat!',
      options: ['Circle', 'Square', 'Triangle', 'Star'],
      answer: 'Triangle',
      explanation: 'Super! A triangle always has exactly 3 straight sides and 3 corners.'
    }
  ],
  foundation: [
    {
      gradeId: 'foundation',
      gradeBadge: 'Kinder',
      topic: 'Ten-Frame Counting',
      question: 'How many bright golden stars are shining?',
      visual: '⭐ ⭐ ⭐ ⭐ ⭐ ⭐',
      hint: 'Group them: 5 stars plus 1 more star.',
      options: ['5', '6', '7', '8'],
      answer: '6',
      explanation: 'Awesome work! 5 stars + 1 star = 6 stars total! ⭐'
    },
    {
      gradeId: 'foundation',
      gradeBadge: 'Kinder',
      topic: 'Simple Addition',
      question: 'What is 3 + 2?',
      visual: '🍎 🍎 🍎  +  🍏 🍏',
      hint: 'Start at 3 and count up 2 fingers: 4, 5!',
      options: ['4', '5', '6', '7'],
      answer: '5',
      explanation: 'Correct! 3 + 2 = 5! You are doing amazing!'
    }
  ],
  'grade-1': [
    {
      gradeId: 'grade-1',
      gradeBadge: 'Grade 1',
      topic: 'Addition within 20',
      question: 'What is 8 + 6?',
      visual: '8 + 6 = (8 + 2) + 4',
      hint: 'Make a ten first! 8 + 2 = 10, then add the remaining 4.',
      options: ['12', '13', '14', '15'],
      answer: '14',
      explanation: 'Bingo! 8 + 6 = 14. Making 10 is the fastest mental strategy.'
    },
    {
      gradeId: 'grade-1',
      gradeBadge: 'Grade 1',
      topic: 'Place Value',
      question: 'In the number 35, what is the value of the digit 3?',
      visual: '3 Tens and 5 Ones',
      hint: 'The 3 is in the tens column!',
      options: ['3', '30', '5', '35'],
      answer: '30',
      explanation: 'Brilliant! The digit 3 represents 3 tens, which equals 30.'
    }
  ],
  'grade-2': [
    {
      gradeId: 'grade-2',
      gradeBadge: 'Grade 2',
      topic: 'Mental Addition with Regrouping',
      question: 'What is 26 + 17?',
      visual: '(20 + 10) + (6 + 7)',
      hint: 'Add the tens: 20 + 10 = 30. Then add the ones: 6 + 7 = 13. 30 + 13 = ?',
      options: ['39', '41', '43', '45'],
      answer: '43',
      explanation: 'Outstanding! 26 + 17 = 43. 6 + 7 gives 13, and 30 + 13 = 43!'
    },
    {
      gradeId: 'grade-2',
      gradeBadge: 'Grade 2',
      topic: 'Skip Counting Patterns',
      question: 'What comes next in the sequence: 15, 20, 25, ___?',
      visual: '+5  +5  +5',
      hint: 'We are skip counting by 5s!',
      options: ['28', '30', '35', '40'],
      answer: '30',
      explanation: 'Spot on! 25 + 5 = 30.'
    }
  ],
  'grade-3': [
    {
      gradeId: 'grade-3',
      gradeBadge: 'Grade 3',
      topic: 'Multiplication Tables',
      question: 'What is 7 × 8?',
      visual: '7 rows of 8 dots = ?',
      hint: 'Think: 7 × 7 = 49, so add 7 more! Or 8 × 8 = 64 minus 8.',
      options: ['48', '54', '56', '58'],
      answer: '56',
      explanation: 'Fantastic! 7 × 8 = 56. One of the most famous times tables!'
    },
    {
      gradeId: 'grade-3',
      gradeBadge: 'Grade 3',
      topic: 'Fractions',
      question: 'Which fraction is equal to one half (1/2)?',
      visual: '½',
      hint: 'Find a fraction where the top number is half the bottom number.',
      options: ['2/3', '3/6', '4/10', '5/8'],
      answer: '3/6',
      explanation: 'Correct! 3/6 simplifies directly to 1/2 because 3 is half of 6.'
    }
  ],
  'grade-4': [
    {
      gradeId: 'grade-4',
      gradeBadge: 'Grade 4',
      topic: 'Equivalent Fractions',
      question: 'Which fraction is equivalent to 3/4?',
      visual: '3/4 = ? / 8',
      hint: 'Multiply both top and bottom by 2!',
      options: ['4/8', '5/8', '6/8', '7/8'],
      answer: '6/8',
      explanation: 'Terrific! 3/4 multiplied by 2/2 equals 6/8.'
    }
  ],
  'grade-5': [
    {
      gradeId: 'grade-5',
      gradeBadge: 'Grade 5',
      topic: 'Geometry & Area',
      question: 'Find the area of a rectangle with length 8 cm and width 7 cm:',
      visual: 'Area = Length × Width',
      hint: 'Multiply 8 cm by 7 cm.',
      options: ['48 cm²', '54 cm²', '56 cm²', '64 cm²'],
      answer: '56 cm²',
      explanation: 'Spot on! Area = 8 cm × 7 cm = 56 cm².'
    }
  ],
  'grade-6': [
    {
      gradeId: 'grade-6',
      gradeBadge: 'Grade 6',
      topic: 'Ratios & Unit Rates',
      question: 'If 4 notebooks cost $12, what is the price of 6 notebooks?',
      visual: '4 books = $12 → 1 book = ?',
      hint: 'Find the cost of 1 notebook first: $12 ÷ 4 = $3. Then multiply by 6.',
      options: [' $15', '$16', '$18', '$20'],
      answer: '$18',
      explanation: 'Masterful! 1 notebook is $3, so 6 notebooks cost 6 × $3 = $18.'
    }
  ]
};

interface QuizCardProps {
  selectedGradeId: string;
  onLaunchStudentArena: () => void;
}

export function QuizCard({ selectedGradeId, onLaunchStudentArena }: QuizCardProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(1);
  const [xp, setXp] = useState(30);

  // Get question bank for the current grade, fallback to Grade 2
  const questions = GRADE_QUESTIONS[selectedGradeId] || GRADE_QUESTIONS['grade-2'];
  const currentQ = questions[questionIndex % questions.length];

  const handleSelect = (option: string) => {
    if (selectedOption) return; // already answered
    setSelectedOption(option);

    const isCorrect = option.trim() === currentQ.answer.trim();
    if (isCorrect) {
      try { sounds.playCorrect(); } catch {}
      setStreak((s) => s + 1);
      setXp((x) => x + 15);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      try { sounds.playWrong(); } catch {}
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowHint(false);
    setQuestionIndex((prev) => (prev + 1) % questions.length);
  };

  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption?.trim() === currentQ.answer.trim();

  return (
    <section className="py-16 bg-gradient-to-b from-white via-blue-50/40 to-white" id="quiz-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            <span>Try It Yourself • Live Interactive Preview</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#10246f] font-baloo">
            Experience the Joy of Solving!
          </h2>
          <p className="text-stone-600 font-nunito font-medium text-base mt-1">
            See how our questions guide students with hints, playful rewards, and crystal-clear feedback.
          </p>
        </div>

        {/* The Quiz Box */}
        <div className="bg-white rounded-3xl border-2 border-blue-200/80 shadow-xl overflow-hidden p-6 sm:p-8 relative">
          
          {/* Top Bar: Grade Badge, Topic & XP counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-stone-200/70">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#10246f] text-white text-xs font-black uppercase tracking-wide">
                {currentQ.gradeBadge}
              </span>
              <span className="text-sm font-black text-[#1a56db]">
                {currentQ.topic}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{xp} XP</span>
              </div>
              <div className="text-xs font-bold text-stone-500">
                Question { (questionIndex % questions.length) + 1 } of {questions.length}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="py-6 text-center">
            <h3 className="text-xl sm:text-2xl font-black text-[#10246f] font-baloo leading-snug">
              {currentQ.question}
            </h3>

            {/* Visual Clue if available */}
            {currentQ.visual && (
              <div className="my-4 inline-block px-5 py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 font-mono font-black text-2xl sm:text-3xl text-amber-900 tracking-wider">
                {currentQ.visual}
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
            {currentQ.options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isThisSelected = selectedOption === opt;
              const isThisCorrect = opt.trim() === currentQ.answer.trim();

              let btnStyle = 'bg-stone-50 border-stone-200 hover:border-blue-400 hover:bg-blue-50/50 text-[#10246f]';
              if (isAnswered) {
                if (isThisCorrect) {
                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30';
                } else if (isThisSelected && !isThisCorrect) {
                  btnStyle = 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-400/30';
                } else {
                  btnStyle = 'bg-stone-50 border-stone-200 opacity-60 text-stone-500';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-baloo font-bold text-lg text-left transition-all duration-150 cursor-pointer select-none ${btnStyle}`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    isAnswered && isThisCorrect
                      ? 'bg-emerald-500 text-white'
                      : isAnswered && isThisSelected && !isThisCorrect
                      ? 'bg-rose-500 text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}>
                    {letter}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isAnswered && isThisCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {isAnswered && isThisSelected && !isThisCorrect && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation Box */}
          {isAnswered && (
            <div className={`mt-6 p-4 rounded-2xl border-2 animate-in fade-in max-w-xl mx-auto ${
              isCorrect ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Lightbulb className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-baloo font-black text-base">
                    {isCorrect ? '🎉 Splendid Work! +15 XP' : '💡 Almost there! Here is how to think about it:'}
                  </div>
                  <div className="font-nunito font-semibold text-sm">
                    {currentQ.explanation}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions: Hint, Next Question & Full Quiz Link */}
          <div className="mt-8 pt-5 border-t border-stone-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Hint toggle */}
            {!isAnswered ? (
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{showHint ? 'Hide Hint' : 'Need a Clue?'}</span>
              </button>
            ) : (
              <div />
            )}

            {/* Next or Reset */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {isAnswered ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-[#10246f] hover:bg-[#1a56db] text-white font-baloo font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}

              <button
                onClick={onLaunchStudentArena}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-baloo font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Full Question Arena</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>

          {/* Hint disclosure */}
          {showHint && !isAnswered && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-medium text-amber-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{currentQ.hint}</span>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}

export default QuizCard;
