import { supabaseRestFetch, isSupabaseConfigured, getSupabaseCredentials } from './client';
import { UserAccount, Question, Activity, StudentProgress, SchoolOrganization, ClassRoom, CurriculumFramework } from '../types';

/**
 * Database Sync & Mutation Service
 * Handles live synchronization between app state and Supabase PostgREST endpoints.
 */

export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface TableSeedReport {
  tableName: string;
  label: string;
  attempted: number;
  inserted: number;
  success: boolean;
  error?: string;
}

export interface DetailedSeedReport {
  success: boolean;
  totalTables: number;
  successTables: number;
  totalRowsInserted: number;
  tables: TableSeedReport[];
  message: string;
}

/**
 * Helper to split an array into manageable chunks for PostgREST
 */
function chunkArray<T>(items: T[], chunkSize: number = 50): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 1. Sync completed quiz / activity attempt to Supabase
 */
export async function syncActivityAttemptToSupabase(
  studentId: string,
  activityId: string,
  score: number,
  totalQuestions: number,
  xpEarned: number,
  coinsEarned: number,
  speedBonus: boolean = false
): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase credentials not configured in browser.'
    };
  }

  try {
    // 1. Ensure student profile exists to satisfy foreign key constraints if needed
    try {
      await supabaseRestFetch('profiles', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: {
          id: studentId,
          role: 'student',
          name: studentId === 'STU00001' ? 'Emma Watson' : studentId,
          username: studentId === 'STU00001' ? 'EMMWAT1' : studentId.toLowerCase(),
          avatar: '🦊',
          grade: 'Grade 1'
        }
      });
    } catch {
      // Profile may already exist or table differs; proceed
    }

    // 2. Insert attempt record into activity_attempts table
    const nowIso = new Date().toISOString();
    let result;
    try {
      result = await supabaseRestFetch('activity_attempts', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: {
          student_id: studentId,
          activity_id: activityId || 'daily_quiz',
          score: Math.round(score),
          total_questions: totalQuestions || 5,
          xp_earned: Math.round(xpEarned),
          coins_earned: Math.round(coinsEarned),
          speed_bonus_earned: Boolean(speedBonus),
          created_at: nowIso,
          submitted_at: nowIso
        }
      });
    } catch (insertErr: any) {
      console.warn('Full attempt insert error, retrying with core columns:', insertErr?.message);
      result = await supabaseRestFetch('activity_attempts', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: {
          student_id: studentId,
          activity_id: activityId || 'daily_quiz',
          score: Math.round(score),
          total_questions: totalQuestions || 5,
          xp_earned: Math.round(xpEarned),
          coins_earned: Math.round(coinsEarned)
        }
      });
    }

    return {
      success: true,
      message: 'Recorded quiz attempt in Supabase activity_attempts table!',
      data: result
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.warn('Could not sync quiz attempt to Supabase:', errorMsg);
    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * 2. Sync full user progress to Supabase
 */
export async function syncProgressToSupabase(progress: StudentProgress): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase not configured' };
  }

  // Full standard progress payload
  const payload: Record<string, any> = {
    student_id: progress.studentId,
    xp: progress.xp || 0,
    coins: progress.coins || 0,
    level: progress.level || 1,
    current_streak_days: progress.streakDays || 0,
    total_quizzes_taken: progress.totalQuizzesTaken || 0,
    average_score: progress.averageScore || 0,
    score: progress.averageScore || 0,
    max_score: 100,
    points: progress.xp || 0,
    streak: progress.streakDays || 0,
    completed_activities: progress.totalQuizzesTaken || 0,
    subject_mastery: progress.subjectMastery || {},
    unlocked_badges: progress.badges || [],
    recent_activities: progress.recentActivities || [],
    updated_at: new Date().toISOString()
  };

  try {
    const result = await supabaseRestFetch('student_progress', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: payload
    });
    return { success: true, data: result };
  } catch (err: any) {
    const errorMsg: string = err?.message || String(err);
    
    // Auto-fallback: If schema cache has missing columns (e.g. 'points', 'coins', 'score', etc.), strip and retry
    const missingColMatch = errorMsg.match(/Could not find the '([^']+)' column of 'student_progress'/i);
    if (missingColMatch && missingColMatch[1]) {
      const missingKey = missingColMatch[1];
      delete payload[missingKey];
      try {
        const retryResult = await supabaseRestFetch('student_progress', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
          body: payload
        });
        return { success: true, data: retryResult };
      } catch (retryErr: any) {
        console.warn('Sync progress retry warning:', retryErr?.message || retryErr);
        return { success: false, error: retryErr?.message || String(retryErr) };
      }
    }

    console.warn('Sync progress error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * 3. Sync User Account to Supabase on registration or update
 */
export async function syncUserToSupabase(user: UserAccount): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };

  try {
    // 1. Try profiles table first
    await supabaseRestFetch('profiles', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email || null,
        username: user.username || null,
        pin_hash: user.pin || null,
        avatar: user.avatar || '👤',
        grade: user.grade || null,
        country: user.country || 'United States',
        state: user.state || 'California',
        curriculum: user.curriculum || 'US Common Core (CCSS)',
        school_id: user.organizationId || (user.role === 'school' ? user.id : null),
        school_name: user.schoolName || null,
        school_code: user.schoolCode || null,
        parent_id: user.parentId || null,
        parent_name: user.parentName || null,
        status: user.status || 'active'
      }
    });

    // 2. Also try legacy users table if present
    try {
      await supabaseRestFetch('users', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email || null,
          username: user.username || null,
          avatar: user.avatar || '👤',
          pin: user.pin || null,
          grade: user.grade || null,
          school_name: user.schoolName || null,
          organization_id: user.organizationId || null,
          country: user.country || 'United States',
          state: user.state || 'California',
          curriculum: user.curriculum || 'US Common Core (CCSS)'
        }
      });
    } catch {
      // Users table optional
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Sync user error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 3b. Sync a Question to Supabase
 */
export async function syncQuestionToSupabase(q: Question): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };

  try {
    const result = await supabaseRestFetch('questions', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: {
        id: q.id,
        grade: q.grade,
        subject: q.subject,
        category: q.category,
        skill: q.skill || q.category,
        question_type: q.type || 'multiple_choice',
        prompt: q.prompt,
        options: q.options || [],
        correct_index: q.correctIndex || 0,
        explanation: q.explanation || null,
        hint: q.hint || null,
        points: q.points || 10,
        difficulty: q.difficulty || 'Medium',
        country: q.country || 'Global',
        state: q.state || 'All States',
        curriculum: q.curriculum || null,
        media_url: q.mediaUrl || null,
        visual_clipart: q.visualClipart || null,
        school_id: q.schoolId || null,
        status: q.status || 'approved'
      }
    });
    return { success: true, data: result };
  } catch (err: any) {
    console.warn('Sync question error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 3c. Sync a School Organization to Supabase
 */
export async function syncSchoolToSupabase(s: SchoolOrganization): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };

  try {
    const result = await supabaseRestFetch('schools', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: {
        id: s.id,
        name: s.name,
        school_code: s.schoolCode || 'SCH',
        admin_email: s.adminEmail || 'admin@school.edu',
        country: s.country || 'United States',
        state: s.state || 'California',
        curriculum: s.curriculum || 'US Common Core (CCSS)',
        total_seats: s.totalSeats || 500,
        allocated_seats: s.allocatedSeats || 0,
        plan: s.plan || 'Campus 500',
        status: s.status || 'active'
      }
    });
    return { success: true, data: result };
  } catch (err: any) {
    console.warn('Sync school error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 3d. Sync a Classroom to Supabase
 */
export async function syncClassToSupabase(c: ClassRoom): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };

  try {
    const result = await supabaseRestFetch('classes', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: {
        id: c.id,
        name: c.name,
        grade: c.grade,
        teacher_id: c.teacherId || null,
        teacher_name: c.teacherName || null,
        school_id: c.schoolId || null,
        student_ids: c.studentIds || [],
        average_score: c.averageScore || 0,
        status: c.status || 'active'
      }
    });
    return { success: true, data: result };
  } catch (err: any) {
    console.warn('Sync class error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 3e. Sync an Activity to Supabase
 */
export async function syncActivityToSupabase(a: Activity): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };

  try {
    const result = await supabaseRestFetch('activities', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: {
        id: a.id,
        title: a.title,
        type: a.type,
        format: a.format || 'question_run',
        subject: a.subject,
        grade: a.grade,
        grades: a.grades || [a.grade],
        description: a.description || null,
        instructions: a.instructions || null,
        learning_tags: a.learningTags || [],
        status: a.status || 'Published',
        difficulty: a.difficulty || 'Easy',
        reward_xp: a.rewardXP || 50,
        reward_coins: a.rewardCoins || 20,
        duration_minutes: a.durationMinutes || 10,
        timer_enabled: a.timerEnabled !== false,
        score_enabled: a.scoreEnabled !== false,
        stars_enabled: a.starsEnabled !== false,
        sound_enabled: a.soundEnabled !== false,
        animation_enabled: a.animationEnabled !== false,
        unlocked: a.unlocked !== false,
        recurrence: a.recurrence || 'permanent',
        country: a.country || 'Global',
        state: a.state || 'All States',
        curriculum: a.curriculum || null
      }
    });
    return { success: true, data: result };
  } catch (err: any) {
    console.warn('Sync activity error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 4. Fetch live rows from Supabase for any table
 */
export async function fetchSupabaseTableRows(table: string, limit: number = 25): Promise<{
  success: boolean;
  rows?: any[];
  count?: number;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const data = await supabaseRestFetch(table, {
      method: 'GET',
      headers: {
        'Prefer': 'count=exact'
      },
      params: {
        select: '*',
        order: 'created_at.desc',
        limit: String(limit)
      }
    });

    return {
      success: true,
      rows: Array.isArray(data) ? data : [],
      count: Array.isArray(data) ? data.length : 0
    };
  } catch (err: any) {
    try {
      const fallbackData = await supabaseRestFetch(table, {
        method: 'GET',
        params: {
          select: '*',
          limit: String(limit)
        }
      });
      return {
        success: true,
        rows: Array.isArray(fallbackData) ? fallbackData : [],
        count: Array.isArray(fallbackData) ? fallbackData.length : 0
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        error: fallbackErr?.message || err?.message || 'Failed to fetch table rows'
      };
    }
  }
}

/**
 * Helper to get live counts for all primary tables in Supabase
 */
export async function fetchAllSupabaseTableCounts(): Promise<Record<string, number | 'error' | 'not_found'>> {
  if (!isSupabaseConfigured()) return {};

  const tables = [
    'schools',
    'profiles',
    'classes',
    'curriculum_frameworks',
    'questions',
    'activities',
    'activity_steps',
    'activity_question_links',
    'student_progress',
    'activity_attempts'
  ];

  const results: Record<string, number | 'error' | 'not_found'> = {};

  await Promise.all(
    tables.map(async (tbl) => {
      try {
        const data = await supabaseRestFetch(tbl, {
          method: 'GET',
          params: { select: 'id', limit: '1000' }
        });
        results[tbl] = Array.isArray(data) ? data.length : 0;
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.includes('404') || msg.includes('relation') || msg.includes('PGRST205')) {
          results[tbl] = 'not_found';
        } else {
          results[tbl] = 'error';
        }
      }
    })
  );

  return results;
}

