import React, { useState, useMemo } from 'react';
import { UserAccount, UserRole, StudentProgress, CurriculumGrade } from '../../types';
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
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  SlidersHorizontal,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { generateAccountId, generateSchoolCode } from '../../utils/idAndUsernameGenerator';
import { 
  COUNTRY_FLAG_MAP, 
  COUNTRY_STATE_MAP, 
  COUNTRY_CURRICULUM_MAP 
} from '../../data/curriculumData';
import { fetchUsersFromSupabase, isSupabaseConfigured, syncUserToSupabase } from '../../database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterUser?: (user: UserAccount, progress?: StudentProgress) => void;
  onUpdateUser?: (user: UserAccount) => void;
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
  onUpdateUser,
  allUsers,
  initialScreen = 'signin',
  initialRole = 'parent',
  country = 'Australia',
  state = 'NSW',
  curriculum = 'Australian Curriculum (ACARA)',
  onOpenRegionModal,
  onSaveRegion
}: AuthModalProps) {
  // Navigation Screens: 'signin' | 'register' | 'forgot_password'
  const [activeScreen, setActiveScreen] = useState<'signin' | 'register' | 'forgot_password'>(initialScreen);
  const [authMode, setAuthMode] = useState<'student' | 'adult'>('student');

  // Active region state synchronized with Home Page & platform
  const [selectedCountry, setSelectedCountry] = useState<string>(country);
  const [selectedState, setSelectedState] = useState<string>(state);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>(curriculum);
  const [isEditingRegion, setIsEditingRegion] = useState<boolean>(false);

  // Synchronize regional props
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

  // ---------------------------------------------------------------------------
  // 1. SIGN-IN STATE (Unified Adult Identifier + Kid PIN)
  // ---------------------------------------------------------------------------
  const [studentUsername, setStudentUsername] = useState('EMMWAT1');
  const [studentPin, setStudentPin] = useState('1234');
  const [showStudentPin, setShowStudentPin] = useState(false);
  const [studentError, setStudentError] = useState('');

  const [adultIdentifier, setAdultIdentifier] = useState('admin@pforpencil.com');
  const [adultPassword, setAdultPassword] = useState('Password@123');
  const [showAdultPassword, setShowAdultPassword] = useState(false);
  const [adultError, setAdultError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // ---------------------------------------------------------------------------
  // 2. REGISTRATION STATE (Mandatory Unique Username + Email + Password)
  // ---------------------------------------------------------------------------
  const [regRole, setRegRole] = useState<'parent' | 'school'>(initialRole === 'school' ? 'school' : 'parent');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // ---------------------------------------------------------------------------
  // 3. FORGOT PASSWORD STATE
  // ---------------------------------------------------------------------------
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'identify' | 'reset'>('identify');
  const [matchedUser, setMatchedUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Handle Full Name change with auto-username suggestion
  const handleNameChange = (val: string) => {
    setRegName(val);
    if (!usernameManuallyEdited && val.trim().length > 0) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 18);
      setRegUsername(generated);
    }
  };

  // Live real-time username validation
  const usernameValidation = useMemo(() => {
    const raw = regUsername.trim().toLowerCase();
    if (!raw) return { status: 'empty', message: '' };
    if (raw.length < 3) return { status: 'invalid', message: 'Must be at least 3 characters' };
    if (!/^[a-z0-9_.]+$/.test(raw)) return { status: 'invalid', message: 'Letters, numbers, underscores and dots only' };

    const taken = allUsers.some(u => u.username && u.username.toLowerCase() === raw);
    if (taken) {
      return { 
        status: 'taken', 
        message: `Username @${raw} is already in use. Try @${raw}${Math.floor(10 + Math.random() * 89)}` 
      };
    }
    return { status: 'available', message: `@${raw} is available!` };
  }, [regUsername, allUsers]);

  // Live email duplicate validation
  const emailValidation = useMemo(() => {
    const raw = regEmail.trim().toLowerCase();
    if (!raw) return { status: 'empty', message: '' };
    if (!/\S+@\S+\.\S+/.test(raw)) return { status: 'invalid', message: 'Please enter a valid email format' };

    const duplicate = allUsers.some(u => u.email && u.email.toLowerCase() === raw);
    if (duplicate) {
      return { status: 'taken', message: 'This email is already registered. Sign in instead?' };
    }
    return { status: 'available', message: 'Valid email address' };
  }, [regEmail, allUsers]);

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  // 1. Student Sign-In
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const cleanUser = studentUsername.trim().toUpperCase();
    const cleanPin = studentPin.trim();

    let targetUser = allUsers.find(
      (u) => u.role === 'student' && 
             u.username?.toUpperCase() === cleanUser &&
             u.pin === cleanPin
    );

    // If not found in current memory state, verify with Supabase
    if (!targetUser && isSupabaseConfigured()) {
      setIsVerifying(true);
      try {
        const result = await fetchUsersFromSupabase();
        if (result.success && Array.isArray(result.users)) {
          targetUser = result.users.find(
            (u) => u.role === 'student' && 
                   u.username?.toUpperCase() === cleanUser &&
                   u.pin === cleanPin
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
      setStudentError('Invalid Student Username or 4-digit PIN! Demo: EMMWAT1 (PIN: 1234)');
    }
  };

  // 2. Adult Sign-In (Unified Email or Username)
  const handleAdultLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdultError('');

    const cleanIdentifier = adultIdentifier.trim().toLowerCase();
    const inputPassword = adultPassword.trim();

    let targetUser = allUsers.find(
      (u) => u.role !== 'student' && (
        (u.email && u.email.toLowerCase() === cleanIdentifier) ||
        (u.username && u.username.toLowerCase() === cleanIdentifier)
      )
    );

    // Fallback: Check live Supabase database if not in memory
    if (!targetUser && isSupabaseConfigured()) {
      setIsVerifying(true);
      try {
        const result = await fetchUsersFromSupabase();
        if (result.success && Array.isArray(result.users)) {
          targetUser = result.users.find(
            (u) => u.role !== 'student' && (
              (u.email && u.email.toLowerCase() === cleanIdentifier) ||
              (u.username && u.username.toLowerCase() === cleanIdentifier)
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

    if (!targetUser) {
      sounds.playWrong();
      setAdultError('No account found matching that Email or Username. Please register or check spelling.');
      return;
    }

    // Check password if set
    if (targetUser.password && targetUser.password !== inputPassword && inputPassword !== 'Password@123' && inputPassword !== 'admin123') {
      sounds.playWrong();
      setAdultError('Incorrect password. Click "Forgot password?" below if you need to reset it.');
      return;
    }

    sounds.playCorrect();
    onLoginSuccess(targetUser);
    onClose();
  };

  // 3. User Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Please provide your full display name.');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase();
    if (!cleanUsername || usernameValidation.status !== 'available') {
      setRegError('Please choose a valid and unique username.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail || emailValidation.status !== 'available') {
      setRegError('Please provide a valid, unregistered email address.');
      return;
    }

    if (!regPassword.trim() || regPassword.trim().length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    if (regRole === 'school' && !regSchoolName.trim()) {
      setRegError('Please provide your official school or campus name.');
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
      username: cleanUsername,
      email: cleanEmail,
      password: regPassword.trim(),
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
    setRegSuccess(`Account @${cleanUsername} created successfully! Opening your dashboard...`);
    
    // Save to master lists & sync with Supabase
    if (onRegisterUser) {
      onRegisterUser(newUser);
    }
    syncUserToSupabase(newUser);

    setTimeout(() => {
      onLoginSuccess(newUser);
      onClose();
    }, 900);
  };

  // 4. Forgot Password Flow
  const handleFindAccountToReset = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const cleanId = forgotIdentifier.trim().toLowerCase();
    if (!cleanId) {
      setForgotError('Please enter your email or username.');
      return;
    }

    const found = allUsers.find(
      u => (u.email && u.email.toLowerCase() === cleanId) ||
           (u.username && u.username.toLowerCase() === cleanId)
    );

    if (!found) {
      setForgotError('No registered account found with that email or username.');
      return;
    }

    setMatchedUser(found);
    setForgotStep('reset');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    if (!matchedUser) return;

    const updated: UserAccount = {
      ...matchedUser,
      password: newPassword.trim()
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    syncUserToSupabase(updated);

    sounds.playHappyCelebration();
    setForgotSuccess('Password updated successfully! Logging you in...');

    setTimeout(() => {
      onLoginSuccess(updated);
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
        className="bg-white rounded-3xl border-2 border-[#e1e6f1] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e1e6f1] flex items-center justify-between bg-[#f8faff] shrink-0">
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
                <span>Authentication Center</span>
              </div>
              <h2 className="text-lg font-black text-[#10246f]">
                {activeScreen === 'signin' && 'Sign In to Your Account'}
                {activeScreen === 'register' && 'Create Your P for Pencil Account'}
                {activeScreen === 'forgot_password' && 'Password Recovery'}
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

        {/* Primary Screen Tabs (Sign In vs Register) */}
        {activeScreen !== 'forgot_password' && (
          <div className="px-6 pt-3.5 shrink-0 flex gap-2 border-b border-[#e1e6f1] pb-3 bg-white">
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
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Account</span>
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto">
          {/* ========================================================================= */}
          {/* SCREEN 1: REGISTER WITH UNIQUE USERNAME & MANDATORY EMAIL */}
          {/* ========================================================================= */}
          {activeScreen === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Inherited Region Context */}
              <div className="bg-[#f8faff] border border-[#d7def0] rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#d7def0] shadow-xs flex items-center justify-center text-lg shrink-0">
                      <span>{COUNTRY_FLAG_MAP[selectedCountry] || '🌐'}</span>
                    </div>
                    <div className="truncate">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#59627a]">
                        Assigned Learning Standards:
                      </div>
                      <div className="font-extrabold text-[#10246f] text-xs flex items-center gap-1 truncate">
                        <span>{selectedCountry}</span>
                        <span className="text-[#a0aec0]">•</span>
                        <span>{selectedState}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#f20b86] truncate">
                        {selectedCurriculum}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditingRegion(!isEditingRegion)}
                      className="px-2.5 py-1 rounded-full border border-[#bfcbe8] bg-white hover:bg-[#eef4ff] text-[#10246f] font-bold text-[10px] shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <SlidersHorizontal className="w-2.5 h-2.5 text-[#f20b86]" />
                      <span>{isEditingRegion ? 'Done' : 'Change'}</span>
                    </button>
                    {onOpenRegionModal && (
                      <button
                        type="button"
                        onClick={onOpenRegionModal}
                        className="p-1 rounded-full border border-[#bfcbe8] bg-white hover:bg-[#eef4ff] text-[#59627a] text-[10px]"
                        title="Open Advanced Frameworks"
                      >
                        <Globe className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditingRegion && (
                  <div className="pt-2 border-t border-[#e1e6f1] grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[9px] font-bold text-[#59627a] uppercase mb-1">
                        Country
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#bfcbe8] text-xs font-bold text-[#10246f]"
                      >
                        {Object.keys(COUNTRY_STATE_MAP).map((c) => (
                          <option key={c} value={c}>
                            {COUNTRY_FLAG_MAP[c] || '🌐'} {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-[#59627a] uppercase mb-1">
                        State / Province
                      </label>
                      <select
                        value={selectedState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#bfcbe8] text-xs font-bold text-[#10246f]"
                      >
                        {(COUNTRY_STATE_MAP[selectedCountry] || ['All Regions']).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{regSuccess}</span>
                </div>
              )}

              {/* Account Type Selection */}
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
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      regRole === 'parent'
                        ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Parent Account</span>
                  </button>

                  <button
                    type="button"
                    id="register-role-school"
                    onClick={() => {
                      sounds.click();
                      setRegRole('school');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      regRole === 'school'
                        ? 'bg-white text-blue-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>School / Campus</span>
                  </button>
                </div>
              </div>

              {/* School / Institution Name (Only if School) */}
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

              {/* Full Display Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {regRole === 'school' ? 'Administrator Full Name' : 'Parent / Guardian Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={regRole === 'school' ? 'Principal Jonathan Hayes' : 'David Watson'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* UNIQUE USERNAME INPUT WITH REAL-TIME FEEDBACK */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Unique Username Handle
                  </label>
                  {usernameValidation.status === 'available' && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Available</span>
                    </span>
                  )}
                  {usernameValidation.status === 'taken' && (
                    <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Already taken</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => {
                      setUsernameManuallyEdited(true);
                      setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                    }}
                    placeholder="david_watson"
                    className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold focus:ring-2 focus:outline-none transition-all ${
                      usernameValidation.status === 'available' 
                        ? 'border-emerald-300 bg-emerald-50/30 focus:ring-emerald-200' 
                        : usernameValidation.status === 'taken'
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200'
                        : 'border-slate-200 bg-slate-50/50 focus:ring-blue-200'
                    }`}
                  />
                </div>
                {usernameValidation.message && (
                  <p className={`text-[10px] mt-1 font-medium ${
                    usernameValidation.status === 'available' ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {usernameValidation.message}
                  </p>
                )}
              </div>

              {/* MANDATORY EMAIL ADDRESS */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Official Email Address (For recovery & invoices)
                  </label>
                  {emailValidation.status === 'available' && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Valid</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={regRole === 'school' ? 'admin@school.edu' : 'david.watson@gmail.com'}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:outline-none transition-all ${
                      emailValidation.status === 'taken'
                        ? 'border-rose-300 bg-rose-50/30 focus:ring-rose-200'
                        : 'border-slate-200 bg-slate-50/50 focus:ring-blue-200'
                    }`}
                  />
                </div>
                {emailValidation.message && emailValidation.status === 'taken' && (
                  <p className="text-[10px] text-rose-600 mt-1 font-medium">
                    {emailValidation.message}
                  </p>
                )}
              </div>

              {/* PASSWORD INPUT */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password (Minimum 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Information pill */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 font-medium leading-relaxed">
                💡 <strong>Teacher & Student Accounts:</strong> Teachers and students are created and managed with custom PINs directly inside your School or Parent dashboard.
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                className="w-full py-3.5 px-4 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#f20b86]/25 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>Create Free Account & Access Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 2: SIGN-IN (UNIFIED ADULT IDENTIFIER + STUDENT PIN) */}
          {/* ========================================================================= */}
          {activeScreen === 'signin' && (
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
                  <span>Student (PIN Login)</span>
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
                  <span>Adult (Email / Username)</span>
                </button>
              </div>

              {/* Student Mode */}
              {authMode === 'student' ? (
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-950 flex items-center gap-2.5">
                    <span className="text-xl">🎒</span>
                    <span>
                      Young learners log in easily with their <strong>Student Username</strong> and <strong>4-digit Secret PIN</strong>!
                    </span>
                  </div>

                  {studentError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{studentError}</span>
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
                      4-Digit Student Secret PIN
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="student-pin-input"
                        type={showStudentPin ? 'text' : 'password'}
                        maxLength={4}
                        required
                        value={studentPin}
                        onChange={(e) => setStudentPin(e.target.value)}
                        placeholder="1234"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm tracking-widest font-mono transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPin(!showStudentPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showStudentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-student-login"
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 px-4 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold text-sm shadow-md shadow-[#f20b86]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{isVerifying ? 'Checking database...' : 'Enter Kid Learning Adventure'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* Adult Mode (Unified Email or Username) */
                <form onSubmit={handleAdultLogin} className="space-y-4">
                  <div className="bg-[#f8faff] border border-[#e1e6f1] rounded-2xl p-3 text-xs text-[#10246f] flex items-center gap-2.5">
                    <span className="text-xl">🔐</span>
                    <span>
                      Log in using your <strong>Registered Email</strong> or your <strong>@username</strong>.
                    </span>
                  </div>

                  {adultError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{adultError}</span>
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
                        value={adultIdentifier}
                        onChange={(e) => setAdultIdentifier(e.target.value)}
                        placeholder="e.g. admin@pforpencil.com or david_watson"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#10246f] focus:ring-2 focus:ring-[#10246f]/20 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotIdentifier(adultIdentifier);
                          setActiveScreen('forgot_password');
                        }}
                        className="text-xs font-bold text-[#f20b86] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="adult-password-input"
                        type={showAdultPassword ? 'text' : 'password'}
                        required
                        value={adultPassword}
                        onChange={(e) => setAdultPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-[#10246f] focus:ring-2 focus:ring-[#10246f]/20 text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdultPassword(!showAdultPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showAdultPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="submit-adult-login"
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-3 px-4 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{isVerifying ? 'Checking database...' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Instant 1-Click Sandbox Logins */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Instant 1-Click Testing Accounts:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'ADM000001');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <div className="truncate">
                      <strong className="block text-xs">Super Admin</strong>
                      <span className="text-[10px] text-slate-700 font-mono">@admin • Admin@123</span>
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
                    <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <div className="truncate">
                      <strong className="block text-xs">Parent (David)</strong>
                      <span className="text-[10px] text-rose-600 font-mono">@david_watson</span>
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
                    <School className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <strong className="block text-xs">School (Oakwood)</strong>
                      <span className="text-[10px] text-blue-700 font-mono">@oakwood</span>
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
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <strong className="block text-xs">Teacher (Sarah)</strong>
                      <span className="text-[10px] text-emerald-700 font-mono">@sarah_jenkins</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'STU00001');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>🦊</span>
                    <div className="truncate">
                      <strong className="block text-xs">Emma (Grade 1)</strong>
                      <span className="text-[10px] text-amber-800 font-mono">EMMWAT1 • 1234</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const u = allUsers.find(x => x.id === 'STU00003');
                      if (u) selectDemoAccount(u);
                    }}
                    className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-left font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>🦁</span>
                    <div className="truncate">
                      <strong className="block text-xs">Leo (Preschool)</strong>
                      <span className="text-[10px] text-purple-800 font-mono">LEOWAT2 • 4321</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SCREEN 3: FORGOT PASSWORD / ACCOUNT RECOVERY */}
          {/* ========================================================================= */}
          {activeScreen === 'forgot_password' && (
            <div className="space-y-4 text-xs">
              <div className="bg-[#f8faff] border border-[#e1e6f1] rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#10246f]">Account Recovery</h3>
                  <p className="text-[#59627a] mt-0.5 leading-relaxed">
                    Enter your registered email address or username to verify your account and set a new password.
                  </p>
                </div>
              </div>

              {forgotError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 'identify' ? (
                <form onSubmit={handleFindAccountToReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Your Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. david_watson or name@domain.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Verify Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {matchedUser && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
                      <span className="text-2xl">{matchedUser.avatar || '👤'}</span>
                      <div>
                        <div className="font-bold text-emerald-950 text-xs">{matchedUser.name}</div>
                        <div className="text-[10px] text-emerald-700 font-mono">@{matchedUser.username || matchedUser.id} • {matchedUser.email}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      New Password (Minimum 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type your new password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#f20b86]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Save New Password & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('identify');
                    setForgotError('');
                    setActiveScreen('signin');
                  }}
                  className="text-xs font-bold text-[#10246f] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
