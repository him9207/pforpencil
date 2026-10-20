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
    <section className="py-20 bg-stone-50/70 border-b border-stone-200/70" id="portals-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100 text-[#1a56db] text-xs font-black uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Built for Every Learning Partner</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#10246f] font-baloo tracking-tight">
            Tailored Experiences for Students, Parents & Educators
          </h2>
          <p className="mt-3 text-stone-600 font-nunito text-base sm:text-lg font-medium">
            Whether practicing independently at home or leading a 40-student classroom, P for Pencil offers dedicated interfaces and tools.
          </p>
        </div>

        {/* 3 Audience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. STUDENT CARD */}
          <div className="bg-white rounded-3xl border-2 border-blue-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Top Image Banner */}
            <div className="h-52 bg-gradient-to-br from-blue-100 via-sky-50 to-amber-50 p-4 flex items-center justify-center relative overflow-hidden">
              <img
                src={heroBoyImg}
                alt="Student Questing"
                className="h-full w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/hero-boy.svg';
                }}
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#1a56db] text-white font-baloo font-bold text-xs uppercase tracking-wider shadow-sm">
                For Students
              </span>
            </div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-2xl font-black text-[#10246f] font-baloo">
                  Gamified Quests & Fun Rewards
                </h3>
                <p className="mt-2 text-stone-600 font-nunito text-sm leading-relaxed">
                  Turn math practice into an adventure! Level up your avatar, earn shiny streak coins, take on boss challenges, and celebrate every breakthrough.
                </p>

                <ul className="mt-4 space-y-2 text-xs font-bold text-stone-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>XP levels, avatar coins & streak boosts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Visual CPA step-by-step guidance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Preschool through Grade 6 progression</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onSelectStudentRole}
                  className="w-full py-3 px-4 bg-[#1a56db] hover:bg-[#10246f] text-white font-baloo font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Launch Student Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. PARENT CARD */}
          <div className="bg-white rounded-3xl border-2 border-rose-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Top Image Banner */}
            <div className="h-52 bg-gradient-to-br from-amber-50 via-rose-50 to-pink-50 p-4 flex items-center justify-center relative overflow-hidden">
              <img
                src={parentsImg}
                alt="Parent and Child Learning"
                className="h-full w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/parents.svg';
                }}
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-600 text-white font-baloo font-bold text-xs uppercase tracking-wider shadow-sm">
                For Parents
              </span>
            </div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-2xl font-black text-[#10246f] font-baloo">
                  See Your Child Grow with Confidence
                </h3>
                <p className="mt-2 text-stone-600 font-nunito text-sm leading-relaxed">
                  Real-time skill mastery heatmaps, detailed progress reports, and customized practice plans. Manage up to 3 children with complete parental control.
                </p>

                <ul className="mt-4 space-y-2 text-xs font-bold text-stone-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time subject mastery analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Custom goal assignments & report cards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100% ad-free & distraction-free space</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onSelectParentRole}
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-baloo font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Explore Parent Portal</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. SCHOOLS & TEACHERS CARD */}
          <div className="bg-white rounded-3xl border-2 border-emerald-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
            {/* Top Image Banner */}
            <div className="h-52 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 p-4 flex items-center justify-center relative overflow-hidden">
              <img
                src={schoolsImg}
                alt="Schools and Classrooms"
                className="h-full w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/schools.svg';
                }}
              />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-700 text-white font-baloo font-bold text-xs uppercase tracking-wider shadow-sm">
                For Schools & Faculty
              </span>
            </div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-2xl font-black text-[#10246f] font-baloo">
                  Classroom Management Made Simple
                </h3>
                <p className="mt-2 text-stone-600 font-nunito text-sm leading-relaxed">
                  Bulk roster imports, multi-class grouping, auto-graded quizzes, and standardized alignment across CBSE, ICSE, US Common Core, and UK curricula.
                </p>

                <ul className="mt-4 space-y-2 text-xs font-bold text-stone-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>1-click bulk student roster & teacher access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Auto-graded assignments & gradebook</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Regional curriculum standards matching</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onSelectSchoolRole}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-baloo font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
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
