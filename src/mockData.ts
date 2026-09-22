import { 
  UserAccount, 
  Question, 
  Activity, 
  StudentProgress, 
  ClassRoom, 
  ClassAssignment,
  SchoolOrganization, 
  SubscriptionPlan, 
  Voucher, 
  SubscriptionRecord, 
  AuditLog,
  CurriculumGrade,
  CurriculumSubject,
  CurriculumFramework
} from './types';
import { 
  COMPREHENSIVE_QUESTIONS, 
  COMPREHENSIVE_ACTIVITIES, 
  INITIAL_FRAMEWORKS,
  COUNTRIES,
  COUNTRY_STATE_MAP,
  COUNTRY_CURRICULUM_MAP
} from './data/curriculumData';
import { PRESCHOOL_QUESTIONS, PRESCHOOL_ACTIVITIES } from './data/preschoolMasterQuestions';
import { sanitizeQuestionBank } from './utils/idAndUsernameGenerator';

export { INITIAL_FRAMEWORKS, COUNTRIES, COUNTRY_STATE_MAP, COUNTRY_CURRICULUM_MAP };

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'ADM000001',
    role: 'admin',
    name: 'Alexandra Vance',
    email: 'admin@pforpencil.com',
    username: 'admin',
    password: 'Password@123',
    avatar: '👩‍💼',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    enrolledAt: '2025-01-10',
    status: 'active'
  },
  {
    id: 'CON000001',
    role: 'content_manager',
    name: 'Marcus Sterling',
    email: 'content@pforpencil.com',
    username: 'marcus',
    password: 'Password@123',
    avatar: '👨‍🏫',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    enrolledAt: '2025-02-01',
    status: 'active'
  },
  {
    id: 'SCH000001',
    role: 'school',
    name: 'Oakwood Elementary Academy',
    email: 'principal@oakwood.edu',
    username: 'oakwood',
    password: 'Password@123',
    avatar: '🏫',
    schoolName: 'Oakwood Elementary Academy',
    schoolCode: 'OAK',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    enrolledAt: '2025-03-15',
    status: 'active'
  },
  {
    id: 'SCH000002',
    role: 'school',
    name: 'DAV Public School',
    email: 'principal@davschool.edu',
    username: 'dav_school',
    password: 'Password@123',
    avatar: '🏫',
    schoolName: 'DAV Public School',
    schoolCode: 'DAV',
    country: 'India',
    state: 'Maharashtra',
    curriculum: 'CBSE (Central Board of Secondary Education)',
    enrolledAt: '2025-03-18',
    status: 'active'
  },
  {
    id: 'TEA00001',
    role: 'teacher',
    name: 'Mrs. Sarah Jenkins',
    email: 's.jenkins@oakwood.edu',
    username: 'sarah_jenkins',
    password: 'Password@123',
    avatar: '👩‍🏫',
    organizationId: 'SCH000001',
    schoolName: 'Oakwood Elementary Academy',
    schoolCode: 'OAK',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    grade: 'Grade 1',
    enrolledAt: '2025-03-20',
    status: 'active',
    validUntil: '2026-08-31',
    validityDuration: '365_days'
  },
  {
    id: 'TEA00002',
    role: 'teacher',
    name: 'Mr. David Reynolds',
    email: 'd.reynolds@oakwood.edu',
    username: 'david_reynolds',
    password: 'Password@123',
    avatar: '👨‍🏫',
    organizationId: 'SCH000001',
    schoolName: 'Oakwood Elementary Academy',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    grade: 'Grade 1',
    enrolledAt: '2025-03-25',
    status: 'active',
    validUntil: '2026-08-31',
    validityDuration: '365_days'
  },
  {
    id: 'TEA00003',
    role: 'teacher',
    name: 'Ms. Elena Gomez',
    email: 'e.gomez@oakwood.edu',
    username: 'elena_gomez',
    password: 'Password@123',
    avatar: '👩‍🏫',
    organizationId: 'SCH000001',
    schoolName: 'Oakwood Elementary Academy',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    grade: 'Preschool',
    enrolledAt: '2025-04-01',
    status: 'active',
    validUntil: '2025-12-31',
    validityDuration: '180_days'
  },
  {
    id: 'PAR00001',
    role: 'parent',
    name: 'David Watson',
    email: 'david.watson@gmail.com',
    username: 'david_watson',
    password: 'Password@123',
    avatar: '👨‍👧‍👦',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    studentIds: ['STU00001', 'STU00003'],
    enrolledAt: '2025-04-05',
    status: 'active'
  },
  // Student 1 (Parent linked): EMMWAT1
  {
    id: 'STU00001',
    role: 'student',
    name: 'Emma Watson',
    username: 'EMMWAT1',
    pin: '1234',
    avatar: '🦊',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    parentId: 'PAR00001',
    grade: 'Grade 1',
    enrolledAt: '2025-04-06',
    status: 'active'
  },
  // Student 2 (School linked): HAM0001
  {
    id: 'STU00002',
    role: 'student',
    name: 'Hannah Miller',
    username: 'HAM0001',
    pin: '5678',
    avatar: '🚀',
    organizationId: 'SCH000001',
    schoolName: 'Oakwood Elementary Academy',
    schoolCode: 'OAK',
    teacherId: 'TEA00001',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    grade: 'Grade 1',
    enrolledAt: '2025-03-22',
    status: 'active'
  },
  // Student 3 (Parent second child): LEOWAT2
  {
    id: 'STU00003',
    role: 'student',
    name: 'Leo Watson',
    username: 'LEOWAT2',
    pin: '4321',
    avatar: '🦁',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    parentId: 'PAR00001',
    grade: 'Preschool',
    enrolledAt: '2025-04-10',
    status: 'active'
  },
  // Student 4 (DAV Public School student): DAV0001
  {
    id: 'STU00004',
    role: 'student',
    name: 'Maya Sharma',
    username: 'DAV0001',
    pin: '2222',
    avatar: '🐱',
    organizationId: 'SCH000002',
    schoolName: 'DAV Public School',
    schoolCode: 'DAV',
    country: 'India',
    state: 'Maharashtra',
    curriculum: 'CBSE (Central Board of Secondary Education)',
    grade: 'Grade 2',
    enrolledAt: '2025-04-12',
    status: 'active'
  }
];

