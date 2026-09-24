export type UserRole = 'admin' | 'content_manager' | 'school' | 'teacher' | 'parent' | 'student';

export interface UserAccount {
  id: string; // ADM00001, CON00001, SCH000001, TEA00001, PAR00001, STU00001
  role: UserRole;
  name: string;
  email?: string;
  username?: string; // e.g. HAM0001 (School student) or EMMWAT1 (Parent student)
  pin?: string; // 4-digit PIN for students
  password?: string; // Password for adults / student accounts
  avatar: string;
  country?: string; // e.g. 'United States', 'United Kingdom', 'India', 'Canada', 'Australia'
  state?: string; // e.g. 'California', 'Texas', 'England', 'Maharashtra', 'Ontario'
  curriculum?: string; // e.g. 'US Common Core State Standards (CCSS)', 'UK National Curriculum'
  organizationId?: string; // For teacher/student linked to School
  schoolCode?: string; // e.g. DPS, OAK
  teacherId?: string; // For student linked to Teacher
  parentId?: string; // For child linked to Parent
  parentName?: string; // Name of parent for display
  studentIds?: string[]; // For parent or teacher linked students
  grade?: string;
  schoolName?: string;
  enrolledAt: string;
  status: 'active' | 'pending' | 'suspended';
  phone?: string;
  validUntil?: string; // e.g. '2026-09-14'
  validityDuration?: '30_days' | '90_days' | '180_days' | '365_days' | '730_days' | 'lifetime' | string;
  planName?: string; // e.g. 'Annual Family Pass', 'Quarterly Access'
}

export type Subject = 
  | 'Mathematics'
  | string;

export type GradeLevel = 
  | 'Preschool' 
  | 'Foundation'
  | 'Grade 1' 
  | 'Grade 2' 
  | 'Grade 3' 
  | 'Grade 4' 
  | 'Grade 5' 
  | 'Grade 6'
  | string;

export interface CurriculumGrade {
  id: string;
  name: string;
  ageGroup: string;
  description: string;
  icon: string;
  active: boolean;
}

export interface CurriculumSubject {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  description: string;
  active: boolean;
}

export type QuestionType =
  | 'multiple_choice'
  | 'single_choice'
  | 'radio_single'
  | 'fill_blank'
  | 'open_box'
  | 'true_false'
  | 'image_choice'
  | 'image_mcq'
  | 'select_objects'
  | 'drag_and_drop'
  | 'match_making'
  | 'ordering'
  | 'sorting'
  | 'number_line'
  | 'clock'
  | 'data_graph'
  | 'word_problem'
  | 'interactive';

export interface CurriculumFramework {
  id: string;
  country: string;
  state: string;
  curriculumName: string; // e.g. CBSE, ICSE, US Common Core, UK National, IB PYP, Cambridge Primary
  description: string;
  active: boolean;
}

export type VisualQuestionTemplate =
  | 'none'
  | 'picture_counting'
  | 'picture_choice'
  | 'drag_drop'
  | 'matching'
  | 'sorting'
  | 'ordering'
  | 'pattern'
  | 'number_line'
  | 'interactive_story';

export type VisualAnimation = 'none' | 'bounce' | 'float' | 'pulse' | 'wiggle' | 'pop' | 'spin';

export interface VisualQuestionConfig {
  enabled: boolean;
  template?: VisualQuestionTemplate;
  animation?: VisualAnimation;
  interaction?: 'tap' | 'drag' | 'match' | 'sort' | 'order' | 'count' | 'none';
  visualInstructions?: string;
  imageUrl?: string;
  audioUrl?: string;
  objects?: { id: string; label: string; emoji?: string; imageUrl?: string; count?: number; target?: string }[];
  background?: 'none' | 'soft' | 'playful';
  autoPlay?: boolean;
}

