import React from 'react';
import { Heart, Globe, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import PforPencilLogo from '../../common/PforPencilLogo';

interface FooterProps {
  onSelectGrade: (gradeId: string) => void;
  onOpenPricing: () => void;
  onOpenRegionModal: () => void;
  onNavigatePortal: (role: string) => void;
}

export function Footer({
  onSelectGrade,
  onOpenPricing,
  onOpenRegionModal,
  onNavigatePortal
}: FooterProps) {
  return (
    <footer className="bg-[#0b1744] text-stone-300 pt-16 pb-12 border-t-4 border-amber-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand & Overview Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <PforPencilLogo size="md" className="brightness-125" />
            </div>
            
            <p className="text-sm font-nunito text-stone-400 leading-relaxed max-w-sm">
              Empowering young learners from Preschool through Grade 6 with playful, curriculum-aligned math mastery, gamified quests, and actionable growth insights.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onOpenRegionModal}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-800/80 hover:bg-stone-700 text-xs font-bold text-amber-300 border border-stone-700 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Change Curriculum & Region</span>
              </button>
            </div>

            <div className="text-xs text-stone-500 flex items-center gap-2 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Kid-Safe • No 3rd-Party Ads • COPPA & GDPR Aligned</span>
            </div>
          </div>

          {/* Grades Column */}
          <div>
            <h4 className="text-white font-baloo font-bold text-base tracking-wide uppercase mb-3">
              Grades
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button onClick={() => onSelectGrade('preschool')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Preschool & Pre-K (Ages 3–4)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectGrade('foundation')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Foundation Kindergarten (Ages 4–5)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectGrade('grade-1')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Grade 1 (Ages 5–6)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectGrade('grade-2')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Grade 2 (Ages 6–7)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectGrade('grade-3')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Grade 3 (Ages 7–8)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectGrade('grade-4')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Grade 4 (Ages 8–9)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectGrade('grade-5')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Grade 5 (Ages 9–10)
                </button>
              </li>
              <li>
                <button onClick={() => onSelectGrade('grade-6')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Grade 6 (Ages 10–11)
                </button>
              </li>
            </ul>
          </div>

          {/* Dedicated Portals */}
          <div>
            <h4 className="text-white font-baloo font-bold text-base tracking-wide uppercase mb-3">
              Portals
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button onClick={() => onNavigatePortal('student')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Student Quest Arena
                </button>
              </li>
              <li>
                <button onClick={() => onNavigatePortal('parent')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Parent Growth Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigatePortal('teacher')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Teacher Classroom Hub
                </button>
              </li>
              <li>
                <button onClick={() => onNavigatePortal('school')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  School Administration
                </button>
              </li>
              <li>
                <button onClick={() => onNavigatePortal('admin')} className="hover:text-amber-300 transition-colors cursor-pointer">
                  Curriculum & Admin Console
                </button>
              </li>
              <li className="pt-2">
                <button onClick={onOpenPricing} className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Subscription Plans</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Curriculum Standards */}
          <div>
            <h4 className="text-white font-baloo font-bold text-base tracking-wide uppercase mb-3">
              Curricula
            </h4>
            <ul className="space-y-2 text-sm font-medium">
              <li className="text-stone-400">CBSE & ICSE (India)</li>
              <li className="text-stone-400">Common Core Math (USA)</li>
              <li className="text-stone-400">National Curriculum (UK)</li>
              <li className="text-stone-400">Singapore Math Framework</li>
              <li className="text-stone-400">Australian Curriculum (ACARA)</li>
              <li className="text-stone-400">IB Primary Years (PYP)</li>
              <li className="text-stone-400">UAE Ministry of Education</li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Tagline */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div>
            © 2026 P for Pencil Inc. All rights reserved.
          </div>

          <div className="flex items-center gap-1 font-bold text-stone-400">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for curious young minds everywhere.</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
