import React, { useState, useMemo } from 'react';
import { 
  UserAccount, 
  CurriculumGrade, 
  CurriculumSubject, 
  Question, 
  Activity,
  UserRole,
  StudentProgress
} from '../types';
import Hero from '../components/home/Hero';
import GradePicker, { GRADES_LIST } from '../components/home/GradePicker';
import QuizCard from '../components/home/QuizCard';
import AudienceCards from '../components/home/AudienceCards';
import Footer from '../components/home/Footer';
import { 
  BrainCircuit, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  ArrowRight,
  BookOpen,
  PieChart,
  Shapes,
  Clock,
  BarChart3,
  Calculator
} from 'lucide-react';

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

const PEDAGOGY_PILLARS = [
  {
    number: '01',
    title: 'Concrete-Pictorial-Abstract (CPA)',
    description: 'Every mathematical concept begins with tactile visual representations (strawberries, ten-frames, array grids) before moving to formal symbols and equations.',
    icon: Shapes
  },
  {
    number: '02',
    title: 'Active Retrieval & Micro-Steps',
    description: 'Questions are designed in bite-sized increments that reward effort with instant XP, preventing cognitive overload and building enduring stamina.',
    icon: Sparkles
  },
  {
    number: '03',
    title: 'Error-Friendly Feedback',
    description: 'Incorrect answers provide gentle, non-judgmental visual hints rather than cold penalties, fostering a resilient growth mindset in every child.',
    icon: BrainCircuit
  },
  {
    number: '04',
    title: 'Multi-Curriculum Alignment',
    description: 'Built from the ground up to match CBSE, ICSE, US Common Core, UK National Curriculum, Singapore Math, and Australian standards.',
    icon: Globe
  }
];