export interface Question {
  id: string; // QPRE-0001, QFND-0001, QG1-0001, QG3-0001...
  subject: Subject;
  grade: GradeLevel;
  category: string;
  skill: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  correctIndices?: number[]; // For multiple_choice questions with 1 or more correct answers
  explanation: string;
  hint?: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type?: QuestionType;
  country?: string; // e.g. 'Global', 'India', 'United States', 'United Kingdom'
  state?: string; // e.g. 'All States / Central', 'Delhi', 'California', 'Texas'
  curriculum?: string; // e.g. 'CBSE', 'ICSE', 'Common Core (US)', 'National Curriculum (UK)', 'IB PYP'
  countryId?: string;
  regionId?: string;
  curriculumId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  categoryCode?: string;
  skillId?: string;
  skillCode?: string;
  curriculumReference?: string;
  status?: 'Draft' | 'Published' | 'Archived' | string;
  visualClipart?: string; // e.g. '🍎🍎 + 🍎🍎' or '🐶 🦁 🐻'
  visualConfig?: VisualQuestionConfig; // Optional visual/animated layer; existing questions remain compatible
  mediaUrl?: string; // e.g. URL to a GIF, WebP animation, video, or Lottie JSON
  imageCards?: { text: string; image: string }[];
  matchPairs?: { left: string; right: string }[];
  dragItems?: { item: string; target: string }[];
  orderSequence?: string[];
  sortBuckets?: { bucketName: string; items: string[] }[];
  openBoxAnswer?: string; // e.g. '4'
  schoolId?: string; // If set, strictly visible ONLY to this school's teachers and students
  schoolName?: string;
  createdBy?: string; // User ID of creator (e.g. TEA00001)
  creatorName?: string;
  createdRole?: UserRole;
  isCustom?: boolean; // True if custom created by teacher
}

export type ActivityType = 'daily_quiz' | 'game' | 'challenge' | 'boss_battle';

export type RecurrenceType = 'daily' | 'weekly' | 'permanent' | 'challenge';

export type ActivityFormat =
  | 'question_run'
  | 'drag_drop'
  | 'matching'
  | 'memory'
  | 'sorting'
  | 'ordering'
  | 'pattern'
  | 'story'
  | 'arcade'
  | 'balloon_pop'
  | 'space_blaster'
  | 'quiz_game'
  | 'feeding_game';

export type ActivityStatus = 'Draft' | 'Published' | 'Archived';

export type ActivityStepType = 'question' | 'game_task';

export interface ActivityGameTask {
  id: string;
  title: string;
  instruction: string;
  mechanic: ActivityFormat;
  items?: { id: string; label: string; emoji?: string; target?: string; imageUrl?: string }[];
  targets?: { id: string; label: string; emoji?: string }[];
  correctOrder?: string[];
  correctMatches?: { itemId: string; targetId: string }[];
  targetCount?: number;
  visualConfig?: VisualQuestionConfig;
  rewardPoints?: number;
  questionId?: string; // Optional Question Bank content linked to this game task
}

export interface ActivityStep {
  id: string;
  type: ActivityStepType;
  questionId?: string;
  gameTask?: ActivityGameTask;
}

