import { useState, useEffect, useMemo } from 'react';
import { 
  UserAccount, 
  Question, 
  Activity, 
  StudentProgress,
  Subject,
  GradeLevel 
} from '../../types';
import { 
  Flame, 
  Zap, 
  Coins, 
  Trophy, 
  Play, 
  Swords, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RotateCcw, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Award,
  BookOpen,
  Volume2,
  BarChart3,
  Compass,
  Lock,
  Layers,
  Clock,
  Target,
  Check,
  TrendingUp,
  Search,
  Filter,
  Activity as ActivityIcon,
  Database,
  FolderOpen,
  ChevronDown,
  GraduationCap,
  Gamepad2,
  X,
  Medal
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import { useBodyScrollLock } from '../../utils/useBodyScrollLock';
import StudentIDCard from './StudentIDCard';
import StudentReportCardModal from './StudentReportCardModal';
import Leaderboard from './components/Leaderboard';
import DailyGoalCard from './components/DailyGoalCard';
import StudentAnalyticsDashboard from './components/StudentAnalyticsDashboard';
import ActivityPlayerModal from '../activities/ActivityPlayerModal';
import InteractiveQuestionCard from '../activities/InteractiveQuestionCard';
import TactileActivityLab from '../tactile-activities/TactileActivityLab';
import PforPencilLogo from '../../common/PforPencilLogo';
import { syncActivityAttemptToSupabase, syncProgressToSupabase, isSupabaseConfigured } from '../../database';
import { loadQuestionBankMasters } from '../../data/questionBankMasterData';
import { loadCurriculumMaster } from '../../data/curriculumMasterData';

function normalizeCurriculum(name?: string): string {
  if (!name) return '';
  const s = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('ccss') || s.includes('commoncore')) return 'ccss';
  if (s.includes('cbse') || s.includes('centralboard')) return 'cbse';
  if (s.includes('vcaa') || s.includes('victorian')) return 'vcaa';
  if (s.includes('acara') || s.includes('australian')) return 'acara';
  if (s.includes('uknc') || s.includes('uknational') || s.includes('england')) return 'uknc';
  if (s.includes('ontario')) return 'ontario';
  if (s.includes('ibpyp') || s.includes('ibprimary') || s.includes('internationalbaccalaureate')) return 'ibpyp';
  if (s.includes('universal') || s.includes('global')) return 'universal';
  return s;
}

function normalizeCountry(name?: string): string {
  if (!name) return '';
  const s = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('us') || s.includes('unitedstates') || s.includes('america') || s.includes('cntus')) return 'us';
  if (s.includes('in') || s.includes('india') || s.includes('cntin')) return 'in';
  if (s.includes('au') || s.includes('australia') || s.includes('cntau')) return 'au';
  if (s.includes('uk') || s.includes('unitedkingdom') || s.includes('england') || s.includes('cntuk') || s.includes('britain')) return 'uk';
  if (s.includes('ca') || s.includes('canada') || s.includes('cntca')) return 'ca';
  if (s.includes('global') || s.includes('cntgl') || s.includes('world') || s.includes('universal')) return 'global';
  return s;
}

function normalizeGrade(g?: string): string {
  if (!g) return '';
  const s = g.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('pre') || s.includes('nursery') || s.includes('kindergarten') || s.includes('eyfs') || s.includes('reception')) return 'preschool';
  if (s.includes('foundation') || s.includes('prep') || s.includes('fnd')) return 'foundation';
  if (s.includes('1') || s.includes('one')) return 'grade 1';
  if (s.includes('2') || s.includes('two')) return 'grade 2';
  if (s.includes('3') || s.includes('three')) return 'grade 3';
  if (s.includes('4') || s.includes('four')) return 'grade 4';
  if (s.includes('5') || s.includes('five')) return 'grade 5';
  if (s.includes('6') || s.includes('six')) return 'grade 6';
  return g.trim().toLowerCase();
}

export interface PerformanceMilestone {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'streak' | 'quizzes' | 'score' | 'xp' | 'coins';
  criterion: string;
  check: (progress: StudentProgress, lastAttempt?: { type: string; score: number; maxScore: number; speedBonus?: number }) => boolean;
  getProgress: (progress: StudentProgress) => { current: number; target: number; label: string };
}

export const PERFORMANCE_MILESTONES: PerformanceMilestone[] = [
  {
    id: 'badge_streak_10',
    name: '10-Day Streak Titan',
    icon: '🔥',
    description: 'Completed 10 consecutive daily quizzes! Outstanding dedication and consistency!',
    category: 'streak',
    criterion: 'Complete 10 consecutive daily quizzes',
    check: (p) => (p.streakDays || 0) >= 10,
    getProgress: (p) => ({
      current: Math.min(p.streakDays || 0, 10),
      target: 10,
      label: `${Math.min(p.streakDays || 0, 10)}/10 daily quizzes`
    })
  },
  {
    id: 'badge_streak_3',
    name: '3-Day Quiz Spark',
    icon: '⚡',
    description: 'Completed 3 consecutive daily quizzes!',
    category: 'streak',
    criterion: 'Complete 3 consecutive daily quizzes',
    check: (p) => (p.streakDays || 0) >= 3,
    getProgress: (p) => ({
      current: Math.min(p.streakDays || 0, 3),
      target: 3,
      label: `${Math.min(p.streakDays || 0, 3)}/3 daily quizzes`
    })
  },
  {
    id: 'badge_streak_5',
    name: '5-Day Streak Star',
    icon: '🌟',
    description: 'Achieved a 5-day daily learning streak without missing a day!',
    category: 'streak',
    criterion: 'Complete 5 consecutive daily quizzes',
    check: (p) => (p.streakDays || 0) >= 5,
    getProgress: (p) => ({
      current: Math.min(p.streakDays || 0, 5),
      target: 5,
      label: `${Math.min(p.streakDays || 0, 5)}/5 daily quizzes`
    })
  },
  {
    id: 'badge_perfect_score',
    name: 'Flawless Scholar',
    icon: '🎯',
    description: 'Scored a perfect 100% on a quiz or activity challenge!',
    category: 'score',
    criterion: 'Score 100% on any quiz challenge',
    check: (p, last) => Boolean(last && last.maxScore > 0 && last.score === last.maxScore),
    getProgress: (p) => ({
      current: (p.averageScore || 0) >= 100 ? 1 : 0,
      target: 1,
      label: (p.averageScore || 0) >= 100 ? 'Achieved 100%' : 'Pending 100% quiz'
    })
  },
  {
    id: 'badge_quizzes_10',
    name: 'Quiz Explorer 10',
    icon: '📚',
    description: 'Completed 10 educational quizzes and learning quests!',
    category: 'quizzes',
    criterion: 'Complete 10 total quizzes',
    check: (p) => (p.totalQuizzesTaken || 0) >= 10,
    getProgress: (p) => ({
      current: Math.min(p.totalQuizzesTaken || 0, 10),
      target: 10,
      label: `${Math.min(p.totalQuizzesTaken || 0, 10)}/10 quizzes`
    })
  },
  {
    id: 'badge_quizzes_25',
    name: 'Grand Quest Master',
    icon: '🏆',
    description: 'Conquered 25 educational quizzes and quests across your grade curriculum!',
    category: 'quizzes',
    criterion: 'Complete 25 total quizzes',
    check: (p) => (p.totalQuizzesTaken || 0) >= 25,
    getProgress: (p) => ({
      current: Math.min(p.totalQuizzesTaken || 0, 25),
      target: 25,
      label: `${Math.min(p.totalQuizzesTaken || 0, 25)}/25 quizzes`
    })
  },
  {
    id: 'badge_speed_demon',
    name: 'Speed Demon',
    icon: '⏱️',
    description: 'Aced quiz questions with lightning fast speed bonus points!',
    category: 'score',
    criterion: 'Earn speed bonus in a quiz',
    check: (p, last) => Boolean((last?.speedBonus || 0) > 0),
    getProgress: (p) => ({
      current: 1,
      target: 1,
      label: 'Speed bonus challenge'
    })
  },
  {
    id: 'badge_xp_1000',
    name: 'Century Scholar',
    icon: '👑',
    description: 'Accumulated 1,000 XP through persistent learning and drills!',
    category: 'xp',
    criterion: 'Earn 1,000 total XP',
    check: (p) => (p.xp || 0) >= 1000,
    getProgress: (p) => ({
      current: Math.min(p.xp || 0, 1000),
      target: 1000,
      label: `${Math.min(p.xp || 0, 1000)}/1000 XP`
    })
  },
  {
    id: 'badge_coins_100',
    name: 'Gold Vault Collector',
    icon: '🪙',
    description: 'Gathered 100 or more reward coins from quiz achievements!',
    category: 'coins',
    criterion: 'Collect 100 learning coins',
    check: (p) => (p.coins || 0) >= 100,
    getProgress: (p) => ({
      current: Math.min(p.coins || 0, 100),
      target: 100,
      label: `${Math.min(p.coins || 0, 100)}/100 Coins`
    })
  },
  {
    id: 'badge_first_quiz',
    name: 'First Discovery',
    icon: '🚀',
    description: 'Successfully completed your first learning quest challenge!',
    category: 'quizzes',
    criterion: 'Complete 1 quiz challenge',
    check: (p) => (p.totalQuizzesTaken || 0) >= 1,
    getProgress: (p) => ({
      current: Math.min(p.totalQuizzesTaken || 0, 1),
      target: 1,
      label: `${Math.min(p.totalQuizzesTaken || 0, 1)}/1 completed`
    })
  }
];

