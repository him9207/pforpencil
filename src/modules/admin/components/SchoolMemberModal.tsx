import React, { useState, useEffect, useMemo } from 'react';
import { SchoolOrganization, UserAccount, GradeLevel, ClassRoom, StudentProgress } from '../../../types';
import { 
  X, 
  School, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  GraduationCap, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  User, 
  Users 
} from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { 
  generateAccountId, 
  generateSchoolStudentUsername, 
  getSchoolPrefix,
  commitAccountId
} from '../../../utils/idAndUsernameGenerator';

interface SchoolMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'teacher' | 'student';
  schools: SchoolOrganization[];
  selectedSchoolId?: string;
  allUsers: UserAccount[];
  classes?: ClassRoom[];
  availableGrades?: string[];
  onAddTeacher: (teacher: UserAccount) => void;
  onAddStudent: (student: UserAccount, progress?: StudentProgress) => void;
  onSuccessMessage?: (msg: string) => void;
}

const AVATARS = ['🦊', '🦁', '🚀', '🐼', '🦄', '🐯', '🌟', '🐬', '🦉', '🐨', '🦖', '🐝', '🎨', '🎯', '⚽'];

export default function SchoolMemberModal({
  isOpen,
  onClose,
  mode,
  schools,
  selectedSchoolId,
  allUsers,
  classes = [],
  availableGrades = ['Preschool', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  onAddTeacher,
  onAddStudent,
  onSuccessMessage
}: SchoolMemberModalProps) {
  const [targetSchoolId, setTargetSchoolId] = useState<string>(
    selectedSchoolId || schools[0]?.id || ''
  );

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState<string>(availableGrades[1] || 'Grade 1');
  const [pin, setPin] = useState('1234');
  const [validityDays, setValidityDays] = useState('365');
  const [selectedAvatar, setSelectedAvatar] = useState('🎒');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Update target school if prop changes
  useEffect(() => {
    if (selectedSchoolId) {
      setTargetSchoolId(selectedSchoolId);
    } else if (schools.length > 0 && !targetSchoolId) {
      setTargetSchoolId(schools[0].id);
    }
  }, [selectedSchoolId, schools]);

  // Reset fields when opening modal or switching mode
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPin('1234');
      setGrade(availableGrades[1] || 'Grade 1');
      setSelectedAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
    }
  }, [isOpen, mode]);

  const targetSchool = useMemo(() => {
    return schools.find((s) => s.id === targetSchoolId) || schools[0];
  }, [schools, targetSchoolId]);

  const schoolPrefix = useMemo(() => {
    if (!targetSchool) return 'SCH';
    return targetSchool.schoolCode || getSchoolPrefix(targetSchool.name || targetSchool.id);
  }, [targetSchool]);

  // School teachers for student assignment
  const schoolTeachers = useMemo(() => {
    if (!targetSchool) return [];
    return allUsers.filter(
      (u) => u.role === 'teacher' && (u.organizationId === targetSchool.id || u.schoolName === targetSchool.name)
    );
  }, [allUsers, targetSchool]);

  // Projected IDs
  const projectedTeacherId = useMemo(() => {
    return generateAccountId('teacher', allUsers);
  }, [allUsers]);

  const projectedStudentId = useMemo(() => {
    return generateAccountId('student', allUsers);
  }, [allUsers]);

  const projectedStudentUsername = useMemo(() => {
    return generateSchoolStudentUsername(schoolPrefix, allUsers);
  }, [schoolPrefix, allUsers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!targetSchool) return;

    if (mode === 'teacher') {
      const teacherId = projectedTeacherId;
      commitAccountId(teacherId);

      const cleanDomain = targetSchool.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'school';
      const finalEmail = email.trim() || `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '.')}@${cleanDomain}.edu`;
      const numDays = parseInt(validityDays, 10) || 365;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + numDays);

      const initialPassword = `${schoolPrefix}2026!`;

      const newTeacher: UserAccount = {
        id: teacherId,
        role: 'teacher',
        name: name.trim(),
        email: finalEmail,
        avatar: '👩‍🏫',
        organizationId: targetSchool.id,
        schoolName: targetSchool.name,
        schoolCode: schoolPrefix,
        grade: grade as GradeLevel,
        country: targetSchool.country || 'United States',
        state: targetSchool.state || 'California',
        curriculum: targetSchool.curriculum || 'Common Core (US)',
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active',
        validUntil: expiry.toISOString().slice(0, 10),
        validityDuration: numDays === 365 ? '365_days' : `${numDays}_days`,
        password: initialPassword
      };

      sounds.playLevelUp();
      onAddTeacher(newTeacher);
      onSuccessMessage?.(`Created faculty teacher ${newTeacher.name} (${newTeacher.id}) for ${targetSchool.name}! Login: ${newTeacher.email} • Password: ${initialPassword}`);
      onClose();
    } else {
      // Student creation
      const studentId = projectedStudentId;
      commitAccountId(studentId);

      const assignedTeacher = schoolTeachers.find((t) => t.id === selectedTeacherId);

      const newStudent: UserAccount = {
        id: studentId,
        role: 'student',
        name: name.trim(),
        username: projectedStudentUsername,
        pin: pin.trim() || '1234',
        avatar: selectedAvatar,
        grade: grade as GradeLevel,
        organizationId: targetSchool.id,
        schoolName: targetSchool.name,
        schoolCode: schoolPrefix,
        teacherId: assignedTeacher?.id,
        country: targetSchool.country || 'United States',
        state: targetSchool.state || 'California',
        curriculum: targetSchool.curriculum || 'Common Core (US)',
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active'
      };

      const newProgress: StudentProgress = {
        studentId: newStudent.id,
        studentUsername: newStudent.username || newStudent.id,
        studentName: newStudent.name,
        avatar: newStudent.avatar || '🎒',
        grade: newStudent.grade || 'Grade 1',
        schoolOrParent: 'school',
        schoolName: targetSchool.name,
        level: 1,
        xp: 100,
        coins: 25,
        streakDays: 1,
        dailyQuizCompletedToday: false,
        totalQuizzesTaken: 0,
        averageScore: 100,
        subjectMastery: {
          'Mathematics': 85,
          'Science': 85,
          'English Language': 85,
          'Logic & Puzzles': 85
        },
        recentActivities: [],
        badges: [
          {
            id: 'B_SCH_ENROLL',
            name: 'Campus Scholar',
            icon: '🏫',
            description: `Enrolled at ${targetSchool.name}`,
            unlockedAt: new Date().toISOString().slice(0, 10)
          }
        ]
      };

      sounds.playLevelUp();
      onAddStudent(newStudent, newProgress);
      onSuccessMessage?.(`Created student ${newStudent.name} (${newStudent.id})! Username: ${newStudent.username} • PIN: ${newStudent.pin} under ${targetSchool.name}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-stone-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className={`p-6 border-b text-white flex items-center justify-between ${
          mode === 'teacher' ? 'bg-gradient-to-r from-blue-700 to-indigo-800 border-blue-900' : 'bg-gradient-to-r from-purple-700 to-blue-800 border-purple-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              {mode === 'teacher' ? '👩‍🏫' : '🎒'}
            </div>
            <div>
              <h2 className="text-xl font-black">
                {mode === 'teacher' ? 'Add Teacher to School Faculty' : 'Add Student to School Roster'}
              </h2>
              <p className="text-xs text-white/80 font-medium">
                {mode === 'teacher'
                  ? 'Issues sequential Teacher ID & faculty login credentials'
                  : 'Issues sequential Student ID & school username with 4-digit PIN'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target School Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                Target School Campus
              </span>
              <span className="text-[11px] font-mono text-blue-600 font-bold">
                Code: {schoolPrefix} • ID: {targetSchool?.id}
              </span>
            </label>
            <select
              value={targetSchoolId}
              onChange={(e) => setTargetSchoolId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id}) — Code: {s.schoolCode || getSchoolPrefix(s.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Sequential Credentials Preview Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>System Assigned Credentials (Centralized & Sequential)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-blue-200">
                <span className="text-[10px] text-stone-500 font-bold block">
                  {mode === 'teacher' ? 'Teacher ID (Sequential):' : 'Student ID (Sequential):'}
                </span>
                <span className="font-mono font-black text-blue-700 text-sm">
                  {mode === 'teacher' ? projectedTeacherId : projectedStudentId}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-blue-200">
                <span className="text-[10px] text-stone-500 font-bold block">
                  {mode === 'teacher' ? 'Initial Faculty Password:' : 'School Student Username:'}
                </span>
                <span className="font-mono font-black text-purple-700 text-sm">
                  {mode === 'teacher' ? `${schoolPrefix}2026!` : projectedStudentUsername}
                </span>
              </div>
            </div>
          </div>

          {/* Member Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-stone-400" />
              <span>{mode === 'teacher' ? 'Teacher Full Name' : 'Student Full Name'} *</span>
            </label>
            <input
              type="text"
              required
              placeholder={mode === 'teacher' ? 'e.g. Mrs. Sarah Jenkins' : 'e.g. Maya Sharma'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Grade Level Assignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-stone-400" />
              <span>Assigned Grade Level</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Mode-Specific Fields */}
          {mode === 'teacher' ? (
            <>
              {/* Teacher Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  Faculty Email (Optional — auto-generated if blank)
                </label>
                <input
                  type="email"
                  placeholder={`e.g. teacher@${targetSchool?.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'school'}.edu`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              {/* Teacher Validity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Account Contract & Validity Period</span>
                </label>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                >
                  <option value="365">Academic Year (365 Days)</option>
                  <option value="180">Semester (180 Days)</option>
                  <option value="90">Quarter (90 Days)</option>
                  <option value="30">Trial Month (30 Days)</option>
                </select>
              </div>
            </>
          ) : (
            <>
              {/* Student 4-digit PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    <span>4-Digit Access PIN *</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono font-black text-purple-800 tracking-widest text-center focus:ring-2 focus:ring-purple-500 outline-hidden"
                  />
                  <span className="text-[10px] text-stone-400 block text-center">Kid-friendly simple PIN</span>
                </div>

                {/* Assigned Faculty Teacher */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-stone-400" />
                    <span>Classroom Teacher</span>
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-purple-500 outline-hidden"
                  >
                    <option value="">Auto-Assign / General</option>
                    {schoolTeachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.id} — {t.grade || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Avatar selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Choose Student Avatar</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {AVATARS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                        selectedAvatar === av
                          ? 'bg-purple-100 border-2 border-purple-600 shadow-xs'
                          : 'bg-stone-50 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Submit Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer ${
                mode === 'teacher'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{mode === 'teacher' ? 'Provision Faculty Teacher' : 'Provision Student to Roster'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
