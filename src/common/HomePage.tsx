import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { 
  ArrowRight, 
  Gamepad2, 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  Star, 
  Globe
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { 
  HeroKidsIllustration, 
  ParentChildIllustration, 
  SchoolhouseIllustration, 
  SproutPlantIllustration 
} from '../components/HomePageIllustrations';

interface HomePageProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  grades: CurriculumGrade[];
  subjects: CurriculumSubject[];
  questions: Question[];
  activities: Activity[];
  onSelectRoleUser: (user: UserAccount) => void;
  onNavigateView: (view: string) => void;
  onOpenPricing: () => void;
  onOpenRegionModal: () => void;
  onOpenAuthModal: (options?: { screen?: 'signin' | 'register'; role?: UserRole }) => void;
  onOpenSupabaseModal: () => void;
  onDirectLogin: (user: UserAccount) => void;
  onRegisterUser?: (newUser: UserAccount, newProgress?: StudentProgress) => void;
}

export default function HomePage({
  currentUser,
  allUsers,
  grades,
  subjects,
  questions,
  activities,
  onSelectRoleUser,
  onNavigateView,
  onOpenPricing,
  onOpenRegionModal,
  onOpenAuthModal,
  onOpenSupabaseModal,
  onDirectLogin,
  onRegisterUser
}: HomePageProps) {
  const [selectedGradeName, setSelectedGradeName] = useState<string>(grades[0]?.name || 'Preschool');
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <div className="space-y-16 pb-20 max-w-7xl mx-auto px-4 sm:px-6 font-sans">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (100% Visual Match with home page.png) */}
      {/* ========================================================================= */}
      <section className="relative pt-6 sm:pt-10 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-6">
            {/* Tracked Uppercase Eyebrow */}
            <div className="text-stone-400 font-bold tracking-[0.2em] text-xs sm:text-sm uppercase">
              PRACTICE &nbsp;•&nbsp; LEARN &nbsp;•&nbsp; GROW
            </div>

            {/* Main Title */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#0A1128] tracking-tight leading-[1.05]">
                Math Learning <br />
                <span className="text-[#FF2A7A] relative inline-flex items-center gap-2">
                  <span>Made Fun</span>
                  <span className="text-3xl sm:text-4xl text-[#FF2A7A] inline-block transform rotate-12">
                    🚀
                  </span>
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-stone-600 font-medium pt-2">
                Interactive math practice for curious minds.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                id="hero-get-started-btn"
                onClick={() => onOpenAuthModal({ screen: 'register' })}
                className="px-8 py-4 rounded-full bg-[#FF2A7A] hover:bg-[#E01F67] text-white font-black text-base sm:text-lg shadow-lg shadow-pink-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                id="hero-watch-video-btn"
                type="button"
                onClick={() => {
                  sounds.playVictory();
                  setShowVideoModal(true);
                }}
                className="px-5 py-3.5 rounded-full bg-white hover:bg-stone-50 border border-stone-200 text-stone-900 font-bold text-sm transition-all cursor-pointer flex items-center gap-2.5 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200 text-[#FF2A7A] flex items-center justify-center font-black text-xs">
                  ▶
                </div>
                <span>Watch Video</span>
              </button>
            </div>

            {/* 4 Feature Badges Row */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 pt-6 max-w-md">
              {/* Feature 1: Play */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-purple-50/80 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-black shrink-0">
                  <Gamepad2 className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-stone-800">Play</span>
              </div>

              {/* Feature 2: Learn */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-amber-50/80 border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-black shrink-0">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-stone-800">Learn</span>
              </div>

              {/* Feature 3: Track */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-emerald-50/80 border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-black shrink-0">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-stone-800">Track</span>
              </div>

              {/* Feature 4: Safe */}
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-sky-50/80 border border-sky-100">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-black shrink-0">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-stone-800">Safe</span>
              </div>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <HeroKidsIllustration />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CHOOSE A GRADE SECTION */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-3">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0A1128] tracking-tight">
            Choose a Grade
          </h2>

          <button
            id="view-all-grades-link"
            onClick={() => onOpenAuthModal({ screen: 'register' })}
            className="text-[#FF2A7A] hover:text-[#E01F67] font-black text-sm flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All Grades</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 8 Soft Pastel Grade Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {[
            { id: 'GRD_FOUNDATION', name: 'Foundation', icon: '⭐', bg: 'bg-[#FFF9E6] border-amber-100/80 hover:bg-[#FFF2CC]' },
            { id: 'GRD_KINDER', name: 'Kindergarten', icon: '🌈', bg: 'bg-[#E8F8FF] border-sky-100/80 hover:bg-[#D4F2FF]' },
            { id: 'GRD_1', name: 'Grade 1', icon: '🦁', bg: 'bg-[#FFF0F5] border-pink-100/80 hover:bg-[#FFE0EC]' },
            { id: 'GRD_2', name: 'Grade 2', icon: '🐼', bg: 'bg-[#FDF0F8] border-purple-100/80 hover:bg-[#F9E0F2]' },
            { id: 'GRD_3', name: 'Grade 3', icon: '🦊', bg: 'bg-[#FFF2EE] border-orange-100/80 hover:bg-[#FFE4DC]' },
            { id: 'GRD_4', name: 'Grade 4', icon: '🐊', bg: 'bg-[#E8FAED] border-emerald-100/80 hover:bg-[#D4F5DE]' },
            { id: 'GRD_5', name: 'Grade 5', icon: '🐬', bg: 'bg-[#EAF5FF] border-blue-100/80 hover:bg-[#D6EBFF]' },
            { id: 'GRD_6', name: 'Grade 6', icon: '🚀', bg: 'bg-[#FFF0F5] border-rose-100/80 hover:bg-[#FFE0EC]' },
          ].map((item) => (
            <button
              key={item.name}
              id={`grade-card-${item.id}`}
              onClick={() => {
                sounds.click();
                setSelectedGradeName(item.name);
                onOpenAuthModal({ screen: 'register' });
              }}
              className={`p-5 rounded-2xl border ${item.bg} flex flex-col items-center justify-center gap-3 transition-all transform hover:-translate-y-1 hover:shadow-md cursor-pointer group min-h-[140px]`}
            >
              <span className="text-4xl sm:text-5xl transform group-hover:scale-110 transition-transform drop-shadow-2xs">
                {item.icon}
              </span>
              <span className="font-black text-stone-900 text-sm text-center">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOR PARENTS / FOR SCHOOLS SPLIT CARDS */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Card 1: FOR PARENTS */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#FFF0F5] border border-pink-100/80 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xs hover:shadow-md transition-shadow">
          <div className="space-y-3 relative z-10">
            <span className="text-xs font-black text-[#FF2A7A] uppercase tracking-wider">
              FOR PARENTS
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-[#0A1128] tracking-tight leading-tight">
              Support <br /> Their Journey
            </h3>
          </div>

          <div className="flex items-center justify-between pt-2 relative z-10">
            <button
              id="for-parents-learn-more-btn"
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'parent' })}
              className="px-7 py-3.5 rounded-full bg-[#FF2A7A] hover:bg-[#E01F67] text-white font-black text-sm shadow-md shadow-pink-500/20 transition-all cursor-pointer flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 3D Parent Illustration */}
            <ParentChildIllustration className="w-36 h-36" />
          </div>
        </div>

        {/* Card 2: FOR SCHOOLS */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#EDF5FF] border border-sky-100/80 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xs hover:shadow-md transition-shadow">
          <div className="space-y-3 relative z-10">
            <span className="text-xs font-black text-[#0088FF] uppercase tracking-wider">
              FOR SCHOOLS
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-[#0A1128] tracking-tight leading-tight">
              Engage <br /> Your Students
            </h3>
          </div>

          <div className="flex items-center justify-between pt-2 relative z-10">
            <button
              id="for-schools-learn-more-btn"
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'school' })}
              className="px-7 py-3.5 rounded-full bg-[#0088FF] hover:bg-[#0070ED] text-white font-black text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* 3D Schoolhouse Illustration */}
            <SchoolhouseIllustration className="w-40 h-36" />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. STATISTICS BAR */}
      {/* ========================================================================= */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#F8FAFC] border border-stone-200/60 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-stone-200/70">
          <div className="space-y-1 p-2">
            <div className="text-2xl sm:text-3xl font-black text-[#0A1128] flex items-center justify-center gap-2">
              <span className="text-[#FF2A7A]">👥</span>
              <span>10,000+</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-500">Happy Learners</p>
          </div>

          <div className="space-y-1 p-2 pt-4 md:pt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#0A1128] flex items-center justify-center gap-2">
              <span className="text-[#0088FF]">🏫</span>
              <span>100+</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-500">Partner Schools</p>
          </div>

          <div className="space-y-1 p-2 pt-4 md:pt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#0A1128] flex items-center justify-center gap-2">
              <span className="text-[#FFB800]">🏆</span>
              <span>1M+</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-500">Questions Solved</p>
          </div>

          <div className="space-y-1 p-2 pt-4 md:pt-2">
            <div className="text-2xl sm:text-3xl font-black text-[#0A1128] flex items-center justify-center gap-2">
              <span className="text-[#10B981]">🌐</span>
              <span>Expanding</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-500">Across Australia</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BOTTOM BANNER: EVERY LEARNER MATTERS */}
      {/* ========================================================================= */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[#E8F8F0] border border-emerald-100/80 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xs">
        <div className="flex items-center gap-6">
          <SproutPlantIllustration className="w-20 h-20 shrink-0" />

          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A1128]">
              Every Learner <span className="text-[#FF2A7A]">Matters</span>
            </h2>
            <p className="text-stone-600 font-bold text-base sm:text-lg">
              A brighter tomorrow, one problem at a time.
            </p>
          </div>
        </div>

        <button
          id="bottom-banner-get-started-btn"
          onClick={() => onOpenAuthModal({ screen: 'register' })}
          className="px-8 py-4 rounded-full bg-[#FF2A7A] hover:bg-[#E01F67] text-white font-black text-base sm:text-lg shadow-lg shadow-pink-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2.5 shrink-0"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="pt-8 border-t border-stone-200 text-xs sm:text-sm text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-black text-stone-900">P for Pencil</span>
          <span>• © 2026 PforPencil Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onOpenAuthModal({ screen: 'signin' })}
            className="hover:text-stone-900 font-bold cursor-pointer"
          >
            Log In
          </button>
          <button
            onClick={onOpenPricing}
            className="hover:text-stone-900 font-bold cursor-pointer"
          >
            Pricing
          </button>
          <button
            onClick={onOpenRegionModal}
            className="hover:text-stone-900 font-bold cursor-pointer"
          >
            Region Standards
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* WATCH VIDEO DEMO MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border-2 border-pink-200 shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#FF2A7A] flex items-center justify-center font-black text-lg">
                    🎬
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0A1128]">P for Pencil Showcase</h3>
                    <p className="text-xs text-stone-500 font-medium">1-minute platform overview & gameplay</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Video Player Box */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 shadow-inner flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FF2A7A] text-white flex items-center justify-center text-2xl font-black shadow-lg animate-pulse">
                  ▶
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-amber-300">✨ Interactive Math Quest Demo</p>
                  <p className="text-xs text-stone-300 max-w-sm">
                    Watch how students solve visual math quests, collect coins, earn badges, and build math mastery!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-stone-500">Ready to start?</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowVideoModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-extrabold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Close Demo
                  </button>
                  <button
                    onClick={() => {
                      setShowVideoModal(false);
                      onOpenAuthModal({ screen: 'register' });
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#FF2A7A] hover:bg-[#E01F67] text-white font-extrabold text-xs shadow-md shadow-pink-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