const rawInitialQuestions = [...COMPREHENSIVE_QUESTIONS, ...PRESCHOOL_QUESTIONS];
const sanitizedBankResult = sanitizeQuestionBank(rawInitialQuestions);
export const INITIAL_QUESTIONS: Question[] = sanitizedBankResult.questions;
export const QUESTION_ID_MAP: Record<string, string> = sanitizedBankResult.idMap;

export const INITIAL_ACTIVITIES: Activity[] = [...PRESCHOOL_ACTIVITIES, ...COMPREHENSIVE_ACTIVITIES];

export const INITIAL_STUDENT_PROGRESS: Record<string, StudentProgress> = {
  STU00001: {
    studentId: 'STU00001',
    studentUsername: 'EMMWAT1',
    studentName: 'Emma Watson',
    avatar: '🦊',
    grade: 'Preschool',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    schoolOrParent: 'parent',
    parentName: 'David Watson',
    parentId: 'PAR00001',
    level: 7,
    xp: 2850,
    coins: 340,
    streakDays: 14,
    dailyQuizCompletedToday: false,
    totalQuizzesTaken: 48,
    averageScore: 92,
    averageResponseTimeSeconds: 8.4,
    totalQuestionsAttempted: 64,
    subjectMastery: {
      'Mathematics': 94
    },
    skillMastery: {
      '2-Digit Addition with Regrouping': {
        skill: '2-Digit Addition with Regrouping',
        category: 'Numbers & Operations',
        subject: 'Mathematics',
        grade: 'Grade 3',
        totalAttempted: 24,
        correctCount: 23,
        accuracy: 96,
        averageTimeSeconds: 7.8,
        lastPracticed: 'Today'
      },
      'Basic Multiplication Arrays': {
        skill: 'Basic Multiplication Arrays',
        category: 'Numbers & Operations',
        subject: 'Mathematics',
        grade: 'Grade 3',
        totalAttempted: 16,
        correctCount: 15,
        accuracy: 94,
        averageTimeSeconds: 8.1,
        lastPracticed: 'Yesterday'
      },
      'Fractions & Shapes': {
        skill: 'Fractions & Shapes',
        category: 'Fractions & Geometry',
        subject: 'Mathematics',
        grade: 'Grade 3',
        totalAttempted: 12,
        correctCount: 11,
        accuracy: 92,
        averageTimeSeconds: 9.3,
        lastPracticed: '2 days ago'
      },
      'Perimeter and Area Calculation': {
        skill: 'Perimeter and Area Calculation',
        category: 'Measurement & Geometry',
        subject: 'Mathematics',
        grade: 'Grade 3',
        totalAttempted: 12,
        correctCount: 12,
        accuracy: 100,
        averageTimeSeconds: 6.5,
        lastPracticed: '3 days ago'
      }
    },
    recentActivities: [
      { id: 'ACT001', title: 'Daily Sunrise Quiz', type: 'daily_quiz', score: 100, maxScore: 100, timestamp: 'Yesterday, 4:15 PM', averageTimeSeconds: 7.5 },
      { id: 'ACT002', title: 'Math Bubble Pop', type: 'game', score: 85, maxScore: 100, timestamp: '2 days ago', averageTimeSeconds: 8.2 },
      { id: 'ACT004', title: 'Boss Battle: Professor Quizzler', type: 'boss_battle', score: 100, maxScore: 100, timestamp: '3 days ago', averageTimeSeconds: 9.4 }
    ],
    badges: [
      { id: 'B1', name: '14-Day Flame', icon: '🔥', description: 'Maintained a 14 day consecutive daily quiz streak!', unlockedAt: '2025-04-12' },
      { id: 'B2', name: 'Math Prodigy', icon: '➗', description: 'Scored 100% on 10 consecutive math quizzes!', unlockedAt: '2025-04-08' },
      { id: 'B3', name: 'Boss Vanquisher', icon: '⚔️', description: 'Defeated Professor Quizzler in Boss Battle!', unlockedAt: '2025-04-04' },
      { id: 'B4', name: 'Geometry Master', icon: '📐', description: 'Mastered 50 new shape and calculation skills.', unlockedAt: '2025-03-29' }
    ]
  },
  STU00002: {
    studentId: 'STU00002',
    studentUsername: 'HAM0001',
    studentName: 'Hannah Miller',
    avatar: '🚀',
    grade: 'Grade 3',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    schoolOrParent: 'school',
    schoolName: 'Oakwood Elementary Academy',
    level: 6,
    xp: 2200,
    coins: 210,
    streakDays: 8,
    dailyQuizCompletedToday: true,
    totalQuizzesTaken: 36,
    averageScore: 88,
    averageResponseTimeSeconds: 9.6,
    totalQuestionsAttempted: 50,
    subjectMastery: {
      'Mathematics': 90
    },
    skillMastery: {
      '2-Digit Addition with Regrouping': {
        skill: '2-Digit Addition with Regrouping',
        category: 'Numbers & Operations',
        subject: 'Mathematics',
        grade: 'Grade 3',
        totalAttempted: 18,
        correctCount: 16,
        accuracy: 89,
        averageTimeSeconds: 9.1,
        lastPracticed: 'Today'
      },
      'Fractions on a Number Line': {
        skill: 'Fractions on a Number Line',
        category: 'Fractions',
        subject: 'Mathematics',
        grade: 'Grade 3',
        totalAttempted: 15,
        correctCount: 14,
        accuracy: 93,
        averageTimeSeconds: 8.8,
        lastPracticed: 'Yesterday'
      }
    },
    recentActivities: [
      { id: 'ACT001', title: 'Daily Sunrise Quiz', type: 'daily_quiz', score: 100, maxScore: 100, timestamp: 'Today, 9:20 AM', averageTimeSeconds: 8.0 },
      { id: 'ACT003', title: 'Weekly Speed Brain Challenge', type: 'challenge', score: 75, maxScore: 100, timestamp: 'Yesterday', averageTimeSeconds: 11.2 }
    ],
    badges: [
      { id: 'B1', name: '7-Day Streak', icon: '⚡', description: 'Kept the learning spark burning for 7 days!', unlockedAt: '2025-04-10' },
      { id: 'B5', name: 'Math Explorer', icon: '🔢', description: 'Aced all multiplication and geometry challenges.', unlockedAt: '2025-04-02' }
    ]
  },
  STU00003: {
    studentId: 'STU00003',
    studentUsername: 'LEOWAT2',
    studentName: 'Leo Watson',
    avatar: '🦁',
    grade: 'Grade 1',
    country: 'United States',
    state: 'California',
    curriculum: 'US Common Core State Standards (CCSS)',
    schoolOrParent: 'parent',
    parentName: 'David Watson',
    parentId: 'PAR00001',
    level: 3,
    xp: 950,
    coins: 120,
    streakDays: 4,
    dailyQuizCompletedToday: false,
    totalQuizzesTaken: 15,
    averageScore: 85,
    averageResponseTimeSeconds: 6.8,
    totalQuestionsAttempted: 25,
    subjectMastery: {
      'Mathematics': 88
    },
    skillMastery: {
      'Addition Within 20': {
        skill: 'Addition Within 20',
        category: 'Addition & Subtraction',
        subject: 'Mathematics',
        grade: 'Grade 1',
        totalAttempted: 15,
        correctCount: 13,
        accuracy: 87,
        averageTimeSeconds: 6.2,
        lastPracticed: 'Yesterday'
      },
      '2D Shape Recognition': {
        skill: '2D Shape Recognition',
        category: 'Geometry & Shapes',
        subject: 'Mathematics',
        grade: 'Grade 1',
        totalAttempted: 10,
        correctCount: 9,
        accuracy: 90,
        averageTimeSeconds: 5.5,
        lastPracticed: 'Yesterday'
      }
    },
    recentActivities: [
      { id: 'ACT_G1_DAILY', title: 'Grade 1 Daily Number Fun', type: 'daily_quiz', score: 90, maxScore: 100, timestamp: 'Yesterday, 5:30 PM', averageTimeSeconds: 6.8 }
    ],
    badges: [
      { id: 'B6', name: 'Curious Cub', icon: '🐾', description: 'Completed first 10 learning adventures!', unlockedAt: '2025-04-11' }
    ]
  },
  STU00004: {
    studentId: 'STU00004',
    studentUsername: 'DAV0001',
    studentName: 'Maya Sharma',
    avatar: '🐱',
    grade: 'Grade 2',
    country: 'India',
    state: 'Maharashtra',
    curriculum: 'CBSE (Central Board of Secondary Education)',
    schoolOrParent: 'school',
    schoolName: 'DAV Public School',
    level: 4,
    xp: 1350,
    coins: 180,
    streakDays: 6,
    dailyQuizCompletedToday: false,
    totalQuizzesTaken: 22,
    averageScore: 91,
    averageResponseTimeSeconds: 7.9,
    totalQuestionsAttempted: 35,
    subjectMastery: {
      'Mathematics': 92
    },
    skillMastery: {
      '3-Digit Place Value': {
        skill: '3-Digit Place Value',
        category: 'Place Value & Base Ten',
        subject: 'Mathematics',
        grade: 'Grade 2',
        totalAttempted: 14,
        correctCount: 13,
        accuracy: 93,
        averageTimeSeconds: 7.2,
        lastPracticed: 'Today'
      },
      '2-Digit Addition with Regrouping': {
        skill: '2-Digit Addition with Regrouping',
        category: 'Addition & Subtraction',
        subject: 'Mathematics',
        grade: 'Grade 2',
        totalAttempted: 12,
        correctCount: 11,
        accuracy: 92,
        averageTimeSeconds: 8.6,
        lastPracticed: 'Today'
      },
      'Halves and Fourths': {
        skill: 'Halves and Fourths',
        category: 'Fractions & Shapes',
        subject: 'Mathematics',
        grade: 'Grade 2',
        totalAttempted: 9,
        correctCount: 8,
        accuracy: 89,
        averageTimeSeconds: 6.9,
        lastPracticed: 'Yesterday'
      }
    },
    recentActivities: [
      { id: 'ACT_G2_DAILY', title: 'Grade 2 Morning Brain Quest', type: 'daily_quiz', score: 95, maxScore: 100, timestamp: 'Today, 8:40 AM', averageTimeSeconds: 7.4 }
    ],
    badges: [
      { id: 'B1', name: '5-Day Streak', icon: '⚡', description: 'Active student streak at DAV Public School!', unlockedAt: '2025-04-12' },
      { id: 'B2', name: 'Place Value Whiz', icon: '🔢', description: 'Mastered 3-digit place values.', unlockedAt: '2025-04-13' }
    ]
  }
};

