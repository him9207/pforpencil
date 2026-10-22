import React, { useState } from 'react';
import PforPencilLogo from './PforPencilLogo';
import { UserAccount, UserRole } from '../types';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  LogOut, 
  Volume2, 
  VolumeX, 
  UserCheck, 
  Menu, 
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  Coins
} from 'lucide-react';
import { sounds } from '../utils/audio';
import PortalFooterBanner from './PortalFooterBanner';

export interface PortalMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface PortalShellProps {
  currentUser: UserAccount;
  allUsers?: UserAccount[];
  portalRoleTitle: string;
  portalHeaderExtra?: React.ReactNode;
  menuItems: PortalMenuItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSelectUser?: (user: UserAccount) => void;
  onOpenUserProfile?: () => void;
  onNavigateHome?: () => void;
  coins?: number;
  unreadNotifications?: number;
  footerVariant?: 'school' | 'teacher' | 'parent' | 'student';
  children: React.ReactNode;
}

export default function PortalShell({
  currentUser,
  allUsers = [],
  portalRoleTitle,
  portalHeaderExtra,
  menuItems,
  activeTab,
  onTabChange,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  onSelectUser,
  onOpenUserProfile,
  onNavigateHome,
  coins,
  unreadNotifications = 1,
  footerVariant,
  children
}: PortalShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const toggleSound = () => {
    const updated = sounds.toggleSound();
    setSoundOn(updated);
    if (updated) {
      sounds.playCorrect();
    }
  };

  // Resolve user display initial or abbreviation
  const getAvatarInitials = () => {
    if (currentUser.avatar && currentUser.avatar.length <= 3 && !currentUser.avatar.match(/[\u{1F300}-\u{1F9FF}]/u)) {
      return currentUser.avatar;
    }
    if (currentUser.name) {
      const parts = currentUser.name.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return currentUser.name.slice(0, 2).toUpperCase();
    }
    return 'P';
  };

  const getRoleDisplay = () => {
    switch (currentUser.role) {
      case 'school':
        return 'Admin';
      case 'teacher':
        return 'Teacher';
      case 'parent':
        return 'Parent';
      case 'student':
        return currentUser.grade || 'Grade 6';
      case 'content_manager':
        return 'Content Manager';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const isAvatarEmoji = currentUser.avatar && currentUser.avatar.match(/[\u{1F300}-\u{1F9FF}]/u);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="w-full px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & P for Pencil Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => onNavigateHome && onNavigateHome()}
              className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              title="Return to Home"
            >
              <PforPencilLogo size="sm" showSubtitle={false} />
            </button>
          </div>

          {/* Center: Search Bar (as shown in all mockup portals) */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-6 hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/90 rounded-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Right: Coins, Notifications, and Profile Pill Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {/* Student Coin Pill (from mockup) */}
            {typeof coins === 'number' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-[10px] text-amber-950 font-black shadow-xs">
                  🪙
                </div>
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-amber-950 font-mono">
                  {coins}
                </span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer relative"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Drawer */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                    <button 
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <div className="py-2 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
                      <span className="text-base">🎉</span>
                      <div>
                        <p className="font-bold text-slate-900">Welcome to P for Pencil!</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">Your portal dashboard is now fully active with latest learning data.</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5">
                      <span className="text-base">📅</span>
                      <div>
                        <p className="font-bold text-slate-900">Term 3, 2026 Active</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">Math curriculum standards and activities updated.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Pill (Mockup Style) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                {/* Avatar Circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs overflow-hidden shrink-0 ${
                  currentUser.role === 'teacher' || currentUser.role === 'school'
                    ? 'bg-emerald-600 text-white'
                    : currentUser.role === 'parent'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-teal-100 text-teal-900 border border-teal-300'
                }`}>
                  {isAvatarEmoji ? (
                    <span className="text-lg">{currentUser.avatar}</span>
                  ) : (
                    <span>{getAvatarInitials()}</span>
                  )}
                </div>

                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium leading-tight">
                    {getRoleDisplay()}
                  </div>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${
                  profileDropdownOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Profile Menu Popup */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email || currentUser.username}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                      {getRoleDisplay()} Portal
                    </span>
                  </div>

                  {/* Switch Demo Persona (Quick Switcher to view all 4 mockup portals) */}
                  {allUsers && allUsers.length > 0 && onSelectUser && (
                    <div className="p-2 border-b border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                        Switch Portal Role (Mockup Demos)
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {allUsers.slice(0, 8).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              sounds.click();
                              onSelectUser(u);
                              setProfileDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                              u.id === currentUser.id 
                                ? 'bg-emerald-50 text-emerald-900 font-bold' 
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{u.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize shrink-0 ml-1">
                              {u.role}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sound & Actions */}
                  <div className="p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        toggleSound();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      {soundOn ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                      <span>{soundOn ? 'Sound Effects: On' : 'Sound Effects: Off'}</span>
                    </button>

                    {onOpenUserProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenUserProfile();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>Account Profile</span>
                      </button>
                    )}

                    {onNavigateHome && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateHome();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Exit to Platform Home</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area: Left Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Desktop) */}
        <aside className="w-64 shrink-0 bg-[#fdfefe] border-r border-slate-200/80 p-4 hidden lg:flex flex-col justify-between">
          <div className="space-y-6">
            {/* Sidebar Portal Title */}
            {portalHeaderExtra ? (
              portalHeaderExtra
            ) : (
              <div className="px-3 pt-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {portalRoleTitle}
                </h2>
              </div>
            )}

            {/* Navigation Menu Items */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sounds.click();
                      onTabChange(item.id);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#e6f4ea] text-[#1e6f47]'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#1e6f47]' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-[#1e6f47] text-white' : 'bg-slate-200/80 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom subtle brand kicker */}
          <div className="px-3 py-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>P for Pencil Math</span>
            <span className="font-mono text-[10px]">v2.6</span>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white p-5 shadow-2xl flex flex-col justify-between z-10">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <PforPencilLogo size="xs" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="pt-2">
                  <h2 className="text-sm font-black text-slate-900">{portalRoleTitle}</h2>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          sounds.click();
                          onTabChange(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#e6f4ea] text-[#1e6f47]'
                            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#1e6f47]' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
                Logged in as <strong>{currentUser.name}</strong>
              </div>
            </aside>
          </div>
        )}

        {/* Content Canvas */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}

            {footerVariant && (
              <PortalFooterBanner variant={footerVariant} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
