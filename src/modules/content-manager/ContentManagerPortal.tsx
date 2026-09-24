import React, { useState, FormEvent } from 'react';
import { 
  UserAccount, 
  Question, 
  Activity,
  ActivityType,
  RecurrenceType,
  Subject, 
  GradeLevel,
  CurriculumGrade,
  CurriculumSubject
} from '../../types';
import { 
  BookOpen, 
  Plus, 
  Filter, 
  Layers, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Search,
  Sparkles,
  HelpCircle,
  FileQuestion,
  Zap,
  Swords,
  Trophy,
  Flame,
  Clock,
  Coins,
  Award,
  X,
  Lock,
  Unlock,
  Building2,
  Globe,
  FileSpreadsheet
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { getNextQuestionId } from '../../utils/idAndUsernameGenerator';
import { COUNTRIES, COUNTRY_STATE_MAP, COUNTRY_CURRICULUM_MAP } from '../../data/curriculumData';
import { loadQuestionBankMasters } from '../../data/questionBankMasterData';
import QuestionBankModal from '../admin/components/QuestionBankModal';
import QuestionEditModal from '../admin/components/QuestionEditModal';
import InteractiveActivityModal from '../admin/components/InteractiveActivityModal';

interface ContentManagerPortalProps {
  currentUser: UserAccount;
  questions: Question[];
  activities: Activity[];
  grades?: CurriculumGrade[];
  subjects?: CurriculumSubject[];
  onAddQuestion: (q: Question) => void;
  onEditQuestion?: (q: Question) => void;
  onDeleteQuestion?: (id: string) => void;
  onAddActivity?: (act: Activity) => void;
  onEditActivity?: (act: Activity) => void;
  onDeleteActivity?: (id: string) => void;
}

export default function ContentManagerPortal({
  currentUser,
  questions,
  activities = [],
  grades = [],
  subjects = [],
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onAddActivity,
  onEditActivity,
  onDeleteActivity
}: ContentManagerPortalProps) {
  // Dynamic active curriculum grades (reads directly from active curriculum: Preschool, Foundation, Grade 1 to 6)
  const activeCurriculumGrades: GradeLevel[] = (grades && grades.length > 0)
    ? (grades.filter((g) => g.active).map((g) => g.name as GradeLevel))
    : ['Preschool', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  const allSubjects: Subject[] = (subjects && subjects.length > 0)
    ? (subjects.filter((s) => s.active).map((s) => s.name as Subject))
    : ['Mathematics'];

  const [activeTab, setActiveTab] = useState<'questions' | 'activities'>('questions');

  // Question Filters
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Activity Filters
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('All');
  const [activityGradeFilter, setActivityGradeFilter] = useState<string>('All');
  const [activitySubjectFilter, setActivitySubjectFilter] = useState<string>('All');
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');

  // Unified Modals for Creation (Standardized across Admin and Content Manager)
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [showInteractiveActivityModal, setShowInteractiveActivityModal] = useState(false);

  // Master Standardized Question Editor State (Unifies Create, Edit, and Bulk Load across all 12 types)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [selectedEditQuestion, setSelectedEditQuestion] = useState<Question | null>(null);

  // Edit Activity Modal State
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [actTitle, setActTitle] = useState('');
  const [actDescription, setActDescription] = useState('');
  const [actType, setActType] = useState<ActivityType>('daily_quiz');
  const [actSubject, setActSubject] = useState<Subject>('Mathematics');
  const [actGrade, setActGrade] = useState<GradeLevel>('Grade 3');
  const [actRecurrence, setActRecurrence] = useState<RecurrenceType>('daily');
  const [actRewardXp, setActRewardXp] = useState(150);
  const [actRewardCoins, setActRewardCoins] = useState(40);
  const [actDurationMinutes, setActDurationMinutes] = useState(10);
  const [actBossName, setActBossName] = useState('Dr. Fractionstein');
  const [actBossAvatar, setActBossAvatar] = useState('🤖');
  const [actBossHp, setActBossHp] = useState(500);
  const [selectedActivityQuestionIds, setSelectedActivityQuestionIds] = useState<string[]>([]);

  const [notification, setNotification] = useState<string>('');

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesCountry = selectedCountry === 'All' || !q.country || q.country === selectedCountry;
    const matchesState = selectedState === 'All' || !q.state || q.state === selectedState;
    const matchesCurriculum = selectedCurriculum === 'All' || !q.curriculum || q.curriculum === selectedCurriculum;
    const matchesSub = selectedSubject === 'All' || q.subject === selectedSubject;
    const matchesGrd = selectedGrade === 'All' || q.grade === selectedGrade;
    const matchesDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    const matchesSrch = !searchQuery.trim() || 
      q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCountry && matchesState && matchesCurriculum && matchesSub && matchesGrd && matchesDiff && matchesSrch;
  });

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const matchesType = activityTypeFilter === 'All' || act.type === activityTypeFilter;
    const matchesGrade = activityGradeFilter === 'All' || act.grade === activityGradeFilter;
    const matchesSubject = activitySubjectFilter === 'All' || act.subject === activitySubjectFilter;
    const matchesSearch = !activitySearchQuery.trim() ||
      act.title.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      act.id.toLowerCase().includes(activitySearchQuery.toLowerCase());

    return matchesType && matchesGrade && matchesSubject && matchesSearch;
  });

  const handleOpenEditActivity = (act: Activity) => {
    sounds.click();
    setEditingActivityId(act.id);
    setActTitle(act.title);
    setActDescription(act.description);
    setActType(act.type);
    setActSubject(act.subject);
    setActGrade(act.grade);
    setActRecurrence(act.recurrence || 'daily');
    setActRewardXp(act.rewardXP);
    setActRewardCoins(act.rewardCoins);
    setActDurationMinutes(act.durationMinutes || 10);
    setActBossName(act.bossName || 'Dr. Fractionstein');
    setActBossAvatar(act.bossAvatar || '🤖');
    setActBossHp(act.bossHp || 500);
    setSelectedActivityQuestionIds(act.questionIds || []);
    setShowEditActivityModal(true);
  };

  const handleSaveEditActivity = (e: FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim() || !editingActivityId) return;

    const existing = activities.find(a => a.id === editingActivityId);
    const updatedAct: Activity = {
      id: editingActivityId,
      type: actType,
      title: actTitle.trim(),
      description: actDescription.trim() || existing?.description || '',
      subject: actSubject,
      grade: actGrade,
      recurrence: actRecurrence,
      questionIds: selectedActivityQuestionIds,
      rewardXP: Number(actRewardXp) || 100,
      rewardCoins: Number(actRewardCoins) || 25,
      durationMinutes: Number(actDurationMinutes) || 10,
      unlocked: existing?.unlocked ?? true,
      bossName: actType === 'boss_battle' ? actBossName : undefined,
      bossAvatar: actType === 'boss_battle' ? actBossAvatar : undefined,
      bossHp: actType === 'boss_battle' ? Number(actBossHp) : undefined
    };

    sounds.playCorrect();
    if (onEditActivity) {
      onEditActivity(updatedAct);
    }
    setShowEditActivityModal(false);
    setNotification(`Updated activity "${updatedAct.title}"!`);
    setTimeout(() => setNotification(''), 4000);
  };

  const toggleQuestionSelection = (qId: string) => {
    setSelectedActivityQuestionIds(prev => 
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner - Standardized High-Contrast Clean Theme */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
            ✍️
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-950 border border-amber-200 text-[11px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Content Management Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Curriculum & Activities Engine
            </h1>
            <p className="text-xs text-stone-500 font-mono">
              Signed in as: {currentUser.name} • Master Bank: {questions.length} Questions • Activities: {activities.length}
            </p>
          </div>
        </div>

        {/* Tab Switcher & Primary Action */}
        <div className="flex items-center gap-2">
          <div className="bg-stone-100 p-1.5 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              📚 Question Bank ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              ⚡ Interactive Activities ({activities.length})
            </button>
          </div>

          {activeTab === 'questions' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.click();
                  setShowQuestionBankModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Bulk load questions via Excel workbook / CSV or generate batch drills"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Bulk Load (Excel / CSV)</span>
              </button>
              <button
                onClick={() => {
                  sounds.click();
                  setIsCreatingQuestion(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black transition-all shadow-xs cursor-pointer"
                title="Create a new question using the Master Question Editor"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Question</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.click();
                setShowInteractiveActivityModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: QUESTION BANK MASTER */}
      {/* ========================================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Regional & Standard Filter Bar */}
          <div className="space-y-3">
            {/* Regional Filter Bar */}
            <div className="bg-slate-50 border border-stone-200 rounded-3xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-600" />
                  <span>Country / Region</span>
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedState('All');
                    setSelectedCurriculum('All');
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
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
                >
                  <option value="All">📍 All States / Regions</option>
                  {selectedCountry !== 'All' && COUNTRY_STATE_MAP[selectedCountry]
                    ? COUNTRY_STATE_MAP[selectedCountry].map(st => (
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
                  Curriculum Framework
                </label>
                <select
                  value={selectedCurriculum}
                  onChange={(e) => setSelectedCurriculum(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
                >
                  <option value="All">📚 All Curriculums</option>
                  {selectedCountry !== 'All' && COUNTRY_CURRICULUM_MAP[selectedCountry]
                    ? COUNTRY_CURRICULUM_MAP[selectedCountry].map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))
                    : Array.from(new Set(Object.values(COUNTRY_CURRICULUM_MAP).flat())).map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))
                  }
                </select>
              </div>
            </div>

            {/* Standard Filter Bar */}
            <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search questions, skills, prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Subject Filter */}
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
                >
                  <option value="All">All Subjects ({allSubjects.join(', ')})</option>
                  {allSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>

                {/* Grade Filter */}
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
                >
                  <option value="All">All Grade Levels ({activeCurriculumGrades.length} Grades)</option>
                  {activeCurriculumGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <span className="text-xs font-bold text-stone-400">
                Showing {filteredQuestions.length} of {questions.length} Items
              </span>
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuestions.map((q) => (
              <div 
                key={q.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs hover:shadow-sm transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {q.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        q.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-800' :
                        q.difficulty === 'Medium' ? 'bg-blue-50 text-blue-800' :
                        'bg-rose-50 text-rose-800'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                        {q.grade}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <span>{q.subject}</span>
                      <span>•</span>
                      <span>{q.category}</span>
                      {q.country && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 font-bold">{q.country}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs font-black text-stone-800">{q.skill}</div>
                  </div>

                  {q.visualClipart && (
                    <div className="p-2 bg-slate-50 border border-stone-100 rounded-xl text-center text-lg">
                      {q.visualClipart}
                    </div>
                  )}

                  <p className="text-xs font-medium text-stone-900 leading-snug">
                    {q.prompt}
                  </p>

                  <div className="space-y-1 pt-1">
                    {q.options.map((opt, idx) => (
                      <div 
                        key={idx}
                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          idx === q.correctIndex 
                            ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200' 
                            : 'bg-stone-50 text-stone-600'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {idx === q.correctIndex && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-stone-700 text-[11px]">
                    +{q.points} XP
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        sounds.click();
                        setSelectedEditQuestion(q);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer transition flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {onDeleteQuestion && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete question ${q.id}?`)) {
                            onDeleteQuestion(q.id);
                          }
                        }}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE ACTIVITIES ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'activities' && (
        <div className="space-y-5">
          {/* Activity Filters */}
          <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search interactive quests..."
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
              >
                <option value="All">All Formats</option>
                <option value="daily_quiz">Daily Quizzes</option>
                <option value="challenge">Speed Challenges</option>
                <option value="boss_battle">Boss Battles</option>
                <option value="game">Learning Games</option>
              </select>

              <select
                value={activityGradeFilter}
                onChange={(e) => setActivityGradeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
              >
                <option value="All">All Grade Levels</option>
                {activeCurriculumGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              <select
                value={activitySubjectFilter}
                onChange={(e) => setActivitySubjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white"
              >
                <option value="All">All Subjects</option>
                {allSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                sounds.click();
                setShowInteractiveActivityModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Design Activity</span>
            </button>
          </div>

          {/* Quick Filter Grade Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-1">
              Grade Focus:
            </span>
            {['All', ...activeCurriculumGrades].map((g) => (
              <button
                key={g}
                onClick={() => setActivityGradeFilter(g)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activityGradeFilter === g
                    ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((act) => {
              const qCount = act.questionIds?.length || 0;
              const actGrade = act.grade;
              const gradeBadgeClass = 
                actGrade === 'Preschool' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                actGrade === 'Foundation' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                actGrade === 'Grade 1' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                actGrade === 'Grade 2' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                actGrade === 'Grade 3' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                actGrade === 'Grade 4' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                actGrade === 'Grade 5' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                actGrade === 'Grade 6' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                'bg-stone-50 text-stone-800 border-stone-200';

              const gradeEmoji = 
                actGrade === 'Preschool' ? '🌱' :
                actGrade === 'Foundation' ? '🧩' :
                actGrade === 'Grade 1' ? '🎒' :
                actGrade === 'Grade 2' ? '🚀' :
                actGrade === 'Grade 3' ? '🌟' :
                actGrade === 'Grade 4' ? '⚡' :
                actGrade === 'Grade 5' ? '🏆' :
                actGrade === 'Grade 6' ? '👑' : '🎓';

              return (
                <div
                  key={act.id}
                  className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${gradeBadgeClass}`}>
                        <span>{gradeEmoji}</span>
                        <span>{act.grade}</span>
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>+{act.rewardXP || 100} XP</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-200 font-bold">
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

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditActivity(act)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer transition flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      {onDeleteActivity && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete activity "${act.title}"?`)) {
                              onDeleteActivity(act.id);
                            }
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MASTER STANDARDIZED QUESTION BANK MODAL (SINGLE, BATCH, CSV UPLOAD) */}
      {/* ========================================================================= */}
      <QuestionBankModal
        isOpen={showQuestionBankModal}
        onClose={() => setShowQuestionBankModal(false)}
        availableGrades={activeCurriculumGrades}
        availableSubjects={allSubjects}
        questions={questions}
        nextQuestionId={getNextQuestionId('Grade 1', questions)}
        categoryMasters={loadQuestionBankMasters().categories}
        skillMasters={loadQuestionBankMasters().skills}
        onAddQuestion={(q) => {
          onAddQuestion(q);
          setNotification(`Added question ${q.id} to master bank!`);
          setTimeout(() => setNotification(''), 4000);
        }}
        onAddBatchQuestions={(newQuestions) => {
          newQuestions.forEach(q => onAddQuestion(q));
          setNotification(`Added ${newQuestions.length} questions to master bank!`);
          setTimeout(() => setNotification(''), 4000);
        }}
      />

      {/* ========================================================================= */}
      {/* MASTER STANDARDIZED INTERACTIVE ACTIVITY CREATOR MODAL */}
      {/* ========================================================================= */}
      <InteractiveActivityModal
        isOpen={showInteractiveActivityModal}
        onClose={() => setShowInteractiveActivityModal(false)}
        availableGrades={activeCurriculumGrades}
        availableSubjects={allSubjects}
        questions={questions}
        onAddActivity={(newAct) => {
          if (onAddActivity) onAddActivity(newAct);
          setNotification(`Created interactive activity: ${newAct.title}!`);
          setTimeout(() => setNotification(''), 4000);
        }}
      />

      {/* ========================================================================= */}
      {/* MASTER STANDARDIZED QUESTION EDITOR: CREATE NEW QUESTION */}
      {/* ========================================================================= */}
      {isCreatingQuestion && (
        <QuestionEditModal
          isOpen={isCreatingQuestion}
          mode="create"
          question={null}
          onClose={() => setIsCreatingQuestion(false)}
          onSave={(newQ) => {
            onAddQuestion(newQ);
            setNotification(`Created question ${newQ.id} successfully!`);
            setTimeout(() => setNotification(''), 4000);
            setIsCreatingQuestion(false);
          }}
          availableGrades={activeCurriculumGrades}
          availableSubjects={allSubjects}
          existingQuestions={questions}
        />
      )}

      {/* ========================================================================= */}
      {/* MASTER STANDARDIZED QUESTION EDITOR: EDIT EXISTING QUESTION (100% IDENTICAL) */}
      {/* ========================================================================= */}
      {selectedEditQuestion && (
        <QuestionEditModal
          isOpen={Boolean(selectedEditQuestion)}
          mode="edit"
          question={selectedEditQuestion}
          onClose={() => setSelectedEditQuestion(null)}
          onSave={(updatedQ) => {
            if (onEditQuestion) onEditQuestion(updatedQ);
            setNotification(`Updated question ${updatedQ.id} successfully!`);
            setTimeout(() => setNotification(''), 4000);
            setSelectedEditQuestion(null);
          }}
          availableGrades={activeCurriculumGrades}
          availableSubjects={allSubjects}
          existingQuestions={questions}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT ACTIVITY MODAL (MODERN THEME) */}
      {/* ========================================================================= */}
      {showEditActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 text-xs my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Edit Activity: {editingActivityId}</span>
              </h3>
              <button 
                onClick={() => setShowEditActivityModal(false)} 
                className="text-stone-400 hover:text-stone-900 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditActivity} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Activity Title</label>
                  <input
                    type="text"
                    value={actTitle}
                    onChange={(e) => setActTitle(e.target.value)}
                    placeholder="e.g. Space Odyssey Daily Quiz"
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Activity Format</label>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value as ActivityType)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-xs"
                  >
                    <option value="daily_quiz">🌅 Daily Sunrise Quiz</option>
                    <option value="challenge">⚡ Time Attack Challenge</option>
                    <option value="boss_battle">⚔️ Boss Quest Battle</option>
                    <option value="game">🎮 Mini Learning Game</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Description & Objective</label>
                <input
                  type="text"
                  value={actDescription}
                  onChange={(e) => setActDescription(e.target.value)}
                  placeholder="Explain learning mission to children and parents..."
                  className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Subject</label>
                  <select
                    value={actSubject}
                    onChange={(e) => setActSubject(e.target.value as Subject)}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs font-bold"
                  >
                    {allSubjects.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Grade Level</label>
                  <select
                    value={actGrade}
                    onChange={(e) => setActGrade(e.target.value as GradeLevel)}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs font-bold"
                  >
                    {activeCurriculumGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Recurrence</label>
                  <select
                    value={actRecurrence}
                    onChange={(e) => setActRecurrence(e.target.value as RecurrenceType)}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs"
                  >
                    <option value="daily">Daily Reset</option>
                    <option value="weekly">Weekly Event</option>
                    <option value="permanent">Permanent Practice</option>
                    <option value="challenge">Seasonal Challenge</option>
                  </select>
                </div>
              </div>

              {/* Boss Quest Settings if type is boss_battle */}
              {actType === 'boss_battle' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-rose-900 uppercase mb-1">Boss Name</label>
                    <input
                      type="text"
                      value={actBossName}
                      onChange={(e) => setActBossName(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-rose-200 bg-white text-xs"
                      placeholder="e.g. Dr. Fractionstein"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-900 uppercase mb-1">Boss Avatar Emoji</label>
                    <input
                      type="text"
                      value={actBossAvatar}
                      onChange={(e) => setActBossAvatar(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-rose-200 bg-white text-xs text-center"
                      placeholder="🤖"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-rose-900 uppercase mb-1">Boss Hit Points (HP)</label>
                    <input
                      type="number"
                      value={actBossHp}
                      onChange={(e) => setActBossHp(Number(e.target.value))}
                      className="w-full p-1.5 rounded-lg border border-rose-200 bg-white text-xs font-mono"
                      step={50}
                      min={100}
                    />
                  </div>
                </div>
              )}

              {/* Rewards and Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Reward XP</label>
                  <input
                    type="number"
                    value={actRewardXp}
                    onChange={(e) => setActRewardXp(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs font-mono"
                    min={20}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Reward Coins</label>
                  <input
                    type="number"
                    value={actRewardCoins}
                    onChange={(e) => setActRewardCoins(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs font-mono"
                    min={5}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Estimated Mins</label>
                  <input
                    type="number"
                    value={actDurationMinutes}
                    onChange={(e) => setActDurationMinutes(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-stone-200 text-xs font-mono"
                    min={3}
                  />
                </div>
              </div>

              {/* Question Picker from Bank */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Select Questions Included ({selectedActivityQuestionIds.length} Selected)
                  </label>
                  <span className="text-[10px] text-stone-400">
                    Click items to toggle inclusion
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100 p-1 bg-stone-50/50">
                  {questions
                    .filter(q => actSubject === q.subject || actGrade === q.grade)
                    .map((q) => {
                      const isSelected = selectedActivityQuestionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestionSelection(q.id)}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                            isSelected ? 'bg-blue-50 text-blue-950 font-bold' : 'hover:bg-stone-100 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="cursor-pointer"
                            />
                            <span className="font-mono text-[10px] opacity-75">{q.id}</span>
                            <span className="truncate max-w-sm">{q.prompt}</span>
                          </div>
                          <span className="text-[10px] opacity-60 font-mono">{q.grade}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditActivityModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black cursor-pointer shadow-xs"
                >
                  Save Activity Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
