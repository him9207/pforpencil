import React, { useState, FormEvent } from 'react';
import { 
  UserAccount, 
  StudentProgress, 
  Activity,
  ClassRoom,
  GradeLevel,
  CurriculumGrade,
  CurriculumSubject
} from '../../types';
import { 
  Heart, 
  Clock, 
  TrendingUp, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  Send, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  KeyRound,
  FileText,
  Building2,
  X,
  Shuffle,
  Globe,
  MapPin,
  BookOpen,
  Lock,
  Edit3
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { generateStudentUsername, getNextRoleId } from '../../utils/idAndUsernameGenerator';
import { COUNTRIES, COUNTRY_STATE_MAP, COUNTRY_CURRICULUM_MAP } from '../../data/curriculumData';
import StudentReportCardModal from '../student/StudentReportCardModal';
import ResetCredentialsModal from '../auth/ResetCredentialsModal';
import EditUserProfileModal from '../admin/components/EditUserProfileModal';

interface ParentPortalProps {
  currentUser: UserAccount;
  allStudents: StudentProgress[];
  activities: Activity[];
  classes?: ClassRoom[];
  allUsers?: UserAccount[];
  grades?: CurriculumGrade[];
  subjects?: CurriculumSubject[];
  onAssignActivity: (childId: string, activityId: string) => void;
  onOpenPricing: () => void;
  onAddChild?: (student: UserAccount, progress: StudentProgress) => void;
  onResetCredentials?: (userId: string, newSecret: string, isPin: boolean, newUsername?: string) => void;
  onUpdateUserProfile?: (user: UserAccount) => void;
}

export default function ParentPortal({
  currentUser,
  allStudents,
  activities,
  classes = [],
  allUsers = [],
  grades = [],
  subjects = [],
  onAssignActivity,
  onOpenPricing,
  onAddChild,
  onResetCredentials,
  onUpdateUserProfile
}: ParentPortalProps) {
  const activeCurriculumSubjects: string[] = (subjects && subjects.length > 0)
    ? subjects.filter((s) => s.active).map((s) => s.name)
    : ['Mathematics', 'Science', 'English Language', 'Logic & Puzzles'];

  // Find children linked to this parent
  const myChildren = allStudents.filter((s) => {
    // Family access is determined only by stable IDs. Names are display data, not relationship keys.
    if (s.parentId === currentUser.id) return true;
    if (currentUser.studentIds?.includes(s.studentId)) return true;
    return false;
  });

  const [selectedChildId, setSelectedChildId] = useState<string>(
    myChildren[0]?.studentId || ''
  );

  const [screenTimeLimit, setScreenTimeLimit] = useState(45);
  const [selectedActivityToAssign, setSelectedActivityToAssign] = useState(activities[0]?.id || '');
  const [assignSuccessMessage, setAssignSuccessMessage] = useState('');

  // Modals
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Dynamic active curriculum grades (reads directly from active curriculum: Preschool, Foundation, Grade 1 to 6)
  const activeGrades: GradeLevel[] = (grades && grades.length > 0)
    ? (grades.filter((g) => g.active).map((g) => g.name as GradeLevel))
    : ['Preschool', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  // Add Child Form State
  const [newChildName, setNewChildName] = useState('');
  const [newChildGrade, setNewChildGrade] = useState<GradeLevel>(() => activeGrades[0] || 'Preschool');
  const [newChildAvatar, setNewChildAvatar] = useState('🦊');
  const [newChildPin, setNewChildPin] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [newChildUsername, setNewChildUsername] = useState('');
  const [newChildCountry, setNewChildCountry] = useState<string>(currentUser.country || 'United States');
  const [newChildState, setNewChildState] = useState<string>(currentUser.state || 'California');
  const [newChildCurriculum, setNewChildCurriculum] = useState<string>(currentUser.curriculum || 'Common Core (US)');

  const activeChild = myChildren.find((c) => c.studentId === selectedChildId) || myChildren[0];
  const activeChildUser = allUsers.find(u => u.id === activeChild?.studentId);

  // Active Class linked to child
  const childClass = classes.find(c => 
    c.studentIds?.includes(activeChild?.studentId) || 
    (c.grade === activeChild?.grade && (!c.schoolId || c.schoolId === activeChildUser?.organizationId))
  );

  const avatarOptions = ['🦊', '🚀', '🦄', '🐼', '🦁', '🐯', '🐬', '🌟', '🦖', '🎨', '⚽', '📚'];

  const handleAssignGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild || !selectedActivityToAssign) return;

    sounds.playCorrect();
    onAssignActivity(activeChild.studentId, selectedActivityToAssign);
    const act = activities.find(a => a.id === selectedActivityToAssign);
    setAssignSuccessMessage(`Assigned "${act?.title || 'Activity'}" to ${activeChild.studentName}!`);
    setTimeout(() => setAssignSuccessMessage(''), 3000);
  };

  const handleOpenAddChildModal = () => {
    if (myChildren.length >= 3) {
      alert('Parent plan limit reached: A maximum of 3 child accounts can be enrolled under your family profile.');
      return;
    }
    const defaultName = myChildren.length === 1 ? 'Lucas Watson' : 'Sophia Watson';
    setNewChildName(defaultName);
    setNewChildGrade('Preschool');
    setNewChildAvatar('🦊');
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setNewChildPin(randomPin);
    const autoUsername = generateStudentUsername(defaultName, allUsers, undefined, false, currentUser.name);
    setNewChildUsername(autoUsername);
    setShowAddChildModal(true);
  };

  const handleRandomizePin = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setNewChildPin(randomPin);
    sounds.playCorrect();
  };

  const handleCreateChild = (e: FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    if (myChildren.length >= 3) {
      alert('You have reached the maximum limit of 3 children per family account.');
      return;
    }

    const nextStudentId = getNextRoleId('student', allUsers || []);
    const generatedUsername = generateStudentUsername(
      newChildName.trim(),
      allUsers || [],
      undefined,
      false,
      currentUser.name
    );

    const newStudentUser: UserAccount = {
      id: nextStudentId,
      role: 'student',
      name: newChildName.trim(),
      username: generatedUsername,
      pin: newChildPin.trim() || '7392',
      avatar: newChildAvatar,
      grade: newChildGrade,
      country: newChildCountry,
      state: newChildState,
      curriculum: newChildCurriculum,
      parentId: currentUser.id,
      parentName: currentUser.name,
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    const newStudentProgress: StudentProgress = {
      studentId: nextStudentId,
      studentUsername: generatedUsername,
      studentName: newChildName.trim(),
      avatar: newChildAvatar,
      grade: newChildGrade,
      country: newChildCountry,
      state: newChildState,
      curriculum: newChildCurriculum,
      schoolOrParent: 'parent',
      parentName: currentUser.name,
      parentId: currentUser.id,
      level: 1,
      xp: 120,
      coins: 25,
      streakDays: 1,
      dailyQuizCompletedToday: false,
      totalQuizzesTaken: 2,
      averageScore: 92,
      subjectMastery: activeCurriculumSubjects.reduce((acc, s) => {
        acc[s] = 90;
        return acc;
      }, {} as Record<string, number>),
      recentActivities: [],
      badges: [
        { id: 'B_NEW', name: 'Junior Pioneer', icon: '🌟', description: 'Enrolled in FunLearn Family Academy', unlockedAt: new Date().toISOString().split('T')[0] }
      ]
    };

    sounds.playLevelUp();
    if (onAddChild) {
      onAddChild(newStudentUser, newStudentProgress);
    }
    setSelectedChildId(nextStudentId);
    setShowAddChildModal(false);
    setAssignSuccessMessage(`Child account created for ${newStudentUser.name}! Username: ${newStudentUser.username}, PIN: ${newStudentUser.pin}`);
    setTimeout(() => setAssignSuccessMessage(''), 5000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Parent Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl">
            👨‍👧‍👦
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Heart className="w-3 h-3 text-rose-600" />
              Parent Guardian Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Parents: {currentUser.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-stone-500 font-mono">
                Parent ID: <span className="font-bold text-stone-800">{currentUser.id}</span> • Enrolled Children: {myChildren.length} of 3 Allowed
              </p>
              <button
                type="button"
                onClick={() => {
                  sounds.click();
                  setEditingUser(currentUser);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold border border-stone-200 cursor-pointer transition"
                title="Edit Parent Name & Avatar"
              >
                <Edit3 className="w-3 h-3 text-stone-600" />
                <span>Edit My Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Child Selector Tabs & Add Child Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl">
            {myChildren.map((child) => (
              <button
                key={child.studentId}
                id={`select-child-${child.studentId}`}
                onClick={() => {
                  setSelectedChildId(child.studentId);
                  sounds.playCorrect();
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  child.studentId === activeChild?.studentId
                    ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                <span>{child.avatar}</span>
                <span>{child.studentName}</span>
                <span className="text-[10px] text-stone-700 font-mono">
                  ({child.studentUsername})
                </span>
              </button>
            ))}
          </div>

          {/* Add Child Button (Up to 3 children) */}
          {myChildren.length < 3 ? (
            <button
              onClick={handleOpenAddChildModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black transition-all shadow-xs cursor-pointer"
              title="Add child (up to 3)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Child ({myChildren.length}/3)</span>
            </button>
          ) : (
            <span className="px-3 py-2 rounded-2xl bg-stone-100 text-stone-500 text-xs font-bold border border-stone-200">
              ✓ Family Max (3/3 Children)
            </span>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {assignSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{assignSuccessMessage}</span>
        </div>
      )}

      {myChildren.length === 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-3xl">
            👨‍👧‍👦
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black text-stone-900">
              Welcome to Your Parent Guardian Portal!
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              You can add up to <strong>3 children</strong> (Preschool through Grade 6) to track their homework, daily quests, and comprehensive report cards.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleOpenAddChildModal}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Your First Child</span>
            </button>
            <button
              onClick={onOpenPricing}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition"
            >
              Family Plans
            </button>
          </div>
        </div>
      )}

      {activeChild && (
        <>
          {/* Active Child Navigation & Quick Controls Header */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeChild.avatar}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-stone-900">
                    {activeChild.studentName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                    {activeChild.grade}
                  </span>
                  {(activeChild.country || activeChildUser?.country) && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                      <Globe className="w-3 h-3 text-amber-600" />
                      <span>{activeChild.country || activeChildUser?.country} ({activeChild.state || activeChildUser?.state})</span>
                    </span>
                  )}
                  {(activeChild.curriculum || activeChildUser?.curriculum) && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-600" />
                      <span>{activeChild.curriculum || activeChildUser?.curriculum}</span>
                    </span>
                  )}
                  {childClass && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{childClass.name}</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-500 font-mono mt-0.5">
                  Username: <strong>{activeChild.studentUsername}</strong> • Student PIN: <strong>{activeChildUser?.pin || '7392'}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Edit Child Details Button */}
              {activeChildUser && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setEditingUser(activeChildUser);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold transition cursor-pointer"
                  title="Edit Child Name, Avatar or Grade"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Child Profile</span>
                </button>
              )}

              {/* Reset PIN Button */}
              <button
                onClick={() => setShowResetPinModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset Child PIN</span>
              </button>

              {/* View Full Report Card Button */}
              <button
                onClick={() => {
                  sounds.playLevelUp();
                  setShowReportCardModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black transition shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Report Card & Analytics</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Average Score */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                <span>Average Quiz Score</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                {activeChild.averageScore}%
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <span>Top 5% in {activeChild.grade}</span>
              </p>
            </div>

            {/* Daily Streak */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                <span>Active Learning Streak</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-orange-600">
                {activeChild.streakDays} Days 🔥
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {activeChild.dailyQuizCompletedToday ? 'Daily Quiz done today!' : 'Pending today\'s quiz'}
              </p>
            </div>

            {/* Quizzes Taken */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                <span>Completed Quizzes</span>
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                {activeChild.totalQuizzesTaken}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Total XP: {activeChild.xp} (Level {activeChild.level})
              </p>
            </div>

            {/* Study Time / Screen Budget */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-2">
                <span>Daily Screen Limit</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-stone-900">
                {screenTimeLimit} min
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                ~28 mins spent today
              </p>
            </div>
          </section>

          {/* Deep Dive: Subject Breakdown & Parental Controls */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject Mastery Radar / Bars */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    {activeChild.studentName}'s Subject Proficiency
                  </h3>
                  <p className="text-xs text-stone-500">
                    Real-time performance mapped to standard {activeChild.grade} curriculum
                  </p>
                </div>
                <button
                  onClick={() => setShowReportCardModal(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Detailed Analytics</span>
                  <span>→</span>
                </button>
              </div>

              <div className="space-y-5">
                {(() => {
                  const mastery = { ...(activeChild.subjectMastery || {}) };
                  activeCurriculumSubjects.forEach(s => {
                    if (mastery[s] === undefined) mastery[s] = 85;
                  });
                  return Object.entries(mastery).map(([subject, score]) => (
                    <div key={subject}>
                      <div className="flex items-center justify-between text-xs font-bold text-stone-800 mb-1.5">
                        <span>{subject}</span>
                        <span className="font-mono">{score}% Mastered</span>
                      </div>
                      <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            score >= 90 ? 'bg-emerald-500' : score >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Strengths & Growth Recommendation Box */}
              <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
                  <strong className="font-bold flex items-center gap-1.5 mb-1 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Key Strength:
                  </strong>
                  <p className="leading-relaxed">
                    Excels at <strong>English Vocabulary & Numbers</strong> with consistent 94% accuracy and fast response time.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950">
                  <strong className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Recommended Focus:
                  </strong>
                  <p className="leading-relaxed">
                    Practice interactive quizzes and multi-step problems to boost Science mastery above 90%.
                  </p>
                </div>
              </div>
            </div>

            {/* Parental Controls & Assign Learning Goal */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Assign Practice Goal</span>
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Send a priority quiz or boss battle directly to {activeChild.studentName}'s dashboard.
                </p>

                <form onSubmit={handleAssignGoal} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Select Target Activity
                    </label>
                    <select
                      id="parent-assign-activity-select"
                      value={selectedActivityToAssign}
                      onChange={(e) => setSelectedActivityToAssign(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 text-xs font-medium focus:border-blue-500"
                    >
                      {activities.map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.title} ({act.subject} - {act.type.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                      Daily Screen Time Target: {screenTimeLimit} Mins
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="5"
                      value={screenTimeLimit}
                      onChange={(e) => setScreenTimeLimit(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                      <span>15 min</span>
                      <span>60 min</span>
                      <span>120 min</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Send Goal to {activeChild.studentName}</span>
                  </button>
                </form>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Safe Mode Active</span>
                </span>
                <span className="font-mono text-[10px]">PIN: {activeChildUser?.pin || '7392'}</span>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD CHILD MODAL (Up to 3 Children) */}
      {/* ========================================================================= */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg">
                  👶
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Enroll Child Learner</h3>
                  <span className="text-[10px] text-stone-400">Child {myChildren.length + 1} of 3 Allowed</span>
                </div>
              </div>
              <button onClick={() => setShowAddChildModal(false)} className="text-stone-400 hover:text-stone-900 cursor-pointer p-1">✕</button>
            </div>

            <form onSubmit={handleCreateChild} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Child Full Name *
                </label>
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewChildName(val);
                    if (val.trim()) {
                      const autoUser = generateStudentUsername(val, allUsers, undefined, false, currentUser.name);
                      setNewChildUsername(autoUser);
                    }
                  }}
                  placeholder="e.g. Larry Smith"
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Grade Level
                  </label>
                  <select
                    value={newChildGrade}
                    onChange={(e) => setNewChildGrade(e.target.value as GradeLevel)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-xs"
                  >
                    {activeGrades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Student Username</span>
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Immutable
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newChildUsername}
                      readOnly
                      title="Username is auto-generated and immutable (e.g. LARSMI1, LARSMI2)"
                      className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 font-mono font-bold text-xs text-amber-900 cursor-not-allowed select-all"
                      required
                    />
                    <Lock className="w-3.5 h-3.5 text-amber-600 absolute right-3 top-2.5" />
                  </div>
                  <span className="text-[9px] text-stone-400 mt-0.5 block">
                    Formula: First 3 letters + Last 3 letters + sequence (e.g. LARSMI1, LARSMI2)
                  </span>
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Pick Favorite Avatar
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {avatarOptions.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setNewChildAvatar(av)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                        newChildAvatar === av 
                          ? 'bg-rose-100 border-2 border-rose-600 scale-110' 
                          : 'bg-stone-50 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country, State & Curriculum for Child */}
              <div className="space-y-2.5 pt-1 border-t border-stone-100">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-amber-600" />
                    <span>Country</span>
                  </label>
                  <select
                    value={newChildCountry}
                    onChange={(e) => {
                      const c = e.target.value;
                      setNewChildCountry(c);
                      const sts = COUNTRY_STATE_MAP[c] || ['National Standard / All States'];
                      const crs = COUNTRY_CURRICULUM_MAP[c] || ['Universal Foundational'];
                      setNewChildState(sts[0] || 'National Standard / All States');
                      setNewChildCurriculum(crs[0] || 'Universal Foundational');
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-xs bg-stone-50"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>State / Province</span>
                    </label>
                    <select
                      value={newChildState}
                      onChange={(e) => setNewChildState(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 font-bold text-xs bg-stone-50"
                    >
                      {(COUNTRY_STATE_MAP[newChildCountry] || ['National Standard / All States']).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-blue-600" />
                      <span>Curriculum</span>
                    </label>
                    <select
                      value={newChildCurriculum}
                      onChange={(e) => setNewChildCurriculum(e.target.value)}
                      className="w-full p-2 rounded-xl border border-stone-200 font-bold text-xs bg-stone-50"
                    >
                      {(COUNTRY_CURRICULUM_MAP[newChildCountry] || ['Universal Foundational']).map((cr) => (
                        <option key={cr} value={cr}>{cr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4-Digit PIN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    4-Digit Child PIN (for easy login)
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomizePin}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Randomize</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  value={newChildPin}
                  onChange={(e) => setNewChildPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-mono font-black text-center text-xl tracking-widest text-stone-900 bg-rose-50/40"
                  required
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black cursor-pointer shadow-xs"
                >
                  Enroll Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULL DETAIL REPORT CARD MODAL */}
      {/* ========================================================================= */}
      {showReportCardModal && activeChild && (
        <StudentReportCardModal
          student={activeChild}
          userAccount={activeChildUser}
          className={childClass?.name}
          section={childClass?.section}
          room={childClass?.room}
          teacherName={childClass?.teacherName}
          principalName={activeChild.schoolName ? `Principal / Academic Dean (${activeChild.schoolName})` : undefined}
          parentName={currentUser.name}
          schoolName={activeChild.schoolName || activeChildUser?.schoolName}
          onClose={() => setShowReportCardModal(false)}
          viewerRole="parent"
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESET CHILD PIN MODAL */}
      {/* ========================================================================= */}
      {showResetPinModal && activeChildUser && onResetCredentials && (
        <ResetCredentialsModal
          user={activeChildUser}
          onClose={() => setShowResetPinModal(false)}
          onSaveCredentials={(userId, newSecret, isPin, newUsername) => {
            onResetCredentials(userId, newSecret, isPin, newUsername);
            setAssignSuccessMessage(`Updated credentials for ${activeChild.studentName}!`);
            setTimeout(() => setAssignSuccessMessage(''), 4000);
          }}
        />
      )}
      {/* ========================================================================= */}
      {/* MODAL 4: EDIT USER / CHILD PROFILE MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <EditUserProfileModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onSave={(updatedUser) => {
            onUpdateUserProfile?.(updatedUser);
            setAssignSuccessMessage(`Profile details updated for ${updatedUser.name}!`);
            setTimeout(() => setAssignSuccessMessage(''), 4000);
          }}
          availableGrades={activeGrades}
          canEditStatus={false}
          canEditGrade={false}
        />
      )}
    </div>
  );
}
