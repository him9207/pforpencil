import { useEffect, useState } from 'react';
import { 
  UserAccount, 
  UserRole,
  Question, 
  Activity, 
  StudentProgress, 
  ClassRoom, 
  ClassAssignment,
  SchoolOrganization, 
  Voucher, 
  SubscriptionRecord, 
  SubscriptionPlan,
  AuditLog,
  CurriculumGrade,
  CurriculumSubject
} from './types';
import { 
  INITIAL_USERS, 
  INITIAL_QUESTIONS, 
  INITIAL_ACTIVITIES, 
  INITIAL_STUDENT_PROGRESS, 
  INITIAL_CLASSES, 
  INITIAL_ASSIGNMENTS,
  INITIAL_SCHOOLS, 
  INITIAL_VOUCHERS, 
  INITIAL_SUBSCRIPTION_RECORDS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_GRADES,
  INITIAL_SUBJECTS,
  SUBSCRIPTION_PLANS
} from './mockData';
import { sounds } from './utils/audio';
import { sanitizeQuestionBank } from './utils/idAndUsernameGenerator';

// Common & Shared Layout
import { Navbar, HomePage, RegionSelectorModal, ErrorBoundary } from './common';

// Feature Modules
import { 
  AuthModal,
  StudentPortal,
  ParentPortal,
  TeacherPortal,
  SchoolPortal,
  ContentManagerPortal,
  AdminPortal,
  SubscriptionsView,
  SupabaseSchemaModal
} from './modules';
import { INITIAL_FRAMEWORKS } from './data/curriculumData';
import { PRESCHOOL_QUESTIONS } from './data/preschoolMasterQuestions';
import { 
  syncProgressToSupabase, 
  syncUserToSupabase, 
  syncQuestionToSupabase, 
  syncSchoolToSupabase, 
  syncClassToSupabase, 
  syncActivityToSupabase,
  syncAssignmentToSupabase,
  syncAuditLogToSupabase,
  syncVoucherToSupabase,
  syncSubscriptionToSupabase,
  deleteQuestionFromSupabase,
  fetchUsersFromSupabase,
  fetchQuestionsFromSupabase,
  fetchActivitiesFromSupabase,
  fetchSchoolsFromSupabase,
  fetchClassesFromSupabase,
  fetchStudentProgressFromSupabase,
  fetchCategoryMastersFromSupabase,
  fetchSkillMastersFromSupabase,
  fetchAssignmentsFromSupabase,
  fetchAuditLogsFromSupabase,
  fetchVouchersFromSupabase,
  fetchSubscriptionsFromSupabase,
  isSupabaseConfigured
} from './database';
import { ensureActivityId, getActivityDatabaseView, loadActivityDatabase, saveActivityDatabase } from './data/activityData';
import { loadQuestionBankMasters, saveQuestionBankMasters } from './data/questionBankMasterData';

