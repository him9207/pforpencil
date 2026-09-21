import React, { useState } from 'react';
import { UserAccount, UserRole, GradeLevel, StudentProgress, CurriculumGrade } from '../../types';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  X, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  School,
  Heart,
  Globe,
  Building2,
  BookOpen,
  UserPlus,
  LogIn,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { generateAccountId, generateSchoolCode } from '../../utils/idAndUsernameGenerator';
import { 
  COUNTRY_FLAG_MAP, 
  COUNTRY_STATE_MAP, 
  COUNTRY_CURRICULUM_MAP 
} from '../../data/curriculumData';
import { fetchUsersFromSupabase, isSupabaseConfigured } from '../../database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterUser?: (user: UserAccount, progress?: StudentProgress) => void;
  allUsers: UserAccount[];
  initialScreen?: 'signin' | 'register';
  initialRole?: UserRole;
  grades?: CurriculumGrade[];
  country?: string;
  state?: string;
  curriculum?: string;
  onOpenRegionModal?: () => void;
  onSaveRegion?: (country: string, state: string, curriculum: string, grade?: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterUser,
  allUsers,
  initialScreen = 'signin',
  initialRole = 'parent',
  grades = [],
  country = 'Australia',
  state = 'NSW',
  curriculum = 'Australian Curriculum (ACARA)',
  onOpenRegionModal,
  onSaveRegion
}: AuthModalProps) {
  // Main view: 'signin' or 'register'
  const [activeScreen, setActiveScreen] = useState<'signin' | 'register'>(initialScreen);
  const [authMode, setAuthMode] = useState<'student' | 'adult'>('student');

  // Active region state synchronized with Home Page & platform
  const [selectedCountry, setSelectedCountry] = useState<string>(country);
  const [selectedState, setSelectedState] = useState<string>(state);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>(curriculum);
  const [isEditingRegion, setIsEditingRegion] = useState<boolean>(false);

  React.useEffect(() => {
    setSelectedCountry(country);
    setSelectedState(state);
    setSelectedCurriculum(curriculum);
  }, [country, state, curriculum, isOpen]);

  const handleCountryChange = (newC: string) => {
    setSelectedCountry(newC);
    const nextStates = COUNTRY_STATE_MAP[newC] || ['All Regions'];
    const nextS = nextStates[0] || '';
    setSelectedState(nextS);
    const nextCur = COUNTRY_CURRICULUM_MAP[newC]?.[0] || 'Universal Foundational';
    setSelectedCurriculum(nextCur);
    onSaveRegion?.(newC, nextS, nextCur);
  };

  const handleStateChange = (newS: string) => {
    setSelectedState(newS);
    onSaveRegion?.(selectedCountry, newS, selectedCurriculum);
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveScreen(initialScreen);
      if (initialRole) {
        setRegRole(initialRole === 'school' ? 'school' : 'parent');
        if (initialRole === 'student') {
          setAuthMode('student');
        } else {
          setAuthMode('adult');
        }
      }
    }
  }, [isOpen, initialScreen, initialRole]);
  
  // Student Sign-In form state
  const [studentUsername, setStudentUsername] = useState('EMMWAT1');
  const [studentPin, setStudentPin] = useState('1234');
  const [studentError, setStudentError] = useState('');

  // Adult Sign-In form state
  const [adultEmail, setAdultEmail] = useState('david.watson@gmail.com');
  const [adultPassword, setAdultPassword] = useState('••••••••');
  const [adultError, setAdultError] = useState('');

  // ----------------------------------------------------
  // Registration Form State (Inherits Regional Context from Platform)
  // ----------------------------------------------------
  const [regRole, setRegRole] = useState<'parent' | 'school'>(initialRole === 'school' ? 'school' : 'parent');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('password123');
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  if (!isOpen) return null;

  const [isVerifying, setIsVerifying] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    let targetUser = allUsers.find(
      (u) => u.role === 'student' && 
             u.username?.toUpperCase() === studentUsername.trim().toUpperCase() &&
             u.pin === studentPin.trim()
    );

    // If not found in current memory state and Supabase is configured, fetch live from database
    if (!targetUser && isSupabaseConfigured()) {
      setIsVerifying(true);
      try {
        const result = await fetchUsersFromSupabase();
        if (result.success && Array.isArray(result.users)) {
          targetUser = result.users.find(
            (u) => u.role === 'student' && 
                   u.username?.toUpperCase() === studentUsername.trim().toUpperCase() &&
                   u.pin === studentPin.trim()
          );
          if (targetUser && onRegisterUser) {
            onRegisterUser(targetUser);
          }
        }
      } catch (err) {
        console.warn('Live student auth verification error:', err);
      } finally {
        setIsVerifying(false);
      }
    }

    if (targetUser) {
      sounds.playCorrect();
      onLoginSuccess(targetUser);
      onClose();
    } else {
      sounds.playWrong();
      setStudentError('Invalid Username or 4-digit PIN! Try EMMWAT1 (PIN: 1234) or HAM0001 (PIN: 5678)');
    }
  };

  const handleAdultLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdultError('');

    let targetUser = allUsers.find(
      (u) => u.role !== 'student' && (
        u.email?.toLowerCase() === adultEmail.trim().toLowerCase() ||
        u.username?.toLowerCase() === adultEmail.trim().toLowerCase()
      )
    );

    // If not found in current memory state and Supabase is configured, fetch live from database
    if (!targetUser && isSupabaseConfigured()) {
      setIsVerifying(true);
      try {
        const result = await fetchUsersFromSupabase();
        if (result.success && Array.isArray(result.users)) {
          targetUser = result.users.find(
            (u) => u.role !== 'student' && (
              u.email?.toLowerCase() === adultEmail.trim().toLowerCase() ||
              u.username?.toLowerCase() === adultEmail.trim().toLowerCase()
            )
          );
          if (targetUser && onRegisterUser) {
            onRegisterUser(targetUser);
          }
        }
      } catch (err) {
        console.warn('Live adult auth verification error:', err);
      } finally {
        setIsVerifying(false);
      }
    }

    if (targetUser) {
      sounds.playCorrect();
      onLoginSuccess(targetUser);
      onClose();
    } else {
      sounds.playWrong();
      setAdultError('No account found with that email. Pick a pre-configured demo account below.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please provide your full name.');
      return;
    }

    if (!regEmail.trim()) {
      setRegError('Please enter a valid email address.');
      return;
    }

    if (regRole === 'school' && !regSchoolName.trim()) {
      setRegError('Please provide your official school or institution name.');
      return;
    }

    const newId = generateAccountId(regRole, allUsers);
    const now = new Date().toISOString().split('T')[0];

    const finalSchoolName = regRole === 'school' ? regSchoolName.trim() : undefined;
    const schoolCode = regRole === 'school' ? generateSchoolCode(finalSchoolName || 'School', allUsers) : undefined;

    const newUser: UserAccount = {
      id: newId,
      role: regRole,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      avatar: regRole === 'parent' ? '👨‍👧‍👦' : '🏫',
      country: selectedCountry,
      state: selectedState,
      curriculum: selectedCurriculum,
      schoolName: finalSchoolName,
      schoolCode: schoolCode,
      organizationId: regRole === 'school' ? newId : undefined,
      enrolledAt: now,
      status: 'active'
    };

    sounds.playHappyCelebration();
    setRegSuccess(`Account created successfully for ${newUser.name}!`);
    
    if (onRegisterUser) {
      onRegisterUser(newUser);
    }

    setTimeout(() => {
      onLoginSuccess(newUser);
      onClose();
    }, 1000);
  };

  const selectDemoAccount = (user: UserAccount) => {
    sounds.playCorrect();
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="auth-modal-card"
        className="bg-white rounded-3xl border-2 border-[#e1e6f1] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header - P for Pencil Brand Theme */}
        <div className="p-6 border-b border-[#e1e6f1] flex items-center justify-between bg-[#f8faff] shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/pforpencil-logo.png" 
              alt="P for Pencil" 
              className="h-8 w-auto object-contain"
              onError={(e) => { e.currentTarget.src = '/assets/pforpencil-logo.svg'; }}
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#eef4ff] text-[#10246f] text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3 text-[#f20b86]" />
                <span>Portal Access</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#10246f]">
                {activeScreen === 'signin' ? 'Sign In to P for Pencil' : 'Create Free Account'}
              </h2>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#e1e6f1] text-[#59627a] hover:text-[#10246f] hover:bg-[#f8faff] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Screen Switcher (Sign In vs Register) */}
        <div className="px-6 pt-4 shrink-0 flex gap-2 border-b border-[#e1e6f1] pb-3 bg-white">
          <button
            id="auth-tab-signin"
            type="button"
            onClick={() => setActiveScreen('signin')}
            className={`flex-1 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeScreen === 'signin'
                ? 'bg-[#10246f] text-white shadow-xs'
                : 'bg-[#f8faff] text-[#59627a] hover:bg-[#eef4ff]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            id="auth-tab-register"
            type="button"
            onClick={() => setActiveScreen('register')}
            className={`flex-1 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeScreen === 'register'
                ? 'bg-[#f20b86] text-white shadow-xs font-bold'
                : 'bg-[#f8faff] text-[#59627a] border border-[#e1e6f1] hover:bg-[#fdf2f8]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#f20b86]" />
            <span>Register (Parent / School)</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto">
          {activeScreen === 'register' ? (
            /* ========================================================================= */
            /* REGISTRATION SCREEN (Clean Parent / School with inherited Region) */
            /* ========================================================================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Inherited Region Summary Banner - mapped directly with home page & platform */}
              <div className="bg-[#f8faff] border border-[#d7def0] rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#d7def0] shadow-xs flex items-center justify-center text-xl shrink-0">
                      <span>{COUNTRY_FLAG_MAP[selectedCountry] || '🌐'}</span>
                    </div>
                    <div className="truncate">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#59627a] flex items-center gap-1">
                        <span>Enrolling under active region:</span>
                      </div>
                      <div className="font-extrabold text-[#10246f] text-xs sm:text-sm flex items-center gap-1.5 truncate">
                        <span>{COUNTRY_FLAG_MAP[selectedCountry] || '🌐'}</span>
                        <span>{selectedCountry}</span>
                        <span className="text-[#a0aec0]">•</span>
                        <span>{selectedState}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#f20b86] truncate">
                        {selectedCurriculum}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditingRegion(!isEditingRegion)}
                      className="px-3 py-1.5 rounded-full border border-[#bfcbe8] bg-white hover:bg-[#eef4ff] text-[#10246f] font-bold text-[11px] shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95"
                      title="Select Country or State"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-[#f20b86]" />
                      <span>{isEditingRegion ? 'Done' : 'Change'}</span>
                    </button>
                    {onOpenRegionModal && (
                      <button
                        type="button"
                        onClick={onOpenRegionModal}
                        className="p-1.5 rounded-full border border-[#bfcbe8] bg-white hover:bg-[#eef4ff] text-[#59627a] hover:text-[#10246f] text-[11px] transition-all cursor-pointer shadow-xs"
                        title="Open Advanced Curriculum Frameworks"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Region & Country Selector mapped with Home Page */}
                {isEditingRegion && (
                  <div className="pt-2.5 border-t border-[#e1e6f1] grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-[#59627a] uppercase mb-1">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCountry}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full pl-8 pr-7 py-2 rounded-xl bg-white border border-[#bfcbe8] text-xs font-bold text-[#10246f] appearance-none cursor-pointer focus:outline-none focus:border-[#f20b86]"
                        >
                          {Object.keys(COUNTRY_STATE_MAP).map((c) => (
                            <option key={c} value={c}>
                              {COUNTRY_FLAG_MAP[c] || '🌐'} {c}
                            </option>
                          ))}
                        </select>
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-base">
                          {COUNTRY_FLAG_MAP[selectedCountry] || '🌐'}
                        </span>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#59627a] text-[10px]">
                          ▼
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#59627a] uppercase mb-1">
                        State / Region
                      </label>
                      <div className="relative">
                        <select
                          value={selectedState}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full px-3 pr-7 py-2 rounded-xl bg-white border border-[#bfcbe8] text-xs font-bold text-[#10246f] appearance-none cursor-pointer focus:outline-none focus:border-[#f20b86]"
                        >
                          {(COUNTRY_STATE_MAP[selectedCountry] || ['All Regions']).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#59627a] text-[10px]">
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* 1. Select User Role (Parent or School only) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Choose Account Type
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
                  <button
                    type="button"
                    id="register-role-parent"
                    onClick={() => {
                      sounds.click();
                      setRegRole('parent');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      regRole === 'parent'
                        ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Parent Account</span>
                  </button>

                  <button
                    type="button"
                    id="register-role-school"
                    onClick={() => {
                      sounds.click();
                      setRegRole('school');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      regRole === 'school'
                        ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>School / Campus</span>
                  </button>
                </div>
              </div>

              {/* School Name Field (Only for School) */}
              {regRole === 'school' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official School / Institution Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regSchoolName}
                      onChange={(e) => setRegSchoolName(e.target.value)}
                      placeholder="e.g. Greenwood Academy of Excellence"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-slate-50/50"
                    />
                  </div>
                </div>
              )}

              {/* Administrator / Parent Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {regRole === 'school' ? 'School Administrator Name' : 'Parent / Guardian Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={regRole === 'school' ? 'Principal Jonathan Hayes' : 'David Watson'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {regRole === 'school' ? 'School Official Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={regRole === 'school' ? 'admin@greenwood.edu' : 'david.watson@gmail.com'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Helper Notice for Teachers & Students */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 font-medium">
                💡 <strong>Note:</strong> Teacher and student accounts are created and managed directly inside your School or Parent dashboard.
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                className="w-full py-3.5 px-4 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#f20b86]/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>Complete Registration & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ========================================================================= */
            /* SIGN IN SCREEN */
            /* ========================================================================= */
            <div>
              {/* Tab switch: Student vs Adult */}
              <div className="p-1.5 bg-slate-100 rounded-2xl flex gap-2 mb-4">
                <button
                  id="tab-student-login"
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setAuthMode('student');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMode === 'student'
                      ? 'bg-white text-blue-950 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Student (PIN)</span>
                </button>

                <button
                  id="tab-adult-login"
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setAuthMode('adult');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMode === 'adult'
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span>Adult (Email)</span>
                </button>
              </div>

              {authMode === 'student' ? (
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-950 flex items-center gap-2.5">
                    <span className="text-xl">🎒</span>
                    <span>
                      Kids log in securely with their <strong>Username</strong> (e.g. <code>EMMWAT1</code>, <code>HAM0001</code>) and <strong>4-digit Secret PIN</strong>!
                    </span>
                  </div>

                  {studentError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                      {studentError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student Username
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="student-username-input"
                        type="text"
                        required
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="e.g. EMMWAT1, HAM0001"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-mono uppercase transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      4-Digit Student PIN
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="student-pin-input"
                        type="password"
                        maxLength={4}
                        required
                        value={studentPin}
                        onChange={(e) => setStudentPin(e.target.value)}
                        placeholder="1234"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm tracking-widest font-mono transition-all"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-student-login"
                    type="submit"
                    className="w-full py-3 px-4 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold text-sm shadow-md shadow-[#f20b86]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Enter Kid Learning Adventure</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAdultLogin} className="space-y-4">
                  <div className="bg-[#f8faff] border border-[#e1e6f1] rounded-2xl p-3 text-xs text-[#10246f] flex items-center gap-2.5">
                    <span className="text-xl">🔐</span>
                    <span>
                      Parents, Teachers, School Admins, and Content Managers log in via verified <strong>Email + Password</strong>.
                    </span>
                  </div>

                  {adultError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                      {adultError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="adult-email-input"
                        type="text"
                        required
                        value={adultEmail}
                        onChange={(e) => setAdultEmail(e.target.value)}
                        placeholder="david.watson@gmail.com or admin@oakwood.edu"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#10246f] focus:ring-2 focus:ring-[#10246f]/20 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="adult-password-input"
                        type="password"
                        required
                        value={adultPassword}
                        onChange={(e) => setAdultPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#10246f] focus:ring-2 focus:ring-[#10246f]/20 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-adult-login"
                    type="submit"
                    className="w-full py-3 px-4 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Access Management Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Instant 1-Click Demo Accounts with Regional Metadata */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Instant 1-Click Sandbox Logins:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'STU00001');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>🦊</span>
                    <div className="truncate">
                      <strong className="block text-xs">Emma (Grade 1)</strong>
                      <span className="text-[10px] text-blue-600 font-mono">EMMWAT1 • 1234</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'STU00003') || allUsers.find(x => x.role === 'student');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>🐣</span>
                    <div className="truncate">
                      <strong className="block text-xs">Leo (Preschool)</strong>
                      <span className="text-[10px] text-amber-700 font-mono">LEOWAT1 • 1234</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'PAR00001');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <div className="truncate">
                      <strong className="block text-xs">Parent (David Watson)</strong>
                      <span className="text-[10px] text-rose-600">{country} • {state}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'SCH000001');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <School className="w-3.5 h-3.5 text-blue-600" />
                    <div className="truncate">
                      <strong className="block text-xs">School (Oakwood)</strong>
                      <span className="text-[10px] text-blue-700">Campus Admin</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'TEA00001');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <div className="truncate">
                      <strong className="block text-xs">Teacher (Mrs. Jenkins)</strong>
                      <span className="text-[10px] text-emerald-700">Grade 1 Class</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'ADM000001');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                    <div className="truncate">
                      <strong className="block text-xs">Super Admin</strong>
                      <span className="text-[10px] text-slate-700">Global Overlook</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
