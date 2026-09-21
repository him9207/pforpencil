import { UserAccount, UserRole, SchoolOrganization, Question } from '../types';

/**
 * Maps each user role to its standardized 3-letter prefix
 */
export const ROLE_PREFIX_MAP: Record<UserRole, string> = {
  admin: 'ADM',
  content_manager: 'CON',
  school: 'SCH',
  teacher: 'TEA',
  parent: 'PAR',
  student: 'STU'
};

// Clean up any stale localStorage runaway keys on init
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    ['sch', 'tea', 'stu', 'par', 'adm', 'con'].forEach((k) => {
      window.localStorage.removeItem(`funlearn_hwm_${k}`);
      window.localStorage.removeItem(`pforpencil_hwm_${k}`);
    });
  } catch {
    // Sandboxed environment fallback
  }
}

// In-memory set of explicitly committed IDs to prevent re-use within the active session
const SESSION_COMMITTED_IDS = new Set<string>();

export function commitAccountId(id: string): void {
  if (id) SESSION_COMMITTED_IDS.add(id.trim().toUpperCase());
}

/**
 * CENTRAL ID GENERATOR
 * Returns the next globally unique, sequential ID for any role (e.g. ADM00001, SCH000001, TEA00001, PAR00001, STU00001).
 * 
 * Rules:
 * 1. Strictly sequential: Based on existing entities. If only SCH000001 exists, next is strictly SCH000002.
 * 2. Pure function: Calling generateAccountId multiple times during renders DOES NOT mutate sequence.
 * 3. Independent sequences for each role prefix.
 * 4. Exact formatting:
 *    - School accounts: 'SCH' + 6 digits (e.g. SCH000001, SCH000002, SCH000003)
 *    - Person accounts (Admin, Content, Teacher, Parent, Student): 3-letter prefix + 5 digits (e.g. TEA00001, PAR00001, STU00001)
 */
