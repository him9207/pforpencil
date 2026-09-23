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
  Globe
} from 'lucide-react';
import { sounds } from '../utils/audio';

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
    <header className="sticky top-0 z-40 bg-white border-b border-[#e1e6f1] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <button 
            id="brand-home-btn"
            onClick={() => onNavigateView('home')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95 cursor-pointer"
          >
            <PforPencilLogo size="md" showSubtitle={false} />
          </button>

          {/* Primary Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-[#59627a]">
            <button
              id="nav-tab-home"
              onClick={() => onNavigateView('home')}
              className={`relative py-2 transition-colors cursor-pointer ${
                currentView === 'home' ? 'text-[#10246f] font-black' : 'hover:text-[#10246f]'
              }`}
            >
              <span>Home</span>
              {currentView === 'home' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-[#1a56db]" />
              )}
            </button>

            <button
              onClick={() => {
                if (currentView !== 'home') {
                  onNavigateView('home');
                  setTimeout(() => {
                    document.getElementById('topics')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('topics')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-[#10246f] transition-colors cursor-pointer"
            >
              Math Strands
            </button>

            <button
              onClick={() => {
                if (currentView !== 'home') {
                  onNavigateView('home');
                  setTimeout(() => {
                    document.getElementById('grades')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('grades')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-[#10246f] transition-colors cursor-pointer"
            >
              Grade Roadmap
            </button>

            <button
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'parent' })}
              className="hover:text-[#10246f] transition-colors cursor-pointer"
            >
              For Parents
            </button>

            <button
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'school' })}
              className="hover:text-[#10246f] transition-colors cursor-pointer"
            >
              For Schools
            </button>

            <button
              onClick={onOpenPricingModal}
              className="hover:text-[#10246f] transition-colors cursor-pointer"
            >
              Pricing
            </button>
          </nav>
        </div>

        {/* Action Buttons: Scope, Sound, Log In & Sign Up, Role Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Country & State Curriculum Scope Pill */}
          {onOpenRegionModal && (
            <button
              id="nav-region-scope-btn"
              onClick={onOpenRegionModal}
              title={`Active Curriculum: ${currentUser.country || 'Global'} (${currentUser.state || 'All'}) - Click to customize`}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#f8faff] text-[#10246f] border border-[#e1e6f1] hover:bg-[#eff6ff] hover:border-[#1a56db] transition-colors cursor-pointer shadow-2xs"
            >
              <span className="text-sm">
                {currentUser.country === 'India' ? '🇮🇳' : currentUser.country === 'United Kingdom' ? '🇬🇧' : currentUser.country === 'Canada' ? '🇨🇦' : currentUser.country === 'Australia' ? '🇦🇺' : '🇺🇸'}
              </span>
              <span className="font-semibold text-[#10246f]">
                {currentUser.state || currentUser.country || 'USA'}
              </span>
            </button>
          )}

          {/* Database Hub (Supabase Test & Sync) Button */}
          {onOpenSupabaseModal && (
            <button
              id="nav-supabase-btn"
              onClick={onOpenSupabaseModal}
              title="Supabase Database Hub: Test Connection & Verify Live Data Sync"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-[#f8faff] text-[#10246f] border border-[#e1e6f1] hover:bg-[#ecfdf5] hover:border-[#16c47f] transition-all cursor-pointer shadow-2xs group"
            >
              <Database className="w-3.5 h-3.5 text-[#16c47f] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline font-bold text-xs">Supabase</span>
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            id="nav-sound-btn"
            onClick={toggleSound}
            aria-label="Toggle sound effects"
            title={soundOn ? 'Sound Effects Enabled' : 'Sound Muted'}
            className="w-8 h-8 rounded-full border border-[#e1e6f1] bg-[#f8faff] flex items-center justify-center text-[#10246f] hover:bg-[#eff6ff] transition-colors cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-[#16c47f]" /> : <VolumeX className="w-4 h-4 text-[#59627a]" />}
          </button>

          {/* Log In Pill Button */}
          <button
            id="nav-login-btn"
            onClick={() => onOpenAuthModal ? onOpenAuthModal({ screen: 'signin' }) : onNavigateView('home')}
            className="px-4 py-2 rounded-full border border-[#e1e6f1] text-[#10246f] font-bold text-xs sm:text-sm hover:bg-[#f8faff] transition-all cursor-pointer"
          >
            Log In
          </button>

          {/* Get Started / Sign Up CTA Yellow Button */}
          <button
            id="nav-signup-btn"
            onClick={() => onOpenAuthModal ? onOpenAuthModal({ screen: 'register' }) : onNavigateView('home')}
            className="px-5 py-2.5 rounded-full bg-[#ffbf32] hover:bg-[#f59e0b] text-[#10246f] font-black text-xs sm:text-sm shadow-xs transition-all transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            Get Started
          </button>

          {/* Current User & Role Selector Dropdown */}
          <div className="relative">
            <button
              id="role-switch-dropdown-btn"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full border border-[#e1e6f1] bg-[#f8faff] hover:bg-white transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#fffbeb] border border-[#ffbf32]/40 flex items-center justify-center text-base">
                {currentUser.avatar}
              </div>
            </button>

            {/* Dropdown Menu for Role Switching */}
            {roleDropdownOpen && (
              <div 
                id="role-switch-menu"
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-[#e1e6f1] shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-[#e1e6f1] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#59627a]">
                    Switch Active Persona
                  </span>
                  <span className="text-[10px] text-[#59627a] font-medium">
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
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                          isCurrent ? 'bg-[#eff6ff] border border-[#1a56db]/30' : 'hover:bg-[#f8faff]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl w-7 h-7 rounded-lg bg-white border border-[#e1e6f1] flex items-center justify-center shrink-0">
                            {user.avatar}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-[#10246f] truncate">
                              {user.name}
                            </span>
                            <span className="block text-[11px] text-[#59627a] truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-[#e1e6f1] flex items-center justify-between px-2">
                  <button
                    id="open-login-dialog-btn"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="text-xs font-semibold text-[#59627a] hover:text-[#10246f] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[#f8faff] cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#1a56db]" />
                    <span>Credential Login</span>
                  </button>
                  <button
                    id="simulate-logout-btn"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="text-xs text-[#f43f5e] hover:text-[#EE5752] flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-[#fff1f2] cursor-pointer"
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