/**
 * Helper to batch seed a specific table with upsert and error tracking
 */
async function seedTableRows<T>(
  tableName: string,
  label: string,
  rows: T[],
  chunkSize: number = 40
): Promise<TableSeedReport> {
  if (!rows || rows.length === 0) {
    return {
      tableName,
      label,
      attempted: 0,
      inserted: 0,
      success: true
    };
  }

  const chunks = chunkArray(rows, chunkSize);
  let totalInserted = 0;
  let lastError: string | undefined = undefined;

  for (const chunk of chunks) {
    try {
      await supabaseRestFetch(tableName, {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: chunk
      });
      totalInserted += chunk.length;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[Supabase Seed] Failed seeding table "${tableName}":`, lastError);
      for (const singleRow of chunk) {
        try {
          await supabaseRestFetch(tableName, {
            method: 'POST',
            headers: {
              'Prefer': 'resolution=merge-duplicates,return=minimal'
            },
            body: singleRow
          });
          totalInserted += 1;
        } catch (singleErr: any) {
          lastError = singleErr?.message || lastError;
        }
      }
    }
  }

  const isSuccess = totalInserted > 0 || rows.length === 0;
  return {
    tableName,
    label,
    attempted: rows.length,
    inserted: totalInserted,
    success: isSuccess,
    error: isSuccess ? undefined : lastError
  };
}

/**
 * 5. Comprehensive Seed: Populates all Supabase tables with initial data
 */
export async function seedInitialDataToSupabase(
  users: UserAccount[],
  questions: Question[],
  activities: Activity[],
  schools?: SchoolOrganization[],
  classes?: ClassRoom[],
  studentProgressMap?: Record<string, StudentProgress>,
  frameworks?: CurriculumFramework[]
): Promise<DetailedSeedReport> {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || anonKey.length < 20) {
    throw new Error('Please enter and save your Supabase URL & Anon Key before seeding.');
  }

  const tableReports: TableSeedReport[] = [];

  // 1. Seed Schools first so foreign keys work
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

  const schoolRows = schoolList.map(s => ({
    id: s.id,
    name: s.name,
    school_code: s.schoolCode || 'SCH',
    admin_email: s.adminEmail || 'admin@school.edu',
    country: s.country || 'United States',
    state: s.state || 'California',
    curriculum: s.curriculum || 'US Common Core (CCSS)',
    total_seats: s.totalSeats || 500,
    allocated_seats: s.allocatedSeats || 0,
    plan: s.plan || 'Campus 500',
    status: s.status || 'active'
  }));
  const schoolReport = await seedTableRows('schools', 'Schools & Organizations', schoolRows);
  tableReports.push(schoolReport);

  // 2. Seed Profiles
  const profileRows = users.map(u => ({
    id: u.id,
    role: u.role,
    name: u.name,
    email: u.email || null,
    username: u.username || null,
    pin_hash: u.pin || null,
    avatar: u.avatar || '🦊',
    grade: u.grade || null,
    country: u.country || 'United States',
    state: u.state || 'California',
    curriculum: u.curriculum || 'US Common Core (CCSS)',
    school_id: u.organizationId || (u.role === 'school' ? u.id : null),
    school_name: u.schoolName || null,
    school_code: u.schoolCode || null,
    parent_id: u.parentId || null,
    parent_name: u.parentName || null,
    status: u.status || 'active'
  }));
  const profileReport = await seedTableRows('profiles', 'User Profiles', profileRows);
  tableReports.push(profileReport);

  // 3. Seed Curriculum Frameworks
  if (frameworks && frameworks.length > 0) {
    const fwRows = frameworks.map(f => ({
      id: f.id,
      country: f.country,
      state: f.state,
      curriculum_name: f.curriculumName,
      description: f.description || null,
      active: f.active !== false
    }));
    const fwReport = await seedTableRows('curriculum_frameworks', 'Curriculum Frameworks', fwRows);
    tableReports.push(fwReport);
  }

  // 4. Seed Classes
  if (classes && classes.length > 0) {
    const classRows = classes.map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      teacher_id: c.teacherId || null,
      teacher_name: c.teacherName || null,
      school_id: c.schoolId || null,
      student_ids: c.studentIds || [],
      average_score: c.averageScore || 0,
      status: c.status || 'active'
    }));
    const classReport = await seedTableRows('classes', 'Classrooms', classRows);
    tableReports.push(classReport);
  }

  // 5. Seed Questions (Question Bank)
  const questionRows = questions.map(q => ({
    id: q.id,
    grade: q.grade,
    subject: q.subject,
    category: q.category,
    skill: q.skill || q.category,
    question_type: q.type || 'multiple_choice',
    prompt: q.prompt,
    options: q.options || [],
    correct_index: q.correctIndex || 0,
    explanation: q.explanation || null,
    hint: q.hint || null,
    points: q.points || 10,
    difficulty: q.difficulty || 'Medium',
    country: q.country || 'Global',
    state: q.state || 'All States',
    curriculum: q.curriculum || null,
    media_url: q.mediaUrl || null,
    visual_clipart: q.visualClipart || null,
    school_id: q.schoolId || null,
    status: q.status || 'approved'
  }));
  const questionReport = await seedTableRows('questions', 'Questions (Question Bank)', questionRows, 30);
  tableReports.push(questionReport);

  // 6. Seed Activities
  const activityRows = activities.map(a => ({
    id: a.id,
    title: a.title,
    type: a.type,
    format: a.format || 'question_run',
    subject: a.subject,
    grade: a.grade,
    grades: a.grades || [a.grade],
    description: a.description || null,
    instructions: a.instructions || null,
    learning_tags: a.learningTags || [],
    status: a.status || 'Published',
    difficulty: a.difficulty || 'Easy',
    reward_xp: a.rewardXP || 50,
    reward_coins: a.rewardCoins || 20,
    duration_minutes: a.durationMinutes || 10,
    timer_enabled: a.timerEnabled !== false,
    score_enabled: a.scoreEnabled !== false,
    stars_enabled: a.starsEnabled !== false,
    sound_enabled: a.soundEnabled !== false,
    animation_enabled: a.animationEnabled !== false,
    unlocked: a.unlocked !== false,
    recurrence: a.recurrence || 'permanent',
    country: a.country || 'Global',
    state: a.state || 'All States',
    curriculum: a.curriculum || null
  }));
  const activityReport = await seedTableRows('activities', 'Interactive Activities', activityRows, 30);
  tableReports.push(activityReport);

  // 6b. Activity Steps
  const stepRows = activities.flatMap(a => (a.steps || []).map((step, idx) => ({
    id: step.id || `${a.id}_step_${idx + 1}`,
    activity_id: a.id,
    order_index: idx,
    step_type: step.type || 'question',
    question_id: step.questionId || step.gameTask?.questionId || null,
    game_task: step.gameTask || null
  })));
  if (stepRows.length > 0) {
    const stepReport = await seedTableRows('activity_steps', 'Activity Steps', stepRows, 40);
    tableReports.push(stepReport);
  }

  // 6c. Activity Question Links
  const linkRows = activities.flatMap(a => (a.questionIds || []).map((qId, idx) => ({
    activity_id: a.id,
    question_id: qId,
    order_index: idx
  })));
  if (linkRows.length > 0) {
    const linkReport = await seedTableRows('activity_question_links', 'Activity Question Links', linkRows, 50);
    tableReports.push(linkReport);
  }

  // 7. Seed Student Progress
  const students = users.filter(u => u.role === 'student');
  const progressRows = students.map(st => {
    const prog = studentProgressMap ? studentProgressMap[st.id] : null;
    return {
      student_id: st.id,
      xp: prog?.xp || 250,
      coins: prog?.coins || 50,
      level: prog?.level || 1,
      current_streak_days: prog?.streakDays || 3,
      total_quizzes_taken: prog?.totalQuizzesTaken || 5,
      average_score: prog?.averageScore || 85,
      subject_mastery: prog?.subjectMastery || { Mathematics: 85 },
      unlocked_badges: prog?.badges || [],
      recent_activities: prog?.recentActivities || [],
      updated_at: new Date().toISOString()
    };
  });
  if (progressRows.length > 0) {
    const progressReport = await seedTableRows('student_progress', 'Student Progress', progressRows);
    tableReports.push(progressReport);
  }

  // 8. Seed sample attempt
  const sampleAttempt = [{
    student_id: 'STU00001',
    activity_id: 'ACT-SAMPLE-001',
    score: 100,
    total_questions: 5,
    xp_earned: 50,
    coins_earned: 15,
    speed_bonus_earned: true,
    created_at: new Date().toISOString(),
    submitted_at: new Date().toISOString()
  }];
  const attemptReport = await seedTableRows('activity_attempts', 'Activity Attempts (Sample)', sampleAttempt);
  tableReports.push(attemptReport);

  const totalRowsInserted = tableReports.reduce((sum, r) => sum + r.inserted, 0);
  const successTables = tableReports.filter(r => r.success).length;
  const isOverallSuccess = successTables > 0;

  return {
    success: isOverallSuccess,
    totalTables: tableReports.length,
    successTables,
    totalRowsInserted,
    tables: tableReports,
    message: isOverallSuccess
      ? `Successfully populated ${totalRowsInserted} rows across ${successTables} Supabase tables!`
      : 'Failed to populate Supabase tables. Please make sure the SQL schema has been executed first.'
  };
}