export function generateAccountId(
  roleOrPrefix: UserRole | 'school' | 'teacher' | 'parent' | 'student' | 'admin' | 'content_manager' | string,
  existingEntities: (UserAccount | SchoolOrganization | { id: string; role?: string })[] = []
): string {
  const rawPrefix = ROLE_PREFIX_MAP[roleOrPrefix as UserRole] || (roleOrPrefix.length === 3 ? roleOrPrefix.toUpperCase() : 'USR');
  const prefix = rawPrefix.toUpperCase();
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');

  const existingIds = new Set<string>(SESSION_COMMITTED_IDS);
  let maxSeq = 0;

  for (const item of existingEntities) {
    if (!item || !item.id) continue;
    const cleanId = String(item.id).trim().toUpperCase();
    existingIds.add(cleanId);
    const match = cleanId.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  const width = prefix === 'SCH' ? 6 : 5;
  let candidate = `${prefix}${String(nextSeq).padStart(width, '0')}`;

  while (existingIds.has(candidate)) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(width, '0')}`;
  }

  return candidate;
}

/**
 * Backward-compatible alias for generateAccountId
 */
export function getNextRoleId(
  role: UserRole | string,
  existingUsers: (UserAccount | SchoolOrganization | { id: string; role?: string })[] = []
): string {
  return generateAccountId(role, existingUsers);
}

/**
 * SCHOOL CODE GENERATION
 * Generates a deterministic, uppercase, unique 3-letter (or 3-4 alphanumeric) code from the school's name.
 * 
 * Rules:
 * - Automatically derived from first 3 alphabetic characters of school name (or first 3-letter word, e.g. "DPS School" -> "DPS", "Oakwood" -> "OAK")
 * - Case-insensitive & globally unique.
 * - If code is already in use, generates a deterministic incremental variant: e.g. DAV -> DAV1 -> DAV2, OAK -> OAK1 -> OAK2.
 * - Never requires manual administrator input.
 */
export function generateSchoolCode(
  schoolName: string,
  existingSchools: (SchoolOrganization | { schoolCode?: string; id?: string; name?: string; code?: string } | UserAccount)[] = []
): string {
  const clean = (schoolName || '').trim();
  const lettersOnly = clean.replace(/[^a-zA-Z]/g, '').toUpperCase();

  let baseCode = '';
  // Check if first word is 3 or more letters (e.g. "DPS", "OAK", "DEL", "DAV")
  const words = clean.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length > 0 && words[0].length >= 3) {
    baseCode = words[0].slice(0, 3).toUpperCase();
  } else if (lettersOnly.length >= 3) {
    baseCode = lettersOnly.slice(0, 3);
  } else {
    baseCode = (lettersOnly + 'SCH').slice(0, 3);
  }

  const existingCodes = new Set<string>();
  for (const s of existingSchools) {
    if (!s) continue;
    const code = (
      ('schoolCode' in s && s.schoolCode) ||
      ('code' in s && (s as any).code) ||
      ('id' in s && typeof s.id === 'string' && s.id.length <= 6 && !s.id.startsWith('SCH0') ? s.id : '')
    );
    if (code) existingCodes.add(String(code).trim().toUpperCase());
  }

  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }

  // Deterministic incremental variant if collision exists: DAV1, DAV2, DAV3...
  let counter = 1;
  while (existingCodes.has(`${baseCode}${counter}`)) {
    counter++;
  }
  return `${baseCode}${counter}`;
}

/**
 * Extracts a standardized uppercase prefix for a school
 */
export function getSchoolPrefix(schoolNameOrId?: string): string {
  if (!schoolNameOrId) return 'SCH';
  const clean = schoolNameOrId.trim();
  if (!clean) return 'SCH';

  const words = clean.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'SCH';

  if (words[0].length >= 3) {
    return words[0].slice(0, 3).toUpperCase();
  } else if (words.length > 1) {
    const acronym = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
    if (acronym.length >= 2) return acronym;
  }

  return clean.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'SCH';
}

/**
 * Generates the next sequential student username for a school:
 * e.g. DPS0001, DPS0002, DPS0003, OAK0001...
 * 
 * Rules:
 * - Calculated strictly from existing usernames for THAT specific school code.
 * - Does NOT use global student counts.
 * - Does NOT use Student ID as username.
 * - Format: School Code (3 letters) + 4-digit sequence (e.g. DPS0001).
 */
export function generateSchoolStudentUsername(
  schoolCodeOrNameOrSchool: string | SchoolOrganization | undefined,
  existingUsers: (UserAccount | { username?: string; studentUsername?: string; organizationId?: string; schoolCode?: string })[] = [],
  schoolId?: string
): string {
  let prefix = '';
  if (typeof schoolCodeOrNameOrSchool === 'object' && schoolCodeOrNameOrSchool !== null) {
    prefix = schoolCodeOrNameOrSchool.schoolCode || getSchoolPrefix(schoolCodeOrNameOrSchool.name || schoolCodeOrNameOrSchool.id);
  } else {
    const str = (schoolCodeOrNameOrSchool || '').trim();
    // If it's a 2-5 letter code like "DPS" or "OAK"
    if (/^[a-zA-Z0-9]{2,5}$/.test(str)) {
      prefix = str.toUpperCase();
    } else {
      prefix = generateSchoolCode(str);
    }
  }
  if (!prefix) prefix = 'SCH';

  const existingSet = new Set<string>();
  for (const u of existingUsers) {
    if (!u) continue;
    const un = (
      ('username' in u && u.username) ||
      ('studentUsername' in u && u.studentUsername) ||
      ''
    ).toUpperCase().trim();
    if (un) existingSet.add(un);
  }

  // Find highest sequence number matching THIS school's code prefix
  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');
  let maxNum = 0;

  for (const un of existingSet) {
    const match = un.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `${prefix}${String(nextNum).padStart(4, '0')}`;
  while (existingSet.has(candidate)) {
    nextNum++;
    candidate = `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  return candidate;
}

/**
 * Generates an automatic, standardized, unique student username.
 * 
 * Rules:
 * 1. For individual / parent-linked students:
 *    - First 3 letters of First Name + First 3 letters of Last Name + sequence number (1, 2, 3...)
 *    - Example: "Larry Smith" -> "LARSMI1"
 *    - Next student with same name -> "LARSMI2"
 *    - If single name given (e.g. "Larry") and parent has last name (e.g. "Watson"): "LARWAT1"
 *    - If single name and no parent last name: "LARSTU1"
 * 
 * 2. For school-linked students:
 *    - School prefix (e.g., "DAV", "OAK") + 4-digit sequence (e.g., "DAV0001", "OAK0001")
 * 
 * 3. Enforces strict global uniqueness and immutability.
 */
