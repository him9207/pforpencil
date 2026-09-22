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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-2xs">
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
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-stone-700">
            <button
              id="nav-tab-home"
              onClick={() => onNavigateView('home')}
              className={`relative py-2 transition-colors cursor-pointer ${
                currentView === 'home' ? 'text-[#10246f] font-black' : 'text-[#59627a] hover:text-[#10246f]'
              }`}
            >
              <span>Home</span>
              {currentView === 'home' && (
                <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-[#10246f]" />
              )}
            </button>

            <button
              onClick={() => onNavigateView('home')}
              className="text-[#59627a] hover:text-[#10246f] transition-colors cursor-pointer"
            >
              About
            </button>

            <button
              onClick={() => onNavigateView('home')}
              className="text-[#59627a] hover:text-[#10246f] transition-colors cursor-pointer"
            >
              Math
            </button>

            <button
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'parent' })}
              className="text-[#59627a] hover:text-[#10246f] transition-colors cursor-pointer"
            >
              For Parents
            </button>

            <button
              onClick={() => onOpenAuthModal({ screen: 'register', role: 'school' })}
              className="text-[#59627a] hover:text-[#10246f] transition-colors cursor-pointer"
            >
              For Schools
            </button>

            <button
              onClick={onOpenPricingModal}
              className="text-[#59627a] hover:text-[#10246f] transition-colors cursor-pointer"
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
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full bg-[#f8faff] text-[#10246f] border border-[#e1e6f1] hover:bg-[#eef4ff] transition-colors cursor-pointer shadow-2xs"
            >
              <span className="text-sm">
                {currentUser.country === 'India' ? '🇮🇳' : currentUser.country === 'United Kingdom' ? '🇬🇧' : currentUser.country === 'Canada' ? '🇨🇦' : currentUser.country === 'Australia' ? '🇦🇺' : '🇺🇸'}
              </span>
              <span className="font-semibold">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-[#f8faff] text-[#10246f] border border-[#d7def0] hover:bg-[#eef4ff] hover:border-[#10246f] transition-all cursor-pointer shadow-2xs group"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Supabase</span>
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            id="nav-sound-btn"
            onClick={toggleSound}
            aria-label="Toggle sound effects"
            title={soundOn ? 'Sound Effects Enabled' : 'Sound Muted'}
            className="w-8 h-8 rounded-full border border-[#e1e6f1] bg-[#f8faff] flex items-center justify-center text-[#10246f] hover:bg-[#eef4ff] transition-colors cursor-pointer"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-[#16c47f]" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>

          {/* Log In Pill Button */}
          <button
            id="nav-login-btn"
            onClick={() => onOpenAuthModal ? onOpenAuthModal({ screen: 'signin' }) : onNavigateView('home')}
            className="px-5 py-2 rounded-full border-2 border-[#10246f] text-[#10246f] font-bold text-xs sm:text-sm hover:bg-[#10246f] hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            Log In
          </button>

          {/* Sign Up Crisp Primary Button */}
          <button
            id="nav-signup-btn"
            onClick={() => onOpenAuthModal ? onOpenAuthModal({ screen: 'register' }) : onNavigateView('home')}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            Sign Up Free
          </button>

          {/* Current User & Role Selector Dropdown */}
          <div className="relative">
            <button
              id="role-switch-dropdown-btn"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full border border-stone-200 bg-stone-50 hover:bg-white transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-base">
                {currentUser.avatar}
              </div>
            </button>

            {/* Dropdown Menu for Role Switching */}
            {roleDropdownOpen && (
              <div 
                id="role-switch-menu"
                className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-stone-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Switch Active Persona
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">
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
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-50 border border-amber-300 text-stone-950 font-medium'
                            : 'hover:bg-stone-50 text-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                            {user.avatar}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-stone-900">
                                {user.name}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${getRoleBadgeColor(user.role)}`}>
                                {getRoleLabel(user.role)}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 font-mono">
                              ID: {user.id} {user.username && `• @${user.username}`}
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
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
                    className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-stone-100 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Credential Login</span>
                  </button>
                  <button
                    id="simulate-logout-btn"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-rose-50 cursor-pointer"
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