export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'CLS_PRE',
    name: 'Preschool Early Explorers',
    grade: 'Preschool',
    teacherId: 'TEA00003',
    teacherName: 'Ms. Elena Gomez',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 92,
    status: 'active',
    room: 'Room E-101',
    activeAssignments: ['Shape Matching Fun', 'Alphabet Sounds Daily']
  },
  {
    id: 'CLS_FND',
    name: 'Foundation Seedlings (Early Years)',
    grade: 'Foundation',
    teacherId: 'TEA00003',
    teacherName: 'Ms. Elena Gomez',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 90,
    status: 'active',
    room: 'Room E-102',
    activeAssignments: ['Number Bonds to 5', 'Phonics & Rhymes']
  },
  {
    id: 'CLS_G1',
    name: 'Class 1-A (Pioneers)',
    grade: 'Grade 1',
    teacherId: 'TEA00001',
    teacherName: 'Mrs. Sarah Jenkins',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 88,
    status: 'active',
    room: 'Room 101',
    activeAssignments: ['Early Addition Sprint']
  },
  {
    id: 'CLS_G2',
    name: 'Class 2-A (Navigators)',
    grade: 'Grade 2',
    teacherId: 'TEA00001',
    teacherName: 'Mrs. Sarah Jenkins',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 87,
    status: 'active',
    room: 'Room 102',
    activeAssignments: ['Story Comprehension Quest']
  },
  {
    id: 'CLS001',
    name: 'Class 3-A (Explorers)',
    grade: 'Grade 3',
    teacherId: 'TEA00001',
    teacherName: 'Mrs. Sarah Jenkins',
    schoolId: 'SCH000001',
    studentIds: ['STU00002'],
    averageScore: 89,
    status: 'active',
    room: 'Room 201',
    activeAssignments: ['Daily Sunrise Quiz', 'Math Bubble Pop']
  },
  {
    id: 'CLS002',
    name: 'Class 3-B (Innovators)',
    grade: 'Grade 3',
    teacherId: 'TEA00001',
    teacherName: 'Mrs. Sarah Jenkins',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 86,
    status: 'active',
    room: 'Room 202',
    activeAssignments: ['Weekly Speed Brain Challenge']
  },
  {
    id: 'CLS_G4',
    name: 'Class 4-A (Pathfinders)',
    grade: 'Grade 4',
    teacherId: 'TEA00002',
    teacherName: 'Mr. David Reynolds',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 91,
    status: 'active',
    room: 'Room 301',
    activeAssignments: ['Fractions & Word Problems']
  },
  {
    id: 'CLS_G5',
    name: 'Class 5-A (Challengers)',
    grade: 'Grade 5',
    teacherId: 'TEA00002',
    teacherName: 'Mr. David Reynolds',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 89,
    status: 'active',
    room: 'Room 302',
    activeAssignments: ['Earth Systems & Ecosystems']
  },
  {
    id: 'CLS_G6',
    name: 'Class 6-A (Scholars)',
    grade: 'Grade 6',
    teacherId: 'TEA00002',
    teacherName: 'Mr. David Reynolds',
    schoolId: 'SCH000001',
    studentIds: [],
    averageScore: 93,
    status: 'active',
    room: 'Room 401',
    activeAssignments: ['Pre-Algebra & Geometry Masters']
  }
];

