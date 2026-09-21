import React, { useState, useMemo, FormEvent } from 'react';
import { 
  UserAccount, 
  ClassRoom, 
  StudentProgress, 
  Question, 
  Activity,
  ClassAssignment,
  GradeLevel,
  Subject,
  CurriculumGrade,
  CurriculumSubject,
  SchoolOrganization
} from '../../types';
import { 
  GraduationCap, 
  Users, 
  Plus, 
  CheckCircle2, 
  BookOpen, 
  Calendar, 
  Clock, 
  Award, 
  TrendingUp, 
  Flame, 
  Sparkles, 
  KeyRound, 
  FileQuestion,
  Layers,
  Search,
  Filter,
  Check,
  Send,
  HelpCircle,
  FileText,
  Lock,
  Building2,
  Edit3,
  Shuffle,
  Globe,
  Coins
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { getNextQuestionId, getSchoolPrefix, generateSchoolStudentUsername, getNextRoleId } from '../../utils/idAndUsernameGenerator';
import { COUNTRIES, COUNTRY_STATE_MAP, COUNTRY_CURRICULUM_MAP } from '../../data/curriculumData';
import StudentReportCardModal from '../student/StudentReportCardModal';
import ResetCredentialsModal from '../auth/ResetCredentialsModal';
import EditUserProfileModal from '../admin/components/EditUserProfileModal';

interface TeacherPortalProps {
  currentUser: UserAccount;
  classes: ClassRoom[];
  students: StudentProgress[];
  questions: Question[];
  activities?: Activity[];
  assignments: ClassAssignment[];
  allUsers?: UserAccount[];
  schools?: SchoolOrganization[];
  grades?: CurriculumGrade[];
  subjects?: CurriculumSubject[];
  onAddClass: (cls: ClassRoom) => void;
  onAddStudent: (student: UserAccount, progress: StudentProgress) => void;
  onCreateAssignment: (assignment: ClassAssignment) => void;
  onAddQuestion?: (q: Question) => void;
  onResetCredentials?: (userId: string, newSecret: string, isPin: boolean, newUsername?: string) => void;
  onUpdateUserProfile?: (user: UserAccount) => void;
}

export default function TeacherPortal({
  currentUser,
  classes,
  students,
  questions,
  activities = [],
  assignments,
  allUsers = [],
  schools = [],
  grades = [],
  subjects = [],
  onAddClass,
  onAddStudent,
  onCreateAssignment,
  onAddQuestion,
  onResetCredentials,
  onUpdateUserProfile
}: TeacherPortalProps) {
  const activeCurriculumSubjects: string[] = (subjects && subjects.length > 0)
    ? subjects.filter((s) => s.active).map((s) => s.name)
    : ['Mathematics', 'Science', 'English Language', 'Logic & Puzzles'];

  // Resolve linked school dynamically from schools list, organizationId, or schoolName
  const linkedSchool = schools?.find(
    (s) =>
      s.id === currentUser.organizationId ||
      (currentUser.schoolName && s.name.trim().toLowerCase() === currentUser.schoolName.trim().toLowerCase())
  );
  const effectiveSchoolName = linkedSchool?.name || currentUser.schoolName || 'School';
  const effectiveSchoolId = linkedSchool?.id || currentUser.organizationId || 'SCH000001';
  const effectiveCountry = linkedSchool?.country || currentUser.country || 'United States';
  const effectiveState = linkedSchool?.state || currentUser.state || 'California';
  const effectiveCurriculum = linkedSchool?.curriculum || currentUser.curriculum || 'Common Core (US)';
  const schoolPrefix = getSchoolPrefix(effectiveSchoolName || effectiveSchoolId);

  // Strict isolation of classes belonging to this teacher or teacher's school
  const teacherClasses = classes.filter((cls) => 
    cls.teacherId === currentUser.id ||
    cls.teacherName === currentUser.name ||
    (effectiveSchoolId && cls.schoolId === effectiveSchoolId)
  );

  // Dynamic active curriculum grades (reads directly from active curriculum: Preschool, Foundation, Grade 1 to 6)
  const activeCurriculumGrades: GradeLevel[] = (grades && grades.length > 0)
    ? (grades.filter((g) => g.active).map((g) => g.name as GradeLevel))
    : ['Preschool', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  // Distinct grades from existing classes in this school
  const existingClassGrades: GradeLevel[] = Array.from(new Set(teacherClasses.map((c) => c.grade)));
  const enrollmentGrades: GradeLevel[] = existingClassGrades.length > 0 ? existingClassGrades : activeCurriculumGrades;

  const [selectedClassId, setSelectedClassId] = useState<string>(teacherClasses[0]?.id || classes[0]?.id || 'CLS001');
  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'questions' | 'activities'>('students');

  // Modals
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [selectedReportStudent, setSelectedReportStudent] = useState<StudentProgress | null>(null);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<GradeLevel>(() => activeCurriculumGrades[0] || 'Grade 1');
  const [newClassSection, setNewClassSection] = useState('');
  const [newClassRoom, setNewClassRoom] = useState('');

  // Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState<GradeLevel>(() => enrollmentGrades[0] || 'Grade 1');
  const [newStudentPin, setNewStudentPin] = useState('7392');

  // Assignment from Question Bank Form State
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentSubject, setAssignmentSubject] = useState<Subject>('Mathematics');
  const [assignmentGrade, setAssignmentGrade] = useState<GradeLevel>(() => activeCurriculumGrades[0] || 'Grade 1');
  const [assignmentDueDate, setAssignmentDueDate] = useState('2025-04-25');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [bankSearchQuery, setBankSearchQuery] = useState('');

  // Custom Question Form State
  const [customSubject, setCustomSubject] = useState<Subject>('Mathematics');
  const [customGrade, setCustomGrade] = useState<GradeLevel>(() => activeCurriculumGrades[0] || 'Grade 1');
  const [customCategory, setCustomCategory] = useState('Numbers & Operations');
  const [customSkill, setCustomSkill] = useState('Problem Solving');
  const [customCountry, setCustomCountry] = useState<string>(() => effectiveCountry);
  const [customState, setCustomState] = useState<string>(() => effectiveState);
  const [customCurriculum, setCustomCurriculum] = useState<string>(() => effectiveCurriculum);
  const [showRegionOverride, setShowRegionOverride] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customClipart, setCustomClipart] = useState('');
  const [customOpt0, setCustomOpt0] = useState('');
  const [customOpt1, setCustomOpt1] = useState('');
  const [customOpt2, setCustomOpt2] = useState('');
  const [customOpt3, setCustomOpt3] = useState('');
  const [customCorrectIdx, setCustomCorrectIdx] = useState(0);
  const [customExplanation, setCustomExplanation] = useState('');
  const [customHint, setCustomHint] = useState('');
  const [customPoints, setCustomPoints] = useState(25);
  const [customDifficulty, setCustomDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  // Question Bank Tab Filters
  const [qCountryFilter, setQCountryFilter] = useState<string>('All');
  const [qStateFilter, setQStateFilter] = useState<string>('All');
  const [qCurriculumFilter, setQCurriculumFilter] = useState<string>('All');
  const [qSubjectFilter, setQSubjectFilter] = useState<string>('All');
  const [qGradeFilter, setQGradeFilter] = useState<string>('All');
  const [qSearchQuery, setQSearchQuery] = useState<string>('');

  // Interactive Activities Tab Filters
  const [activityGradeFilter, setActivityGradeFilter] = useState<string>('All');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState<string>('All');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('All');
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');

  const [notification, setNotification] = useState('');

  const currentClass = teacherClasses.find((c) => c.id === selectedClassId) || teacherClasses[0];

  // Filtered Interactive Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchGrade = activityGradeFilter === 'All' || !act.grade || act.grade === activityGradeFilter;
      const matchSubject = activitySubjectFilter === 'All' || act.subject === activitySubjectFilter;
      const matchType = activityTypeFilter === 'All' || act.type === activityTypeFilter;
      const matchQuery = activitySearchQuery === '' ||
        act.title.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
        act.subject.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
        (act.grade || '').toLowerCase().includes(activitySearchQuery.toLowerCase());
      return matchGrade && matchSubject && matchType && matchQuery;
    });
  }, [activities, activityGradeFilter, activitySubjectFilter, activityTypeFilter, activitySearchQuery]);

  // Strict isolation: Students belonging to this teacher's active class or school
  const classStudents = students.filter((s) => {
    if (currentClass?.studentIds?.includes(s.studentId)) return true;
    const isSameSchool =
      (effectiveSchoolName && s.schoolName && s.schoolName.toLowerCase().trim() === effectiveSchoolName.toLowerCase().trim()) ||
      (currentUser.schoolName && s.schoolName && s.schoolName.toLowerCase().trim() === currentUser.schoolName.toLowerCase().trim());
    if (!isSameSchool) return false;
    if (currentClass) {
      return s.grade === currentClass.grade;
    }
    return true;
  });

  // Assignments for current class
  const classAssignments = assignments.filter((a) => a.classId === currentClass?.id);

  // STRICT QUESTION ISOLATION:
  // Teacher can ONLY access Global questions (!q.schoolId) OR questions created for their own school (q.schoolId === effectiveSchoolId).
  // Questions created by other schools are strictly hidden!
  const mySchoolId = effectiveSchoolId;
  const accessibleQuestions = questions.filter((q) => {
    if (!q.schoolId) return true; // Global master question
    return q.schoolId === mySchoolId; // This school's exclusive custom question
  });

  // Filtered list for the Question Bank Tab
  const filteredQuestions = accessibleQuestions.filter((q) => {
    const matchCountry = qCountryFilter === 'All' || !q.country || q.country === 'Global' || q.country === qCountryFilter;
    const matchState = qStateFilter === 'All' || !q.state || q.state === 'National Standard / All States' || q.state === qStateFilter;
    const matchCurriculum = qCurriculumFilter === 'All' || !q.curriculum || q.curriculum === qCurriculumFilter;
    const matchSub = qSubjectFilter === 'All' || q.subject === qSubjectFilter;
    const matchGrd = qGradeFilter === 'All' || q.grade === qGradeFilter;
    const matchQuery = qSearchQuery === '' || 
      q.id.toLowerCase().includes(qSearchQuery.toLowerCase()) ||
      q.prompt.toLowerCase().includes(qSearchQuery.toLowerCase()) ||
      q.skill.toLowerCase().includes(qSearchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(qSearchQuery.toLowerCase());
    return matchCountry && matchState && matchCurriculum && matchSub && matchGrd && matchQuery;
  });

  // Questions available for assignment creation
  const availableQuestions = accessibleQuestions.filter((q) => {
    const matchSub = q.subject === assignmentSubject;
    const matchGrd = q.grade === assignmentGrade;
    const matchQuery = bankSearchQuery === '' || 
      q.id.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      q.prompt.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      q.skill.toLowerCase().includes(bankSearchQuery.toLowerCase());
    return matchSub && matchGrd && matchQuery;
  });

  const allSubjects: Subject[] = [
    'Mathematics'
  ];

  // Handle Create Class
  const handleCreateClass = (e: FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: ClassRoom = {
      id: `CLS-00${classes.length + 1}`,
      name: newClassName.trim(),
      grade: newClassGrade,
      section: newClassSection.trim() || undefined,
      room: newClassRoom.trim() || undefined,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      schoolId: effectiveSchoolId,
      studentIds: [],
      activeAssignments: [],
      averageScore: 0
    };

    sounds.playLevelUp();
    onAddClass(newClass);
    setSelectedClassId(newClass.id);
    setNewClassName('');
    setNewClassSection('');
    setNewClassRoom('');
    setShowCreateClassModal(false);
    setNotification(`Classroom "${newClass.name}" (${newClass.grade}${newClass.section ? ` • ${newClass.section}` : ''}) created successfully!`);
    setTimeout(() => setNotification(''), 4000);
  };

  // Handle Create Student
  const handleCreateStudent = (e: FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !currentClass) return;

    const schoolCodeToUse = currentUser.schoolCode || linkedSchool?.schoolCode || getSchoolPrefix(effectiveSchoolName);
    const nextStudentId = getNextRoleId('student', allUsers);
    const nextStudentIndex = Math.max(0, allUsers.filter((u) => u.role === 'student').length);
    const generatedUsername = generateSchoolStudentUsername(schoolCodeToUse, allUsers);
    const avatars = ['🎒', '🚀', '🌟', '🦄', '🦁', '🦊', '🎨', '🎯', '⚽'];
    const assignedAvatar = avatars[nextStudentIndex % avatars.length];

    const newStudentUser: UserAccount = {
      id: nextStudentId,
      role: 'student',
      name: newStudentName.trim(),
      username: generatedUsername,
      pin: newStudentPin.trim() || '7392',
      avatar: assignedAvatar,
      grade: newStudentGrade,
      organizationId: effectiveSchoolId,
      schoolName: effectiveSchoolName,
      schoolCode: schoolCodeToUse,
      teacherId: currentUser.id,
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    const newStudentProgress: StudentProgress = {
      studentId: nextStudentId,
      studentUsername: generatedUsername,
      studentName: newStudentName.trim(),
      avatar: assignedAvatar,
      grade: newStudentGrade,
      schoolOrParent: 'school',
      schoolName: effectiveSchoolName,
      schoolCode: schoolCodeToUse,
      organizationId: effectiveSchoolId,
      teacherId: currentUser.id,
      level: 1,
      xp: 100,
      coins: 20,
      streakDays: 1,
      dailyQuizCompletedToday: false,
      totalQuizzesTaken: 1,
      averageScore: 90,
      subjectMastery: activeCurriculumSubjects.reduce((acc, s) => {
        acc[s] = 88;
        return acc;
      }, {} as Record<string, number>),
      recentActivities: [],
      badges: [
        { id: 'B_NEW', name: `${schoolCodeToUse} Scholar`, icon: '🌟', description: `Enrolled in ${effectiveSchoolName}`, unlockedAt: new Date().toISOString().split('T')[0] }
      ]
    };

    sounds.playLevelUp();
    onAddStudent(newStudentUser, newStudentProgress);

    if (currentClass) {
      currentClass.studentIds = [...(currentClass.studentIds || []), nextStudentId];
    }

    setNewStudentName('');
    setNewStudentPin('7392');
    setShowCreateStudentModal(false);
    setNotification(`Enrolled student ${newStudentUser.name}! Username: ${newStudentUser.username}, PIN: ${newStudentUser.pin}`);
    setTimeout(() => setNotification(''), 5000);
  };

  // Handle Publish Assignment
  const handlePublishAssignment = (e: FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || selectedQuestionIds.length === 0 || !currentClass) {
      alert('Please provide an assignment title and select at least 1 question.');
      return;
    }

    const nextNum = assignments.length + 1;
    const newAssignment: ClassAssignment = {
      id: `ASG-${String(nextNum).padStart(4, '0')}`,
      classId: currentClass.id,
      className: currentClass.name,
      title: assignmentTitle.trim(),
      subject: assignmentSubject,
      grade: assignmentGrade,
      questionIds: selectedQuestionIds,
      dueDate: assignmentDueDate,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    sounds.playLevelUp();
    onCreateAssignment(newAssignment);
    setShowCreateAssignmentModal(false);
    setAssignmentTitle('');
    setSelectedQuestionIds([]);
    setNotification(`Published "${newAssignment.title}" with ${selectedQuestionIds.length} questions to ${currentClass.name}!`);
    setTimeout(() => setNotification(''), 4000);
  };

  // Handle Create School Custom Question
  const handleCreateCustomQuestion = (e: FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || !customOpt0.trim() || !customOpt1.trim() || !customOpt2.trim() || !customOpt3.trim()) {
      alert('Please fill out question prompt and all 4 choices.');
      return;
    }

    const nextId = getNextQuestionId(customGrade, questions, 0, customSubject);
    const newQuestion: Question = {
      id: nextId,
      subject: customSubject,
      grade: customGrade,
      category: customCategory.trim(),
      skill: customSkill.trim(),
      country: customCountry,
      state: customState,
      curriculum: customCurriculum,
      prompt: customPrompt.trim(),
      options: [customOpt0.trim(), customOpt1.trim(), customOpt2.trim(), customOpt3.trim()],
      correctIndex: customCorrectIdx,
      explanation: customExplanation.trim() || 'Custom pedagogical explanation authored by teacher.',
      hint: customHint.trim(),
      points: Number(customPoints) || 25,
      difficulty: customDifficulty,
      visualClipart: customClipart.trim() || undefined,
      schoolId: mySchoolId,
      schoolName: effectiveSchoolName,
      createdBy: currentUser.id,
      creatorName: currentUser.name,
      createdRole: 'teacher',
      isCustom: true
    };

    sounds.playCorrect();
    if (onAddQuestion) {
      onAddQuestion(newQuestion);
    }
    setShowCreateQuestionModal(false);
    setCustomPrompt('');
    setCustomClipart('');
    setCustomOpt0('');
    setCustomOpt1('');
    setCustomOpt2('');
    setCustomOpt3('');
    setCustomExplanation('');
    setCustomHint('');
    setNotification(`Authoring complete: Custom question ${newQuestion.id} is now available exclusively to ${newQuestion.schoolName}!`);
    setTimeout(() => setNotification(''), 5000);
  };

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Teacher Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl">
            👩‍🏫
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold uppercase tracking-wider mb-1">
              <GraduationCap className="w-3 h-3 text-emerald-600" />
              Lead Faculty Portal
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Faculty: {currentUser.name}
              </h1>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setEditingUser(currentUser);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-200 cursor-pointer transition"
                title="Edit Faculty Name & Avatar"
              >
                <Edit3 className="w-3 h-3 text-emerald-700" />
                <span>Edit Profile</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="font-mono text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold border border-emerald-200">
                Teacher ID: {currentUser.id}
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 bg-blue-50 text-blue-800 rounded-md font-bold border border-blue-200">
                School: {effectiveSchoolName} ({effectiveSchoolId})
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 bg-purple-50 text-purple-800 rounded-md font-bold border border-purple-200">
                School Code: {currentUser.schoolCode || linkedSchool?.schoolCode || getSchoolPrefix(effectiveSchoolName)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateClassModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white font-bold text-xs transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Class</span>
          </button>
          <button
            onClick={() => {
              if (currentClass?.grade) setNewStudentGrade(currentClass.grade);
              setNewStudentPin(String(Math.floor(1000 + Math.random() * 9000)));
              setShowCreateStudentModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold text-xs transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>
          <button
            onClick={() => setShowCreateQuestionModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#13b7ad] hover:bg-[#0fa097] text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Author Custom Question</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Active Classroom Selector & Tabs */}
      <div className="bg-white rounded-3xl border border-[#e1e6f1] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Class switcher buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#59627a] uppercase tracking-wider mr-1">
            Assigned Classes:
          </span>
          {teacherClasses.map((cls) => {
            const isSelected = cls.id === currentClass?.id;
            return (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClassId(cls.id);
                  sounds.playCorrect();
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#10246f] text-white shadow-xs'
                    : 'bg-[#eef4ff] text-[#10246f] hover:bg-[#d7def0]'
                }`}
              >
                <span>{cls.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#10246f] border border-[#d7def0]'
                }`}>
                  {cls.grade}
                </span>
                {cls.section && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#13b7ad]'
                  }`}>
                    {cls.section}
                  </span>
                )}
                {cls.room && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono opacity-80 ${
                    isSelected ? 'text-white/80' : 'text-[#59627a]'
                  }`}>
                    🚪 {cls.room}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Tabs */}
        <div className="bg-[#eef4ff] p-1.5 rounded-full border border-[#d7def0] flex items-center gap-1">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-[#f20b86] text-white shadow-xs'
                : 'text-[#59627a] hover:text-[#10246f]'
            }`}
          >
            🎒 Students ({classStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-[#f20b86] text-white shadow-xs'
                : 'text-[#59627a] hover:text-[#10246f]'
            }`}
          >
            📋 Assignments ({classAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-[#f20b86] text-white shadow-xs'
                : 'text-[#59627a] hover:text-[#10246f]'
            }`}
          >
            📚 Question Bank ({accessibleQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-[#f20b86] text-white shadow-xs'
                : 'text-[#59627a] hover:text-[#10246f]'
            }`}
          >
            ⚡ Activities & Quizzes ({activities.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDENT ROSTER & DETAILED REPORT CARD ACCESS */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Active Student Roster for {currentClass?.name}
              </h3>
              <p className="text-xs text-stone-500">
                Performance tracking, login PIN administration, and complete report cards
              </p>
            </div>
            <span className="text-xs font-bold text-stone-500">
              {classStudents.length} Students Enrolled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">Grade</th>
                  <th className="p-4 font-semibold">Accuracy</th>
                  <th className="p-4 font-semibold">Total Quizzes</th>
                  <th className="p-4 font-semibold">XP Score</th>
                  <th className="p-4 font-semibold">Streak</th>
                  <th className="p-4 font-semibold">Student PIN</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-stone-400 font-medium">
                      No students rostered in this class yet. Click "Enroll Student" above.
                    </td>
                  </tr>
                ) : (
                  classStudents.map((s) => {
                    const studentUser = allUsers.find(u => u.id === s.studentId);
                    const currentPin = studentUser?.pin || '7392';
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
                        <td className="p-4 font-bold text-stone-900">
                          {s.grade}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {s.averageScore}%
                          </span>
                        </td>
                        <td className="p-4 font-medium text-stone-900">
                          {s.totalQuizzesTaken || 14} Quizzes
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-700">
                          +{s.xp} XP
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-orange-600">
                            🔥 {s.streakDays}d
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                            <KeyRound className="w-3 h-3 text-stone-400" />
                            {currentPin}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Student Details Button */}
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
                                  organizationId: currentUser.organizationId,
                                  schoolName: currentUser.schoolName,
                                  status: 'active' as const,
                                  enrolledAt: '2025-09-01'
                                };
                                setEditingUser(targetUser);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Edit Student Basic Details"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              <span>Edit</span>
                            </button>

                            {/* Reset PIN Button */}
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
                                  organizationId: currentUser.organizationId,
                                  schoolName: currentUser.schoolName,
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

                            {/* View Detailed Report Card */}
                            <button
                              onClick={() => {
                                sounds.playLevelUp();
                                setSelectedReportStudent(s);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="View Student Report Card"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLASS ASSIGNMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Assignments for {currentClass?.name}
              </h3>
              <p className="text-xs text-stone-500">
                Assigned from Global Question Bank & School Custom Questions
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedQuestionIds([]);
                setShowCreateAssignmentModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Assignment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Assignment Title</th>
                  <th className="p-4 font-semibold">Subject</th>
                  <th className="p-4 font-semibold">Grade</th>
                  <th className="p-4 font-semibold">Questions Included</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {classAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-stone-400 font-medium">
                      No assignments published to this class yet. Click "New Assignment" above.
                    </td>
                  </tr>
                ) : (
                  classAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50/70">
                      <td className="p-4 font-bold text-stone-950">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div>{a.title}</div>
                            <span className="text-[10px] text-stone-400 font-mono">{a.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-stone-900">
                        {a.subject}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-stone-100 font-bold text-[10px] text-stone-700">
                          {a.grade}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-stone-900">{a.questionIds.length} Questions</span>
                          <span className="text-[10px] text-stone-400 font-mono">({a.questionIds.slice(0, 3).join(', ')}{a.questionIds.length > 3 ? '...' : ''})</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-stone-600">
                        {a.dueDate}
                      </td>
                      <td className="p-4 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Active & Assigned
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHOOL QUESTION BANK & CUSTOM AUTHORING */}
      {/* ========================================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Isolation Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">
                School-Exclusive Question Bank & Custom Authoring
              </h4>
              <p className="text-slate-600 mt-0.5">
                You can browse existing global curriculum questions OR author custom questions for your students. Any custom question you author is tagged with your school ID (<strong>{mySchoolId}</strong>) and strictly restricted to <strong>{currentUser.schoolName || 'your school'}</strong>. Other schools and parents cannot view or use your questions.
              </p>
            </div>
          </div>

          {/* Regional & Pedagogical Filter Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-blue-600" />
                <span>Country / Region</span>
              </label>
              <select
                value={qCountryFilter}
                onChange={(e) => {
                  setQCountryFilter(e.target.value);
                  setQStateFilter('All');
                  setQCurriculumFilter('All');
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
              >
                <option value="All">🌍 All Countries</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                State / Province
              </label>
              <select
                value={qStateFilter}
                onChange={(e) => setQStateFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
              >
                <option value="All">📍 All States / Regions</option>
                {qCountryFilter !== 'All' && COUNTRY_STATE_MAP[qCountryFilter]
                  ? COUNTRY_STATE_MAP[qCountryFilter].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))
                  : Array.from(new Set(Object.values(COUNTRY_STATE_MAP).flat())).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))
                }
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                Curriculum Standard
              </label>
              <select
                value={qCurriculumFilter}
                onChange={(e) => setQCurriculumFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
              >
                <option value="All">📚 All Curricula</option>
                {qCountryFilter !== 'All' && COUNTRY_CURRICULUM_MAP[qCountryFilter]
                  ? COUNTRY_CURRICULUM_MAP[qCountryFilter].map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))
                  : Array.from(new Set(Object.values(COUNTRY_CURRICULUM_MAP).flat())).map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))
                }
              </select>
            </div>
          </div>

          {/* Standard Subject / Grade / Search Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions by prompt, skill, or ID..."
                  value={qSearchQuery}
                  onChange={(e) => setQSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={qSubjectFilter}
                onChange={(e) => setQSubjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50"
              >
                <option value="All">All Subjects</option>
                {allSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              <select
                value={qGradeFilter}
                onChange={(e) => setQGradeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50"
              >
                <option value="All">All Grades</option>
                {activeCurriculumGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Questions Accessible to {currentUser.schoolName || 'Your School'}
                </h3>
                <p className="text-xs text-stone-500">
                  Showing {filteredQuestions.length} of {accessibleQuestions.length} Items ({accessibleQuestions.filter(q => q.isCustom).length} Custom School Questions)
                </p>
              </div>

              <button
                onClick={() => setShowCreateQuestionModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Author Custom Question</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Item ID</th>
                    <th className="p-4">Subject & Grade</th>
                    <th className="p-4">Region & Curriculum</th>
                    <th className="p-4">Question Prompt & Clipart</th>
                    <th className="p-4">Correct Answer</th>
                    <th className="p-4">Skill & Category</th>
                    <th className="p-4">Access Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-stone-50/70">
                      <td className="p-4 font-mono font-bold text-stone-900">
                        {q.id}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-stone-900 block">{q.subject}</span>
                        <span className="text-[11px] text-stone-400 font-medium">{q.grade}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-bold text-stone-800">
                          <Globe className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{q.country || 'Global'}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 block truncate max-w-[150px]">
                          {q.state && q.state !== 'National Standard / All States' ? q.state : q.curriculum || 'Standard'}
                        </span>
                      </td>
                      <td className="p-4 max-w-sm">
                        <div className="font-bold text-stone-900 line-clamp-2">
                          {q.prompt}
                        </div>
                        {q.visualClipart && (
                          <div className="text-sm mt-1 bg-stone-100 p-1 rounded inline-block">
                            {q.visualClipart}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          {q.options[q.correctIndex]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-stone-800 font-bold block">{q.skill}</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider">{q.category}</span>
                      </td>
                      <td className="p-4">
                        {q.isCustom || q.schoolId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Building2 className="w-3 h-3" />
                            <span>Exclusive: {q.schoolName || 'My School'}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                            Global Master Bank
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INTERACTIVE ACTIVITIES & QUIZZES */}
      {/* ========================================================================= */}
      {activeTab === 'activities' && (
        <div className="space-y-5">
          {/* Header & Controls */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Interactive Activities & Curriculum Quizzes</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Browse, review, and assign gamified activities, sunrise quizzes, and challenges across all grade levels.
                </p>
              </div>

              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                {filteredActivities.length} Activities Found
              </span>
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-800 font-medium focus:border-amber-500 outline-none transition-all bg-stone-50/50"
                  />
                </div>

                {/* GRADE-WISE DROPDOWN */}
                <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">🎓 Grade:</span>
                  <select
                    id="teacher-grade-filter-dropdown"
                    value={activityGradeFilter}
                    onChange={(e) => setActivityGradeFilter(e.target.value)}
                    className="bg-transparent text-xs font-black text-stone-800 outline-none cursor-pointer py-1 pr-1"
                  >
                    <option value="All">🌟 All Grade Levels</option>
                    {activeCurriculumGrades.map((g) => (
                      <option key={g} value={g}>
                        {g === 'Preschool' ? '🌱 Preschool (Ages 3–4)' :
                         g === 'Foundation' ? '🧩 Foundation (Ages 4–5)' :
                         g === 'Grade 1' ? '🎒 Grade 1 (Ages 6–7)' :
                         g === 'Grade 2' ? '🚀 Grade 2 (Ages 7–8)' :
                         g === 'Grade 3' ? '🌟 Grade 3 (Ages 8–9)' :
                         g === 'Grade 4' ? '⚡ Grade 4 (Ages 9–10)' :
                         g === 'Grade 5' ? '🏆 Grade 5 (Ages 10–11)' :
                         g === 'Grade 6' ? '👑 Grade 6 (Ages 11–12)' : `🎓 ${g}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SUBJECT DROPDOWN */}
                <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">📚 Subject:</span>
                  <select
                    value={activitySubjectFilter}
                    onChange={(e) => setActivitySubjectFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer py-1 pr-1"
                  >
                    <option value="All">All Subjects</option>
                    {allSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* FORMAT DROPDOWN */}
                <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">⚡ Type:</span>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer py-1 pr-1"
                  >
                    <option value="All">All Formats</option>
                    <option value="daily_quiz">🌅 Daily Sunrise Quiz</option>
                    <option value="game">🎈 Mini Games</option>
                    <option value="challenge">⚡ Time Challenges</option>
                    <option value="boss_battle">⚔️ Boss Battles</option>
                  </select>
                </div>
              </div>

              {/* Reset Filters */}
              {(activityGradeFilter !== 'All' || activitySubjectFilter !== 'All' || activityTypeFilter !== 'All' || activitySearchQuery) && (
                <button
                  onClick={() => {
                    setActivityGradeFilter('All');
                    setActivitySubjectFilter('All');
                    setActivityTypeFilter('All');
                    setActivitySearchQuery('');
                  }}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* GRADE-WISE QUICK BAR (Pills with emojis) */}
            <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-stone-400" />
                <span>Grade Focus:</span>
              </span>

              <button
                onClick={() => setActivityGradeFilter('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activityGradeFilter === 'All'
                    ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/70'
                }`}
              >
                <span>🌟 All Grades</span>
              </button>

              {activeCurriculumGrades.map((g) => {
                const label = 
                  g === 'Preschool' ? '🌱 Preschool' :
                  g === 'Foundation' ? '🧩 Foundation' :
                  g === 'Grade 1' ? '🎒 Grade 1' :
                  g === 'Grade 2' ? '🚀 Grade 2' :
                  g === 'Grade 3' ? '🌟 Grade 3' :
                  g === 'Grade 4' ? '⚡ Grade 4' :
                  g === 'Grade 5' ? '🏆 Grade 5' :
                  g === 'Grade 6' ? '👑 Grade 6' : g;
                return (
                  <button
                    key={g}
                    onClick={() => setActivityGradeFilter(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      activityGradeFilter === g
                        ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/70'
                    }`}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((act) => {
              const qCount = act.questionIds?.length || 0;
              const actGrade = act.grade || 'All Grades';
              const gradeBadgeClass = 
                actGrade === 'Preschool' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                actGrade === 'Foundation' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                actGrade === 'Grade 1' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                actGrade === 'Grade 2' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                actGrade === 'Grade 3' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                actGrade === 'Grade 4' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                actGrade === 'Grade 5' ? 'bg-orange-50 text-orange-800 border-orange-200' :
                actGrade === 'Grade 6' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                'bg-stone-100 text-stone-700 border-stone-200';

              const gradeEmoji = 
                actGrade === 'Preschool' ? '🌱' :
                actGrade === 'Foundation' ? '🧩' :
                actGrade === 'Grade 1' ? '🎒' :
                actGrade === 'Grade 2' ? '🚀' :
                actGrade === 'Grade 3' ? '🌟' :
                actGrade === 'Grade 4' ? '⚡' :
                actGrade === 'Grade 5' ? '🏆' : 
                actGrade === 'Grade 6' ? '👑' : '🌟';

              return (
                <div 
                  key={act.id} 
                  className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Grade Badge & Format Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border flex items-center gap-1 shadow-2xs ${gradeBadgeClass}`}>
                        <span>{gradeEmoji}</span>
                        <span>{actGrade}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 uppercase tracking-wider">
                          {act.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-50 border border-stone-200 text-stone-500">
                          {act.id}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                        {act.subject}
                      </div>
                      <h3 className="text-sm font-black text-stone-900 leading-snug">{act.title}</h3>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>

                    {act.type === 'boss_battle' && act.bossName && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{act.bossAvatar || '👾'}</span>
                          <span>{act.bossName}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-700">{act.bossHp || 500} HP</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium text-stone-600">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        <Sparkles className="w-3 h-3" />
                        <span>+{act.rewardXP || 100} XP</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
                        <Coins className="w-3 h-3" />
                        <span>+{act.rewardCoins || 20} Coins</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        <Clock className="w-3 h-3" />
                        <span>{act.durationMinutes || 10}m</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        <BookOpen className="w-3 h-3" />
                        <span>{qCount} Questions</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 uppercase font-bold">
                      Recurrence: {act.recurrence || 'daily'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE CLASS (Includes Preschool & Foundation) */}
      {/* ========================================================================= */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Create New Classroom</h3>
              <button onClick={() => setShowCreateClassModal(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Preschool Early Explorers or Grade 3-B"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
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
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold"
                  >
                    {activeCurriculumGrades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section A"
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-500 text-[11px]">
                ℹ️ You ({currentUser.name}) will be designated as the Lead Faculty Teacher for this new classroom.
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer"
                >
                  Save Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ENROLL STUDENT (Includes Preschool & Foundation) */}
      {/* ========================================================================= */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900">Enroll Student</h3>
              <button onClick={() => setShowCreateStudentModal(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leo Henderson"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Enrolling in Class
                </label>
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-stone-800">
                  {currentClass?.name} ({currentClass?.grade})
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Grade Level
                </label>
                <select
                  value={newStudentGrade}
                  onChange={(e) => setNewStudentGrade(e.target.value as GradeLevel)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-bold"
                >
                  {enrollmentGrades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  4-Digit Student Login PIN
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
                ℹ️ The student will be given a secure Username (e.g. <strong>{generateSchoolStudentUsername(effectiveSchoolName, allUsers)}</strong>) and log in with this 4-digit PIN.
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black cursor-pointer shadow-xs"
                >
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE ASSIGNMENT (From Accessible Bank) */}
      {/* ========================================================================= */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Assign Questions to {currentClass?.name}</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Select questions from the Global Bank or your School's Custom Questions
                </p>
              </div>
              <button
                onClick={() => setShowCreateAssignmentModal(false)}
                className="text-stone-400 hover:text-stone-900 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishAssignment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Math Quest: Fractions"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Filter by Subject
                  </label>
                  <select
                    value={assignmentSubject}
                    onChange={(e) => setAssignmentSubject(e.target.value as Subject)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold"
                  >
                    {allSubjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Filter by Grade Level
                  </label>
                  <select
                    value={assignmentGrade}
                    onChange={(e) => setAssignmentGrade(e.target.value as GradeLevel)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold"
                  >
                    {activeCurriculumGrades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Questions */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions by keyword or skill..."
                  value={bankSearchQuery}
                  onChange={(e) => setBankSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              {/* Questions Picker List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 uppercase tracking-wider">
                    Select Questions ({selectedQuestionIds.length} Selected)
                  </span>
                  <span className="text-stone-400">
                    {availableQuestions.length} Questions Available
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-stone-200 rounded-2xl divide-y divide-stone-100 p-1">
                  {availableQuestions.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      No questions found matching this subject and grade level.
                    </div>
                  ) : (
                    availableQuestions.map((q) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestionSelection(q.id)}
                          className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition ${
                            isSelected ? 'bg-emerald-50 text-emerald-950' : 'hover:bg-stone-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[10px] text-stone-500">{q.id}</span>
                              <span className="font-bold text-stone-800">{q.skill}</span>
                              {q.isCustom && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                  School Custom
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-700 mt-0.5">{q.prompt}</p>
                          </div>
                          <span className="font-mono text-stone-400 text-[10px] shrink-0">{q.points} XP</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-stone-500 font-bold">
                  {selectedQuestionIds.length} questions will be assigned to {currentClass?.name}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateAssignmentModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedQuestionIds.length === 0}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                  >
                    Publish Assignment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: AUTHOR SCHOOL CUSTOM QUESTION (Exclusive to this school) */}
      {/* ========================================================================= */}
      {showCreateQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-6 space-y-4 text-xs my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-base">
                  ✍️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Author School Custom Question</h3>
                  <span className="text-[10px] text-blue-700 font-bold">
                    🔒 Scoped Exclusively to {effectiveSchoolName}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowCreateQuestionModal(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer p-1">✕</button>
            </div>

            <form onSubmit={handleCreateCustomQuestion} className="space-y-3.5">
              {/* Region & Curriculum Auto-Inherited Scope from School */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                      🏫
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-900 uppercase">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>Curriculum Scope (Auto-Inherited from {effectiveSchoolName})</span>
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-bold">{customCountry}</span>
                        <span>•</span>
                        <span>{customState}</span>
                        <span>•</span>
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-900 font-bold">
                          {customCurriculum}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRegionOverride(!showRegionOverride)}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:text-slate-950 bg-white rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    {showRegionOverride ? 'Hide Custom' : 'Override Scope'}
                  </button>
                </div>

                {showRegionOverride && (
                  <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-stone-600 uppercase mb-0.5">Country</label>
                      <select
                        value={customCountry}
                        onChange={(e) => {
                          const newC = e.target.value;
                          setCustomCountry(newC);
                          const states = COUNTRY_STATE_MAP[newC] || ['National Standard / All States'];
                          setCustomState(states[0] || 'National Standard / All States');
                          const currs = COUNTRY_CURRICULUM_MAP[newC] || ['Standard / Global'];
                          setCustomCurriculum(currs[0] || 'Standard / Global');
                        }}
                        className="w-full p-1.5 rounded-xl border border-stone-200 bg-white font-bold text-xs"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-stone-600 uppercase mb-0.5">State / Province</label>
                      <select
                        value={customState}
                        onChange={(e) => setCustomState(e.target.value)}
                        className="w-full p-1.5 rounded-xl border border-stone-200 bg-white font-bold text-xs"
                      >
                        {(COUNTRY_STATE_MAP[customCountry] || ['National Standard / All States']).map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-stone-600 uppercase mb-0.5">Curriculum</label>
                      <select
                        value={customCurriculum}
                        onChange={(e) => setCustomCurriculum(e.target.value)}
                        className="w-full p-1.5 rounded-xl border border-stone-200 bg-white font-bold text-xs"
                      >
                        {(COUNTRY_CURRICULUM_MAP[customCountry] || ['Standard / Global']).map((curr) => (
                          <option key={curr} value={curr}>{curr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Subject</label>
                  <select
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value as Subject)}
                    className="w-full p-2 rounded-xl border border-stone-200 font-bold text-xs"
                  >
                    {allSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Grade Level</label>
                  <select
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value as GradeLevel)}
                    className="w-full p-2 rounded-xl border border-stone-200 font-bold text-xs"
                  >
                    {activeCurriculumGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Category / Topic</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                    placeholder="e.g. Basic Counting or Addition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Skill Specific Standard</label>
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                    placeholder="e.g. Adding Numbers to 10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Question Prompt</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-xl border border-stone-200 text-xs font-medium"
                  placeholder="Enter kid-friendly question text..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                  Visual Clipart / Icons (Optional, e.g. for Preschool/Foundation)
                </label>
                <input
                  type="text"
                  value={customClipart}
                  onChange={(e) => setCustomClipart(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                  placeholder="e.g. 🐶 🐶 + 🐶"
                />
              </div>

              {/* 4 Choices */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-600 uppercase">
                  Multiple Choice Options (Select radio for correct answer)
                </label>
                {[
                  { val: customOpt0, set: setCustomOpt0, idx: 0, label: 'Option A' },
                  { val: customOpt1, set: setCustomOpt1, idx: 1, label: 'Option B' },
                  { val: customOpt2, set: setCustomOpt2, idx: 2, label: 'Option C' },
                  { val: customOpt3, set: setCustomOpt3, idx: 3, label: 'Option D' },
                ].map((item) => (
                  <div key={item.idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="customCorrectChoice"
                      checked={customCorrectIdx === item.idx}
                      onChange={() => setCustomCorrectIdx(item.idx)}
                      className="cursor-pointer"
                    />
                    <span className="font-mono font-bold text-stone-400 w-16">{item.label}:</span>
                    <input
                      type="text"
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      placeholder={`Choice ${item.label}`}
                      className="flex-1 p-2 rounded-xl border border-stone-200 text-xs"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Pedagogical Explanation</label>
                  <input
                    type="text"
                    value={customExplanation}
                    onChange={(e) => setCustomExplanation(e.target.value)}
                    placeholder="Explanation for students..."
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Helpful Hint</label>
                  <input
                    type="text"
                    value={customHint}
                    onChange={(e) => setCustomHint(e.target.value)}
                    placeholder="Hint if child gets stuck..."
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Difficulty</label>
                  <select
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">XP Points Value</label>
                  <input
                    type="number"
                    value={customPoints}
                    onChange={(e) => setCustomPoints(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                    min={5}
                    max={100}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateQuestionModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black cursor-pointer shadow-xs"
                >
                  Save to School Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAILED STUDENT REPORT CARD */}
      {/* ========================================================================= */}
      {selectedReportStudent && (
        <StudentReportCardModal
          student={selectedReportStudent}
          userAccount={allUsers.find(u => u.id === selectedReportStudent.studentId)}
          className={currentClass?.name}
          section={currentClass?.section}
          room={currentClass?.room}
          teacherName={currentUser.name}
          principalName={linkedSchool?.name ? `Principal / Academic Dean (${linkedSchool.name})` : undefined}
          parentName={selectedReportStudent.parentName || allUsers.find(u => u.id === selectedReportStudent.studentId)?.parentName}
          schoolName={effectiveSchoolName}
          onClose={() => setSelectedReportStudent(null)}
          viewerRole="teacher"
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: RESET STUDENT PIN */}
      {/* ========================================================================= */}
      {resettingUser && onResetCredentials && (
        <ResetCredentialsModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSaveCredentials={(userId, newSecret, isPin, newUsername) => {
            onResetCredentials(userId, newSecret, isPin, newUsername);
            setNotification(`PIN for ${resettingUser.name} has been reset to: ${newSecret}`);
            setTimeout(() => setNotification(''), 4000);
          }}
        />
      )}
      {/* ========================================================================= */}
      {/* MODAL 7: EDIT USER / STUDENT / TEACHER PROFILE MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <EditUserProfileModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onSave={(updatedUser) => {
            onUpdateUserProfile?.(updatedUser);
            setNotification(`Profile details updated for ${updatedUser.name}!`);
            setTimeout(() => setNotification(''), 4000);
          }}
          availableGrades={activeCurriculumGrades}
          canEditStatus={false}
        />
      )}
    </div>
  );
}
