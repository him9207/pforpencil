import React, { useState, FormEvent, useMemo } from 'react';
import { 
  UserAccount, 
  SchoolOrganization, 
  Question, 
  Activity, 
  SubscriptionRecord, 
  Voucher, 
  AuditLog, 
  StudentProgress, 
  ClassRoom,
  ClassAssignment,
  UserRole,
  Subject,
  GradeLevel,
  CurriculumGrade,
  CurriculumSubject
} from '../../types';
import { 
  LayoutDashboard, 
  School, 
  User, 
  UserPlus, 
  HelpCircle, 
  Sparkles, 
  CreditCard, 
  Receipt, 
  Ticket, 
  ShieldCheck, 
  Activity as ActivityIcon, 
  Plus, 
  Check, 
  Search, 
  Trash2, 
  Edit3, 
  Users, 
  BookOpen, 
  Award, 
  Flame, 
  Coins, 
  Download, 
  Eye, 
  Database, 
  KeyRound, 
  Calendar, 
  Filter, 
  X,
  TrendingUp,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Layers,
  Sparkle,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  Menu,
  RotateCcw,
  Heart,
  Gamepad2
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import ParentStudentModal from './components/ParentStudentModal';
import SchoolMemberModal from './components/SchoolMemberModal';
import MasterAccountCreation from './components/MasterAccountCreation';
import CurriculumManager from './components/CurriculumManager';
import CurriculumMaster from './components/CurriculumMaster';
import MasterQuestionBank from './components/MasterQuestionBank';
import InteractiveActivityModal from './components/InteractiveActivityModal';
import InteractiveActivityPreviewModal from './components/InteractiveActivityPreviewModal';
import PricingPlanManager from './components/PricingPlanManager';
import VoucherManager from './components/VoucherManager';
import ResetCredentialsModal from '../auth/ResetCredentialsModal';
import StudentReportCardModal from '../student/StudentReportCardModal';
import EditUserProfileModal from './components/EditUserProfileModal';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import { getNextRoleId, generateStudentUsername, getNextQuestionId, generateSchoolStudentUsername, generateAccountId, generateSchoolCode, getSchoolPrefix, commitAccountId } from '../../utils/idAndUsernameGenerator';
import { SUBSCRIPTION_PLANS } from '../../mockData';
import { COUNTRIES, COUNTRY_STATE_MAP, COUNTRY_CURRICULUM_MAP } from '../../data/curriculumData';

interface AdminPortalProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  schools: SchoolOrganization[];
  questions: Question[];
  activities: Activity[];
  subscriptions: SubscriptionRecord[];
  vouchers: Voucher[];
  auditLogs: AuditLog[];
  students: StudentProgress[];
  classes: ClassRoom[];
  assignments: ClassAssignment[];
  grades?: CurriculumGrade[];
  subjects?: CurriculumSubject[];
  subscriptionPlans?: any[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUserProfile?: (user: UserAccount) => void;
  onUpdateUserStatus?: (userId: string, status: 'active' | 'pending' | 'suspended') => void;
  onDeleteUser?: (userId: string) => void;
  onAddVoucher: (voucher: Voucher) => void;
  onDeleteVoucher?: (voucherId: string) => void;
  onToggleVoucherActive?: (voucherId: string) => void;
  onAddSchool: (school: SchoolOrganization) => void;
  onAddClass?: (cls: ClassRoom) => void;
  onUpdateClass?: (cls: ClassRoom) => void;
  onUpdateTeacher?: (teacher: UserAccount) => void;
  onAddQuestion?: (q: Question) => void;
  onEditQuestion?: (q: Question) => void;
  onDeleteQuestion?: (id: string) => void;
  onAddGrade?: (grade: CurriculumGrade) => void;
  onAddSubject?: (subject: CurriculumSubject) => void;
  onAddActivity?: (activity: Activity) => void;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activityId: string) => void;
  onAddSubscriptionPlan?: (plan: any) => void;
  onUpdateSubscriptionPlan?: (plan: any) => void;
  onDeleteSubscriptionPlan?: (planId: string) => void;
  onBatchCreateSchoolHierarchy?: (data: {
    school: SchoolOrganization;
    classroom?: ClassRoom;
    teacher?: UserAccount;
    students?: UserAccount[];
  }) => void;
  onAddStudentsToParent?: (
    parentId: string,
    studentsList: { student: UserAccount; progress: StudentProgress }[]
  ) => void;
  onUpdateSubscriptionStatus?: (subId: string, newStatus: any, extendDays?: number) => void;
  onDeleteGrade?: (gradeId: string) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onResetToMathPreschoolToGrade6?: () => void;
  onPurgeAllQuestions?: () => void;
  onResetCredentials?: (userId: string, newSecret: string, isPin: boolean, newUsername?: string) => void;
}

type AdminTab = 
  | 'dashboard' 
  | 'schools'
  | 'individual'
  | 'master_accounts'
  | 'classes_subjects'
  | 'curriculum_master'
  | 'question_bank' 
  | 'activities' 
  | 'subscriptions' 
  | 'subscription_charges' 
  | 'vouchers' 
  | 'roles_permissions' 
  | 'activity_log'
  | 'database_inspector'
  | 'all_users'
  | 'classes'
  | 'students'
  | 'assignments';

