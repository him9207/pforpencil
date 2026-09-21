import React, { useState } from 'react';
import { SchoolOrganization, ClassRoom, UserAccount, GradeLevel } from '../../../types';
import { X, School, BookOpen, UserCheck, Users, Plus, Trash2, CheckCircle2, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { sounds } from '../../../utils/audio';
import { getNextRoleId, generateSchoolStudentUsername, generateAccountId, generateSchoolCode } from '../../../utils/idAndUsernameGenerator';

interface SchoolHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableGrades: string[];
  existingSchoolsCount: number;
  existingTeachersCount: number;
  existingStudentsCount: number;
  existingUsers?: UserAccount[];
  onSubmitHierarchy: (data: {
    school: SchoolOrganization;
    classroom?: ClassRoom;
    teacher?: UserAccount;
    students?: UserAccount[];
  }) => void;
}

interface StudentRow {
  tempId: string;
  name: string;
  username: string;
  pin: string;
  grade: GradeLevel;
  avatar: string;
}

const AVATARS = ['🦊', '🚀', '🦁', '🐼', '🦄', '🐯', '🌟', '🐬', '🦉', '🐨'];

export default function SchoolHierarchyModal({
  isOpen,
  onClose,
  availableGrades,
  existingSchoolsCount,
  existingTeachersCount,
  existingStudentsCount,
  existingUsers = [],
  onSubmitHierarchy
}: SchoolHierarchyModalProps) {
  if (!isOpen) return null;

  // 1. School Info State (Required)
  const defaultSchoolId = generateAccountId('school', existingUsers);
  const [schoolName, setSchoolName] = useState('Greenwood STEM Elementary');
  const [adminEmail, setAdminEmail] = useState('principal@greenwood.edu');
  const [schoolPlan, setSchoolPlan] = useState<'Basic 100' | 'Campus 500' | 'District 1000'>('Campus 500');
  const [totalSeats, setTotalSeats] = useState(500);

  // Optional Hierarchy Modules (Optional for Admin)
  const [includeClassroom, setIncludeClassroom] = useState(false);
  const [includeTeacher, setIncludeTeacher] = useState(false);
  const [includeStudents, setIncludeStudents] = useState(false);

  // 2. Class Info State (Optional)
  const defaultClassId = `CLS${String(Date.now()).slice(-4)}`;
  const [className, setClassName] = useState('Class 3-A (Stem Pioneers)');
  const [classGrade, setClassGrade] = useState<GradeLevel>('Grade 3');

  // 3. Teacher Info State (Optional)
  const defaultTeacherId = getNextRoleId('teacher', existingUsers);
  const [teacherName, setTeacherName] = useState('Dr. Alan Walker');
  const [teacherEmail, setTeacherEmail] = useState('a.walker@greenwood.edu');

  // 4. Students Roster State (Optional)
  const studentNum = existingStudentsCount + 1;
  const [studentsList, setStudentsList] = useState<StudentRow[]>([
    {
      tempId: 'row-1',
      name: 'Oliver Twist',
      username: generateSchoolStudentUsername(schoolName, existingUsers),
      pin: '2345',
      grade: 'Grade 3',
      avatar: '🦊'
    },
    {
      tempId: 'row-2',
      name: 'Mia Martinez',
      username: generateSchoolStudentUsername(schoolName, [...existingUsers, { id: 'TEMP', role: 'student', username: generateSchoolStudentUsername(schoolName, existingUsers) } as UserAccount]),
      pin: '3456',
      grade: 'Grade 3',
      avatar: '🦄'
    }
  ]);

  const handleAddStudentRow = () => {
    sounds.click();
    const nextNum = studentNum + studentsList.length;
    const newStudent: StudentRow = {
      tempId: `row-${Date.now()}`,
      name: '',
      username: generateSchoolStudentUsername(schoolName, [
        ...existingUsers,
        ...studentsList.map((row) => ({ username: row.username }))
      ]),
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      grade: classGrade,
      avatar: AVATARS[studentsList.length % AVATARS.length]
    };
    setStudentsList([...studentsList, newStudent]);
  };

  const handleRemoveStudentRow = (tempId: string) => {
    sounds.click();
    if (studentsList.length <= 1) return;
    setStudentsList(studentsList.filter((s) => s.tempId !== tempId));
  };

  const handleUpdateStudentRow = (tempId: string, field: keyof StudentRow, value: string) => {
    setStudentsList((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      return;
    }

    // 1. Create School Object (Always created)
    const schoolCode = generateSchoolCode(schoolName.trim(), existingUsers);
    const schoolObj: SchoolOrganization = {
      id: defaultSchoolId,
      schoolCode,
      name: schoolName.trim(),
      adminEmail: adminEmail.trim() || `admin@${defaultSchoolId.toLowerCase()}.edu`,
      totalSeats: Number(totalSeats) || 500,
      allocatedSeats: includeStudents ? studentsList.filter(s => s.name.trim()).length : 0,
      activeTeachers: includeTeacher ? 1 : 0,
      activeClasses: includeClassroom ? 1 : 0,
      plan: schoolPlan,
      expiresAt: '2026-12-31',
      status: 'active'
    };

    // 2. Create Teacher Object (Optional)
    let teacherObj: UserAccount | undefined = undefined;
    if (includeTeacher && teacherName.trim()) {
      teacherObj = {
        id: defaultTeacherId,
        role: 'teacher',
        name: teacherName.trim(),
        email: teacherEmail.trim() || `${defaultTeacherId.toLowerCase()}@school.edu`,
        avatar: '👨‍🏫',
        organizationId: schoolObj.id,
        schoolName: schoolObj.name,
        schoolCode,
        grade: classGrade,
        enrolledAt: new Date().toISOString().slice(0, 10),
        status: 'active'
      };
    }

    // 3. Create Student Objects (Optional)
    let studentUsers: UserAccount[] | undefined = undefined;
    if (includeStudents) {
      const validStudents = studentsList.filter((s) => s.name.trim().length > 0);
      if (validStudents.length > 0) {
        let studentUsersSoFar: UserAccount[] = [];
        studentUsers = validStudents.map((s) => {
          const sId = generateAccountId('student', [...existingUsers, ...studentUsersSoFar]);
          const username = generateSchoolStudentUsername(schoolCode, [
            ...existingUsers,
            ...studentUsersSoFar,
            ...validStudents.map((row) => ({ username: row.username }))
          ]);
          const student: UserAccount = {
            id: sId,
            role: 'student',
            name: s.name.trim(),
            username: username || s.username.trim().toUpperCase(),
            pin: s.pin.trim() || '1234',
            avatar: s.avatar,
            organizationId: schoolObj.id,
            schoolName: schoolObj.name,
            schoolCode,
            grade: s.grade || classGrade,
            enrolledAt: new Date().toISOString().slice(0, 10),
            status: 'active'
          };
          studentUsersSoFar.push(student);
          return student;
        });
      }
    }

    // 4. Create Classroom Object (Optional)
    let classObj: ClassRoom | undefined = undefined;
    if (includeClassroom && className.trim()) {
      classObj = {
        id: defaultClassId,
        name: className.trim(),
        grade: classGrade,
        teacherId: teacherObj ? teacherObj.id : 'TEA-TBD',
        teacherName: teacherObj ? teacherObj.name : 'Unassigned Faculty',
        schoolId: schoolObj.id,
        studentIds: studentUsers ? studentUsers.map((u) => u.id) : [],
        averageScore: 90,
        activeAssignments: ['Diagnostic Placement Quiz']
      };
    }

    sounds.success();
    onSubmitHierarchy({
      school: schoolObj,
      classroom: classObj,
      teacher: teacherObj,
      students: studentUsers
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
              <School className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">School Account & Hierarchy Provisioning</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Admin Tool
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Create institutional school account. Class, teacher, and student creation is optional for Admin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Mode Preset Selector */}
        <div className="bg-stone-100/80 px-6 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-stone-600">Quick Configuration Presets:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sounds.click();
                setIncludeClassroom(false);
                setIncludeTeacher(false);
                setIncludeStudents(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                !includeClassroom && !includeTeacher && !includeStudents
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <School className="w-3.5 h-3.5 text-blue-500" />
              <span>School Account Only (Default)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.click();
                setIncludeClassroom(true);
                setIncludeTeacher(true);
                setIncludeStudents(true);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                includeClassroom && includeTeacher && includeStudents
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>All-in-One (Include Class, Teacher & Students)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-stone-800">
          {/* NOTICE BANNER */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Role Responsibilities Notice:</span> As Super Admin, you can provision the School account independently. Classrooms, teachers, and students are optional. When the School Admin or Teacher logs into their own portal, they can create and manage their own classrooms, faculty teachers, and students.
            </div>
          </div>

          {/* STEP 1: SCHOOL INFO (REQUIRED) */}
          <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/20 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900 border-b border-stone-200 pb-2">
              <School className="w-4 h-4 text-blue-600" />
              <span>Step 1: School Organization Account</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                Required
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                ID: {defaultSchoolId}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-700">Official School Name *</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="e.g. Greenwood STEM Elementary"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-stone-700">School Admin / Principal Email *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="principal@school.edu"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-stone-700">Seat License Tier</label>
                <select
                  value={schoolPlan}
                  onChange={(e) => {
                    const p = e.target.value as any;
                    setSchoolPlan(p);
                    if (p === 'Basic 100') setTotalSeats(100);
                    if (p === 'Campus 500') setTotalSeats(500);
                    if (p === 'District 1000') setTotalSeats(1000);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                >
                  <option value="Basic 100">Basic 100 (100 Seats)</option>
                  <option value="Campus 500">Campus 500 (500 Seats)</option>
                  <option value="District 1000">District 1000 (1,000 Seats)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-stone-700">Total Seat Capacity</label>
                <input
                  type="number"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: CLASSROOM (OPTIONAL) */}
          <div className={`p-4 rounded-xl border transition-all ${
            includeClassroom ? 'border-emerald-300 bg-emerald-50/20' : 'border-stone-200 bg-stone-50/50'
          }`}>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeClassroom}
                  onChange={(e) => {
                    sounds.click();
                    setIncludeClassroom(e.target.checked);
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
                />
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-stone-900">
                  Step 2: Create Initial Classroom
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700 uppercase tracking-wider">
                  Optional
                </span>
              </label>

              {includeClassroom && (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                  ID: {defaultClassId}
                </span>
              )}
            </div>

            {includeClassroom ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Class Section Name</label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    placeholder="e.g. Class 3-A (Stem Pioneers)"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700">Curriculum Grade Level</label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value as GradeLevel)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic mt-2">
                Skipped. School Admin or Teacher can create classrooms directly from the School Portal.
              </p>
            )}
          </div>

          {/* STEP 3: TEACHER (OPTIONAL) */}
          <div className={`p-4 rounded-xl border transition-all ${
            includeTeacher ? 'border-blue-300 bg-blue-50/20' : 'border-slate-200 bg-slate-50/50'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTeacher}
                  onChange={(e) => {
                    sounds.click();
                    setIncludeTeacher(e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">
                  Step 3: Create Lead Faculty Teacher
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wider">
                  Optional
                </span>
              </label>

              {includeTeacher && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                  ID: {defaultTeacherId}
                </span>
              )}
            </div>

            {includeTeacher ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Teacher Full Name</label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="e.g. Dr. Alan Walker"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Teacher Work Email</label>
                  <input
                    type="email"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="a.walker@greenwood.edu"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic mt-2">
                Skipped. School Admin can create and invite faculty teachers directly in the School Portal.
              </p>
            )}
          </div>

          {/* STEP 4: ENROLLED STUDENTS (OPTIONAL) */}
          <div className={`p-4 rounded-xl border transition-all ${
            includeStudents ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200 bg-stone-50/50'
          }`}>
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeStudents}
                  onChange={(e) => {
                    sounds.click();
                    setIncludeStudents(e.target.checked);
                  }}
                  className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
                />
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-stone-900">
                  Step 4: Enroll Initial Student Cohort
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-700 uppercase tracking-wider">
                  Optional
                </span>
              </label>

              {includeStudents && (
                <button
                  type="button"
                  onClick={handleAddStudentRow}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Student Row</span>
                </button>
              )}
            </div>

            {includeStudents ? (
              <div className="space-y-3 mt-3">
                <p className="text-xs text-stone-500">
                  Enter student names. Unique usernames and 4-digit PINs are generated automatically.
                </p>
                <div className="space-y-2">
                  {studentsList.map((st, idx) => (
                    <div
                      key={st.tempId}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-lg bg-white border border-stone-200 text-xs"
                    >
                      <span className="w-6 text-center font-bold text-stone-400">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Student Full Name"
                        value={st.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          handleUpdateStudentRow(st.tempId, 'name', name);
                          if (name.length >= 3) {
                            const clean = name.slice(0, 3).toUpperCase();
                            handleUpdateStudentRow(
                              st.tempId,
                              'username',
                              `${clean}${String(studentNum + idx).padStart(4, '0')}`
                            );
                          }
                        }}
                        className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-stone-400">User:</span>
                        <input
                          type="text"
                          value={st.username}
                          onChange={(e) => handleUpdateStudentRow(st.tempId, 'username', e.target.value.toUpperCase())}
                          className="w-24 px-2 py-1.5 rounded border border-stone-200 font-mono font-bold text-amber-800 bg-amber-50/50 text-center"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-stone-400">PIN:</span>
                        <input
                          type="text"
                          maxLength={4}
                          value={st.pin}
                          onChange={(e) => handleUpdateStudentRow(st.tempId, 'pin', e.target.value)}
                          className="w-16 px-2 py-1.5 rounded border border-stone-200 font-mono font-bold text-stone-900 bg-stone-50 text-center"
                        />
                      </div>
                      <select
                        value={st.avatar}
                        onChange={(e) => handleUpdateStudentRow(st.tempId, 'avatar', e.target.value)}
                        className="w-12 px-1 py-1.5 rounded border border-stone-200 text-center text-sm"
                      >
                        {AVATARS.map((av) => (
                          <option key={av} value={av}>
                            {av}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={studentsList.length <= 1}
                        onClick={() => handleRemoveStudentRow(st.tempId)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic mt-2">
                Skipped. Students can be enrolled individually or batch-enrolled later by the School Admin or Teacher.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-200">
            <div className="text-xs text-stone-500">
              Selected to provision: <span className="font-bold text-stone-900">School</span>
              {includeClassroom && <span> + Classroom</span>}
              {includeTeacher && <span> + Teacher</span>}
              {includeStudents && <span> + Students</span>}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>
                  {!includeClassroom && !includeTeacher && !includeStudents
                    ? 'Provision School Account Only'
                    : 'Provision School & Selected Items'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
