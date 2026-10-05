import React, { useState, useEffect } from 'react';
import { UserAccount, GradeLevel, SchoolOrganization } from '../../../types';
import { X, Lock, CheckCircle2, User, ShieldAlert, Sparkles, Globe, BookOpen, Phone, School, ShieldCheck } from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { useBodyScrollLock } from '../../../utils/useBodyScrollLock';
import { COUNTRY_FLAG_MAP } from '../../../data/curriculumData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onSave: (updatedUser: UserAccount) => void;
  availableSchools?: SchoolOrganization[];
  availableGrades?: GradeLevel[];
  canEditStatus?: boolean;
  canEditGrade?: boolean;
}

const COMMON_AVATARS: Record<string, string[]> = {
  student: ['🎒', '🌟', '🚀', '🐼', '🦁', '🦊', '🦄', '🐬', '🎨', '⚽'],
  teacher: ['👩‍🏫', '👨‍🏫', '📚', '🔬', '📐', '🧠', '🌟'],
  parent: ['👨‍👧‍👦', '👩‍👧‍👦', '🏡', '🛡️', '❤️', '🌟'],
  school: ['🏫', '🏛️', '🎓', '🏢', '🌐'],
  admin: ['👑', '⚡', '🛡️', '⚙️'],
  content_manager: ['✍️', '📖', '💡', '🧩']
};

export default function EditUserProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
  availableSchools = [],
  availableGrades = ['Preschool', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  canEditStatus = true,
  canEditGrade = true
}: Props) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [grade, setGrade] = useState<GradeLevel | undefined>(undefined);
  const [schoolName, setSchoolName] = useState('');
  const [status, setStatus] = useState<'active' | 'pending' | 'suspended'>('active');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '👤');
      setGrade(user.grade);
      setSchoolName(user.schoolName || '');
      setStatus(user.status || 'active');
      setPhone(user.phone || '');
      setError('');
    }
  }, [user]);

  // Lock body scroll on mobile and desktop while modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    // Retain all immutable system credentials and registered country/region/curriculum
    const updatedUser: UserAccount = {
      ...user,
      name: name.trim(),
      avatar,
      grade: user.role === 'student' || user.role === 'teacher' ? grade : undefined,
      schoolName: schoolName.trim() || undefined,
      status: canEditStatus ? status : user.status,
      phone: phone.trim() || undefined,
      country: user.country,
      state: user.state,
      curriculum: user.curriculum
    };

    sounds.click();
    onSave(updatedUser);
    onClose();
  };

  const isStudent = user.role === 'student';
  const roleAvatars = COMMON_AVATARS[user.role] || COMMON_AVATARS.student;
  const userCountry = user.country || 'United States';
  const userState = user.state || '';
  const userCurriculum = user.curriculum || 'Universal Foundational Standards';
  const userFlag = COUNTRY_FLAG_MAP[userCountry] || '🌐';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overscroll-contain modal-scroll-container"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Clean, modern and uncluttered */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center text-2xl shrink-0">
              {avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 truncate">
                  Edit Profile Details
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-200/80 text-stone-700 tracking-wider">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                ID: <span className="font-bold text-stone-800">{user.id}</span>
                {user.email && <> • <span className="text-stone-600 font-sans">{user.email}</span></>}
                {user.username && !user.email && <> • <span className="text-stone-600 font-sans">@{user.username}</span></>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Academic Standards (Locked One-Time Registration) */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Academic Jurisdiction & Framework</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200/60">
                <Lock className="w-2.5 h-2.5" />
                <span>Fixed at Registration</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-400 block mb-0.5 uppercase tracking-wider">
                  Country & Region
                </span>
                <div className="font-bold text-stone-900 text-xs flex items-center gap-1.5 truncate">
                  <span className="text-base shrink-0">{userFlag}</span>
                  <span className="truncate">{userCountry}</span>
                  {userState && (
                    <span className="text-stone-500 font-medium text-[11px]">({userState})</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200/80">
                <span className="text-[10px] font-bold text-stone-400 block mb-0.5 uppercase tracking-wider">
                  Curriculum Standard
                </span>
                <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5 truncate" title={userCurriculum}>
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{userCurriculum}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-stone-500 leading-normal">
              🔒 Selected during initial account registration. Standards are permanently locked to guarantee continuous report card metrics and historical diagnostics.
            </p>
          </div>

          {/* Section 2: Personal Profile Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Editable Profile Details</span>
              </span>
            </div>

            {/* Display / Full Name */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Full Name / Display Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emma Watson"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                />
              </div>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Avatar Emoji
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded-2xl">
                {roleAvatars.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      sounds.click();
                      setAvatar(av);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                      avatar === av
                        ? 'bg-blue-600 text-white shadow-xs scale-105 ring-2 ring-blue-300'
                        : 'bg-white hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade Level (for Students or Teachers) */}
            {(user.role === 'student' || user.role === 'teacher') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-stone-700">
                    Grade Level
                  </label>
                  {!canEditGrade && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>
                {canEditGrade ? (
                  <select
                    value={grade || ''}
                    onChange={(e) => setGrade(e.target.value as GradeLevel)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    <option value="">-- Select Grade --</option>
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-900 text-xs font-bold flex items-center justify-between">
                    <span>{user.grade || 'Preschool / Kindergarten'}</span>
                    <span className="text-[10px] font-normal text-stone-500 italic">Grade locked to enrollment</span>
                  </div>
                )}
              </div>
            )}

            {/* School / Campus Affiliation */}
            {user.role !== 'school' && (
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-stone-500" />
                  <span>School / Campus Affiliation (Optional)</span>
                </label>
                {availableSchools.length > 0 ? (
                  <select
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    <option value="">No Campus / Universal Home Learner</option>
                    {availableSchools.map((s) => (
                      <option key={s.id} value={s.name}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Oakridge International School"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                  />
                )}
              </div>
            )}

            {/* Contact Phone Number (Optional) */}
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>Contact Phone / Extension (Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-900 focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
              />
            </div>

            {/* Account Status (Admin privilege only) */}
            {canEditStatus && (
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Account Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'pending', 'suspended'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                        status === st
                          ? st === 'active'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'pending'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

