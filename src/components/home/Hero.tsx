import React from 'react';
import { Sparkles, ArrowRight, BookOpen, Star, Trophy, Flame } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import pencilMascotImg from '../../assets/pencil-mascot.webp';
import heroBoyImg from '../../assets/hero-boy.webp';

interface HeroProps {
  onStartFree: () => void;
  onExploreCurriculum: () => void;
  onTryQuiz: () => void;
}

export function Hero({ onStartFree, onExploreCurriculum, onTryQuiz }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#e6f4ea]/40 via-white to-slate-50/50 pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200/60">
      {/* Playful background decorative shapes */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-teal-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-4 left-1/3 w-80 h-80 bg-emerald-100/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines, Value Props & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Mascot Welcome Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e6f4ea] shadow-2xs border border-emerald-200/80 text-[#1e6f47] font-bold text-xs sm:text-sm animate-bounce-subtle">
              <img 
                src={pencilMascotImg} 
                alt="Pencil Mascot" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/pencil-mascot.svg';
                }}
              />
              <span className="font-baloo text-[#1e6f47] font-black tracking-wide">
                Welcome to P for Pencil! ✏️
              </span>
              <span className="hidden sm:inline text-emerald-800 font-semibold">| Preschool to Grade 6</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] font-baloo">
              Learning That Feels Like <span className="text-[#1e6f47] relative inline-block">
                Play,
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-amber-400" viewBox="0 0 100 12" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,8 Q50,0 100,8 Q50,14 0,8 Z" />
                </svg>
              </span>
              <br className="hidden sm:block" />
              Results That Speak For Themselves.
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-nunito leading-relaxed font-medium mx-auto lg:mx-0">
              Interactive math quests, phonics discovery, and critical reasoning crafted for curious young learners. Designed for joyful mastery, gamified progress, and complete parent peace of mind.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Button
                size="lg"
                variant="primary"
                onClick={onStartFree}
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-4 bg-[#1e6f47] hover:bg-[#165636] text-white shadow-lg shadow-emerald-700/20 rounded-full group flex items-center justify-center gap-2"
              >
                <span>Start Practicing Free</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={onTryQuiz}
                className="w-full sm:w-auto text-base sm:text-lg px-7 py-4 border-2 border-slate-300 text-slate-800 hover:bg-[#e6f4ea] hover:border-emerald-300 rounded-full flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Try Live Challenge</span>
              </Button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-center sm:text-left max-w-xl mx-auto lg:mx-0">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-baloo">5,000+</div>
                <div className="text-xs sm:text-sm text-slate-500 font-bold">Interactive Questions</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-[#1e6f47] font-baloo">100%</div>
                <div className="text-xs sm:text-sm text-slate-500 font-bold">Curriculum Aligned</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 font-baloo">25,000+</div>
                <div className="text-xs sm:text-sm text-slate-500 font-bold">Students & Parents</div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Illustration & Floating Math Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Glowing Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200/30 via-teal-100/30 to-amber-100/30 rounded-3xl blur-2xl transform rotate-3 scale-95" />

            {/* Main Hero Card Container */}
            <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xs p-6 rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center">
              
              {/* Floating Element 1: Top Left XP Badge */}
              <div className="absolute -top-4 -left-4 bg-white px-3.5 py-1.5 rounded-2xl shadow-md border border-amber-200 flex items-center gap-2 transform -rotate-6 animate-pulse">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span className="font-baloo font-black text-amber-950 text-sm">+15 XP Earned!</span>
              </div>

              {/* Floating Element 2: Top Right Streak Badge */}
              <div className="absolute -top-3 -right-3 bg-white px-3 py-1.5 rounded-2xl shadow-md border border-rose-200 flex items-center gap-1.5 transform rotate-6">
                <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span className="font-baloo font-black text-rose-700 text-xs sm:text-sm">7-Day Streak</span>
              </div>

              {/* Central Character Hero Graphic */}
              <div className="w-full flex items-center justify-center py-2">
                <img
                  src={heroBoyImg}
                  alt="Cheering Student Champion"
                  className="w-64 sm:w-72 h-auto object-contain drop-shadow-md select-none transform hover:scale-103 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/hero-boy.svg';
                  }}
                />
              </div>

              {/* Floating Bottom Card: Fun Equation Preview */}
              <div className="w-full mt-2 bg-gradient-to-r from-emerald-50/80 to-slate-50 rounded-2xl p-3 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#1e6f47] text-white flex items-center justify-center font-black text-lg">
                    ✏️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Instant Math Discovery</div>
                    <div className="text-sm font-black text-slate-900">7 × 8 = <span className="text-[#1e6f47]">56</span> ⭐</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#1e6f47] font-bold text-xs border border-emerald-200">Grade 3</span>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