export default function PForPencilHomePage({
  currentUser,
  allUsers,
  onSelectRoleUser,
  onNavigateView,
  onOpenPricing,
  onOpenRegionModal,
  onOpenAuthModal,
  onOpenSupabaseModal,
  onDirectLogin
}: HomePageProps) {
  const [selectedGradeId, setSelectedGradeId] = useState<string>('grade-2');

  // Find demo users for quick role testing
  const studentUser = useMemo(() => allUsers.find((u) => u.role === 'student') || currentUser, [allUsers, currentUser]);
  const parentUser = useMemo(() => allUsers.find((u) => u.role === 'parent') || currentUser, [allUsers, currentUser]);
  const teacherUser = useMemo(() => allUsers.find((u) => u.role === 'teacher') || currentUser, [allUsers, currentUser]);
  const schoolUser = useMemo(() => allUsers.find((u) => u.role === 'school') || currentUser, [allUsers, currentUser]);
  const adminUser = useMemo(() => allUsers.find((u) => u.role === 'admin') || currentUser, [allUsers, currentUser]);

  const handleStartFree = () => {
    onOpenAuthModal({ screen: 'register', role: 'student' });
  };

  const handleExploreCurriculum = () => {
    const el = document.getElementById('grades-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTryQuiz = () => {
    const el = document.getElementById('quiz-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLaunchStudentArena = () => {
    if (studentUser) {
      onSelectRoleUser(studentUser);
    } else {
      onOpenAuthModal({ screen: 'signin', role: 'student' });
    }
  };

  const handleNavigatePortal = (role: string) => {
    const targetMap: Record<string, UserAccount | undefined> = {
      student: studentUser,
      parent: parentUser,
      teacher: teacherUser,
      school: schoolUser,
      admin: adminUser
    };
    const target = targetMap[role];
    if (target) {
      onSelectRoleUser(target);
    } else {
      onOpenAuthModal({ screen: 'signin', role: role as UserRole });
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-[#1a56db] selection:text-white flex flex-col">
      
      {/* Subtle Role Demo Bar for Testers & Reviewers */}
      <div className="bg-slate-900 text-white py-2 px-4 text-xs font-semibold border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-slate-400">Interactive Demo Preview:</span>
          <span className="text-white">Active as <span className="text-emerald-300 font-bold capitalize">{currentUser.name} ({currentUser.role})</span></span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Switch Portal:</span>
          <button
            onClick={() => handleNavigatePortal('student')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
              currentUser.role === 'student' ? 'bg-[#e6f4ea] text-[#1e6f47] font-extrabold shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            🎮 Student
          </button>
          <button
            onClick={() => handleNavigatePortal('parent')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
              currentUser.role === 'parent' ? 'bg-[#e6f4ea] text-[#1e6f47] font-extrabold shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            👨‍👩‍👧 Parent
          </button>
          <button
            onClick={() => handleNavigatePortal('teacher')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
              currentUser.role === 'teacher' ? 'bg-[#e6f4ea] text-[#1e6f47] font-extrabold shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            👩‍🏫 Teacher
          </button>
          <button
            onClick={() => handleNavigatePortal('school')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
              currentUser.role === 'school' ? 'bg-[#e6f4ea] text-[#1e6f47] font-extrabold shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            🏫 School
          </button>
          <button
            onClick={() => handleNavigatePortal('admin')}
            className={`px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
              currentUser.role === 'admin' ? 'bg-[#e6f4ea] text-[#1e6f47] font-extrabold shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            ⚙️ Admin
          </button>
        </div>
      </div>

      {/* 1. Hero Section */}
      <Hero
        onStartFree={handleStartFree}
        onExploreCurriculum={handleExploreCurriculum}
        onTryQuiz={handleTryQuiz}
      />

      {/* 2. Choose Your Grade Section */}
      <GradePicker
        selectedGradeId={selectedGradeId}
        onSelectGrade={(id) => {
          setSelectedGradeId(id);
          // Also smooth scroll down to the quiz preview
          const el = document.getElementById('quiz-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onStartPracticing={(id) => {
          setSelectedGradeId(id);
          handleLaunchStudentArena();
        }}
      />

      {/* 3. Live Interactive Quiz Card Section */}
      <QuizCard
        selectedGradeId={selectedGradeId}
        onLaunchStudentArena={handleLaunchStudentArena}
      />

      {/* 4. Audience Sections: Student, Parent, School */}
      <AudienceCards
        onSelectStudentRole={() => handleNavigatePortal('student')}
        onSelectParentRole={() => handleNavigatePortal('parent')}
        onSelectSchoolRole={() => handleNavigatePortal('school')}
      />

      {/* 5. Pedagogy & Methodology Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6f4ea] text-[#1e6f47] text-xs font-black uppercase tracking-wider mb-3 border border-emerald-200/60">
              <Award className="w-3.5 h-3.5 text-[#1e6f47]" />
              <span>Evidence-Based Pedagogy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-baloo">
              Why Children Love Learning with P for Pencil
            </h2>
            <p className="mt-3 text-slate-600 font-nunito text-base sm:text-lg font-medium">
              We replace memorization anxiety with intuitive discovery, active visual models, and joyful positive reinforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PEDAGOGY_PILLARS.map((pillar, idx) => {
              const IconComp = pillar.icon;
              return (
                <div 
                  key={idx}
                  className="bg-slate-50/80 rounded-3xl p-6 border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#e6f4ea] text-[#1e6f47] border border-emerald-200/80 flex items-center justify-center mb-5 shadow-2xs">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="font-mono text-xs font-black text-[#1e6f47] tracking-wider mb-1">
                      STEP {pillar.number}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 font-baloo leading-tight">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-slate-600 font-nunito text-sm leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-200/60 mt-4 flex items-center gap-1.5 text-xs font-bold text-[#1e6f47]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Curriculum Proven</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Pre-Footer Call to Action Banner */}
      <section className="bg-gradient-to-r from-[#165636] via-[#1e6f47] to-[#12422a] py-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-400/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 text-xs sm:text-sm font-bold">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Ready to transform math into joyful playtime?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black font-baloo tracking-tight leading-tight">
            Start Your Child's Learning Adventure Today
          </h2>

          <p className="text-base sm:text-lg text-emerald-100/90 font-nunito max-w-2xl mx-auto font-medium">
            Join thousands of happy students discovering math confidence. No credit card required to get started.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleStartFree}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-emerald-50 text-[#1e6f47] font-baloo font-black text-lg rounded-full shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 group hover:scale-102"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onOpenPricing}
              className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-baloo font-black text-lg rounded-full transition-all cursor-pointer"
            >
              <span>View Family & School Plans</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <Footer
        onSelectGrade={(gradeId) => {
          setSelectedGradeId(gradeId);
          handleExploreCurriculum();
        }}
        onOpenPricing={onOpenPricing}
        onOpenRegionModal={onOpenRegionModal}
        onNavigatePortal={handleNavigatePortal}
      />

    </div>
  );
}
