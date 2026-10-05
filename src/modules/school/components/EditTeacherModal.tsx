import React, { useState, FormEvent } from 'react';
import { UserAccount, GradeLevel, CurriculumGrade, ClassRoom } from '../../../types';
import { X, GraduationCap, Mail, Power, Calendar, Clock, Layers } from 'lucide-react';
import { useBodyScrollLock } from '../../../utils/useBodyScrollLock';

export interface TeacherClassRoleAssignment {
  classId: string;
  role: 'primary' | 'secondary';
}

interface EditTeacherModalProps {
  teacher: UserAccount;
  grades?: CurriculumGrade[];
  classes?: ClassRoom[];
  onClose: () => void;
  onSave: (updated: UserAccount, assignedClassIds?: string[], assignedClassRoles?: TeacherClassRoleAssignment[]) => void;
}

export default function EditTeacherModal({
  teacher,
  grades = [],
  classes = [],
  onClose,
  onSave
}: EditTeacherModalProps) {
  const [name, setName] = useState(teacher.name);
  const [email, setEmail] = useState(teacher.email || '');
  const [grade, setGrade] = useState<GradeLevel>((teacher.grade as GradeLevel) || 'Grade 1');
  
  // Map of classId -> role ('none' | 'primary' | 'secondary')
  const [classRoleMap, setClassRoleMap] = useState<Record<string, 'none' | 'primary' | 'secondary'>>(() => {
    const map: Record<string, 'none' | 'primary' | 'secondary'> = {};
    classes.forEach(c => {
      if (c.teacherId === teacher.id || c.teacherName === teacher.name) {
        map[c.id] = 'primary';
      } else if (c.secondaryTeacherId === teacher.id || c.secondaryTeacherName === teacher.name) {
        map[c.id] = 'secondary';
      } else {
        map[c.id] = 'none';
      }
    });
    return map;
  });

  const [status, setStatus] = useState<'active' | 'suspended'>(
    teacher.status === 'suspended' ? 'suspended' : 'active'
  );
  const [validityPreset, setValidityPreset] = useState<string>(() => {
    if (teacher.validityDuration?.includes('30') || teacher.validityDuration?.toLowerCase().includes('month')) return '30';
    if (teacher.validityDuration?.includes('90')) return '90';
    if (teacher.validityDuration?.includes('180')) return '180';
    if (teacher.validityDuration?.includes('730')) return '730';
    return '365';
  });
  const [validUntil, setValidUntil] = useState<string>(
    teacher.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const availableGrades: GradeLevel[] = grades.length > 0
    ? grades.filter(g => g.active).map(g => g.name as GradeLevel)
    : ['Preschool', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  const handleSetClassRole = (classId: string, role: 'none' | 'primary' | 'secondary') => {
    setClassRoleMap(prev => {
      const next = { ...prev, [classId]: role };
      // If setting a primary or secondary class, update teacher specialty grade if needed
      if (role !== 'none') {
        const cls = classes.find(c => c.id === classId);
        if (cls?.grade) {
          setGrade(cls.grade);
        }
      }
      return next;
    });
  };

  const handlePresetChange = (days: string) => {
    setValidityPreset(days);
    if (days === 'custom') return;
    const numDays = parseInt(days, 10);
    if (!isNaN(numDays)) {
      const d = new Date();
      d.setDate(d.getDate() + numDays);
      setValidUntil(d.toISOString().slice(0, 10));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let validityLabel = 'Academic Year (365 Days)';
    if (validityPreset === '30') validityLabel = 'Monthly (30 Days)';
    else if (validityPreset === '90') validityLabel = 'Quarterly (90 Days)';
    else if (validityPreset === '180') validityLabel = 'Semester (180 Days)';
    else if (validityPreset === '365') validityLabel = 'Academic Year (365 Days)';
    else if (validityPreset === '730') validityLabel = '2 Years (730 Days)';
    else validityLabel = `Custom until ${validUntil}`;

    const updated: UserAccount = {
      ...teacher,
      name: name.trim(),
      email: email.trim(),
      grade,
      status,
      validUntil: validUntil.trim() || undefined,
      validityDuration: validityLabel
    };

    const assignedRolesList: TeacherClassRoleAssignment[] = [];
    const assignedClassIds: string[] = [];

    Object.entries(classRoleMap).forEach(([cid, role]) => {
      if (role === 'primary' || role === 'secondary') {
        assignedRolesList.push({ classId: cid, role });
        assignedClassIds.push(cid);
      }
    });

    onSave(updated, assignedClassIds, assignedRolesList);
  };

  // Lock body scroll while edit teacher modal is open
  useBodyScrollLock(true);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain modal-scroll-container"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">Edit Faculty Profile</h3>
              <p className="text-[11px] text-stone-500 font-mono">ID: {teacher.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Status Switch (Active vs Deactivated) */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="block font-bold text-stone-900 text-xs">Faculty Account Status</span>
              <span className="text-[11px] text-stone-500">
                {status === 'active' 
                  ? 'Teacher can login, manage classrooms, and grade.' 
                  : 'Teacher account is deactivated / suspended from login.'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-stone-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('suspended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  status === 'suspended'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>Deactivated</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Teacher Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ms. Emily Davis"
              className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address (Login Account)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. e.davis@oakwood.edu"
                  className="w-full pl-8 pr-2.5 py-2.5 rounded-xl border border-stone-200 font-medium text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                Default Grade Specialty
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-stone-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Multi-Classroom Primary & Secondary Assignment Section */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="font-bold text-stone-900 text-xs block">
                    Classroom Assignments (Multi-Class Support)
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Assign this teacher to multiple classes as Primary Lead or Secondary Co-Teacher.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                {Object.values(classRoleMap).filter(r => r !== 'none').length} Assigned
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {classes.length === 0 ? (
                <p className="text-[11px] text-stone-400 italic py-2 text-center">No classrooms created in school yet.</p>
              ) : (
                classes.map((cls) => {
                  const currentRole = classRoleMap[cls.id] || 'none';
                  return (
                    <div 
                      key={cls.id}
                      className={`p-2.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-2 ${
                        currentRole === 'primary'
                          ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                          : currentRole === 'secondary'
                          ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                          : 'bg-white border-stone-200 text-stone-700'
                      }`}
                    >
                      <div className="min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{cls.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 text-[9px] font-bold">
                            {cls.grade}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          ID: {cls.id}{cls.room ? ` • ${cls.room}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleSetClassRole(cls.id, 'none')}
                          className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                            currentRole === 'none'
                              ? 'bg-stone-200 text-stone-800 shadow-2xs'
                              : 'text-stone-400 hover:text-stone-700'
                          }`}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetClassRole(cls.id, 'primary')}
                          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            currentRole === 'primary'
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-blue-700 hover:bg-blue-100/60'
                          }`}
                        >
                          Primary Lead
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetClassRole(cls.id, 'secondary')}
                          className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            currentRole === 'secondary'
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'text-purple-700 hover:bg-purple-100/60'
                          }`}
                        >
                          Secondary Co-Teacher
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Teacher Faculty Validity Section */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="font-bold text-emerald-950 text-xs block">Faculty Account Validity</span>
                <span className="text-[11px] text-emerald-800">
                  Set validity term and license expiration for this faculty profile.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '1 Month', days: '30' },
                { label: '3 Months', days: '90' },
                { label: '6 Months', days: '180' },
                { label: '1 Year (365d)', days: '365' },
                { label: '2 Years', days: '730' },
                { label: 'Custom Date', days: 'custom' },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => handlePresetChange(p.days)}
                  className={`px-2.5 py-2 rounded-xl text-center font-bold text-[11px] border transition-all cursor-pointer ${
                    validityPreset === p.days
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-stone-700 border-emerald-200 hover:bg-emerald-100/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block font-bold text-emerald-950 uppercase tracking-wider text-[10px] mb-1">
                Access Valid Until (Date)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-600" />
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => {
                    setValidUntil(e.target.value);
                    setValidityPreset('custom');
                  }}
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-white border border-emerald-300 font-bold text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-500/30 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 font-bold text-stone-600 hover:bg-stone-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
