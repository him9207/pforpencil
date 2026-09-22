import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Sparkles,
  Zap,
  Search,
  Award,
  Users,
  TrendingUp,
  Heart,
  Smile,
  Star,
  Check,
  ChevronRight,
  RefreshCw,
  School,
  GraduationCap
} from 'lucide-react';
import { StudentProgress, GradeLevel } from '../types';
import { INITIAL_STUDENT_PROGRESS } from '../mockData';

export type LeaderboardMetric = 'xp' | 'streak' | 'quizzes';

export interface LeaderboardProps {
  /**
   * Optional map of student progress. If omitted, will fetch from
   * localStorage ('pforpencil_student_progress_v1') or INITIAL_STUDENT_PROGRESS.
   */
  studentProgressMap?: Record<string, StudentProgress>;
  /**
   * The currently logged-in student's ID (e.g. 'STU00001') to highlight their standing.
   */
  currentStudentId?: string;
  /**
   * Limit the number of top students displayed. Defaults to all.
   */
  limit?: number;
  /**
   * Optional custom CSS class name for outer container.
   */
  className?: string;
  /**
   * Initial or fixed grade filter ('all' or specific GradeLevel).
   */
  gradeFilter?: string;
  /**
   * If true, hides the top filter bars (grade tabs, search).
   */
  hideFilters?: boolean;
  /**
   * Compact widget mode for sidebars or dashboard preview cards.
   */
  compact?: boolean;
  /**
   * Callback when a student card is clicked.
   */
  onSelectStudent?: (student: StudentProgress) => void;
}

