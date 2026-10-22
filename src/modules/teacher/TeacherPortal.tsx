import React, { useState, useEffect, useMemo, FormEvent } from 'react';
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
  AlertCircle,
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
  Coins,
  ArrowRightLeft,
  Eye,
  Edit2,
  Trash2,
  X,
  ClipboardList,
  BarChart2,
  Gamepad2,
  LayoutGrid
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { getNextQuestionId, getSchoolPrefix, generateSchoolStudentUsername, getNextRoleId } from '../../utils/idAndUsernameGenerator';
import { COUNTRIES, COUNTRY_STATE_MAP, COUNTRY_CURRICULUM_MAP } from '../../data/curriculumData';
import StudentReportCardModal from '../student/StudentReportCardModal';
import ResetCredentialsModal from '../auth/ResetCredentialsModal';
import EditUserProfileModal from '../admin/components/EditUserProfileModal';
import EditStudentModal from '../school/components/EditStudentModal';
import QuestionEditModal from '../admin/components/QuestionEditModal';
import QuestionPreviewModal from '../admin/components/QuestionPreviewModal';
import StudentAssignmentReviewModal from './components/StudentAssignmentReviewModal';
import ActivityPlayerModal from '../activities/ActivityPlayerModal';
import { ClipartText } from '../../common/ClipartRenderer';
import { loadCurriculumMaster } from '../../data/curriculumMasterData';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { PortalShell } from '../../common';
import { PortalMenuItem } from '../../common/PortalShell';
import TeacherMockupDashboard from './components/TeacherMockupDashboard';

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
  onUpdateClass?: (cls: ClassRoom) => void;
  onAddStudent: (student: UserAccount, progress: StudentProgress) => void;
  onCreateAssignment: (assignment: ClassAssignment) => void;
  onAddQuestion?: (q: Question) => void;
  onEditQuestion?: (q: Question) => void;
  onDeleteQuestion?: (questionId: string) => void;
  onResetCredentials?: (userId: string, newSecret: string, isPin: boolean, newUsername?: string) => void;
  onUpdateUserProfile?: (user: UserAccount) => void;
  onUpdateStudentProgress?: (progress: StudentProgress) => void;
  onSelectUser?: (user: UserAccount) => void;
  onNavigateHome?: () => void;
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
  onUpdateClass,
  onAddStudent,
  onCreateAssignment,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onResetCredentials,
  onUpdateUserProfile,
  onUpdateStudentProgress,
  onSelectUser,
  onNavigateHome
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

  // Strict isolation: ONLY classes explicitly assigned to this teacher as Primary Lead or Secondary Co-Teacher
  const teacherClasses = classes.filter((cls) => 
    cls.teacherId === currentUser.id ||
    cls.secondaryTeacherId === currentUser.id ||
    cls.teacherName === currentUser.name ||
    cls.secondaryTeacherName === currentUser.name
  );

  // Strict scope isolation: Only grades and subjects from teacher's assigned classes are accessible
  const assignedClassGrades: GradeLevel[] = Array.from(new Set(
    teacherClasses.map((c) => c.grade).filter(Boolean)
  ));
  const effectiveTeacherGrades: GradeLevel[] = assignedClassGrades.length > 0
    ? assignedClassGrades
    : (currentUser.grade ? [currentUser.grade as GradeLevel] : ['Grade 1']);

  const assignedClassSubjects: Subject[] = Array.from(new Set(
    teacherClasses.flatMap((c) => (c.subjects && c.subjects.length > 0 ? c.subjects : [c.subject || 'Mathematics'])).filter(Boolean)
  ));
  const effectiveTeacherSubjects: Subject[] = assignedClassSubjects.length > 0
    ? assignedClassSubjects
    : ['Mathematics'];

  // Keep activeCurriculumGrades aligned with assigned grades for teacher profile
  const activeCurriculumGrades: GradeLevel[] = effectiveTeacherGrades;
  const enrollmentGrades: GradeLevel[] = effectiveTeacherGrades;

  const [selectedClassId, setSelectedClassId] = useState<string>(teacherClasses[0]?.id || '');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Automatically update selectedClassId if current selection is invalid or classes change
  useEffect(() => {
    if (teacherClasses.length > 0 && (!selectedClassId || !teacherClasses.some(c => c.id === selectedClassId))) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClassId]);

  // Modals
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [selectedEditQuestion, setSelectedEditQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [selectedReportStudent, setSelectedReportStudent] = useState<StudentProgress | null>(null);
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState<ClassAssignment | null>(null);
  const [assignmentSubmissionFilter, setAssignmentSubmissionFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editingStudentData, setEditingStudentData] = useState<{ student: StudentProgress; user?: UserAccount } | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<{
    student: StudentProgress;
    assignment: ClassAssignment;
    attempt: any;
    correctAnswers: number;
    totalQuestions: number;
    percentage: number;
  } | null>(null);
  const [previewingActivity, setPreviewingActivity] = useState<Activity | null>(null);

  // Lock body scroll while any teacher modal is open
  useBodyScrollLock(Boolean(
    showCreateClassModal || 
    showCreateStudentModal || 
    showCreateAssignmentModal || 
    showCreateQuestionModal || 
    selectedEditQuestion ||
    previewQuestion ||
    selectedReportStudent || 
    selectedAssignmentDetails ||
    reviewingSubmission ||
    previewingActivity ||
    resettingUser || 
    editingUser ||
    editingStudentData
  ));

  // School Curriculum & Country IDs for Standard Master Question Creator
  const cm = useMemo(() => loadCurriculumMaster(), []);
  const schoolCountryId = useMemo(() => {
    const matched = cm.countries.find(
      c => c.name.toLowerCase() === effectiveCountry.toLowerCase() || c.id === effectiveCountry
    );
    return matched?.id || 'CNT-US';
  }, [cm, effectiveCountry]);

  const schoolCurriculumId = useMemo(() => {
    const matched = cm.curricula.find(
      c => c.name.toLowerCase() === effectiveCurriculum.toLowerCase() || 
           c.id === effectiveCurriculum ||
           c.description.toLowerCase().includes(effectiveCurriculum.toLowerCase())
    );
    return matched?.id || 'CUR-CCSS';
  }, [cm, effectiveCurriculum]);

  // Class Form State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<GradeLevel>(() => effectiveTeacherGrades[0] || 'Grade 1');
  const [newClassSection, setNewClassSection] = useState('');
  const [newClassRoom, setNewClassRoom] = useState('');

  // Student Form State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState<GradeLevel>(() => effectiveTeacherGrades[0] || 'Grade 1');
  const [newStudentPin, setNewStudentPin] = useState('7392');

  // Assignment from Question Bank Form State
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentSubject, setAssignmentSubject] = useState<Subject>(() => effectiveTeacherSubjects[0] || 'Mathematics');
  const [assignmentGrade, setAssignmentGrade] = useState<GradeLevel>(() => effectiveTeacherGrades[0] || 'Grade 1');
  const [assignmentDueDate, setAssignmentDueDate] = useState('2025-04-25');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [bankSearchQuery, setBankSearchQuery] = useState('');

  // Question Bank Tab Filters (Region/Curriculum is fixed to school registration; only assigned subject/grade filters)
  const [qSubjectFilter, setQSubjectFilter] = useState<string>('All');
  const [qGradeFilter, setQGradeFilter] = useState<string>('All');
  const [qSearchQuery, setQSearchQuery] = useState<string>('');
  const [qScopeFilter, setQScopeFilter] = useState<'all' | 'custom' | 'global'>('all');

  // Interactive Activities Tab Filters
  const [activityGradeFilter, setActivityGradeFilter] = useState<string>('All');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState<string>('All');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('All');
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');

  const [notification, setNotification] = useState('');
  const [errorNotification, setErrorNotification] = useState('');

  const currentClass = teacherClasses.find((c) => c.id === selectedClassId) || teacherClasses[0];

  // Filtered Interactive Activities strictly restricted to teacher's assigned grades and subjects
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const isAssignedGrade = !act.grade || effectiveTeacherGrades.includes(act.grade as GradeLevel);
      const isAssignedSubject = !act.subject || effectiveTeacherSubjects.includes(act.subject as Subject);
      if (!isAssignedGrade || !isAssignedSubject) return false;

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
  }, [activities, activityGradeFilter, activitySubjectFilter, activityTypeFilter, activitySearchQuery, effectiveTeacherGrades, effectiveTeacherSubjects]);

  // Strict isolation: Students belonging to this teacher's active assigned class
  const classStudents = students.filter((s) => {
    if (!currentClass) return false;
    if (currentClass.studentIds?.includes(s.studentId)) return true;
    const isSameSchool =
      (effectiveSchoolName && s.schoolName && s.schoolName.toLowerCase().trim() === effectiveSchoolName.toLowerCase().trim()) ||
      (currentUser.schoolName && s.schoolName && s.schoolName.toLowerCase().trim() === currentUser.schoolName.toLowerCase().trim());
    if (!isSameSchool) return false;
    return s.grade === currentClass.grade;
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

  // School Custom Questions strictly belonging to this school
  const schoolCustomQuestions = useMemo(() => {
    return accessibleQuestions.filter((q) => Boolean(q.isCustom || q.schoolId === mySchoolId));
  }, [accessibleQuestions, mySchoolId]);

  // Filtered list for the Question Bank Tab strictly restricted to School's fixed region/curriculum AND teacher's assigned grades & subjects
  const filteredQuestions = accessibleQuestions.filter((q) => {
    const isSchoolCustom = Boolean(q.isCustom || q.schoolId === mySchoolId);

    // 1. Scope filter (All, School Custom Only, Global Master)
    if (qScopeFilter === 'custom' && !isSchoolCustom) return false;
    if (qScopeFilter === 'global' && isSchoolCustom) return false;

    // 2. School standards isolation:
    // Custom school questions are authored specifically for this school, so they always belong to this school's standards!
    if (!isSchoolCustom) {
      const matchCountry = !q.country || q.country === 'Global' || q.country === effectiveCountry;
      const matchState = !q.state || q.state === 'National Standard / All States' || q.state === effectiveState;
      const matchCurriculum = !q.curriculum || q.curriculum === effectiveCurriculum;
      if (!matchCountry || !matchState || !matchCurriculum) return false;
    }

    // 3. Subject strictly restricted to teacher's assigned subjects
    const isSubjectAssigned = effectiveTeacherSubjects.includes(q.subject);
    if (!isSubjectAssigned) return false;
    const matchSub = qSubjectFilter === 'All' || q.subject === qSubjectFilter;

    // 4. Grade strictly restricted to teacher's assigned grades
    const isGradeAssigned = effectiveTeacherGrades.includes(q.grade as GradeLevel);
    if (!isGradeAssigned) return false;
    const matchGrd = qGradeFilter === 'All' || q.grade === qGradeFilter;

    // 5. Search query (id, prompt, skill, category)
    const matchQuery = qSearchQuery === '' || 
      (q.id || '').toLowerCase().includes(qSearchQuery.toLowerCase()) ||
      (q.prompt || '').toLowerCase().includes(qSearchQuery.toLowerCase()) ||
      (q.skill || '').toLowerCase().includes(qSearchQuery.toLowerCase()) ||
      (q.category || '').toLowerCase().includes(qSearchQuery.toLowerCase());

    return matchSub && matchGrd && matchQuery;
  });

  // Questions available for assignment creation (must match assigned subject & grade)
  const availableQuestions = accessibleQuestions.filter((q) => {
    const matchSub = q.subject === assignmentSubject;
    const matchGrd = q.grade === assignmentGrade;
    const matchQuery = bankSearchQuery === '' || 
      q.id.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      q.prompt.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      q.skill.toLowerCase().includes(bankSearchQuery.toLowerCase());
    return matchSub && matchGrd && matchQuery;
  });

  const allSubjects: Subject[] = effectiveTeacherSubjects;

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
      xp: 0,
      coins: 0,
      streakDays: 0,
      dailyQuizCompletedToday: false,
      totalQuizzesTaken: 0,
      averageScore: 0,
      subjectMastery: {},
      recentActivities: [],
      badges: []
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
      setErrorNotification('Please provide an assignment title and select at least 1 question.');
      setTimeout(() => setErrorNotification(''), 5000);
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

  // Handle Save / Update / Delete School Custom Questions (Master Standardized Creator)
  const handleSaveCustomQuestion = (newQ: Question) => {
    const finalQuestion: Question = {
      ...newQ,
      schoolId: mySchoolId,
      schoolName: effectiveSchoolName,
      country: effectiveCountry,
      state: effectiveState,
      curriculum: effectiveCurriculum,
      category: newQ.category || 'General Practice',
      skill: newQ.skill || 'Problem Solving',
      createdBy: currentUser.id,
      creatorName: currentUser.name,
      createdRole: 'teacher',
      isCustom: true
    };

    sounds.playCorrect();
    if (onAddQuestion) {
      onAddQuestion(finalQuestion);
    }
    setShowCreateQuestionModal(false);
    setActiveTab('questions');
    setQScopeFilter('custom');
    setNotification(`Custom question ${finalQuestion.id} saved! Category: "${finalQuestion.category}" • Skill: "${finalQuestion.skill}". Scoped exclusively to ${effectiveSchoolName}.`);
    setTimeout(() => setNotification(''), 4500);
  };

  const handleUpdateCustomQuestion = (updatedQ: Question) => {
    const finalQuestion: Question = {
      ...updatedQ,
      schoolId: mySchoolId,
      schoolName: effectiveSchoolName,
      country: effectiveCountry,
      state: effectiveState,
      curriculum: effectiveCurriculum,
      category: updatedQ.category || 'General Practice',
      skill: updatedQ.skill || 'Problem Solving',
      isCustom: true
    };

    sounds.playCorrect();
    if (onEditQuestion) {
      onEditQuestion(finalQuestion);
    }
    setSelectedEditQuestion(null);
    setNotification(`Custom question ${finalQuestion.id} successfully updated! Category: "${finalQuestion.category}" • Skill: "${finalQuestion.skill}".`);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleDeleteCustomQuestion = (qId: string) => {
    if (window.confirm(`Are you sure you want to delete custom question ${qId}?`)) {
      if (onDeleteQuestion) {
        onDeleteQuestion(qId);
        sounds.click();
        setNotification(`Custom question ${qId} removed.`);
        setTimeout(() => setNotification(''), 4000);
      }
    }
  };

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const teacherMenuItems: PortalMenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'classes', label: 'My Classes', icon: Layers, badge: teacherClasses.length },
    { id: 'assignments', label: 'Assignments', icon: FileText, badge: assignments.length },
    { id: 'questions', label: 'Question Bank', icon: BookOpen },
    { id: 'progress', label: 'Student Progress', icon: BarChart2 },
    { id: 'reports', label: 'Reports', icon: Award },
    { id: 'resources', label: 'Resources', icon: Gamepad2 },
    { id: 'settings', label: 'Settings', icon: Edit3 }
  ];

  return (
    <PortalShell
      currentUser={currentUser}
      allUsers={allUsers}
      portalRoleTitle="Teacher Portal"
      menuItems={teacherMenuItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchPlaceholder="Search students, assignments, or topics..."
      onSelectUser={onSelectUser}
      onNavigateHome={onNavigateHome}
      onOpenUserProfile={() => setEditingUser(currentUser)}
      footerVariant="teacher"
    >
      {activeTab === 'dashboard' ? (
        <TeacherMockupDashboard
          currentUser={currentUser}
          classes={teacherClasses}
          assignments={assignments}
          students={students}
          onNavigateTab={setActiveTab}
          onOpenCreateAssignment={() => {
            setActiveTab('assignments');
            setShowCreateAssignmentModal(true);
          }}
          onSelectClass={(clsId) => setSelectedClassId(clsId)}
        />
      ) : (
        <div className="space-y-6">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1e6f47] hover:bg-[#165636] text-white font-bold text-xs transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Class</span>
          </button>
          <button
            onClick={() => {
              if (teacherClasses.length === 0) {
                setErrorNotification('No classroom is assigned to you yet. Please wait for your school administrator to assign you to a classroom first.');
                setTimeout(() => setErrorNotification(''), 5000);
                return;
              }
              if (currentClass?.grade) setNewStudentGrade(currentClass.grade);
              setNewStudentPin(String(Math.floor(1000 + Math.random() * 9000)));
              setShowCreateStudentModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e6f4ea] text-[#1e6f47] border border-emerald-300/80 hover:bg-[#d8edd9] font-bold text-xs transition-all shadow-xs cursor-pointer hover:scale-102 active:scale-98"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>
          <button
            onClick={() => setShowCreateQuestionModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-800 border border-slate-200 hover:border-emerald-300 hover:bg-[#e6f4ea]/40 text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95"
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

      {/* Error Notification Banner */}
      {errorNotification && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorNotification}</span>
        </div>
      )}

      {/* Teacher Metric Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            🎒
          </div>
          <div>
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Class Students</div>
            <div className="text-xl font-black text-stone-900">{classStudents.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            📋
          </div>
          <div>
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Assignments</div>
            <div className="text-xl font-black text-stone-900">{classAssignments.length}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab('questions');
            setQScopeFilter('custom');
          }}
          className="bg-white p-4 rounded-2xl border border-stone-200 hover:border-blue-400 shadow-xs flex items-center justify-between text-left transition cursor-pointer group hover:bg-blue-50/30"
          title="Click to view all school custom questions"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
              🏫
            </div>
            <div>
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">School Custom</div>
              <div className="text-xl font-black text-blue-700">{schoolCustomQuestions.length}</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
            View →
          </span>
        </button>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            🔒
          </div>
          <div className="overflow-hidden">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Academic Standard</div>
            <div className="text-xs font-black text-stone-900 truncate" title={`${effectiveCountry} • ${effectiveCurriculum}`}>
              {effectiveCountry}
            </div>
            <span className="text-[10px] text-purple-700 font-bold block truncate" title={effectiveCurriculum}>
              {effectiveCurriculum}
            </span>
          </div>
        </div>
      </div>

      {/* Active Classroom Selector & Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Class switcher buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Assigned Classes:
          </span>
          {teacherClasses.length === 0 ? (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-bold">
              ⚠️ No classrooms assigned yet by school administrator
            </span>
          ) : (
            teacherClasses.map((cls) => {
              const isSelected = cls.id === currentClass?.id;
              const isPrimary = cls.teacherId === currentUser.id || cls.teacherName === currentUser.name;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    sounds.playCorrect();
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#1e6f47] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-[#e6f4ea]/40'
                  }`}
                >
                  <span>{cls.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    isPrimary 
                      ? (isSelected ? 'bg-emerald-400/30 text-white' : 'bg-emerald-100 text-emerald-800')
                      : (isSelected ? 'bg-purple-400/30 text-white' : 'bg-purple-100 text-purple-800')
                  }`}>
                    {isPrimary ? 'Lead' : 'Co-Teacher'}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#1e6f47] border border-slate-200'
                  }`}>
                    {cls.grade}
                  </span>
                  {cls.section && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-emerald-700'
                    }`}>
                      {cls.section}
                    </span>
                  )}
                  {cls.room && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono opacity-80 ${
                      isSelected ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      🚪 {cls.room}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* View Tabs */}
        <div className="bg-slate-100/90 p-1.5 rounded-full border border-slate-200/80 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-[#e6f4ea] text-[#1e6f47] border border-emerald-300/80 shadow-xs font-black'
                : 'text-slate-600 hover:text-[#1e6f47] hover:bg-white/60'
            }`}
          >
            🎒 Students ({classStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-[#e6f4ea] text-[#1e6f47] border border-emerald-300/80 shadow-xs font-black'
                : 'text-slate-600 hover:text-[#1e6f47] hover:bg-white/60'
            }`}
          >
            📋 Assignments ({classAssignments.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-[#e6f4ea] text-[#1e6f47] border border-emerald-300/80 shadow-xs font-black'
                : 'text-slate-600 hover:text-[#1e6f47] hover:bg-white/60'
            }`}
          >
            📚 Question Bank ({accessibleQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-[#e6f4ea] text-[#1e6f47] border border-emerald-300/80 shadow-xs font-black'
                : 'text-slate-600 hover:text-[#1e6f47] hover:bg-white/60'
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
        <div className="space-y-6">
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
                  <th className="p-4 font-semibold">Homework Done</th>
                  <th className="p-4 font-semibold">Student PIN</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {classStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-stone-400 font-medium">
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
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-stone-900">{currentClass?.name || s.grade}</span>
                            <button
                              type="button"
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
                                setEditingStudentData({ student: s, user: targetUser });
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-600 text-[10px] font-bold border border-stone-200 transition cursor-pointer"
                              title="Change assigned class or promote grade"
                            >
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              <span>Reassign</span>
                            </button>
                          </div>
                          <div className="text-[10px] text-stone-500 font-medium">Mapped Grade: {s.grade}</div>
                        </td>
                        <td className="p-4">
                          {(() => {
                            const hasAttempt = (s.totalQuizzesTaken || 0) > 0 || (Array.isArray(s.recentActivities) && s.recentActivities.length > 0);
                            return hasAttempt ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {s.averageScore}%
                              </span>
                            ) : (
                              <span className="font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200 text-xs">
                                Not Evaluated
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-4 font-medium text-stone-900">
                          {((s.totalQuizzesTaken || 0) > 0 || (Array.isArray(s.recentActivities) && s.recentActivities.length > 0)) ? `${s.totalQuizzesTaken || s.recentActivities?.length || 0} Quizzes` : '0 Quizzes'}
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-700">
                          +{((s.totalQuizzesTaken || 0) > 0 || (Array.isArray(s.recentActivities) && s.recentActivities.length > 0)) ? s.xp : 0} XP
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-orange-600">
                            🔥 {((s.totalQuizzesTaken || 0) > 0 || (Array.isArray(s.recentActivities) && s.recentActivities.length > 0)) ? s.streakDays : 0}d
                          </span>
                        </td>
                        <td className="p-4">
                          {(() => {
                            const doneCount = classAssignments.filter(asg => 
                              s.recentActivities?.some(act => act.id === asg.id || act.title.trim().toLowerCase() === asg.title.trim().toLowerCase())
                            ).length;
                            const totalAsg = classAssignments.length;
                            return (
                              <button
                                type="button"
                                onClick={() => setActiveTab('assignments')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                                  totalAsg > 0 && doneCount === totalAsg
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : doneCount > 0
                                    ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                    : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                                }`}
                              >
                                {totalAsg > 0 && doneCount === totalAsg ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-stone-400" />
                                )}
                                <span>{doneCount} / {totalAsg} Done</span>
                              </button>
                            );
                          })()}
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
                                setEditingStudentData({ student: s, user: targetUser });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Edit Student, Promote Grade & Reassign Class"
                            >
                              <Edit3 className="w-3 h-3 text-blue-600" />
                              <span>Edit & Reassign</span>
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

        {/* School Custom Questions Dashboard Card (Visible on Teacher's Main Dashboard) */}
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs mt-6">
          <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 via-white to-blue-50/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1e6f47] text-white flex items-center justify-center font-bold text-lg shadow-2xs">
                🏫
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900">
                    School Custom Questions ({schoolCustomQuestions.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    🔒 Exclusive to {effectiveSchoolName}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Questions authored for your school with locked country ({effectiveCountry}) & curriculum ({effectiveCurriculum})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('questions');
                  setQScopeFilter('custom');
                }}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition cursor-pointer"
              >
                Open Full Question Bank →
              </button>
              <button
                type="button"
                onClick={() => setShowCreateQuestionModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Author Custom Question</span>
              </button>
            </div>
          </div>

          {schoolCustomQuestions.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                📝
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-800">No Custom Questions Authored Yet</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                  Custom questions let teachers create questions tailored specifically to {effectiveSchoolName}. Standards are automatically fixed to your school profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateQuestionModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Author First Custom Question</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Question ID & Type</th>
                    <th className="p-4">Subject & Grade</th>
                    <th className="p-4">Category (Topic)</th>
                    <th className="p-4">Target Skill</th>
                    <th className="p-4">Question Prompt</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {schoolCustomQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-4 font-mono font-bold text-stone-900">
                        <div>{q.id}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {(q.type || 'single_choice').replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-stone-900 block">{q.subject}</span>
                        <span className="text-[11px] text-stone-500 font-medium">{q.grade}</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                          🏷️ {q.category || 'General Practice'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                          🎯 {q.skill || 'Problem Solving'}
                        </span>
                      </td>
                      <td className="p-4 max-w-sm">
                        <div className="font-bold text-stone-900 line-clamp-2">
                          <ClipartText text={q.prompt} imageSize="xs" />
                        </div>
                        {q.visualClipart && (
                          <div className="mt-1 inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded text-[11px] text-stone-600">
                            <span className="font-bold text-stone-500">Clipart:</span>
                            <ClipartText text={q.visualClipart} imageSize="xs" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewQuestion(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer"
                            title="Live Student Preview"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Preview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedEditQuestion(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition cursor-pointer"
                            title="Edit Custom Question"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Edit</span>
                          </button>
                          {onDeleteQuestion && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomQuestion(q.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer"
                              title="Delete Custom Question"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                if (teacherClasses.length === 0) {
                  setErrorNotification('No classroom is assigned to you yet. Please wait for your school administrator to assign you to a classroom first.');
                  setTimeout(() => setErrorNotification(''), 5000);
                  return;
                }
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
                  <th className="p-4 font-semibold">Subject & Grade</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold">Class Submissions</th>
                  <th className="p-4 font-semibold">Avg Score</th>
                  <th className="p-4 font-semibold text-right">Student Gradebook</th>
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
                  classAssignments.map((a) => {
                    const totalQuestions = Math.max(1, a.questionIds.length);
                    const submissions = classStudents.map((s) => {
                      const attempt = s.recentActivities?.find(
                        (act) => act.id === a.id || act.title.trim().toLowerCase() === a.title.trim().toLowerCase()
                      );
                      const isDone = Boolean(attempt);

                      let score: number | null = null;
                      let maxScore = totalQuestions;
                      let correctAnswers: number | null = null;
                      let percentage: number | null = null;

                      if (attempt) {
                        const totalQ = totalQuestions;
                        if (typeof attempt.correctAnswers === 'number' && !isNaN(attempt.correctAnswers)) {
                          correctAnswers = Math.min(totalQ, Math.max(0, Math.round(attempt.correctAnswers)));
                        } else {
                          // Robust fallback: derive from score/maxScore ratio clamped to total questions
                          const rawMax = Math.max(1, attempt.maxScore || (totalQ * 10));
                          const safeScore = Math.min(rawMax, Math.max(0, attempt.score || 0));
                          correctAnswers = Math.min(totalQ, Math.max(0, Math.round((safeScore / rawMax) * totalQ)));
                        }

                        // Strictly calculate score as (correct_answers / total_questions) * 100 bounded [0, 100]
                        percentage = Math.min(100, Math.max(0, Math.round((correctAnswers / totalQ) * 100)));
                        score = correctAnswers;
                        maxScore = totalQ;
                      }

                      return {
                        student: s,
                        isDone,
                        score,
                        maxScore,
                        correctAnswers,
                        totalQuestions,
                        percentage,
                        timestamp: attempt?.timestamp || null,
                      };
                    });
                    const completedCount = submissions.filter((s) => s.isDone).length;
                    const pendingCount = submissions.length - completedCount;
                    const percentDone = submissions.length > 0 ? Math.round((completedCount / submissions.length) * 100) : 0;
                    const completedWithScore = submissions.filter((s) => s.isDone && s.percentage !== null);
                    const avgScore = completedWithScore.length > 0
                      ? Math.round(completedWithScore.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completedWithScore.length)
                      : null;

                    return (
                      <tr key={a.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="p-4 font-bold text-stone-950">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-stone-900">{a.title}</div>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono mt-0.5">
                                <span>{a.id}</span>
                                <span>•</span>
                                <span className="text-stone-600 font-sans font-medium">{a.questionIds.length} Questions</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-stone-900 block">{a.subject}</span>
                            <span className="px-2 py-0.5 rounded bg-stone-100 font-bold text-[10px] text-stone-700 inline-block">
                              {a.grade}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-stone-600">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>{a.dueDate}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1.5 min-w-[150px]">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className={completedCount > 0 ? 'text-emerald-700' : 'text-stone-600'}>
                                {completedCount} / {submissions.length} Students Done
                              </span>
                              <span className="text-stone-400 font-mono text-[10px]">{percentDone}%</span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/60">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  percentDone === 100 ? 'bg-emerald-500' : percentDone > 0 ? 'bg-blue-600' : 'bg-stone-300'
                                }`}
                                style={{ width: `${percentDone}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {completedCount} Done
                              </span>
                              <span className="text-stone-300">•</span>
                              <span className="flex items-center gap-1 text-amber-700 font-bold">
                                <Clock className="w-3 h-3 text-amber-600" /> {pendingCount} Pending
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {avgScore !== null ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs">
                              <Award className="w-3.5 h-3.5 text-blue-600" />
                              <span>{avgScore}%</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">Pending tests</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.click();
                              setSelectedAssignmentDetails(a);
                              setAssignmentSubmissionFilter('all');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1e6f47] hover:bg-[#165636] text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-102 active:scale-98"
                          >
                            <Users className="w-3.5 h-3.5 text-amber-300" />
                            <span>View Scores & Roster</span>
                          </button>
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

          {/* Fixed School Academic Standards (Locked to School Registration) */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                  <span>School Curriculum Standard (Fixed)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                    Immutable • School Registration Scope
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-800">{effectiveCountry}</span>
                  <span>•</span>
                  <span>{effectiveState}</span>
                  <span>•</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-bold text-[11px]">
                    {effectiveCurriculum}
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">{effectiveSchoolName} ({mySchoolId})</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200 font-bold flex items-center gap-1 shadow-2xs">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Standard Fixed to School Profile</span>
            </div>
          </div>

          {/* Teacher Assigned Subject / Grade / Search / Scope Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Scope Switch: All vs School Custom vs Global Master */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setQScopeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    qScopeFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  🌟 All Accessible ({accessibleQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQScopeFilter('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    qScopeFilter === 'custom'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  🏫 School Custom ({schoolCustomQuestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQScopeFilter('global')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    qScopeFilter === 'global'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  🌐 Global Master ({accessibleQuestions.length - schoolCustomQuestions.length})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={qSubjectFilter}
                  onChange={(e) => setQSubjectFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50"
                >
                  <option value="All">All Assigned Subjects ({effectiveTeacherSubjects.length})</option>
                  {effectiveTeacherSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>

                <select
                  value={qGradeFilter}
                  onChange={(e) => setQGradeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-stone-50"
                >
                  <option value="All">All Assigned Grades ({effectiveTeacherGrades.length})</option>
                  {effectiveTeacherGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions by prompt, category, skill, or ID..."
                value={qSearchQuery}
                onChange={(e) => setQSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs"
              />
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
                    <th className="p-4">Item ID & Type</th>
                    <th className="p-4">Subject & Grade</th>
                    <th className="p-4">Region & Curriculum</th>
                    <th className="p-4">Question Prompt & Clipart</th>
                    <th className="p-4">Correct Answer</th>
                    <th className="p-4">Skill & Category</th>
                    <th className="p-4">Access Scope</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredQuestions.map((q) => {
                    const isMulti = q.type === 'multiple_choice';
                    const typeInfo = q.type === 'multiple_choice' 
                      ? { label: 'Multiple Choice', color: 'bg-purple-50 text-purple-700 border-purple-200' }
                      : q.type === 'fill_blank' || q.type === 'open_box'
                      ? { label: 'Fill in Blank', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                      : q.type === 'true_false'
                      ? { label: 'True / False', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                      : q.type === 'image_choice'
                      ? { label: 'Image Choice', color: 'bg-pink-50 text-pink-700 border-pink-200' }
                      : q.type === 'match_making'
                      ? { label: 'Matching Pairs', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
                      : q.type === 'ordering'
                      ? { label: 'Ordering', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
                      : q.type === 'select_objects'
                      ? { label: 'Tap to Count', color: 'bg-teal-50 text-teal-700 border-teal-200' }
                      : q.type === 'drag_and_drop'
                      ? { label: 'Drag & Drop', color: 'bg-orange-50 text-orange-700 border-orange-200' }
                      : q.type === 'sorting'
                      ? { label: 'Sorting', color: 'bg-lime-50 text-lime-700 border-lime-200' }
                      : q.type === 'clock'
                      ? { label: 'Clock / Time', color: 'bg-rose-50 text-rose-700 border-rose-200' }
                      : { label: 'Single Choice', color: 'bg-blue-50 text-blue-700 border-blue-200' };

                    const isSchoolCustom = Boolean(q.isCustom || q.schoolId === mySchoolId);

                    return (
                      <tr key={q.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="p-4 font-mono font-bold text-stone-900">
                          <div>{q.id}</div>
                          <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-bold border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
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
                            <ClipartText text={q.prompt} imageSize="xs" />
                          </div>
                          {q.visualClipart && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 text-xs">
                              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Clipart:</span>
                              <ClipartText text={q.visualClipart} imageSize="xs" />
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {isMulti && q.correctIndices && q.correctIndices.length > 0 ? (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 font-bold border border-purple-200">
                              {q.correctIndices.map(idx => q.options[idx]).filter(Boolean).join(' • ')}
                            </span>
                          ) : q.type === 'match_making' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                              🔗 {q.matchPairs?.length || q.options.length} Pairs
                            </span>
                          ) : q.type === 'ordering' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 font-bold border border-cyan-200 truncate max-w-[160px]" title={q.orderSequence?.join(' → ') || q.options.join(' → ')}>
                              📊 {q.orderSequence?.join(' → ') || q.options.join(' → ')}
                            </span>
                          ) : q.type === 'fill_blank' || q.type === 'open_box' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                              ✍️ {q.openBoxAnswer || q.options[0] || 'Answer'}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                              <ClipartText text={(q.options && q.options[q.correctIndex ?? 0]) || q.options?.[0] || 'Option 1'} imageSize="xs" />
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold" title={`Category: ${q.category || 'General Practice'}`}>
                              🏷️ {q.category || 'General Practice'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold block" title={`Target Skill: ${q.skill || 'Problem Solving'}`}>
                              🎯 {q.skill || 'Problem Solving'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {isSchoolCustom ? (
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
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewQuestion(q)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition cursor-pointer"
                              title="Live Student Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Preview</span>
                            </button>
                            {isSchoolCustom && (
                              <>
                                <button
                                  onClick={() => setSelectedEditQuestion(q)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition cursor-pointer"
                                  title="Edit Custom Question"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Edit</span>
                                </button>
                                {onDeleteQuestion && (
                                  <button
                                    onClick={() => handleDeleteCustomQuestion(q.id)}
                                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] text-stone-400 uppercase font-bold">
                      {act.recurrence || 'daily'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.click();
                          setPreviewingActivity(act);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        title="Preview & play this activity"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>Preview & Play</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!currentClass) return;
                          const newAssignment: ClassAssignment = {
                            id: `ASG-${Date.now().toString().slice(-4)}`,
                            title: act.title,
                            subject: act.subject,
                            grade: act.grade,
                            classId: currentClass.id,
                            className: currentClass.name,
                            dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                            createdAt: new Date().toISOString().split('T')[0],
                            questionIds: act.questionIds || [],
                            studentIds: currentClass.studentIds || [],
                            status: 'active'
                          };
                          onCreateAssignment(newAssignment);
                          sounds.playLevelUp();
                          setNotification(`Activity "${act.title}" assigned to ${currentClass.name}!`);
                          setTimeout(() => setNotification(''), 4500);
                        }}
                        className="px-4 py-2 rounded-full bg-[#1e6f47] hover:bg-[#165636] text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-98"
                        title="Assign this activity to current class"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Assign to Class</span>
                      </button>
                    </div>
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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setShowCreateClassModal(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setShowCreateStudentModal(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setShowCreateAssignmentModal(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] overflow-y-auto overscroll-contain modal-scroll-container p-5 sm:p-8 flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
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
      {/* MASTER STANDARDIZED QUESTION EDITOR: TEACHER CREATE NEW QUESTION (100% IDENTICAL) */}
      {/* ========================================================================= */}
      {showCreateQuestionModal && (
        <QuestionEditModal
          isOpen={showCreateQuestionModal}
          mode="create"
          question={null}
          onClose={() => setShowCreateQuestionModal(false)}
          onSave={handleSaveCustomQuestion}
          availableGrades={effectiveTeacherGrades.length > 0 ? effectiveTeacherGrades : undefined}
          availableSubjects={effectiveTeacherSubjects.length > 0 ? effectiveTeacherSubjects : undefined}
          initialGrade={effectiveTeacherGrades[0] || 'Grade 1'}
          initialSubject={effectiveTeacherSubjects[0] || 'Mathematics'}
          initialCountryId={schoolCountryId}
          initialCurriculumId={schoolCurriculumId}
          existingQuestions={questions}
          lockAcademicHierarchy={true}
          schoolName={effectiveSchoolName}
          schoolId={mySchoolId}
          schoolPrefix={currentUser.schoolCode || linkedSchool?.schoolCode || schoolPrefix}
          schoolCountryName={effectiveCountry}
          schoolStateName={effectiveState}
          schoolCurriculumName={effectiveCurriculum}
        />
      )}

      {/* ========================================================================= */}
      {/* MASTER STANDARDIZED QUESTION EDITOR: TEACHER EDIT CUSTOM QUESTION (100% IDENTICAL) */}
      {/* ========================================================================= */}
      {selectedEditQuestion && (
        <QuestionEditModal
          isOpen={Boolean(selectedEditQuestion)}
          mode="edit"
          question={selectedEditQuestion}
          onClose={() => setSelectedEditQuestion(null)}
          onSave={handleUpdateCustomQuestion}
          availableGrades={effectiveTeacherGrades.length > 0 ? effectiveTeacherGrades : undefined}
          availableSubjects={effectiveTeacherSubjects.length > 0 ? effectiveTeacherSubjects : undefined}
          existingQuestions={questions}
          lockAcademicHierarchy={true}
          schoolName={effectiveSchoolName}
          schoolId={mySchoolId}
          schoolPrefix={currentUser.schoolCode || linkedSchool?.schoolCode || schoolPrefix}
          schoolCountryName={effectiveCountry}
          schoolStateName={effectiveState}
          schoolCurriculumName={effectiveCurriculum}
        />
      )}

      {/* ========================================================================= */}
      {/* LIVE STUDENT PREVIEW MODAL */}
      {/* ========================================================================= */}
      <QuestionPreviewModal
        question={previewQuestion}
        onClose={() => setPreviewQuestion(null)}
      />

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
          questions={questions}
          assignments={assignments}
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
      {/* MODAL 7: EDIT USER / TEACHER PROFILE MODAL */}
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

      {/* ========================================================================= */}
      {/* MODAL 8: EDIT STUDENT & CLASS ASSIGNMENT / PROMOTION MODAL */}
      {/* ========================================================================= */}
      {editingStudentData && (
        <EditStudentModal
          student={editingStudentData.student}
          studentUser={editingStudentData.user}
          classes={teacherClasses}
          grades={grades}
          schoolName={effectiveSchoolName}
          onClose={() => setEditingStudentData(null)}
          onSave={(updatedStudent, updatedUser, targetClassId, previousClassId) => {
            onUpdateUserProfile?.(updatedUser);

            if (previousClassId && previousClassId !== targetClassId && onUpdateClass) {
              const prevClass = classes.find(c => c.id === previousClassId);
              if (prevClass) {
                onUpdateClass({
                  ...prevClass,
                  studentIds: (prevClass.studentIds || []).filter(id => id !== updatedStudent.studentId)
                });
              }
            }

            if (targetClassId && targetClassId !== previousClassId && onUpdateClass) {
              const newClass = classes.find(c => c.id === targetClassId);
              if (newClass) {
                onUpdateClass({
                  ...newClass,
                  studentIds: Array.from(new Set([...(newClass.studentIds || []), updatedStudent.studentId]))
                });
              }
            }

            sounds.playLevelUp();
            setEditingStudentData(null);
            const targetClassObj = classes.find(c => c.id === targetClassId);
            setNotification(`Updated "${updatedStudent.studentName}" — Master Grade: ${updatedStudent.grade} | Assigned Class: ${targetClassObj ? targetClassObj.name : 'General Cohort'}!`);
            setTimeout(() => setNotification(''), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: ASSIGNMENT SUBMISSIONS & STUDENT GRADEBOOK SCORECARD */}
      {/* ========================================================================= */}
      {selectedAssignmentDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container animate-in fade-in duration-200"
          onClick={() => setSelectedAssignmentDetails(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full p-5 sm:p-7 space-y-5 text-stone-900 my-auto max-h-[calc(100dvh-1.5rem)] flex flex-col overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-stone-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1e6f47] text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                  📋
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#1e6f47] text-[10px] font-black uppercase tracking-wider mb-1 border border-emerald-300/80">
                    Classroom Assignment Gradebook
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                    {selectedAssignmentDetails.title}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium flex items-center gap-2 flex-wrap">
                    <span>Class: <strong className="text-stone-800">{currentClass?.name || selectedAssignmentDetails.className}</strong></span>
                    <span>•</span>
                    <span>Subject: <strong className="text-stone-800">{selectedAssignmentDetails.subject}</strong></span>
                    <span>•</span>
                    <span>Due: <strong className="text-stone-800 font-mono">{selectedAssignmentDetails.dueDate}</strong></span>
                    <span>•</span>
                    <span>Questions: <strong className="text-stone-800 font-mono">{selectedAssignmentDetails.questionIds.length}</strong></span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssignmentDetails(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compute Student Submissions */}
            {(() => {
              const totalQuestions = Math.max(1, selectedAssignmentDetails.questionIds.length);
              const allSubmissions = classStudents.map((s) => {
                const attempt = s.recentActivities?.find(
                  (act) => act.id === selectedAssignmentDetails.id || act.title.trim().toLowerCase() === selectedAssignmentDetails.title.trim().toLowerCase()
                );
                const isDone = Boolean(attempt);

                let score: number | null = null;
                let maxScore = totalQuestions;
                let correctAnswers: number | null = null;
                let percentage: number | null = null;

                if (attempt) {
                  const totalQ = totalQuestions;
                  if (typeof attempt.correctAnswers === 'number' && !isNaN(attempt.correctAnswers)) {
                    correctAnswers = Math.min(totalQ, Math.max(0, Math.round(attempt.correctAnswers)));
                  } else {
                    // Robust fallback: derive from score/maxScore ratio clamped to total questions
                    const rawMax = Math.max(1, attempt.maxScore || (totalQ * 10));
                    const safeScore = Math.min(rawMax, Math.max(0, attempt.score || 0));
                    correctAnswers = Math.min(totalQ, Math.max(0, Math.round((safeScore / rawMax) * totalQ)));
                  }

                  // Strictly calculate score as (correct_answers / total_questions) * 100 bounded [0, 100]
                  percentage = Math.min(100, Math.max(0, Math.round((correctAnswers / totalQ) * 100)));
                  score = correctAnswers;
                  maxScore = totalQ;
                }

                return {
                  student: s,
                  isDone,
                  score,
                  maxScore,
                  correctAnswers,
                  totalQuestions,
                  percentage,
                  timestamp: attempt?.timestamp || null,
                  attempt: attempt || null,
                };
              });

              const completedList = allSubmissions.filter((sub) => sub.isDone);
              const pendingList = allSubmissions.filter((sub) => !sub.isDone);
              const completedWithScore = allSubmissions.filter((sub) => sub.isDone && sub.percentage !== null);
              const classAvgScore = completedWithScore.length > 0
                ? Math.round(completedWithScore.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completedWithScore.length)
                : null;
              const completionRate = allSubmissions.length > 0
                ? Math.round((completedList.length / allSubmissions.length) * 100)
                : 0;

              const filteredList = assignmentSubmissionFilter === 'completed'
                ? completedList
                : assignmentSubmissionFilter === 'pending'
                ? pendingList
                : allSubmissions;

              return (
                <div className="space-y-4 overflow-y-auto overscroll-contain pr-1 flex-1 modal-scroll-container">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Total Enrolled</div>
                      <div className="text-xl font-black text-stone-900 mt-0.5">{allSubmissions.length}</div>
                      <div className="text-[10px] text-stone-500 font-medium">Students</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Completed</div>
                      <div className="text-xl font-black text-emerald-900 mt-0.5">{completedList.length}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{completionRate}% Done</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                      <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Not Done</div>
                      <div className="text-xl font-black text-amber-900 mt-0.5">{pendingList.length}</div>
                      <div className="text-[10px] text-amber-700 font-medium">Pending</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                      <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Class Avg Score</div>
                      <div className="text-xl font-black text-blue-900 mt-0.5">
                        {classAvgScore !== null ? `${classAvgScore}%` : '—'}
                      </div>
                      <div className="text-[10px] text-blue-700 font-medium">
                        {completedWithScore.length} submitted
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAssignmentSubmissionFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          assignmentSubmissionFilter === 'all'
                            ? 'bg-[#1e6f47] text-white shadow-xs'
                            : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        All Students ({allSubmissions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentSubmissionFilter('completed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          assignmentSubmissionFilter === 'completed'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed ({completedList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentSubmissionFilter('pending')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          assignmentSubmissionFilter === 'pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending ({pendingList.length})</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                      {filteredList.length} student{filteredList.length === 1 ? '' : 's'} shown
                    </span>
                  </div>

                  {/* Student Submissions List */}
                  {filteredList.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-1">
                      <p className="font-bold text-xs">No students match this filter.</p>
                      <p className="text-[11px]">Select another tab above to see student statuses.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredList.map((sub) => {
                        return (
                          <div
                            key={sub.student.studentId}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              sub.isDone
                                ? 'bg-white border-emerald-200/80 hover:border-emerald-300 shadow-xs'
                                : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            {/* Student Profile Info */}
                            <div className="flex items-center gap-3">
                              <span className="text-2xl p-2 rounded-xl bg-stone-100 shrink-0 border border-stone-200/60">
                                {sub.student.avatar}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                                    {sub.student.studentName}
                                  </h4>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                    @{sub.student.studentUsername}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                  <span>ID: {sub.student.studentId}</span>
                                  <span>•</span>
                                  <span>Grade: {sub.student.grade}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status & Score */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              {sub.isDone ? (
                                <div className="text-right">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Done
                                    </span>
                                    <span 
                                      title={`${sub.correctAnswers} of ${sub.totalQuestions} questions answered correctly`}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-black border ${
                                        (sub.percentage ?? 0) >= 80
                                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                          : (sub.percentage ?? 0) >= 50
                                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                                          : 'bg-rose-50 text-rose-900 border-rose-300'
                                      }`}
                                    >
                                      {sub.score} / {sub.maxScore} ({sub.percentage}%)
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-stone-400 block mt-0.5 font-medium">
                                    Submitted: {sub.timestamp || 'Recorded'}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-right">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Not Done
                                  </span>
                                  <span className="text-[10px] text-stone-400 block mt-0.5">
                                    Pending student attempt
                                  </span>
                                </div>
                              )}

                              {/* Action: Review Answers (Detailed Question Breakdown) */}
                              {sub.isDone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.click();
                                    setReviewingSubmission({
                                      student: sub.student,
                                      assignment: selectedAssignmentDetails,
                                      attempt: sub.attempt,
                                      correctAnswers: sub.correctAnswers ?? 0,
                                      totalQuestions: sub.totalQuestions,
                                      percentage: sub.percentage ?? 0
                                    });
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 text-xs font-bold transition cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                                  title="View which questions this student answered correctly or incorrectly"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Review Answers</span>
                                </button>
                              )}

                              {/* Action: Open Report Card */}
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.click();
                                  setSelectedReportStudent(sub.student);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5 text-purple-600" />
                                <span className="hidden sm:inline">Report Card</span>
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

            {/* Footer */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 shrink-0">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scores update automatically as students complete assignments.</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedAssignmentDetails(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Gradebook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: STUDENT ASSIGNMENT DIAGNOSTIC REVIEW MODAL (QUESTION-BY-QUESTION) */}
      {/* ========================================================================= */}
      {reviewingSubmission && (
        <StudentAssignmentReviewModal
          student={reviewingSubmission.student}
          assignment={reviewingSubmission.assignment}
          attempt={reviewingSubmission.attempt}
          correctAnswers={reviewingSubmission.correctAnswers}
          totalQuestions={reviewingSubmission.totalQuestions}
          percentage={reviewingSubmission.percentage}
          questions={questions}
          onClose={() => setReviewingSubmission(null)}
          onUpdateStudentProgress={onUpdateStudentProgress}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 10: ACTIVITY PLAYER & PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewingActivity && (
        <ActivityPlayerModal
          activity={previewingActivity}
          questions={questions}
          studentName={`${currentUser.name} (Teacher Preview)`}
          onClose={() => setPreviewingActivity(null)}
        />
      )}
        </div>
      )}
    </PortalShell>
  );
}