export const INITIAL_SCHOOL: SchoolOrganization = {
  id: 'SCH000001',
  schoolCode: 'OAK',
  name: 'Oakwood Elementary Academy',
  adminEmail: 'principal@oakwood.edu',
  country: 'United States',
  state: 'California',
  curriculum: 'US Common Core State Standards (CCSS)',
  totalSeats: 500,
  allocatedSeats: 418,
  activeTeachers: 18,
  activeClasses: 16,
  plan: 'Campus 500',
  expiresAt: '2026-08-31',
  contractDuration: 'yearly',
  validityType: 'yearly',
  status: 'active'
};

export const INITIAL_SCHOOL_DAV: SchoolOrganization = {
  id: 'SCH000002',
  schoolCode: 'DAV',
  name: 'DAV Public School',
  adminEmail: 'principal@davschool.edu',
  country: 'India',
  state: 'Maharashtra',
  curriculum: 'CBSE (Central Board of Secondary Education)',
  totalSeats: 1000,
  allocatedSeats: 580,
  activeTeachers: 24,
  activeClasses: 18,
  plan: 'District 1000',
  expiresAt: '2026-12-31',
  contractDuration: 'yearly',
  validityType: 'yearly',
  status: 'active'
};

export const INITIAL_SCHOOLS: SchoolOrganization[] = [INITIAL_SCHOOL, INITIAL_SCHOOL_DAV];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'parent_monthly',
    type: 'parent',
    name: 'Parent Monthly',
    tagline: 'Ideal for continuous family progress & home monitoring',
    price: 9.99,
    interval: 'month',
    features: [
      'Up to 3 Children Accounts',
      'Daily Quizzes & Boss Battles',
      'Full Parent Performance Dashboard',
      'Detailed Subject Mastery Radar',
      'Screen Time & Goal Controls'
    ]
  },
  {
    id: 'parent_annual',
    type: 'parent',
    name: 'Parent Champion Annual',
    tagline: 'Best value for dedicated parents (Save 33%)',
    price: 79.99,
    interval: 'year',
    popular: true,
    features: [
      'Up to 5 Children Accounts',
      'All Subjects (Math, Science, English, Logic)',
      'Unlimited Game Play & Boss Fights',
      'AI Practice Generator & printable worksheets',
      'Priority Parent Support',
      'Lifetime Badge Records'
    ]
  },
  {
    id: 'school_campus',
    type: 'school',
    name: 'School Campus 500',
    tagline: 'Empower an entire elementary school with teacher tools',
    price: 2250,
    interval: 'year',
    seats: 500,
    popular: true,
    features: [
      '500 Student Seat Licenses',
      'Unlimited Teacher Accounts',
      'Curriculum Mapping by Grade & Skill',
      'Classroom Roster & Assignment Engine',
      'School-wide Aggregate Performance Analytics',
      'Dedicated Customer Success Manager'
    ]
  },
  {
    id: 'school_district',
    type: 'school',
    name: 'District Enterprise 1000',
    tagline: 'Custom rollout for school districts & multi-campus networks',
    price: 4100,
    interval: 'year',
    seats: 1000,
    features: [
      '1,000+ Student Seat Licenses',
      'Single Sign-On (Google Classroom & Clever)',
      'Custom Skill Standards Alignment',
      'School Board & District Analytics Portal',
      'Custom School Branded Subdomain'
    ]
  }
];