export interface Activity {
  id: string;
  type: ActivityType; // Legacy activity archetype; retained for backward compatibility.
  title: string;
  description: string;
  subject: Subject;
  grade: GradeLevel; // Legacy primary grade; use grades for new activities.
  grades?: GradeLevel[];
  format?: ActivityFormat;
  status?: ActivityStatus;
  thumbnailUrl?: string;
  instructions?: string;
  learningTags?: string[];
  country?: string; // Legacy only; interactive activities do not require regional mapping.
  state?: string;
  curriculum?: string;
  category?: string;
  skill?: string;
  questionIds: string[];
  steps?: ActivityStep[];
  rewardXP: number;
  rewardCoins: number;
  durationMinutes: number;
  timerEnabled?: boolean;
  scoreEnabled?: boolean;
  starsEnabled?: boolean;
  soundEnabled?: boolean;
  animationEnabled?: boolean;
  bossName?: string;
  bossAvatar?: string;
  bossHp?: number;
  unlocked: boolean;
  recurrence?: RecurrenceType;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  activeDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ActivityMasterRecord = Omit<Activity, 'questionIds' | 'steps'>;

export interface ActivityDatabase {
  // Activity master contains metadata only. Questions and steps live in their own tables below.
  activities: ActivityMasterRecord[];
  activitySteps: { activityId: string; stepId: string; orderIndex: number; type: ActivityStepType; questionId?: string; gameTask?: ActivityGameTask }[];
  activityQuestionLinks: { activityId: string; questionId: string; orderIndex: number }[];
  activityAttempts: { id: string; activityId: string; studentId?: string; startedAt: string; completedAt?: string; score?: number; maxScore?: number; stars?: number; xpEarned?: number; coinsEarned?: number; status: 'started' | 'completed' | 'abandoned' }[];
  activityStepResults: { id: string; attemptId: string; activityId: string; stepId: string; questionId?: string; correct?: boolean; points?: number; timeTakenSeconds?: number }[];
}

export interface SkillMasteryRecord {
  skill: string;
  category: string;
  subject: Subject;
  grade?: GradeLevel;
  totalAttempted: number;
  correctCount: number;
  accuracy: number; // 0 - 100%
  averageTimeSeconds: number; // e.g. 8.4 seconds
  lastPracticed?: string;
}

export interface StudentProgress {
  studentId: string;
  studentUsername: string;
  studentName: string;
  avatar: string;
  grade: GradeLevel;
  country?: string;
  state?: string;
  curriculum?: string;
  schoolOrParent: 'school' | 'parent';
  organizationId?: string; // Links student to SchoolOrganization ID
  schoolName?: string;
  schoolCode?: string; // e.g. DPS, OAK
  teacherId?: string; // Links student to Teacher ID
  parentName?: string;
  parentId?: string;
  level: number;
  xp: number;
  coins: number;
  streakDays: number;
  dailyQuizCompletedToday: boolean;
  totalQuizzesTaken: number;
  averageScore: number;
  subjectMastery: Record<Subject, number>; // 0 to 100%
  skillMastery?: Record<string, SkillMasteryRecord>;
  averageResponseTimeSeconds?: number;
  totalQuestionsAttempted?: number;
  recentActivities: {
    id: string;
    title: string;
    type: ActivityType;
    score: number;
    maxScore: number;
    timestamp: string;
    averageTimeSeconds?: number;
  }[];
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
    unlockedAt: string;
  }[];
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: GradeLevel;
  section?: string;
  room?: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  studentIds: string[];
  averageScore: number;
  activeAssignments: string[];
  status?: 'active' | 'inactive';
  description?: string;
}

export interface ClassAssignment {
  id: string;
  title: string;
  classId: string;
  className: string;
  subject: Subject;
  grade: GradeLevel;
  questionIds: string[];
  dueDate: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface SchoolOrganization {
  id: string; // SCH000001
  schoolCode?: string; // e.g. DPS, OAK (deterministic uppercase code)
  name: string;
  adminEmail: string;
  country?: string;
  state?: string;
  curriculum?: string;
  totalSeats: number;
  allocatedSeats: number;
  activeTeachers: number;
  activeClasses: number;
  plan: 'Basic 100' | 'Campus 500' | 'District 1000' | string;
  expiresAt: string;
  contractDuration?: 'monthly' | 'yearly' | '1_semester' | '1_year' | '2_years' | '3_years' | string;
  validityType?: 'monthly' | 'yearly';
  status: 'active' | 'expiring_soon' | 'inactive';
}

export interface SubscriptionPlan {
  id: string;
  type: 'parent' | 'school';
  name: string;
  tagline: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  seats?: number;
  studentCount?: number; // e.g. 1, 2, 3, or more students for individual/family
  currency?: string;
  active?: boolean;
  popular?: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  discountType?: 'percentage' | 'flat';
  discountValue?: number; // e.g. 20 for 20% or 15 for $15
  discountPercent?: number; // backwards compatibility
  discountAmount?: number; // backwards compatibility
  applicableTo: 'parent' | 'school' | 'all';
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  validityDuration?: '30_days' | '90_days' | '180_days' | '365_days' | 'lifetime';
  active: boolean;
}

export interface SubscriptionRecord {
  id: string;
  accountId: string;
  accountName: string;
  role: 'parent' | 'school';
  planName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'refunded' | 'active' | 'expired' | 'canceled' | 'trial';
  paymentDate: string;
  renewalDate: string;
  voucherUsed?: string;
  planDuration?: 'monthly' | 'annual';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  accountId: string;
  accountName: string;
  role: UserRole;
  action: string;
  details: string;
  ipAddress: string;
}
