import React, { useState, FormEvent } from 'react';
import { 
  UserAccount, 
  SchoolOrganization, 
  ClassRoom, 
  StudentProgress, 
  GradeLevel,
  CurriculumGrade,
  CurriculumSubject
} from '../../types';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Layers, 
  Plus, 
  CheckCircle2, 
  KeyRound, 
  TrendingUp, 
  ShieldCheck, 
  CreditCard,
  Search,
  BookOpen,
  Eye,
  AlertCircle,
  Award,
  FileText,
  Lock,
  Power,
  Edit3,
  Calendar,
  Clock,
  DoorOpen,
  Filter
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { getSchoolPrefix, generateSchoolStudentUsername, getNextRoleId, commitAccountId } from '../../utils/idAndUsernameGenerator';
import StudentReportCardModal from '../student/StudentReportCardModal';
import ResetCredentialsModal from '../auth/ResetCredentialsModal';
import EditClassModal from './components/EditClassModal';
import EditTeacherModal from './components/EditTeacherModal';
import SchoolSubscriptionModal from './components/SchoolSubscriptionModal';
import EditUserProfileModal from '../admin/components/EditUserProfileModal';

interface SchoolPortalProps {
  currentUser: UserAccount;
  school: SchoolOrganization;
  classes: ClassRoom[];
  teachers: UserAccount[];
  students: StudentProgress[];
  allUsers?: UserAccount[];
  grades?: CurriculumGrade[];
  subjects?: CurriculumSubject[];
  onAddClass: (cls: ClassRoom) => void;
  onUpdateClass?: (cls: ClassRoom) => void;
  onAddTeacher: (teacher: UserAccount) => void;
  onUpdateTeacher?: (teacher: UserAccount) => void;
  onUpdateSchool?: (school: SchoolOrganization) => void;
  onAddStudent: (student: UserAccount, progress: StudentProgress) => void;
  onOpenPricing: () => void;
  onResetCredentials?: (userId: string, newSecret: string, isPin: boolean, newUsername?: string) => void;
  onUpdateUserProfile?: (user: UserAccount) => void;
}