export function generateStudentUsername(
  fullName: string,
  existingUsers: (UserAccount | { username?: string; studentUsername?: string })[] = [],
  schoolNameOrId?: string,
  isSchoolStudent: boolean = false,
  parentName?: string
): string {
  if (isSchoolStudent && schoolNameOrId) {
    return generateSchoolStudentUsername(schoolNameOrId, existingUsers);
  }

  const existingUsernames = new Set<string>();
  for (const u of existingUsers) {
    const un = (
      ('username' in u && u.username) ||
      ('studentUsername' in u && u.studentUsername) ||
      ''
    ).toUpperCase().trim();
    if (un) existingUsernames.add(un);
  }

  const cleanName = (fullName || 'Student Learner').trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const nameParts = cleanName.split(/\s+/).filter(Boolean);

  let firstPart = 'STU';
  let lastPart = 'KID';

  if (nameParts.length >= 2) {
    // "Larry Smith" -> firstPart = "LAR", lastPart = "SMI"
    firstPart = (nameParts[0].slice(0, 3) + 'XXX').slice(0, 3);
    lastPart = (nameParts[nameParts.length - 1].slice(0, 3) + 'XXX').slice(0, 3);
  } else if (nameParts.length === 1) {
    firstPart = (nameParts[0].slice(0, 3) + 'XXX').slice(0, 3);
    if (parentName) {
      const parentParts = parentName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      if (parentParts.length > 0) {
        lastPart = (parentParts[parentParts.length - 1].slice(0, 3) + 'XXX').slice(0, 3);
      } else {
        lastPart = 'PAR';
      }
    } else {
      lastPart = (nameParts[0].slice(3, 6) || 'STU').padEnd(3, 'X').slice(0, 3);
    }
  }

  const base = `${firstPart}${lastPart}`;

  // Find next available sequence number starting from 1 (e.g. AARGAR1, AARGAR2, AARGAR3...)
  let seq = 1;
  let candidate = `${base}${seq}`;
  while (existingUsernames.has(candidate)) {
    seq++;
    candidate = `${base}${seq}`;
  }

  return candidate;
}

/**
 * Ensures any desired or submitted username is globally unique by appending or incrementing
 * a numeric suffix if collision occurs (e.g. AARGAR1 -> AARGAR2 -> AARGAR3).
 */
export function ensureUniqueUsername(
  desiredUsername: string,
  existingUsers: (UserAccount | { username?: string; studentUsername?: string })[] = []
): string {
  const existingSet = new Set<string>();
  for (const u of existingUsers) {
    if (!u) continue;
    const un = (
      ('username' in u && u.username) ||
      ('studentUsername' in u && u.studentUsername) ||
      ''
    ).toUpperCase().trim();
    if (un) existingSet.add(un);
  }

  const clean = (desiredUsername || 'STU1').toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
  if (!clean) return 'STU1';

  if (!existingSet.has(clean)) {
    return clean;
  }

  // Extract base and trailing digits (e.g. "AARGAR1" -> base "AARGAR", num 1)
  const match = clean.match(/^(.*?)(\d+)$/);
  const base = match && match[1] ? match[1] : clean;
  let counter = match ? parseInt(match[2], 10) + 1 : 2;

  let candidate = `${base}${counter}`;
  while (existingSet.has(candidate)) {
    counter++;
    candidate = `${base}${counter}`;
  }

  return candidate;
}

/**
 * Master Question Bank grade codes.
 * QIDs intentionally contain only subject + grade + sequence.
 * Category, skill and question type are separate master-data fields.
 */
export function getQuestionSubjectCode(subject?: string): string {
  const value = (subject || 'Mathematics').trim().toLowerCase();
  if (value.includes('math') || value.includes('mth') || value.includes('sub_m')) return 'MAT';
  if (value.includes('english') || value.includes('phonics') || value.includes('sub_eng') || value === 'eng') return 'ENG';
  if (value.includes('science') || value.includes('nature') || value.includes('sub_sci')) return 'SCI';
  if (value.includes('art') || value.includes('creative') || value.includes('sub_art')) return 'ART';
  if (value.includes('computer') || value.includes('technology') || value.includes('sub_ict')) return 'ICT';
  const clean = value.replace(/^sub[_-]?/i, '').replace(/[^a-z]/g, '').toUpperCase();
  return clean.slice(0, 3) || 'SUB';
}