/**
 * Evaluates performance milestones and issues achievement badges to the student.
 * Handles milestones including 10 consecutive daily quizzes, scoring 100%,
 * accumulating XP/coins, or reaching total quiz milestones.
 *
 * @param progress Current student progress state
 * @param lastAttempt Optional details of the quiz/activity just completed
 * @param onBadgeAwarded Optional callback invoked with newly minted badge objects
 * @returns Object containing updated student progress and array of newly issued badges
 */
export function issueAchievementBadges(
  progress: StudentProgress,
  lastAttempt?: { type: string; score: number; maxScore: number; speedBonus?: number },
  onBadgeAwarded?: (newlyIssued: { id: string; name: string; icon: string; description: string; unlockedAt: string }[]) => void
): { updatedProgress: StudentProgress; newBadges: { id: string; name: string; icon: string; description: string; unlockedAt: string }[] } {
  const existingBadges = progress.badges || [];
  const existingBadgeIds = new Set(existingBadges.map((b) => b.id));
  const existingBadgeNames = new Set(existingBadges.map((b) => b.name.toLowerCase().trim()));
  const newBadges: { id: string; name: string; icon: string; description: string; unlockedAt: string }[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  for (const milestone of PERFORMANCE_MILESTONES) {
    if (!existingBadgeIds.has(milestone.id) && !existingBadgeNames.has(milestone.name.toLowerCase().trim())) {
      const qualified = milestone.check(progress, lastAttempt);
      if (qualified) {
        newBadges.push({
          id: milestone.id,
          name: milestone.name,
          icon: milestone.icon,
          description: milestone.description,
          unlockedAt: todayStr
        });
        existingBadgeIds.add(milestone.id);
        existingBadgeNames.add(milestone.name.toLowerCase().trim());
      }
    }
  }

  if (newBadges.length > 0) {
    const updatedProgress: StudentProgress = {
      ...progress,
      badges: [...existingBadges, ...newBadges]
    };
    if (onBadgeAwarded) {
      onBadgeAwarded(newBadges);
    }
    return { updatedProgress, newBadges };
  }

  return { updatedProgress: progress, newBadges: [] };
}

interface StudentPortalProps {
  currentUser: UserAccount;
  studentProgress: StudentProgress;
  studentProgressMap?: Record<string, StudentProgress>;
  questions: Question[];
  activities: Activity[];
  onUpdateProgress: (updated: StudentProgress) => void;
}

export default function StudentPortal({
  currentUser,
  studentProgress,
  studentProgressMap,
  questions,
  activities,
  onUpdateProgress
}: StudentPortalProps) {
  // Navigation Tabs - Skill Practice & Tests is the primary default focus
  const [activeTab, setActiveTab] = useState<'skills' | 'tactile' | 'leaderboard' | 'analytics'>('skills');

  // Master data version tracking to react instantly when admin activates/deactivates categories or skills
  const [masterDataVersion, setMasterDataVersion] = useState(0);
  useEffect(() => {
    const handleMasterUpdate = () => setMasterDataVersion(v => v + 1);
    window.addEventListener('pforpencil_master_data_updated', handleMasterUpdate);
    window.addEventListener('funlearn_master_data_updated', handleMasterUpdate);
    window.addEventListener('storage', handleMasterUpdate);
    return () => {
      window.removeEventListener('pforpencil_master_data_updated', handleMasterUpdate);
      window.removeEventListener('funlearn_master_data_updated', handleMasterUpdate);
      window.removeEventListener('storage', handleMasterUpdate);
    };
  }, []);

  // Student's Enrolled Grade (strictly locked to the student's actual enrolled grade level)
  const studentGrade: GradeLevel = (currentUser.grade || studentProgress.grade || 'Preschool') as GradeLevel;
  const studentCountry: string = currentUser.country || studentProgress.country || 'United States';
  const studentState: string = currentUser.state || studentProgress.state || 'California';
  const studentCurriculum: string = currentUser.curriculum || studentProgress.curriculum || 'US Common Core (CCSS)';

  // Grade-Locked and Regional / Curriculum Scoped questions with flexible fuzzy matching
  const gradeLockedQuestions = useMemo(() => {
    const normStudentGrade = normalizeGrade(studentGrade);
    const normStudentCountry = normalizeCountry(studentCountry);
    const normStudentCurriculum = normalizeCurriculum(studentCurriculum);

    return questions.filter(q => {
      // 0. Status check: Only Published (or legacy active questions without draft/archived status) are visible to students
      if (q.status && q.status !== 'Published') return false;

      // 1. Grade check
      if (q.grade) {
        const qNormGrade = normalizeGrade(q.grade);
        if (qNormGrade !== normStudentGrade && q.grade !== studentGrade) return false;
      }

      // 2. Country check (Global universal questions or matching student country)
      if (q.country && q.country !== 'Global' && q.countryId !== 'CNT-GL') {
        const qNormCountry = normalizeCountry(q.country || q.countryId);
        if (qNormCountry !== 'global' && qNormCountry !== normStudentCountry && q.country !== studentCountry) {
          return false;
        }
      }

      // 3. Curriculum check (Universal standards or matching student curriculum)
      if (q.curriculum && q.curriculum !== 'Global Standard' && q.curriculum !== 'Universal' && q.curriculumId !== 'CUR-GLOBAL') {
        const qNormCurriculum = normalizeCurriculum(q.curriculum || q.curriculumId);
        if (qNormCurriculum !== 'universal' && qNormCurriculum !== normStudentCurriculum && q.curriculum !== studentCurriculum) {
          return false;
        }
      }

      return true;
    });
  }, [questions, studentGrade, studentCountry, studentCurriculum]);

  // Activity Category, Subject & Search filter states (strictly locked to student's grade)
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('All');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState<string>('All');
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');

  const gradeLockedActivities = useMemo(() => {
    return activities.filter(act => {
      if (act.status && act.status !== 'Published') return false;
      // 1. Strict Grade-Lock: student can ONLY see their assigned grade's activities
      const allowedGrades = act.grades?.length ? act.grades : [act.grade];
      if (allowedGrades.length && !allowedGrades.includes(studentGrade)) return false;
      
      // 2. Format / Category filter
      if (activityCategoryFilter !== 'All' && act.type !== activityCategoryFilter) return false;
      
      // 3. Subject filter
      if (activitySubjectFilter !== 'All' && act.subject !== activitySubjectFilter) return false;

      // 4. Search query
      if (activitySearchQuery.trim()) {
        const q = activitySearchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchSubject = act.subject.toLowerCase().includes(q);
        const matchDesc = act.description.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchDesc) return false;
      }

      return true;
    });
  }, [activities, studentGrade, activityCategoryFilter, activitySubjectFilter, activitySearchQuery]);

  // Daily Quiz Activity for student's enrolled grade
  const dailyQuizActivity = useMemo(() => {
    return gradeLockedActivities.find(act => act.type === 'daily_quiz') ||
           activities.find(act => act.type === 'daily_quiz' && (act.grades?.includes(studentGrade) || act.grade === studentGrade)) ||
           activities.find(act => act.type === 'daily_quiz') ||
           null;
  }, [gradeLockedActivities, activities, studentGrade]);

  // Skill Browser states
  const [selectedSkillSubject, setSelectedSkillSubject] = useState<string>('All');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  // Activity state
  const [activePlayActivity, setActivePlayActivity] = useState<Activity | null>(null);
  const [modernActivity, setModernActivity] = useState<Activity | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [openBoxInput, setOpenBoxInput] = useState('');
  const [userDragPlacements, setUserDragPlacements] = useState<Record<string, string>>({});
  const [userMatchPairs, setUserMatchPairs] = useState<Record<string, string>>({});
  const [userOrderedList, setUserOrderedList] = useState<string[]>([]);
  const [userBuckets, setUserBuckets] = useState<Record<string, string[]>>({});
  const [tappedObjectIds, setTappedObjectIds] = useState<string[]>([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const resetQuestionInteractions = (targetQ?: Question) => {
    setSelectedOption(null);
    setOpenBoxInput('');
    setUserDragPlacements({});
    setUserMatchPairs({});
    setUserOrderedList(targetQ?.orderSequence ? [...targetQ.orderSequence] : targetQ?.options ? [...targetQ.options] : []);
    setUserBuckets({});
    setTappedObjectIds([]);
  };
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{ status: 'correct' | 'wrong'; title: string; message: string; isSpeedBonus?: boolean } | null>(null);

  // Live Question Timer states
  const [questionTimer, setQuestionTimer] = useState<number>(30);
  const [questionElapsedTime, setQuestionElapsedTime] = useState<number>(0);
  const [speedBonusesEarned, setSpeedBonusesEarned] = useState<number>(0);

  // Helper for reading questions aloud to young students
  const handleReadAloud = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Boss Battle specific states
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [battleMessage, setBattleMessage] = useState('');
  const [isBossAttacking, setIsBossAttacking] = useState(false);

  // Live Supabase Sync Status
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<{
    status: 'idle' | 'syncing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // Achievement Badge Milestone States
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<{ id: string; name: string; icon: string; description: string; unlockedAt: string }[] | null>(null);
  const [showAllMilestonesModal, setShowAllMilestonesModal] = useState(false);
  const [selectedBadgeDetail, setSelectedBadgeDetail] = useState<{ id: string; name: string; icon: string; description: string; unlockedAt?: string; criterion?: string } | null>(null);

  // Lock body scroll whenever badge modals or achievement celebrations are open
  useBodyScrollLock(Boolean(newlyUnlockedBadges || showAllMilestonesModal || selectedBadgeDetail));

  /**
   * Helper function to evaluate and issue achievement badges to the student
   * based on specific performance milestones (such as 10 consecutive daily quizzes, 100% scores, etc.)
   */
  const handleIssueMilestoneBadges = (
    baseProgress: StudentProgress,
    lastAttempt?: { type: string; score: number; maxScore: number; speedBonus?: number },
    showCelebrationModal: boolean = true
  ): StudentProgress => {
    const { updatedProgress, newBadges } = issueAchievementBadges(
      baseProgress,
      lastAttempt,
      (issued) => {
        if (showCelebrationModal && issued.length > 0) {
          sounds.playVictory();
          confetti({
            particleCount: 110,
            spread: 80,
            origin: { y: 0.5 }
          });
          setNewlyUnlockedBadges(issued);
        }
      }
    );

    if (newBadges.length > 0) {
      onUpdateProgress(updatedProgress);
      if (isSupabaseConfigured()) {
        syncProgressToSupabase(updatedProgress);
      }
    }

    return updatedProgress;
  };

  // Check on mount or progress update if student already qualifies for milestone badges that are not yet awarded
  useEffect(() => {
    if (studentProgress) {
      const { updatedProgress, newBadges } = issueAchievementBadges(studentProgress);
      if (newBadges.length > 0) {
        onUpdateProgress(updatedProgress);
        if (isSupabaseConfigured()) {
          syncProgressToSupabase(updatedProgress);
        }
      }
    }
  }, [studentProgress?.streakDays, studentProgress?.totalQuizzesTaken, studentProgress?.xp, studentProgress?.coins]);

  // Game specific (Math Bubble Pop)
  const [gameTimer, setGameTimer] = useState(30);
  const [gameRunning, setGameRunning] = useState(false);

  // Get current questions for active activity
  const activeQuestions: Question[] = useMemo(() => {
    if (!activePlayActivity) return [];
    return activePlayActivity.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));
  }, [activePlayActivity, questions]);

  const currentQ = activeQuestions[currentQuestionIndex];

  const canSubmitAnswer = useMemo(() => {
    if (!currentQ || isAnswerSubmitted) return false;
    const qType = currentQ.type || 'multiple_choice';
    if (qType === 'open_box' || qType === 'fill_blank') {
      return openBoxInput.trim().length > 0;
    }
    if (qType === 'select_objects') {
      return tappedObjectIds.length > 0;
    }
    if (qType === 'drag_and_drop') {
      return Object.keys(userDragPlacements).length > 0;
    }
    if (qType === 'match_making') {
      return Object.keys(userMatchPairs).length > 0;
    }
    if (qType === 'ordering') {
      return userOrderedList.length > 0;
    }
    if (qType === 'sorting') {
      return Object.values(userBuckets).some((arr) => arr.length > 0);
    }
    return selectedOption !== null;
  }, [currentQ, isAnswerSubmitted, openBoxInput, tappedObjectIds, userDragPlacements, userMatchPairs, userOrderedList, userBuckets, selectedOption]);

  const handleModernActivityComplete = (activity: Activity, finalScore: number, maxScore: number) => {
    const addedXp = activity.rewardXP || 0;
    const addedCoins = activity.rewardCoins || 0;
    const updatedXp = studentProgress.xp + addedXp;
    const updatedLevel = Math.floor(updatedXp / 500) + 1;
    const log = {
      id: `ACT-LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: activity.title, type: activity.type, score: finalScore, maxScore, timestamp: 'Just now'
    };
    const updatedProgress = {
      ...studentProgress, 
      xp: updatedXp, 
      level: updatedLevel, 
      coins: studentProgress.coins + addedCoins,
      streakDays: studentProgress.streakDays + (activity.type === 'daily_quiz' && !studentProgress.dailyQuizCompletedToday ? 1 : 0),
      dailyQuizCompletedToday: activity.type === 'daily_quiz' ? true : studentProgress.dailyQuizCompletedToday,
      totalQuizzesTaken: studentProgress.totalQuizzesTaken + 1,
      recentActivities: [log, ...studentProgress.recentActivities.slice(0, 5)]
    };

    // Evaluate performance milestones and issue achievement badges
    const finalProgressWithBadges = handleIssueMilestoneBadges(
      updatedProgress,
      {
        type: activity.type,
        score: finalScore,
        maxScore,
        speedBonus: 0
      },
      true
    );

    onUpdateProgress(finalProgressWithBadges);
    if (isSupabaseConfigured()) {
      syncActivityAttemptToSupabase(currentUser.id, activity.id, finalScore, Math.max(1, activity.questionIds.length), addedXp, addedCoins, false);
      syncProgressToSupabase(finalProgressWithBadges);
    }
  };

  // Start an activity
  const handleStartActivity = (activity: Activity, forceInteractive = false) => {
    sounds.playCorrect();
    // Only route to step-based game modal if explicitly forced or if it's an arcade/mini-game format
    const isGameActivity = forceInteractive || 
      activity.type === 'game' || 
      activity.format === 'feeding_game' || 
      activity.format === 'balloon_pop' ||
      activity.format === 'space_blaster';

    if (isGameActivity) {
      setActivePlayActivity(null);
      setModernActivity(activity);
      return;
    }

    const firstQ = questions.find((q) => q.id === activity.questionIds[0]);
    setActivePlayActivity(activity);
    setCurrentQuestionIndex(0);
    resetQuestionInteractions(firstQ);
    setIsAnswerSubmitted(false);
    setShowHint(false);
    setScore(0);
    setQuizFinished(false);
    setQuestionTimer(30);
    setQuestionElapsedTime(0);
    setSpeedBonusesEarned(0);
    setSupabaseSyncStatus({ status: 'idle' });

    if (activity.type === 'boss_battle') {
      setBossHp(100);
      setPlayerHp(100);
      setBattleMessage(`A wild ${activity.bossName || 'Boss'} approaches! Answer correctly to deal 25 damage!`);
    }

    if (activity.type === 'game') {
      setGameTimer(30);
      setGameRunning(true);
    }
  };

  // Launch daily quiz directly from Daily Goal Card
  const handleStartDailyQuiz = () => {
    if (dailyQuizActivity) {
      handleStartActivity(dailyQuizActivity);
    } else {
      const qIds = gradeLockedQuestions.slice(0, 5).map(q => q.id);
      const fallbackDaily: Activity = {
        id: `DAILY-QUEST-${studentGrade}`,
        type: 'daily_quiz',
        title: `${studentGrade} Daily Sunrise Quest`,
        description: 'Answer today’s daily challenge questions to secure your streak bonus!',
        subject: (gradeLockedQuestions[0]?.subject || 'Mathematics') as Subject,
        grade: studentGrade,
        questionIds: qIds.length > 0 ? qIds : questions.slice(0, 5).map(q => q.id),
        rewardXP: 100,
        rewardCoins: 25,
        durationMinutes: 5,
        unlocked: true
      };
      handleStartActivity(fallbackDaily);
    }
  };

  // Launch skill targeted practice from analytics dashboard
  const handleStartPracticeSkill = (skillName: string, subjectName: string) => {
    const matchedQs = gradeLockedQuestions.filter(q => q.skill === skillName || q.subject === subjectName);
    const qIds = (matchedQs.length > 0 ? matchedQs : gradeLockedQuestions).slice(0, 5).map(q => q.id);
    const practiceActivity: Activity = {
      id: `PRACTICE-${Date.now()}`,
      type: 'challenge',
      title: `${skillName || subjectName} Targeted Practice`,
      description: `Targeted practice quest designed to elevate your mastery in ${skillName || subjectName}.`,
      subject: (subjectName as Subject) || 'Mathematics',
      grade: studentGrade,
      questionIds: qIds.length > 0 ? qIds : questions.slice(0, 5).map(q => q.id),
      rewardXP: 75,
      rewardCoins: 20,
      durationMinutes: 5,
      unlocked: true
    };
    handleStartActivity(practiceActivity);
  };

  // Live Timer for Individual Question
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (activePlayActivity && !quizFinished && !isAnswerSubmitted && currentQ) {
      timerInterval = setInterval(() => {
        setQuestionElapsedTime((prev) => prev + 1);
        setQuestionTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [activePlayActivity, quizFinished, isAnswerSubmitted, currentQuestionIndex, currentQ]);

  // Timer for game
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameRunning && gameTimer > 0) {
      interval = setInterval(() => {
        setGameTimer((prev) => prev - 1);
      }, 1000);
    } else if (gameTimer === 0 && gameRunning) {
      setGameRunning(false);
      finishActivity(score);
    }
    return () => clearInterval(interval);
  }, [gameRunning, gameTimer, score]);

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    sounds.click();
    setSelectedOption(idx);
  };

  const handleNumberPadPress = (val: string) => {
    if (isAnswerSubmitted) return;
    sounds.click();
    if (val === 'clear') {
      setOpenBoxInput('');
    } else if (val === 'backspace') {
      setOpenBoxInput((prev) => prev.slice(0, -1));
    } else {
      if (openBoxInput.length < 8) {
        setOpenBoxInput((prev) => prev + val);
      }
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentQ || isAnswerSubmitted) return;

    let isCorrect = false;
    const qType = currentQ.type || 'multiple_choice';

    if (qType === 'open_box' || qType === 'fill_blank') {
      if (!openBoxInput.trim()) return;
      const target = (currentQ.openBoxAnswer || currentQ.options[0] || '').trim().toLowerCase();
      isCorrect = openBoxInput.trim().toLowerCase() === target;
    } else if (qType === 'select_objects') {
      const target = parseInt(currentQ.openBoxAnswer || currentQ.options[0] || '4', 10);
      isCorrect = tappedObjectIds.length === target;
    } else if (qType === 'drag_and_drop') {
      const dragTargets = currentQ.dragItems || [];
      isCorrect = dragTargets.length > 0 && dragTargets.every((d) => userDragPlacements[d.item] === d.target);
    } else if (qType === 'match_making') {
      const expectedPairs = currentQ.matchPairs || [];
      isCorrect = expectedPairs.length > 0 && expectedPairs.every((p) => userMatchPairs[p.left] === p.right);
    } else if (qType === 'ordering') {
      const expectedOrder = currentQ.orderSequence || currentQ.options || [];
      isCorrect = expectedOrder.length > 0 && userOrderedList.join(',') === expectedOrder.join(',');
    } else if (qType === 'sorting') {
      const expectedBuckets = currentQ.sortBuckets || [];
      isCorrect = expectedBuckets.length > 0 && expectedBuckets.every((b) => {
        const userItems = userBuckets[b.bucketName] || [];
        return b.items.length === userItems.length && b.items.every((it) => userItems.includes(it));
      });
    } else {
      if (selectedOption === null) return;
      isCorrect = selectedOption === currentQ.correctIndex;
    }

    setIsAnswerSubmitted(true);

    const isSpeedBonus = isCorrect && questionElapsedTime <= 10;
    const pointsEarned = currentQ.points + (isSpeedBonus ? 10 : 0);

    if (isCorrect) {
      sounds.playHappyCelebration();
      setScore((prev) => prev + pointsEarned);
      if (isSpeedBonus) {
        setSpeedBonusesEarned((prev) => prev + 1);
      }
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
      setAnswerFeedback({
        status: 'correct',
        title: isSpeedBonus ? '⚡ Lightning Fast! Speed Bonus!' : '🌟 Outstanding! Excellent Job!',
        message: isSpeedBonus 
          ? `Answered in just ${questionElapsedTime}s! You earned +${currentQ.points} Base XP & +10 Speed Bonus XP!` 
          : `Super work! You got it right in ${questionElapsedTime}s and earned +${currentQ.points} Points!`,
        isSpeedBonus
      });

      if (activePlayActivity?.type === 'boss_battle') {
        setBossHp((prev) => Math.max(0, prev - 25));
        setBattleMessage(`Critical Strike! You dealt 25 damage to ${activePlayActivity.bossName}! 💥`);
      }
    } else {
      sounds.playWrong();
      setAnswerFeedback({
        status: 'wrong',
        title: '💪 Great Effort! Keep Going!',
        message: "Mistakes help our brain grow! Let's check the explanation below to master this:"
      });
      if (activePlayActivity?.type === 'boss_battle') {
        sounds.playBossAttack();
        setIsBossAttacking(true);
        setPlayerHp((prev) => Math.max(0, prev - 20));
        setBattleMessage(`${activePlayActivity.bossName} counter-attacked and dealt 20 damage! ⚡`);
        setTimeout(() => setIsBossAttacking(false), 600);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < activeQuestions.length) {
      const nextIdx = currentQuestionIndex + 1;
      const nextQ = activeQuestions[nextIdx];
      setCurrentQuestionIndex(nextIdx);
      resetQuestionInteractions(nextQ);
      setIsAnswerSubmitted(false);
      setShowHint(false);
      setAnswerFeedback(null);
      setQuestionTimer(30);
      setQuestionElapsedTime(0);
    } else {
      finishActivity(score);
    }
  };

  const finishActivity = (finalScore: number) => {
    setQuizFinished(true);
    sounds.playVictory();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (activePlayActivity) {
      const addedXp = activePlayActivity.rewardXP + (speedBonusesEarned * 10);
      const addedCoins = activePlayActivity.rewardCoins;
      const updatedXp = studentProgress.xp + addedXp;
      const updatedLevel = Math.floor(updatedXp / 500) + 1;

      const newActivityLog = {
        id: `ACT-LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: activePlayActivity.title,
        type: activePlayActivity.type,
        score: finalScore,
        maxScore: activeQuestions.reduce((acc, q) => acc + q.points, 0) || 100,
        timestamp: 'Just now'
      };

      const updatedProgress = {
        ...studentProgress,
        xp: updatedXp,
        level: updatedLevel,
        coins: studentProgress.coins + addedCoins,
        streakDays: studentProgress.streakDays + (activePlayActivity.type === 'daily_quiz' && !studentProgress.dailyQuizCompletedToday ? 1 : 0),
        dailyQuizCompletedToday: activePlayActivity.type === 'daily_quiz' ? true : studentProgress.dailyQuizCompletedToday,
        totalQuizzesTaken: studentProgress.totalQuizzesTaken + 1,
        recentActivities: [newActivityLog, ...studentProgress.recentActivities.slice(0, 5)]
      };

      // Evaluate performance milestones and issue achievement badges (e.g. 10 consecutive daily quizzes, 100% score, etc.)
      const finalProgressWithBadges = handleIssueMilestoneBadges(
        updatedProgress,
        {
          type: activePlayActivity.type,
          score: finalScore,
          maxScore: activeQuestions.reduce((acc, q) => acc + q.points, 0) || 100,
          speedBonus: speedBonusesEarned
        },
        true
      );

      onUpdateProgress(finalProgressWithBadges);

      // Real-time Cloud Persistence to Supabase
      if (isSupabaseConfigured()) {
        setSupabaseSyncStatus({
          status: 'syncing',
          message: 'Saving attempt to Supabase activity_attempts table...'
        });

        syncActivityAttemptToSupabase(
          currentUser.id,
          activePlayActivity.id,
          finalScore,
          activeQuestions.length,
          addedXp,
          addedCoins
        ).then((res) => {
          if (res.success) {
            setSupabaseSyncStatus({
              status: 'success',
              message: 'Saved to Supabase database (table: activity_attempts)!'
            });
          } else {
            setSupabaseSyncStatus({
              status: 'error',
              message: res.error || 'Failed to sync. Please ensure tables are created in Supabase SQL editor.'
            });
          }
        });

        syncProgressToSupabase(finalProgressWithBadges);
      }
    }
  };

  // Launch on-the-fly Practice for a specific skill from the Skill Standards Browser (Category & Skill based)
  const handlePracticeSkill = (skillName: string, subjectName: string, categoryName?: string) => {
    // 1. Strictly match questions for this Category and Skill in the student's Grade and Curriculum
    const matchingQuestions = gradeLockedQuestions.filter((q) => {
      const matchesSkill = q.skill?.trim().toLowerCase() === skillName.trim().toLowerCase() ||
        (q.skillId && q.skillId.toLowerCase().includes(skillName.toLowerCase().replace(/\s+/g, '-')));
      const matchesCat = !categoryName || 
        q.category?.trim().toLowerCase() === categoryName.trim().toLowerCase() ||
        (q.categoryId && q.categoryId.toLowerCase().includes(categoryName.toLowerCase().replace(/\s+/g, '-')));
      const matchesSub = !subjectName || q.subject === subjectName;
      return matchesSub && matchesCat && matchesSkill;
    });

    if (matchingQuestions.length === 0) {
      alert(`No questions currently assigned for skill "${skillName}" in category "${categoryName || 'General'}" for ${studentGrade}. Please assign questions from the Master Question Bank.`);
      return;
    }

    const selectedQuestions = matchingQuestions.slice(0, 10);

    const practiceActivity: Activity = {
      id: `PRACTICE-${Date.now()}`,
      title: `${skillName} Questionnaire`,
      type: 'challenge',
      subject: (subjectName || 'Mathematics') as Subject,
      durationMinutes: 5,
      unlocked: true,
      description: `Targeted questionnaire on ${skillName} (${categoryName ? categoryName + ' • ' : ''}${studentGrade}). Includes ${selectedQuestions.length} questions from the Master Question Bank.`,
      questionIds: selectedQuestions.map(q => q.id),
      rewardXP: 100 + (selectedQuestions.length * 10),
      rewardCoins: 20 + (selectedQuestions.length * 2),
      grade: studentGrade
    };

    // Directly open standard Questionnaire Arena
    setActivePlayActivity(practiceActivity);
    setModernActivity(null);
    setCurrentQuestionIndex(0);
    const firstQ = questions.find((q) => q.id === practiceActivity.questionIds[0]);
    resetQuestionInteractions(firstQ);
    setIsAnswerSubmitted(false);
    setShowHint(false);
    setScore(0);
    setQuizFinished(false);
    setQuestionTimer(30);
    setQuestionElapsedTime(0);
    setSpeedBonusesEarned(0);
    setSupabaseSyncStatus({ status: 'idle' });
  };

  // Aggregated Skills from Master Question Bank & Grade-Locked Questions
  const skillHierarchy = useMemo(() => {
    const map = new Map<string, { subject: string; category: string; skill: string; questionsCount: number; sampleId: string; code?: string }>();
    
    // 1. Load Master Categories & Skills
    try {
      const masters = loadQuestionBankMasters();
      const normStudentGrade = normalizeGrade(studentGrade);
      const normStudentCurriculum = normalizeCurriculum(studentCurriculum);

      const relevantCategories = masters.categories.filter(c => {
        if (!c.active) return false;
        if (c.name.trim().toLowerCase() === 'preschool wonder world') return false;
        const normCurriculum = normalizeCurriculum(c.curriculumId);
        const normGrade = normalizeGrade(c.gradeId || '');
        const curriculumMatch = !normCurriculum || normCurriculum === 'universal' || normCurriculum === normStudentCurriculum;
        const gradeMatch = !normGrade || normGrade === normStudentGrade;
        return curriculumMatch && gradeMatch;
      });

      relevantCategories.forEach(cat => {
        const catSkills = masters.skills.filter(s => s.active && s.categoryId === cat.id && s.name.trim().toLowerCase() !== 'early discovery & play quest');
        catSkills.forEach(skl => {
          const key = `Mathematics:::${cat.name}:::${skl.name}`;
          const matchingQs = gradeLockedQuestions.filter(q => 
            (q.skillId && q.skillId === skl.id) ||
            (q.skill?.trim().toLowerCase() === skl.name.trim().toLowerCase() && q.category?.trim().toLowerCase() === cat.name.trim().toLowerCase())
          );
          map.set(key, {
            subject: 'Mathematics',
            category: cat.name,
            skill: skl.name,
            questionsCount: matchingQs.length,
            sampleId: matchingQs[0]?.id || skl.code,
            code: skl.code
          });
        });
      });

      // 2. Also incorporate questions that exist in memory/storage whose category & skill are active
      gradeLockedQuestions.forEach(q => {
        if (q.category?.trim().toLowerCase() === 'preschool wonder world' || q.skill?.trim().toLowerCase() === 'early discovery & play quest') return;
        const subject = q.subject || 'Mathematics';
        const category = q.category || 'General';
        const skill = q.skill || 'Core Practice';
        const key = `${subject}:::${category}:::${skill}`;

        // Check if category or skill was explicitly marked inactive in masters
        const matchingMasterCat = masters.categories.find(c => (q.categoryId && c.id === q.categoryId) || c.name.trim().toLowerCase() === category.toLowerCase());
        if (matchingMasterCat && !matchingMasterCat.active) return;

        const matchingMasterSkill = masters.skills.find(s => (q.skillId && s.id === q.skillId) || s.name.trim().toLowerCase() === skill.toLowerCase());
        if (matchingMasterSkill && !matchingMasterSkill.active) return;

        const count = gradeLockedQuestions.filter(x => 
          (x.subject || 'Mathematics') === subject && 
          (x.category || 'General')?.toLowerCase() === category.toLowerCase() && 
          (x.skill || 'Core Practice')?.toLowerCase() === skill.toLowerCase()
        ).length;

        const existing = map.get(key);
        if (existing) {
          existing.questionsCount = count;
        } else {
          map.set(key, {
            subject,
            category,
            skill,
            questionsCount: count,
            sampleId: q.id
          });
        }
      });
    } catch (e) {
      console.warn('Could not load question bank masters:', e);
    }

    let list = Array.from(map.values());
    if (selectedSkillSubject !== 'All') {
      list = list.filter(item => item.subject === selectedSkillSubject);
    }
    if (skillSearchQuery.trim()) {
      const q = skillSearchQuery.toLowerCase();
      list = list.filter(item => item.skill.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q));
    }
    return list;
  }, [gradeLockedQuestions, studentGrade, studentCurriculum, selectedSkillSubject, skillSearchQuery, masterDataVersion]);

  // Grouped by Category under Subject for Standard Skill View
  const categoryGroups = useMemo(() => {
    const catMap = new Map<string, {
      category: string;
      subject: string;
      totalQuestions: number;
      skills: {
        skill: string;
        subject: string;
        category: string;
        questionsCount: number;
        sampleId: string;
        code?: string;
      }[];
    }>();

    skillHierarchy.forEach(item => {
      const groupKey = `${item.subject}:::${item.category}`;
      if (!catMap.has(groupKey)) {
        catMap.set(groupKey, {
          category: item.category,
          subject: item.subject,
          totalQuestions: 0,
          skills: []
        });
      }
      const grp = catMap.get(groupKey)!;
      grp.totalQuestions += item.questionsCount;
      grp.skills.push(item);
    });

    return Array.from(catMap.values());
  }, [skillHierarchy]);

  const distinctSubjects = useMemo(() => {
    return Array.from(new Set(gradeLockedQuestions.map(q => q.subject)));
  }, [gradeLockedQuestions]);

  const distinctActivitySubjects = useMemo(() => {
    const list = Array.from(new Set(gradeLockedActivities.map(a => a.subject)));
    return list.length > 0 ? list : ['Mathematics'];
  }, [gradeLockedActivities]);

  return (
    <div className="space-y-4 pb-10">
      {/* Kid Welcome & Gamification Bar - Sleek, Compact & Professional */}
      <div className="bg-white border border-[#e1e6f1] rounded-2xl p-4 sm:p-5 shadow-2xs relative overflow-hidden">
        {/* Soft colorful backdrop accents */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-blue-50/50 pointer-events-none blur-2xl" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-32 h-32 rounded-full bg-[#eaf8f5]/60 pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Avatar & Student Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#eef4ff] border border-[#10246f]/15 p-1 shadow-2xs flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
                {studentProgress.avatar}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                  <Lock className="w-3 h-3 text-indigo-600" />
                  <span>{studentGrade}</span>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#eaf8f5] text-[#13b7ad] border border-[#a7f3d0] flex items-center gap-1 shadow-2xs">
                  <span>{studentCountry === 'India' ? '🇮🇳' : studentCountry === 'United Kingdom' ? '🇬🇧' : studentCountry === 'Canada' ? '🇨🇦' : studentCountry === 'Australia' ? '🇦🇺' : '🇺🇸'}</span>
                  <span>{studentState}</span>
                </span>
                <span className="text-[11px] font-mono bg-[#eef4ff] border border-[#d7def0] text-[#10246f] px-2 py-0.5 rounded-full font-bold">
                  ID: {studentProgress.studentUsername}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#10246f] mt-0.5 flex items-center gap-2">
                <span>{studentProgress.studentName}</span>
                <span className="text-lg">🌟</span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-[#59627a] font-medium">
                <span>
                  {studentProgress.schoolOrParent === 'school' 
                    ? (studentProgress.schoolName || currentUser.schoolName || 'School') 
                    : `Family of ${studentProgress.parentName || currentUser.parentName || 'Parent'}`}
                </span>
                <span className="text-[#13b7ad] font-semibold">· {studentCurriculum}</span>
                <button
                  type="button"
                  id="open-student-id-card-btn"
                  onClick={() => setIsIdCardOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10246f] hover:underline cursor-pointer ml-1"
                >
                  <Award className="w-3 h-3 text-[#10246f]" />
                  <span>ID Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gamification Stats - Compact Badges */}
          <div className="grid grid-cols-3 gap-2 bg-[#f8faff] border border-[#e1e6f1] p-2.5 rounded-2xl shadow-2xs">
            {/* Level Card */}
            <div className="text-center px-2.5 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
              <div className="flex items-center justify-center gap-1 text-indigo-700 text-[11px] font-bold">
                <Zap className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                <span>Level {studentProgress.level}</span>
              </div>
              <span className="block text-base sm:text-lg font-black text-[#10246f]">
                {studentProgress.xp} <span className="text-[10px] font-bold text-indigo-600">XP</span>
              </span>
            </div>

            {/* Streak Card */}
            <div className="text-center px-2.5 py-1.5 rounded-xl bg-[#FFF9E8] border border-[#ffbf32]/30">
              <div className="flex items-center justify-center gap-1 text-amber-700 text-[11px] font-bold">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Streak</span>
              </div>
              <span className="block text-base sm:text-lg font-black text-[#10246f]">
                {studentProgress.streakDays} <span className="text-[10px] font-bold text-amber-700">Days</span>
              </span>
            </div>

            {/* Coins Card */}
            <div className="text-center px-2.5 py-1.5 rounded-xl bg-[#EAFBF2] border border-[#16c47f]/30">
              <div className="flex items-center justify-center gap-1 text-[#16c47f] text-[11px] font-bold">
                <Coins className="w-3 h-3 fill-[#16c47f] text-[#16c47f]" />
                <span>Coins</span>
              </div>
              <span className="block text-base sm:text-lg font-black text-[#10246f] flex items-center justify-center gap-1">
                <span>🪙</span>
                <span>{studentProgress.coins}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-3 pt-3 border-t border-[#e1e6f1] flex items-center justify-between gap-3 text-xs font-semibold text-[#59627a]">
          <span className="font-bold text-[#10246f] text-[11px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
            <span>Level {studentProgress.level} Explorer</span>
          </span>
          <div className="flex-1 max-w-sm bg-[#eef4ff] border border-[#e1e6f1] h-2.5 rounded-full overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-[#16c47f] h-full rounded-full transition-all duration-500"
              style={{ width: `${(studentProgress.xp % 500) / 5}%` }}
            />
          </div>
          <span className="text-indigo-600 text-[11px] font-bold">{500 - (studentProgress.xp % 500)} XP to next level</span>
        </div>
      </div>

      {/* COMPACT DAILY GOAL NOTIFICATION (MINIMAL SPACE) */}
      <DailyGoalCard
        studentProgress={studentProgress}
        dailyQuizActivity={dailyQuizActivity}
        onStartDailyQuiz={handleStartDailyQuiz}
      />

      {/* PORTAL NAVIGATION TABS: 1. Skill Practice & Tests (First focus), 2. Interactive Activities, 3. Leaderboard, 4. Analytics */}
      <div className="flex items-center gap-2 border-b border-[#e1e6f1] pb-2 overflow-x-auto scrollbar-none">
        <button
          id="student-tab-skills-btn"
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'skills'
              ? 'bg-[#10246f] text-white shadow-xs'
              : 'text-[#59627a] hover:text-[#10246f] hover:bg-[#eef4ff]'
          }`}
        >
          <Compass className="w-4 h-4 text-sky-400" />
          <span>🧭 Skill Practice & Tests</span>
        </button>

        <button
          id="student-tab-tactile-btn"
          onClick={() => setActiveTab('tactile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'tactile'
              ? 'bg-[#10246f] text-white shadow-xs'
              : 'text-[#59627a] hover:text-[#10246f] hover:bg-[#eef4ff]'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <span>🎮 Interactive Activities</span>
        </button>

        <button
          id="student-tab-leaderboard-btn"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'bg-[#10246f] text-white shadow-xs'
              : 'text-[#59627a] hover:text-[#10246f] hover:bg-[#eef4ff]'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Leaderboard</span>
        </button>

        <button
          id="student-tab-analytics-btn"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#10246f] text-white shadow-xs'
              : 'text-[#59627a] hover:text-[#10246f] hover:bg-[#eef4ff]'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Learning Analytics</span>
        </button>
      </div>

      <ActivityPlayerModal
        activity={modernActivity}
        questions={questions}
        studentName={studentProgress.studentName}
        onClose={() => setModernActivity(null)}
        onComplete={(finalScore, maxScore) => {
          if (modernActivity) handleModernActivityComplete(modernActivity, finalScore, maxScore);
        }}
      />

      {/* ========================================================================= */}
      {/* ACTIVE FULL-SCREEN QUESTION & ANSWER ARENA */}
      {/* ========================================================================= */}
      {activePlayActivity && (
        <div className="fixed inset-0 z-[100] bg-[#f8faff] flex flex-col h-screen w-screen select-none overflow-hidden font-sans text-[#10246f] animate-in fade-in duration-150">
          
          {/* 1. TOP NAVIGATION HEADER */}
          <header className="h-16 px-4 sm:px-8 bg-white border-b border-[#e1e6f1] flex items-center justify-between shrink-0 shadow-xs z-20">
            {/* Left: Logo */}
            <div className="flex items-center gap-6 min-w-0">
              <div 
                onClick={() => setActivePlayActivity(null)}
                className="cursor-pointer flex items-center"
              >
                <PforPencilLogo size="sm" />
              </div>

              {/* Main Nav Links */}
              <nav className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePlayActivity(null)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-[#10246f] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Home
                </button>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                >
                  Practice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePlayActivity(null);
                    setActiveTab('tactile');
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-[#10246f] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Tactile Lab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePlayActivity(null);
                    setActiveTab('leaderboard');
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-[#10246f] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Leaderboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePlayActivity(null);
                    setActiveTab('analytics');
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-[#10246f] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Analytics & Rewards
                </button>
              </nav>
            </div>

            {/* Right: Coins + Student Profile Pill + Exit Button */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Coins Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
                <span>🟡</span>
                <span>{studentProgress.coins + score} Coins</span>
              </div>

              {/* Student Profile Pill */}
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white border border-[#e1e6f1] text-xs font-bold">
                <span className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-sm">
                  {studentProgress.avatar || '🎓'}
                </span>
                <span className="hidden sm:inline text-[#10246f]">{studentProgress.studentName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {studentGrade}
                </span>
              </div>

              {/* Exit Button */}
              <button
                type="button"
                onClick={() => setActivePlayActivity(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                title="Exit to Dashboard"
              >
                ✕
              </button>
            </div>
          </header>

          {/* 2. MAIN TWO-COLUMN QUESTION ARENA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl w-full mx-auto flex flex-col min-h-0">
            {!quizFinished && currentQ ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
                
                {/* LEFT MAIN STAGE (Question Area, 8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  
                  {/* Question Card Box */}
                  <div className="bg-white rounded-3xl border border-[#e1e6f1] p-6 sm:p-8 shadow-sm space-y-6">
                    
                    {/* Header Row: Question X of Y + Green Progress Bar + Timer */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span className="text-[#10246f] font-black">
                          Question {currentQuestionIndex + 1} of {activeQuestions.length}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700">
                            ⏱️ 00:{String(questionTimer).padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {/* Continuous Green Progress Bar */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + (isAnswerSubmitted ? 1 : 0)) / activeQuestions.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Skill / Topic Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <span>▲</span>
                        <span>{currentQ.category || 'Mathematics'}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <span>📶</span>
                        <span>{currentQ.difficulty || 'Medium'}</span>
                      </span>

                      {currentQ.skill && (
                        <span className="text-xs text-slate-600 font-medium px-2 py-0.5">
                          {currentQ.skill}
                        </span>
                      )}
                    </div>

                    {/* Question Prompt */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl sm:text-2xl font-black text-[#10246f] leading-snug">
                          {currentQ.prompt}
                        </h2>
                        <button
                          type="button"
                          onClick={() => handleReadAloud(currentQ.prompt)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-600 border border-slate-200 transition-colors cursor-pointer shrink-0"
                          title="Read Question Aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        Select the single correct option from the choices below.
                      </p>
                    </div>

                    {/* Media Image / Clipart if present */}
                    {currentQ.mediaUrl && (
                      <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <img 
                          src={currentQ.mediaUrl} 
                          alt="Question Illustration" 
                          className="max-h-40 rounded-xl object-contain"
                        />
                      </div>
                    )}

                    {/* Interactive Question Card Options */}
                    <div className="pt-2">
                      <InteractiveQuestionCard
                        question={currentQ}
                        isSubmitted={isAnswerSubmitted}
                        selectedOption={selectedOption}
                        onSelectOption={handleSelectOption}
                        openBoxInput={openBoxInput}
                        onChangeOpenBoxInput={setOpenBoxInput}
                        userDragPlacements={userDragPlacements}
                        onUpdateDragPlacements={setUserDragPlacements}
                        userMatchPairs={userMatchPairs}
                        onUpdateMatchPairs={setUserMatchPairs}
                        userOrderedList={userOrderedList}
                        onUpdateOrderedList={setUserOrderedList}
                        userBuckets={userBuckets}
                        onUpdateBuckets={setUserBuckets}
                        tappedObjectIds={tappedObjectIds}
                        onToggleTapObject={(id) => {
                          setTappedObjectIds((prev) =>
                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                          );
                        }}
                        onReadAloud={handleReadAloud}
                      />
                    </div>

                    {/* Feedback Banner */}
                    {isAnswerSubmitted && answerFeedback && (
                      <div className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-200 ${
                        answerFeedback.status === 'correct' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                          : 'bg-rose-50 border-rose-200 text-rose-950'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              answerFeedback.status === 'correct' ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'
                            }`}>
                              {answerFeedback.status === 'correct' ? '✓' : '✕'}
                            </span>
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold text-[#10246f]">
                                {answerFeedback.status === 'correct' ? 'Correct!' : 'Incorrect'}
                              </h4>
                              <p className="text-xs text-slate-600">
                                {currentQ.explanation || answerFeedback.message}
                              </p>
                            </div>
                          </div>

                          {answerFeedback.status === 'correct' && (
                            <span className="px-3 py-1 rounded-full bg-amber-400 text-[#10246f] font-black text-xs shrink-0 shadow-2xs">
                              +10 Coins 🪙
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#e1e6f1]">
                      <button
                        type="button"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => {
                          if (currentQuestionIndex > 0) {
                            const prevIdx = currentQuestionIndex - 1;
                            setCurrentQuestionIndex(prevIdx);
                            resetQuestionInteractions(activeQuestions[prevIdx]);
                            setIsAnswerSubmitted(false);
                            setAnswerFeedback(null);
                          }
                        }}
                        className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      {!isAnswerSubmitted ? (
                        <button
                          type="button"
                          id="submit-answer-btn"
                          disabled={!canSubmitAnswer}
                          onClick={handleSubmitAnswer}
                          className="px-7 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm shadow-sm transition-all transform hover:scale-102 cursor-pointer flex items-center gap-2"
                        >
                          <span>Check Answer</span>
                          <Sparkles className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="next-question-btn"
                          onClick={handleNextQuestion}
                          className="px-7 py-2.5 rounded-full bg-amber-400 hover:bg-amber-500 text-[#10246f] font-black text-xs sm:text-sm shadow-sm transition-all transform hover:scale-102 cursor-pointer flex items-center gap-2"
                        >
                          <span>{currentQuestionIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Results'}</span>
                          <ArrowRight className="w-4 h-4 text-[#10246f]" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* RIGHT SIDEBAR (Progress, Rewards, Tools, Math Tip, 4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* Your Progress Card */}
                  <div className="bg-white rounded-3xl border border-[#e1e6f1] p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Your Progress
                    </h3>
                    
                    <div className="flex items-center gap-4">
                      {/* Circular Progress Ring */}
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-emerald-500"
                            strokeDasharray={`${Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-xs font-black text-[#10246f]">
                          {Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)}%
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-sm font-black text-[#10246f] block">
                          {currentQuestionIndex + 1}/{activeQuestions.length} Questions
                        </span>
                        <span className="text-xs text-slate-500 block">
                          Keep going! You're making great headway.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Your Rewards Card */}
                  <div className="bg-white rounded-3xl border border-[#e1e6f1] p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Your Rewards
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                        <span className="text-base block">🟡</span>
                        <span className="text-xs font-black text-[#10246f] block">{studentProgress.coins + score}</span>
                        <span className="text-[10px] text-slate-500">Coins</span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200">
                        <span className="text-base block">🔥</span>
                        <span className="text-xs font-black text-[#10246f] block">{studentProgress.streakDays || 7}</span>
                        <span className="text-[10px] text-slate-500">Day Streak</span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200">
                        <span className="text-base block">⭐</span>
                        <span className="text-xs font-black text-[#10246f] block">{studentProgress.badges?.length || 3}</span>
                        <span className="text-[10px] text-slate-500">Badges</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Learning Tools */}
                  <div className="bg-white rounded-3xl border border-[#e1e6f1] p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Tools
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button"
                        onClick={() => alert('Calculator: Basic calculation tool available during practice.')}
                        className="p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-center transition-colors cursor-pointer"
                      >
                        <span className="text-base block">🧮</span>
                        <span className="text-[11px] font-bold text-[#10246f] block">Calculator</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => alert('Ruler: Measurement scale available.')}
                        className="p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-center transition-colors cursor-pointer"
                      >
                        <span className="text-base block">📏</span>
                        <span className="text-[11px] font-bold text-[#10246f] block">Ruler</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => alert('Scratch Pad: Draw or jot notes.')}
                        className="p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 text-center transition-colors cursor-pointer"
                      >
                        <span className="text-base block">📝</span>
                        <span className="text-[11px] font-bold text-[#10246f] block">Scratch Pad</span>
                      </button>
                    </div>
                  </div>

                  {/* Math Tip Card (Soft Yellow BG) */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                      <span>💡</span>
                      <span>Math Tip</span>
                    </div>
                    <p className="text-amber-950 leading-relaxed">
                      Look closely at the units of measurement before calculating. Converting to the same unit first makes solving much simpler!
                    </p>
                  </div>

                </div>

              </div>
            ) : (
              /* 3. ACTIVITY RESULTS SUMMARY (ELEGANT CARD) */
              <div className="bg-white rounded-3xl border border-[#e1e6f1] p-8 shadow-xl text-center space-y-5 max-w-lg mx-auto w-full my-auto animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl shadow-xs mx-auto border border-amber-200">
                  🏆
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Activity Completed!
                  </span>
                  <h3 className="text-2xl font-black text-[#10246f] mt-2">
                    Fantastic Job, {studentProgress.studentName}!
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1">
                    You earned <strong className="text-blue-600">+{activePlayActivity.rewardXP + (speedBonusesEarned * 10)} XP</strong> and <strong className="text-amber-600">+{activePlayActivity.rewardCoins} 🪙 Coins</strong>!
                  </p>
                </div>

                {/* Summary Metric Badges */}
                <div className="grid grid-cols-3 gap-2.5 w-full text-xs sm:text-sm">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <span className="text-slate-500 font-semibold block text-[11px]">Total Score</span>
                    <strong className="text-base sm:text-lg font-black text-[#10246f]">{score} Pts</strong>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                    <span className="text-slate-500 font-semibold block text-[11px]">Streak</span>
                    <strong className="text-base sm:text-lg font-black text-amber-600">{studentProgress.streakDays} Days 🔥</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <span className="text-slate-500 font-semibold block text-[11px]">Speed Bonus</span>
                    <strong className="text-base sm:text-lg font-black text-emerald-600">+{speedBonusesEarned * 10} XP ⚡</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePlayActivity(null)}
                  className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer mt-2"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: INTERACTIVE ACTIVITIES (STANDALONE HANDS-ON INTERACTIVE GAMES) */}
      {/* ========================================================================= */}
      {activeTab === 'tactile' && (
        <div className="space-y-4">
          <TactileActivityLab isModal={false} studentGrade={studentGrade} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: LEADERBOARD (STAR SCHOLARS XP RANKINGS & FRIENDLY COMPETITION) */}
      {/* ========================================================================= */}
      {activeTab === 'leaderboard' && (
        <Leaderboard
          studentProgressMap={studentProgressMap}
          currentStudentId={studentProgress.studentId}
          gradeFilter="all"
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SKILL PRACTICE & TESTS (CATEGORY & SKILL HIERARCHY - PRIMARY FOCUS) */}
      {/* ========================================================================= */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-sky-600" />
                  <span>Curriculum Skill Standards Explorer</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Organized by <strong>Category & Learning Skills</strong> for <strong>{studentGrade}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-700" />
                  <span>{studentGrade} Standards</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-mono">
                  {categoryGroups.length} Categories • {skillHierarchy.length} Skills
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search categories (e.g. Numbers, Geometry, Operations) or skills (e.g. Counting up to 5)..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-stone-50/50"
                />
              </div>
              {skillSearchQuery && (
                <button
                  onClick={() => setSkillSearchQuery('')}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          {/* Category-Grouped Skill Sections */}
          {categoryGroups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 text-xl flex items-center justify-center mx-auto">
                📂
              </div>
              <h4 className="text-sm font-bold text-stone-800">No categories or skills found</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No learning standards matched your search query "{skillSearchQuery}".
              </p>
              <button
                onClick={() => setSkillSearchQuery('')}
                className="px-3.5 py-1.5 bg-[#10246f] hover:bg-[#0c1a52] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryGroups.map((group, groupIdx) => {
                const subjectMastery = studentProgress.subjectMastery[group.subject as Subject] || 82;
                return (
                  <div 
                    key={groupIdx} 
                    className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden"
                  >
                    {/* Category Header Banner */}
                    <div className="bg-gradient-to-r from-stone-50 via-indigo-50/20 to-stone-50 p-3.5 sm:p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center justify-center text-sm shrink-0">
                          📂
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-900 border border-indigo-200">
                            Category
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-stone-900 mt-0.5">
                            {group.category}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs">
                          {group.skills.length} {group.skills.length === 1 ? 'Skill' : 'Skills'}
                        </span>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 shadow-2xs">
                          {group.totalQuestions} Questions Available
                        </span>
                      </div>
                    </div>

                    {/* Skills Grid inside this Category */}
                    <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.skills.map((item, skillIdx) => {
                        const mastery = subjectMastery;
                        return (
                          <div
                            key={skillIdx}
                            className="bg-stone-50/60 rounded-xl border border-stone-200 p-3.5 flex flex-col justify-between hover:border-indigo-400 hover:bg-white transition group shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-600">
                                  🎯 Skill Standard
                                </span>
                                <span className="text-[11px] font-mono font-bold text-stone-500">
                                  {item.questionsCount} Qs
                                </span>
                              </div>

                              <h5 className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-blue-600 transition leading-snug mb-2">
                                {item.skill}
                              </h5>

                              {/* Mastery Level Bar */}
                              <div className="space-y-1 mb-3">
                                <div className="flex items-center justify-between text-[10px] font-bold text-stone-600">
                                  <span>Mastery Progress</span>
                                  <span>{mastery}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      mastery >= 90 ? 'bg-emerald-500' : mastery >= 75 ? 'bg-blue-600' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${mastery}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handlePracticeSkill(item.skill, item.subject, item.category)}
                              disabled={item.questionsCount === 0}
                              className={`w-full py-2 px-3 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                                item.questionsCount > 0
                                  ? 'bg-[#10246f] hover:bg-[#0c1a52] text-white hover:scale-[1.01] active:scale-[0.99]'
                                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              }`}
                              title={item.questionsCount > 0 ? `Start standard questionnaire for ${item.skill}` : 'No questions currently assigned'}
                            >
                              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                              <span>{item.questionsCount > 0 ? `Start Practice (${item.questionsCount} Qs)` : 'No Questions'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LEARNING ANALYTICS DASHBOARDS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <StudentAnalyticsDashboard
          studentProgress={studentProgress}
          activities={activities}
          questions={gradeLockedQuestions}
          currentUser={currentUser}
          onOpenReportCard={() => setIsReportCardOpen(true)}
          onStartPracticeSkill={handleStartPracticeSkill}
          onStartActivity={handleStartActivity}
        />
      )}

      {/* Student ID Card Modal */}
      <StudentIDCard
        isOpen={isIdCardOpen}
        onClose={() => setIsIdCardOpen(false)}
        student={studentProgress}
        schoolName={studentProgress.schoolName || currentUser.schoolName}
        parentName={studentProgress.parentName || currentUser.parentName}
      />

      {/* Official Student Report Card Modal */}
      {isReportCardOpen && (
        <StudentReportCardModal
          student={studentProgress}
          userAccount={currentUser}
          onClose={() => setIsReportCardOpen(false)}
          viewerRole="student"
          schoolName={studentProgress.schoolName || currentUser.schoolName}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: ACHIEVEMENT MILESTONES UNLOCKED CELEBRATION */}
      {/* ========================================================================= */}
      {newlyUnlockedBadges && newlyUnlockedBadges.length > 0 && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setNewlyUnlockedBadges(null)}
        >
          <div
            className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inline-flex p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-md animate-bounce">
              <span className="text-5xl">{newlyUnlockedBadges[0]?.icon || '🏆'}</span>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-[11px] uppercase tracking-wider">
                🎉 Performance Milestone Achieved!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                {newlyUnlockedBadges.length === 1
                  ? newlyUnlockedBadges[0].name
                  : `${newlyUnlockedBadges.length} New Badges Unlocked!`}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {newlyUnlockedBadges[0]?.description}
              </p>
            </div>

            {newlyUnlockedBadges.length > 1 && (
              <div className="grid grid-cols-2 gap-2 text-left pt-1">
                {newlyUnlockedBadges.map((b) => (
                  <div key={b.id} className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center gap-2">
                    <span className="text-2xl">{b.icon}</span>
                    <div className="min-w-0">
                      <span className="block font-bold text-xs text-stone-900 truncate">{b.name}</span>
                      <span className="block text-[10px] text-amber-700 truncate">Unlocked today</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Badge recorded in your student profile and report card!</span>
            </div>

            <button
              type="button"
              onClick={() => setNewlyUnlockedBadges(null)}
              className="w-full py-3 px-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Claim & Continue Learning! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BADGE DETAIL INSPECTOR */}
      {/* ========================================================================= */}
      {selectedBadgeDetail && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setSelectedBadgeDetail(null)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBadgeDetail(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-3xl mx-auto shadow-xs">
              {selectedBadgeDetail.icon}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Achievement Badge
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-2">
                {selectedBadgeDetail.name}
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                {selectedBadgeDetail.description}
              </p>
            </div>

            {selectedBadgeDetail.unlockedAt && (
              <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Unlocked on <strong>{selectedBadgeDetail.unlockedAt}</strong></span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedBadgeDetail(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALL PERFORMANCE MILESTONES & BADGE ROADMAP */}
      {/* ========================================================================= */}
      {showAllMilestonesModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto overscroll-contain modal-scroll-container"
          onClick={() => setShowAllMilestonesModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">Achievement Milestones Roadmap</h3>
                  <p className="text-xs text-stone-500">Track and unlock badges for performance milestones</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllMilestonesModal(false)}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Progress Card */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Student Quest Progress</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-stone-900">
                    {PERFORMANCE_MILESTONES.filter(m => studentProgress.badges?.some(b => b.id === m.id || b.name.toLowerCase().trim() === m.name.toLowerCase().trim())).length} of {PERFORMANCE_MILESTONES.length}
                  </span>
                  <span className="text-xs text-stone-600 font-medium">Milestones Unlocked</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleIssueMilestoneBadges(studentProgress, undefined, true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs cursor-pointer self-start sm:self-auto"
              >
                Check & Claim Milestones 🎯
              </button>
            </div>

            {/* Milestone List */}
            <div className="space-y-3">
              {PERFORMANCE_MILESTONES.map((milestone) => {
                const unlockedBadge = (studentProgress.badges || []).find(
                  b => b.id === milestone.id || b.name.toLowerCase().trim() === milestone.name.toLowerCase().trim()
                );
                const isUnlocked = Boolean(unlockedBadge);
                const progressInfo = milestone.getProgress(studentProgress);
                const percent = Math.min(100, Math.round((progressInfo.current / Math.max(1, progressInfo.target)) * 100));

                return (
                  <div
                    key={milestone.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isUnlocked
                        ? 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
                        : 'bg-white border-stone-200 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-3xl shrink-0 p-1.5 rounded-xl bg-white border border-stone-200/60 shadow-2xs">
                          {milestone.icon}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-stone-900">
                              {milestone.name}
                            </h4>
                            {isUnlocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" />
                                Unlocked {unlockedBadge?.unlockedAt ? `(${unlockedBadge.unlockedAt})` : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {milestone.description}
                          </p>
                          <div className="text-[11px] text-stone-500 font-medium pt-0.5">
                            Target: <span className="text-stone-700 font-semibold">{milestone.criterion}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar for Locked or Ongoing Milestones */}
                    {!isUnlocked && (
                      <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
                        <div className="flex justify-between text-[11px] text-stone-500">
                          <span>Current: {progressInfo.label}</span>
                          <span className="font-bold text-amber-700">{percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllMilestonesModal(false)}
                className="py-2.5 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
