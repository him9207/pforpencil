import { Activity, ActivityDatabase, ActivityMasterRecord, ActivityStep } from '../types';
import { INITIAL_ACTIVITIES } from '../mockData';

export const ACTIVITY_DATABASE_STORAGE_KEY = 'funlearn_activity_database_v3';
export const ACTIVITY_ID_PATTERN = /^ACT\d{6}$/;

const emptyDatabase = (): ActivityDatabase => ({
  activities: [],
  activitySteps: [],
  activityQuestionLinks: [],
  activityAttempts: [],
  activityStepResults: []
});

const nextSequentialId = (used: string[]) => {
  const max = used.reduce((highest, id) => {
    const match = /^ACT(\d{6})$/.exec(id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  let n = max + 1;
  let id = `ACT${String(n).padStart(6, '0')}`;
  while (used.includes(id)) {
    n += 1;
    id = `ACT${String(n).padStart(6, '0')}`;
  }
  return id;
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function migrateActivities(activities: Activity[]): Activity[] {
  const used: string[] = [];
  return activities.map((source) => {
    const activity = clone(source);
    const id = ACTIVITY_ID_PATTERN.test(activity.id) && !used.includes(activity.id)
      ? activity.id
      : nextSequentialId(used);
    used.push(id);

    // Upgrade the original test activity into the real game mechanic.
    // Older builds stored "Feed the Monkey" as plain Question Bank steps.
    if (activity.title?.toLowerCase().includes('feed the monkey') && activity.format === 'question_run') {
      const legacySteps = activity.steps?.length
        ? activity.steps
        : (activity.questionIds || []).map((questionId, index) => ({ id: `STEP_${index + 1}`, type: 'question' as const, questionId }));
      activity.format = 'feeding_game';
      activity.type = 'game';
      activity.instructions = activity.instructions || 'Choose the correct banana and feed the monkey!';
      activity.steps = legacySteps.map((step, index) => step.type === 'question' && step.questionId
        ? {
            id: `STEP_FEED_${index + 1}`,
            type: 'game_task' as const,
            gameTask: {
              id: `TASK_FEED_${index + 1}`,
              title: 'Feed the Monkey',
              instruction: 'Solve the challenge, choose the correct answer, then feed the monkey!',
              mechanic: 'feeding_game' as const,
              questionId: step.questionId,
              targetCount: 1,
              rewardPoints: 25,
              items: [{ id: 'banana', label: 'Banana', emoji: '🍌' }]
            }
          }
        : step);
    }
    return { ...activity, id };
  });
}

function databaseFromActivities(activities: Activity[]): ActivityDatabase {
  const normalized = migrateActivities(activities);
  const db = emptyDatabase();
  db.activities = normalized.map((activity): ActivityMasterRecord => {
    const { questionIds: _questionIds, steps: _steps, ...master } = activity;
    return master;
  });

  normalized.forEach((activity) => {
    const questionIds = Array.from(new Set(activity.questionIds || []));
    questionIds.forEach((questionId, orderIndex) => {
      db.activityQuestionLinks.push({ activityId: activity.id, questionId, orderIndex });
    });

    (activity.steps || []).forEach((step, orderIndex) => {
      db.activitySteps.push({
        activityId: activity.id,
        stepId: step.id,
        orderIndex,
        type: step.type,
        questionId: step.questionId,
        gameTask: step.gameTask ? clone(step.gameTask) : undefined
      });
    });
  });
  return db;
}

function hydrateDatabase(db: ActivityDatabase): Activity[] {
  const masterActivities = (db.activities || []) as ActivityMasterRecord[];
  const activities = migrateActivities(masterActivities.map((master) => ({ ...master, questionIds: [], steps: [] })));
  return activities.map((activity) => {
    const steps = (db.activitySteps || [])
      .filter((row) => row.activityId === activity.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((row): ActivityStep => ({
        id: row.stepId,
        type: row.type,
        questionId: row.questionId,
        gameTask: row.gameTask ? clone(row.gameTask) : undefined
      }));

    const linkedQuestions = (db.activityQuestionLinks || [])
      .filter((row) => row.activityId === activity.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((row) => row.questionId);

    return {
      ...activity,
      questionIds: linkedQuestions.length ? linkedQuestions : (activity.questionIds || []),
      steps: steps.length ? steps : activity.steps
    };
  });
}

export function loadActivityDatabase(): ActivityDatabase {
  try {
    const raw = localStorage.getItem(ACTIVITY_DATABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActivityDatabase;
      if (Array.isArray(parsed.activities) && Array.isArray(parsed.activitySteps) && Array.isArray(parsed.activityQuestionLinks)) {
        return parsed;
      }
    }
  } catch {
    // fall through to migration
  }

  // Migrate the previous flat activity store into the dedicated Activity database.
  try {
    const legacy = localStorage.getItem('funlearn_interactive_activities_v1');
    const legacyActivities = legacy ? JSON.parse(legacy) : INITIAL_ACTIVITIES;
    const db = databaseFromActivities(Array.isArray(legacyActivities) ? legacyActivities : INITIAL_ACTIVITIES);
    localStorage.setItem(ACTIVITY_DATABASE_STORAGE_KEY, JSON.stringify(db));
    return db;
  } catch {
    return databaseFromActivities(INITIAL_ACTIVITIES);
  }
}

export function saveActivityDatabase(activities: Activity[], existing?: ActivityDatabase): ActivityDatabase {
  const current = existing || loadActivityDatabase();
  const db = databaseFromActivities(activities);
  db.activityAttempts = current.activityAttempts || [];
  db.activityStepResults = current.activityStepResults || [];
  try {
    localStorage.setItem(ACTIVITY_DATABASE_STORAGE_KEY, JSON.stringify(db));
    // Keep legacy readers from breaking during migration, but the v2 DB is authoritative.
    localStorage.removeItem('funlearn_interactive_activities_v1');
  } catch {
    // local-only persistence is best effort
  }
  return db;
}

export function getNextActivityId(activities: Array<{ id: string }> = loadActivityDatabase().activities): string {
  return nextSequentialId(activities.map((a) => a.id));
}

export function ensureActivityId(activity: Activity, activities: Activity[]): Activity {
  const otherIds = activities.filter((a) => a.id !== activity.id).map((a) => a.id);
  const valid = ACTIVITY_ID_PATTERN.test(activity.id) && !otherIds.includes(activity.id);
  return valid ? activity : { ...activity, id: getNextActivityId(activities) };
}

export function rebuildActivityDatabaseFromView(activities: Activity[]): ActivityDatabase {
  return databaseFromActivities(activities);
}

export function getActivityDatabaseView(db: ActivityDatabase = loadActivityDatabase()): Activity[] {
  return hydrateDatabase(db);
}
