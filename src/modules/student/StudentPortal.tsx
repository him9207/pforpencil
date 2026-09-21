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
  Gamepad2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/audio';
import StudentIDCard from './StudentIDCard';
import ActivityPlayerModal from '../activities/ActivityPlayerModal';
import InteractiveQuestionCard from '../activities/InteractiveQuestionCard';
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

interface StudentPortalProps {
  currentUser: UserAccount;
  studentProgress: StudentProgress;
  questions: Question[];
  activities: Activity[];
  onUpdateProgress: (updated: StudentProgress) => void;
}

export default function StudentPortal({
  currentUser,
  studentProgress,
  questions,
  activities,
  onUpdateProgress
}: StudentPortalProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'adventures' | 'skills' | 'analytics'>('adventures');

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
      ...studentProgress, xp: updatedXp, level: updatedLevel, coins: studentProgress.coins + addedCoins,
      totalQuizzesTaken: studentProgress.totalQuizzesTaken + 1,
      recentActivities: [log, ...studentProgress.recentActivities.slice(0, 5)]
    };
    onUpdateProgress(updatedProgress);
    if (isSupabaseConfigured()) {
      syncActivityAttemptToSupabase(currentUser.id, activity.id, finalScore, Math.max(1, activity.questionIds.length), addedXp, addedCoins, false);
      syncProgressToSupabase(updatedProgress);
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

      onUpdateProgress(updatedProgress);

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

        syncProgressToSupabase(updatedProgress);
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
    <div className="space-y-8 pb-12">
      {/* Kid Welcome & Gamification Bar - Vibrant, Colorful & High-Contrast Student Profile */}
      <div className="bg-white border-2 border-[#e1e6f1] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Soft colorful backdrop accents */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-[#fdf2f8] pointer-events-none blur-2xl" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full bg-[#eaf8f5] pointer-events-none blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & Student Name */}
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-[#eef4ff] border-2 border-[#10246f]/15 p-1 shadow-xs flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-4xl sm:text-5xl shadow-inner">
                {studentProgress.avatar}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-[#fdf2f8] text-[#f20b86] border border-[#fbcfe8] uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <Lock className="w-3 h-3 text-[#f20b86]" />
                  <span>{studentGrade}</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eaf8f5] text-[#13b7ad] border border-[#a7f3d0] flex items-center gap-1 shadow-2xs">
                  <span>{studentCountry === 'India' ? '🇮🇳' : studentCountry === 'United Kingdom' ? '🇬🇧' : studentCountry === 'Canada' ? '🇨🇦' : studentCountry === 'Australia' ? '🇦🇺' : '🇺🇸'}</span>
                  <span>{studentState}</span>
                </span>
                <span className="text-xs font-mono bg-[#eef4ff] border border-[#d7def0] text-[#10246f] px-2.5 py-0.5 rounded-full font-bold">
                  ID: {studentProgress.studentUsername}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#10246f] mt-1 flex items-center gap-2">
                <span>Student: {studentProgress.studentName}</span>
                <span>🌟</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#59627a] font-medium">
                {studentProgress.schoolOrParent === 'school' 
                  ? (studentProgress.schoolName || currentUser.schoolName || 'School Organization') 
                  : `Family Student of ${studentProgress.parentName || currentUser.parentName || 'Parent'}`}
                <span className="text-[#13b7ad] font-semibold ml-1.5">• {studentCurriculum}</span>
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  id="open-student-id-card-btn"
                  onClick={() => setIsIdCardOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white text-xs font-bold transition cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Award className="w-3.5 h-3.5 text-white" />
                  <span>🪪 My Student ID Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gamification Stats - Colorful Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 bg-[#f8faff] border border-[#e1e6f1] p-3 sm:p-4 rounded-3xl shadow-xs">
            {/* Level Card */}
            <div className="text-center px-3 py-2 rounded-2xl bg-[#FCE8F3] border border-[#fbcfe8]">
              <div className="flex items-center justify-center gap-1 text-[#f20b86] text-xs font-bold">
                <Zap className="w-3.5 h-3.5 fill-[#f20b86] text-[#f20b86]" />
                <span>Level {studentProgress.level}</span>
              </div>
              <span className="block text-xl sm:text-2xl font-black text-[#10246f] mt-0.5">
                {studentProgress.xp} <span className="text-[11px] font-bold text-[#f20b86]">XP</span>
              </span>
            </div>

            {/* Streak Card */}
            <div className="text-center px-3 py-2 rounded-2xl bg-[#FFF9E8] border border-[#ffbf32]/30">
              <div className="flex items-center justify-center gap-1 text-amber-700 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Streak</span>
              </div>
              <span className="block text-xl sm:text-2xl font-black text-[#10246f] mt-0.5">
                {studentProgress.streakDays} <span className="text-[11px] font-bold text-amber-700">Days</span>
              </span>
            </div>

            {/* Coins Card */}
            <div className="text-center px-3 py-2 rounded-2xl bg-[#EAFBF2] border border-[#16c47f]/30">
              <div className="flex items-center justify-center gap-1 text-[#16c47f] text-xs font-bold">
                <Coins className="w-3.5 h-3.5 fill-[#16c47f] text-[#16c47f]" />
                <span>Coins</span>
              </div>
              <span className="block text-xl sm:text-2xl font-black text-[#10246f] mt-0.5 flex items-center justify-center gap-1">
                <span>🪙</span>
                <span>{studentProgress.coins}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar with colorful styling */}
        <div className="mt-5 pt-4 border-t border-[#e1e6f1] flex items-center justify-between gap-4 text-xs font-semibold text-[#59627a]">
          <span className="font-bold text-[#10246f] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f20b86] animate-ping" />
            <span>Level {studentProgress.level} Explorer</span>
          </span>
          <div className="flex-1 max-w-md bg-[#eef4ff] border border-[#e1e6f1] h-3 rounded-full overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-[#f20b86] via-[#168bea] to-[#16c47f] h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${(studentProgress.xp % 500) / 5}%` }}
            />
          </div>
          <span className="text-[#f20b86] font-bold">{500 - (studentProgress.xp % 500)} XP to Level {studentProgress.level + 1}</span>
        </div>
      </div>

      {/* PORTAL NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#e1e6f1] pb-3">
        <button
          onClick={() => setActiveTab('adventures')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'adventures'
              ? 'bg-[#f20b86] text-white shadow-xs'
              : 'text-[#59627a] hover:text-[#10246f] hover:bg-[#eef4ff]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Adventures & Quizzes</span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'skills'
              ? 'bg-[#f20b86] text-white shadow-xs'
              : 'text-[#59627a] hover:text-[#10246f] hover:bg-[#eef4ff]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Skill Standards Browser</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#f20b86] text-white shadow-xs'
              : 'text-[#59627a] hover:text-[#10246f] hover:bg-[#eef4ff]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
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
      {/* ACTIVE FULL-SCREEN QUESTION & ANSWER ARENA (ZERO TEXT OVERLAP, 100% OPAQUE & ERGONOMIC) */}
      {/* ========================================================================= */}
      {activePlayActivity && (
        <div className="fixed inset-0 z-[100] bg-[#f8faff] flex flex-col h-screen w-screen select-none overflow-hidden font-sans text-[#10246f] animate-in fade-in duration-150">
          
          {/* 1. TOP NAVIGATION HEADER */}
          <header className="h-14 sm:h-16 px-4 sm:px-8 bg-white border-b border-[#e1e6f1] flex items-center justify-between shrink-0 shadow-2xs">
            {/* Left: Logo + Activity Title */}
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src="/assets/pforpencil-logo.png" 
                alt="P for Pencil" 
                className="h-7 sm:h-8 w-auto object-contain shrink-0"
                onError={(e) => { e.currentTarget.src = '/assets/pforpencil-logo.svg'; }}
              />
              <div className="hidden sm:block border-l border-[#e1e6f1] pl-3 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#59627a] block">
                  {studentGrade} • {activePlayActivity.type === 'boss_battle' ? 'Boss Battle' : 'Practice Drill'}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[#10246f] truncate max-w-xs md:max-w-md">
                  {activePlayActivity.title}
                </h3>
              </div>
            </div>

            {/* Center: Question Indicator */}
            {!quizFinished && activeQuestions.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#fdf2f8] text-[#f20b86] border border-[#fbcfe8] text-xs sm:text-sm font-bold shadow-2xs">
                <span>Question</span>
                <span className="font-black">{currentQuestionIndex + 1}</span>
                <span className="text-[#f20b86]/70">of</span>
                <span className="font-black">{activeQuestions.length}</span>
              </div>
            )}

            {/* Right: Timer / XP / Exit Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Live Question Countdown Timer */}
              {!quizFinished && (
                <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold border transition-colors ${
                  questionTimer <= 5 
                    ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse' 
                    : questionTimer <= 10 
                    ? 'bg-amber-50 text-amber-700 border-amber-300' 
                    : 'bg-[#eaf8f5] text-[#13b7ad] border-[#13b7ad]/30'
                }`}>
                  <Timer className="w-3.5 h-3.5" />
                  <span className="font-mono">{questionTimer}s</span>
                </div>
              )}

              {/* Score / XP Earned Counter */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4ff] border border-[#d7def0] text-[#10246f] text-xs font-bold">
                <span>🪙</span>
                <span>{score} Pts</span>
              </div>

              {/* Exit Button */}
              <button
                type="button"
                onClick={() => setActivePlayActivity(null)}
                className="w-8 h-8 rounded-full bg-[#f8faff] hover:bg-[#fff1f2] border border-[#e1e6f1] text-[#59627a] hover:text-[#f43f5e] flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                title="Exit Activity"
              >
                ✕
              </button>
            </div>
          </header>

          {/* Progress Bar under header */}
          {!quizFinished && activeQuestions.length > 0 && (
            <div className="w-full bg-[#eef4ff] h-1.5 shrink-0 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#f20b86] via-[#168bea] to-[#16c47f] h-full transition-all duration-300 shadow-xs"
                style={{ width: `${((currentQuestionIndex + (isAnswerSubmitted ? 1 : 0)) / activeQuestions.length) * 100}%` }}
              />
            </div>
          )}

          {/* Boss Battle Health HUD (if applicable) */}
          {activePlayActivity.type === 'boss_battle' && !quizFinished && (
            <div className="bg-white text-[#10246f] px-4 sm:px-8 py-2 border-b border-[#e1e6f1] shrink-0">
              <div className="max-w-3xl mx-auto grid grid-cols-2 gap-4 sm:gap-8">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-rose-600">{activePlayActivity.bossName || 'Boss'} {activePlayActivity.bossAvatar || '👾'}</span>
                    <span className="font-mono">{bossHp}/100 HP</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${bossHp}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#16c47f]">You ({studentProgress.studentName}) {studentProgress.avatar}</span>
                    <span className="font-mono">{playerHp}/100 HP</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isBossAttacking ? 'bg-amber-400 animate-pulse' : 'bg-[#16c47f]'}`}
                      style={{ width: `${playerHp}%` }}
                    />
                  </div>
                </div>
              </div>

              {battleMessage && (
                <div className="mt-1 text-center text-xs font-mono text-[#10246f] bg-[#f8faff] py-0.5 px-3 rounded-xl max-w-md mx-auto border border-[#e1e6f1]">
                  {battleMessage}
                </div>
              )}
            </div>
          )}

          {/* 2. CENTRAL SINGLE-SCREEN QUESTION ARENA (FIT ENTIRELY WITHOUT SCROLLING ON STANDARD SCREENS) */}
          <main className="flex-1 overflow-y-auto lg:overflow-hidden bg-[#f8faff] px-3 sm:px-6 py-2.5 sm:py-4 flex flex-col justify-between items-center max-w-4xl w-full mx-auto min-h-0">
            {!quizFinished ? (
              currentQ ? (
                <div className="w-full h-full flex flex-col justify-between gap-2.5 sm:gap-3.5 animate-in fade-in duration-200">
                  
                  {/* Top Bar inside question: Skill Pill + Points + Hint Button */}
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-bold text-[#10246f] bg-white px-3 py-1 rounded-full border border-[#e1e6f1] shadow-2xs">
                        {currentQ.category} • {currentQ.skill}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentQ.hint && !isAnswerSubmitted && (
                        <button
                          type="button"
                          onClick={() => setShowHint(!showHint)}
                          className="text-xs font-bold text-[#13b7ad] hover:text-[#0f928a] inline-flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1 rounded-full border border-[#e1e6f1] hover:bg-[#eaf8f5] transition-colors"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#13b7ad]" />
                          <span>{showHint ? 'Hide Hint' : 'Hint 💡'}</span>
                        </button>
                      )}

                      <span className="text-xs font-bold text-[#16c47f] bg-[#ecfdf5] px-3 py-1 rounded-full border border-[#a7f3d0]">
                        +{currentQ.points} XP
                      </span>
                    </div>
                  </div>

                  {/* Teacher Hint Dropdown */}
                  {showHint && currentQ.hint && !isAnswerSubmitted && (
                    <div className="p-2.5 sm:p-3 bg-[#fffbeb] border border-[#fde68a] rounded-2xl text-xs text-amber-950 font-medium shrink-0 animate-in fade-in">
                      💡 <strong>Teacher Hint:</strong> {currentQ.hint}
                    </div>
                  )}

                  {/* Question Prompt Card */}
                  <div className="bg-white rounded-2xl border-2 border-[#e1e6f1] p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3 shrink-0">
                    <h4 className="text-base sm:text-lg md:text-xl font-bold text-[#10246f] leading-snug tracking-tight flex-1">
                      {currentQ.prompt}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleReadAloud(currentQ.prompt)}
                      className="px-3.5 py-1.5 rounded-full bg-[#fdf2f8] hover:bg-[#fce7f3] text-[#f20b86] border border-[#fbcfe8] font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs transition-all hover:scale-105 active:scale-95"
                      title="Read question aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#f20b86]" />
                      <span>Listen 🔊</span>
                    </button>
                  </div>

                  {/* Media / Video Stage (if present) */}
                  {currentQ.mediaUrl && (
                    <div className="flex justify-center shrink-0">
                      {currentQ.mediaUrl.match(/\.(mp4|webm)$/i) ? (
                        <video 
                          src={currentQ.mediaUrl} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="max-h-24 sm:max-h-32 rounded-xl shadow-xs border border-[#e1e6f1] bg-white object-contain"
                        />
                      ) : (
                        <img 
                          src={currentQ.mediaUrl} 
                          alt="Question Illustration" 
                          className="max-h-24 sm:max-h-32 rounded-xl shadow-xs border border-[#e1e6f1] bg-white object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Interactive Question Card (Options) */}
                  <div className="w-full flex-1 flex flex-col justify-center min-h-0">
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

                  {/* Instant Feedback Banner upon submission */}
                  {isAnswerSubmitted && answerFeedback && (
                    <div className={`p-3 rounded-2xl border-2 flex items-center justify-between gap-3 shadow-xs shrink-0 animate-in fade-in duration-200 ${
                      answerFeedback.status === 'correct' 
                        ? 'bg-[#ecfdf5] border-[#16c47f] text-[#065f46]' 
                        : 'bg-[#fff1f2] border-[#f43f5e] text-[#9f1239]'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white ${
                          answerFeedback.status === 'correct' ? 'bg-[#16c47f]' : 'bg-[#f43f5e]'
                        }`}>
                          {answerFeedback.status === 'correct' ? '✓' : '✕'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm block">
                            {answerFeedback.title}
                          </span>
                          <span className="text-[11px] sm:text-xs opacity-90 block">
                            {answerFeedback.message}
                          </span>
                        </div>
                      </div>

                      {currentQ.explanation && (
                        <div className="hidden sm:block text-[11px] bg-white/95 px-3 py-1.5 rounded-xl border border-black/5 font-medium text-[#10246f] max-w-xs">
                          📖 {currentQ.explanation}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 text-[#59627a] font-bold text-base">
                  No questions found for this activity.
                </div>
              )
            ) : (
              /* 3. ACTIVITY RESULTS SUMMARY (ELEGANT FULL-SCREEN CARD) */
              <div className="bg-white rounded-3xl border-2 border-[#e1e6f1] p-6 sm:p-8 shadow-xl text-center space-y-4 max-w-lg mx-auto w-full my-auto animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#fdf2f8] text-[#f20b86] flex items-center justify-center text-3xl sm:text-4xl shadow-xs mx-auto border border-[#fbcfe8]">
                  🏆
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f20b86] bg-[#fdf2f8] px-3 py-1 rounded-full border border-[#fbcfe8]">
                    Activity Completed!
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#10246f] mt-2">
                    Fantastic Job, {studentProgress.studentName}!
                  </h3>
                  <p className="text-[#59627a] text-xs sm:text-sm mt-1">
                    You earned <strong className="text-[#f20b86]">+{activePlayActivity.rewardXP + (speedBonusesEarned * 10)} XP</strong> and <strong className="text-[#ffbf32]">+{activePlayActivity.rewardCoins} 🪙 Coins</strong>!
                  </p>
                </div>

                {/* Summary Metric Badges */}
                <div className="grid grid-cols-3 gap-2.5 w-full text-xs sm:text-sm">
                  <div className="p-2.5 bg-[#f8faff] border border-[#e1e6f1] rounded-2xl text-center">
                    <span className="text-[#59627a] font-semibold block text-[11px]">Total Score</span>
                    <strong className="text-base sm:text-lg font-black text-[#10246f]">{score} Pts</strong>
                  </div>
                  <div className="p-2.5 bg-[#FFF9E8] border border-[#ffbf32]/30 rounded-2xl text-center">
                    <span className="text-[#59627a] font-semibold block text-[11px]">Streak</span>
                    <strong className="text-base sm:text-lg font-black text-amber-600">{studentProgress.streakDays} Days 🔥</strong>
                  </div>
                  <div className="p-2.5 bg-[#EAFBF2] border border-[#16c47f]/30 rounded-2xl text-center">
                    <span className="text-[#59627a] font-semibold block text-[11px]">Speed Bonus</span>
                    <strong className="text-base sm:text-lg font-black text-[#16c47f]">+{speedBonusesEarned * 10} XP ⚡</strong>
                  </div>
                </div>

                {/* Supabase Cloud Persistence Status */}
                {isSupabaseConfigured() ? (
                  <div className={`p-3 rounded-2xl border text-xs w-full flex items-center justify-between gap-2 text-left transition shadow-2xs ${
                    supabaseSyncStatus.status === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : supabaseSyncStatus.status === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-stone-100 border-stone-300 text-stone-900 animate-pulse'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                        supabaseSyncStatus.status === 'success'
                          ? 'bg-emerald-600 text-white'
                          : supabaseSyncStatus.status === 'error'
                          ? 'bg-rose-600 text-white'
                          : 'bg-stone-900 text-white'
                      }`}>
                        {supabaseSyncStatus.status === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : supabaseSyncStatus.status === 'error' ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3 h-3 animate-spin" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold block truncate">Supabase Cloud Database</span>
                        <span className="text-[10px] opacity-80 block truncate">
                          {supabaseSyncStatus.message || (supabaseSyncStatus.status === 'syncing' ? 'Syncing attempt...' : 'Synced')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/80 border border-black/10 shrink-0">
                      activity_attempts
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-[#f8faff] text-[#59627a] text-xs w-full border border-[#e1e6f1] flex items-center justify-center gap-2">
                    <Database className="w-3.5 h-3.5 text-[#59627a] shrink-0" />
                    <span className="truncate">Saved to student learning history</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActivePlayActivity(null)}
                  className="w-full py-3 px-6 rounded-full bg-[#f20b86] hover:bg-[#df0879] text-white font-bold text-sm shadow-md shadow-[#f20b86]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer mt-2"
                >
                  Return to Student Adventures
                </button>
              </div>
            )}
          </main>

          {/* 3. STICKY BOTTOM ACTION FOOTER */}
          {!quizFinished && (
            <footer className="h-14 sm:h-16 px-4 sm:px-8 bg-white border-t border-[#e1e6f1] flex items-center justify-between shrink-0 shadow-xs z-10">
              <button
                type="button"
                onClick={() => setActivePlayActivity(null)}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#59627a] hover:text-[#10246f] transition-colors cursor-pointer"
              >
                Exit Activity
              </button>

              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  id="submit-answer-btn"
                  disabled={!canSubmitAnswer}
                  onClick={handleSubmitAnswer}
                  className="px-8 sm:px-12 py-2.5 sm:py-3 rounded-full bg-[#f20b86] hover:bg-[#df0879] disabled:opacity-40 text-white text-xs sm:text-sm font-bold shadow-md shadow-[#f20b86]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Check Answer</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  id="next-question-btn"
                  onClick={handleNextQuestion}
                  className="px-8 sm:px-12 py-2.5 sm:py-3 rounded-full bg-[#10246f] hover:bg-[#0c1a52] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-[#10246f]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{currentQuestionIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              )}
            </footer>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE ACTIVITIES & QUIZZES */}
      {/* ========================================================================= */}
      {activeTab === 'adventures' && (
        <div className="space-y-6">
          <section className="space-y-4">
            {/* Header with Title & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-50 text-amber-800 rounded-xl text-lg border border-amber-200">🎮</span>
                  <h2 className="text-xl font-black text-stone-900">
                    Interactive Activities & Quizzes
                  </h2>
                </div>
                <p className="text-xs text-stone-500">
                  Curriculum adventures, quizzes, challenges, and learning games tailored exclusively for your grade.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Assigned Grade</span>
                  <span className="text-xs font-black text-stone-800 flex items-center justify-end gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{studentGrade} Quests</span>
                  </span>
                </div>
                <span className="text-xs font-bold text-stone-800 bg-amber-50 px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 border border-amber-200 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{gradeLockedActivities.length} Activities Found</span>
                </span>
              </div>
            </div>

            {/* Grade-Locked Info Banner & Filter Control Bar */}
            <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-xs space-y-3.5">
              {/* Grade-Lock Notice Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50/50 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔒</span>
                  <div>
                    <span className="text-xs font-black text-stone-900 block">
                      Grade-Locked Learning: {studentGrade}
                    </span>
                    <span className="text-[11px] text-stone-600 font-medium">
                      You are exploring content exclusively authored for {studentGrade} students.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-stone-900 text-amber-400 font-black text-[11px] shadow-2xs">
                  🎯 {studentGrade} Only
                </span>
              </div>

              {/* Controls: Search & Type Dropdowns */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${studentGrade} activities & quizzes...`}
                      value={activitySearchQuery}
                      onChange={(e) => setActivitySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 font-medium focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all bg-stone-50/60"
                    />
                  </div>

                  {/* FORMAT / CATEGORY DROPDOWN */}
                  <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">⚡ Type:</span>
                    <select
                      value={activityCategoryFilter}
                      onChange={(e) => setActivityCategoryFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold text-stone-800 outline-none cursor-pointer py-1 pr-1"
                    >
                      <option value="All">All Activity Types</option>
                      <option value="daily_quiz">🌅 Daily Sunrise Quiz</option>
                      <option value="game">🎈 Mini Games</option>
                      <option value="challenge">⚡ Time Challenges</option>
                      <option value="boss_battle">⚔️ Boss Battles</option>
                    </select>
                  </div>
                </div>

                {/* Quick Reset button if filters active */}
                {(activityCategoryFilter !== 'All' || activitySearchQuery) && (
                  <button
                    onClick={() => {
                      setActivityCategoryFilter('All');
                      setActivitySearchQuery('');
                    }}
                    className="text-xs font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Empty State */}
            {gradeLockedActivities.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-2xl flex items-center justify-center mx-auto">
                  🎯
                </div>
                <h4 className="text-base font-bold text-stone-800">No {studentGrade} activities found for this filter</h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  No quests match your current filter selection ({activitySubjectFilter !== 'All' ? `Subject: ${activitySubjectFilter}` : ''} {activityCategoryFilter !== 'All' ? `• Type: ${activityCategoryFilter}` : ''}).
                </p>
                <button
                  onClick={() => {
                    setActivityCategoryFilter('All');
                    setActivitySubjectFilter('All');
                    setActivitySearchQuery('');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
                >
                  View All {studentGrade} Activities
                </button>
              </div>
            ) : (
            /* Activity Cards Grid with Prominent Grade Badges */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gradeLockedActivities.map((activity) => {
                const isDaily = activity.type === 'daily_quiz';
                const isBoss = activity.type === 'boss_battle';
                const isGame = activity.type === 'game';
                const actGrade = activity.grade || studentGrade;

                // Grade badge styling
                const gradeBadgeClass = 
                  actGrade === 'Preschool' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  actGrade === 'Foundation' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                  actGrade === 'Grade 1' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                  actGrade === 'Grade 2' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                  actGrade === 'Grade 3' ? 'bg-orange-50 text-orange-900 border-orange-200' :
                  actGrade === 'Grade 4' ? 'bg-orange-50 text-orange-900 border-orange-200' :
                  actGrade === 'Grade 5' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                  'bg-rose-50 text-rose-800 border-rose-200';

                const gradeEmoji = 
                  actGrade === 'Preschool' ? '🌱' :
                  actGrade === 'Foundation' ? '🧩' :
                  actGrade === 'Grade 1' ? '🎒' :
                  actGrade === 'Grade 2' ? '🚀' :
                  actGrade === 'Grade 3' ? '🌟' :
                  actGrade === 'Grade 4' ? '⚡' :
                  actGrade === 'Grade 5' ? '🏆' : '👑';

                return (
                  <div
                    key={activity.id}
                    className={`rounded-3xl border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                      isBoss 
                        ? 'bg-gradient-to-br from-rose-50/90 to-amber-50/80 border-rose-200' 
                        : isDaily 
                        ? 'bg-gradient-to-br from-amber-50/60 via-white to-stone-50 border-amber-200' 
                        : isGame 
                        ? 'bg-gradient-to-br from-orange-50/60 via-white to-stone-50 border-orange-200'
                        : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar on Card: Grade Badge & Format Icon */}
                      <div className="flex items-center justify-between gap-2">
                        {/* DISTINCT GRADE IDENTIFICATION BADGE */}
                        <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl border flex items-center gap-1 shadow-2xs ${gradeBadgeClass}`}>
                          <span>{gradeEmoji}</span>
                          <span>{actGrade}</span>
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 border border-stone-200/80 text-stone-700 uppercase tracking-wider flex items-center gap-1">
                          <span>{isBoss ? '⚔️' : isDaily ? '☀️' : isGame ? '🎈' : '⚡'}</span>
                          <span>{activity.type.replace('_', ' ')}</span>
                        </span>
                      </div>

                      {/* Title & Subject */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                          <span>{activity.subject}</span>
                          {activity.durationMinutes && (
                            <>
                              <span>•</span>
                              <span>{activity.durationMinutes} min</span>
                            </>
                          )}
                        </div>
                        <h3 className="font-extrabold text-stone-900 text-base leading-snug">
                          {activity.title}
                        </h3>
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {activity.description}
                      </p>

                      {/* Boss Info snippet if applicable */}
                      {isBoss && activity.bossName && (
                        <div className="p-2 rounded-xl bg-rose-100/70 border border-rose-200/80 text-rose-950 flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <span>{activity.bossAvatar || '👾'}</span>
                            <span>{activity.bossName}</span>
                          </span>
                          <span className="text-[11px] text-rose-700 font-mono">{activity.bossHp || 500} HP</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-stone-200/70 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-amber-950 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/70">
                          +{activity.rewardXP} XP
                        </span>
                        <span className="text-stone-800 font-bold bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                          +{activity.rewardCoins} 🪙
                        </span>
                        <span className="text-stone-500 text-[11px] font-medium">
                          {activity.questionIds?.length || 5} Qs
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          id={`play-activity-${activity.id}`}
                          onClick={() => handleStartActivity(activity, true)}
                          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                            isBoss 
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' 
                              : isDaily 
                              ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black' 
                              : 'bg-stone-900 hover:bg-stone-800 text-amber-400'
                          }`}
                        >
                          {isBoss ? (
                            <>
                              <Swords className="w-3.5 h-3.5" />
                              <span>Challenge Boss</span>
                            </>
                          ) : isDaily ? (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Daily Quiz</span>
                            </>
                          ) : (
                            <>
                              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>🎮 Play Game</span>
                            </>
                          )}
                        </button>

                        {!isBoss && (
                          <button
                            type="button"
                            onClick={() => handleStartActivity(activity, false)}
                            className="py-2.5 px-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center transition cursor-pointer"
                            title="Classic Speed Drill mode"
                          >
                            <Target className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>

          {/* Quick Mastery & Badges summary */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>My Subject Mastery</span>
                </h3>
                <span className="text-xs text-stone-500 font-medium">
                  Overall Average: {studentProgress.averageScore}%
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(studentProgress.subjectMastery).map(([subject, percent]) => (
                  <div key={subject}>
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1">
                      <span>{subject}</span>
                      <span className="font-mono text-stone-900">{percent}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent >= 90 ? 'bg-emerald-500' : percent >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>My Badges ({studentProgress.badges.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {studentProgress.badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center gap-2.5"
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="truncate">
                        <strong className="block text-xs font-bold text-stone-900 truncate">
                          {badge.name}
                        </strong>
                        <span className="text-[10px] text-stone-500">Unlocked</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-center">
                <span className="text-[11px] text-stone-400">
                  Complete daily quizzes and speed challenges to unlock more badges! 🎓
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SKILL STANDARDS BROWSER (CATEGORY & SKILL HIERARCHY) */}
      {/* ========================================================================= */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>Curriculum Skill Standards Explorer</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Organized by <strong>Category & Learning Skills</strong> for <strong>{studentGrade}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>{studentGrade} Standards</span>
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 font-mono">
                  {categoryGroups.length} Categories • {skillHierarchy.length} Skills
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search categories (e.g. Numbers, Geometry, Operations) or skills (e.g. Counting up to 5)..."
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-stone-50/50"
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
            <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-2xl flex items-center justify-center mx-auto">
                📂
              </div>
              <h4 className="text-base font-bold text-stone-800">No categories or skills found</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No learning standards matched your search query "{skillSearchQuery}".
              </p>
              <button
                onClick={() => setSkillSearchQuery('')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {categoryGroups.map((group, groupIdx) => {
                const subjectMastery = studentProgress.subjectMastery[group.subject as Subject] || 82;
                return (
                  <div 
                    key={groupIdx} 
                    className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden"
                  >
                    {/* Category Header Banner */}
                    <div className="bg-gradient-to-r from-stone-50 via-amber-50/30 to-stone-50 p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center text-lg shrink-0">
                          📂
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 border border-amber-200">
                            Category
                          </span>
                          <h4 className="text-base sm:text-lg font-black text-stone-900 mt-1">
                            {group.category}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white border border-stone-200 text-stone-700 shadow-2xs">
                          {group.skills.length} {group.skills.length === 1 ? 'Skill' : 'Skills'}
                        </span>
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-amber-100/70 border border-amber-200 text-amber-950 shadow-2xs">
                          {group.totalQuestions} Questions Available
                        </span>
                      </div>
                    </div>

                    {/* Skills Grid inside this Category */}
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.skills.map((item, skillIdx) => {
                        const mastery = subjectMastery;
                        return (
                          <div
                            key={skillIdx}
                            className="bg-stone-50/60 rounded-2xl border border-stone-200 p-4 flex flex-col justify-between hover:border-amber-400 hover:bg-white transition group shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-600">
                                  🎯 Skill Standard
                                </span>
                                <span className="text-[11px] font-mono font-bold text-stone-500">
                                  {item.questionsCount} Qs
                                </span>
                              </div>

                              <h5 className="text-sm sm:text-base font-black text-stone-900 group-hover:text-blue-600 transition leading-snug mb-3">
                                {item.skill}
                              </h5>

                              {/* Mastery Level Bar */}
                              <div className="space-y-1 mb-4">
                                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                                  <span>Mastery Progress</span>
                                  <span>{mastery}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
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
                              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                                item.questionsCount > 0
                                  ? 'bg-stone-900 hover:bg-stone-800 text-white hover:scale-[1.01] active:scale-[0.99]'
                                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                              }`}
                              title={item.questionsCount > 0 ? `Start standard questionnaire for ${item.skill}` : 'No questions currently assigned'}
                            >
                              <BookOpen className="w-4 h-4 text-amber-400" />
                              <span>{item.questionsCount > 0 ? `Start Practice (${item.questionsCount} Qs)` : 'No Questions Assigned'}</span>
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
      {/* TAB 3: LEARNING ANALYTICS DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>Accuracy Rate</span>
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-stone-900">
                {studentProgress.averageScore}%
              </div>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+4% this week</span>
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>Avg Speed per Item</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-stone-900">
                7.4s
              </div>
              <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-1">
                <Zap className="w-3 h-3" />
                <span>Fast Thinker Level</span>
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>Quizzes Completed</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-stone-900">
                {studentProgress.totalQuizzesTaken}
              </div>
              <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" />
                <span>Daily Quiz: {studentProgress.dailyQuizCompletedToday ? 'Done ☀️' : 'Pending ⏳'}</span>
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold mb-2">
                <span>Total XP Earned</span>
                <Trophy className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-3xl font-black text-amber-900">
                {studentProgress.xp} XP
              </div>
              <span className="text-[11px] text-stone-500 font-medium mt-1 block">
                Level {studentProgress.level} Scholar
              </span>
            </div>
          </div>

          {/* Subject Mastery Detailed Breakdown */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>Domain & Subject Proficiency</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(studentProgress.subjectMastery).map(([subj, score]) => (
                <div key={subj} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-stone-900">
                    <span>{subj}</span>
                    <span>{score}% Mastery</span>
                  </div>
                  <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        score >= 85 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-400">
                    <span>Target: 80% Mastery</span>
                    <span className="text-emerald-700 font-bold">{score >= 80 ? 'Mastered ✨' : 'In Progress 🚀'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity History Log */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-blue-600" />
              <span>Recent Activity History</span>
            </h3>

            <div className="divide-y divide-stone-100 text-xs">
              {studentProgress.recentActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-sm font-bold text-amber-800">
                      {act.type === 'boss_battle' ? '⚔️' : act.type === 'game' ? '🎮' : '📝'}
                    </div>
                    <div>
                      <strong className="block text-stone-900 font-bold">{act.title}</strong>
                      <span className="text-[10px] text-stone-400">{act.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-900 block">
                      {act.score} / {act.maxScore} pts
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {Math.round((act.score / act.maxScore) * 100)}% Accuracy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Student ID Card Modal */}
      <StudentIDCard
        isOpen={isIdCardOpen}
        onClose={() => setIsIdCardOpen(false)}
        student={studentProgress}
        schoolName={studentProgress.schoolName || currentUser.schoolName}
        parentName={studentProgress.parentName || currentUser.parentName}
      />
    </div>
  );
}