export default function SchoolPortal({
  currentUser,
  school,
  classes,
  teachers,
  students,
  allUsers = [],
  grades = [],
  subjects = [],
  onAddClass,
  onUpdateClass,
  onAddTeacher,
  onUpdateTeacher,
  onUpdateSchool,
  onAddStudent,
  onOpenPricing,
  onResetCredentials,
  onUpdateUserProfile
}: SchoolPortalProps) {
  const activeCurriculumSubjects: string[] = (subjects && subjects.length > 0)
    ? subjects.filter((s) => s.active).map((s) => s.name)
    : ['Mathematics', 'Science', 'English Language', 'Logic & Puzzles'];

  const [activeTab, setActiveTab] = useState<'classes' | 'teachers' | 'students' | 'overview'>('classes');

  // Strictly isolate this school's resources
  const schoolClasses = classes.filter(c => c.schoolId === school.id);
  const schoolStudents = students.filter(s => 
    s.schoolOrParent === 'school' && (
      (s.schoolName && school.name && s.schoolName.toLowerCase() === school.name.toLowerCase()) ||
      schoolClasses.some(c => c.studentIds?.includes(s.studentId))
    )
  );
  const schoolTeachers = teachers.filter(t => 
    t.role === 'teacher' && (
      t.organizationId === school.id || 
      (t.schoolName && school.name && t.schoolName.toLowerCase() === school.name.toLowerCase())
    )
  );

  // Dynamic active curriculum grades (reads directly from active curriculum: Preschool, Foundation, Grade 1 to 6)
  const activeCurriculumGrades: GradeLevel[] = (grades && grades.length > 0)
    ? (grades.filter((g) => g.active).map((g) => g.name as GradeLevel))
    : ['Preschool', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  // Distinct grades from actual classes that currently exist in this school
  const schoolClassGrades: GradeLevel[] = Array.from(new Set(schoolClasses.map(c => c.grade)));
  const enrollmentGrades: GradeLevel[] = schoolClassGrades.length > 0 ? schoolClassGrades : activeCurriculumGrades;

  // Modals
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedReportStudent, setSelectedReportStudent] = useState<StudentProgress | null>(null);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<UserAccount | null>(null);
  const [editingStudentUser, setEditingStudentUser] = useState<UserAccount | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);

  // Filters & search
  const [classFilter, setClassFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Faculty Filter state
  const [teacherFilter, setTeacherFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherClassFilter, setTeacherClassFilter] = useState<string>('all');
  const [teacherGradeFilter, setTeacherGradeFilter] = useState<string>('all');

  // Student Filter state
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('all');
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>('all');
  const [studentPerformanceFilter, setStudentPerformanceFilter] = useState<string>('all');

  // Form states
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<GradeLevel>(() => activeCurriculumGrades[0] || 'Grade 1');
  const [newClassSection, setNewClassSection] = useState('');
  const [newClassTeacherId, setNewClassTeacherId] = useState(schoolTeachers[0]?.id || teachers[0]?.id || '');
  const [newClassRoom, setNewClassRoom] = useState('');

  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherClassId, setNewTeacherClassId] = useState<string>('');
  const [newTeacherGrade, setNewTeacherGrade] = useState<GradeLevel>(() => activeCurriculumGrades[0] || 'Grade 1');
  const [newTeacherValidityDays, setNewTeacherValidityDays] = useState('365');

  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState(schoolClasses[0]?.id || classes[0]?.id || '');
  const [newStudentGrade, setNewStudentGrade] = useState<GradeLevel>(() => schoolClasses[0]?.grade || enrollmentGrades[0] || 'Grade 1');
  const [newStudentPin, setNewStudentPin] = useState('7392');

  const [successBanner, setSuccessBanner] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const allocatedSeats = schoolStudents.length;
  const remainingSeats = Math.max(0, school.totalSeats - allocatedSeats);
  const seatUsagePercent = Math.min(100, Math.round((allocatedSeats / school.totalSeats) * 100));

  // Handle Quick Toggle Class Active / Deactivated
  const handleToggleClassStatus = (cls: ClassRoom) => {
    const nextStatus = cls.status === 'inactive' ? 'active' : 'inactive';
    const updated: ClassRoom = { ...cls, status: nextStatus };
    if (onUpdateClass) {
      onUpdateClass(updated);
    }
    sounds.playLevelUp();
    setSuccessBanner(`Classroom "${cls.name}" is now ${nextStatus === 'active' ? 'Active' : 'Deactivated'}!`);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  // Handle Quick Toggle Teacher Active / Suspended
  const handleToggleTeacherStatus = (t: UserAccount) => {
    const nextStatus = t.status === 'suspended' ? 'active' : 'suspended';
    const updated: UserAccount = { ...t, status: nextStatus };
    if (onUpdateTeacher) {
      onUpdateTeacher(updated);
    }
    sounds.playLevelUp();
    setSuccessBanner(`Teacher account "${t.name}" is now ${nextStatus === 'active' ? 'Active' : 'Deactivated'}!`);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  // Handle Create Class
  const handleCreateClass = (e: FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const assignedTeacher = schoolTeachers.find(t => t.id === newClassTeacherId) || schoolTeachers[0];
    const newClass: ClassRoom = {
      id: `CLS-00${classes.length + 1}`,
      name: newClassName.trim(),
      grade: newClassGrade,
      section: newClassSection.trim() || undefined,
      teacherId: assignedTeacher ? assignedTeacher.id : currentUser.id,
      teacherName: assignedTeacher ? assignedTeacher.name : currentUser.name,
      room: newClassRoom.trim() || undefined,
      status: 'active',
      schoolId: school.id,
      studentIds: [],
      activeAssignments: [],
      averageScore: 0
    };

    sounds.playLevelUp();
    onAddClass(newClass);
    setShowAddClassModal(false);
    setNewClassName('');
    setNewClassSection('');
    setNewClassRoom('');
    setSuccessBanner(`Classroom "${newClass.name}" (${newClass.grade}${newClass.section ? ` • ${newClass.section}` : ''}) created and assigned to ${newClass.teacherName}!`);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  // Handle Create Teacher
  const handleCreateTeacher = (e: FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    const newTeacherId = getNextRoleId('teacher', allUsers);
    commitAccountId(newTeacherId);
    const numDays = parseInt(newTeacherValidityDays, 10) || 365;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + numDays);

    let valLabel = 'Academic Year (365 Days)';
    if (numDays === 30) valLabel = 'Monthly (30 Days)';
    else if (numDays === 90) valLabel = 'Quarterly (90 Days)';
    else if (numDays === 180) valLabel = 'Semester (180 Days)';
    else if (numDays === 365) valLabel = 'Academic Year (365 Days)';

    const schoolPrefix = school.schoolCode || getSchoolPrefix(school.name || school.id);
    const initialTeacherPassword = `${schoolPrefix}2025!`;
    const cleanDomain = school.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'school';

    const selectedClass = schoolClasses.find(c => c.id === newTeacherClassId);
    const effectiveGrade = selectedClass ? selectedClass.grade : newTeacherGrade;

    const newTeacherUser: UserAccount = {
      id: newTeacherId,
      role: 'teacher',
      name: newTeacherName.trim(),
      email: newTeacherEmail.trim() || `${newTeacherId.toLowerCase()}@${cleanDomain}.edu`,
      avatar: '👩‍🏫',
      country: school.country || currentUser.country || 'United States',
      state: school.state || currentUser.state || 'California',
      curriculum: school.curriculum || currentUser.curriculum || 'Common Core (US)',
      organizationId: school.id,
      schoolName: school.name,
      schoolCode: schoolPrefix,
      grade: effectiveGrade,
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'active',
      validUntil: expiry.toISOString().slice(0, 10),
      validityDuration: valLabel,
      password: initialTeacherPassword
    };

    sounds.playLevelUp();
    onAddTeacher(newTeacherUser);

    // If assigned to a custom class, link lead teacher
    if (selectedClass && onUpdateClass) {
      onUpdateClass({
        ...selectedClass,
        teacherId: newTeacherId,
        teacherName: newTeacherUser.name
      });
    }

    setShowAddTeacherModal(false);
    setNewTeacherName('');
    setNewTeacherEmail('');
    setNewTeacherClassId('');
    setSuccessBanner(`Added faculty member ${newTeacherUser.name} with ${valLabel}! Login: ${newTeacherUser.email} (Password: ${initialTeacherPassword})`);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  // Handle Create Student
  const handleCreateStudent = (e: FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    if (allocatedSeats >= school.totalSeats) {
      alert(`Seat limit reached (${school.totalSeats} seats). Please upgrade your school plan to add more students.`);
      return;
    }

    const selectedClass = schoolClasses.find(c => c.id === newStudentClassId);
    const effectiveGrade = selectedClass ? selectedClass.grade : newStudentGrade;

    const nextStudentId = getNextRoleId('student', allUsers);
    commitAccountId(nextStudentId);
    const nextStudentIndex = Math.max(0, allUsers.filter(u => u.role === 'student').length);
    const schoolPrefix = school.schoolCode || getSchoolPrefix(school.name || school.id);
    const generatedUsername = generateSchoolStudentUsername(schoolPrefix, allUsers);
    const avatars = ['🎒', '🚀', '🌟', '🦄', '🦁', '🦊', '🎨', '🎯', '⚽'];
    const assignedAvatar = avatars[nextStudentIndex % avatars.length];

    const newStudentUser: UserAccount = {
      id: nextStudentId,
      role: 'student',
      name: newStudentName.trim(),
      username: generatedUsername,
      pin: newStudentPin.trim() || '7392',
      avatar: assignedAvatar,
      grade: effectiveGrade,
      country: school.country || currentUser.country || 'United States',
      state: school.state || currentUser.state || 'California',
      curriculum: school.curriculum || currentUser.curriculum || 'Common Core (US)',
      organizationId: school.id,
      schoolName: school.name,
      schoolCode: schoolPrefix,
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    const newStudentProgress: StudentProgress = {
      studentId: nextStudentId,
      studentUsername: generatedUsername,
      studentName: newStudentName.trim(),
      avatar: assignedAvatar,
      grade: effectiveGrade,
      country: school.country || currentUser.country || 'United States',
      state: school.state || currentUser.state || 'California',
      curriculum: school.curriculum || currentUser.curriculum || 'Common Core (US)',
      schoolOrParent: 'school',
      schoolName: school.name,
      schoolCode: schoolPrefix,
      organizationId: school.id,
      level: 1,
      xp: 100,
      coins: 20,
      streakDays: 1,
      dailyQuizCompletedToday: false,
      totalQuizzesTaken: 0,
      averageScore: 100,
      subjectMastery: activeCurriculumSubjects.reduce((acc, s) => {
        acc[s] = 85;
        return acc;
      }, {} as Record<string, number>),
      recentActivities: [],
      badges: [
        { id: 'B_NEW', name: `${schoolPrefix} Scholar`, icon: '🌟', description: `Enrolled in ${school.name}`, unlockedAt: new Date().toISOString().split('T')[0] }
      ]
    };

    sounds.playLevelUp();
    onAddStudent(newStudentUser, newStudentProgress);

    // Link student to selected class if chosen
    if (selectedClass && onUpdateClass) {
      onUpdateClass({
        ...selectedClass,
        studentIds: Array.from(new Set([...(selectedClass.studentIds || []), nextStudentId]))
      });
    }

    setShowAddStudentModal(false);
    setNewStudentName('');
    setNewStudentPin('7392');
    setSuccessBanner(`Enrolled student ${newStudentUser.name} in ${selectedClass ? selectedClass.name : effectiveGrade}! Username: ${newStudentUser.username}, PIN: ${newStudentUser.pin}`);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* School Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl">
            🏫
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              School Administration Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              School: {school.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="font-mono text-xs px-2.5 py-0.5 bg-blue-50 text-blue-800 rounded-md font-bold border border-blue-200">
                School ID: {school.id}
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 bg-purple-50 text-purple-800 rounded-md font-bold border border-purple-200">
                School Code: {school.schoolCode || getSchoolPrefix(school.name)}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                • Principal / Admin: {currentUser.name} • License: {school.plan}
              </span>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setEditingStudentUser(currentUser);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold border border-stone-200 cursor-pointer transition"
                title="Edit Admin / Principal Profile"
              >
                <Edit3 className="w-3 h-3 text-stone-600" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* School Subscription & Capacity Pill */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-4 text-xs">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                Student License Capacity
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-black text-stone-900">{allocatedSeats}</span>
                <span className="text-stone-400">/ {school.totalSeats} seats filled</span>
              </div>
            </div>
            <div className="w-20 bg-stone-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  seatUsagePercent > 90 ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${seatUsagePercent}%` }}
              />
            </div>
          </div>

          {/* School License Validity Card */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between sm:justify-start gap-3.5 text-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-700 font-bold uppercase tracking-wider text-[10px]">
                  {school.validityType === 'monthly' ? 'Monthly License' : 'Yearly License'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="font-black text-stone-900 text-xs mt-0.5">
                {school.contractDuration || (school.validityType === 'monthly' ? '30 Days' : '365 Days')}
              </div>
              <p className="text-[10px] text-stone-500 font-mono">
                Expires: {school.expiresAt || '2026-08-31'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSubscriptionModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer transition shadow-xs flex items-center gap-1 shrink-0"
              title="Change validity period or expiration date"
            >
              <Calendar className="w-3 h-3" />
              <span>Validity</span>
            </button>
          </div>

          <button
            onClick={onOpenPricing}
            className="px-4 py-3 rounded-2xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Upgrade Capacity</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
            <span>Active Classrooms</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{schoolClasses.length}</div>
          <p className="text-[11px] text-stone-400 mt-1">Preschool through Grade 6</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
            <span>Faculty Teachers</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{schoolTeachers.length}</div>
          <p className="text-[11px] text-stone-400 mt-1">100% active credentials</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
            <span>Rostered Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{schoolStudents.length}</div>
          <p className="text-[11px] text-stone-400 mt-1">{remainingSeats} open seats left</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
            <span>School Accuracy Avg</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">
            {schoolStudents.length > 0 
              ? Math.round(schoolStudents.reduce((acc, s) => acc + s.averageScore, 0) / schoolStudents.length) 
              : 88}%
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Institutional Honor Roll</p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-3xl border border-[#e1e6f1] p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-[#eef4ff] p-1.5 rounded-full border border-[#d7def0]">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-[#f20b86] text-white shadow-xs'
                : 'text-[#59627a] hover:text-[#10246f]'
            }`}
          >
            🏫 Active Classes ({schoolClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-[#f20b86] text-white shadow-xs'
                : 'text-[#59627a] hover:text-[#10246f]'
            }`}
          >
            👩‍🏫 Faculty Teachers ({schoolTeachers.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-[#f20b86] text-white shadow-xs'
                : 'text-[#59627a] hover:text-[#10246f]'
            }`}
          >
            🎒 Students & Report Cards ({schoolStudents.length})
          </button>
        </div>

        {/* Action Buttons corresponding to active view */}
        <div className="flex items-center gap-2">
          {activeTab === 'classes' && (
            <button
              onClick={() => setShowAddClassModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Class</span>
            </button>
          )}

          {activeTab === 'teachers' && (
            <button
              onClick={() => setShowAddTeacherModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Teacher</span>
            </button>
          )}

          {activeTab === 'students' && (
            <button
              onClick={() => {
                if (schoolClasses[0]) {
                  setNewStudentClassId(schoolClasses[0].id);
                  setNewStudentGrade(schoolClasses[0].grade);
                }
                setNewStudentPin(String(Math.floor(1000 + Math.random() * 9000)));
                setShowAddStudentModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Student</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE CLASSROOMS (Includes Preschool & Foundation) */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (() => {
        const filteredClasses = schoolClasses.filter((cls) => {
          const matchesFilter = classFilter === 'all'
            ? true
            : classFilter === 'active'
              ? cls.status !== 'inactive'
              : cls.status === 'inactive';
          const matchesSearch = !classSearchQuery.trim() ||
            cls.name.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
            cls.grade.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
            (cls.teacherName && cls.teacherName.toLowerCase().includes(classSearchQuery.toLowerCase())) ||
            (cls.room && cls.room.toLowerCase().includes(classSearchQuery.toLowerCase()));
          return matchesFilter && matchesSearch;
        });

        const activeCount = schoolClasses.filter(c => c.status !== 'inactive').length;
        const inactiveCount = schoolClasses.filter(c => c.status === 'inactive').length;

        return (
          <div className="space-y-4">
            {/* Filter and Search Toolbar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                <button
                  onClick={() => setClassFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    classFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All ({schoolClasses.length})
                </button>
                <button
                  onClick={() => setClassFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    classFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Active ({activeCount})</span>
                </button>
                <button
                  onClick={() => setClassFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    classFilter === 'inactive'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-rose-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>Deactivated ({inactiveCount})</span>
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  value={classSearchQuery}
                  onChange={(e) => setClassSearchQuery(e.target.value)}
                  placeholder="Search class, grade, room or teacher..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 outline-hidden"
                />
              </div>
            </div>

            {filteredClasses.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
                <Layers className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="text-base font-black text-stone-900">
                  {schoolClasses.length === 0 ? 'No Classrooms Created Yet' : 'No Classrooms Match Filter'}
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {schoolClasses.length === 0 
                    ? 'Create classrooms for Preschool, Foundation, or Grades 1 to 6 to organize your faculty and students.'
                    : 'Try changing your search term or status filter above.'}
                </p>
                {schoolClasses.length === 0 && (
                  <button
                    onClick={() => setShowAddClassModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Class</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => {
                  const classStudentCount = cls.studentIds?.length || schoolStudents.filter(s => s.grade === cls.grade).length;
                  const isInactive = cls.status === 'inactive';
                  const assignedTeacher = schoolTeachers.find(t => t.id === cls.teacherId) || teachers.find(t => t.id === cls.teacherId);
                  const teacherDisplayName = assignedTeacher?.name || cls.teacherName || 'Lead Faculty';
                  const teacherAvatar = assignedTeacher?.avatar || '👩‍🏫';
                  const teacherId = assignedTeacher?.id || cls.teacherId;

                  return (
                    <div 
                      key={cls.id} 
                      className={`p-5 rounded-3xl border transition-all space-y-4 flex flex-col justify-between ${
                        isInactive
                          ? 'bg-stone-50/70 border-stone-200 opacity-90'
                          : 'bg-white border-stone-200 shadow-xs hover:border-blue-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold uppercase tracking-wider">
                                {cls.grade}
                              </span>
                              {cls.section && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                                  Section {cls.section}
                                </span>
                              )}
                              {cls.room && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono">
                                  <DoorOpen className="w-2.5 h-2.5 text-stone-400" />
                                  {cls.room}
                                </span>
                              )}
                              {isInactive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                                  <Power className="w-2.5 h-2.5" />
                                  Deactivated
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Active
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-black text-stone-900">{cls.name}</h3>
                            <p className="text-[10px] text-stone-400 font-mono">Class ID: {cls.id}</p>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-stone-100 text-stone-700 shrink-0">
                            {cls.averageScore || 88}% Avg
                          </span>
                        </div>

                        {cls.description && (
                          <p className="text-xs text-stone-500 line-clamp-2">
                            {cls.description}
                          </p>
                        )}

                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">{teacherAvatar}</span>
                            <div>
                              <span className="text-stone-400 block text-[10px] uppercase font-bold">Assigned Teacher</span>
                              <div className="flex items-center gap-1">
                                <strong className="text-stone-800 font-bold">{teacherDisplayName}</strong>
                                {teacherId && <span className="text-[10px] text-stone-400 font-mono">({teacherId})</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-stone-400 block text-[10px] uppercase font-bold">Rostered Students</span>
                            <strong className="text-stone-800">{classStudentCount} Students</strong>
                          </div>
                        </div>
                      </div>

                      {/* Class Card Actions */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleClassStatus(cls)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isInactive
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 border border-stone-200'
                          }`}
                          title={isInactive ? 'Activate this classroom' : 'Deactivate this classroom'}
                        >
                          <Power className="w-3 h-3" />
                          <span>{isInactive ? 'Activate' : 'Deactivate'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingClass(cls)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3 h-3 text-blue-600" />
                          <span>Edit Class</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 2: FACULTY TEACHERS */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (() => {
        const filteredTeachers = schoolTeachers.filter((t) => {
          const matchesStatus = teacherFilter === 'all'
            ? true
            : teacherFilter === 'active'
              ? t.status !== 'suspended'
              : t.status === 'suspended';

          const matchesGrade = teacherGradeFilter === 'all'
            ? true
            : t.grade === teacherGradeFilter;

          const teacherClasses = schoolClasses.filter(c => c.teacherId === t.id || c.teacherName === t.name);
          const matchesClass = teacherClassFilter === 'all'
            ? true
            : teacherClassFilter === 'unassigned'
              ? teacherClasses.length === 0
              : teacherClasses.some(c => c.id === teacherClassFilter);

          const matchesSearch = !teacherSearchQuery.trim() ||
            t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
            (t.email && t.email.toLowerCase().includes(teacherSearchQuery.toLowerCase())) ||
            t.id.toLowerCase().includes(teacherSearchQuery.toLowerCase()) ||
            (t.grade && t.grade.toLowerCase().includes(teacherSearchQuery.toLowerCase()));

          return matchesStatus && matchesGrade && matchesClass && matchesSearch;
        });

        const activeTeachersCount = schoolTeachers.filter(t => t.status !== 'suspended').length;
        const suspendedTeachersCount = schoolTeachers.filter(t => t.status === 'suspended').length;
        const hasActiveTeacherFilters = teacherFilter !== 'all' || teacherGradeFilter !== 'all' || teacherClassFilter !== 'all' || teacherSearchQuery.trim().length > 0;

        return (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs space-y-0">
            {/* Header Title */}
            <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>School Faculty Directory</span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold">
                    {filteredTeachers.length} of {schoolTeachers.length} Teachers
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Manage teacher profiles, classroom assignments, grade specialties, active/deactive status, and validity
                </p>
              </div>

              {/* Top Quick Status Switcher */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setTeacherFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    teacherFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All ({schoolTeachers.length})
                </button>
                <button
                  onClick={() => setTeacherFilter('active')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    teacherFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-emerald-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Active ({activeTeachersCount})</span>
                </button>
                <button
                  onClick={() => setTeacherFilter('suspended')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    teacherFilter === 'suspended'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-rose-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>Deactivated ({suspendedTeachersCount})</span>
                </button>
              </div>
            </div>

            {/* Comprehensive Filter Toolbar */}
            <div className="p-4 bg-stone-50/80 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    placeholder="Search by name, email, ID..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                  />
                </div>

                {/* Filter by Custom Class */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-stone-500 font-semibold hidden sm:inline">Class:</span>
                  <select
                    value={teacherClassFilter}
                    onChange={(e) => setTeacherClassFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                  >
                    <option value="all">All Classrooms</option>
                    {schoolClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade})
                      </option>
                    ))}
                    <option value="unassigned">Unassigned / Floating</option>
                  </select>
                </div>

                {/* Filter by Grade Specialty */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-stone-500 font-semibold hidden sm:inline">Grade:</span>
                  <select
                    value={teacherGradeFilter}
                    onChange={(e) => setTeacherGradeFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                  >
                    <option value="all">All Grades</option>
                    {activeCurriculumGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters */}
                {hasActiveTeacherFilters && (
                  <button
                    onClick={() => {
                      setTeacherFilter('all');
                      setTeacherGradeFilter('all');
                      setTeacherClassFilter('all');
                      setTeacherSearchQuery('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold transition cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Add Faculty CTA */}
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setShowAddTeacherModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Faculty Member</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-4 font-semibold">Teacher Name</th>
                    <th className="p-4 font-semibold">Email Login</th>
                    <th className="p-4 font-semibold">Grade Specialty</th>
                    <th className="p-4 font-semibold">Assigned Classrooms</th>
                    <th className="p-4 font-semibold">Account Status</th>
                    <th className="p-4 font-semibold">Faculty Validity</th>
                    <th className="p-4 font-semibold">Avg Accuracy</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <p className="font-bold text-stone-700">No faculty members found</p>
                          <p className="text-xs">Try adjusting your filters or search query.</p>
                          {hasActiveTeacherFilters && (
                            <button
                              onClick={() => {
                                setTeacherFilter('all');
                                setTeacherGradeFilter('all');
                                setTeacherClassFilter('all');
                                setTeacherSearchQuery('');
                              }}
                              className="mt-2 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold"
                            >
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t) => {
                      const assignedClasses = schoolClasses.filter(c => c.teacherId === t.id || c.teacherName === t.name);
                      const isDeactivated = t.status === 'suspended';

                      return (
                        <tr key={t.id} className={`hover:bg-stone-50/70 transition-colors ${isDeactivated ? 'bg-stone-50/40' : ''}`}>
                          <td className="p-4 font-bold text-stone-950">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{t.avatar || '👩‍🏫'}</span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span>{t.name}</span>
                                  {isDeactivated && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                      Deactivated
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-stone-400 font-mono">{t.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-stone-600 font-mono">
                            {t.email || `${t.id.toLowerCase()}@school.edu`}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                              {t.grade || 'Grade 1'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {assignedClasses.length > 0 ? (
                                assignedClasses.map(c => (
                                  <span key={c.id} className="inline-block mr-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-bold">
                                    {c.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-stone-400 text-xs italic">General Faculty</span>
                              )}
                            </div>
                          </td>

                          {/* Account Status with 1-click toggle */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              {isDeactivated ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTeacherStatus(t)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                                  title="Click to activate faculty account"
                                >
                                  <Power className="w-3 h-3" />
                                  <span>Deactivated</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTeacherStatus(t)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                                  title="Click to deactivate faculty account"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Active</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Faculty Validity */}
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                <Clock className="w-2.5 h-2.5" />
                                {t.validityDuration || '365 Days'}
                              </span>
                              <div className="text-[10px] text-stone-400 font-mono">
                                {t.validUntil ? `Exp: ${t.validUntil}` : 'Permanent'}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 font-bold text-stone-900">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              89% Avg
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingTeacher(t)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                title="Edit teacher profile, validity, and status"
                              >
                                <Edit3 className="w-3 h-3 text-emerald-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => setResettingUser(t)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                title="Reset login credentials"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>Reset</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENTS & DETAIL LEVEL REPORT CARDS */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (() => {
        const filteredStudents = schoolStudents.filter((s) => {
          const studentClass = schoolClasses.find(c => c.studentIds?.includes(s.studentId));

          const matchesClass = studentClassFilter === 'all'
            ? true
            : studentClassFilter === 'general'
              ? !studentClass
              : studentClass?.id === studentClassFilter;

          const matchesGrade = studentGradeFilter === 'all'
            ? true
            : s.grade === studentGradeFilter;

          const matchesPerformance = studentPerformanceFilter === 'all'
            ? true
            : studentPerformanceFilter === 'top'
              ? s.averageScore >= 90
              : studentPerformanceFilter === 'standard'
                ? s.averageScore >= 75 && s.averageScore < 90
                : s.averageScore < 75;

          const matchesSearch = !studentSearchQuery.trim() ||
            s.studentName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
            s.studentUsername.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
            s.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase());

          return matchesClass && matchesGrade && matchesPerformance && matchesSearch;
        });

        const hasActiveStudentFilters = studentClassFilter !== 'all' || studentGradeFilter !== 'all' || studentPerformanceFilter !== 'all' || studentSearchQuery.trim().length > 0;

        return (
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            {/* Header Title */}
            <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>School Student Roster & Academic Analytics</span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold">
                    {filteredStudents.length} of {schoolStudents.length} Students
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Access official student report cards, custom class assignments, performance tracking, and login PINs
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setShowAddStudentModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enroll New Student</span>
              </button>
            </div>

            {/* Comprehensive Student Filter Toolbar */}
            <div className="p-4 bg-stone-50/80 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search by student name, username, ID..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  />
                </div>

                {/* Filter by Custom Classroom */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-stone-500 font-semibold hidden sm:inline">Class:</span>
                  <select
                    value={studentClassFilter}
                    onChange={(e) => setStudentClassFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  >
                    <option value="all">All Classrooms</option>
                    {schoolClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade})
                      </option>
                    ))}
                    <option value="general">General / Unassigned</option>
                  </select>
                </div>

                {/* Filter by Grade */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-stone-500 font-semibold hidden sm:inline">Grade:</span>
                  <select
                    value={studentGradeFilter}
                    onChange={(e) => setStudentGradeFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  >
                    <option value="all">All Grades</option>
                    {activeCurriculumGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Performance */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-stone-500 font-semibold hidden sm:inline">Performance:</span>
                  <select
                    value={studentPerformanceFilter}
                    onChange={(e) => setStudentPerformanceFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                  >
                    <option value="all">All Accuracies</option>
                    <option value="top">Top Achievers (≥90%)</option>
                    <option value="standard">Proficient (75% - 89%)</option>
                    <option value="support">Needs Support (&lt;75%)</option>
                  </select>
                </div>

                {/* Clear Student Filters */}
                {hasActiveStudentFilters && (
                  <button
                    onClick={() => {
                      setStudentClassFilter('all');
                      setStudentGradeFilter('all');
                      setStudentPerformanceFilter('all');
                      setStudentSearchQuery('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold transition cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-4 font-semibold">Student Name</th>
                    <th className="p-4 font-semibold">Student Username</th>
                    <th className="p-4 font-semibold">Class & Master Grade</th>
                    <th className="p-4 font-semibold">Accuracy</th>
                    <th className="p-4 font-semibold">Total Quizzes</th>
                    <th className="p-4 font-semibold">Total XP</th>
                    <th className="p-4 font-semibold">Streak</th>
                    <th className="p-4 font-semibold">Student PIN</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-stone-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <p className="font-bold text-stone-700">No students found</p>
                          <p className="text-xs">Try adjusting your filters or search query.</p>
                          {hasActiveStudentFilters && (
                            <button
                              onClick={() => {
                                setStudentClassFilter('all');
                                setStudentGradeFilter('all');
                                setStudentPerformanceFilter('all');
                                setStudentSearchQuery('');
                              }}
                              className="mt-2 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold"
                            >
                              Reset All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const studentUser = allUsers.find(u => u.id === s.studentId);
                      const currentPin = studentUser?.pin || '7392';
                      const studentClass = schoolClasses.find(c => c.studentIds?.includes(s.studentId)) || schoolClasses.find(c => c.grade === s.grade);
                      return (
                        <tr key={s.studentId} className="hover:bg-stone-50/70">
                          <td className="p-4 font-bold text-stone-950">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{s.avatar}</span>
                              <div>
                                <div>{s.studentName}</div>
                                <span className="text-[10px] text-stone-400 font-mono">{s.studentId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-blue-700">
                            <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {s.studentUsername}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-stone-900">{studentClass ? studentClass.name : 'General Cohort'}</div>
                            <div className="text-[10px] text-stone-500 font-medium">Mapped Grade: {s.grade}</div>
                          </td>
                          <td className="p-4">
                            <span className={`font-bold px-2 py-0.5 rounded-full border ${
                              s.averageScore >= 90
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : s.averageScore >= 75
                                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                                  : 'text-amber-700 bg-amber-50 border-amber-200'
                            }`}>
                              {s.averageScore}%
                            </span>
                          </td>
                          <td className="p-4 font-medium text-stone-900">
                            {s.totalQuizzesTaken || 12} Quizzes
                          </td>
                          <td className="p-4 font-mono font-bold text-amber-700">
                            +{s.xp} XP
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 font-bold text-orange-600">
                              🔥 {s.streakDays}d
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-[11px] font-bold text-stone-800 bg-stone-100 px-2 py-1 rounded border border-stone-200">
                              {currentPin}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Student Profile Button */}
                              <button
                                onClick={() => {
                                  sounds.click();
                                  const targetUser: UserAccount = studentUser || {
                                    id: s.studentId,
                                    name: s.studentName,
                                    username: s.studentUsername,
                                    role: 'student' as const,
                                    pin: currentPin,
                                    avatar: s.avatar,
                                    grade: s.grade,
                                    organizationId: school.id,
                                    schoolName: school.name,
                                    status: 'active' as const,
                                    enrolledAt: '2025-09-01'
                                  };
                                  setEditingStudentUser(targetUser);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Edit Student Basic Details"
                              >
                                <Edit3 className="w-3 h-3 text-blue-600" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => {
                                  const targetUser: UserAccount = studentUser || {
                                    id: s.studentId,
                                    name: s.studentName,
                                    username: s.studentUsername,
                                    role: 'student' as const,
                                    pin: currentPin,
                                    avatar: s.avatar,
                                    grade: s.grade,
                                    organizationId: school.id,
                                    schoolName: school.name,
                                    status: 'active' as const,
                                    enrolledAt: '2025-09-01'
                                  };
                                  setResettingUser(targetUser);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Reset Student PIN"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>Reset PIN</span>
                              </button>

                              <button
                                onClick={() => {
                                  sounds.playLevelUp();
                                  setSelectedReportStudent(s);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="View Full Report Card"
                              >
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span>Report Card</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE CLASS (Preschool through Grade 6) */}
      {/* ========================================================================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Create New Class</h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preschool Early Explorers or Grade 3-B"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Grade Level *
                  </label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value as GradeLevel)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-stone-800 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
                  >
                    {activeCurriculumGrades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Section / Cohort
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section A"
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium text-stone-900 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 104"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium text-stone-900 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Assign Lead Teacher *
                </label>
                <select
                  value={newClassTeacherId}
                  onChange={(e) => setNewClassTeacherId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
                >
                  {schoolTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Save Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE TEACHER */}
      {/* ========================================================================= */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Add Faculty Member</h3>
              <button onClick={() => setShowAddTeacherModal(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>
            <form onSubmit={handleCreateTeacher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Teacher Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ms. Emily Davis"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  School Email (Login Account)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. e.davis@oakwood.edu"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Grade Level Specialty
                </label>
                <select
                  value={newTeacherGrade}
                  onChange={(e) => setNewTeacherGrade(e.target.value as GradeLevel)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-bold"
                >
                  {activeCurriculumGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Assigned School Class (Custom Class)
                </label>
                <select
                  value={newTeacherClassId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setNewTeacherClassId(cid);
                    const selClass = schoolClasses.find(c => c.id === cid);
                    if (selClass?.grade) setNewTeacherGrade(selClass.grade);
                  }}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                >
                  <option value="">General Faculty / Unassigned</option>
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade}{c.section ? ` • ${c.section}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Faculty Account Validity (Access Duration)
                </label>
                <select
                  value={newTeacherValidityDays}
                  onChange={(e) => setNewTeacherValidityDays(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-bold"
                >
                  <option value="30">Monthly License (30 Days)</option>
                  <option value="90">Quarterly License (90 Days)</option>
                  <option value="180">Single Semester (180 Days)</option>
                  <option value="365">Full Academic Year (365 Days)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-500 text-[11px]">
                ℹ️ Default initial password set to <strong>{getSchoolPrefix(school.name || school.id)}2025!</strong> (can be reset anytime).
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Create Teacher Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ENROLL STUDENT */}
      {/* ========================================================================= */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Enroll School Student</h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mason Clark"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Grade Level
                </label>
                <select
                  value={newStudentGrade}
                  onChange={(e) => {
                    const selectedGrade = e.target.value as GradeLevel;
                    setNewStudentGrade(selectedGrade);
                    const matchingClass = schoolClasses.find(c => c.grade === selectedGrade);
                    if (matchingClass) setNewStudentClassId(matchingClass.id);
                  }}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-bold"
                >
                  {enrollmentGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Assigned Class
                </label>
                <select
                  value={newStudentClassId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setNewStudentClassId(cid);
                    const selClass = schoolClasses.find(c => c.id === cid);
                    if (selClass?.grade) setNewStudentGrade(selClass.grade);
                  }}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                >
                  {schoolClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  4-Digit Student PIN
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={newStudentPin}
                  onChange={(e) => setNewStudentPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-bold text-center tracking-widest text-base"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px]">
                ℹ️ The student will be given a secure Username (e.g. <strong>{generateSchoolStudentUsername(school.name || school.id, allUsers)}</strong>) and log in with this 4-digit PIN.
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DETAILED STUDENT REPORT CARD */}
      {/* ========================================================================= */}
      {selectedReportStudent && (() => {
        const studentClass = schoolClasses.find(c => c.studentIds?.includes(selectedReportStudent.studentId) || c.grade === selectedReportStudent.grade);
        const assignedTeacher = schoolTeachers.find(t => t.id === studentClass?.teacherId) || teachers.find(t => t.id === studentClass?.teacherId);
        const studentUserAcc = allUsers.find(u => u.id === selectedReportStudent.studentId);
        return (
          <StudentReportCardModal
            student={selectedReportStudent}
            userAccount={studentUserAcc}
            className={studentClass?.name}
            section={studentClass?.section}
            room={studentClass?.room}
            teacherName={assignedTeacher?.name || studentClass?.teacherName}
            principalName={currentUser.name}
            parentName={selectedReportStudent.parentName || studentUserAcc?.parentName}
            schoolName={school.name}
            onClose={() => setSelectedReportStudent(null)}
            viewerRole="school"
          />
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 5: RESET CREDENTIALS (PIN or PASSWORD) */}
      {/* ========================================================================= */}
      {resettingUser && onResetCredentials && (
        <ResetCredentialsModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSaveCredentials={(userId, newSecret, isPin, newUsername) => {
            onResetCredentials(userId, newSecret, isPin, newUsername);
            setSuccessBanner(`Reset credentials for ${resettingUser.name} (${resettingUser.role})!`);
            setTimeout(() => setSuccessBanner(''), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT CLASSROOM (Active/Deactive, Change Teacher, Room, Details) */}
      {/* ========================================================================= */}
      {editingClass && (
        <EditClassModal
          classroom={editingClass}
          teachers={schoolTeachers}
          grades={grades}
          onClose={() => setEditingClass(null)}
          onSave={(updatedClass) => {
            if (onUpdateClass) {
              onUpdateClass(updatedClass);
            }
            sounds.playLevelUp();
            setEditingClass(null);
            setSuccessBanner(`Updated classroom "${updatedClass.name}" (Status: ${updatedClass.status === 'inactive' ? 'Deactivated' : 'Active'})!`);
            setTimeout(() => setSuccessBanner(''), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: EDIT TEACHER PROFILE & VALIDITY (Active/Deactive & Term) */}
      {/* ========================================================================= */}
      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          grades={grades}
          classes={schoolClasses}
          onClose={() => setEditingTeacher(null)}
          onSave={(updatedTeacher, assignedClassIds) => {
            if (onUpdateTeacher) {
              onUpdateTeacher(updatedTeacher);
            }
            // Update class associations if specified
            if (assignedClassIds && onUpdateClass) {
              schoolClasses.forEach(cls => {
                const shouldBeAssigned = assignedClassIds.includes(cls.id);
                const isCurrentlyAssigned = cls.teacherId === updatedTeacher.id;
                if (shouldBeAssigned && !isCurrentlyAssigned) {
                  onUpdateClass({
                    ...cls,
                    teacherId: updatedTeacher.id,
                    teacherName: updatedTeacher.name
                  });
                } else if (!shouldBeAssigned && isCurrentlyAssigned) {
                  onUpdateClass({
                    ...cls,
                    teacherId: currentUser.id,
                    teacherName: currentUser.name
                  });
                }
              });
            }
            sounds.playLevelUp();
            setEditingTeacher(null);
            setSuccessBanner(`Updated faculty member "${updatedTeacher.name}" (Status: ${updatedTeacher.status === 'suspended' ? 'Deactivated' : 'Active'}, Validity: ${updatedTeacher.validityDuration || '365 Days'})!`);
            setTimeout(() => setSuccessBanner(''), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: SCHOOL SUBSCRIPTION & VALIDITY (Monthly / Yearly Contract) */}
      {/* ========================================================================= */}
      {showSubscriptionModal && (
        <SchoolSubscriptionModal
          school={school}
          onClose={() => setShowSubscriptionModal(false)}
          onSave={(updatedSchool) => {
            if (onUpdateSchool) {
              onUpdateSchool(updatedSchool);
            }
            sounds.playLevelUp();
            setShowSubscriptionModal(false);
            setSuccessBanner(`Updated school license to ${updatedSchool.validityType === 'monthly' ? 'Monthly' : 'Yearly'} validity (${updatedSchool.contractDuration || '365 Days'})!`);
            setTimeout(() => setSuccessBanner(''), 4000);
          }}
        />
      )}
      {/* ========================================================================= */}
      {/* MODAL 9: EDIT USER / STUDENT PROFILE MODAL */}
      {/* ========================================================================= */}
      {editingStudentUser && (
        <EditUserProfileModal
          isOpen={!!editingStudentUser}
          onClose={() => setEditingStudentUser(null)}
          user={editingStudentUser}
          onSave={(updatedUser) => {
            if (onUpdateUserProfile) {
              onUpdateUserProfile(updatedUser);
            }
            sounds.playLevelUp();
            setEditingStudentUser(null);
            setSuccessBanner(`Updated profile details for "${updatedUser.name}"!`);
            setTimeout(() => setSuccessBanner(''), 4000);
          }}
          availableGrades={activeCurriculumGrades}
          canEditStatus={false}
        />
      )}
    </div>
  );
}