export function getQuestionGradeCode(grade?: string): string {
  const normalized = (grade || '').trim().toLowerCase();

  // Preschool / Pre-K / Pre Kindergarten / GRD_PRE / GRD_PRE_K / GRD_PS / PK
  if (
    normalized.includes('preschool') ||
    normalized.includes('pre_k') ||
    normalized.includes('pre-k') ||
    normalized.includes('prek') ||
    normalized.includes('pre_primary') ||
    normalized.includes('preprimary') ||
    normalized.includes('grd_pre') ||
    normalized.includes('grd_ps') ||
    normalized.includes('grd_pk') ||
    normalized.endsWith('_pre') ||
    normalized.startsWith('pre') ||
    normalized === 'ps' ||
    normalized === 'pk'
  ) {
    return 'PRE';
  }

  // Foundation / Fnd / GRD_FND
  if (
    normalized.includes('foundation') ||
    normalized.includes('fnd') ||
    normalized.includes('found') ||
    normalized.includes('grd_fnd')
  ) {
    return 'FND';
  }

  // Kindergarten / Kin / KG / GRD_KIN / GRD_KG
  if (
    normalized.includes('kindergarten') ||
    normalized.includes('kin') ||
    normalized.includes('kg') ||
    normalized.includes('grd_kin') ||
    normalized.includes('grd_kg')
  ) {
    return 'KG';
  }

  // Grade 1..12 / G1..G12 / GRD_G1..GRD_G12
  const gradeMatch = normalized.match(/(?:grade|grd|g)\s*[_|-]?\s*(\d+)/i) || normalized.match(/^g(\d+)/i);
  if (gradeMatch) {
    return `G${gradeMatch[1]}`;
  }

  const numMatch = normalized.match(/\d+/);
  if (numMatch) {
    return `G${numMatch[0]}`;
  }

  return 'G1';
}

/** Returns the next Master Question Bank QID, e.g. M-G5-000001. */
export function getNextQuestionId(
  gradeOrList?: string | { id: string; grade?: string; subject?: string }[],
  questionsList?: { id: string; grade?: string; subject?: string }[] | number,
  offset: number = 0,
  subject?: string
): string {
  let grade = 'Grade 1';
  let existingQuestions: { id: string; grade?: string; subject?: string }[] = [];
  let off = offset;

  if (typeof gradeOrList === 'string') {
    grade = gradeOrList;
    if (Array.isArray(questionsList)) existingQuestions = questionsList;
  } else if (Array.isArray(gradeOrList)) {
    existingQuestions = gradeOrList;
    if (typeof questionsList === 'number') off = questionsList;
  }

  const subjectCode = getQuestionSubjectCode(subject || existingQuestions.find(q => q.grade === grade)?.subject || 'Mathematics');
  const gradeCode = getQuestionGradeCode(grade);
  const prefix = `${subjectCode}-${gradeCode}`;
  const regex = new RegExp(`^${prefix}[-_]?(\\d+)$`, 'i');
  let maxSeq = 0;
  for (const q of existingQuestions) {
    const match = (q.id || '').match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  }
  const existingSet = new Set(existingQuestions.map(q => q.id.toUpperCase()));
  let nextSeq = maxSeq + 1 + off;
  let candidate = `${prefix}-${String(nextSeq).padStart(6, '0')}`;
  while (existingSet.has(candidate.toUpperCase())) {
    nextSeq++;
    candidate = `${prefix}-${String(nextSeq).padStart(6, '0')}`;
  }
  return candidate;
}

/**
 * Universal Sanitizer: Re-indexes all questions in a question bank to strictly adhere
 * to the centralized formula [SUBJECT]-[GRADE]-[6-DIGIT SEQUENCE].
 * Completely cleanses legacy and incorrectly formatted IDs (like SUB-G1 for Preschool).
 */
export function sanitizeQuestionBank<T extends { id: string; grade?: string; subject?: string }>(
  rawQuestions: T[]
): { questions: T[]; idMap: Record<string, string> } {
  const normalized: T[] = [];
  const idMap: Record<string, string> = {};

  (rawQuestions || []).forEach((q) => {
    if (!q) return;
    const cleanSubject = q.subject || 'Mathematics';
    const cleanGrade = q.grade || 'Grade 1';

    const canonicalId = getNextQuestionId(cleanGrade, normalized, 0, cleanSubject);
    if (q.id) {
      idMap[q.id] = canonicalId;
    }

    normalized.push({
      ...q,
      id: canonicalId,
      subject: cleanSubject,
      grade: cleanGrade
    });
  });

  return { questions: normalized, idMap };
}