export const INITIAL_VOUCHERS: Voucher[] = [
  {
    id: 'VOU001',
    code: 'FUNKIDS50',
    discountPercent: 50,
    applicableTo: 'parent',
    maxUses: 500,
    currentUses: 142,
    expiresAt: '2026-12-31',
    active: true
  },
  {
    id: 'VOU002',
    code: 'SCHOOL2026',
    discountAmount: 250,
    applicableTo: 'school',
    maxUses: 50,
    currentUses: 12,
    expiresAt: '2026-09-30',
    active: true
  },
  {
    id: 'VOU003',
    code: 'EARLYBIRD',
    discountPercent: 20,
    applicableTo: 'all',
    maxUses: 1000,
    currentUses: 388,
    expiresAt: '2026-11-15',
    active: true
  }
];

export const INITIAL_SUBSCRIPTION_RECORDS: SubscriptionRecord[] = [
  {
    id: 'SUB-9821',
    accountId: 'SCH000001',
    accountName: 'Oakwood Elementary Academy',
    role: 'school',
    planName: 'Campus 500 (Annual)',
    amount: 2250.00,
    currency: 'USD',
    status: 'active',
    paymentDate: '2025-08-30',
    renewalDate: '2026-08-30',
    voucherUsed: 'SCHOOL2026',
    planDuration: 'annual'
  },
  {
    id: 'SUB-9822',
    accountId: 'PAR00001',
    accountName: 'David Watson',
    role: 'parent',
    planName: 'Parent Champion Annual',
    amount: 79.99,
    currency: 'USD',
    status: 'active',
    paymentDate: '2025-04-05',
    renewalDate: '2026-04-05',
    voucherUsed: 'FUNKIDS50',
    planDuration: 'annual'
  },
  {
    id: 'SUB-9823',
    accountId: 'PAR000002',
    accountName: 'Elena Rostova',
    role: 'parent',
    planName: 'Parent Monthly',
    amount: 9.99,
    currency: 'USD',
    status: 'active',
    paymentDate: '2025-04-12',
    renewalDate: '2025-05-12',
    planDuration: 'monthly'
  },
  {
    id: 'SUB-9824',
    accountId: 'PAR000003',
    accountName: 'Marcus Bell',
    role: 'parent',
    planName: 'Parent Monthly',
    amount: 9.99,
    currency: 'USD',
    status: 'expired',
    paymentDate: '2025-02-10',
    renewalDate: '2025-03-10',
    planDuration: 'monthly'
  },
  {
    id: 'SUB-9825',
    accountId: 'SCH000002',
    accountName: 'St. Jude International School',
    role: 'school',
    planName: 'Basic 100 (Annual)',
    amount: 499.00,
    currency: 'USD',
    status: 'expired',
    paymentDate: '2024-03-01',
    renewalDate: '2025-03-01',
    planDuration: 'annual'
  },
  {
    id: 'SUB-9826',
    accountId: 'PAR000004',
    accountName: 'Samantha Cruz',
    role: 'parent',
    planName: 'Parent 14-Day Free Trial',
    amount: 0.00,
    currency: 'USD',
    status: 'trial',
    paymentDate: '2025-04-10',
    renewalDate: '2025-04-24',
    planDuration: 'monthly'
  }
];

