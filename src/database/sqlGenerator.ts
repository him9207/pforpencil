import { UserAccount, Question, Activity, SchoolOrganization, ClassRoom, StudentProgress, CurriculumFramework } from '../types';

/**
 * Escapes single quotes for SQL string literals
 */
function sqlStr(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Encodes JSON objects safely as PostgreSQL JSONB literals
 */
function sqlJson(val: any): string {
  if (val === null || val === undefined) return "'[]'::jsonb";
  const jsonStr = JSON.stringify(val).replace(/'/g, "''");
  return `'${jsonStr}'::jsonb`;
}

/**
 * Formats numbers or NULL
 */
function sqlNum(val: number | null | undefined, defaultVal: number = 0): string {
  if (val === null || val === undefined || isNaN(Number(val))) return String(defaultVal);
  return String(val);
}

/**
 * Formats booleans
 */
function sqlBool(val: boolean | null | undefined, defaultVal: boolean = true): string {
  if (val === null || val === undefined) return defaultVal ? 'TRUE' : 'FALSE';
  return val ? 'TRUE' : 'FALSE';
}

/**
 * Generates the complete DDL schema + RLS policies
 */
export function getCompleteSupabaseSchemaSql(): string {
  return `-- =========================================================
-- PFORPENCIL: Supabase PostgreSQL Complete Schema & RLS Setup
-- Multi-Role Education Platform (Admin, School, Teacher, Parent, Student)
-- =========================================================

-- Enable standard UUID generator
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- 1. Organizations / Schools Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(32) PRIMARY KEY, -- e.g. SCH000001
  name TEXT NOT NULL,
  school_code VARCHAR(32),
  admin_email TEXT NOT NULL,
  country VARCHAR(100) DEFAULT 'United States',
  state VARCHAR(100) DEFAULT 'California',
  curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)',
  total_seats INT DEFAULT 500,
  allocated_seats INT DEFAULT 0,
  plan TEXT DEFAULT 'Campus 500',
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add columns if schools table already existed
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS school_code VARCHAR(32);
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States';
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'California';
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)';
ALTER TABLE IF EXISTS schools ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- -------------------------------------------------------------
-- 2. Profiles / User Accounts Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(32) PRIMARY KEY, -- ADM000001, SCH000001, TEA00001, PAR00001, STU00001
  role VARCHAR(32) NOT NULL, -- 'admin', 'content_manager', 'school', 'teacher', 'parent', 'student'
  name TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE, -- e.g. HAM0001, EMMWAT1
  password TEXT, -- Encrypted or plain hash credential
  pin_hash TEXT, -- 4-digit PIN for students
  avatar TEXT DEFAULT '🦊',
  grade TEXT, -- 'Preschool', 'Foundation', 'Grade 1'...'Grade 6'
  country VARCHAR(100) DEFAULT 'United States',
  state VARCHAR(100) DEFAULT 'California',
  curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)',
  school_id VARCHAR(32) REFERENCES schools(id) ON DELETE SET NULL,
  school_name TEXT,
  school_code VARCHAR(32),
  parent_id VARCHAR(32),
  parent_name TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add columns if profiles already existed
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'California';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150) DEFAULT 'US Common Core (CCSS)';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS school_id VARCHAR(32);
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS school_code VARCHAR(32);
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS parent_id VARCHAR(32);
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Optional legacy users table compatibility
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) PRIMARY KEY,
  role VARCHAR(32) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  username TEXT,
  avatar TEXT DEFAULT '👤',
  pin TEXT,
  grade TEXT,
  school_name TEXT,
  organization_id VARCHAR(32),
  country VARCHAR(100),
  state VARCHAR(100),
  curriculum VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 3. Classroom Structures
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(32) PRIMARY KEY, -- e.g. CLS001
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  teacher_id VARCHAR(32) REFERENCES profiles(id) ON DELETE SET NULL,
  teacher_name TEXT,
  school_id VARCHAR(32) REFERENCES schools(id) ON DELETE CASCADE,
  student_ids JSONB DEFAULT '[]'::jsonb,
  average_score NUMERIC(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS classes ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE IF EXISTS classes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- -------------------------------------------------------------
-- 4. Curriculum Frameworks Directory
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curriculum_frameworks (
  id VARCHAR(32) PRIMARY KEY, -- e.g. 'FW_CBSE', 'FW_US_CC'
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  curriculum_name VARCHAR(150) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4b. Category Masters (Hierarchical Taxonomies)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS category_masters (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  curriculum_id VARCHAR(32) NOT NULL,
  subject_id VARCHAR(32) NOT NULL,
  grade_id VARCHAR(32),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4c. Skill Masters (Learning Skills & Objectives)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_masters (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  grade_id VARCHAR(32) NOT NULL,
  name TEXT NOT NULL,
  curriculum_reference TEXT,
  learning_objective TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 5. Curriculum Questions (Question Bank)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(32) PRIMARY KEY, -- QANIM-0001, QG1-0001
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  skill TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT,
  hint TEXT,
  points INT DEFAULT 10,
  difficulty VARCHAR(20) DEFAULT 'Medium',
  country VARCHAR(100) DEFAULT 'Global',
  state VARCHAR(100) DEFAULT 'All States',
  curriculum VARCHAR(150),
  media_url TEXT,
  visual_clipart TEXT,
  school_id VARCHAR(32),
  created_by VARCHAR(32),
  status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) DEFAULT 'multiple_choice';
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS hint TEXT;
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Global';
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT 'All States';
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS curriculum VARCHAR(150);
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS visual_clipart TEXT;
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS school_id VARCHAR(32);
ALTER TABLE IF EXISTS questions ADD COLUMN IF NOT EXISTS created_by VARCHAR(32);

-- -------------------------------------------------------------
-- 6. Interactive Activities (Dedicated Activities Master)
-- -------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS activity_id_seq;

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(32) PRIMARY KEY, -- ACT000001
  title TEXT NOT NULL,
  type VARCHAR(32) NOT NULL,
  format VARCHAR(32) NOT NULL DEFAULT 'question_run',
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  grades JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  instructions TEXT,
  learning_tags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'Draft',
  difficulty VARCHAR(20) DEFAULT 'Easy',
  reward_xp INT DEFAULT 50,
  reward_coins INT DEFAULT 20,
  duration_minutes INT DEFAULT 10,
  timer_enabled BOOLEAN DEFAULT TRUE,
  score_enabled BOOLEAN DEFAULT TRUE,
  stars_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  animation_enabled BOOLEAN DEFAULT TRUE,
  unlocked BOOLEAN DEFAULT FALSE,
  recurrence VARCHAR(20) DEFAULT 'permanent',
  country VARCHAR(100) DEFAULT 'Global',
  state VARCHAR(100) DEFAULT 'All States',
  curriculum VARCHAR(150),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity steps
CREATE TABLE IF NOT EXISTS activity_steps (
  id VARCHAR(80) PRIMARY KEY,
  activity_id VARCHAR(32) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  step_type VARCHAR(20) NOT NULL,
  question_id VARCHAR(64) REFERENCES questions(id) ON DELETE SET NULL,
  game_task JSONB,
  UNIQUE(activity_id, order_index)
);

-- Reusable question links
CREATE TABLE IF NOT EXISTS activity_question_links (
  activity_id VARCHAR(32) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY(activity_id, question_id)
);

-- -------------------------------------------------------------
-- 7. Student Progress & Gamification
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_progress (
  student_id VARCHAR(32) PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  coins INT DEFAULT 0,
  level INT DEFAULT 1,
  current_streak_days INT DEFAULT 0,
  total_quizzes_taken INT DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0,
  subject_mastery JSONB DEFAULT '{}'::jsonb,
  unlocked_badges JSONB DEFAULT '[]'::jsonb,
  recent_activities JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 8. Activity Attempts (Quiz Submissions & Attempts)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(32) NOT NULL,
  activity_id VARCHAR(64),
  score INT NOT NULL,
  total_questions INT NOT NULL,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  speed_bonus_earned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed result per activity step
CREATE TABLE IF NOT EXISTS activity_step_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES activity_attempts(id) ON DELETE CASCADE,
  activity_id VARCHAR(32) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  step_id VARCHAR(80) NOT NULL,
  question_id VARCHAR(64) REFERENCES questions(id) ON DELETE SET NULL,
  correct BOOLEAN,
  points INT DEFAULT 0,
  time_taken_seconds NUMERIC(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 8b. Class Assignments
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id VARCHAR(32) PRIMARY KEY, -- ASN001
  title TEXT NOT NULL,
  class_id VARCHAR(32) REFERENCES classes(id) ON DELETE CASCADE,
  class_name TEXT,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  question_ids JSONB DEFAULT '[]'::jsonb,
  due_date TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 8c. Audit Logs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TEXT NOT NULL,
  account_id VARCHAR(32) NOT NULL,
  account_name TEXT,
  role VARCHAR(32),
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 8d. Vouchers (Discounts & Codes)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
  id VARCHAR(32) PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  discount_type VARCHAR(20) DEFAULT 'percentage',
  discount_value NUMERIC(10,2) DEFAULT 0,
  applicable_to VARCHAR(20) DEFAULT 'all',
  max_uses INT DEFAULT 100,
  current_uses INT DEFAULT 0,
  expires_at TEXT,
  validity_duration VARCHAR(32),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 8e. Subscriptions & Billing Records
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  account_id VARCHAR(32) NOT NULL,
  account_name TEXT,
  role VARCHAR(32),
  plan_name TEXT,
  amount NUMERIC(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'paid',
  payment_date TEXT,
  renewal_date TEXT,
  voucher_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 9. Row Level Security (RLS) & Anon Access Policies
-- Allows the client app with the anon public key to read and write
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS curriculum_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS category_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skill_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_question_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_step_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_schools" ON schools;
CREATE POLICY "anon_all_schools" ON schools FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_profiles" ON profiles;
CREATE POLICY "anon_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_users" ON users;
CREATE POLICY "anon_all_users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_classes" ON classes;
CREATE POLICY "anon_all_classes" ON classes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_curriculum" ON curriculum_frameworks;
CREATE POLICY "anon_all_curriculum" ON curriculum_frameworks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_category_masters" ON category_masters;
CREATE POLICY "anon_all_category_masters" ON category_masters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_skill_masters" ON skill_masters;
CREATE POLICY "anon_all_skill_masters" ON skill_masters FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_questions" ON questions;
CREATE POLICY "anon_all_questions" ON questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activities" ON activities;
CREATE POLICY "anon_all_activities" ON activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activity_steps" ON activity_steps;
CREATE POLICY "anon_all_activity_steps" ON activity_steps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activity_question_links" ON activity_question_links;
CREATE POLICY "anon_all_activity_question_links" ON activity_question_links FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activity_attempts" ON activity_attempts;
CREATE POLICY "anon_all_activity_attempts" ON activity_attempts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activity_step_results" ON activity_step_results;
CREATE POLICY "anon_all_activity_step_results" ON activity_step_results FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_student_progress" ON student_progress;
CREATE POLICY "anon_all_student_progress" ON student_progress FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_assignments" ON assignments;
CREATE POLICY "anon_all_assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_audit_logs" ON audit_logs;
CREATE POLICY "anon_all_audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_vouchers" ON vouchers;
CREATE POLICY "anon_all_vouchers" ON vouchers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_subscriptions" ON subscriptions;
CREATE POLICY "anon_all_subscriptions" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
`;
}

/**
 * Generates SQL INSERT statements for all initial data
 */
export function getCompleteSupabaseSeedSql(
  users: UserAccount[],
  questions: Question[],
  activities: Activity[],
  schools?: SchoolOrganization[],
  classes?: ClassRoom[],
  studentProgressMap?: Record<string, StudentProgress>,
  frameworks?: CurriculumFramework[]
): string {
  const lines: string[] = [
    '-- =========================================================',
    '-- PFORPENCIL: Initial Data Population (Seed Records)',
    '-- =========================================================\n'
  ];

  // 1. Schools
  const schoolList: SchoolOrganization[] = (schools && schools.length > 0)
    ? schools
    : users.filter(u => u.role === 'school').map(u => ({
        id: u.id,
        name: u.schoolName || u.name,
        schoolCode: u.schoolCode || 'SCH',
        adminEmail: u.email || 'admin@school.edu',
        country: u.country || 'United States',
        state: u.state || 'California',
        curriculum: u.curriculum || 'US Common Core (CCSS)',
        totalSeats: 500,
        allocatedSeats: 0,
        activeTeachers: 5,
        activeClasses: 2,
        plan: 'Campus 500',
        expiresAt: '2026-12-31',
        status: 'active' as const
      }));

  if (schoolList.length > 0) {
    lines.push('-- 1. Schools Seed Data');
    lines.push('INSERT INTO schools (id, name, school_code, admin_email, country, state, curriculum, total_seats, allocated_seats, plan, status)');
    lines.push('VALUES');
    const schoolVals = schoolList.map(s => 
      `  (${sqlStr(s.id)}, ${sqlStr(s.name)}, ${sqlStr(s.schoolCode || 'SCH')}, ${sqlStr(s.adminEmail || 'admin@school.edu')}, ${sqlStr(s.country || 'United States')}, ${sqlStr(s.state || 'California')}, ${sqlStr(s.curriculum || 'US Common Core (CCSS)')}, ${sqlNum(s.totalSeats, 500)}, ${sqlNum(s.allocatedSeats, 0)}, ${sqlStr(s.plan || 'Campus 500')}, ${sqlStr(s.status || 'active')})`
    );
    lines.push(schoolVals.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, school_code = EXCLUDED.school_code, country = EXCLUDED.country, state = EXCLUDED.state, curriculum = EXCLUDED.curriculum;\n');
  }

  // 2. Profiles
  if (users.length > 0) {
    lines.push('-- 2. User Profiles Seed Data');
    lines.push('INSERT INTO profiles (id, role, name, email, username, pin_hash, avatar, grade, country, state, curriculum, school_id, school_name, school_code, parent_id, parent_name, status)');
    lines.push('VALUES');
    const profileVals = users.map(u => {
      const sId = u.organizationId || (u.role === 'school' ? u.id : null);
      return `  (${sqlStr(u.id)}, ${sqlStr(u.role)}, ${sqlStr(u.name)}, ${sqlStr(u.email || null)}, ${sqlStr(u.username || null)}, ${sqlStr(u.pin || null)}, ${sqlStr(u.avatar || '🦊')}, ${sqlStr(u.grade || null)}, ${sqlStr(u.country || 'United States')}, ${sqlStr(u.state || 'California')}, ${sqlStr(u.curriculum || 'US Common Core (CCSS)')}, ${sqlStr(sId)}, ${sqlStr(u.schoolName || null)}, ${sqlStr(u.schoolCode || null)}, ${sqlStr(u.parentId || null)}, ${sqlStr(u.parentName || null)}, ${sqlStr(u.status || 'active')})`;
    });
    lines.push(profileVals.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, email = EXCLUDED.email, username = EXCLUDED.username, avatar = EXCLUDED.avatar, grade = EXCLUDED.grade, country = EXCLUDED.country, state = EXCLUDED.state, curriculum = EXCLUDED.curriculum, school_id = EXCLUDED.school_id, school_name = EXCLUDED.school_name, status = EXCLUDED.status;\n');
  }

  // 3. Curriculum Frameworks
  if (frameworks && frameworks.length > 0) {
    lines.push('-- 3. Curriculum Frameworks Seed Data');
    lines.push('INSERT INTO curriculum_frameworks (id, country, state, curriculum_name, description, active)');
    lines.push('VALUES');
    const fwVals = frameworks.map(f => 
      `  (${sqlStr(f.id)}, ${sqlStr(f.country)}, ${sqlStr(f.state)}, ${sqlStr(f.curriculumName)}, ${sqlStr(f.description || null)}, ${sqlBool(f.active, true)})`
    );
    lines.push(fwVals.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET country = EXCLUDED.country, state = EXCLUDED.state, curriculum_name = EXCLUDED.curriculum_name, description = EXCLUDED.description;\n');
  }

  // 4. Classes
  if (classes && classes.length > 0) {
    lines.push('-- 4. Classrooms Seed Data');
    lines.push('INSERT INTO classes (id, name, grade, teacher_id, teacher_name, school_id, student_ids, average_score, status)');
    lines.push('VALUES');
    const classVals = classes.map(c => 
      `  (${sqlStr(c.id)}, ${sqlStr(c.name)}, ${sqlStr(c.grade)}, ${sqlStr(c.teacherId || null)}, ${sqlStr(c.teacherName || null)}, ${sqlStr(c.schoolId || null)}, ${sqlJson(c.studentIds || [])}, ${sqlNum(c.averageScore, 0)}, ${sqlStr(c.status || 'active')})`
    );
    lines.push(classVals.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, grade = EXCLUDED.grade, teacher_id = EXCLUDED.teacher_id, teacher_name = EXCLUDED.teacher_name, student_ids = EXCLUDED.student_ids, average_score = EXCLUDED.average_score;\n');
  }

  // 5. Questions
  if (questions.length > 0) {
    lines.push('-- 5. Question Bank Seed Data');
    lines.push('INSERT INTO questions (id, grade, subject, category, skill, question_type, prompt, options, correct_index, explanation, hint, points, difficulty, country, state, curriculum, media_url, visual_clipart, school_id, status)');
    lines.push('VALUES');
    const questionVals = questions.map(q => 
      `  (${sqlStr(q.id)}, ${sqlStr(q.grade)}, ${sqlStr(q.subject)}, ${sqlStr(q.category)}, ${sqlStr(q.skill || q.category)}, ${sqlStr(q.type || 'multiple_choice')}, ${sqlStr(q.prompt)}, ${sqlJson(q.options || [])}, ${sqlNum(q.correctIndex, 0)}, ${sqlStr(q.explanation || null)}, ${sqlStr(q.hint || null)}, ${sqlNum(q.points, 10)}, ${sqlStr(q.difficulty || 'Medium')}, ${sqlStr(q.country || 'Global')}, ${sqlStr(q.state || 'All States')}, ${sqlStr(q.curriculum || null)}, ${sqlStr(q.mediaUrl || null)}, ${sqlStr(q.visualClipart || null)}, ${sqlStr(q.schoolId || null)}, ${sqlStr(q.status || 'approved')})`
    );
    lines.push(questionVals.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation, points = EXCLUDED.points, difficulty = EXCLUDED.difficulty, country = EXCLUDED.country, state = EXCLUDED.state, curriculum = EXCLUDED.curriculum;\n');
  }

  // 6. Activities
  if (activities.length > 0) {
    lines.push('-- 6. Interactive Activities Seed Data');
    lines.push('INSERT INTO activities (id, title, type, format, subject, grade, grades, description, instructions, learning_tags, status, difficulty, reward_xp, reward_coins, duration_minutes, timer_enabled, score_enabled, stars_enabled, sound_enabled, animation_enabled, unlocked, recurrence, country, state, curriculum)');
    lines.push('VALUES');
    const actVals = activities.map(a => 
      `  (${sqlStr(a.id)}, ${sqlStr(a.title)}, ${sqlStr(a.type)}, ${sqlStr(a.format || 'question_run')}, ${sqlStr(a.subject)}, ${sqlStr(a.grade)}, ${sqlJson(a.grades || [a.grade])}, ${sqlStr(a.description || null)}, ${sqlStr(a.instructions || null)}, ${sqlJson(a.learningTags || [])}, ${sqlStr(a.status || 'Published')}, ${sqlStr(a.difficulty || 'Easy')}, ${sqlNum(a.rewardXP, 50)}, ${sqlNum(a.rewardCoins, 20)}, ${sqlNum(a.durationMinutes, 10)}, ${sqlBool(a.timerEnabled, true)}, ${sqlBool(a.scoreEnabled, true)}, ${sqlBool(a.starsEnabled, true)}, ${sqlBool(a.soundEnabled, true)}, ${sqlBool(a.animationEnabled, true)}, ${sqlBool(a.unlocked, true)}, ${sqlStr(a.recurrence || 'permanent')}, ${sqlStr(a.country || 'Global')}, ${sqlStr(a.state || 'All States')}, ${sqlStr(a.curriculum || null)})`
    );
    lines.push(actVals.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, type = EXCLUDED.type, format = EXCLUDED.format, description = EXCLUDED.description, reward_xp = EXCLUDED.reward_xp, reward_coins = EXCLUDED.reward_coins, status = EXCLUDED.status;\n');

    // Activity steps
    const stepRows = activities.flatMap(a => (a.steps || []).map((step, idx) => ({
      id: step.id || `${a.id}_step_${idx + 1}`,
      activityId: a.id,
      orderIndex: idx,
      stepType: step.type || 'question',
      questionId: step.questionId || step.gameTask?.questionId || null,
      gameTask: step.gameTask || null
    })));

    if (stepRows.length > 0) {
      lines.push('-- 6b. Activity Steps');
      lines.push('INSERT INTO activity_steps (id, activity_id, order_index, step_type, question_id, game_task)');
      lines.push('VALUES');
      const stepVals = stepRows.map(st => 
        `  (${sqlStr(st.id)}, ${sqlStr(st.activityId)}, ${sqlNum(st.orderIndex, 0)}, ${sqlStr(st.stepType)}, ${sqlStr(st.questionId)}, ${sqlJson(st.gameTask)})`
      );
      lines.push(stepVals.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET step_type = EXCLUDED.step_type, question_id = EXCLUDED.question_id, game_task = EXCLUDED.game_task;\n');
    }

    // Activity Question links
    const linkRows = activities.flatMap(a => (a.questionIds || []).map((qId, idx) => ({
      activityId: a.id,
      questionId: qId,
      orderIndex: idx
    })));

    if (linkRows.length > 0) {
      lines.push('-- 6c. Activity Question Links');
      lines.push('INSERT INTO activity_question_links (activity_id, question_id, order_index)');
      lines.push('VALUES');
      const linkVals = linkRows.map(l => 
        `  (${sqlStr(l.activityId)}, ${sqlStr(l.questionId)}, ${sqlNum(l.orderIndex, 0)})`
      );
      lines.push(linkVals.join(',\n') + '\nON CONFLICT (activity_id, question_id) DO UPDATE SET order_index = EXCLUDED.order_index;\n');
    }
  }

  // 7. Student Progress
  const students = users.filter(u => u.role === 'student');
  if (students.length > 0) {
    lines.push('-- 7. Student Progress Seed Data');
    lines.push('INSERT INTO student_progress (student_id, xp, coins, level, current_streak_days, total_quizzes_taken, average_score, subject_mastery, unlocked_badges, recent_activities)');
    lines.push('VALUES');
    const progVals = students.map(st => {
      const prog = studentProgressMap ? studentProgressMap[st.id] : null;
      return `  (${sqlStr(st.id)}, ${sqlNum(prog?.xp, 250)}, ${sqlNum(prog?.coins, 50)}, ${sqlNum(prog?.level, 1)}, ${sqlNum(prog?.streakDays, 3)}, ${sqlNum(prog?.totalQuizzesTaken, 5)}, ${sqlNum(prog?.averageScore, 85)}, ${sqlJson(prog?.subjectMastery || { Mathematics: 85 })}, ${sqlJson(prog?.badges || [])}, ${sqlJson(prog?.recentActivities || [])})`;
    });
    lines.push(progVals.join(',\n') + '\nON CONFLICT (student_id) DO UPDATE SET xp = EXCLUDED.xp, coins = EXCLUDED.coins, level = EXCLUDED.level, current_streak_days = EXCLUDED.current_streak_days, total_quizzes_taken = EXCLUDED.total_quizzes_taken, average_score = EXCLUDED.average_score, subject_mastery = EXCLUDED.subject_mastery;\n');
  }

  // 8. Sample Activity Attempt for Instant Verification
  lines.push('-- 8. Sample Activity Attempt (For verification)');
  lines.push(`INSERT INTO activity_attempts (student_id, activity_id, score, total_questions, xp_earned, coins_earned, speed_bonus_earned)
VALUES ('STU00001', 'ACT-SAMPLE-001', 100, 5, 50, 15, TRUE);
`);

  return lines.join('\n');
}

/**
 * Returns both schema and seed data combined in one executable script
 */
export function getCombinedSupabaseSql(
  users: UserAccount[],
  questions: Question[],
  activities: Activity[],
  schools?: SchoolOrganization[],
  classes?: ClassRoom[],
  studentProgressMap?: Record<string, StudentProgress>,
  frameworks?: CurriculumFramework[]
): string {
  const schema = getCompleteSupabaseSchemaSql();
  const seed = getCompleteSupabaseSeedSql(users, questions, activities, schools, classes, studentProgressMap, frameworks);
  return `${schema}\n\n${seed}`;
}
