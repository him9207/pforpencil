import { useState } from 'react';
import PforPencilLogo from './PforPencilLogo';
import { 
  UserRole, 
  UserAccount 
} from '../types';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Database, 
  CreditCard, 
  ChevronDown, 
  UserCheck, 
  LogOut, 
  LogIn,
  Globe,
  Lock
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { COUNTRY_FLAG_MAP } from '../data/curriculumData';

interface NavbarProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  onOpenAuthModal: (opts?: { screen?: 'signin' | 'register'; role?: UserRole }) => void;
  onOpenPricingModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenRegionModal?: () => void;
  onOpenTactileLab?: () => void;
  currentView: string;
  onNavigateView: (view: string) => void;
}

export default function Navbar({
  currentUser,
  allUsers,
  onSelectUser,
  onOpenAuthModal,
  onOpenPricingModal,
  onOpenSupabaseModal,
  onOpenRegionModal,
  currentView,
  onNavigateView
}: NavbarProps) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const toggleSound = () => {
    const updated = sounds.toggleSound();
    setSoundOn(updated);
    if (updated) {
      sounds.playCorrect();
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-stone-900 text-white border-stone-900 shadow-2xs';
      case 'content_manager':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'school':
        return 'bg-orange-50 text-orange-900 border-orange-200';
      case 'teacher':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case 'parent':
        return 'bg-rose-50 text-rose-900 border-rose-200';
      case 'student':
        return 'bg-amber-100/70 text-amber-950 border-amber-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'content_manager': return 'Content Mgr';
      case 'school': return 'School';
      case 'teacher': return 'Teacher';
      case 'parent': return 'Parent';
      case 'student': return 'Student';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-8">
          <button 
            id="brand-home-btn"
            onClick={() => onNavigateView('home')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95 cursor-pointer"
          >
            <PforPencilLogo size="md" showSubtitle={false} />
          </button>

          {/* Primary Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button
              id="nav-tab-home"
              onClick={() => onNavigateView('home')}
              className={`relative py-2 transition-colors cursor-pointer ${
                currentView === 'home' ? 'text-slate-950 font-bold' : 'hover:text-slate-950'
              }`}
            >
              <span>Home</span>
              {currentView === 'home' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-slate-950" />
              )}
            </button>

            <button
              onClick={() => {
                if (currentView !== 'home') {
                  onNavigateView('home');
                  setTimeout(() => {
                    document.getElementById('grades-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('grades-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Grades (Pre-K to 6)
            </button>

            <button
              onClick={() => {
                if (currentView !== 'home') {
                  onNavigateView('home');
                  setTimeout(() => {
                    document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Live Practice
            </button>

            <button
              onClick={() => {
                if (currentView !== 'home') {
                  onNavigateView('home');
                  setTimeout(() => {
                    document.getElementById('portals-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('portals-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Portals
            </button>

            <button
              onClick={onOpenPricingModal}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>
        </div>

        {/* Action Buttons: Scope, Sound, Log In & Sign Up, Role Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Country & State Curriculum Scope Pill (Locked for Registered Users) */}
          {onOpenRegionModal && (
            <button
              id="nav-region-scope-btn"
              onClick={onOpenRegionModal}
              title={`Registered Framework: ${currentUser.country || 'Global'}${currentUser.state ? ` (${currentUser.state})` : ''} • ${currentUser.curriculum || 'Standard'} (Fixed at registration)`}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-50 text-slate-800 border border-stone-200 hover:bg-stone-100 hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
            >
              <span className="text-sm">
                {COUNTRY_FLAG_MAP[currentUser.country || ''] || '🌐'}
              </span>
              <span className="font-semibold text-slate-800">
                {currentUser.state || currentUser.country || 'USA'}
              </span>
              <Lock className="w-2.5 h-2.5 text-stone-400" />
            </button>
          )}

          {/* Database Hub (Supabase Test & Sync) Button */}
          {onOpenSupabaseModal && (
            <button
              id="nav-supabase-btn"
              onClick={onOpenSupabaseModal}
              title="Supabase Database Hub: Test Connection & Verify Live Data Sync"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs group"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-bold text-xs">Supabase</span>
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            id="nav-sound-btn"
            onClick={toggleSound}
            aria-label="Toggle sound effects"
            title={soundOn ? 'Sound Effects Enabled' : 'Sound Muted'}
            className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Log In Button */}
          <button
            id="nav-login-btn"
            onClick={() => onOpenAuthModal ? onOpenAuthModal({ screen: 'signin' }) : onNavigateView('home')}
            className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-slate-800 font-bold text-xs sm:text-sm hover:bg-stone-100 transition-all cursor-pointer"
          >
            Log In
          </button>

          {/* Get Started / Sign Up CTA Button */}
          <button
            id="nav-signup-btn"
            onClick={() => onOpenAuthModal ? onOpenAuthModal({ screen: 'register' }) : onNavigateView('home')}
            className="px-4 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            Get Started
          </button>

          {/* Current User & Role Selector Dropdown */}
          <div className="relative">
            <button
              id="role-switch-dropdown-btn"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-white transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-sm">
                {currentUser.avatar}
              </div>
            </button>

            {/* Dropdown Menu for Role Switching */}
            {roleDropdownOpen && (
              <div 
                id="role-switch-menu"
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl border border-stone-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Switch Active Persona
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    6 RBAC Roles
                  </span>
                </div>

                <div className="py-1 max-h-80 overflow-y-auto space-y-1">
                  {allUsers.map((user) => {
                    const isCurrent = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        id={`user-select-${user.id}`}
                        onClick={() => {
                          onSelectUser(user);
                          setRoleDropdownOpen(false);
                          sounds.playCorrect();
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer text-left ${
                          isCurrent ? 'bg-amber-50/70 border border-amber-300' : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg w-7 h-7 rounded-md bg-white border border-stone-200 flex items-center justify-center shrink-0">
                            {user.avatar}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-slate-900 truncate">
                              {user.name}
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate">
                              {user.email || `@${user.username}`}
                            </span>
                            {(user.country || user.curriculum) && (
                              <span className="block text-[10px] text-slate-400 font-medium truncate">
                                {COUNTRY_FLAG_MAP[user.country || ''] || '🌐'} {user.country || 'Global'}{user.state ? ` (${user.state})` : ''} • {user.curriculum ? user.curriculum.split('(')[0].trim() : 'Standard'}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border shrink-0 ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-stone-100 flex items-center justify-between px-2">
                  <button
                    id="open-login-dialog-btn"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-600" />
                    <span>Credential Login</span>
                  </button>
                  <button
                    id="simulate-logout-btn"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-rose-50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
