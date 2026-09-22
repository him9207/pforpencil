/**
 * Database Schema & Table Definitions
 * Tracks table structures, primary keys, relationships, and metadata
 */

export interface DatabaseTableDefinition {
  name: string;
  category: 'core_auth' | 'academic' | 'gamification' | 'operations';
  description: string;
  primaryKey: string;
  foreignKeys?: { column: string; references: string }[];
  columns: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }[];
}

export const DATABASE_TABLES: DatabaseTableDefinition[] = [
  {
    name: 'schools',
    category: 'core_auth',
    description: 'School organizations, campuses, licensing plans, and curriculum presets',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Unique School ID (e.g. SCH_001)' },
      { name: 'name', type: 'TEXT', required: true, description: 'School or Campus Name' },
      { name: 'school_code', type: 'TEXT', required: true, description: 'Unique login/invitation code' },
      { name: 'admin_email', type: 'TEXT', required: true, description: 'School Administrator Email' },
      { name: 'country', type: 'TEXT', description: 'Country location' },
      { name: 'state', type: 'TEXT', description: 'State or Province' },
      { name: 'curriculum', type: 'TEXT', description: 'Default curriculum framework' },
      { name: 'total_seats', type: 'INTEGER', description: 'Purchased student/faculty seats' },
      { name: 'allocated_seats', type: 'INTEGER', description: 'Currently assigned seats' },
      { name: 'plan', type: 'TEXT', description: 'Subscription tier' },
      { name: 'status', type: 'TEXT', description: 'Account status (active, suspended, trial)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'profiles',
    category: 'core_auth',
    description: 'User accounts across all roles (student, teacher, school, parent, content_manager, admin)',
    primaryKey: 'id',
    foreignKeys: [{ column: 'school_id', references: 'schools.id' }],
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'User ID (e.g. STU00001, TEA00001)' },
      { name: 'role', type: 'TEXT', required: true, description: 'User role' },
      { name: 'name', type: 'TEXT', required: true, description: 'Full Display Name' },
      { name: 'email', type: 'TEXT', description: 'Email address' },
      { name: 'username', type: 'TEXT', description: 'Unique login handle' },
      { name: 'pin_hash', type: 'TEXT', description: 'Student quick login PIN' },
      { name: 'avatar', type: 'TEXT', description: 'Avatar emoji or URL' },
      { name: 'grade', type: 'TEXT', description: 'Student grade level' },
      { name: 'country', type: 'TEXT', description: 'Country' },
      { name: 'state', type: 'TEXT', description: 'State' },
      { name: 'curriculum', type: 'TEXT', description: 'Assigned curriculum' },
      { name: 'school_id', type: 'TEXT', description: 'Affiliated school ID' },
      { name: 'school_name', type: 'TEXT', description: 'Affiliated school name' },
      { name: 'school_code', type: 'TEXT', description: 'School registration code' },
      { name: 'parent_id', type: 'TEXT', description: 'Linked parent user ID' },
      { name: 'parent_name', type: 'TEXT', description: 'Linked parent name' },
      { name: 'status', type: 'TEXT', description: 'Status (active, inactive)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'classes',
    category: 'academic',
    description: 'Classrooms, course cohorts, assigned teachers, and enrolled student rosters',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'school_id', references: 'schools.id' },
      { column: 'teacher_id', references: 'profiles.id' }
    ],
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Class ID (e.g. CLS_001)' },
      { name: 'name', type: 'TEXT', required: true, description: 'Class Name (e.g. Grade 2 Alpha Math)' },
      { name: 'grade', type: 'TEXT', required: true, description: 'Grade level' },
      { name: 'teacher_id', type: 'TEXT', description: 'Lead teacher ID' },
      { name: 'teacher_name', type: 'TEXT', description: 'Lead teacher name' },
      { name: 'school_id', type: 'TEXT', description: 'School ID' },
      { name: 'student_ids', type: 'JSONB', description: 'Array of enrolled student IDs' },
      { name: 'average_score', type: 'NUMERIC', description: 'Classroom average accuracy' },
      { name: 'status', type: 'TEXT', description: 'Classroom status' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'curriculum_frameworks',
    category: 'academic',
    description: 'Regional educational standards (US Common Core, CBSE India, UK National, etc.)',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Framework ID' },
      { name: 'name', type: 'TEXT', required: true, description: 'Framework Full Name' },
      { name: 'country', type: 'TEXT', required: true, description: 'Country' },
      { name: 'state', type: 'TEXT', description: 'State/Province' },
      { name: 'status', type: 'TEXT', description: 'Framework status' },
      { name: 'grades', type: 'JSONB', description: 'Supported grade levels' },
      { name: 'subjects', type: 'JSONB', description: 'Supported subjects and topics' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'category_masters',
    category: 'academic',
    description: 'Master taxonomy categories scoped by Curriculum, Subject, and Grade',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Category Master ID' },
      { name: 'code', type: 'TEXT', required: true, description: 'Unique category code' },
      { name: 'curriculum_id', type: 'TEXT', required: true, description: 'Curriculum Framework ID' },
      { name: 'subject_id', type: 'TEXT', required: true, description: 'Subject ID' },
      { name: 'grade_id', type: 'TEXT', description: 'Scoped Grade ID' },
      { name: 'name', type: 'TEXT', required: true, description: 'Category Name' },
      { name: 'description', type: 'TEXT', description: 'Category Scope Description' },
      { name: 'active', type: 'BOOLEAN', description: 'Whether active' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'skill_masters',
    category: 'academic',
    description: 'Master pedagogical learning skills linked to Categories and Grades',
    primaryKey: 'id',
    foreignKeys: [{ column: 'category_id', references: 'category_masters.id' }],
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Skill Master ID' },
      { name: 'code', type: 'TEXT', required: true, description: 'Unique skill code' },
      { name: 'category_id', type: 'TEXT', required: true, description: 'Parent Category ID' },
      { name: 'grade_id', type: 'TEXT', required: true, description: 'Target Grade ID' },
      { name: 'name', type: 'TEXT', required: true, description: 'Specific Skill Name' },
      { name: 'curriculum_reference', type: 'TEXT', description: 'Official Standard Code' },
      { name: 'learning_objective', type: 'TEXT', description: 'Pedagogical Learning Objective' },
      { name: 'description', type: 'TEXT', description: 'Practice drill description' },
      { name: 'active', type: 'BOOLEAN', description: 'Whether active' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'questions',
    category: 'academic',
    description: 'Universal Question Bank items with options, explanations, and curriculum alignment',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Question ID (e.g. Q001)' },
      { name: 'grade', type: 'TEXT', required: true, description: 'Target Grade' },
      { name: 'subject', type: 'TEXT', required: true, description: 'Subject (Mathematics, Science, etc.)' },
      { name: 'category', type: 'TEXT', required: true, description: 'Topic/Category' },
      { name: 'skill', type: 'TEXT', description: 'Specific Skill' },
      { name: 'question_type', type: 'TEXT', description: 'Type (multiple_choice, interactive, etc.)' },
      { name: 'prompt', type: 'TEXT', required: true, description: 'Question Prompt' },
      { name: 'options', type: 'JSONB', required: true, description: 'Answer choices array' },
      { name: 'correct_index', type: 'INTEGER', required: true, description: '0-based index of correct option' },
      { name: 'explanation', type: 'TEXT', description: 'Step-by-step solution explanation' },
      { name: 'hint', type: 'TEXT', description: 'Hint for student' },
      { name: 'points', type: 'INTEGER', description: 'Points/XP reward' },
      { name: 'difficulty', type: 'TEXT', description: 'Difficulty level (Easy, Medium, Hard)' },
      { name: 'country', type: 'TEXT', description: 'Country alignment' },
      { name: 'state', type: 'TEXT', description: 'State alignment' },
      { name: 'curriculum', type: 'TEXT', description: 'Curriculum standard' },
      { name: 'media_url', type: 'TEXT', description: 'Image or audio URL' },
      { name: 'visual_clipart', type: 'TEXT', description: 'Display emoji or visual icon' },
      { name: 'school_id', type: 'TEXT', description: 'Private custom school ID' },
      { name: 'status', type: 'TEXT', description: 'Status (approved, draft, archived)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'activities',
    category: 'academic',
    description: 'Interactive educational games, sprints, daily challenges, and lessons',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Activity ID' },
      { name: 'title', type: 'TEXT', required: true, description: 'Activity Title' },
      { name: 'type', type: 'TEXT', required: true, description: 'Activity Type (Quiz, Math Sprint, Memory)' },
      { name: 'format', type: 'TEXT', description: 'Run format' },
      { name: 'subject', type: 'TEXT', required: true, description: 'Subject' },
      { name: 'grade', type: 'TEXT', required: true, description: 'Grade level' },
      { name: 'grades', type: 'JSONB', description: 'Supported grade array' },
      { name: 'description', type: 'TEXT', description: 'Overview description' },
      { name: 'instructions', type: 'TEXT', description: 'Game instructions' },
      { name: 'learning_tags', type: 'JSONB', description: 'Tags array' },
      { name: 'status', type: 'TEXT', description: 'Publication status' },
      { name: 'difficulty', type: 'TEXT', description: 'Difficulty' },
      { name: 'reward_xp', type: 'INTEGER', description: 'XP reward' },
      { name: 'reward_coins', type: 'INTEGER', description: 'Coins reward' },
      { name: 'duration_minutes', type: 'INTEGER', description: 'Estimated duration' },
      { name: 'timer_enabled', type: 'BOOLEAN', description: 'Whether countdown timer is active' },
      { name: 'score_enabled', type: 'BOOLEAN', description: 'Whether scoring is active' },
      { name: 'stars_enabled', type: 'BOOLEAN', description: 'Whether 3-star rating is enabled' },
      { name: 'sound_enabled', type: 'BOOLEAN', description: 'Audio effects enabled' },
      { name: 'animation_enabled', type: 'BOOLEAN', description: 'Animations enabled' },
      { name: 'unlocked', type: 'BOOLEAN', description: 'Unlocked by default' },
      { name: 'recurrence', type: 'TEXT', description: 'Recurrence (daily, weekly, permanent)' },
      { name: 'country', type: 'TEXT', description: 'Country' },
      { name: 'state', type: 'TEXT', description: 'State' },
      { name: 'curriculum', type: 'TEXT', description: 'Curriculum' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'activity_steps',
    category: 'academic',
    description: 'Sequenced interactive stages, instructions, and rules within an activity',
    primaryKey: 'id',
    foreignKeys: [{ column: 'activity_id', references: 'activities.id' }],
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Step ID' },
      { name: 'activity_id', type: 'TEXT', required: true, description: 'Parent Activity ID' },
      { name: 'step_order', type: 'INTEGER', required: true, description: 'Execution order index' },
      { name: 'title', type: 'TEXT', required: true, description: 'Step Title' },
      { name: 'instructions', type: 'TEXT', description: 'Step Instructions' },
      { name: 'content', type: 'TEXT', description: 'Lesson or concept text' },
      { name: 'layout', type: 'TEXT', description: 'UI layout style' },
      { name: 'media_url', type: 'TEXT', description: 'Visual asset URL' },
      { name: 'interactive_component', type: 'TEXT', description: 'Interactive widget name' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'activity_question_links',
    category: 'academic',
    description: 'Associative links binding specific questions to activities and step stages',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'activity_id', references: 'activities.id' },
      { column: 'question_id', references: 'questions.id' }
    ],
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Link ID' },
      { name: 'activity_id', type: 'TEXT', required: true, description: 'Activity ID' },
      { name: 'step_id', type: 'TEXT', description: 'Step ID' },
      { name: 'question_id', type: 'TEXT', required: true, description: 'Question ID' },
      { name: 'display_order', type: 'INTEGER', description: 'Question sequence number' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'student_progress',
    category: 'gamification',
    description: 'Real-time student progress, total XP, earned coins, level, streak, and subject breakdown',
    primaryKey: 'student_id',
    foreignKeys: [{ column: 'student_id', references: 'profiles.id' }],
    columns: [
      { name: 'student_id', type: 'TEXT', required: true, description: 'Student User ID' },
      { name: 'student_name', type: 'TEXT', description: 'Student Name' },
      { name: 'student_username', type: 'TEXT', description: 'Student Username' },
      { name: 'grade', type: 'TEXT', description: 'Grade level' },
      { name: 'xp', type: 'INTEGER', description: 'Total Experience Points (XP)' },
      { name: 'coins', type: 'INTEGER', description: 'Virtual coins balance' },
      { name: 'level', type: 'INTEGER', description: 'Student Level' },
      { name: 'streak', type: 'INTEGER', description: 'Consecutive active days' },
      { name: 'last_active_date', type: 'DATE', description: 'Last active date' },
      { name: 'completed_activities', type: 'INTEGER', description: 'Total completed count' },
      { name: 'badges', type: 'JSONB', description: 'Earned achievement badges array' },
      { name: 'subject_breakdown', type: 'JSONB', description: 'Accuracy and points per subject' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', description: 'Last progress update' }
    ]
  },
  {
    name: 'activity_attempts',
    category: 'gamification',
    description: 'Detailed log of every quiz, game, or sprint session played by students',
    primaryKey: 'id',
    foreignKeys: [
      { column: 'student_id', references: 'profiles.id' },
      { column: 'activity_id', references: 'activities.id' }
    ],
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Attempt ID' },
      { name: 'student_id', type: 'TEXT', required: true, description: 'Student ID' },
      { name: 'activity_id', type: 'TEXT', required: true, description: 'Activity ID' },
      { name: 'score', type: 'INTEGER', description: 'Correct answers count' },
      { name: 'max_score', type: 'INTEGER', description: 'Total questions in session' },
      { name: 'accuracy_pct', type: 'NUMERIC', description: 'Percentage accuracy' },
      { name: 'xp_earned', type: 'INTEGER', description: 'XP awarded' },
      { name: 'coins_earned', type: 'INTEGER', description: 'Coins awarded' },
      { name: 'completed', type: 'BOOLEAN', description: 'Whether session completed' },
      { name: 'time_spent_seconds', type: 'INTEGER', description: 'Time taken in seconds' },
      { name: 'timestamp', type: 'TIMESTAMPTZ', description: 'Submission timestamp' }
    ]
  },
  {
    name: 'assignments',
    category: 'academic',
    description: 'Class assignments assigned by teachers to classrooms or student cohorts',
    primaryKey: 'id',
    foreignKeys: [{ column: 'class_id', references: 'classes.id' }],
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Assignment ID (e.g. ASN001)' },
      { name: 'title', type: 'TEXT', required: true, description: 'Assignment Title' },
      { name: 'class_id', type: 'TEXT', required: true, description: 'Classroom ID' },
      { name: 'class_name', type: 'TEXT', description: 'Classroom Name' },
      { name: 'subject', type: 'TEXT', required: true, description: 'Subject' },
      { name: 'grade', type: 'TEXT', required: true, description: 'Grade level' },
      { name: 'question_ids', type: 'JSONB', description: 'Assigned Question IDs array' },
      { name: 'due_date', type: 'TEXT', description: 'Due date string' },
      { name: 'status', type: 'TEXT', description: 'Status (active, completed)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'audit_logs',
    category: 'operations',
    description: 'Security and administrative audit trail of all platform events',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Log ID (e.g. LOG-001)' },
      { name: 'timestamp', type: 'TEXT', required: true, description: 'Event timestamp string' },
      { name: 'account_id', type: 'TEXT', required: true, description: 'User account ID that triggered the action' },
      { name: 'account_name', type: 'TEXT', description: 'User account name' },
      { name: 'role', type: 'TEXT', description: 'User role at time of action' },
      { name: 'action', type: 'TEXT', required: true, description: 'Action code (e.g. USER_LOGIN, QUESTION_CREATE)' },
      { name: 'details', type: 'TEXT', description: 'Human readable event details' },
      { name: 'ip_address', type: 'TEXT', description: 'Origin IP address' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'vouchers',
    category: 'operations',
    description: 'Promotional discount voucher codes and redemption limits',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Voucher ID (e.g. VOUCH_001)' },
      { name: 'code', type: 'TEXT', required: true, description: 'Uppercase promo code' },
      { name: 'discount_type', type: 'TEXT', description: 'Discount type (percentage, flat)' },
      { name: 'discount_value', type: 'NUMERIC', description: 'Discount numerical value' },
      { name: 'applicable_to', type: 'TEXT', description: 'Applicable user role (parent, school, all)' },
      { name: 'max_uses', type: 'INTEGER', description: 'Maximum total redemptions' },
      { name: 'current_uses', type: 'INTEGER', description: 'Current redemption count' },
      { name: 'expires_at', type: 'TEXT', description: 'Expiration date' },
      { name: 'validity_duration', type: 'TEXT', description: 'Validity duration code' },
      { name: 'active', type: 'BOOLEAN', description: 'Whether active' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  },
  {
    name: 'subscriptions',
    category: 'operations',
    description: 'Billing records and subscription activations for schools and parents',
    primaryKey: 'id',
    columns: [
      { name: 'id', type: 'TEXT', required: true, description: 'Subscription Record ID' },
      { name: 'account_id', type: 'TEXT', required: true, description: 'Subscriber Account ID' },
      { name: 'account_name', type: 'TEXT', description: 'Subscriber Name' },
      { name: 'role', type: 'TEXT', description: 'Subscriber Role (parent, school)' },
      { name: 'plan_name', type: 'TEXT', description: 'Plan Name' },
      { name: 'amount', type: 'NUMERIC', description: 'Payment Amount' },
      { name: 'currency', type: 'TEXT', description: 'Currency code (USD, INR, etc.)' },
      { name: 'status', type: 'TEXT', description: 'Payment status (paid, active, expired)' },
      { name: 'payment_date', type: 'TEXT', description: 'Payment date' },
      { name: 'renewal_date', type: 'TEXT', description: 'Renewal date' },
      { name: 'voucher_used', type: 'TEXT', description: 'Redeemed voucher code' },
      { name: 'created_at', type: 'TIMESTAMPTZ', description: 'Creation timestamp' }
    ]
  }
];
