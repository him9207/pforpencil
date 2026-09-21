import React, { useState, FormEvent } from 'react';
import { UserAccount, GradeLevel, CurriculumGrade, ClassRoom } from '../../../types';
import { X, GraduationCap, Mail, Power, Calendar, Clock, Layers } from 'lucide-react';

interface EditTeacherModalProps {
  teacher: UserAccount;
  grades?: CurriculumGrade[];
  classes?: ClassRoom[];
  onClose: () => void;
  onSave: (updated: UserAccount, assignedClassIds?: string[]) => void;
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
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    const existing = classes.find(c => c.teacherId === teacher.id || c.teacherName === teacher.name);
    return existing?.id || '';
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

  const handleClassSelectionChange = (classId: string) => {
    setSelectedClassId(classId);
    if (classId) {
      const targetClass = classes.find(c => c.id === classId);
      if (targetClass?.grade) {
        setGrade(targetClass.grade);
      }
    }
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

    onSave(updated, selectedClassId ? [selectedClassId] : []);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
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
                Assign Custom Class
              </label>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassSelectionChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 font-bold text-stone-800 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                >
                  <option value="">-- No Specific Class / Floating --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-stone-500 mt-0.5 block">
                Assigns teacher directly to school custom class & mapped grade.
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Curriculum Grade Specialty (Mapped Master Grade)
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
