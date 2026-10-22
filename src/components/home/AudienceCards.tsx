import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Users, GraduationCap, School } from 'lucide-react';
import parentsImg from '../../assets/parents.webp';
import schoolsImg from '../../assets/schools.webp';
import heroBoyImg from '../../assets/hero-boy.webp';

interface AudienceCardsProps {
  onSelectStudentRole: () => void;
  onSelectParentRole: () => void;
  onSelectSchoolRole: () => void;
}

export function AudienceCards({
  onSelectStudentRole,
  onSelectParentRole,
  onSelectSchoolRole
}: AudienceCardsProps) {
  return (
    <section className="py-20 bg-slate-50/70 border-b border-slate-200/70" id="portals-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#e6f4ea] text-[#1e6f47] text-xs font-black uppercase tracking-wider mb-3 border border-emerald-200/60">
            <Users className="w-3.5 h-3.5 text-[#1e6f47]" />
            <span>Built for Every Learning Partner</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 font-baloo tracking-tight">
            Tailored Experiences for Students, Parents & Educators
          </h2>
          <p className="mt-3 text-slate-600 font-nunito text-base sm:text-lg font-medium">
            Whether practicing independently at home or leading a 40-student classroom, P for Pencil offers dedicated interfaces and tools.
          </p>
        </div>

        {/* 3 Audience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. STUDENT CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Top Image Banner */}
            <div className="h-52 bg-gradient-to-br from-[#e6f4ea]/60 via-teal-50/40 to-slate-50 p-4 flex items-center justify-center relative overflow-hidden">
              <img
                src={heroBoyImg}
                alt="Student Questing"
                className="h-full w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/hero-boy.svg';
                }}
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#1e6f47] text-white font-baloo font-bold text-xs uppercase tracking-wider shadow-2xs">
                For Students
              </span>
            </div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-baloo">
                  Gamified Quests & Fun Rewards
                </h3>
                <p className="mt-2 text-slate-600 font-nunito text-sm leading-relaxed">
                  Turn math practice into an adventure! Level up your avatar, earn shiny streak coins, take on boss challenges, and celebrate every breakthrough.
                </p>

                <ul className="mt-4 space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>XP levels, avatar coins & streak boosts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Visual CPA step-by-step guidance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Preschool through Grade 6 progression</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onSelectStudentRole}
                  className="w-full py-3 px-4 bg-[#1e6f47] hover:bg-[#165636] text-white font-baloo font-black text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Launch Student Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. PARENT CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Top Image Banner */}
            <div className="h-52 bg-gradient-to-br from-[#e6f4ea]/40 via-emerald-50/50 to-slate-50 p-4 flex items-center justify-center relative overflow-hidden">
              <img
                src={parentsImg}
                alt="Parent and Child Learning"
                className="h-full w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/parents.svg';
                }}
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#1e6f47] text-white font-baloo font-bold text-xs uppercase tracking-wider shadow-2xs">
                For Parents
              </span>
            </div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-baloo">
                  See Your Child Grow with Confidence
                </h3>
                <p className="mt-2 text-slate-600 font-nunito text-sm leading-relaxed">
                  Real-time skill mastery heatmaps, detailed progress reports, and customized practice plans. Manage up to 3 children with complete parental control.
                </p>

                <ul className="mt-4 space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time subject mastery analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom goal assignments & report cards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>100% ad-free & distraction-free space</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onSelectParentRole}
                  className="w-full py-3 px-4 bg-[#1e6f47] hover:bg-[#165636] text-white font-baloo font-black text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Explore Parent Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. SCHOOLS & TEACHERS CARD */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Top Image Banner */}
            <div className="h-52 bg-gradient-to-br from-emerald-50 via-[#e6f4ea]/60 to-slate-50 p-4 flex items-center justify-center relative overflow-hidden">
              <img
                src={schoolsImg}
                alt="Schools and Classrooms"
                className="h-full w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/schools.svg';
                }}
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#1e6f47] text-white font-baloo font-bold text-xs uppercase tracking-wider shadow-2xs">
                For Schools & Faculty
              </span>
            </div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900 font-baloo">
                  Classroom Management Made Simple
                </h3>
                <p className="mt-2 text-slate-600 font-nunito text-sm leading-relaxed">
                  Bulk roster imports, multi-class grouping, auto-graded quizzes, and standardized alignment across CBSE, ICSE, US Common Core, and UK curricula.
                </p>

                <ul className="mt-4 space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1-click bulk student roster & teacher access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Auto-graded assignments & gradebook</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Regional curriculum standards matching</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onSelectSchoolRole}
                  className="w-full py-3 px-4 bg-[#1e6f47] hover:bg-[#165636] text-white font-baloo font-black text-sm rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Explore School Solutions</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

export default AudienceCards;