export default function Leaderboard({
  studentProgressMap: propProgressMap,
  currentStudentId,
  limit,
  className = '',
  gradeFilter: initialGradeFilter = 'all',
  hideFilters = false,
  compact = false,
  onSelectStudent
}: LeaderboardProps) {
  // 1. Fetch & maintain live student progress state
  const [internalProgressMap, setInternalProgressMap] = useState<Record<string, StudentProgress>>(() => {
    if (propProgressMap && Object.keys(propProgressMap).length > 0) {
      return propProgressMap;
    }
    try {
      const saved = localStorage.getItem('pforpencil_student_progress_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { ...INITIAL_STUDENT_PROGRESS, ...parsed };
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_STUDENT_PROGRESS;
  });

  // Keep internal state updated if prop changes
  useEffect(() => {
    if (propProgressMap && Object.keys(propProgressMap).length > 0) {
      setInternalProgressMap(propProgressMap);
    }
  }, [propProgressMap]);

  // Listen for progress updates emitted across tabs or activity completions
  useEffect(() => {
    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem('pforpencil_student_progress_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setInternalProgressMap((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('pforpencil_student_progress_updated', handleStorageUpdate);
    window.addEventListener('student_progress_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('pforpencil_student_progress_updated', handleStorageUpdate);
      window.removeEventListener('student_progress_updated', handleStorageUpdate);
    };
  }, []);

  // 2. Filter & Sort State
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGradeFilter);
  const [metric, setMetric] = useState<LeaderboardMetric>('xp');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cheeredStudentIds, setCheeredStudentIds] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Manual refresh trigger
  const handleRefresh = () => {
    setIsRefreshing(true);
    try {
      const saved = localStorage.getItem('pforpencil_student_progress_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) setInternalProgressMap({ ...INITIAL_STUDENT_PROGRESS, ...parsed });
      } else {
        setInternalProgressMap({ ...INITIAL_STUDENT_PROGRESS });
      }
    } catch {}
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Friendly cheer interaction
  const handleCheer = (studentId: string, studentName: string) => {
    const cheers = ['🎉 Awesome!', '🌟 Keep shining!', '🚀 You rock!', '👏 High Five!'];
    const randomCheer = cheers[Math.floor(Math.random() * cheers.length)];
    setCheeredStudentIds((prev) => ({ ...prev, [studentId]: randomCheer }));

    // Reset reaction after 3 seconds
    setTimeout(() => {
      setCheeredStudentIds((prev) => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    }, 3000);
  };

  // 3. Process & Rank Students
  const rankedStudents = useMemo(() => {
    const studentsArray = Object.values(internalProgressMap || {});

    // Filter by grade
    let filtered = studentsArray.filter((s) => {
      if (!s || !s.studentName) return false;
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesUsername = s.studentUsername?.toLowerCase().includes(q);
        const matchesSchool = s.schoolName?.toLowerCase().includes(q);
        if (!matchesName && !matchesUsername && !matchesSchool) return false;
      }
      return true;
    });

    // Sort based on selected metric
    filtered.sort((a, b) => {
      if (metric === 'streak') {
        return (b.streakDays || 0) - (a.streakDays || 0);
      }
      if (metric === 'quizzes') {
        return (b.totalQuizzesTaken || 0) - (a.totalQuizzesTaken || 0);
      }
      // Default: Total XP
      return (b.xp || 0) - (a.xp || 0);
    });

    if (limit && limit > 0) {
      return filtered.slice(0, limit);
    }
    return filtered;
  }, [internalProgressMap, selectedGrade, metric, searchQuery, limit]);

  // Overall statistics
  const topThree = useMemo(() => rankedStudents.slice(0, 3), [rankedStudents]);
  const remainingStudents = useMemo(() => rankedStudents.slice(3), [rankedStudents]);

  // Current student rank details
  const currentStudentRankInfo = useMemo(() => {
    if (!currentStudentId) return null;
    const index = rankedStudents.findIndex((s) => s.studentId === currentStudentId);
    if (index === -1) return null;

    const currentStudent = rankedStudents[index];
    const rank = index + 1;
    const nextStudent = index > 0 ? rankedStudents[index - 1] : null;

    let xpToNext = 0;
    if (nextStudent) {
      if (metric === 'xp') {
        xpToNext = Math.max(0, (nextStudent.xp || 0) - (currentStudent.xp || 0) + 10);
      } else if (metric === 'streak') {
        xpToNext = Math.max(0, (nextStudent.streakDays || 0) - (currentStudent.streakDays || 0) + 1);
      } else if (metric === 'quizzes') {
        xpToNext = Math.max(0, (nextStudent.totalQuizzesTaken || 0) - (currentStudent.totalQuizzesTaken || 0) + 1);
      }
    }

    return {
      rank,
      total: rankedStudents.length,
      student: currentStudent,
      nextStudent,
      xpToNext
    };
  }, [rankedStudents, currentStudentId, metric]);

  // Grade list for filtering
  const availableGrades: { id: string; label: string }[] = [
    { id: 'all', label: 'All Grades' },
    { id: 'Preschool', label: 'Preschool' },
    { id: 'Foundation', label: 'Foundation' },
    { id: 'Grade 1', label: 'Grade 1' },
    { id: 'Grade 2', label: 'Grade 2' },
    { id: 'Grade 3', label: 'Grade 3' }
  ];

  // Helper for metric value label
  const getMetricValue = (student: StudentProgress) => {
    if (metric === 'streak') {
      return `${student.streakDays || 0} Days 🔥`;
    }
    if (metric === 'quizzes') {
      return `${student.totalQuizzesTaken || 0} Quizzes 📚`;
    }
    return `${(student.xp || 0).toLocaleString()} XP ⚡`;
  };

  // Helper for rank badge styling
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          icon: <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />,
          bg: 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs',
          label: '1st',
          accentBorder: 'border-amber-400/80'
        };
      case 2:
        return {
          icon: <Medal className="w-4 h-4 text-slate-500 fill-slate-400" />,
          bg: 'bg-slate-100 text-slate-800 border-slate-300 shadow-xs',
          label: '2nd',
          accentBorder: 'border-slate-300'
        };
      case 3:
        return {
          icon: <Medal className="w-4 h-4 text-amber-700 fill-amber-600" />,
          bg: 'bg-amber-50 text-amber-900 border-amber-200 shadow-xs',
          label: '3rd',
          accentBorder: 'border-amber-300/80'
        };
      default:
        return {
          icon: null,
          bg: 'bg-stone-100 text-stone-700 border-stone-200',
          label: `#${rank}`,
          accentBorder: 'border-stone-200'
        };
    }
  };

  // =========================================================================
  // COMPACT WIDGET MODE (Ideal for Sidebars or Mini Dashboards)
  // =========================================================================
  if (compact) {
    return (
      <div
        id="leaderboard-compact-widget"
        className={`bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between ${className}`}
      >
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-stone-900 leading-tight">XP Leaderboard</h3>
                <span className="text-[10px] text-stone-500 font-medium">Top Star Scholars</span>
              </div>
            </div>
            <button
              type="button"
              id="leaderboard-refresh-compact-btn"
              onClick={handleRefresh}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Refresh standings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>

          {/* Top 5 list */}
          <div className="space-y-2">
            {rankedStudents.slice(0, 5).map((student, idx) => {
              const rank = idx + 1;
              const isCurrentUser = student.studentId === currentStudentId;
              const rankBadge = getRankBadge(rank);

              return (
                <div
                  key={student.studentId || idx}
                  onClick={() => onSelectStudent?.(student)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isCurrentUser
                      ? 'bg-amber-50/80 border-amber-300 shadow-2xs font-semibold'
                      : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200/80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border ${rankBadge.bg}`}
                    >
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </span>
                    <span className="text-xl shrink-0">{student.avatar || '🎓'}</span>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-stone-900 truncate">
                        {student.studentName}
                        {isCurrentUser && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-black">
                            YOU
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-stone-500 truncate block">
                        {student.grade}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-700 block">
                      {(student.xp || 0).toLocaleString()} XP
                    </span>
                    <span className="text-[9px] text-stone-400">
                      🔥 {student.streakDays || 0}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Student Position Bar */}
        {currentStudentRankInfo && (
          <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-600 flex items-center justify-between">
            <span>
              Your Rank: <strong>#{currentStudentRankInfo.rank}</strong> of {currentStudentRankInfo.total}
            </span>
            <span className="font-bold text-amber-700">
              {(currentStudentRankInfo.student.xp || 0).toLocaleString()} XP
            </span>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // FULL EXPANDED LEADERBOARD VIEW
  // =========================================================================
  return (
    <div
      id="leaderboard-full-view"
      className={`bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-7 ${className}`}
    >
      {/* 1. Header Banner & Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                <span>Star Scholars Leaderboard</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Friendly Competition
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Recognizing top learners based on total XP, daily consistency, and quiz mastery.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 rounded-2xl bg-stone-100 border border-stone-200 text-xs font-bold">
            <button
              type="button"
              id="metric-xp-btn"
              onClick={() => setMetric('xp')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                metric === 'xp'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Total XP</span>
            </button>
            <button
              type="button"
              id="metric-streak-btn"
              onClick={() => setMetric('streak')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                metric === 'streak'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Daily Streak</span>
            </button>
            <button
              type="button"
              id="metric-quizzes-btn"
              onClick={() => setMetric('quizzes')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                metric === 'quizzes'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-blue-600" />
              <span>Quizzes Taken</span>
            </button>
          </div>

          <button
            type="button"
            id="leaderboard-refresh-full-btn"
            onClick={handleRefresh}
            className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition cursor-pointer shadow-2xs"
            title="Refresh Leaderboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Filters & Search (if not hidden) */}
      {!hideFilters && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Grade Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {availableGrades.map((grade) => (
              <button
                key={grade.id}
                type="button"
                id={`grade-filter-${grade.id.toLowerCase()}-btn`}
                onClick={() => setSelectedGrade(grade.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedGrade === grade.id
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                }`}
              >
                {grade.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="leaderboard-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or school..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-900 placeholder:text-stone-400"
            />
          </div>
        </div>
      )}

      {/* 3. TOP 3 PODIUM HERO SECTION */}
      {topThree.length > 0 && (
        <div className="pt-2 pb-4">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-50/40 via-stone-50/50 to-white border border-amber-200/70 shadow-xs">
            <div className="text-center mb-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-0.5 rounded-full">
                👑 Top Scholastic Champions
              </span>
              <p className="text-xs text-stone-500 mt-1">
                Leading the league in total knowledge points and consistent practice!
              </p>
            </div>

            {/* Podium Display (2nd - 1st - 3rd) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto items-end pt-4">
              {/* 2ND PLACE (SILVER) */}
              {topThree[1] ? (
                <div
                  id="podium-rank-2"
                  onClick={() => onSelectStudent?.(topThree[1])}
                  className="flex flex-col items-center text-center cursor-pointer group"
                >
                  <div className="relative mb-2">
                    <span className="text-4xl sm:text-5xl block transform group-hover:scale-110 transition-transform">
                      {topThree[1].avatar || '🚀'}
                    </span>
                    <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-800 shadow-xs">
                      2
                    </span>
                  </div>

                  <strong className="text-xs sm:text-sm font-black text-stone-900 truncate max-w-[90px] sm:max-w-[130px] block">
                    {topThree[1].studentName}
                  </strong>
                  <span className="text-[10px] text-stone-500 truncate block max-w-[90px]">
                    {topThree[1].grade}
                  </span>

                  <div className="mt-2 w-full py-2 px-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs group-hover:bg-slate-200/80 transition-colors">
                    <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                      {getMetricValue(topThree[1])}
                    </span>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                      🥈 Runner Up
                    </span>
                  </div>

                  <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-200/80 to-slate-100 rounded-t-xl mt-1 border-t-2 border-slate-300 flex items-center justify-center">
                    <span className="font-mono font-black text-slate-500 text-lg sm:text-xl">#2</span>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* 1ST PLACE (GOLD) */}
              {topThree[0] ? (
                <div
                  id="podium-rank-1"
                  onClick={() => onSelectStudent?.(topThree[0])}
                  className="flex flex-col items-center text-center cursor-pointer group -translate-y-2"
                >
                  <div className="relative mb-2">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                      <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500 fill-amber-400 drop-shadow-xs" />
                    </div>
                    <span className="text-5xl sm:text-6xl block transform group-hover:scale-110 transition-transform">
                      {topThree[0].avatar || '🦊'}
                    </span>
                    <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs font-black text-amber-950 shadow-md">
                      1
                    </span>
                  </div>

                  <strong className="text-xs sm:text-base font-black text-stone-900 truncate max-w-[110px] sm:max-w-[150px] block">
                    {topThree[0].studentName}
                  </strong>
                  <span className="text-[10px] sm:text-xs text-amber-800 font-bold truncate block max-w-[110px]">
                    {topThree[0].grade}
                  </span>

                  <div className="mt-2 w-full py-2.5 px-1 rounded-2xl bg-amber-100/90 border border-amber-300 shadow-sm group-hover:bg-amber-200/90 transition-colors">
                    <span className="text-xs sm:text-base font-black text-amber-950 block truncate">
                      {getMetricValue(topThree[0])}
                    </span>
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                      🥇 Champion
                    </span>
                  </div>

                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-amber-300/80 to-amber-200 rounded-t-xl mt-1 border-t-2 border-amber-400 flex items-center justify-center shadow-xs">
                    <span className="font-mono font-black text-amber-900 text-2xl sm:text-3xl">#1</span>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* 3RD PLACE (BRONZE) */}
              {topThree[2] ? (
                <div
                  id="podium-rank-3"
                  onClick={() => onSelectStudent?.(topThree[2])}
                  className="flex flex-col items-center text-center cursor-pointer group"
                >
                  <div className="relative mb-2">
                    <span className="text-4xl sm:text-5xl block transform group-hover:scale-110 transition-transform">
                      {topThree[2].avatar || '🦁'}
                    </span>
                    <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-amber-600 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-xs">
                      3
                    </span>
                  </div>

                  <strong className="text-xs sm:text-sm font-black text-stone-900 truncate max-w-[90px] sm:max-w-[130px] block">
                    {topThree[2].studentName}
                  </strong>
                  <span className="text-[10px] text-stone-500 truncate block max-w-[90px]">
                    {topThree[2].grade}
                  </span>

                  <div className="mt-2 w-full py-2 px-1 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs group-hover:bg-amber-100/70 transition-colors">
                    <span className="text-xs sm:text-sm font-black text-amber-900 block truncate">
                      {getMetricValue(topThree[2])}
                    </span>
                    <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                      🥉 3rd Place
                    </span>
                  </div>

                  <div className="w-full h-12 sm:h-14 bg-gradient-to-t from-amber-200/60 to-amber-100 rounded-t-xl mt-1 border-t-2 border-amber-300 flex items-center justify-center">
                    <span className="font-mono font-black text-amber-800 text-base sm:text-lg">#3</span>
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. FULL RANKING LIST (Detailed Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-stone-600" />
            <span>Complete League Standings ({rankedStudents.length} Students)</span>
          </h3>
          <span className="text-[11px] text-stone-500">
            Sorted by {metric === 'xp' ? 'Total XP' : metric === 'streak' ? 'Daily Streak' : 'Quizzes Completed'}
          </span>
        </div>

        {rankedStudents.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <Smile className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-xs font-bold text-stone-700">No students match your selected filters</p>
            <button
              type="button"
              onClick={() => {
                setSelectedGrade('all');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {rankedStudents.map((student, idx) => {
              const rank = idx + 1;
              const isCurrentUser = student.studentId === currentStudentId;
              const rankBadge = getRankBadge(rank);
              const cheeredMessage = cheeredStudentIds[student.studentId];

              return (
                <div
                  key={student.studentId || idx}
                  id={`student-rank-card-${student.studentId || idx}`}
                  onClick={() => onSelectStudent?.(student)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${
                    isCurrentUser
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-300/60'
                      : 'bg-white hover:bg-stone-50 border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  {/* Left: Rank, Avatar, Name & Metadata */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Chip */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${rankBadge.bg}`}
                    >
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {student.avatar || '🎓'}
                    </div>

                    {/* Name & Badges */}
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xs sm:text-sm font-black text-stone-900 group-hover:text-amber-950 truncate">
                          {student.studentName}
                        </strong>
                        {isCurrentUser && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                          {student.grade}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-stone-500 truncate flex-wrap">
                        {student.schoolName ? (
                          <span className="flex items-center gap-1 truncate text-stone-600">
                            <School className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{student.schoolName}</span>
                          </span>
                        ) : student.parentName ? (
                          <span className="flex items-center gap-1 truncate text-stone-600">
                            <GraduationCap className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">Home Academy</span>
                          </span>
                        ) : null}

                        <span className="flex items-center gap-1 font-semibold text-amber-700">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>{student.streakDays || 0}d streak</span>
                        </span>

                        <span className="flex items-center gap-1 font-semibold text-stone-600">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span>Lvl {student.level || 1}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metric Score & Cheering Reaction */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="text-left sm:text-right">
                      <span className="text-sm sm:text-base font-black text-stone-900 block">
                        {getMetricValue(student)}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {student.totalQuizzesTaken || 0} quizzes completed
                      </span>
                    </div>

                    {/* Friendly Cheer Button */}
                    <div className="relative">
                      {cheeredMessage ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black animate-in zoom-in-95">
                          {cheeredMessage}
                        </span>
                      ) : (
                        <button
                          type="button"
                          id={`cheer-btn-${student.studentId || idx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheer(student.studentId, student.studentName);
                          }}
                          className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Send a friendly cheer!"
                        >
                          <Smile className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden sm:inline">Cheer</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. CURRENT STUDENT PINNED BANNER (If logged in) */}
      {currentStudentRankInfo && (
        <div
          id="leaderboard-my-standing-banner"
          className="p-4 sm:p-5 rounded-3xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shrink-0">
              {currentStudentRankInfo.student.avatar || '🦊'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full text-white">
                  Your Current Standing
                </span>
                <span className="text-xs font-black">
                  Rank #{currentStudentRankInfo.rank} of {currentStudentRankInfo.total}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                {currentStudentRankInfo.student.studentName} — {(currentStudentRankInfo.student.xp || 0).toLocaleString()} XP
              </h4>
              <p className="text-xs text-amber-100 leading-snug">
                {currentStudentRankInfo.rank === 1
                  ? '🌟 You are at the top of the leaderboard! Keep maintaining your streak!'
                  : currentStudentRankInfo.nextStudent
                  ? `Only ${currentStudentRankInfo.xpToNext} ${metric === 'xp' ? 'XP' : metric === 'streak' ? 'streak days' : 'quizzes'} behind #${currentStudentRankInfo.rank - 1} (${currentStudentRankInfo.nextStudent.studentName})!`
                  : 'Complete today’s daily quiz to climb the leaderboard!'}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3.5 py-2 rounded-xl bg-white text-amber-900 font-black text-xs shadow-xs">
              🔥 {currentStudentRankInfo.student.streakDays || 0} Day Streak
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