export default function AdminPortal({
  currentUser,
  allUsers,
  schools,
  questions,
  activities,
  subscriptions,
  vouchers,
  auditLogs,
  students,
  classes,
  assignments,
  grades = [],
  subjects = [],
  onAddUser,
  onUpdateUserProfile,
  onUpdateUserStatus,
  onDeleteUser,
  onAddVoucher,
  onToggleVoucherActive,
  onAddSchool,
  onAddClass,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onAddGrade,
  onAddSubject,
  onDeleteGrade,
  onDeleteSubject,
  onResetToMathPreschoolToGrade6,
  onPurgeAllQuestions,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onBatchCreateSchoolHierarchy,
  onAddStudentsToParent,
  onUpdateSubscriptionStatus,
  subscriptionPlans,
  onAddSubscriptionPlan,
  onUpdateSubscriptionPlan,
  onDeleteSubscriptionPlan,
  onDeleteVoucher,
  onResetCredentials
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  // Left Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (secId: string) => {
    setCollapsedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Notifications
  const [notification, setNotification] = useState('');
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Modals / Inspectors
  const [inspectUser, setInspectUser] = useState<UserAccount | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [inspectQuestion, setInspectQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [inspectStudent, setInspectStudent] = useState<StudentProgress | null>(null);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [selectedReportStudent, setSelectedReportStudent] = useState<StudentProgress | null>(null);

  // Advanced Feature Modals for Requirements 2, 3, 6, 7
  const [showProvisionSchoolModal, setShowProvisionSchoolModal] = useState(false);
  const [showSchoolMemberModal, setShowSchoolMemberModal] = useState(false);
  const [schoolMemberModalMode, setSchoolMemberModalMode] = useState<'teacher' | 'student'>('teacher');
  const [schoolMemberSelectedSchoolId, setSchoolMemberSelectedSchoolId] = useState<string>('');

  const [showParentStudentModal, setShowParentStudentModal] = useState(false);
  const [parentModalInitialMode, setParentModalInitialMode] = useState<'new' | 'existing'>('existing');
  const [selectedParentForModal, setSelectedParentForModal] = useState<UserAccount | null>(null);
  const [showInteractiveActivityModal, setShowInteractiveActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);

  // Lock body scroll when any admin modal is active
  useBodyScrollLock(Boolean(
    inspectUser ||
    editingUser ||
    inspectQuestion ||
    editingQuestion ||
    showAddQuestionModal ||
    inspectStudent ||
    resettingUser ||
    selectedReportStudent ||
    showProvisionSchoolModal ||
    showSchoolMemberModal ||
    showParentStudentModal ||
    showInteractiveActivityModal ||
    editingActivity ||
    previewActivity
  ));

  const handleOpenAddTeacherToSchool = (schoolId?: string) => {
    sounds.click();
    setSchoolMemberModalMode('teacher');
    setSchoolMemberSelectedSchoolId(schoolId || schools[0]?.id || '');
    setShowSchoolMemberModal(true);
  };

  const handleOpenAddStudentToSchool = (schoolId?: string) => {
    sounds.click();
    setSchoolMemberModalMode('student');
    setSchoolMemberSelectedSchoolId(schoolId || schools[0]?.id || '');
    setShowSchoolMemberModal(true);
  };

  // Subscription Tab Filter
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>('all');

  // Users Directory Filters
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Questions Filter
  const [qCountryFilter, setQCountryFilter] = useState<string>('all');
  const [qStateFilter, setQStateFilter] = useState<string>('all');
  const [qCurriculumFilter, setQCurriculumFilter] = useState<string>('all');
  const [qSubjectFilter, setQSubjectFilter] = useState<string>('all');
  const [qGradeFilter, setQGradeFilter] = useState<string>('all');
  const [qDifficultyFilter, setQDifficultyFilter] = useState<string>('all');
  const [qSearchQuery, setQSearchQuery] = useState('');

  // Global School & Academics Filters (handles 1,000+ schools)
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');
  const [schoolSearchFilter, setSchoolSearchFilter] = useState<string>('');
  const [schoolCountryFilter, setSchoolCountryFilter] = useState<string>('all');
  const [schoolGradeFilter, setSchoolGradeFilter] = useState<string>('all');

  // Interactive Activities Filters
  const [activityGradeFilter, setActivityGradeFilter] = useState<string>('all');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');

  // Voucher Form State
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscountPercent, setVoucherDiscountPercent] = useState(25);
  const [voucherApplicable, setVoucherApplicable] = useState<'parent' | 'school' | 'all'>('all');
  const [voucherMaxUses, setVoucherMaxUses] = useState(200);

  // School Form State
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolEmail, setNewSchoolEmail] = useState('');
  const [newSchoolSeats, setNewSchoolSeats] = useState(500);
  const [newSchoolCountry, setNewSchoolCountry] = useState('United States');
  const [newSchoolState, setNewSchoolState] = useState('California');
  const [newSchoolCurriculum, setNewSchoolCurriculum] = useState('Common Core (US)');
  const [newSchoolContractDuration, setNewSchoolContractDuration] = useState<
    '30_days' | '90_days' | '180_days' | '1_year' | '2_years' | '3_years'
  >('1_year');

  // Account Provisioning Validity
  const [newAccountValidityDuration, setNewAccountValidityDuration] = useState<
    '30_days' | '90_days' | '365_days' | 'lifetime'
  >('365_days');

  // Question Form State (for adding)
  const [formPrompt, setFormPrompt] = useState('');
  const [formSubject, setFormSubject] = useState<Subject>('Mathematics');
  const [formGrade, setFormGrade] = useState<GradeLevel>('Grade 3');
  const [formCategory, setFormCategory] = useState('Numbers & Operations');
  const [formSkill, setFormSkill] = useState('Problem Solving');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectIndex, setFormCorrectIndex] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formHint, setFormHint] = useState('');
  const [formPoints, setFormPoints] = useState<number>(20);
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  // Metrics
  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const activeUsersCount = allUsers.filter(u => u.status === 'active').length;
  const totalAllocatedSeats = schools.reduce((sum, sch) => sum + sch.allocatedSeats, 0);
  const totalSchoolSeats = schools.reduce((sum, sch) => sum + sch.totalSeats, 0);

  // Filtered Schools for scaling to 1000+
  const filteredSchools = useMemo(() => {
    return schools.filter((sch) => {
      const matchCountry = schoolCountryFilter === 'all' || sch.country === schoolCountryFilter;
      const matchSearch = schoolSearchFilter.trim() === '' || 
        sch.name.toLowerCase().includes(schoolSearchFilter.toLowerCase()) ||
        sch.id.toLowerCase().includes(schoolSearchFilter.toLowerCase()) ||
        sch.adminEmail.toLowerCase().includes(schoolSearchFilter.toLowerCase()) ||
        (sch.state && sch.state.toLowerCase().includes(schoolSearchFilter.toLowerCase()));
      return matchCountry && matchSearch;
    });
  }, [schools, schoolCountryFilter, schoolSearchFilter]);

  // Filtered Classrooms by School
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const matchSchool = selectedSchoolFilter === 'all' || cls.schoolId === selectedSchoolFilter;
      const matchGrade = schoolGradeFilter === 'all' || cls.grade === schoolGradeFilter;
      return matchSchool && matchGrade;
    });
  }, [classes, selectedSchoolFilter, schoolGradeFilter]);

  // Filtered Assignments by School
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      if (selectedSchoolFilter === 'all') return true;
      const targetClass = classes.find(c => c.id === asg.classId);
      return targetClass?.schoolId === selectedSchoolFilter;
    });
  }, [assignments, classes, selectedSchoolFilter]);

  // Filtered Students by School
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (selectedSchoolFilter !== 'all') {
        const targetSchool = schools.find(s => s.id === selectedSchoolFilter);
        const matchSchool = (st.schoolOrParent === 'school' && (st.schoolName === targetSchool?.name || st.schoolName === targetSchool?.id));
        return matchSchool;
      }
      return true;
    });
  }, [students, schools, selectedSchoolFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      const matchSearch = userSearchQuery === '' ||
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(userSearchQuery.toLowerCase()));
      return matchRole && matchStatus && matchSearch;
    });
  }, [allUsers, userRoleFilter, userStatusFilter, userSearchQuery]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchCountry = qCountryFilter === 'all' || !q.country || q.country === qCountryFilter;
      const matchState = qStateFilter === 'all' || !q.state || q.state === qStateFilter;
      const matchCurriculum = qCurriculumFilter === 'all' || !q.curriculum || q.curriculum === qCurriculumFilter;
      const matchSub = qSubjectFilter === 'all' || q.subject === qSubjectFilter;
      const matchGrd = qGradeFilter === 'all' || q.grade === qGradeFilter;
      const matchDiff = qDifficultyFilter === 'all' || q.difficulty === qDifficultyFilter;
      const matchSearch = qSearchQuery === '' ||
        q.id.toLowerCase().includes(qSearchQuery.toLowerCase()) ||
        q.prompt.toLowerCase().includes(qSearchQuery.toLowerCase()) ||
        q.skill.toLowerCase().includes(qSearchQuery.toLowerCase()) ||
        q.category.toLowerCase().includes(qSearchQuery.toLowerCase());
      return matchCountry && matchState && matchCurriculum && matchSub && matchGrd && matchDiff && matchSearch;
    });
  }, [questions, qCountryFilter, qStateFilter, qCurriculumFilter, qSubjectFilter, qGradeFilter, qDifficultyFilter, qSearchQuery]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const actGrades = act.grades?.length ? act.grades : [act.grade];
      if (activityGradeFilter !== 'all' && !actGrades.includes(activityGradeFilter)) return false;
      if (activitySubjectFilter !== 'all' && act.subject !== activitySubjectFilter) return false;
      if (activityTypeFilter !== 'all' && (act.format || act.type) !== activityTypeFilter) return false;
      if (activitySearchQuery.trim()) {
        const query = activitySearchQuery.toLowerCase();
        const haystack = [act.title, act.description, act.subject, act.id, ...(act.learningTags || []), ...(act.grades || [act.grade])].join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [activities, activityGradeFilter, activitySubjectFilter, activityTypeFilter, activitySearchQuery]);

  // Navigation Sections organized into 5 cohesive streamlined hubs
  interface AdminNavItem {
    id: AdminTab;
    label: string;
    shortLabel: string;
    icon: any;
    count?: number;
    description: string;
  }

  const navSections: Array<{
    id: string;
    title: string;
    icon: any;
    badge?: number;
    defaultTab: AdminTab;
    items: AdminNavItem[];
  }> = [
    {
      id: 'overview',
      title: 'Dashboard',
      icon: LayoutDashboard,
      defaultTab: 'dashboard' as AdminTab,
      items: [
        { id: 'dashboard' as AdminTab, label: 'Executive Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard, description: 'KPIs, live metrics & platform health' }
      ]
    },
    {
      id: 'provisioning',
      title: 'Account Provisioning',
      icon: UserPlus,
      defaultTab: 'master_accounts' as AdminTab,
      items: [
        { id: 'master_accounts' as AdminTab, label: 'Master Account Creation', shortLabel: 'Create Accounts', icon: UserPlus, description: 'Single unified provisioning hub for School, Parent, Student, Teacher, Admin & Content Manager' }
      ]
    },
    {
      id: 'schools_academics',
      title: '1. School',
      icon: School,
      badge: schools.length,
      defaultTab: 'schools' as AdminTab,
      items: [
        { id: 'schools' as AdminTab, label: 'Schools & Campuses Directory', shortLabel: 'Schools & Campuses', icon: School, count: schools.length, description: 'Campus seats, teachers & students' },
        { id: 'classes' as AdminTab, label: 'Classrooms & Rosters', shortLabel: 'Classrooms', icon: BookOpen, count: classes.length, description: 'Sections, teachers & enrollments' },
        { id: 'assignments' as AdminTab, label: 'Class Assignments & Quests', shortLabel: 'Assignments', icon: ClipboardList, count: assignments.length, description: 'Homework & curriculum tasks' }
      ]
    },
    {
      id: 'users_families',
      title: '2. Individual',
      icon: Users,
      badge: allUsers.filter(u => u.role === 'parent' || u.role === 'student').length,
      defaultTab: 'individual' as AdminTab,
      items: [
        { id: 'individual' as AdminTab, label: 'Parents Directory & Families', shortLabel: 'Parents', icon: Heart, count: allUsers.filter(u => u.role === 'parent').length, description: 'Parent profiles & family linked children' },
        { id: 'students' as AdminTab, label: 'Student Performance & Progress', shortLabel: 'Students', icon: Award, count: students.length, description: 'Student learners, quiz mastery & report cards' },
        { id: 'all_users' as AdminTab, label: 'Universal Users Directory', shortLabel: 'All Users', icon: User, count: allUsers.length, description: 'Global directory across all roles' }
      ]
    },
    {
      id: 'curriculum',
      title: 'Curriculum & Content',
      icon: HelpCircle,
      badge: questions.length + activities.length,
      defaultTab: 'curriculum_master' as AdminTab,
      items: [
        { id: 'curriculum_master' as AdminTab, label: 'Curriculum Master', shortLabel: 'Curriculum Master', icon: Globe, description: 'Country, region & curriculum hierarchy' },
        { id: 'question_bank' as AdminTab, label: 'Master Question Bank', shortLabel: 'Question Bank', icon: HelpCircle, count: questions.length, description: 'Questions, CSV import & generator' },
        { id: 'activities' as AdminTab, label: 'Interactive Activities & Quests', shortLabel: 'Interactive Activities', icon: Sparkles, count: activities.length, description: 'Interactive visual games, manipulative activities & quests' },
        { id: 'classes_subjects' as AdminTab, label: 'Grades & Subjects', shortLabel: 'Grades & Subjects', icon: GraduationCap, count: (grades?.length || 0), description: 'Active curriculum levels' }
      ]
    },
    {
      id: 'governance',
      title: 'Billing & Governance',
      icon: ShieldCheck,
      badge: subscriptions.length,
      defaultTab: 'subscriptions' as AdminTab,
      items: [
        { id: 'subscriptions' as AdminTab, label: 'Subscriptions Ledger', shortLabel: 'Subscriptions', icon: CreditCard, count: subscriptions.length, description: 'Active parent & school plans' },
        { id: 'subscription_charges' as AdminTab, label: 'Pricing Plans & Matrix', shortLabel: 'Pricing Matrix', icon: Receipt, count: subscriptionPlans?.length, description: 'Tier rates & durations' },
        { id: 'vouchers' as AdminTab, label: 'Promo Vouchers', shortLabel: 'Vouchers', icon: Ticket, count: vouchers.length, description: 'Discount codes & campaigns' },
        { id: 'roles_permissions' as AdminTab, label: 'Roles & Permissions', shortLabel: 'RBAC Matrix', icon: ShieldCheck, description: '6-tier access control matrix' },
        { id: 'activity_log' as AdminTab, label: 'Audit Trail & Logs', shortLabel: 'Audit Trail', icon: ActivityIcon, count: auditLogs.length, description: 'Immutable system event records' },
        { id: 'database_inspector' as AdminTab, label: 'Database & Export', shortLabel: 'Database & Export', icon: Database, description: 'PostgreSQL schema & full JSON dump' }
      ]
    }
  ];
  const navItems = navSections.flatMap(section => section.items);

  // Filtered sections for sidebar search
  const filteredSections = useMemo(() => {
    if (!sidebarSearch.trim()) return navSections;
    const q = sidebarSearch.toLowerCase();
    return navSections
      .map(sec => ({
        ...sec,
        items: sec.items.filter(
          item =>
            item.label.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        )
      }))
      .filter(sec => sec.items.length > 0);
  }, [navSections, sidebarSearch]);

  const currentSection = navSections.find(sec => sec.items.some(it => it.id === activeTab)) || navSections[0];
  const currentItem = navSections.flatMap(sec => sec.items).find(it => it.id === activeTab);
 
  // Helper for computing expiration dates
  const calcExpirationDate = (duration: string): string => {
    const d = new Date();
    if (duration === '30_days') {
      d.setDate(d.getDate() + 30);
    } else if (duration === '90_days') {
      d.setDate(d.getDate() + 90);
    } else if (duration === '180_days' || duration === '1_semester') {
      d.setDate(d.getDate() + 180);
    } else if (duration === '365_days' || duration === '1_year') {
      d.setFullYear(d.getFullYear() + 1);
    } else if (duration === '2_years') {
      d.setFullYear(d.getFullYear() + 2);
    } else if (duration === '3_years') {
      d.setFullYear(d.getFullYear() + 3);
    } else {
      return '2099-12-31';
    }
    return d.toISOString().split('T')[0];
  };

  // Handle Create Voucher
  const handleCreateVoucher = (e: FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    const newVou: Voucher = {
      id: `VOU-${Date.now().toString().slice(-4)}`,
      code: voucherCode.trim().toUpperCase(),
      discountPercent: voucherDiscountPercent,
      applicableTo: voucherApplicable,
      maxUses: voucherMaxUses,
      currentUses: 0,
      expiresAt: '2026-12-31',
      active: true
    };

    sounds.playCorrect();
    onAddVoucher(newVou);
    triggerNotification(`Promo Voucher "${newVou.code}" created with ${voucherDiscountPercent}% discount!`);
    setVoucherCode('');
  };

  // Handle Create School
  const handleCreateSchool = (e: FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    const nextId = generateAccountId('school', [...schools, ...allUsers.filter((u) => u.role === 'school')]);
    commitAccountId(nextId);
    const schoolCode = generateSchoolCode(newSchoolName.trim(), schools);
    const expiresOn = calcExpirationDate(newSchoolContractDuration);

    const newSch: SchoolOrganization = {
      id: nextId,
      schoolCode,
      name: newSchoolName.trim(),
      adminEmail: newSchoolEmail.trim() || `admin@${nextId.toLowerCase()}.edu`,
      country: newSchoolCountry,
      state: newSchoolState,
      curriculum: newSchoolCurriculum,
      totalSeats: newSchoolSeats,
      allocatedSeats: 0,
      activeTeachers: 0,
      activeClasses: 0,
      plan: newSchoolSeats >= 1000 ? 'District 1000' : newSchoolSeats >= 500 ? 'Campus 500' : 'Basic 100',
      expiresAt: expiresOn,
      contractDuration: newSchoolContractDuration,
      validityType: newSchoolContractDuration === '30_days' ? 'monthly' : 'yearly',
      status: 'active'
    };

    const schoolUser: UserAccount = {
      id: nextId,
      role: 'school',
      name: newSchoolName.trim(),
      email: newSchoolEmail.trim() || `admin@${nextId.toLowerCase()}.edu`,
      avatar: '🏫',
      organizationId: nextId,
      schoolName: newSchoolName.trim(),
      schoolCode,
      country: newSchoolCountry,
      state: newSchoolState,
      curriculum: newSchoolCurriculum,
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'active',
      validityDuration: newSchoolContractDuration,
      validUntil: expiresOn
    };

    sounds.playCorrect();
    onAddSchool(newSch);
    onAddUser(schoolUser);
    triggerNotification(`School Campus "${newSch.name}" (${newSch.id}, Code: ${schoolCode}) registered with ${newSch.totalSeats} seats (${newSch.country}, ${newSch.curriculum})! Valid until ${expiresOn}.`);
    setNewSchoolName('');
    setNewSchoolEmail('');
    setShowProvisionSchoolModal(false);
  };

  // Handle Add Question
  const handleAddQuestionSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formPrompt.trim()) return;
    if (formOptions.some(opt => !opt.trim())) {
      alert('Please fill out all 4 option choices.');
      return;
    }

    const nextQId = getNextQuestionId(formGrade, questions, 0, formSubject);
    const newQuestion: Question = {
      id: nextQId,
      subject: formSubject,
      grade: formGrade,
      category: formCategory,
      skill: formSkill,
      prompt: formPrompt.trim(),
      options: [...formOptions],
      correctIndex: formCorrectIndex,
      explanation: formExplanation.trim() || 'Great job! This is the mathematically correct answer.',
      hint: formHint.trim() || 'Review your core concepts carefully.',
      points: formPoints,
      difficulty: formDifficulty
    };

    sounds.playCorrect();
    if (onAddQuestion) onAddQuestion(newQuestion);
    triggerNotification(`Question ${nextQId} published to Master Question Bank!`);
    setShowAddQuestionModal(false);
    setFormPrompt('');
    setFormOptions(['', '', '', '']);
    setFormExplanation('');
    setFormHint('');
  };

  // Export Full Platform Data as JSON
  const handleExportFullJSON = () => {
    const fullDataset = {
      exportedAt: new Date().toISOString(),
      platform: 'PforPencil Unified Learning Cloud',
      counts: {
        users: allUsers.length,
        schools: schools.length,
        classes: classes.length,
        assignments: assignments.length,
        students: students.length,
        questions: questions.length,
        activities: activities.length,
        subscriptions: subscriptions.length,
        vouchers: vouchers.length,
        auditLogs: auditLogs.length
      },
      data: {
        users: allUsers,
        schools,
        classes,
        assignments,
        studentProgress: students,
        questions,
        activities,
        subscriptions,
        vouchers,
        auditLogs
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(fullDataset, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `pforpencil_complete_data_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    sounds.playCorrect();
    triggerNotification('Complete platform database exported as JSON!');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Super Admin Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center text-3xl font-black">
            👑
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-1 border border-amber-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Full System Access & Master Data
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              PforPencil Super Admin Console
            </h1>
            <p className="text-xs text-stone-400 font-mono mt-0.5">
              Admin: {currentUser.name} • ID: {currentUser.id} • All Platform Data & RBAC Oversight
            </p>
          </div>
        </div>

        {/* Quick Data Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="admin-export-json-btn"
            onClick={handleExportFullJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Database (JSON)</span>
          </button>

          <div className="bg-stone-800/90 border border-stone-700 px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] text-stone-400 uppercase font-bold block">Gross Revenue</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Global Notification */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Streamlined Admin Navigation - Professional Left Sidebar Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Modern Left Sidebar */}
        <aside className={`w-full lg:w-72 xl:w-80 shrink-0 bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 space-y-4 lg:sticky lg:top-24 transition-all ${
          mobileMenuOpen ? 'block' : 'hidden lg:block'
        }`}>
          {/* Quick Tool Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search admin tools & tabs..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#10246f]"
            />
            {sidebarSearch && (
              <button
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Grouped Navigation Sections */}
          <nav className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredSections.map((sec) => {
              const SectionIcon = sec.icon;
              const isSectionCollapsed = !!collapsedSections[sec.id];
              const hasActiveItem = sec.items.some(it => it.id === activeTab);

              return (
                <div key={sec.id} className="space-y-1">
                  <div 
                    onClick={() => toggleSection(sec.id)}
                    className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-stone-500 cursor-pointer hover:text-stone-900 group select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <SectionIcon className={`w-3.5 h-3.5 ${hasActiveItem ? 'text-blue-600' : 'text-stone-500'}`} />
                      <span>{sec.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {sec.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 text-[9px] font-mono font-bold">
                          {sec.badge}
                        </span>
                      )}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isSectionCollapsed ? '-rotate-90 text-stone-500' : 'text-stone-600'}`} />
                    </div>
                  </div>

                  {!isSectionCollapsed && (
                    <div className="space-y-0.5 pl-1">
                      {sec.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            id={`admin-nav-${item.id}`}
                            onClick={() => {
                              sounds.click();
                              setActiveTab(item.id);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group ${
                              isActive
                                ? 'bg-[#10246f] text-white shadow-xs font-black'
                                : 'text-stone-600 hover:text-stone-950 hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ItemIcon className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive ? 'text-[#ffbf32]' : 'text-stone-500 group-hover:text-stone-900'
                              }`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.count !== undefined && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200'
                              }`}>
                                {item.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Content Workspace */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Active View Header Breadcrumb Card */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#10246f]">
                <span className="uppercase tracking-wider text-stone-500 font-extrabold">{currentSection.title}</span>
                <span className="text-stone-300">/</span>
                <span className="text-[#10246f] font-black">{currentItem?.label || activeTab}</span>
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
                {currentItem && <currentItem.icon className="w-6 h-6 text-blue-600" />}
                <span>{currentItem?.label || activeTab}</span>
              </h2>
              <p className="text-xs text-stone-500">
                {currentItem?.description || 'Manage system data and administrative operations.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 flex items-center gap-1.5"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>Switch Tab</span>
              </button>
            </div>
          </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE DASHBOARD & REAL-TIME PLATFORM METRICS */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div 
              onClick={() => setActiveTab('all_users')}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>Total Users</span>
                <User className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">{allUsers.length}</div>
              <span className="text-[10px] text-emerald-700 font-bold">{activeUsersCount} Active</span>
            </div>

            <div 
              onClick={() => setActiveTab('schools')}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>Schools</span>
                <School className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-600">{schools.length}</div>
              <span className="text-[10px] text-stone-500">{totalAllocatedSeats}/{totalSchoolSeats} Seats</span>
            </div>

            <div 
              onClick={() => setActiveTab('classes')}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>Classrooms</span>
                <Users className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{classes.length}</div>
              <span className="text-[10px] text-stone-500">{assignments.length} Assignments</span>
            </div>

            <div 
              onClick={() => setActiveTab('students')}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>Students</span>
                <Award className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-600">{students.length}</div>
              <span className="text-[10px] text-stone-500">Avg 92% Proficiency</span>
            </div>

            <div 
              onClick={() => setActiveTab('question_bank')}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>Master Questions</span>
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-600">{questions.length}</div>
              <span className="text-[10px] text-stone-500">Grades 1 to 5</span>
            </div>

            <div 
              onClick={() => setActiveTab('subscriptions')}
              className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-1">
                <span>Gross Revenue</span>
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">${totalRevenue.toFixed(0)}</div>
              <span className="text-[10px] text-emerald-700 font-bold">{subscriptions.length} Transactions</span>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Distribution */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Platform Role Hierarchy</span>
                </h3>
                <span className="text-xs font-mono font-bold text-stone-500">{allUsers.length} Accounts</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { role: 'student', label: 'Students (Learners)', count: allUsers.filter(u => u.role === 'student').length, icon: '🎒', color: 'bg-blue-500', auth: 'Username + 4-digit PIN' },
                  { role: 'teacher', label: 'Faculty Teachers', count: allUsers.filter(u => u.role === 'teacher').length, icon: '👩‍🏫', color: 'bg-emerald-500', auth: 'Email + Password' },
                  { role: 'parent', label: 'Parents / Guardians', count: allUsers.filter(u => u.role === 'parent').length, icon: '👨‍👧‍👦', color: 'bg-rose-500', auth: 'Email + Password' },
                  { role: 'school', label: 'School Admin Campuses', count: allUsers.filter(u => u.role === 'school').length, icon: '🏫', color: 'bg-blue-500', auth: 'School Admin Email' },
                  { role: 'content_manager', label: 'Content Managers', count: allUsers.filter(u => u.role === 'content_manager').length, icon: '✍️', color: 'bg-amber-500', auth: 'Curator Email' },
                  { role: 'admin', label: 'Super Admins', count: allUsers.filter(u => u.role === 'admin').length, icon: '👑', color: 'bg-blue-500', auth: 'Root Access' },
                ].map((item) => (
                  <div 
                    key={item.role} 
                    onClick={() => {
                      setUserRoleFilter(item.role);
                      setActiveTab('all_users');
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 transition-all cursor-pointer border border-stone-200/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <div className="font-bold text-stone-900">{item.label}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{item.auth}</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum Master Coverage */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Curriculum Question Distribution</span>
                </h3>
                <span className="text-xs font-mono font-bold text-stone-500">{questions.length} Items</span>
              </div>
              <div className="space-y-3 text-xs">
                {(subjects.length > 0 ? subjects.map(s => s.name as Subject) : ['Mathematics' as Subject]).map((sub) => {
                  const count = questions.filter(q => q.subject === sub).length;
                  const pct = Math.round((count / questions.length) * 100) || 0;
                  return (
                    <div key={sub} className="space-y-1">
                      <div className="flex items-center justify-between text-stone-700">
                        <span className="font-bold">{sub}</span>
                        <span className="font-mono font-bold text-stone-900">{count} Questions ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>Grades Covered: Preschool through Grade 6</span>
                <button
                  onClick={() => setActiveTab('question_bank')}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Manage Bank →
                </button>
              </div>
            </div>

            {/* System Health & Supabase RLS */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4 text-emerald-600" />
                    <span>Database Engine & Security</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  Multi-tenant isolation active with PostgreSQL Row Level Security (RLS) schemas.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>PostgreSQL Table RLS Policies Enforced</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Student 4-digit PIN authentication active</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>School license seat quotas strictly checked</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Audit trail logging every mutating event</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono">PostgreSQL 15</span>
                <button
                  onClick={() => setActiveTab('database_inspector')}
                  className="font-bold text-stone-900 hover:text-emerald-700 underline cursor-pointer"
                >
                  Inspect Database Raw Tables →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: UNIVERSAL USERS & ACCOUNTS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'all_users' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <User className="w-4 h-4 text-stone-700" />
                <span>All Users Directory ({allUsers.length} Registered Accounts)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Complete roster of all accounts across Admins, Content Managers, Schools, Teachers, Parents, and Students
              </p>
            </div>

            <button
              onClick={() => setActiveTab('master_accounts')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Provision New Account</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-stone-500 uppercase tracking-wider text-[11px]">Role Filter:</span>
              {['all', 'student', 'teacher', 'parent', 'school', 'content_manager', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer capitalize ${
                    userRoleFilter === role
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, ID, username, email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="p-1.5 rounded-xl border border-stone-200 text-xs font-bold"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-3 font-semibold">Account ID</th>
                  <th className="p-3 font-semibold">Name & Avatar</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Login Identifier</th>
                  <th className="p-3 font-semibold">Affiliation / Link</th>
                  <th className="p-3 font-semibold">Grade</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-stone-400">
                      No accounts found matching the specified filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isStudent = u.role === 'student';
                    return (
                      <tr key={u.id} className="hover:bg-stone-50/70">
                        <td className="p-3 font-mono font-bold text-stone-900">
                          <span className={`px-2 py-0.5 rounded border text-[11px] ${
                            u.role === 'admin' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                            u.role === 'content_manager' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                            u.role === 'school' ? 'bg-blue-50 border-blue-200 text-blue-900' :
                            u.role === 'teacher' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                            u.role === 'parent' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                            'bg-blue-50 border-blue-200 text-blue-900'
                          }`}>
                            {u.id}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-stone-950">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{u.avatar}</span>
                            <div>
                              <div>{u.name}</div>
                              <span className="text-[10px] text-stone-400 font-mono">Joined {u.enrolledAt}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold uppercase text-[10px]">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {isStudent ? (
                            <div className="space-y-0.5">
                              <span className="bg-blue-50 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-200 block w-fit">
                                @{u.username}
                              </span>
                              <span className="text-[10px] text-stone-400 font-sans">PIN: {u.pin || '7392'}</span>
                            </div>
                          ) : (
                            <span className="text-stone-600">{u.email}</span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-stone-600">
                          {u.schoolName || (u.parentId ? `Parent: ${u.parentId}` : 'Universal / District')}
                        </td>
                        <td className="p-3 font-bold text-stone-800">
                          {u.grade || '—'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.status === 'active' ? 'bg-emerald-100 text-emerald-900' :
                            u.status === 'pending' ? 'bg-amber-100 text-amber-900' :
                            'bg-red-100 text-red-900'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="Inspect Full Profile"
                              onClick={() => setInspectUser(u)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              title="Edit Basic Profile Details"
                              onClick={() => {
                                sounds.click();
                                setEditingUser(u);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Edit</span>
                            </button>

                            {onUpdateUserStatus && (
                              <button
                                title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                                onClick={() => {
                                  const nextStatus = u.status === 'active' ? 'suspended' : 'active';
                                  onUpdateUserStatus(u.id, nextStatus);
                                  triggerNotification(`Account ${u.id} status changed to ${nextStatus.toUpperCase()}`);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  u.status === 'active' 
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200' 
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                                }`}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}

                            {onResetCredentials && (
                              <button
                                title={u.role === 'student' ? 'Reset Student PIN' : `Reset Password for ${u.role}`}
                                onClick={() => setResettingUser(u)}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>{u.role === 'student' ? 'Reset PIN' : 'Reset PWD'}</span>
                              </button>
                            )}

                            {onDeleteUser && u.id !== currentUser.id && (
                              <button
                                title="Delete Account"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete user ${u.name} (${u.id})?`)) {
                                    onDeleteUser(u.id);
                                    triggerNotification(`Deleted user ${u.name} (${u.id})`);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
      {/* TAB 2: SCHOOLS DIRECTORY, CAMPUSES & LICENSING */}
      {/* ========================================================================= */}
      {activeTab === 'schools' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Schools & Campuses Directory ({schools.length})</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Manage institutional accounts, seat allocations, classroom sections, and faculty assignments
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-provision-school-campus"
                  onClick={() => {
                    sounds.click();
                    setShowProvisionSchoolModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Provision School Campus</span>
                </button>
                <button
                  id="btn-add-teacher-school"
                  onClick={() => handleOpenAddTeacherToSchool()}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Add Teacher to School</span>
                </button>
                <button
                  id="btn-add-student-school"
                  onClick={() => handleOpenAddStudentToSchool()}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>+ Add Student to School</span>
                </button>
              </div>
            </div>

            {/* School Scaling Search & Filter Bar (Handles 1,000+ Schools) */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by school name, campus ID, state, or admin email..."
                    value={schoolSearchFilter}
                    onChange={(e) => setSchoolSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                  {schoolSearchFilter && (
                    <button
                      onClick={() => setSchoolSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <select
                  value={schoolCountryFilter}
                  onChange={(e) => setSchoolCountryFilter(e.target.value)}
                  className="px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold text-stone-700 focus:ring-2 focus:ring-blue-500 shrink-0"
                >
                  <option value="all">🌍 All Countries</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="India">🇮🇳 India</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="Canada">🇨🇦 Canada</option>
                  <option value="Australia">🇦🇺 Australia</option>
                </select>
              </div>

              <div className="flex items-center gap-2 justify-between md:justify-end text-xs font-bold text-stone-500">
                <span className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 font-mono text-[11px] text-stone-700">
                  Showing {filteredSchools.length} of {schools.length} Schools
                </span>
                {(schoolSearchFilter || schoolCountryFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSchoolSearchFilter('');
                      setSchoolCountryFilter('all');
                    }}
                    className="text-blue-600 hover:underline text-xs font-bold"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* School List */}
            {filteredSchools.length === 0 ? (
              <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
                <School className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="font-bold text-stone-700 text-sm">No Schools Found matching "{schoolSearchFilter}"</p>
                <p className="text-stone-500 text-xs">Try adjusting your search query or country filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSchools.map((sch) => {
                  const schoolTeachers = allUsers.filter(u => u.role === 'teacher' && (u.organizationId === sch.id || u.schoolName === sch.name));
                  const schoolClasses = classes.filter(c => c.schoolId === sch.id);
                  const schoolStudents = students.filter(s => s.schoolOrParent === 'school' && s.schoolName === sch.name);
                  const schoolAsgs = assignments.filter(a => {
                    const c = classes.find(cls => cls.id === a.classId);
                    return c?.schoolId === sch.id;
                  });
                  const seatPercent = Math.round((sch.allocatedSeats / sch.totalSeats) * 100) || 0;

                  return (
                    <div key={sch.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-base font-black text-stone-900">{sch.name}</strong>
                            <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-bold">
                              {sch.id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase">
                              {sch.status}
                            </span>
                            {sch.country && (
                              <span className="px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-bold text-[10px]">
                                {sch.country}
                              </span>
                            )}
                          </div>
                          <p className="text-stone-500 mt-1">
                            Admin Contact: <span className="font-mono text-stone-700">{sch.adminEmail}</span> • Plan: <strong>{sch.plan}</strong> • Expires {sch.expiresAt}
                          </p>
                        </div>

                        {/* Quick 1-Click Scoped Navigation Actions & Provisioning */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleOpenAddTeacherToSchool(sch.id)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title={`Add a new faculty teacher to ${sch.name}`}
                          >
                            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                            <span>+ Add Teacher</span>
                          </button>
                          <button
                            onClick={() => handleOpenAddStudentToSchool(sch.id)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title={`Add a new student to ${sch.name}`}
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                            <span>+ Add Student</span>
                          </button>
                          <button
                            onClick={() => {
                              sounds.click();
                              setSelectedSchoolFilter(sch.id);
                              setActiveTab('classes');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="View all classrooms in this school"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>Classrooms ({schoolClasses.length})</span>
                          </button>
                          <button
                            onClick={() => {
                              sounds.click();
                              setSelectedSchoolFilter(sch.id);
                              setActiveTab('assignments');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="View assignments in this school"
                          >
                            <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
                            <span>Assignments ({schoolAsgs.length})</span>
                          </button>
                          <button
                            onClick={() => {
                              sounds.click();
                              setSelectedSchoolFilter(sch.id);
                              setActiveTab('students');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="View student telemetry in this school"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Students ({schoolStudents.length})</span>
                          </button>
                        </div>
                      </div>

                      {/* Seat Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-stone-600">
                          <span>Seat Allocation: {sch.allocatedSeats} / {sch.totalSeats} seats used ({seatPercent}%)</span>
                          <span className="font-mono text-stone-400">{sch.totalSeats - sch.allocatedSeats} seats available</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${seatPercent}%` }} />
                        </div>
                      </div>

                      {/* School Sub-Roster Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-stone-200/80">
                        {/* Classes */}
                        <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-2">
                          <span className="text-[11px] text-stone-500 font-bold flex items-center justify-between">
                            <span>Classrooms ({schoolClasses.length})</span>
                            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          </span>
                          {schoolClasses.length === 0 ? (
                            <p className="text-[11px] text-stone-400 italic">No classrooms yet</p>
                          ) : (
                            <div className="space-y-1.5">
                              {schoolClasses.map(cls => (
                                <div key={cls.id} className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                                  <div className="font-bold text-stone-900 text-xs">{cls.name}</div>
                                  <div className="text-[10px] text-stone-500">{cls.grade} • Teacher: {cls.teacherName}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Faculty Teachers */}
                        <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-stone-500 font-bold">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Faculty Teachers ({schoolTeachers.length})</span>
                            </span>
                            <button
                              onClick={() => handleOpenAddTeacherToSchool(sch.id)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                          {schoolTeachers.length === 0 ? (
                            <div className="py-2 text-center">
                              <p className="text-[11px] text-stone-400 italic mb-1.5">No faculty teachers assigned</p>
                              <button
                                onClick={() => handleOpenAddTeacherToSchool(sch.id)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 cursor-pointer transition inline-flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Teacher</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {schoolTeachers.map(tea => (
                                <div key={tea.id} className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-stone-900 text-xs">{tea.name}</div>
                                    <div className="text-[10px] text-stone-500 font-mono">{tea.email}</div>
                                  </div>
                                  <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-700">{tea.id}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Enrolled Students */}
                        <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-stone-500 font-bold">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>Enrolled Students ({schoolStudents.length})</span>
                            </span>
                            <button
                              onClick={() => handleOpenAddStudentToSchool(sch.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                          {schoolStudents.length === 0 ? (
                            <div className="py-2 text-center">
                              <p className="text-[11px] text-stone-400 italic mb-1.5">No students rostered yet</p>
                              <button
                                onClick={() => handleOpenAddStudentToSchool(sch.id)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 cursor-pointer transition inline-flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Student</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {schoolStudents.map(st => (
                                <div key={st.studentId} className="p-2 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{st.avatar}</span>
                                    <div>
                                      <div className="font-bold text-stone-900 text-xs">{st.studentName}</div>
                                      <div className="text-[10px] text-stone-500">{st.grade} • Lvl {st.level}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-bold text-emerald-600 text-xs">{st.averageScore}%</span>
                                    <span className="text-[10px] text-stone-400 block">{st.xp} XP</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INDIVIDUAL TAB - PARENTS & LINKED STUDENT ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>3. Individual Tab: Parents & Linked Student Accounts</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Manage individual parent profiles and provision 1, 2, 3, or multiple student child accounts
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <button
                  onClick={() => {
                    sounds.click();
                    setSelectedParentForModal(null);
                    setParentModalInitialMode('new');
                    setShowParentStudentModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Parent Account</span>
                </button>

                {allUsers.filter(u => u.role === 'parent').length > 0 && (
                  <button
                    onClick={() => {
                      sounds.click();
                      setSelectedParentForModal(allUsers.filter(u => u.role === 'parent')[0] || null);
                      setParentModalInitialMode('existing');
                      setShowParentStudentModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-stone-200"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Add Children to Existing Parent</span>
                  </button>
                )}
              </div>
            </div>

            {/* Parent Accounts List */}
            {allUsers.filter(u => u.role === 'parent').length === 0 ? (
              <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-3">
                <Users className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="font-bold text-stone-700 text-sm">No Parent Accounts Registered Yet</p>
                <p className="text-stone-500 text-xs">Click the "+ Add Parent Account" button above to create a parent profile and optionally link student accounts.</p>
                <button
                  onClick={() => {
                    sounds.click();
                    setSelectedParentForModal(null);
                    setParentModalInitialMode('new');
                    setShowParentStudentModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register First Parent</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {allUsers.filter(u => u.role === 'parent').map((parent) => {
                  const parentStudentIds = new Set(parent.studentIds || []);
                  // Family relationship is ID-based only. Never infer Parent → Student
                  // from names or username prefixes; school/teacher relationships are independent.
                  const linkedStudents = students.filter(s =>
                    parentStudentIds.has(s.studentId) || s.parentId === parent.id
                  );

                  return (
                    <div key={parent.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                            {parent.name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="font-black text-stone-900 text-sm">{parent.name}</h4>
                            <span className="font-mono text-[10px] text-stone-500">{parent.email} • {parent.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                            {linkedStudents.length} Children
                          </span>
                          <button
                            onClick={() => {
                              sounds.click();
                              setSelectedParentForModal(parent);
                              setShowParentStudentModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3 text-emerald-600" />
                            <span>Add Child</span>
                          </button>
                        </div>
                      </div>

                      {/* Linked Children Roster */}
                      <div className="space-y-2 pt-2 border-t border-stone-200/70">
                        <span className="text-[11px] font-bold text-stone-500 block">Linked Child Accounts:</span>
                        {linkedStudents.length === 0 ? (
                          <div className="p-3 bg-white rounded-xl border border-stone-200 text-center text-stone-400 italic">
                            No student accounts linked yet. Click "Add Child" to create 1, 2, 3, or more!
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {linkedStudents.map((child) => (
                              <div key={child.studentId} className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-xl">{child.avatar}</span>
                                  <div>
                                    <div className="font-bold text-stone-900 text-xs">{child.studentName}</div>
                                    <div className="text-[10px] text-stone-400 font-mono">@{child.studentUsername} • PIN: {allUsers.find(u => u.id === child.studentId)?.pin || '—'} • {child.grade}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                                    Lvl {child.level} • {child.xp} XP
                                  </span>
                                  <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">{child.averageScore}% Accuracy</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MASTER ACCOUNT CREATION (ANY ROLE) */}
      {/* ========================================================================= */}
      {activeTab === 'master_accounts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-stone-900 text-white rounded-2xl shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Master Account Provisioning Authority</h3>
                <p className="text-[11px] text-stone-400">Single unified provisioning hub for School, Parent, Student, Teacher, Admin & Content Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveTab('schools')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700"
              >
                <School className="w-3.5 h-3.5 text-blue-400" />
                <span>Schools ({schools.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('individual')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700"
              >
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Parents ({allUsers.filter(u => u.role === 'parent').length})</span>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Students ({students.length})</span>
              </button>
            </div>
          </div>

          <MasterAccountCreation
            schools={schools}
            parents={allUsers.filter(u => u.role === 'parent')}
            availableGrades={grades.map(g => g.name)}
            allUsersCount={allUsers.length}
            allUsers={allUsers}
            onAddUser={onAddUser}
            onSuccessMessage={triggerNotification}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* CURRICULUM MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'curriculum_master' && (
        <div className="space-y-4">
          <CurriculumMaster onSuccessMessage={triggerNotification} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CREATE CLASS & SUBJECT (ADMIN AUTHORITY ONLY) */}
      {/* ========================================================================= */}
      {activeTab === 'classes_subjects' && (
        <div className="space-y-4">
          <CurriculumManager
            grades={grades}
            subjects={subjects}
            questions={questions}
            onAddGrade={onAddGrade || (() => {})}
            onAddSubject={onAddSubject || (() => {})}
            onDeleteGrade={onDeleteGrade}
            onDeleteSubject={onDeleteSubject}
            onResetToMathPreschoolToGrade6={onResetToMathPreschoolToGrade6}
            onSuccessMessage={triggerNotification}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CLASSROOMS & ROSTERS */}
      {/* ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Classrooms & Faculty Assignments ({filteredClasses.length} Sections)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Manage classroom sections, lead teachers, and student rosters across all schools
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.click();
                  setActiveTab('master_accounts');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Multi-Tier Hierarchy Setup</span>
              </button>
            </div>
          </div>

          {/* School Scaling Filter Toolbar */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                <span>Filter School:</span>
              </span>
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 shadow-2xs focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
              >
                <option value="all">🏫 All Schools ({schools.length} Campuses)</option>
                {schools.map(sch => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.id})
                  </option>
                ))}
              </select>

              <select
                value={schoolGradeFilter}
                onChange={(e) => setSchoolGradeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 shadow-2xs focus:ring-2 focus:ring-blue-500 shrink-0"
              >
                <option value="all">All Grades</option>
                {grades.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-700">
                {filteredClasses.length} of {classes.length} Classrooms
              </span>
              {(selectedSchoolFilter !== 'all' || schoolGradeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedSchoolFilter('all');
                    setSchoolGradeFilter('all');
                  }}
                  className="text-blue-600 hover:underline text-xs font-bold"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Scope Notice */}
          {selectedSchoolFilter !== 'all' && (
            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Showing classrooms isolated for <strong>{schools.find(s => s.id === selectedSchoolFilter)?.name || selectedSchoolFilter}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedSchoolFilter('all')}
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 transition text-[11px]"
              >
                View All Schools
              </button>
            </div>
          )}

          {filteredClasses.length === 0 ? (
            <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-bold text-stone-700 text-sm">No Classrooms Found</p>
              <p className="text-stone-500 text-xs">No classrooms match the currently selected school or grade filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClasses.map((cls) => {
                const roster = students.filter(s => cls.studentIds.includes(s.studentId) || (s.schoolOrParent === 'school' && s.grade === cls.grade));
                const classAsgs = assignments.filter(a => a.classId === cls.id);
                const parentSchool = schools.find(s => s.id === cls.schoolId);

                return (
                  <div key={cls.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-stone-900">{cls.name}</h4>
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-950 font-bold rounded">
                            {cls.id}
                          </span>
                        </div>
                        <span className="text-stone-500 text-[11px]">
                          Grade: <strong>{cls.grade}</strong> • Lead: <strong>{cls.teacherName}</strong>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs">
                          {cls.averageScore}% Avg
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between text-stone-600">
                        <span className="font-bold">Enrolled Students ({roster.length}):</span>
                        <span className="font-mono text-[11px] text-stone-600 font-bold">
                          🏫 {parentSchool ? parentSchool.name : cls.schoolId}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {roster.length === 0 ? (
                          <span className="text-stone-400 italic">No students rostered yet</span>
                        ) : (
                          roster.map(st => (
                            <span key={st.studentId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-stone-200 font-medium text-stone-800">
                              <span>{st.avatar}</span>
                              <span>{st.studentName}</span>
                              <span className="text-[10px] text-stone-400 font-mono">({st.studentUsername})</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-stone-500 text-[11px]">
                      <span>{classAsgs.length} Active Master Bank Assignments</span>
                      <button
                        onClick={() => {
                          sounds.click();
                          setSelectedSchoolFilter(cls.schoolId);
                          setActiveTab('assignments');
                        }}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        View Class Homework →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CLASS ASSIGNMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span>Class Assignments from Master Question Bank ({filteredAssignments.length})</span>
              </h3>
              <p className="text-xs text-stone-500">
                Assignments published by teachers pulling curated items directly from Master Question Bank
              </p>
            </div>
          </div>

          {/* School Scaling Filter Toolbar */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                <span>Filter School:</span>
              </span>
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 shadow-2xs focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
              >
                <option value="all">🏫 All Schools ({schools.length} Campuses)</option>
                {schools.map(sch => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-700">
                {filteredAssignments.length} of {assignments.length} Assignments
              </span>
              {selectedSchoolFilter !== 'all' && (
                <button
                  onClick={() => setSelectedSchoolFilter('all')}
                  className="text-blue-600 hover:underline text-xs font-bold"
                >
                  Show All Schools
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Scope Notice */}
          {selectedSchoolFilter !== 'all' && (
            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Showing homework assignments isolated for <strong>{schools.find(s => s.id === selectedSchoolFilter)?.name || selectedSchoolFilter}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedSchoolFilter('all')}
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 transition text-[11px]"
              >
                Reset Scope
              </button>
            </div>
          )}

          {filteredAssignments.length === 0 ? (
            <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
              <ClipboardList className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-bold text-stone-700 text-sm">No Assignments Found</p>
              <p className="text-stone-500 text-xs">No assignments match the currently selected school filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-3 font-semibold">Assignment ID</th>
                    <th className="p-3 font-semibold">Title</th>
                    <th className="p-3 font-semibold">Target Classroom</th>
                    <th className="p-3 font-semibold">Subject & Grade</th>
                    <th className="p-3 font-semibold">Questions Included</th>
                    <th className="p-3 font-semibold">Due Date</th>
                    <th className="p-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredAssignments.map((asg) => (
                    <tr key={asg.id} className="hover:bg-stone-50/70">
                      <td className="p-3 font-mono font-bold text-stone-900">{asg.id}</td>
                      <td className="p-3 font-bold text-stone-950">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{asg.title}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-stone-800">
                        {asg.className} <span className="text-[10px] text-stone-400 font-mono">({asg.classId})</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900">{asg.subject}</span>
                        <span className="text-[10px] text-stone-500 block">{asg.grade}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900">{asg.questionIds.length} Master Items</span>
                        <span className="text-[10px] text-stone-400 font-mono block">
                          ({asg.questionIds.join(', ')})
                        </span>
                      </td>
                      <td className="p-3 font-mono text-stone-600">{asg.dueDate}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase">
                          {asg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: STUDENT PERFORMANCE & MASTERY */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Student Performance, Mastery & Telemetry ({filteredStudents.length} Learners)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Full telemetry: quiz scores, subject mastery radar, XP scores, and student login PINs
              </p>
            </div>
          </div>

          {/* School Scaling Filter Toolbar */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-stone-700 flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                <span>Filter School / Affiliation:</span>
              </span>
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 shadow-2xs focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
              >
                <option value="all">👥 All Registered Learners ({students.length})</option>
                {schools.map(sch => (
                  <option key={sch.id} value={sch.id}>
                    🏫 {sch.name} ({sch.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-700">
                {filteredStudents.length} of {students.length} Learners
              </span>
              {selectedSchoolFilter !== 'all' && (
                <button
                  onClick={() => setSelectedSchoolFilter('all')}
                  className="text-blue-600 hover:underline text-xs font-bold"
                >
                  Show All Learners
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Scope Notice */}
          {selectedSchoolFilter !== 'all' && (
            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Showing students enrolled in <strong>{schools.find(s => s.id === selectedSchoolFilter)?.name || selectedSchoolFilter}</strong>
                </span>
              </div>
              <button
                onClick={() => setSelectedSchoolFilter('all')}
                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold hover:bg-blue-100 transition text-[11px]"
              >
                Show All Students
              </button>
            </div>
          )}

          {filteredStudents.length === 0 ? (
            <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2">
              <Award className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="font-bold text-stone-700 text-sm">No Students Found</p>
              <p className="text-stone-500 text-xs">No students match the currently selected school scope.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((st) => (
                <div 
                  key={st.studentId}
                  onClick={() => setInspectStudent(st)}
                  className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 hover:border-stone-400 transition-all cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{st.avatar}</span>
                      <div>
                        <h4 className="font-black text-stone-950 text-sm">{st.studentName}</h4>
                        <span className="font-mono text-[10px] text-stone-500 font-bold">
                          @{st.studentUsername} • {st.studentId}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs">
                        {st.averageScore}%
                      </span>
                      <span className="block text-[10px] text-stone-400 font-mono">Accuracy</span>
                    </div>
                  </div>

                  {/* KPI chips */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-white border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block">LEVEL</span>
                      <span className="font-black text-stone-900 text-sm">Lvl {st.level}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block">XP POINTS</span>
                      <span className="font-black text-amber-700 text-sm">+{st.xp}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-stone-200">
                      <span className="text-[10px] text-stone-400 font-bold block">STREAK</span>
                      <span className="font-black text-orange-600 text-sm">🔥 {st.streakDays}d</span>
                    </div>
                  </div>

                  {/* Subject Mastery */}
                  <div className="space-y-1.5 pt-2 border-t border-stone-200">
                    <span className="text-[11px] font-bold text-stone-600 block">Subject Mastery:</span>
                    {(Object.entries(st.subjectMastery) as [Subject, number][]).map(([sub, score]) => (
                      <div key={sub} className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500">{sub}</span>
                        <span className="font-mono font-bold text-stone-800">{score}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Login Pin & Source */}
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                    <span>Linked: {st.schoolOrParent === 'school' ? `🏫 ${st.schoolName || 'School'}` : `👨‍👧‍👦 Parent`}</span>
                    <span className="inline-flex items-center gap-1 font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      <KeyRound className="w-3 h-3 text-stone-400" />
                      PIN: {allUsers.find(u => u.id === st.studentId)?.pin || '7392'}
                    </span>
                  </div>

                  {/* Direct Action Buttons: Report Card & Reset PIN */}
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReportStudent(st);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold transition flex items-center justify-center gap-1 cursor-pointer text-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Report Card</span>
                    </button>

                    {onResetCredentials && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const uAcc: UserAccount = allUsers.find(u => u.id === st.studentId) || {
                            id: st.studentId,
                            name: st.studentName,
                            username: st.studentUsername,
                            role: 'student' as const,
                            avatar: st.avatar,
                            pin: '7392',
                            grade: st.grade,
                            schoolName: st.schoolName,
                            status: 'active' as const,
                            enrolledAt: '2025-09-01'
                          };
                          setResettingUser(uAcc);
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold transition flex items-center justify-center gap-1 cursor-pointer text-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reset PIN</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: MASTER QUESTION BANK */}
      {/* ========================================================================= */}
      {activeTab === 'question_bank' && (
        <div className="space-y-4">
          <MasterQuestionBank
            grades={grades}
            subjects={subjects}
            questions={questions}
            onAddQuestion={onAddQuestion || (() => {})}
            onEditQuestion={onEditQuestion}
            onDeleteQuestion={onDeleteQuestion}
            onPurgeAllQuestions={onPurgeAllQuestions}
            onSuccessMessage={triggerNotification}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: INTERACTIVE ACTIVITIES & LEARNING QUESTS */}
      {/* ========================================================================= */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Interactive Activities Library ({activities.length})</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Create reusable grade-based learning games, question adventures and playful interactive experiences.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-[#10246f] bg-[#eef4ff] px-3 py-1.5 rounded-2xl flex items-center gap-1.5 border border-[#d7def0]">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{filteredActivities.length} Displayed</span>
                </span>
                <button
                  onClick={() => {
                    sounds.click();
                    setShowInteractiveActivityModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#10246f] hover:bg-[#0c1b54] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Activity</span>
                </button>
              </div>
            </div>

            {/* Grade-Wise Dropdown & Multi-Filter Control Bar */}
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3.5">
              {/* Top Controls: Search & Dropdowns */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search activities by title, grade, or subject..."
                      value={activitySearchQuery}
                      onChange={(e) => setActivitySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 font-medium focus:border-[#10246f] outline-none transition-all bg-white"
                    />
                  </div>

                  {/* 1. GRADE-WISE DROPDOWN */}
                  <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1 shadow-2xs">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">🎓 Grade:</span>
                    <select
                      id="admin-grade-filter-dropdown"
                      value={activityGradeFilter}
                      onChange={(e) => setActivityGradeFilter(e.target.value)}
                      className="bg-transparent text-xs font-black text-stone-800 outline-none cursor-pointer py-1 pr-1"
                    >
                      <option value="all">🌟 All Grades ({activities.length})</option>
                      {grades.map((g) => (
                        <option key={g.id || g.name} value={g.name}>
                          {g.name === 'Preschool' ? '🌱 Preschool (Ages 3–4)' :
                           g.name === 'Foundation' ? '🧩 Foundation (Ages 4–5)' :
                           g.name === 'Grade 1' ? '🎒 Grade 1 (Ages 6–7)' :
                           g.name === 'Grade 2' ? '🚀 Grade 2 (Ages 7–8)' :
                           g.name === 'Grade 3' ? '🌟 Grade 3 (Ages 8–9)' :
                           g.name === 'Grade 4' ? '⚡ Grade 4 (Ages 9–10)' :
                           g.name === 'Grade 5' ? '🏆 Grade 5 (Ages 10–11)' :
                           g.name === 'Grade 6' ? '👑 Grade 6 (Ages 11–12)' : `🎓 ${g.name}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. SUBJECT DROPDOWN */}
                  <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1 shadow-2xs">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">📚 Subject:</span>
                    <select
                      value={activitySubjectFilter}
                      onChange={(e) => setActivitySubjectFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer py-1 pr-1"
                    >
                      <option value="all">All Subjects</option>
                      {subjects.map((s) => (
                        <option key={s.id || s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. FORMAT / TYPE DROPDOWN */}
                  <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1 shadow-2xs">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">🎮 Format:</span>
                    <select
                      value={activityTypeFilter}
                      onChange={(e) => setActivityTypeFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer py-1 pr-1"
                    >
                      <option value="all">All Formats</option>
                      <option value="question_run">🧠 Question Adventure</option>
                      <option value="drag_drop">🖱️ Drag & Drop</option>
                      <option value="matching">🧩 Matching</option>
                      <option value="memory">🃏 Memory</option>
                      <option value="sorting">🧺 Sorting</option>
                      <option value="ordering">🔢 Ordering</option>
                      <option value="pattern">🎨 Pattern</option>
                      <option value="story">📖 Story</option>
                      <option value="arcade">🎮 Arcade</option>
                      <option value="quiz_game">🏆 Quiz Game</option>
                    </select>
                  </div>
                </div>

                {/* Reset Filters button */}
                {(activityGradeFilter !== 'all' || activitySubjectFilter !== 'all' || activityTypeFilter !== 'all' || activitySearchQuery) && (
                  <button
                    onClick={() => {
                      setActivityGradeFilter('all');
                      setActivitySubjectFilter('all');
                      setActivityTypeFilter('all');
                      setActivitySearchQuery('');
                    }}
                    className="text-xs font-bold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* GRADE-WISE QUICK SELECTOR BAR (Pills with Emojis & Counts) */}
              <div className="pt-2.5 border-t border-stone-200/60 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-stone-400" />
                  <span>Grade Bar:</span>
                </span>

                <button
                  onClick={() => setActivityGradeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activityGradeFilter === 'all'
                      ? 'bg-[#10246f] text-white shadow-xs font-black'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <span>🌟 All Grades ({activities.length})</span>
                </button>

                {grades.map((item) => {
                  const label = 
                    item.name === 'Preschool' ? '🌱 Preschool' :
                    item.name === 'Foundation' ? '🧩 Foundation' :
                    item.name === 'Grade 1' ? '🎒 Grade 1' :
                    item.name === 'Grade 2' ? '🚀 Grade 2' :
                    item.name === 'Grade 3' ? '🌟 Grade 3' :
                    item.name === 'Grade 4' ? '⚡ Grade 4' :
                    item.name === 'Grade 5' ? '🏆 Grade 5' :
                    item.name === 'Grade 6' ? '👑 Grade 6' : item.name;
                  const count = activities.filter(a => (a.grades?.length ? a.grades : [a.grade]).includes(item.name)).length;
                  return (
                    <button
                      key={item.id || item.name}
                      onClick={() => setActivityGradeFilter(item.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activityGradeFilter === item.name
                          ? 'bg-[#10246f] text-white shadow-xs font-black'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        activityGradeFilter === item.name ? 'bg-[#0c1b54] text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activities Cards Grid */}
            {filteredActivities.length === 0 ? (
              <div className="p-10 rounded-2xl bg-stone-50 border border-dashed border-stone-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#eef4ff] border border-[#d7def0] text-2xl flex items-center justify-center mx-auto text-[#10246f]">
                  🎯
                </div>
                <h4 className="text-sm font-black text-stone-800">No activities match your filters</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try adjusting the grade selector, subject, or search term above.
                </p>
                <button
                  onClick={() => {
                    setActivityGradeFilter('all');
                    setActivitySubjectFilter('all');
                    setActivityTypeFilter('all');
                    setActivitySearchQuery('');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#10246f] text-white font-bold text-xs hover:bg-[#0c1b54] transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.map((act) => {
                  const gradeBadgeColor = 
                    (act.grades?.[0] || act.grade) === 'Preschool' ? 'bg-pink-100 text-pink-900 border-pink-200' :
                    act.grade === 'Foundation' ? 'bg-blue-100 text-blue-900 border-blue-200' :
                    act.grade === 'Grade 1' ? 'bg-blue-100 text-blue-900 border-blue-200' :
                    act.grade === 'Grade 2' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' :
                    act.grade === 'Grade 3' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                    act.grade === 'Grade 4' ? 'bg-violet-100 text-violet-900 border-violet-200' :
                    act.grade === 'Grade 5' ? 'bg-rose-100 text-rose-900 border-rose-200' :
                    act.grade === 'Grade 6' ? 'bg-teal-100 text-teal-900 border-teal-200' :
                    'bg-stone-100 text-stone-800 border-stone-200';

                  const gradeEmoji =
                    act.grade === 'Preschool' ? '🌱' :
                    act.grade === 'Foundation' ? '🧩' :
                    act.grade === 'Grade 1' ? '🎒' :
                    act.grade === 'Grade 2' ? '🚀' :
                    act.grade === 'Grade 3' ? '🌟' :
                    act.grade === 'Grade 4' ? '⚡' :
                    act.grade === 'Grade 5' ? '🏆' :
                    act.grade === 'Grade 6' ? '👑' : '🎓';

                  return (
                    <div key={act.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-[#10246f] transition-all space-y-3 text-xs flex flex-col justify-between shadow-2xs">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-white border border-stone-200 rounded font-bold">
                              {act.id}
                            </span>
                            {(act.grades?.length ? act.grades : [act.grade]).map(g => (
                              <span key={g} className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${g === 'Preschool' ? 'bg-pink-100 text-pink-900 border-pink-200' : g === 'Foundation' ? 'bg-blue-100 text-blue-900 border-blue-200' : 'bg-stone-100 text-stone-800 border-stone-200'} flex items-center gap-1`}>
                                <span>{g === 'Preschool' ? '🌱' : g === 'Foundation' ? '🧩' : '🎓'}</span><span>{g}</span>
                              </span>
                            ))}
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold text-[9px] uppercase tracking-wider">
                              {act.status || 'Published'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-black uppercase text-[9px] border border-stone-200">
                            {(act.format || act.type).replace('_', ' ')}
                          </span>
                        </div>
                        <strong className="block text-sm font-black text-stone-900 mb-1">{act.title}</strong>
                        <p className="text-stone-600 line-clamp-2">{act.description}</p>
                        
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-stone-200/50">
                          <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                            📚 {act.subject}
                          </span>
                          {(act.learningTags || []).slice(0, 2).map(tag => <span key={tag} className="text-[10px] font-medium text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">#{tag}</span>)}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-stone-200/80 flex items-center justify-between gap-2 text-stone-500">
                        <span className="font-medium text-stone-700">{act.steps?.length || act.questionIds.length} Steps · {act.questionIds.length} Questions</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setPreviewActivity(act)} className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-700 hover:bg-stone-50">Preview</button>
                          <button onClick={() => { setEditingActivity(act); setShowInteractiveActivityModal(true); }} className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white font-bold text-stone-700 hover:bg-stone-50">Edit</button>
                          <button onClick={() => onDeleteActivity?.(act.id)} className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 font-bold hover:bg-rose-50">Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SUBSCRIPTIONS & REVENUE LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 p-2 bg-emerald-50/80 rounded-2xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-900 px-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Billing & Monetization Hub:</span>
            </span>
            <button
              onClick={() => setActiveTab('subscription_charges')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pricing Plans & Charges Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Promo Vouchers ({vouchers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Subscriptions Ledger ({subscriptions.length})</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-3">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>8. Subscriptions: Active, Expired, Trials & Renewals ({subscriptions.length})</span>
              </h3>
              <p className="text-xs text-stone-500">
                Monitor recurring customer subscriptions, expired plans, grace periods, and lifecycle renewals
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400 font-semibold block">Total Cleared</span>
              <strong className="text-xl font-black text-emerald-600 font-mono">
                ${totalRevenue.toFixed(2)} USD
              </strong>
            </div>
          </div>

          {/* Subscriptions Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Active Plans</span>
              <span className="text-xl font-black text-emerald-950 font-mono">
                {subscriptions.filter(s => s.status === 'active').length}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 border border-red-100">
              <span className="text-[10px] text-red-700 font-bold uppercase block">Expired Plans</span>
              <span className="text-xl font-black text-red-950 font-mono">
                {subscriptions.filter(s => s.status === 'expired').length}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-[10px] text-amber-700 font-bold uppercase block">Free Trials</span>
              <span className="text-xl font-black text-amber-950 font-mono">
                {subscriptions.filter(s => s.status === 'trial').length}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200">
              <span className="text-[10px] text-stone-600 font-bold uppercase block">Canceled / Inactive</span>
              <span className="text-xl font-black text-stone-900 font-mono">
                {subscriptions.filter(s => s.status === 'canceled').length}
              </span>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl w-fit text-xs font-bold">
            {(['all', 'active', 'expired', 'trial', 'canceled'] as const).map(st => (
              <button
                key={st}
                onClick={() => setSubscriptionStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                  subscriptionStatusFilter === st
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {st === 'all' ? 'All Subscriptions' : `${st} Plans`}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-3 font-semibold">Transaction ID</th>
                  <th className="p-3 font-semibold">Account & Role</th>
                  <th className="p-3 font-semibold">Plan Name</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Payment Date</th>
                  <th className="p-3 font-semibold">Renewal Date</th>
                  <th className="p-3 font-semibold">Voucher</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {subscriptions
                  .filter(s => subscriptionStatusFilter === 'all' || s.status === subscriptionStatusFilter)
                  .map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-50/70">
                      <td className="p-3 font-mono font-bold text-stone-900">{sub.id}</td>
                      <td className="p-3">
                        <strong className="block text-stone-900">{sub.accountName}</strong>
                        <span className="text-[10px] text-stone-400 font-mono">{sub.accountId} ({sub.role})</span>
                      </td>
                      <td className="p-3 font-semibold text-stone-800">{sub.planName}</td>
                      <td className="p-3 font-mono font-black text-stone-900">${sub.amount.toFixed(2)}</td>
                      <td className="p-3 font-mono text-stone-500">{sub.paymentDate}</td>
                      <td className="p-3 font-mono text-stone-500">{sub.renewalDate}</td>
                      <td className="p-3">
                        {sub.voucherUsed ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-950 font-mono font-bold text-[10px]">
                            {sub.voucherUsed}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          sub.status === 'active' ? 'bg-emerald-100 text-emerald-900' :
                          sub.status === 'expired' ? 'bg-red-100 text-red-900' :
                          sub.status === 'trial' ? 'bg-amber-100 text-amber-900' :
                          'bg-stone-200 text-stone-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onUpdateSubscriptionStatus && (
                            <>
                              <button
                                onClick={() => {
                                  onUpdateSubscriptionStatus(sub.id, 'active', 30);
                                  triggerNotification(`Extended subscription ${sub.id} by +30 Days`);
                                }}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-[10px] font-bold cursor-pointer"
                                title="Add 30 days renewal"
                              >
                                +30 Days
                              </button>
                              {sub.status === 'active' ? (
                                <button
                                  onClick={() => {
                                    onUpdateSubscriptionStatus(sub.id, 'expired');
                                    triggerNotification(`Marked subscription ${sub.id} as Expired`);
                                  }}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                  title="Force expire"
                                >
                                  Expire
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    onUpdateSubscriptionStatus(sub.id, 'active');
                                    triggerNotification(`Activated subscription ${sub.id}`);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                  title="Reactivate plan"
                                >
                                  Activate
                                </button>
                              )}
                            </>
                          )}
                        </div>
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
      {/* TAB 9: PRICING PLANS & SUBSCRIPTION CHARGES CONFIG */}
      {/* ========================================================================= */}
      {activeTab === 'subscription_charges' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 p-2 bg-emerald-50/80 rounded-2xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-900 px-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Billing & Monetization Hub:</span>
            </span>
            <button
              onClick={() => setActiveTab('subscription_charges')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pricing Plans & Charges Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Promo Vouchers ({vouchers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Subscriptions Ledger ({subscriptions.length})</span>
            </button>
          </div>

          <PricingPlanManager
            plans={subscriptionPlans || SUBSCRIPTION_PLANS}
            subscriptions={subscriptions}
            onAddPlan={onAddSubscriptionPlan || (() => {})}
            onUpdatePlan={onUpdateSubscriptionPlan}
            onDeletePlan={onDeleteSubscriptionPlan || (() => {})}
            onSuccessMessage={triggerNotification}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: PROMO VOUCHERS */}
      {/* ========================================================================= */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 p-2 bg-emerald-50/80 rounded-2xl border border-emerald-100">
            <span className="text-xs font-bold text-emerald-900 px-2 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>Billing & Monetization Hub:</span>
            </span>
            <button
              onClick={() => setActiveTab('subscription_charges')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pricing Plans & Charges Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab('vouchers')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white shadow-xs"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Promo Vouchers ({vouchers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Subscriptions Ledger ({subscriptions.length})</span>
            </button>
          </div>

          <VoucherManager
            vouchers={vouchers}
            onAddVoucher={onAddVoucher}
            onDeleteVoucher={onDeleteVoucher || (() => {})}
            onToggleVoucherActive={onToggleVoucherActive || (() => {})}
            onSuccessMessage={triggerNotification}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: ROLES & PERMISSIONS (RBAC MATRIX) */}
      {/* ========================================================================= */}
      {activeTab === 'roles_permissions' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-stone-100">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Role-Based Access Control (RBAC) Permission Matrix</span>
            </h3>
            <p className="text-xs text-stone-500">
              Precise capabilities, data visibility, and database authorization scopes across all 6 roles
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-3 font-semibold">Capability & Resource</th>
                  <th className="p-3 font-semibold text-center">Admin</th>
                  <th className="p-3 font-semibold text-center">Content Mgr</th>
                  <th className="p-3 font-semibold text-center">School</th>
                  <th className="p-3 font-semibold text-center">Teacher</th>
                  <th className="p-3 font-semibold text-center">Parent</th>
                  <th className="p-3 font-semibold text-center">Student</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {[
                  { name: 'Full System Oversight & Financial Clearing', adm: true, con: false, sch: false, tea: false, par: false, stu: false },
                  { name: 'Author & Publish Questions to Master Bank', adm: true, con: true, sch: false, tea: false, par: false, stu: false },
                  { name: 'School Campus Roster & Seat License Allocation', adm: true, con: false, sch: true, tea: false, par: false, stu: false },
                  { name: 'Create Classes & Assign Faculty Teachers', adm: true, con: false, sch: true, tea: true, par: false, stu: false },
                  { name: 'Create Student Credentials (Username + PIN)', adm: true, con: false, sch: true, tea: true, par: false, stu: false },
                  { name: 'Publish Class Assignments from Master Bank', adm: true, con: false, sch: false, tea: true, par: false, stu: false },
                  { name: 'Monitor Child Performance & Accuracy Analytics', adm: true, con: false, sch: true, tea: true, par: true, stu: false },
                  { name: 'Play Daily Quizzes, Games & Boss Battles', adm: true, con: true, sch: false, tea: true, par: false, stu: true },
                  { name: 'Issue & Manage Promo Discount Vouchers', adm: true, con: false, sch: false, tea: false, par: false, stu: false }
                ].map((cap, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/70">
                    <td className="p-3 font-semibold text-stone-900">{cap.name}</td>
                    <td className="p-3 text-center">{cap.adm ? '✅' : '❌'}</td>
                    <td className="p-3 text-center">{cap.con ? '✅' : '❌'}</td>
                    <td className="p-3 text-center">{cap.sch ? '✅' : '❌'}</td>
                    <td className="p-3 text-center">{cap.tea ? '✅' : '❌'}</td>
                    <td className="p-3 text-center">{cap.par ? '✅' : '❌'}</td>
                    <td className="p-3 text-center">{cap.stu ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 14: IMMUTABLE AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'activity_log' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-stone-700" />
                <span>Immutable System Audit Trail ({auditLogs.length} Events)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Chronological log stream of all administrative, pedagogical, and financial operations
              </p>
            </div>
            <span className="text-xs text-stone-400 font-mono">Real-Time</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Account & Role</th>
                  <th className="p-3 font-semibold">Action Tag</th>
                  <th className="p-3 font-semibold">Event Description</th>
                  <th className="p-3 font-semibold">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {auditLogs.map((log, idx) => (
                  <tr key={`${log.id || 'log'}-${idx}`} className="hover:bg-stone-50/70">
                    <td className="p-3 font-mono text-stone-500">{log.timestamp}</td>
                    <td className="p-3">
                      <strong className="block text-stone-900">{log.accountName}</strong>
                      <span className="text-[10px] text-stone-400 font-mono">{log.accountId} ({log.role})</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-stone-100 font-mono font-bold text-[10px] text-stone-800 border border-stone-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-stone-800 max-w-md">{log.details}</td>
                    <td className="p-3 font-mono text-stone-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 15: DATABASE INSPECTOR & EXPORT JSON */}
      {/* ========================================================================= */}
      {activeTab === 'database_inspector' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase PostgreSQL Database Inspector</span>
              </h3>
              <p className="text-xs text-stone-500">
                Raw table counts, JSON export, and schema synchronization status
              </p>
            </div>

            <button
              onClick={handleExportFullJSON}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Complete Platform JSON</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {[
              { table: 'users', count: allUsers.length, desc: '6 role personas' },
              { table: 'schools', count: schools.length, desc: 'Campus records' },
              { table: 'classes', count: classes.length, desc: 'Classroom sections' },
              { table: 'assignments', count: assignments.length, desc: 'Published sets' },
              { table: 'student_progress', count: students.length, desc: 'Telemetry & XP' },
              { table: 'questions', count: questions.length, desc: 'Master Bank' },
              { table: 'activities', count: activities.length, desc: 'Quests & Bosses' },
              { table: 'subscriptions', count: subscriptions.length, desc: 'Clearing ledger' },
              { table: 'vouchers', count: vouchers.length, desc: 'Discount coupons' },
              { table: 'audit_logs', count: auditLogs.length, desc: 'Immutable events' },
            ].map((t) => (
              <div key={t.table} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="font-mono font-bold text-stone-400 block text-[10px] uppercase">
                  public.{t.table}
                </span>
                <span className="text-xl font-black text-stone-900 font-mono block mt-1">
                  {t.count} rows
                </span>
                <span className="text-[10px] text-stone-500 font-sans">{t.desc}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 font-mono">
                PostgreSQL DDL Summary
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Row Level Security: Enabled</span>
            </div>
            <pre className="text-[11px] font-mono text-stone-300 overflow-x-auto p-2 bg-stone-950 rounded-xl max-h-48">
{`-- PforPencil Schema Overview
CREATE TABLE public.users (id text PRIMARY KEY, role text, name text, email text, username text, pin text, grade text);
CREATE TABLE public.schools (id text PRIMARY KEY, name text, admin_email text, total_seats int, allocated_seats int);
CREATE TABLE public.classes (id text PRIMARY KEY, name text, grade text, teacher_id text, student_ids text[]);
CREATE TABLE public.questions (id text PRIMARY KEY, subject text, grade text, category text, skill text, prompt text, options text[], correct_index int);
CREATE TABLE public.subscriptions (id text PRIMARY KEY, account_id text, amount numeric, status text, payment_date date);
CREATE TABLE public.audit_logs (id text PRIMARY KEY, timestamp timestamp, account_id text, action text, details text);`}
            </pre>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: USER DETAIL INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {inspectUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setInspectUser(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{inspectUser.avatar}</span>
                <div>
                  <h3 className="text-base font-black text-stone-900">{inspectUser.name}</h3>
                  <span className="font-mono text-stone-400">{inspectUser.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setInspectUser(null)} 
                className="text-stone-400 hover:text-stone-900 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">Role</span>
                  <span className="font-bold text-stone-900 uppercase">{inspectUser.role}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">Status</span>
                  <span className="font-bold text-emerald-700 uppercase">{inspectUser.status}</span>
                </div>
              </div>

              {inspectUser.role === 'student' ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Student Credentials</span>
                  <div className="font-mono text-xs">Username: <strong>{inspectUser.username}</strong></div>
                  <div className="font-mono text-xs">4-Digit Login PIN: <strong>{inspectUser.pin || '7392'}</strong></div>
                  <div className="text-[11px] text-blue-700">Grade: {inspectUser.grade}</div>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Email Address</span>
                  <div className="font-mono font-bold text-stone-900">{inspectUser.email}</div>
                </div>
              )}

              {inspectUser.schoolName && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">School Affiliation</span>
                  <div className="font-bold text-stone-900">{inspectUser.schoolName}</div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = inspectUser;
                    setInspectUser(null);
                    setEditingUser(target);
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold flex items-center gap-1.5 cursor-pointer text-xs transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Basic Details</span>
                </button>

                {onResetCredentials && (
                  <button
                    onClick={() => {
                      const target = inspectUser;
                      setInspectUser(null);
                      setResettingUser(target);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold flex items-center gap-1.5 cursor-pointer text-xs transition-all"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>{inspectUser.role === 'student' ? 'Reset Student PIN' : `Reset ${inspectUser.role.replace('_', ' ')} Password`}</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUESTION DETAIL INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {inspectQuestion && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setInspectQuestion(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 text-xs my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                  {inspectQuestion.id}
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  {inspectQuestion.subject} • {inspectQuestion.grade}
                </h3>
              </div>
              <button onClick={() => setInspectQuestion(null)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">Prompt</span>
                <p className="font-bold text-stone-900 text-sm">{inspectQuestion.prompt}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1.5">Options & Choices</span>
                <div className="space-y-1.5">
                  {inspectQuestion.options.map((opt, i) => (
                    <div 
                      key={i}
                      className={`p-2.5 rounded-xl border font-medium flex items-center justify-between ${
                        i === inspectQuestion.correctIndex 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-700'
                      }`}
                    >
                      <span>{opt}</span>
                      {i === inspectQuestion.correctIndex && (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                          Correct Choice
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-0.5">Explanation</span>
                <p className="text-emerald-950">{inspectQuestion.explanation}</p>
              </div>

              {inspectQuestion.hint && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block mb-0.5">Hint</span>
                  <p className="text-amber-950">{inspectQuestion.hint}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setInspectQuestion(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD QUESTION MODAL */}
      {/* ========================================================================= */}
      {showAddQuestionModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setShowAddQuestionModal(false)}
        >
          <div 
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[92vh] overflow-y-auto overscroll-contain modal-scroll-container p-5 sm:p-6 space-y-4 text-xs my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="font-bold text-[10px] text-blue-600 uppercase">Super Admin / Curator</span>
                <h3 className="text-base font-black text-stone-900">Add Question to Master Bank</h3>
              </div>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value as Subject)}
                    className="w-full p-2 rounded-xl border border-stone-200 font-bold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id || s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Grade Level</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value as GradeLevel)}
                    className="w-full p-2 rounded-xl border border-stone-200 font-bold"
                  >
                    {grades.map((g) => (
                      <option key={g.id || g.name} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Skill</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Addition with Carrying"
                    value={formSkill}
                    onChange={(e) => setFormSkill(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Numbers & Operations"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter the child-friendly question prompt here..."
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">4 Option Choices (Check the correct answer)</label>
                <div className="space-y-2">
                  {formOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswerIndex"
                        checked={formCorrectIndex === idx}
                        onChange={() => setFormCorrectIndex(idx)}
                        className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[idx] = e.target.value;
                          setFormOptions(updated);
                        }}
                        className="w-full p-2 rounded-xl border border-stone-200"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase mb-1">Child-Friendly Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Explain why the answer is correct..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full p-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Save & Publish Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* UNIFIED PROVISION SCHOOL CAMPUS MODAL */}
      {showProvisionSchoolModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setShowProvisionSchoolModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Provision School Campus</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-blue-700 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      ID: {generateAccountId('school', [...schools, ...allUsers.filter((u) => u.role === 'school')])}
                    </span>
                    <span className="text-[11px] text-purple-700 font-mono font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                      Code: {generateSchoolCode(newSchoolName || 'School', schools)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                id="btn-close-provision-school"
                onClick={() => setShowProvisionSchoolModal(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Register a school organization and issue administrative login credentials. Once provisioned, school administrators log into their dedicated <strong>School Portal</strong> to create classrooms, assign faculty teachers, and enroll students.
            </p>

            <form onSubmit={handleCreateSchool} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">School Official Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pinecrest Elementary Academy"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Principal / Admin Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="principal@pinecrest.edu"
                    value={newSchoolEmail}
                    onChange={(e) => setNewSchoolEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Seat License Tier</label>
                  <select
                    value={newSchoolSeats}
                    onChange={(e) => setNewSchoolSeats(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={100}>Basic Tier — 100 Seats</option>
                    <option value={250}>Standard Tier — 250 Seats</option>
                    <option value={500}>Campus Tier — 500 Seats</option>
                    <option value={1000}>District Enterprise — 1,000 Seats</option>
                  </select>
                </div>
              </div>

              {/* Regional Scope & Standard Curriculum */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Country</label>
                  <select
                    value={newSchoolCountry}
                    onChange={(e) => {
                      const c = e.target.value;
                      setNewSchoolCountry(c);
                      const defaultState = COUNTRY_STATE_MAP[c]?.[0] || '';
                      setNewSchoolState(defaultState);
                      const defaultCurr = COUNTRY_CURRICULUM_MAP[c]?.[0] || 'Common Core (US)';
                      setNewSchoolCurriculum(defaultCurr);
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">State / Province</label>
                  <select
                    value={newSchoolState}
                    onChange={(e) => setNewSchoolState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {(COUNTRY_STATE_MAP[newSchoolCountry] || ['General']).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Curriculum Standard</label>
                  <select
                    value={newSchoolCurriculum}
                    onChange={(e) => setNewSchoolCurriculum(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {(COUNTRY_CURRICULUM_MAP[newSchoolCountry] || ['General Curriculum']).map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* License Term / Validity Duration */}
              <div>
                <label className="block font-bold text-stone-700 mb-1">Subscription Term / Validity Duration</label>
                <select
                  value={newSchoolContractDuration}
                  onChange={(e) => setNewSchoolContractDuration(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="30_days">1 Month License (30 Days Validity)</option>
                  <option value="90_days">3 Months License (90 Days Validity)</option>
                  <option value="180_days">6 Months / 1 Semester (180 Days Validity)</option>
                  <option value="1_year">1 Academic Year (365 Days Validity)</option>
                  <option value="2_years">2 Academic Years (730 Days Validity)</option>
                  <option value="3_years">3 Academic Years Multi-Year District License</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block">Real-World School Workflow:</span>
                <span className="text-blue-700 text-[11px] block leading-normal">
                  The generated campus account provides the school administrative access. The school principal or staff can log in to create cohorts, invite faculty teachers, and roster students directly in the School Portal.
                </span>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProvisionSchoolModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                >
                  <School className="w-4 h-4" />
                  <span>Provision School Campus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Multi-Student Creator Modal (Requirement 3) */}
      <ParentStudentModal
        isOpen={showParentStudentModal}
        initialMode={parentModalInitialMode}
        onClose={() => {
          setShowParentStudentModal(false);
          setSelectedParentForModal(null);
        }}
        parent={selectedParentForModal}
        allParents={allUsers.filter(u => u.role === 'parent')}
        allUsers={allUsers}
        availableGrades={grades.map(g => g.name)}
        existingStudentsCount={students.length}
        onAddUser={onAddUser}
        onAddStudentsToParent={(parentId, studentsList) => {
          if (onAddStudentsToParent) {
            onAddStudentsToParent(parentId, studentsList);
          } else {
            studentsList.forEach(s => onAddUser(s.student));
          }
          triggerNotification(`Created ${studentsList.length} child account(s) linked to parent!`);
        }}
      />

      {/* School Member (Teacher / Student) Provisioning Modal */}
      <SchoolMemberModal
        isOpen={showSchoolMemberModal}
        onClose={() => {
          setShowSchoolMemberModal(false);
          setSchoolMemberSelectedSchoolId('');
        }}
        mode={schoolMemberModalMode}
        schools={schools}
        selectedSchoolId={schoolMemberSelectedSchoolId}
        allUsers={allUsers}
        availableGrades={grades.map(g => g.name)}
        classes={classes}
        onAddTeacher={(newTeacher) => {
          onAddUser(newTeacher);
          triggerNotification(`Teacher ${newTeacher.name} (${newTeacher.id}) provisioned for school faculty!`);
        }}
        onAddStudent={(newStudent, newProgress) => {
          onAddUser(newStudent);
          triggerNotification(`Student ${newStudent.name} (${newStudent.id}, @${newStudent.username}) enrolled in school roster!`);
        }}
      />

      <InteractiveActivityPreviewModal
        activity={previewActivity}
        questions={questions}
        onClose={() => setPreviewActivity(null)}
      />

      {/* Interactive Activity Modal (Requirement 7) */}
      <InteractiveActivityModal
        isOpen={showInteractiveActivityModal}
        onClose={() => { setShowInteractiveActivityModal(false); setEditingActivity(null); }}
        availableGrades={grades.map(g => g.name)}
        availableSubjects={subjects.map(s => s.name)}
        questions={questions}
        activity={editingActivity}
        onAddActivity={(newAct) => {
          onAddActivity?.(newAct);
          triggerNotification(`Created interactive activity: ${newAct.title}!`);
        }}
        onEditActivity={(updatedAct) => {
          // The parent App owns the actual activity state; this callback is wired below when available.
          onEditActivity?.(updatedAct);
          triggerNotification(`Updated interactive activity: ${updatedAct.title}!`);
        }}
      />

      {/* Global Reset Password / PIN Modal (for Admin, School, Teacher, Parent, Student, Content Manager) */}
      {resettingUser && onResetCredentials && (
        <ResetCredentialsModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
          onSaveCredentials={(userId, newSecret, isPin, newUsername) => {
            onResetCredentials(userId, newSecret, isPin, newUsername);
            triggerNotification(
              isPin
                ? `PIN for student ${resettingUser.name} (${newUsername || resettingUser.username || userId}) updated to: ${newSecret}`
                : `Password for ${resettingUser.name} (${resettingUser.role.replace('_', ' ')}) updated successfully!`
            );
          }}
        />
      )}

      {/* Edit User Profile Modal (Basic Details: name, avatar, grade, status, schoolName) */}
      <EditUserProfileModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSave={(updatedUser) => {
          onUpdateUserProfile?.(updatedUser);
          triggerNotification(`Profile details for ${updatedUser.name} (${updatedUser.id}) updated successfully!`);
        }}
        availableSchools={schools}
        availableGrades={grades.map(g => g.name)}
        canEditStatus={true}
      />

      {/* Student Analytics & Detailed Report Card Modal */}
      {selectedReportStudent && (
        <StudentReportCardModal
          student={selectedReportStudent}
          userAccount={allUsers.find(u => u.id === selectedReportStudent.studentId)}
          onClose={() => setSelectedReportStudent(null)}
          viewerRole="admin"
        />
      )}
    </div>
  );
}