let logCounter = 0;
function generateLogId(): string {
  logCounter += 1;
  return `LOG-${Date.now()}-${logCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function App() {
  // Core Platform State - Persistent with localStorage (Standardized V2 auth with unique usernames & passwords)
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    try {
      // Clear legacy accounts created under old random schema
      localStorage.removeItem('pforpencil_all_users_v1');
      const saved = localStorage.getItem('pforpencil_all_users_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge initial system users so demo accounts always stay accessible
          const existingIds = new Set(parsed.map((u: UserAccount) => u.id));
          const missingDefaults = INITIAL_USERS.filter((u) => !existingIds.has(u.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch {}
    return INITIAL_USERS;
  });
  useEffect(() => {
    try {
      localStorage.setItem('pforpencil_all_users_v2', JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  // Default to Emma Watson (Student STU00001) with active region preference (defaults to Australia / NSW)
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const base = INITIAL_USERS[5];
    try {
      const savedUser = localStorage.getItem('pforpencil_current_user_v1');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.id) return parsedUser;
      }
      const saved = localStorage.getItem('pforpencil_active_region');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...base,
          country: parsed.country || 'Australia',
          state: parsed.state || 'NSW',
          curriculum: parsed.curriculum || 'Australian Curriculum (ACARA)'
        };
      }
    } catch {}
    return {
      ...base,
      country: 'Australia',
      state: 'NSW',
      curriculum: 'Australian Curriculum (ACARA)'
    };
  });
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('pforpencil_current_user_v1', JSON.stringify(currentUser));
      }
    } catch {}
  }, [currentUser]);

  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      // Clear legacy/temp storage keys containing stale or incorrectly populated questions
      localStorage.removeItem('pforpencil_question_bank_v1');
      localStorage.removeItem('pforpencil_question_bank_v2');
      localStorage.removeItem('funlearn_question_bank_v3');
      localStorage.removeItem('pforpencil_question_bank_masters_v1');
      localStorage.removeItem('pforpencil_question_bank_masters_v2');
      localStorage.removeItem('funlearn_question_bank_masters_v3');
    } catch {}
    return sanitizeQuestionBank(INITIAL_QUESTIONS).questions;
  });
  // Questions synchronize directly with Supabase via syncQuestionToSupabase / fetchQuestionsFromSupabase
  // Interactive Activities use their own normalized database store.
  // The Activity[] state is the hydrated UI view; Question Bank storage remains separate.
  const [activities, setActivities] = useState<Activity[]>(() => getActivityDatabaseView(loadActivityDatabase()));
  useEffect(() => {
    saveActivityDatabase(activities);
  }, [activities]);

  const [studentProgressMap, setStudentProgressMap] = useState<Record<string, StudentProgress>>(() => {
    try {
      const saved = localStorage.getItem('pforpencil_student_progress_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_STUDENT_PROGRESS, ...parsed };
        }
      }
    } catch {}
    return INITIAL_STUDENT_PROGRESS;
  });
  useEffect(() => {
    try { localStorage.setItem('pforpencil_student_progress_v1', JSON.stringify(studentProgressMap)); } catch {}
  }, [studentProgressMap]);

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem('pforpencil_classes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CLASSES;
  });
  useEffect(() => {
    try { localStorage.setItem('pforpencil_classes_v1', JSON.stringify(classes)); } catch {}
  }, [classes]);

  const [assignments, setAssignments] = useState<ClassAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('pforpencil_assignments_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_ASSIGNMENTS;
  });
  useEffect(() => {
    try { localStorage.setItem('pforpencil_assignments_v1', JSON.stringify(assignments)); } catch {}
  }, [assignments]);

  const [schools, setSchools] = useState<SchoolOrganization[]>(() => {
    try {
      const saved = localStorage.getItem('pforpencil_schools_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((s: SchoolOrganization) => s.id));
          const missing = INITIAL_SCHOOLS.filter((s) => !existingIds.has(s.id));
          return [...parsed, ...missing];
        }
      }
    } catch {}
    return INITIAL_SCHOOLS;
  });
  useEffect(() => {
    try { localStorage.setItem('pforpencil_schools_v1', JSON.stringify(schools)); } catch {}
  }, [schools]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(INITIAL_SUBSCRIPTION_RECORDS);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [vouchers, setVouchers] = useState<Voucher[]>(INITIAL_VOUCHERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [grades, setGrades] = useState<CurriculumGrade[]>(INITIAL_GRADES);
  const [subjects, setSubjects] = useState<CurriculumSubject[]>(INITIAL_SUBJECTS);

  // -------------------------------------------------------------
  // Live Supabase Database Hydration & Synchronization
  // Pulls real tables (profiles, questions, activities, schools, classes, student_progress, category_masters, skill_masters)
  // so the entire project syncs with live database storage.
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let isMounted = true;

    async function hydrateAllFromSupabase() {
      try {
        // 1. User Profiles
        const usersRes = await fetchUsersFromSupabase();
        if (usersRes.success && Array.isArray(usersRes.users) && usersRes.users.length > 0 && isMounted) {
          setAllUsers((prev) => {
            const map = new Map<string, UserAccount>();
            INITIAL_USERS.forEach((u) => map.set(u.id, u));
            prev.forEach((u) => map.set(u.id, u));
            usersRes.users?.forEach((u) => map.set(u.id, u));
            return Array.from(map.values());
          });
        }

        // 2. Questions (Master Question Bank)
        const questionsRes = await fetchQuestionsFromSupabase();
        if (questionsRes.success && Array.isArray(questionsRes.questions) && questionsRes.questions.length > 0 && isMounted) {
          const sanitized = sanitizeQuestionBank(questionsRes.questions).questions;
          setQuestions(sanitized);
        }

        // 3. Interactive Activities
        const actRes = await fetchActivitiesFromSupabase();
        if (actRes.success && Array.isArray(actRes.activities) && actRes.activities.length > 0 && isMounted) {
          setActivities(actRes.activities);
        }

        // 4. Schools
        const schoolsRes = await fetchSchoolsFromSupabase();
        if (schoolsRes.success && Array.isArray(schoolsRes.schools) && schoolsRes.schools.length > 0 && isMounted) {
          setSchools((prev) => {
            const map = new Map<string, SchoolOrganization>();
            INITIAL_SCHOOLS.forEach((s) => map.set(s.id, s));
            prev.forEach((s) => map.set(s.id, s));
            schoolsRes.schools?.forEach((s) => map.set(s.id, s));
            return Array.from(map.values());
          });
        }

        // 5. Classes
        const classesRes = await fetchClassesFromSupabase();
        if (classesRes.success && Array.isArray(classesRes.classes) && classesRes.classes.length > 0 && isMounted) {
          setClasses((prev) => {
            const map = new Map<string, ClassRoom>();
            INITIAL_CLASSES.forEach((c) => map.set(c.id, c));
            prev.forEach((c) => map.set(c.id, c));
            classesRes.classes?.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }

        // 6. Student Progress
        const progressRes = await fetchStudentProgressFromSupabase();
        if (progressRes.success && progressRes.progressMap && Object.keys(progressRes.progressMap).length > 0 && isMounted) {
          setStudentProgressMap((prev) => ({
            ...prev,
            ...progressRes.progressMap
          }));
        }

        // 7. Categories and Skills Masters
        const catRes = await fetchCategoryMastersFromSupabase();
        const skillRes = await fetchSkillMastersFromSupabase();
        if (isMounted && ((catRes.success && catRes.categories && catRes.categories.length > 0) || (skillRes.success && skillRes.skills && skillRes.skills.length > 0))) {
          const currentMasters = loadQuestionBankMasters(grades, subjects);
          const mergedCategories = catRes.categories && catRes.categories.length > 0 ? catRes.categories : currentMasters.categories;
          const mergedSkills = skillRes.skills && skillRes.skills.length > 0 ? skillRes.skills : currentMasters.skills;
          saveQuestionBankMasters({
            categories: mergedCategories,
            skills: mergedSkills
          });
        }

        // 8. Class Assignments
        const asnRes = await fetchAssignmentsFromSupabase();
        if (asnRes.success && Array.isArray(asnRes.assignments) && asnRes.assignments.length > 0 && isMounted) {
          setAssignments(asnRes.assignments);
        }

        // 9. Audit Logs
        const logsRes = await fetchAuditLogsFromSupabase();
        if (logsRes.success && Array.isArray(logsRes.logs) && logsRes.logs.length > 0 && isMounted) {
          setAuditLogs(logsRes.logs);
        }

        // 10. Vouchers
        const vouchersRes = await fetchVouchersFromSupabase();
        if (vouchersRes.success && Array.isArray(vouchersRes.vouchers) && vouchersRes.vouchers.length > 0 && isMounted) {
          setVouchers(vouchersRes.vouchers);
        }

        // 11. Subscriptions
        const subsRes = await fetchSubscriptionsFromSupabase();
        if (subsRes.success && Array.isArray(subsRes.subscriptions) && subsRes.subscriptions.length > 0 && isMounted) {
          setSubscriptions(subsRes.subscriptions);
        }
      } catch (syncErr) {
        console.warn('Live Supabase hydration notice:', syncErr);
      }
    }

    hydrateAllFromSupabase();
    return () => { isMounted = false; };
  }, []);

  // Navigation & Modals
  const [currentView, setCurrentView] = useState<string>('home');
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    initialScreen: 'signin' | 'register';
    initialRole: UserRole;
  }>({
    isOpen: false,
    initialScreen: 'signin',
    initialRole: 'parent'
  });
  const [supabaseModalOpen, setSupabaseModalOpen] = useState<boolean>(false);
  const [regionModalOpen, setRegionModalOpen] = useState<boolean>(false);

  // Update user regional and curriculum preferences
  const handleSaveRegion = (country: string, state: string, curriculum: string, grade?: string) => {
    try {
      localStorage.setItem('pforpencil_active_region', JSON.stringify({ country, state, curriculum }));
    } catch {}
    const updatedUser: UserAccount = {
      ...currentUser,
      country,
      state,
      curriculum,
      ...(grade ? { grade: grade as any } : {})
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    if (currentUser.role === 'student' && studentProgressMap[currentUser.id]) {
      setStudentProgressMap(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          country,
          state,
          curriculum,
          ...(grade ? { grade: grade as any } : {})
        }
      }));
    }

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_REGIONAL_PROFILE',
      details: `Updated regional profile to Country: ${country}, State: ${state}, Curriculum: ${curriculum}${grade ? `, Grade: ${grade}` : ''}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Register New User Handler (from AuthModal or HomePage direct registration)
  const handleRegisterUser = (newUser: UserAccount, newProgress?: StudentProgress) => {
    let finalUser = { ...newUser };

    if (newUser.role === 'school') {
      const schoolOrgId = newUser.organizationId || `SCH_${newUser.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      const schoolName = newUser.schoolName || newUser.name || 'New Academy';
      const newSchoolOrg: SchoolOrganization = {
        id: schoolOrgId,
        name: schoolName,
        country: newUser.country || currentUser.country || 'United States',
        state: newUser.state || currentUser.state || 'California',
        curriculum: newUser.curriculum || currentUser.curriculum || 'Universal Foundational',
        adminEmail: newUser.email || '',
        plan: 'Campus 500',
        totalSeats: 100,
        allocatedSeats: 0,
        activeTeachers: 0,
        activeClasses: 0,
        validityType: 'yearly',
        contractDuration: 'yearly',
        expiresAt: '2027-08-31',
        status: 'active'
      };
      finalUser = {
        ...newUser,
        organizationId: schoolOrgId,
        schoolName: schoolName
      };
      setSchools((prev) => (prev.some((s) => s.id === newSchoolOrg.id) ? prev : [newSchoolOrg, ...prev]));
      syncSchoolToSupabase(newSchoolOrg);
    }

    setAllUsers((prev) => (prev.some((u) => u.id === finalUser.id) ? prev.map((u) => (u.id === finalUser.id ? finalUser : u)) : [...prev, finalUser]));
    syncUserToSupabase(finalUser);

    if (newProgress && finalUser.role === 'student') {
      setStudentProgressMap((prev) => ({
        ...prev,
        [finalUser.id]: newProgress
      }));
      syncProgressToSupabase(newProgress);
    }
    setCurrentUser(finalUser);
    setCurrentView('dashboard');

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: finalUser.id,
      accountName: finalUser.name,
      role: finalUser.role,
      action: 'USER_REGISTERED',
      details: `New ${finalUser.role} registered: ${finalUser.name} (${finalUser.username || finalUser.email}) from ${finalUser.country || 'Global'} (${finalUser.state || 'All'}) under ${finalUser.curriculum || 'Standard'}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper to get active student progress
  const activeStudentId = currentUser.role === 'student' ? currentUser.id : 'STU00001';
  const currentStudentProgress = studentProgressMap[activeStudentId] || studentProgressMap['STU00001'];

  // Update student progress after game / quiz completion
  const handleUpdateStudentProgress = (updated: StudentProgress) => {
    setStudentProgressMap((prev) => ({
      ...prev,
      [updated.studentId]: updated
    }));

    // Persist progress update to Supabase student_progress table
    syncProgressToSupabase(updated);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: updated.studentId,
      accountName: `${updated.studentName} (${updated.studentUsername})`,
      role: 'student',
      action: 'ACTIVITY_COMPLETED',
      details: `Completed activity with score update. Total XP: ${updated.xp}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Question handler (Content Manager / Admin)
  const handleAddQuestion = (q: Question) => {
    setQuestions((prev) => [q, ...prev]);
    syncQuestionToSupabase(q);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'CREATE_QUESTION',
      details: `Published question ${q.id} to ${q.subject} (${q.grade})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Edit Question handler (Content Manager)
  const handleEditQuestion = (updated: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    syncQuestionToSupabase(updated);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_QUESTION',
      details: `Updated question ${updated.id} (${updated.subject})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Delete Question handler (Content Manager)
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    deleteQuestionFromSupabase(id);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'DELETE_QUESTION',
      details: `Deleted question ${id} from question bank`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Complete Question Bank & Masters Purge handler
  const handlePurgeAllQuestions = () => {
    setQuestions([]);
    try {
      localStorage.removeItem('pforpencil_question_bank_v1');
      localStorage.removeItem('pforpencil_question_bank_v2');
      localStorage.removeItem('funlearn_question_bank_v3');
      localStorage.removeItem('pforpencil_question_bank_masters_v1');
      localStorage.removeItem('pforpencil_question_bank_masters_v2');
      localStorage.removeItem('funlearn_question_bank_masters_v3');
    } catch {}

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'PURGE_QUESTION_BANK',
      details: 'Purged entire question bank, category masters, and skill masters from database and local storage.',
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Class handler (School / Teacher / Admin)
  const handleAddClass = (cls: ClassRoom) => {
    setClasses((prev) => [...prev, cls]);
    syncClassToSupabase(cls);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'CREATE_CLASS',
      details: `Created class ${cls.name} (${cls.grade}) led by ${cls.teacherName}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Update Class handler (School / Admin)
  const handleUpdateClass = (updatedCls: ClassRoom) => {
    setClasses((prev) => prev.map((c) => (c.id === updatedCls.id ? updatedCls : c)));
    syncClassToSupabase(updatedCls);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_CLASS',
      details: `Updated class "${updatedCls.name}" (${updatedCls.grade}) - Teacher: ${updatedCls.teacherName}, Status: ${updatedCls.status || 'active'}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Teacher handler (School / Admin)
  const handleAddTeacher = (teacher: UserAccount) => {
    setAllUsers((prev) => [...prev, teacher]);
    syncUserToSupabase(teacher);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'CREATE_TEACHER',
      details: `Added teacher ${teacher.name} (${teacher.id}) to school faculty`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Update Teacher / Faculty Profile handler (School / Admin)
  const handleUpdateTeacher = (updatedUser: UserAccount) => {
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    syncUserToSupabase(updatedUser);

    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_TEACHER_PROFILE',
      details: `Updated faculty profile for ${updatedUser.name} (${updatedUser.id}) - Status: ${updatedUser.status}, Validity: ${updatedUser.validUntil || updatedUser.validityDuration || 'Active'}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Student handler (School / Teacher / Parent / Admin)
  const handleAddStudent = (student: UserAccount, progress: StudentProgress) => {
    const parentId = student.parentId || (currentUser.role === 'parent' ? currentUser.id : undefined);

    setAllUsers((prev) => {
      const updated = prev.map((u) => {
        if (parentId && u.id === parentId) {
          const currentIds = u.studentIds || [];
          return {
            ...u,
            studentIds: Array.from(new Set([...currentIds, student.id]))
          };
        }
        return u;
      });
      return [...updated, student];
    });
    syncUserToSupabase(student);

    if (parentId && currentUser.id === parentId) {
      setCurrentUser((prev) => ({
        ...prev,
        studentIds: Array.from(new Set([...(prev.studentIds || []), student.id]))
      }));
    }

    setStudentProgressMap((prev) => ({
      ...prev,
      [student.id]: progress
    }));
    syncProgressToSupabase(progress);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'ENROLL_STUDENT',
      details: `Enrolled student ${student.name} with Username: ${student.username}, PIN: ${student.pin}${parentId ? ` linked to parent ${parentId}` : ''}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Create Assignment handler from Master Question Bank (Teacher)
  const handleCreateAssignment = (asg: ClassAssignment) => {
    setAssignments((prev) => [asg, ...prev]);
    syncAssignmentToSupabase(asg);

    // Also update class active assignments
    setClasses((prev) =>
      prev.map((c) =>
        c.id === asg.classId
          ? { ...c, activeAssignments: [asg.title, ...c.activeAssignments] }
          : c
      )
    );

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'teacher',
      action: 'CREATE_ASSIGNMENT',
      details: `Published assignment "${asg.title}" with ${asg.questionIds.length} questions from Master Bank to ${asg.className}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    syncAuditLogToSupabase(newLog);
  };

  // Add User handler (Admin master provisioning - synchronized to single backend DB)
  const handleAddUser = (user: UserAccount) => {
    let finalUser = { ...user };

    if (user.role === 'school') {
      const schoolOrgId = user.organizationId || user.id;
      const schoolName = user.schoolName || user.name || 'School Organization';
      const existingSchool = schools.find((s) => s.id === schoolOrgId);
      const newSchoolOrg: SchoolOrganization = existingSchool || {
        id: schoolOrgId,
        name: schoolName,
        schoolCode: user.schoolCode,
        country: user.country || currentUser.country || 'United States',
        state: user.state || currentUser.state || 'California',
        curriculum: user.curriculum || currentUser.curriculum || 'Universal Foundational',
        adminEmail: user.email || '',
        plan: 'Campus 500',
        totalSeats: 500,
        allocatedSeats: 0,
        activeTeachers: 0,
        activeClasses: 0,
        validityType: 'yearly',
        contractDuration: 'yearly',
        expiresAt: user.validUntil || '2027-08-31',
        status: 'active'
      };
      finalUser = {
        ...user,
        organizationId: schoolOrgId,
        schoolName: schoolName
      };
      if (!existingSchool) {
        setSchools((prev) => [newSchoolOrg, ...prev]);
        syncSchoolToSupabase(newSchoolOrg);
      }
    }

    setAllUsers((prev) => (prev.some((u) => u.id === finalUser.id) ? prev.map((u) => (u.id === finalUser.id ? finalUser : u)) : [...prev, finalUser]));
    syncUserToSupabase(finalUser);

    if (finalUser.role === 'student') {
      const parentObj = allUsers.find((u) => u.id === finalUser.parentId);
      const schoolObj = schools.find((s) => s.id === finalUser.organizationId || (finalUser.schoolName && s.name.toLowerCase() === finalUser.schoolName.toLowerCase()));
      const resolvedSchoolName = finalUser.schoolName || schoolObj?.name || (finalUser.organizationId ? (schoolObj?.name || 'School Organization') : undefined);
      const newProgress: StudentProgress = {
        studentId: finalUser.id,
        studentUsername: finalUser.username || finalUser.id,
        studentName: finalUser.name,
        avatar: finalUser.avatar || '🎒',
        grade: (finalUser.grade as any) || 'Grade 3',
        schoolOrParent: finalUser.parentId ? 'parent' : (finalUser.organizationId ? 'school' : 'parent'),
        parentName: finalUser.parentName || parentObj?.name || (finalUser.parentId ? 'Parent' : undefined),
        parentId: finalUser.parentId,
        schoolName: resolvedSchoolName,
        level: 1,
        xp: 100,
        coins: 20,
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
          { id: 'B_NEW', name: 'Welcome Adventurer', icon: '🌟', description: resolvedSchoolName ? `Enrolled in ${resolvedSchoolName}` : 'Joined PforPencil platform!', unlockedAt: new Date().toISOString().slice(0, 10) }
        ]
      };
      setStudentProgressMap((prev) => ({
        ...prev,
        [finalUser.id]: newProgress
      }));
      syncProgressToSupabase(newProgress);
    }

    // If user is a student linked to a parent, update parent's studentIds
    if (finalUser.role === 'student' && finalUser.parentId) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === finalUser.parentId
            ? { ...u, studentIds: Array.from(new Set([...(u.studentIds || []), finalUser.id])) }
            : u
        )
      );
    }

    // If teacher or student linked to a school organization, update school counters
    if (finalUser.organizationId) {
      setSchools((prev) =>
        prev.map((s) => {
          if (s.id !== finalUser.organizationId) return s;
          if (finalUser.role === 'teacher') {
            return { ...s, activeTeachers: (s.activeTeachers || 0) + 1 };
          }
          if (finalUser.role === 'student') {
            return { ...s, allocatedSeats: (s.allocatedSeats || 0) + 1 };
          }
          return s;
        })
      );
    }

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'PROVISION_ACCOUNT',
      details: `Provisioned account ${finalUser.id} (${finalUser.name}) with role ${finalUser.role}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Voucher handler (Admin)
  const handleAddVoucher = (voucher: Voucher) => {
    setVouchers((prev) => [voucher, ...prev]);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'ISSUE_VOUCHER',
      details: `Created voucher code ${voucher.code} (${voucher.discountPercent}% discount)`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add School handler (Admin)
  const handleAddSchool = (school: SchoolOrganization) => {
    setSchools((prev) => (prev.some((s) => s.id === school.id) ? prev : [...prev, school]));

    const schoolUser: UserAccount = {
      id: school.id,
      role: 'school',
      name: school.name,
      email: school.adminEmail,
      avatar: '🏫',
      organizationId: school.id,
      schoolName: school.name,
      schoolCode: school.schoolCode,
      country: school.country,
      state: school.state,
      curriculum: school.curriculum,
      enrolledAt: new Date().toISOString().slice(0, 10),
      status: 'active',
      validUntil: school.expiresAt
    };
    setAllUsers((prev) => (prev.some((u) => u.id === school.id) ? prev : [...prev, schoolUser]));

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'REGISTER_SCHOOL',
      details: `Registered school ${school.name} (${school.id}) with ${school.totalSeats} seats`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Update School handler (Admin / School)
  const handleUpdateSchool = (updatedSchool: SchoolOrganization) => {
    setSchools((prev) => prev.map((s) => (s.id === updatedSchool.id ? updatedSchool : s)));

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_SCHOOL_SETTINGS',
      details: `Updated school ${updatedSchool.name} subscription validity to ${updatedSchool.validityType || updatedSchool.contractDuration || 'yearly'} (Expires: ${updatedSchool.expiresAt})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Update User Profile (Basic Details: name, username, password, avatar, grade, schoolName, status, phone)
  const handleUpdateUserProfile = (updatedUser: UserAccount) => {
    // 1. Update in allUsers master list while locking unique system keys
    setAllUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? {
        ...u,
        name: updatedUser.name,
        username: updatedUser.username || u.username,
        password: updatedUser.password || u.password,
        avatar: updatedUser.avatar,
        grade: updatedUser.grade,
        schoolName: updatedUser.schoolName,
        status: updatedUser.status || u.status,
        phone: updatedUser.phone,
        country: updatedUser.country,
        state: updatedUser.state
      } : u))
    );

    // 2. If current active user was edited, update currentUser state immediately
    if (currentUser.id === updatedUser.id) {
      setCurrentUser((prev) => ({
        ...prev,
        name: updatedUser.name,
        username: updatedUser.username || prev.username,
        password: updatedUser.password || prev.password,
        avatar: updatedUser.avatar,
        grade: updatedUser.grade,
        schoolName: updatedUser.schoolName,
        phone: updatedUser.phone,
        country: updatedUser.country,
        state: updatedUser.state
      }));
    }

    // 3. If student, synchronize student progress map and student records
    if (updatedUser.role === 'student') {
      setStudentProgressMap((prev) => {
        if (!prev[updatedUser.id]) return prev;
        return {
          ...prev,
          [updatedUser.id]: {
            ...prev[updatedUser.id],
            studentName: updatedUser.name,
            avatar: updatedUser.avatar || prev[updatedUser.id].avatar,
            grade: updatedUser.grade || prev[updatedUser.id].grade,
            schoolName: updatedUser.schoolName || prev[updatedUser.id].schoolName
          }
        };
      });
    }

    // 4. If school, synchronize schools state list
    if (updatedUser.role === 'school') {
      setSchools((prev) =>
        prev.map((s) => (s.id === updatedUser.id || (s.adminEmail && s.adminEmail.toLowerCase() === (updatedUser.email || '').toLowerCase()) ? {
          ...s,
          name: updatedUser.name,
          country: updatedUser.country || s.country
        } : s))
      );
    }

    // 5. Sync to Supabase live database
    syncUserToSupabase(updatedUser);

    // 6. Audit Log
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_USER_PROFILE',
      details: `Updated basic profile details for account ${updatedUser.id} (${updatedUser.name}) [Role: ${updatedUser.role}]`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    sounds.playLevelUp();
  };

  // Update User Status (Admin)
  const handleUpdateUserStatus = (userId: string, status: 'active' | 'pending' | 'suspended') => {
    let updatedObj: UserAccount | undefined;
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          updatedObj = { ...u, status };
          return updatedObj;
        }
        return u;
      })
    );

    if (updatedObj) {
      syncUserToSupabase(updatedObj);
    }

    const user = allUsers.find((u) => u.id === userId);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_USER_STATUS',
      details: `Updated account ${userId} (${user?.name || 'User'}) status to ${status.toUpperCase()}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Delete User (Admin)
  const handleDeleteUser = (userId: string) => {
    const userToDelete = allUsers.find((u) => u.id === userId);
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'DELETE_USER',
      details: `Deleted account ${userId} (${userToDelete?.name || ''}) from directory`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Toggle Voucher Active (Admin)
  const handleToggleVoucherActive = (voucherId: string) => {
    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === voucherId ? { ...v, active: !v.active } : v));
      const target = next.find((v) => v.id === voucherId);
      if (target) {
        syncVoucherToSupabase(target);
      }
      return next;
    });
  };

  // Parent assigns activity to Child
  const handleParentAssignActivity = (childId: string, activityId: string) => {
    const act = activities.find((a) => a.id === activityId);
    if (!act) return;

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'parent',
      action: 'ASSIGN_CHILD_GOAL',
      details: `Assigned goal "${act.title}" to child ${childId}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    syncAuditLogToSupabase(newLog);
  };

  // Subscription payment simulation
  const handleSubscribePlan = (planName: string, amount: number) => {
    const newRecord: SubscriptionRecord = {
      id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role === 'school' ? 'school' : 'parent',
      planName,
      amount,
      currency: 'USD',
      status: 'active',
      paymentDate: new Date().toISOString().split('T')[0],
      renewalDate: '2026-04-14',
      planDuration: 'annual'
    };
    setSubscriptions((prev) => [newRecord, ...prev]);
    syncSubscriptionToSupabase(newRecord);
  };

  // Add Grade handler (Admin only)
  const handleAddGrade = (newGrade: CurriculumGrade) => {
    setGrades((prev) => [...prev, newGrade]);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'CREATE_CURRICULUM_GRADE',
      details: `Created academic grade standard "${newGrade.name}" (Ages ${newGrade.ageGroup})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Subject handler (Admin only)
  const handleAddSubject = (newSubject: CurriculumSubject) => {
    setSubjects((prev) => [...prev, newSubject]);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'CREATE_CURRICULUM_SUBJECT',
      details: `Created curriculum subject "${newSubject.name}" (${newSubject.category})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Delete Grade handler (Admin only)
  const handleDeleteGrade = (gradeId: string) => {
    const target = grades.find((g) => g.id === gradeId);
    setGrades((prev) => prev.filter((g) => g.id !== gradeId));

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'DELETE_GRADE',
      details: `Deleted academic grade "${target?.name || gradeId}"`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Delete Subject handler (Admin only)
  const handleDeleteSubject = (subjectId: string) => {
    const target = subjects.find((s) => s.id === subjectId);
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'DELETE_SUBJECT',
      details: `Deleted curriculum subject "${target?.name || subjectId}"`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Quick Preset: Preschool through Grade 6 and Mathematics only
  const handleResetToMathPreschoolToGrade6 = () => {
    const mathGrades: CurriculumGrade[] = [
      { id: 'GRD_PRE', name: 'Preschool', ageGroup: '3-4 Years', description: 'Early shapes, counting items, colors, and sensory play', icon: '🧸', active: true },
      { id: 'GRD_FND', name: 'Foundation', ageGroup: '4-5 Years', description: 'Early learning foundations, counting, patterns, and readiness', icon: '🌱', active: true },
      { id: 'GRD_G1', name: 'Grade 1', ageGroup: '5-6 Years', description: 'Addition/subtraction within 20, 2D shapes, and tally marks', icon: '🎒', active: true },
      { id: 'GRD_G2', name: 'Grade 2', ageGroup: '6-7 Years', description: 'Two-digit math, equal groups, time, and basic money', icon: '✏️', active: true },
      { id: 'GRD_G3', name: 'Grade 3', ageGroup: '7-8 Years', description: 'Multiplication tables, unit fractions, and word problems', icon: '🚀', active: true },
      { id: 'GRD_G4', name: 'Grade 4', ageGroup: '8-9 Years', description: 'Multi-digit multiplication, division, decimals, and perimeter', icon: '🔍', active: true },
      { id: 'GRD_G5', name: 'Grade 5', ageGroup: '9-10 Years', description: 'Fractions with unlike denominators, volume, and coordinate planes', icon: '🔬', active: true },
      { id: 'GRD_G6', name: 'Grade 6', ageGroup: '10-11 Years', description: 'Ratios, negative numbers, simple algebraic expressions, and statistics', icon: '🎓', active: true }
    ];

    const mathOnlySubject: CurriculumSubject[] = [
      {
        id: 'SUB_MTH',
        name: 'Mathematics',
        icon: '➗',
        color: 'blue',
        category: 'STEM',
        description: 'Numbers & Counting, Operations, Spatial Geometry, Equal Groups, Fractions & Logic',
        active: true
      }
    ];

    setGrades(mathGrades);
    setSubjects(mathOnlySubject);

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'CONFIGURE_PRESET_CURRICULUM',
      details: 'Configured curriculum preset: Preschool through Grade 6 (Mathematics only)',
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Interactive Activity (Admin / Content Manager)
  const handleAddActivity = (newAct: Activity) => {
    setActivities((prev) => {
      const activityWithId = ensureActivityId(newAct, prev);
      syncActivityToSupabase(activityWithId);
      return [activityWithId, ...prev];
    });
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'CREATE_INTERACTIVE_ACTIVITY',
      details: `Scheduled interactive activity "${newAct.title}" (${newAct.type}, recurrence: ${newAct.recurrence || 'daily'})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Edit Interactive Activity (Admin / Content Manager)
  const handleEditActivity = (updatedAct: Activity) => {
    setActivities((prev) => prev.map((a) => (a.id === updatedAct.id ? updatedAct : a)));
    syncActivityToSupabase(updatedAct);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'UPDATE_INTERACTIVE_ACTIVITY',
      details: `Updated interactive activity "${updatedAct.title}" (${updatedAct.type})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Delete Interactive Activity (Admin / Content Manager)
  const handleDeleteActivity = (actId: string) => {
    const act = activities.find((a) => a.id === actId);
    setActivities((prev) => prev.filter((a) => a.id !== actId));
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'DELETE_INTERACTIVE_ACTIVITY',
      details: `Deleted interactive activity "${act?.title || actId}"`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Global Reset Password / PIN Handler for any role (admin, school, teacher, parent, student, content_manager)
  const handleResetCredentials = (
    userId: string,
    newSecret: string,
    isPin: boolean,
    newUsername?: string
  ) => {
    // 1. Update allUsers
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        if (isPin) {
          return {
            ...u,
            pin: newSecret,
            username: newUsername || u.username
          };
        } else {
          return {
            ...u,
            password: newSecret
          };
        }
      })
    );

    // 2. If student, also update studentProgressMap
    setStudentProgressMap((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: {
          ...prev[userId],
          studentUsername: newUsername || prev[userId].studentUsername
        }
      };
    });

    // 3. If currently logged in user is being modified, update currentUser
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({
        ...prev,
        pin: isPin ? newSecret : prev.pin,
        username: newUsername || prev.username,
        password: !isPin ? newSecret : prev.password
      }));
    }

    // 4. Log Audit Event
    const targetUser = allUsers.find((u) => u.id === userId);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: isPin ? 'RESET_STUDENT_PIN' : 'RESET_PASSWORD',
      details: `${currentUser.role.toUpperCase()} reset ${isPin ? `PIN for student ${targetUser?.name || userId} (New PIN: ${newSecret})` : `password for ${targetUser?.role || 'user'} ${targetUser?.name || userId}`}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // 1-Click All-in-One School Hierarchy Builder
  const handleBatchCreateSchoolHierarchy = (data: {
    school: SchoolOrganization;
    classroom?: ClassRoom;
    teacher?: UserAccount;
    students?: UserAccount[];
  }) => {
    // 1. Add School
    setSchools((prev) => (prev.some((s) => s.id === data.school.id) ? prev.map((s) => (s.id === data.school.id ? data.school : s)) : [...prev, data.school]));
    // 2. Add School Admin, Teacher & Students to allUsers
    const newUsers: UserAccount[] = [];
    const schoolUser: UserAccount = {
      id: data.school.id,
      role: 'school',
      name: data.school.name,
      email: data.school.adminEmail,
      avatar: '🏫',
      organizationId: data.school.id,
      schoolName: data.school.name,
      schoolCode: data.school.schoolCode,
      country: data.school.country,
      state: data.school.state,
      curriculum: data.school.curriculum,
      enrolledAt: new Date().toISOString().slice(0, 10),
      status: 'active',
      validUntil: data.school.expiresAt
    };
    newUsers.push(schoolUser);
    if (data.teacher) newUsers.push(data.teacher);
    if (data.students && data.students.length > 0) newUsers.push(...data.students);
    if (newUsers.length > 0) {
      setAllUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        const filteredNew = newUsers.filter((u) => !existingIds.has(u.id));
        return [...prev, ...filteredNew];
      });
    }
    // 3. Add Classroom
    if (data.classroom) {
      setClasses((prev) => (prev.some((c) => c.id === data.classroom!.id) ? prev : [...prev, data.classroom!]));
    }
    // 4. Initialize Student Progress Map for each student
    if (data.students && data.students.length > 0) {
      setStudentProgressMap((prev) => {
        const updated = { ...prev };
        data.students!.forEach((st) => {
          updated[st.id] = {
            studentId: st.id,
            studentUsername: st.username || st.id,
            studentName: st.name,
            avatar: st.avatar,
            grade: st.grade as any,
            schoolOrParent: 'school',
            schoolName: data.school.name,
            schoolCode: data.school.schoolCode,
            organizationId: data.school.id,
            level: 1,
            xp: 100,
            coins: 20,
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
                id: 'B_CAMPUS',
                name: 'Campus Pioneer',
                icon: '🏫',
                description: `Enrolled at ${data.school.name}${data.classroom ? ` in ${data.classroom.name}` : ''}`,
                unlockedAt: new Date().toISOString().slice(0, 10)
              }
            ]
          };
        });
        return updated;
      });
    }

    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'DEPLOY_SCHOOL_HIERARCHY',
      details: `Provisioned School "${data.school.name}"${data.classroom ? `, Classroom "${data.classroom.name}"` : ''}${data.teacher ? `, Teacher "${data.teacher.name}"` : ''}, and ${data.students?.length || 0} students`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Add Multiple Students to Parent
  const handleAddStudentsToParent = (
    parentId: string,
    studentsList: { student: UserAccount; progress: StudentProgress }[]
  ) => {
    const newStudents = studentsList.map((s) => s.student);
    const addedStudentIds = newStudents.map((s) => s.id);

    setAllUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === parentId) {
          const currentIds = u.studentIds || [];
          return {
            ...u,
            studentIds: Array.from(new Set([...currentIds, ...addedStudentIds]))
          };
        }
        // A student has one direct family/guardian link in the current model.
        // Do not derive this relationship from names or usernames.
        return u;
      });
      const existingIds = new Set(prev.map(u => u.id));
      return [...updated, ...newStudents.filter(s => !existingIds.has(s.id))];
    });

    setStudentProgressMap((prev) => {
      const updated = { ...prev };
      studentsList.forEach((item) => {
        updated[item.student.id] = item.progress;
      });
      return updated;
    });

    const parentUser = allUsers.find((u) => u.id === parentId);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: currentUser.role,
      action: 'ADD_STUDENTS_TO_PARENT',
      details: `Linked ${newStudents.length} new student account(s) to parent ${parentUser?.name || parentId}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Update Subscription Status (Admin)
  const handleUpdateSubscriptionStatus = (subId: string, newStatus: any, extendDays?: number) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== subId) return s;
        let renewal = s.renewalDate;
        if (extendDays) {
          const d = new Date(s.renewalDate);
          d.setDate(d.getDate() + extendDays);
          renewal = d.toISOString().slice(0, 10);
        }
        return { ...s, status: newStatus, renewalDate: renewal };
      })
    );

    const targetSub = subscriptions.find((s) => s.id === subId);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'UPDATE_SUBSCRIPTION',
      details: `Updated subscription ${subId} (${targetSub?.accountName || ''}) to status "${newStatus}"`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Subscription Plan management handlers (Admin)
  const handleAddSubscriptionPlan = (newPlan: SubscriptionPlan) => {
    setSubscriptionPlans((prev) => [newPlan, ...prev]);
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'CREATE_PLAN',
      details: `Created new pricing tier ${newPlan.name} ($${newPlan.price}/${newPlan.interval})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateSubscriptionPlan = (updatedPlan: SubscriptionPlan) => {
    setSubscriptionPlans((prev) => prev.map((p) => p.id === updatedPlan.id ? updatedPlan : p));
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'UPDATE_PLAN',
      details: `Updated pricing tier ${updatedPlan.name} ($${updatedPlan.price}/${updatedPlan.interval})`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleDeleteSubscriptionPlan = (planId: string) => {
    setSubscriptionPlans((prev) => prev.filter((p) => p.id !== planId));
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'DELETE_PLAN',
      details: `Deleted pricing tier ${planId}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleDeleteVoucher = (voucherId: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== voucherId));
    const newLog: AuditLog = {
      id: generateLogId(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountId: currentUser.id,
      accountName: currentUser.name,
      role: 'admin',
      action: 'DELETE_VOUCHER',
      details: `Deleted promo voucher ${voucherId}`,
      ipAddress: '127.0.0.1'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white ${
        currentView === 'home' ? 'bg-white' : 'bg-stone-100/60'
      }`}>
      {/* Top Navbar Header with Brand Logo, Navigation Links, Region Selector, Sound, & Auth Buttons */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={(user) => {
          setCurrentUser(user);
          setCurrentView('dashboard');
        }}
        onOpenAuthModal={(opts) => setAuthModalConfig({ 
          isOpen: true, 
          initialScreen: opts?.screen || 'signin', 
          initialRole: opts?.role || 'parent' 
        })}
        onOpenPricingModal={() => setCurrentView(currentView === 'pricing' ? 'dashboard' : 'pricing')}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onOpenRegionModal={() => setRegionModalOpen(true)}
        currentView={currentView}
        onNavigateView={(v) => setCurrentView(v)}
      />

      {currentView === 'home' ? (
        <HomePage
          currentUser={currentUser}
          allUsers={allUsers}
          grades={grades}
          subjects={subjects}
          questions={questions}
          activities={activities}
          onSelectRoleUser={(user) => {
            setCurrentUser(user);
            setCurrentView('dashboard');
          }}
          onNavigateView={(v) => setCurrentView(v)}
          onOpenPricing={() => setCurrentView('pricing')}
          onOpenRegionModal={() => setRegionModalOpen(true)}
          onSaveRegion={handleSaveRegion}
          onOpenAuthModal={(options) => {
            setAuthModalConfig({
              isOpen: true,
              initialScreen: options?.screen || 'signin',
              initialRole: options?.role || 'parent'
            });
          }}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          onDirectLogin={(user) => {
            setCurrentUser(user);
            setCurrentView('dashboard');
          }}
          onRegisterUser={handleRegisterUser}
        />
      ) : (
        /* Main Container for Dashboards & Portals */
        <main className={`flex-1 w-full mx-auto px-4 sm:px-6 pt-6 pb-24 ${currentUser.role === 'admin' ? 'max-w-[1680px]' : 'max-w-7xl'}`}>
          {currentView === 'pricing' ? (
            <SubscriptionsView
              currentUser={currentUser}
              vouchers={vouchers}
              onSubscribePlan={handleSubscribePlan}
            />
          ) : (
            /* Role-Based Portals matching User Specifications */
            <>
              {/* 1. STUDENT PORTAL (Quests, practice, boss battles, level XP) */}
              {currentUser.role === 'student' && (
              <StudentPortal
                currentUser={currentUser}
                studentProgress={currentStudentProgress}
                studentProgressMap={studentProgressMap}
                questions={questions}
                activities={activities}
                onUpdateProgress={handleUpdateStudentProgress}
              />
            )}

            {/* 2. PARENT PORTAL (Can see student performance, detail report card, add child up to 3, reset child PIN) */}
            {currentUser.role === 'parent' && (
              <ParentPortal
                currentUser={currentUser}
                allStudents={Object.values(studentProgressMap)}
                activities={activities}
                classes={classes}
                allUsers={allUsers}
                grades={grades}
                subjects={subjects}
                onAssignActivity={handleParentAssignActivity}
                onOpenPricing={() => setCurrentView('pricing')}
                onAddChild={handleAddStudent}
                onResetCredentials={handleResetCredentials}
                onUpdateUserProfile={handleUpdateUserProfile}
              />
            )}

            {/* 3. TEACHER PORTAL (Create class, custom question bank, assignments, roster, report cards, PIN reset) */}
            {currentUser.role === 'teacher' && (
              <TeacherPortal
                currentUser={currentUser}
                schools={schools}
                classes={classes}
                students={Object.values(studentProgressMap)}
                questions={questions}
                activities={activities}
                assignments={assignments}
                allUsers={allUsers}
                grades={grades}
                subjects={subjects}
                onAddClass={handleAddClass}
                onAddStudent={handleAddStudent}
                onCreateAssignment={handleCreateAssignment}
                onAddQuestion={handleAddQuestion}
                onResetCredentials={handleResetCredentials}
                onUpdateUserProfile={handleUpdateUserProfile}
              />
            )}

            {/* 4. SCHOOL PORTAL (School-wide classes, teachers, student rosters, report cards, credential resets) */}
            {currentUser.role === 'school' && (() => {
              const matchedSchool = schools.find(s => 
                s.id === currentUser.id || 
                s.id === currentUser.organizationId || 
                (currentUser.schoolName && s.name.toLowerCase() === currentUser.schoolName.toLowerCase()) ||
                s.name.toLowerCase() === currentUser.name.toLowerCase()
              );

              const currentSchool = matchedSchool || {
                id: currentUser.organizationId || `SCH_${currentUser.id}`,
                name: currentUser.schoolName || currentUser.name || 'Greenwood Academy',
                country: currentUser.country || 'United States',
                state: currentUser.state || 'California',
                curriculum: currentUser.curriculum || 'Universal Foundational',
                adminEmail: currentUser.email || '',
                plan: 'Campus 500',
                totalSeats: 100,
                allocatedSeats: 0,
                activeTeachers: 0,
                activeClasses: 0,
                validityType: 'yearly',
                contractDuration: 'yearly',
                expiresAt: '2027-08-31',
                status: 'active'
              };

              return (
                <SchoolPortal
                  currentUser={currentUser}
                  school={currentSchool}
                  classes={classes}
                  teachers={allUsers.filter((u) => u.role === 'teacher')}
                  students={Object.values(studentProgressMap)}
                  allUsers={allUsers}
                  grades={grades}
                  subjects={subjects}
                  onAddClass={handleAddClass}
                  onUpdateClass={handleUpdateClass}
                  onAddTeacher={handleAddTeacher}
                  onUpdateTeacher={handleUpdateTeacher}
                  onUpdateSchool={handleUpdateSchool}
                  onAddStudent={handleAddStudent}
                  onResetCredentials={handleResetCredentials}
                  onUpdateUserProfile={handleUpdateUserProfile}
                  onOpenPricing={() => setCurrentView('pricing')}
                />
              );
            })()}

            {/* 5. CONTENT MANAGER PORTAL (Manage questions and interactive activities) */}
            {currentUser.role === 'content_manager' && (
              <ContentManagerPortal
                currentUser={currentUser}
                questions={questions}
                activities={activities}
                grades={grades}
                subjects={subjects}
                onAddQuestion={handleAddQuestion}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onAddActivity={handleAddActivity}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
              />
            )}

            {/* 6. ADMIN PORTAL (Full Access + Global Reset Credentials for any role) */}
            {currentUser.role === 'admin' && (
              <AdminPortal
                currentUser={currentUser}
                allUsers={allUsers}
                schools={schools}
                questions={questions}
                activities={activities}
                subscriptions={subscriptions}
                vouchers={vouchers}
                auditLogs={auditLogs}
                students={Object.values(studentProgressMap)}
                classes={classes}
                assignments={assignments}
                grades={grades}
                subjects={subjects}
                subscriptionPlans={subscriptionPlans}
                onAddUser={handleAddUser}
                onUpdateUserProfile={handleUpdateUserProfile}
                onUpdateUserStatus={handleUpdateUserStatus}
                onDeleteUser={handleDeleteUser}
                onAddVoucher={handleAddVoucher}
                onDeleteVoucher={handleDeleteVoucher}
                onToggleVoucherActive={handleToggleVoucherActive}
                onAddSubscriptionPlan={handleAddSubscriptionPlan}
                onUpdateSubscriptionPlan={handleUpdateSubscriptionPlan}
                onDeleteSubscriptionPlan={handleDeleteSubscriptionPlan}
                onAddSchool={handleAddSchool}
                onAddClass={handleAddClass}
                onUpdateClass={handleUpdateClass}
                onUpdateTeacher={handleUpdateTeacher}
                onAddQuestion={handleAddQuestion}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onPurgeAllQuestions={handlePurgeAllQuestions}
                onAddGrade={handleAddGrade}
                onAddSubject={handleAddSubject}
                onDeleteGrade={handleDeleteGrade}
                onDeleteSubject={handleDeleteSubject}
                onResetToMathPreschoolToGrade6={handleResetToMathPreschoolToGrade6}
                onAddActivity={handleAddActivity}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onBatchCreateSchoolHierarchy={handleBatchCreateSchoolHierarchy}
                onAddStudentsToParent={handleAddStudentsToParent}
                onUpdateSubscriptionStatus={handleUpdateSubscriptionStatus}
                onResetCredentials={handleResetCredentials}
              />
            )}
          </>
        )}
      </main>
      )}

      {/* Floating Role-Based Sandbox Switcher Bar (Bottom Bar - only in dashboard/portal views) */}
      {currentView !== 'home' && (
      <div className="fixed bottom-3 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-1.5 shadow-2xl border border-slate-800 flex items-center gap-1.5 max-w-full overflow-x-auto text-xs">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline">
            Active Persona:
          </span>

          {/* Key representative personas across all roles */}
          {(() => {
            const adminUser = allUsers.find(u => u.role === 'admin') || allUsers[0];
            const contentUser = allUsers.find(u => u.role === 'content_manager') || allUsers[1];
            const schoolUser = allUsers.find(u => u.role === 'school') || allUsers[2];
            const teacherUser = allUsers.find(u => u.role === 'teacher') || allUsers[4];
            const parentUser = allUsers.find(u => u.role === 'parent') || allUsers.find(u => u.id === 'PAR00001');
            const preschoolStudent = allUsers.find(u => u.role === 'student' && (u.grade === 'Preschool' || u.id === 'STU00003')) || allUsers.find(u => u.id === 'STU00003');
            const primaryStudent = allUsers.find(u => u.role === 'student' && u.id === 'STU00001') || allUsers.find(u => u.role === 'student');

            const personas = [
              adminUser,
              contentUser,
              schoolUser,
              teacherUser,
              parentUser,
              preschoolStudent,
              primaryStudent
            ].filter(Boolean) as UserAccount[];

            // Deduplicate
            const uniquePersonas = Array.from(new Set(personas.map(p => p.id)))
              .map(id => personas.find(p => p.id === id)!);

            return uniquePersonas.map((u) => {
              const isSelected = u.id === currentUser.id;
              const label = 
                u.role === 'student' ? `${u.name.split(' ')[0]} (${u.grade || 'Student'})` :
                u.role === 'parent' ? `${u.name.split(' ')[0]} (Parent)` :
                u.role === 'teacher' ? `${u.name.split(' ')[0]} (Teacher)` :
                u.role === 'school' ? 'School' :
                u.role === 'content_manager' ? 'Content' : 'Admin';

              return (
                <button
                  key={u.id}
                  id={`quick-persona-${u.id}`}
                  onClick={() => {
                    setCurrentUser(u);
                    setCurrentView('dashboard');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{u.avatar}</span>
                  <span>{label}</span>
                </button>
              );
            });
          })()}

          {/* Quick Dropdown for All Users */}
          <select
            value={currentUser.id}
            onChange={(e) => {
              const target = allUsers.find(u => u.id === e.target.value);
              if (target) {
                setCurrentUser(target);
                setCurrentView('dashboard');
              }
            }}
            className="bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold rounded-xl px-2 py-1 outline-none cursor-pointer ml-1"
          >
            <option value="" disabled>Switch to other user...</option>
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.avatar} {u.name} ({u.role}{u.grade ? ` - ${u.grade}` : ''})
              </option>
            ))}
          </select>
        </div>
      </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalConfig.isOpen}
        onClose={() => setAuthModalConfig(prev => ({ ...prev, isOpen: false }))}
        initialScreen={authModalConfig.initialScreen}
        initialRole={authModalConfig.initialRole}
        grades={grades}
        country={currentUser.country || 'Australia'}
        state={currentUser.state || 'NSW'}
        curriculum={currentUser.curriculum || 'Australian Curriculum (ACARA)'}
        onOpenRegionModal={() => {
          setAuthModalConfig(prev => ({ ...prev, isOpen: false }));
          setRegionModalOpen(true);
        }}
        onSaveRegion={handleSaveRegion}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentView('dashboard');
        }}
        onRegisterUser={handleRegisterUser}
        onUpdateUser={handleUpdateUserProfile}
        allUsers={allUsers}
      />

      {/* Region & Curriculum Selector Modal */}
      <RegionSelectorModal
        isOpen={regionModalOpen}
        onClose={() => setRegionModalOpen(false)}
        currentUser={currentUser}
        onSaveRegion={handleSaveRegion}
        frameworks={INITIAL_FRAMEWORKS}
      />

      {/* Supabase Schema Modal */}
      <SupabaseSchemaModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        allUsers={allUsers}
        questions={questions}
        activities={activities}
        schools={schools}
        classes={classes}
        studentProgressMap={studentProgressMap}
        frameworks={INITIAL_FRAMEWORKS}
      />
    </div>
    </ErrorBoundary>
  );
}
