import { supabaseRestFetch, isSupabaseConfigured, getSupabaseCredentials } from './client';
import { UserAccount, Question, Activity, StudentProgress, SchoolOrganization, ClassRoom, CurriculumFramework, ClassAssignment, AuditLog, Voucher, SubscriptionRecord } from '../types';
import { CategoryMasterRecord, SkillMasterRecord, loadQuestionBankMasters } from '../data/questionBankMasterData';

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
        password: user.password || null,
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
 * 3a. Fetch all Users / Profiles directly from Supabase
 */
export async function fetchUsersFromSupabase(): Promise<{
  success: boolean;
  users?: UserAccount[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    let rows: any[] = [];
    try {
      const res = await supabaseRestFetch('profiles', {
        method: 'GET',
        params: { select: '*', limit: '1000' }
      });
      if (Array.isArray(res) && res.length > 0) {
        rows = res;
      }
    } catch (profileErr) {
      console.warn('Could not fetch from profiles table, trying users:', profileErr);
    }

    if (rows.length === 0) {
      try {
        const res = await supabaseRestFetch('users', {
          method: 'GET',
          params: { select: '*', limit: '1000' }
        });
        if (Array.isArray(res) && res.length > 0) {
          rows = res;
        }
      } catch (userErr) {
        console.warn('Could not fetch from users table:', userErr);
      }
    }

    if (rows.length === 0) {
      return { success: true, users: [] };
    }

    const mappedUsers: UserAccount[] = rows.map((r) => ({
      id: r.id,
      role: r.role || 'student',
      name: r.name || 'User',
      email: r.email || undefined,
      username: r.username || undefined,
      pin: r.pin_hash || r.pin || undefined,
      password: r.password || undefined,
      avatar: r.avatar || (r.role === 'school' ? '🏫' : r.role === 'teacher' ? '👩‍🏫' : r.role === 'parent' ? '👨‍👧‍👦' : '🦊'),
      country: r.country || undefined,
      state: r.state || undefined,
      curriculum: r.curriculum || undefined,
      organizationId: r.school_id || r.organization_id || (r.role === 'school' ? r.id : undefined),
      schoolName: r.school_name || undefined,
      schoolCode: r.school_code || undefined,
      parentId: r.parent_id || undefined,
      parentName: r.parent_name || undefined,
      studentIds: r.student_ids || undefined,
      grade: r.grade || undefined,
      enrolledAt: r.created_at ? r.created_at.split('T')[0] : '2026-01-01',
      status: (r.status === 'active' || r.status === 'pending' || r.status === 'suspended') ? r.status : 'active'
    }));

    return { success: true, users: mappedUsers };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch users from Supabase' };
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
        status: q.status || 'Published'
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
 * 3f. Sync Category Master to Supabase
 */
export async function syncCategoryMasterToSupabase(cat: CategoryMasterRecord): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    const result = await supabaseRestFetch('category_masters', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: {
        id: cat.id,
        code: cat.code,
        curriculum_id: cat.curriculumId,
        subject_id: cat.subjectId,
        grade_id: cat.gradeId || null,
        name: cat.name,
        description: cat.description || null,
        active: cat.active !== false
      }
    });
    return { success: true, data: result };
  } catch (err: any) {
    console.warn('Sync category master error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 3g. Sync Skill Master to Supabase
 */
export async function syncSkillMasterToSupabase(skl: SkillMasterRecord): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    const result = await supabaseRestFetch('skill_masters', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: {
        id: skl.id,
        code: skl.code,
        category_id: skl.categoryId,
        grade_id: skl.gradeId,
        name: skl.name,
        curriculum_reference: skl.curriculumReference || null,
        learning_objective: skl.learningObjective || null,
        description: skl.description || null,
        active: skl.active !== false
      }
    });
    return { success: true, data: result };
  } catch (err: any) {
    console.warn('Sync skill master error:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * 3h. Bulk Sync Category Masters to Supabase
 */
export async function syncCategoryMastersBulkToSupabase(categories: CategoryMasterRecord[]): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    const payload = categories.map(cat => ({
      id: cat.id,
      code: cat.code,
      curriculum_id: cat.curriculumId,
      subject_id: cat.subjectId,
      grade_id: cat.gradeId || null,
      name: cat.name,
      description: cat.description || null,
      active: cat.active !== false
    }));

    // Post in batches of 100
    for (let i = 0; i < payload.length; i += 100) {
      const chunk = payload.slice(i, i + 100);
      await supabaseRestFetch('category_masters', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: chunk
      });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * 3i. Bulk Sync Skill Masters to Supabase
 */
export async function syncSkillMastersBulkToSupabase(skills: SkillMasterRecord[]): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    const payload = skills.map(skl => ({
      id: skl.id,
      code: skl.code,
      category_id: skl.categoryId,
      grade_id: skl.gradeId,
      name: skl.name,
      curriculum_reference: skl.curriculumReference || null,
      learning_objective: skl.learningObjective || null,
      description: skl.description || null,
      active: skl.active !== false
    }));

    for (let i = 0; i < payload.length; i += 100) {
      const chunk = payload.slice(i, i + 100);
      await supabaseRestFetch('skill_masters', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: chunk
      });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * 3j. Bulk Sync Questions to Supabase
 */
export async function syncQuestionsBulkToSupabase(questions: Question[]): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    const payload = questions.map(q => ({
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
      status: q.status || 'Published'
    }));

    for (let i = 0; i < payload.length; i += 100) {
      const chunk = payload.slice(i, i + 100);
      await supabaseRestFetch('questions', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: chunk
      });
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Question from Supabase
 */
export async function deleteQuestionFromSupabase(questionId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    await supabaseRestFetch('questions', {
      method: 'DELETE',
      params: { id: `eq.${questionId}` }
    });
    return { success: true, message: `Question ${questionId} deleted` };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Category Master from Supabase
 */
export async function deleteCategoryMasterFromSupabase(categoryId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    await supabaseRestFetch('category_masters', {
      method: 'DELETE',
      params: { id: `eq.${categoryId}` }
    });
    return { success: true, message: `Category ${categoryId} deleted` };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Delete Skill Master from Supabase
 */
export async function deleteSkillMasterFromSupabase(skillId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured' };
  try {
    await supabaseRestFetch('skill_masters', {
      method: 'DELETE',
      params: { id: `eq.${skillId}` }
    });
    return { success: true, message: `Skill ${skillId} deleted` };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * 3k. Fetch all Questions directly from Supabase
 */
export async function fetchQuestionsFromSupabase(): Promise<{
  success: boolean;
  questions?: Question[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('questions', {
      method: 'GET',
      params: { select: '*', limit: '2000' }
    });

    if (!Array.isArray(res)) {
      return { success: true, questions: [] };
    }

    const mappedQuestions: Question[] = res.map((r: any) => ({
      id: r.id,
      grade: r.grade,
      subject: r.subject,
      category: r.category,
      skill: r.skill || r.category,
      type: r.question_type || 'multiple_choice',
      prompt: r.prompt,
      options: Array.isArray(r.options) ? r.options : typeof r.options === 'string' ? JSON.parse(r.options) : [],
      correctIndex: typeof r.correct_index === 'number' ? r.correct_index : 0,
      explanation: r.explanation || undefined,
      hint: r.hint || undefined,
      points: typeof r.points === 'number' ? r.points : 10,
      difficulty: r.difficulty || 'Medium',
      country: r.country || 'Global',
      state: r.state || 'All States',
      curriculum: r.curriculum || undefined,
      mediaUrl: r.media_url || undefined,
      visualClipart: r.visual_clipart || undefined,
      schoolId: r.school_id || undefined,
      status: (r.status === 'Draft' ? 'Draft' : r.status === 'Archived' ? 'Archived' : 'Published')
    }));

    return { success: true, questions: mappedQuestions };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch questions' };
  }
}

/**
 * 3l. Fetch Category Masters directly from Supabase
 */
export async function fetchCategoryMastersFromSupabase(): Promise<{
  success: boolean;
  categories?: CategoryMasterRecord[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('category_masters', {
      method: 'GET',
      params: { select: '*', limit: '1000' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, categories: [] };
    }

    const mapped: CategoryMasterRecord[] = res.map((r: any) => ({
      id: r.id,
      code: r.code,
      curriculumId: r.curriculum_id,
      subjectId: r.subject_id,
      gradeId: r.grade_id || undefined,
      name: r.name,
      description: r.description || '',
      active: r.active !== false
    }));

    return { success: true, categories: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch categories' };
  }
}

/**
 * 3m. Fetch Skill Masters directly from Supabase
 */
export async function fetchSkillMastersFromSupabase(): Promise<{
  success: boolean;
  skills?: SkillMasterRecord[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('skill_masters', {
      method: 'GET',
      params: { select: '*', limit: '2000' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, skills: [] };
    }

    const mapped: SkillMasterRecord[] = res.map((r: any) => ({
      id: r.id,
      code: r.code,
      categoryId: r.category_id,
      gradeId: r.grade_id,
      name: r.name,
      curriculumReference: r.curriculum_reference || undefined,
      learningObjective: r.learning_objective || undefined,
      description: r.description || '',
      active: r.active !== false
    }));

    return { success: true, skills: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch skills' };
  }
}

/**
 * 3n. Fetch Activities directly from Supabase
 */
export async function fetchActivitiesFromSupabase(): Promise<{
  success: boolean;
  activities?: Activity[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('activities', {
      method: 'GET',
      params: { select: '*', limit: '500' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, activities: [] };
    }

    const mapped: Activity[] = res.map((r: any) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      format: r.format || 'question_run',
      subject: r.subject,
      grade: r.grade,
      grades: Array.isArray(r.grades) ? r.grades : (r.grade ? [r.grade] : []),
      description: r.description || '',
      instructions: r.instructions || '',
      learningTags: Array.isArray(r.learning_tags) ? r.learning_tags : [],
      status: r.status || 'Published',
      difficulty: r.difficulty || 'Easy',
      rewardXP: typeof r.reward_xp === 'number' ? r.reward_xp : 50,
      rewardCoins: typeof r.reward_coins === 'number' ? r.reward_coins : 20,
      durationMinutes: typeof r.duration_minutes === 'number' ? r.duration_minutes : 10,
      timerEnabled: r.timer_enabled !== false,
      scoreEnabled: r.score_enabled !== false,
      starsEnabled: r.stars_enabled !== false,
      soundEnabled: r.sound_enabled !== false,
      animationEnabled: r.animation_enabled !== false,
      unlocked: r.unlocked !== false,
      recurrence: r.recurrence || 'permanent',
      questionIds: Array.isArray(r.question_ids) ? r.question_ids : [],
      country: r.country || 'Global',
      state: r.state || 'All States',
      curriculum: r.curriculum || undefined
    }));

    return { success: true, activities: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch activities' };
  }
}

/**
 * 3o. Fetch Schools directly from Supabase
 */
export async function fetchSchoolsFromSupabase(): Promise<{
  success: boolean;
  schools?: SchoolOrganization[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('schools', {
      method: 'GET',
      params: { select: '*', limit: '100' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, schools: [] };
    }

    const mapped: SchoolOrganization[] = res.map((r: any) => ({
      id: r.id,
      name: r.name,
      schoolCode: r.school_code,
      adminEmail: r.admin_email,
      country: r.country,
      state: r.state,
      curriculum: r.curriculum,
      totalSeats: r.total_seats,
      allocatedSeats: r.allocated_seats,
      activeTeachers: r.active_teachers || 5,
      activeClasses: r.active_classes || 2,
      plan: r.plan,
      expiresAt: r.expires_at || '2027-12-31',
      status: r.status
    }));

    return { success: true, schools: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch schools' };
  }
}

/**
 * 3p. Fetch Classes directly from Supabase
 */
export async function fetchClassesFromSupabase(): Promise<{
  success: boolean;
  classes?: ClassRoom[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('classes', {
      method: 'GET',
      params: { select: '*', limit: '200' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, classes: [] };
    }

    const mapped: ClassRoom[] = res.map((r: any) => ({
      id: r.id,
      name: r.name,
      grade: r.grade,
      teacherId: r.teacher_id,
      teacherName: r.teacher_name,
      schoolId: r.school_id,
      studentIds: Array.isArray(r.student_ids) ? r.student_ids : [],
      activeAssignments: Array.isArray(r.active_assignments) ? r.active_assignments : [],
      averageScore: r.average_score,
      status: r.status
    }));

    return { success: true, classes: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch classes' };
  }
}

/**
 * 3q. Fetch Student Progress directly from Supabase
 */
export async function fetchStudentProgressFromSupabase(): Promise<{
  success: boolean;
  progressMap?: Record<string, StudentProgress>;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('student_progress', {
      method: 'GET',
      params: { select: '*', limit: '500' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, progressMap: {} };
    }

    const map: Record<string, StudentProgress> = {};
    res.forEach((r: any) => {
      map[r.student_id] = {
        studentId: r.student_id,
        studentUsername: r.student_username || r.student_id,
        studentName: r.student_name || r.student_id,
        avatar: r.avatar || '🎒',
        grade: r.grade || 'Grade 1',
        schoolOrParent: r.school_or_parent || 'parent',
        xp: r.xp || 0,
        coins: r.coins || 0,
        level: r.level || 1,
        streakDays: r.current_streak_days || r.streak || 0,
        dailyQuizCompletedToday: Boolean(r.daily_quiz_completed_today),
        totalQuizzesTaken: r.total_quizzes_taken || r.completed_activities || 0,
        averageScore: r.average_score || 80,
        subjectMastery: r.subject_mastery || r.subject_breakdown || {},
        badges: Array.isArray(r.unlocked_badges) ? r.unlocked_badges : (Array.isArray(r.badges) ? r.badges : []),
        recentActivities: Array.isArray(r.recent_activities) ? r.recent_activities : []
      };
    });

    return { success: true, progressMap: map };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch student progress' };
  }
}

/**
 * 3r. Fetch Class Assignments directly from Supabase
 */
export async function fetchAssignmentsFromSupabase(): Promise<{
  success: boolean;
  assignments?: ClassAssignment[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('assignments', {
      method: 'GET',
      params: { select: '*', limit: '300', order: 'created_at.desc' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, assignments: [] };
    }

    const mapped: ClassAssignment[] = res.map((r: any) => ({
      id: r.id,
      title: r.title,
      classId: r.class_id,
      className: r.class_name || 'Classroom',
      subject: r.subject || 'Mathematics',
      grade: r.grade || 'Grade 1',
      questionIds: Array.isArray(r.question_ids) ? r.question_ids : [],
      dueDate: r.due_date || '',
      status: r.status || 'active',
      createdAt: r.created_at || new Date().toISOString()
    }));

    return { success: true, assignments: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch assignments' };
  }
}

/**
 * Sync single Class Assignment to Supabase
 */
export async function syncAssignmentToSupabase(assignment: ClassAssignment): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const row = {
      id: assignment.id,
      title: assignment.title,
      class_id: assignment.classId,
      class_name: assignment.className,
      subject: assignment.subject,
      grade: assignment.grade,
      question_ids: assignment.questionIds || [],
      due_date: assignment.dueDate,
      status: assignment.status || 'active'
    };

    await supabaseRestFetch('assignments', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: [row]
    });

    return { success: true, message: `Assignment ${assignment.id} saved to Supabase` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to sync assignment' };
  }
}

/**
 * Delete Class Assignment from Supabase
 */
export async function deleteAssignmentFromSupabase(assignmentId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    await supabaseRestFetch('assignments', {
      method: 'DELETE',
      params: { id: `eq.${assignmentId}` }
    });
    return { success: true, message: `Assignment ${assignmentId} removed from Supabase` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete assignment' };
  }
}

/**
 * 3s. Fetch Audit Logs from Supabase
 */
export async function fetchAuditLogsFromSupabase(): Promise<{
  success: boolean;
  logs?: AuditLog[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('audit_logs', {
      method: 'GET',
      params: { select: '*', limit: '200', order: 'created_at.desc' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, logs: [] };
    }

    const mapped: AuditLog[] = res.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp || r.created_at,
      accountId: r.account_id,
      accountName: r.account_name || 'User',
      role: r.role || 'admin',
      action: r.action,
      details: r.details || '',
      ipAddress: r.ip_address || '127.0.0.1'
    }));

    return { success: true, logs: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch audit logs' };
  }
}

/**
 * Sync single Audit Log to Supabase
 */
export async function syncAuditLogToSupabase(log: AuditLog): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const row = {
      id: log.id,
      timestamp: log.timestamp,
      account_id: log.accountId,
      account_name: log.accountName,
      role: log.role,
      action: log.action,
      details: log.details,
      ip_address: log.ipAddress
    };

    await supabaseRestFetch('audit_logs', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: [row]
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * 3t. Fetch Vouchers from Supabase
 */
export async function fetchVouchersFromSupabase(): Promise<{
  success: boolean;
  vouchers?: Voucher[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('vouchers', {
      method: 'GET',
      params: { select: '*', limit: '100' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, vouchers: [] };
    }

    const mapped: Voucher[] = res.map((r: any) => ({
      id: r.id,
      code: r.code,
      discountType: r.discount_type || 'percentage',
      discountValue: typeof r.discount_value === 'number' ? r.discount_value : 20,
      applicableTo: r.applicable_to || 'all',
      maxUses: r.max_uses || 100,
      currentUses: r.current_uses || 0,
      expiresAt: r.expires_at || '2027-12-31',
      validityDuration: r.validity_duration || '365_days',
      active: r.active !== false
    }));

    return { success: true, vouchers: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch vouchers' };
  }
}

/**
 * Sync single Voucher to Supabase
 */
export async function syncVoucherToSupabase(voucher: Voucher): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const row = {
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discountType || 'percentage',
      discount_value: voucher.discountValue || 0,
      applicable_to: voucher.applicableTo || 'all',
      max_uses: voucher.maxUses || 100,
      current_uses: voucher.currentUses || 0,
      expires_at: voucher.expiresAt,
      validity_duration: voucher.validityDuration || '365_days',
      active: voucher.active !== false
    };

    await supabaseRestFetch('vouchers', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: [row]
    });

    return { success: true, message: `Voucher ${voucher.code} saved to Supabase` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to sync voucher' };
  }
}

/**
 * 3u. Fetch Subscriptions from Supabase
 */
export async function fetchSubscriptionsFromSupabase(): Promise<{
  success: boolean;
  subscriptions?: SubscriptionRecord[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const res = await supabaseRestFetch('subscriptions', {
      method: 'GET',
      params: { select: '*', limit: '200', order: 'created_at.desc' }
    });

    if (!Array.isArray(res) || res.length === 0) {
      return { success: true, subscriptions: [] };
    }

    const mapped: SubscriptionRecord[] = res.map((r: any) => ({
      id: r.id,
      accountId: r.account_id,
      accountName: r.account_name || 'Subscriber',
      role: r.role || 'school',
      planName: r.plan_name || 'Campus Plan',
      amount: typeof r.amount === 'number' ? r.amount : 0,
      currency: r.currency || 'USD',
      status: r.status || 'paid',
      paymentDate: r.payment_date || new Date().toISOString().slice(0, 10),
      renewalDate: r.renewal_date || '2027-12-31',
      voucherUsed: r.voucher_used || undefined
    }));

    return { success: true, subscriptions: mapped };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to fetch subscriptions' };
  }
}

/**
 * Sync single Subscription to Supabase
 */
export async function syncSubscriptionToSupabase(sub: SubscriptionRecord): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured' };
  }

  try {
    const row = {
      id: sub.id,
      account_id: sub.accountId,
      account_name: sub.accountName,
      role: sub.role,
      plan_name: sub.planName,
      amount: sub.amount,
      currency: sub.currency,
      status: sub.status,
      payment_date: sub.paymentDate,
      renewal_date: sub.renewalDate,
      voucher_used: sub.voucherUsed || null
    };

    await supabaseRestFetch('subscriptions', {
      method: 'POST',
      headers: {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: [row]
    });

    return { success: true, message: `Subscription ${sub.id} saved to Supabase` };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to sync subscription' };
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
  frameworks?: CurriculumFramework[],
  assignments?: ClassAssignment[],
  auditLogs?: AuditLog[],
  vouchers?: Voucher[],
  subscriptions?: SubscriptionRecord[]
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

  // 4b. Seed Category & Skill Masters (Taxonomy Master Tables)
  try {
    const masters = loadQuestionBankMasters();
    if (masters.categories && masters.categories.length > 0) {
      const catRows = masters.categories.map((c) => ({
        id: c.id,
        category_code: c.code,
        name: c.name,
        subject: c.subjectId,
        grade: c.gradeId || 'Universal',
        description: c.description || null,
        active: c.active !== false
      }));
      const catReport = await seedTableRows('category_masters', 'Category Masters (Taxonomy)', catRows, 50);
      tableReports.push(catReport);
    }

    if (masters.skills && masters.skills.length > 0) {
      const skillRows = masters.skills.map((s) => ({
        id: s.id,
        skill_code: s.code,
        category_id: s.categoryId || null,
        name: s.name,
        subject: (s as any).subject || (s as any).subjectId || 'Universal',
        grade: s.gradeId || 'Universal',
        description: s.description || null,
        active: s.active !== false
      }));
      const skillReport = await seedTableRows('skill_masters', 'Skill Masters (Taxonomy)', skillRows, 50);
      tableReports.push(skillReport);
    }
  } catch (taxErr) {
    console.warn('[Supabase Seed] Skipped master categories/skills seeding:', taxErr);
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
    status: q.status || 'Published'
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

  // 9. Seed Class Assignments
  if (assignments && assignments.length > 0) {
    const asnRows = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      class_id: a.classId,
      class_name: a.className,
      subject: a.subject,
      grade: a.grade,
      question_ids: a.questionIds || [],
      due_date: a.dueDate,
      status: a.status || 'active'
    }));
    const asnReport = await seedTableRows('assignments', 'Class Assignments', asnRows, 40);
    tableReports.push(asnReport);
  }

  // 10. Seed Audit Logs
  if (auditLogs && auditLogs.length > 0) {
    const logRows = auditLogs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      account_id: l.accountId,
      account_name: l.accountName,
      role: l.role,
      action: l.action,
      details: l.details,
      ip_address: l.ipAddress
    }));
    const logReport = await seedTableRows('audit_logs', 'Audit Logs', logRows, 50);
    tableReports.push(logReport);
  }

  // 11. Seed Vouchers
  if (vouchers && vouchers.length > 0) {
    const voucherRows = vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      discount_type: v.discountType || 'percentage',
      discount_value: v.discountValue || 20,
      applicable_to: v.applicableTo || 'all',
      max_uses: v.maxUses || 100,
      current_uses: v.currentUses || 0,
      expires_at: v.expiresAt,
      validity_duration: v.validityDuration || '365_days',
      active: v.active !== false
    }));
    const voucherReport = await seedTableRows('vouchers', 'Vouchers', voucherRows, 50);
    tableReports.push(voucherReport);
  }

  // 12. Seed Subscriptions
  if (subscriptions && subscriptions.length > 0) {
    const subRows = subscriptions.map((s) => ({
      id: s.id,
      account_id: s.accountId,
      account_name: s.accountName,
      role: s.role,
      plan_name: s.planName,
      amount: s.amount,
      currency: s.currency,
      status: s.status,
      payment_date: s.paymentDate,
      renewal_date: s.renewalDate,
      voucher_used: s.voucherUsed || null
    }));
    const subReport = await seedTableRows('subscriptions', 'Subscriptions & Billing', subRows, 50);
    tableReports.push(subReport);
  }

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

/**
 * 13. Complete Question Bank Purge: Deletes all rows in questions, skill_masters, category_masters
 */
export async function purgeAllQuestionBankDataFromSupabase(): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase credentials not configured.' };
  }

  const errors: string[] = [];
  
  // 1. Delete all questions
  try {
    // Attempt wildcard delete first
    await supabaseRestFetch('questions', {
      method: 'DELETE',
      params: { id: 'not.is.null' }
    });
  } catch {
    try {
      // Fallback: fetch IDs and delete in batches
      const rows = await supabaseRestFetch('questions', {
        method: 'GET',
        params: { select: 'id', limit: '5000' }
      });
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          if (row.id) {
            await supabaseRestFetch('questions', {
              method: 'DELETE',
              params: { id: `eq.${row.id}` }
            }).catch(() => {});
          }
        }
      }
    } catch (e: any) {
      errors.push(`questions: ${e?.message || 'failed'}`);
    }
  }

  // 2. Delete all skill_masters
  try {
    await supabaseRestFetch('skill_masters', {
      method: 'DELETE',
      params: { id: 'not.is.null' }
    });
  } catch {
    try {
      const rows = await supabaseRestFetch('skill_masters', {
        method: 'GET',
        params: { select: 'id', limit: '5000' }
      });
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          if (row.id) {
            await supabaseRestFetch('skill_masters', {
              method: 'DELETE',
              params: { id: `eq.${row.id}` }
            }).catch(() => {});
          }
        }
      }
    } catch (e: any) {
      errors.push(`skill_masters: ${e?.message || 'failed'}`);
    }
  }

  // 3. Delete all category_masters
  try {
    await supabaseRestFetch('category_masters', {
      method: 'DELETE',
      params: { id: 'not.is.null' }
    });
  } catch {
    try {
      const rows = await supabaseRestFetch('category_masters', {
        method: 'GET',
        params: { select: 'id', limit: '5000' }
      });
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          if (row.id) {
            await supabaseRestFetch('category_masters', {
              method: 'DELETE',
              params: { id: `eq.${row.id}` }
            }).catch(() => {});
          }
        }
      }
    } catch (e: any) {
      errors.push(`category_masters: ${e?.message || 'failed'}`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: `Purge notices: ${errors.join(', ')}`
    };
  }

  return {
    success: true,
    message: 'All questions, category masters, and skill masters have been permanently erased from Supabase.'
  };
}

/**
 * 14. Purge All App Tables in Supabase
 */
export async function purgeEntireDatabaseFromSupabase(): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase credentials not configured.' };
  }

  const tables = [
    'activity_attempts',
    'questions',
    'skill_masters',
    'category_masters',
    'activities',
    'student_progress',
    'assignments',
    'classes',
    'schools',
    'audit_logs',
    'vouchers',
    'subscriptions'
  ];

  const results: string[] = [];
  for (const table of tables) {
    try {
      await supabaseRestFetch(table, {
        method: 'DELETE',
        params: { id: 'neq.__NON_EXISTENT_ID__' }
      });
      results.push(`${table}: erased`);
    } catch (e: any) {
      // Table might not exist or be empty
      results.push(`${table}: ${e?.message || 'skipped'}`);
    }
  }

  return {
    success: true,
    message: `Database purge completed for tables: ${results.join(', ')}`
  };
}