export const INITIAL_GRADES: CurriculumGrade[] = [
  { id: 'GRD_PRE', name: 'Preschool', ageGroup: '3-4 Years', description: 'Early number sense, counting 1 to 5, shape recognition, sorting & visual patterns', icon: '🧸', active: true },
  { id: 'GRD_FND', name: 'Foundation', ageGroup: '4-5 Years', description: 'Early years foundation, number bonds to 10, simple counting, shapes & size comparisons', icon: '🌱', active: true },
  { id: 'GRD_G1', name: 'Grade 1', ageGroup: '5-6 Years', description: 'Addition and subtraction within 20, place value, 2D/3D geometry & length measurement', icon: '🎒', active: true },
  { id: 'GRD_G2', name: 'Grade 2', ageGroup: '6-7 Years', description: 'Skip counting, 2-digit addition and subtraction, word problems & basic time/money', icon: '🚀', active: true },
  { id: 'GRD_G3', name: 'Grade 3', ageGroup: '7-8 Years', description: 'Multiplication & division foundations, fractions, area & perimeter, data graphs', icon: '⭐', active: true },
  { id: 'GRD_G4', name: 'Grade 4', ageGroup: '8-9 Years', description: 'Multi-digit operations, decimal concepts, equivalent fractions, angles & lines', icon: '🏆', active: true },
  { id: 'GRD_G5', name: 'Grade 5', ageGroup: '9-10 Years', description: 'Fraction arithmetic, volume, coordinates, decimals & algebraic thinking', icon: '🎯', active: true },
  { id: 'GRD_G6', name: 'Grade 6', ageGroup: '10-11 Years', description: 'Ratios, proportions, negative numbers, expressions & statistical thinking', icon: '👑', active: true },
];

