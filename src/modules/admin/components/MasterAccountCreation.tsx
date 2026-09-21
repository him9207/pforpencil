import React, { useState } from 'react';
import { UserAccount, UserRole, SchoolOrganization, GradeLevel } from '../../../types';
import { 
  ShieldCheck, 
  FileText, 
  School, 
  UserCheck, 
  Heart, 
  GraduationCap, 
  UserPlus, 
  Check, 
  Sparkles,
  KeyRound,
  Mail,
  User,
  Hash,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { getNextRoleId, generateStudentUsername, generateSchoolStudentUsername, generateSchoolCode, getSchoolPrefix, ensureUniqueUsername } from '../../../utils/idAndUsernameGenerator';

interface MasterAccountCreationProps {
  schools: SchoolOrganization[];
  parents: UserAccount[];
  availableGrades: string[];
  allUsersCount: number;
  allUsers?: UserAccount[];
  onAddUser: (user: UserAccount) => void;
  onSuccessMessage: (msg: string) => void;
}

const ROLES: { id: UserRole; label: string; icon: any; color: string; desc: string; prefix: string }[] = [
  { id: 'admin', label: 'Super Admin', icon: ShieldCheck, color: 'rose', desc: 'Full root access to all system configurations & data', prefix: 'ADM' },
  { id: 'content_manager', label: 'Content Manager', icon: FileText, color: 'blue', desc: 'Curates curriculum, questions & learning quests', prefix: 'CON' },
  { id: 'school', label: 'School Campus', icon: School, color: 'indigo', desc: 'School administration, campus seat licensing & faculty', prefix: 'SCH' },
  { id: 'teacher', label: 'Faculty Teacher', icon: UserCheck, color: 'purple', desc: 'Manages classrooms, rosters & assigns curriculum quests', prefix: 'TEA' },
  { id: 'parent', label: 'Parent / Guardian', icon: Heart, color: 'emerald', desc: 'Monitors children, manages homeschool/home practice passes', prefix: 'PAR' },
  { id: 'student', label: 'Student Learner', icon: GraduationCap, color: 'amber', desc: 'Plays educational quests, earns XP, coins & unlocks badges', prefix: 'STU' },
];

const AVATARS = ['🦊', '🚀', '🦁', '🐼', '🦄', '🐯', '🌟', '🐬', '🦉', '🐨', '🦖', '🐝'];

export default function MasterAccountCreation({
  schools,
  parents,
  availableGrades,
  allUsersCount,
  allUsers = [],
  onAddUser,
  onSuccessMessage
}: MasterAccountCreationProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('🦊');

  // Student specific
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [studentGrade, setStudentGrade] = useState<GradeLevel>('Grade 3');
  const [studentLinkType, setStudentLinkType] = useState<'school' | 'parent'>('school');
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || 'SCH000001');
  const [selectedParentId, setSelectedParentId] = useState(parents[0]?.id || 'PAR00001');

  // Teacher specific
  const [teacherSchoolId, setTeacherSchoolId] = useState(schools[0]?.id || 'SCH000001');
  const [teacherGrade, setTeacherGrade] = useState<GradeLevel>('Grade 3');

  // School specific
  const [schoolPlan, setSchoolPlan] = useState<'Basic 100' | 'Campus 500' | 'District 1000'>('Campus 500');
  const [seatQuota, setSeatQuota] = useState(500);

  // Content Manager specific
  const [cmSubject, setCmSubject] = useState('Mathematics');

  // Account Validity / Contract Duration
  const [validityDuration, setValidityDuration] = useState<
    '30_days' | '90_days' | '180_days' | '365_days' | '730_days' | 'lifetime'
  >('365_days');

  // Calculate expiration date based on validity
  const getExpirationDate = (duration: string): string => {
    const d = new Date();
    if (duration === '30_days') {
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    } else if (duration === '90_days') {
      d.setDate(d.getDate() + 90);
      return d.toISOString().slice(0, 10);
    } else if (duration === '180_days') {
      d.setDate(d.getDate() + 180);
      return d.toISOString().slice(0, 10);
    } else if (duration === '365_days') {
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().slice(0, 10);
    } else if (duration === '730_days') {
      d.setFullYear(d.getFullYear() + 2);
      return d.toISOString().slice(0, 10);
    }
    return '2099-12-31'; // Lifetime
  };

  // Sequential Role-Based ID generation (ADM000001, TEA00001, etc.)
  const roleConfig = ROLES.find((r) => r.id === selectedRole)!;
  const nextId = getNextRoleId(selectedRole, allUsers || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sounds.success();

    const expiresOn = getExpirationDate(validityDuration);
    let userObj: UserAccount;

    if (selectedRole === 'student') {
      const isParent = studentLinkType === 'parent';
      const linkedSchool = schools.find((s) => s.id === selectedSchoolId);
      const schoolCodeToUse = linkedSchool?.schoolCode || getSchoolPrefix(linkedSchool?.name);
      const generatedSchoolUsername = linkedSchool
        ? generateSchoolStudentUsername(schoolCodeToUse, allUsers)
        : generateStudentUsername(name.trim(), allUsers);

      const rawCandidate = username.trim() || (isParent ? generateStudentUsername(name.trim(), allUsers, undefined, false, parents.find(p => p.id === selectedParentId)?.name) : generatedSchoolUsername);
      const finalStudentUsername = ensureUniqueUsername(rawCandidate, allUsers || []);

      userObj = {
        id: nextId,
        role: 'student',
        name: name.trim(),
        username: finalStudentUsername.toUpperCase(),
        pin: pin.trim() || '1234',
        avatar,
        grade: studentGrade,
        parentId: isParent ? selectedParentId : undefined,
        organizationId: !isParent ? selectedSchoolId : undefined,
        schoolName: !isParent ? (linkedSchool?.name || 'School Organization') : undefined,
        schoolCode: !isParent ? schoolCodeToUse : undefined,
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validityDuration: validityDuration,
        validUntil: expiresOn
      };
    } else if (selectedRole === 'teacher') {
      const linkedSchool = schools.find((s) => s.id === teacherSchoolId);
      const schoolDomain = linkedSchool ? linkedSchool.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'school';
      const schoolCodeToUse = linkedSchool?.schoolCode || getSchoolPrefix(linkedSchool?.name);
      userObj = {
        id: nextId,
        role: 'teacher',
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@${schoolDomain}.edu`,
        avatar: avatar || '👩‍🏫',
        organizationId: teacherSchoolId,
        schoolName: linkedSchool?.name || 'School Organization',
        schoolCode: schoolCodeToUse,
        grade: teacherGrade,
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validityDuration: validityDuration,
        validUntil: expiresOn
      };
    } else if (selectedRole === 'school') {
      const schoolCode = generateSchoolCode(name.trim(), [...schools, ...(allUsers || [])]);
      userObj = {
        id: nextId,
        role: 'school',
        name: name.trim(),
        email: email.trim() || `principal@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`,
        avatar: '🏫',
        schoolName: name.trim(),
        schoolCode,
        organizationId: nextId,
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validityDuration: validityDuration,
        validUntil: expiresOn
      };
    } else if (selectedRole === 'parent') {
      userObj = {
        id: nextId,
        role: 'parent',
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        avatar: avatar || '👨‍👩‍👧',
        studentIds: [],
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validityDuration: validityDuration,
        validUntil: expiresOn
      };
    } else {
      userObj = {
        id: nextId,
        role: selectedRole,
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@funlearn.edu`,
        avatar,
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validityDuration: validityDuration,
        validUntil: expiresOn
      };
    }

    onAddUser(userObj);
    onSuccessMessage(`Provisioned ${roleConfig.label} account for ${userObj.name} with ID ${userObj.id}`);

    // Reset Form
    setName('');
    setEmail('');
    setUsername('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-2xl p-6 shadow-md border border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Master Provisioning Authority</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Master Account Creation Portal</h2>
            <p className="text-xs text-stone-300 max-w-2xl mt-1">
              As Super Admin, provision any account across the entire ecosystem — Schools, Teachers, Content Curators, Parents, Students, or fellow Administrators.
            </p>
          </div>
          <div className="bg-stone-800/80 px-4 py-2.5 rounded-xl border border-stone-700/60 text-right">
            <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">Next Auto-ID</span>
            <span className="font-mono text-sm font-bold text-amber-400">{nextId}</span>
          </div>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <span className="text-xs font-bold text-stone-700 block mb-3 uppercase tracking-wider">
          Select Account Role to Provision:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {ROLES.map((r) => {
            const isSelected = selectedRole === r.id;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  sounds.click();
                  setSelectedRole(r.id);
                  if (r.id === 'student') setAvatar('🦊');
                  else if (r.id === 'teacher') setAvatar('👩‍🏫');
                  else if (r.id === 'school') setAvatar('🏫');
                  else if (r.id === 'parent') setAvatar('👨‍👩‍👧');
                  else if (r.id === 'content_manager') setAvatar('👨‍🏫');
                  else setAvatar('👩‍💼');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col items-start gap-1.5 ${
                  isSelected
                    ? 'border-stone-900 bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/20'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-stone-800 shadow-xs'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">{r.label}</div>
                  <div className={`text-[10px] truncate max-w-[110px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                    Prefix: {r.prefix}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Unified Master Provisioning: Provision School Campuses, Parents, Students, Teachers, Admins, or Content Managers. All created accounts are immediately available across directories and stored in the unified database.</span>
        </div>
      </div>

      {/* Dynamic Creation Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Left 2 Columns */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-600" />
                <span>Create New {roleConfig.label} Account</span>
              </h3>
              <p className="text-xs text-stone-500">{roleConfig.desc}</p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200">
              {nextId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Common: Full Name */}
            <div>
              <label className="block font-semibold mb-1 text-stone-700">
                {selectedRole === 'school' ? 'School / Campus Name' : 'Full Name'} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder={
                    selectedRole === 'school'
                      ? 'e.g. St. Jude International School'
                      : selectedRole === 'student'
                      ? 'e.g. Lucas Henderson'
                      : 'e.g. Dr. Eleanor Vance'
                  }
                  value={name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setName(val);
                    if (selectedRole === 'student' && val.trim().length >= 1) {
                      const linkedSchool = schools.find((s) => s.id === selectedSchoolId);
                      const linkedParent = parents.find((p) => p.id === selectedParentId);
                      const autoUser = generateStudentUsername(
                        val,
                        allUsers || [],
                        linkedSchool?.name,
                        studentLinkType === 'school',
                        linkedParent?.name
                      );
                      setUsername(autoUser);
                    }
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                />
              </div>
            </div>

            {/* Email (Non-Student) */}
            {selectedRole !== 'student' && (
              <div>
                <label className="block font-semibold mb-1 text-stone-700">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Avatar Picker */}
            <div>
              <label className="block font-semibold mb-1 text-stone-700">Display Avatar / Icon</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                  {avatar}
                </span>
                <select
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white text-xs"
                >
                  {AVATARS.map((av) => (
                    <option key={av} value={av}>
                      {av} Avatar
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STUDENT SPECIFIC FIELDS */}
            {selectedRole === 'student' && (
              <>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Curriculum Grade Level</label>
                  <select
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                  >
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-stone-700 flex items-center gap-1">
                      <span>Login Username</span>
                      <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Immutable
                      </span>
                    </label>
                  </div>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      readOnly
                      required
                      placeholder="e.g. LARSMI1"
                      value={username}
                      title="Username is auto-generated and immutable (e.g. LARSMI1, LARSMI2)"
                      className="w-full pl-9 pr-9 py-2 rounded-xl border border-amber-200 font-mono font-bold text-amber-900 bg-amber-50/70 cursor-not-allowed select-all"
                    />
                    <Lock className="w-3.5 h-3.5 text-amber-600 absolute right-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1 font-mono">
                    Formula: {studentLinkType === 'school' ? 'School prefix + 4-digit sequence (e.g. OAK0001)' : 'First 3 of 1st name + 3 of last name + sequence (e.g. Larry Smith -> LARSMI1, LARSMI2)'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-stone-700">
                      4-Digit Secret PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-[10px] text-stone-500 hover:text-stone-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={4}
                      required
                      placeholder="1234"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 rounded-xl border border-stone-300 font-mono font-bold tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    PIN is protected and masked for student safety
                  </span>
                </div>

                <div className="sm:col-span-2 p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <span className="font-bold text-stone-800 block">Student Enrollment Affiliation:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={studentLinkType === 'school'}
                        onChange={() => setStudentLinkType('school')}
                      />
                      <span>Enrolled under School Campus</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={studentLinkType === 'parent'}
                        onChange={() => setStudentLinkType('parent')}
                      />
                      <span>Linked under Parent Account</span>
                    </label>
                  </div>

                  {studentLinkType === 'school' ? (
                    <div>
                      <label className="block font-semibold mb-1 text-stone-600">Select School Organization</label>
                      <select
                        value={selectedSchoolId}
                        onChange={(e) => setSelectedSchoolId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      >
                        {schools.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold mb-1 text-stone-600">Select Parent / Guardian</label>
                      <select
                        value={selectedParentId}
                        onChange={(e) => setSelectedParentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      >
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TEACHER SPECIFIC FIELDS */}
            {selectedRole === 'teacher' && (
              <>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Assigned School Organization</label>
                  <select
                    value={teacherSchoolId}
                    onChange={(e) => setTeacherSchoolId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Primary Teaching Grade</label>
                  <select
                    value={teacherGrade}
                    onChange={(e) => setTeacherGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                  >
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* SCHOOL SPECIFIC FIELDS */}
            {selectedRole === 'school' && (
              <>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Initial Seat License Plan</label>
                  <select
                    value={schoolPlan}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSchoolPlan(val);
                      if (val === 'Basic 100') setSeatQuota(100);
                      if (val === 'Campus 500') setSeatQuota(500);
                      if (val === 'District 1000') setSeatQuota(1000);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                  >
                    <option value="Basic 100">Basic 100 Seats ($499/yr)</option>
                    <option value="Campus 500">Campus 500 Seats ($2,250/yr)</option>
                    <option value="District 1000">District 1000 Seats ($4,100/yr)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Purchased Seat Capacity</label>
                  <input
                    type="number"
                    value={seatQuota}
                    onChange={(e) => setSeatQuota(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                  />
                </div>
              </>
            )}

            {/* CONTENT MANAGER SPECIFIC */}
            {selectedRole === 'content_manager' && (
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-stone-700">Primary Curriculum Specialty</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics & Logic Puzzles"
                  value={cmSubject}
                  onChange={(e) => setCmSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
                />
              </div>
            )}

            {/* ACCOUNT VALIDITY / DURATION SELECTOR */}
            <div className="sm:col-span-2 p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-stone-700 text-xs">
                  Account License Validity
                </label>
                <span className="font-mono text-[11px] text-stone-500">
                  Valid Until: <strong className="text-stone-900">{getExpirationDate(validityDuration)}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: '30_days', label: '1 Month', sub: '30 Days' },
                  { id: '90_days', label: '3 Months', sub: '90 Days' },
                  { id: '365_days', label: '1 Year', sub: '365 Days' },
                  { id: 'lifetime', label: 'Lifetime', sub: 'Permanent' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setValidityDuration(item.id as any)}
                    className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                      validityDuration === item.id
                        ? 'border-stone-900 bg-white shadow-xs font-bold text-stone-900'
                        : 'border-stone-200 bg-white/70 text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <span className="block font-bold text-[11px]">{item.label}</span>
                    <span className="text-[10px] text-stone-400">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-200">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-md transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Provision & Register {roleConfig.label}</span>
            </button>
          </div>
        </form>

        {/* Live Identity Badge Preview (Right Column) */}
        <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              Generated Identity Card Preview
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner border border-amber-200">
                  {avatar}
                </div>
                <div>
                  <div className="text-base font-bold text-stone-900">
                    {name.trim() || 'Account Holder Name'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-900 text-white uppercase">
                      {selectedRole}
                    </span>
                    <span className="font-mono text-[10px] text-stone-500 font-semibold">{nextId}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                {selectedRole === 'student' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Student Username:</span>
                      <span className="font-mono font-bold text-amber-800">
                        {username || 'KID0001'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500">Student PIN:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold tracking-widest text-stone-900">
                          {showPin ? pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="text-[10px] text-stone-400 hover:text-stone-600"
                        >
                          {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Grade Level:</span>
                      <span className="font-semibold text-stone-800">{studentGrade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Linked Account:</span>
                      <span className="font-semibold text-stone-800 truncate max-w-[140px]">
                        {studentLinkType === 'school' ? 'School Campus' : 'Parent Account'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Validity:</span>
                      <span className="font-bold text-emerald-600 font-mono text-[11px]">
                        Expires {getExpirationDate(validityDuration)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Email:</span>
                      <span className="font-mono text-stone-800 truncate max-w-[170px]">
                        {email || 'user@example.com'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Validity:</span>
                      <span className="font-bold text-emerald-600 font-mono text-[11px]">
                        Expires {getExpirationDate(validityDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Account Status:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Security Policy:</span>
                      <span className="font-semibold text-stone-800">Supabase RLS Enforced</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 leading-relaxed bg-stone-100/80 p-3 rounded-xl border border-stone-200/60">
            💡 <span className="font-semibold">Security Note:</span> Once provisioned, the user is immediately indexed in the PostgreSQL database with Row-Level Security policies active.
          </div>
        </div>
      </div>
    </div>
  );
}
