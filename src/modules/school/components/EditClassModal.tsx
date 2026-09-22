import React, { useState, FormEvent } from 'react';
import { ClassRoom, UserAccount, GradeLevel, CurriculumGrade } from '../../../types';
import { X, Layers, UserCheck, Power, DoorOpen, FileText } from 'lucide-react';
import { useBodyScrollLock } from '../../../utils/useBodyScrollLock';

interface EditClassModalProps {
  classroom: ClassRoom;
  teachers: UserAccount[];
  grades?: CurriculumGrade[];
  onClose: () => void;
  onSave: (updated: ClassRoom) => void;
}

export default function EditClassModal({
  classroom,
  teachers,
  grades = [],
  onClose,
  onSave
}: EditClassModalProps) {
  const [name, setName] = useState(classroom.name);
  const [grade, setGrade] = useState<GradeLevel>(classroom.grade);
  const [section, setSection] = useState(classroom.section || '');
  const [teacherId, setTeacherId] = useState(classroom.teacherId);
  const [room, setRoom] = useState(classroom.room || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(classroom.status || 'active');
  const [description, setDescription] = useState(classroom.description || '');

  const availableGrades: GradeLevel[] = grades.length > 0
    ? grades.filter(g => g.active).map(g => g.name as GradeLevel)
    : ['Preschool', 'Foundation', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedTeacher = teachers.find(t => t.id === teacherId);

    const updated: ClassRoom = {
      ...classroom,
      name: name.trim(),
      grade,
      section: section.trim() || undefined,
      teacherId: selectedTeacher ? selectedTeacher.id : classroom.teacherId,
      teacherName: selectedTeacher ? selectedTeacher.name : classroom.teacherName,
      room: room.trim() || undefined,
      status,
      description: description.trim() || undefined
    };

    onSave(updated);
  };

  // Lock body scroll while editing class
  useBodyScrollLock(true);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto overscroll-contain modal-scroll-container"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-5 my-auto max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain modal-scroll-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Edit Classroom</h3>
              <p className="text-[11px] text-slate-500 font-mono">ID: {classroom.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-900 transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Status Switch */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="block font-bold text-slate-900 text-xs">Class Status</span>
              <span className="text-[11px] text-slate-500">
                {status === 'active' 
                  ? 'Class is active and visible to enrolled students.' 
                  : 'Class is deactivated / archived and paused.'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>Active</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  status === 'inactive'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>Deactivated</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Classroom Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Class 1-A (Explorers)"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              >
                {availableGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Section / Cohort
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Section A, Period 1"
                className="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Room Number
              </label>
              <div className="relative">
                <DoorOpen className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assigned Lead Teacher
            </label>
            <div className="relative">
              <UserCheck className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} • {t.grade || 'Faculty'} ({t.id})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Changing teacher reassigns classroom ownership and active student assignments.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description or Focus Area (Optional)
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. STEM and Interactive Foundations Cohort"
                className="w-full pl-8 pr-2.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