export const INITIAL_SUBJECTS: CurriculumSubject[] = [
  { id: 'SUB_MTH', name: 'Mathematics', icon: '➗', color: 'blue', category: 'STEM', description: 'Numbers, early arithmetic, shapes, geometry & math quests', active: true },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2025-04-14 10:14:02',
    accountId: 'ADM000001',
    accountName: 'Alexandra Vance',
    role: 'admin',
    action: 'CREATE_VOUCHER',
    details: 'Created voucher code FUNKIDS50 (50% off for parents)',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'LOG-002',
    timestamp: '2025-04-14 09:30:18',
    accountId: 'TEA00001',
    accountName: 'Mrs. Sarah Jenkins',
    role: 'teacher',
    action: 'ASSIGN_ACTIVITY',
    details: 'Assigned "Daily Sunrise Quiz" to Class 3-A (Explorers)',
    ipAddress: '10.0.4.12'
  },
  {
    id: 'LOG-003',
    timestamp: '2025-04-14 09:20:45',
    accountId: 'STU00002',
    accountName: 'Hannah Miller (HAM0001)',
    role: 'student',
    action: 'QUIZ_COMPLETED',
    details: 'Completed Daily Sunrise Quiz with score 100%',
    ipAddress: '10.0.4.55'
  },
  {
    id: 'LOG-004',
    timestamp: '2025-04-13 16:45:10',
    accountId: 'CON000001',
    accountName: 'Marcus Sterling',
    role: 'content_manager',
    action: 'PUBLISH_QUESTION',
    details: 'Added Question QG3-0012 to Mathematics Grade 3',
    ipAddress: '192.168.1.44'
  },
  {
    id: 'LOG-005',
    timestamp: '2025-04-13 15:22:00',
    accountId: 'PAR00001',
    accountName: 'David Watson',
    role: 'parent',
    action: 'UPDATE_SCREEN_TIME',
    details: 'Configured 45-min daily learning goal for Emma Watson',
    ipAddress: '72.14.201.8'
  }
];

export const INITIAL_ASSIGNMENTS: ClassAssignment[] = [
  {
    id: 'ASG-001',
    title: 'Multiplication & Fractions Sprint',
    classId: 'CLS001',
    className: 'Class 3-A (Explorers)',
    subject: 'Mathematics',
    grade: 'Grade 3',
    questionIds: ['QG3-0001', 'QG3-0002'],
    dueDate: '2025-04-20',
    status: 'active',
    createdAt: '2025-04-12'
  },
  {
    id: 'ASG-002',
    title: 'Geometry & 3D Shapes Quest',
    classId: 'CLS001',
    className: 'Class 3-A (Explorers)',
    subject: 'Mathematics',
    grade: 'Grade 3',
    questionIds: ['QG3-0003', 'QG3-0004'],
    dueDate: '2025-04-22',
    status: 'active',
    createdAt: '2025-04-14'
  }
];

