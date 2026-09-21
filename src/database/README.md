# Database Directory Architecture (`src/database/`)

This directory is the dedicated, centralized home for all database logic, schemas, Supabase REST connectors, live synchronizers, and SQL generator tools.

---

## File Structure & Responsibilities

| File | Role & Functionality |
| :--- | :--- |
| **`client.ts`** | Supabase REST client, JWT token validation, URL/anon key management, connectivity health check. |
| **`schema.ts`** | Structural definitions of all 10 database tables, column types, foreign key relationships, and metadata. |
| **`sqlGenerator.ts`** | Complete PostgreSQL DDL schema (`CREATE TABLE`, `ALTER TABLE`, RLS policies) and dynamic `INSERT ... ON CONFLICT DO UPDATE` seed generators. |
| **`sync.ts`** | Live state synchronizers (`syncActivityAttemptToSupabase`, `syncProgressToSupabase`, `syncUserToSupabase`, `syncQuestionToSupabase`, `syncSchoolToSupabase`, `syncClassToSupabase`, `syncActivityToSupabase`, `fetchSupabaseTableRows`, and `seedInitialDataToSupabase`). |
| **`index.ts`** | Master barrel export exposing all database utilities through a single clean import. |

---

## How to Import in Components

```typescript
// Import everything cleanly from the database module:
import { 
  isSupabaseConfigured, 
  syncActivityAttemptToSupabase, 
  syncProgressToSupabase,
  fetchSupabaseTableRows,
  DATABASE_TABLES
} from '../database';
```

---

## Managed Core Database Tables

1. **`schools`**: Organizations, campuses, licensing contracts, and seat quotas.
2. **`profiles`**: User accounts across all roles (`admin`, `school`, `teacher`, `parent`, `student`, `content_manager`).
3. **`classes`**: Classroom cohorts, lead teachers, and enrolled student rosters.
4. **`curriculum_frameworks`**: Regional educational standards (US CCSS, CBSE India, UK National, etc.).
5. **`questions`**: Universal Question Bank items with curriculum alignments, hints, and explanations.
6. **`activities`**: Interactive games, sprints, daily challenges, and lesson templates.
7. **`activity_steps`**: Sequenced stages and interactive tasks within activities.
8. **`activity_question_links`**: Associative links binding questions to specific activities.
9. **`student_progress`**: Real-time student XP, coin balances, levels, active streaks, and subject mastery.
10. **`activity_attempts`**: Granular attempt logs recording scores, timestamps, accuracy, and rewards.
