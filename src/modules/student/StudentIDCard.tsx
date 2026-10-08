import React, { useState } from 'react';
import { UserAccount, StudentProgress } from '../../types';
import { X, Printer, Award, Sparkles, ShieldCheck, QrCode, Eye, EyeOff } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface StudentIDCardProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserAccount | StudentProgress;
  schoolName?: string;
  parentName?: string;
}

export default function StudentIDCard({
  isOpen,
  onClose,
  student,
  schoolName,
  parentName
}: StudentIDCardProps) {
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    sounds.playCorrect();
    window.print();
  };

  // Resolve student fields
  const studentName = 'name' in student ? student.name : student.studentName;
  const studentId = 'id' in student ? student.id : student.studentId;
  const username = 'username' in student ? student.username : ('studentUsername' in student ? (student as StudentProgress).studentUsername : '');
  const avatar = student.avatar || '🦊';
  const grade = student.grade || 'Grade 3';
  const pin = ('pin' in student ? student.pin : '1234') || '1234';
  const affiliatedSchool = schoolName || ('schoolName' in student ? student.schoolName : undefined) || 'PforPencil Mathematics Academy';
  const guardian = parentName || ('parentName' in student ? student.parentName : undefined) || 'Parent / Guardian';
  const validUntil = ('validUntil' in student ? student.validUntil : undefined) || '2026-08-31';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden print:border-none print:shadow-none">
        {/* Header bar (hidden in print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider">Official Student ID Card</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print ID Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Student ID Card Body */}
        <div className="p-6 bg-gradient-to-b from-blue-50/50 to-amber-50/30">
          <div className="relative rounded-3xl border-2 border-blue-200 bg-white p-5 shadow-lg overflow-hidden">
            {/* Top Card Branding */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-blue-100">
                  <span>P✏️</span>
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider uppercase text-stone-900 leading-tight">
                    {affiliatedSchool}
                  </h3>
                  <span className="text-[10px] text-blue-600 font-bold">
                    PforPencil Scholar Pass • 2025–2026
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Active Student
              </span>
            </div>

            {/* Main Student Card Content */}
            <div className="flex items-start gap-4">
              {/* Student Avatar */}
              <div className="shrink-0 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-amber-50 to-blue-50 border-2 border-amber-200 shadow-sm flex items-center justify-center text-4xl mx-auto ring-2 ring-amber-100/60">
                  {avatar}
                </div>
                <div className="mt-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-[10px] font-black font-mono shadow-2xs">
                    {grade}
                  </span>
                </div>
              </div>

              {/* Student Metadata */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <span className="text-[9px] uppercase font-bold text-stone-400 block tracking-wider">Student Learner</span>
                  <h2 className="text-base font-black text-stone-900 truncate leading-tight">
                    {studentName}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                    <span className="text-[9px] uppercase font-bold text-blue-600 block">Student ID</span>
                    <span className="font-mono font-black text-stone-800 text-[11px]">{studentId}</span>
                  </div>
                  <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                    <span className="text-[9px] uppercase font-bold text-indigo-600 block">Username</span>
                    <span className="font-mono font-black text-blue-700 text-[11px]">@{username}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold text-amber-700 block">Secret PIN</span>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-stone-400 hover:text-stone-700 p-0.5 print:hidden cursor-pointer"
                        title={showPin ? "Hide PIN" : "Reveal PIN"}
                      >
                        {showPin ? <EyeOff className="w-3 h-3 text-blue-600" /> : <Eye className="w-3 h-3 text-stone-500" />}
                      </button>
                    </div>
                    <span className="font-mono font-black text-stone-900 tracking-widest text-[11px]">
                      {showPin ? pin : '••••'}
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200/70">
                    <span className="text-[9px] uppercase font-bold text-emerald-700 block">Valid Until</span>
                    <span className="font-bold text-emerald-950 text-[10px]">{validUntil}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer: Barcode & Guardian */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[10px] text-slate-600">
                <span className="font-semibold block">Guardian: {guardian}</span>
                <span className="text-[9px] text-slate-500">Curriculum: Mathematics (Preschool - Grade 6)</span>
              </div>

              {/* Simulated QR Code */}
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <QrCode className="w-7 h-7 text-slate-800" />
                <div className="text-[8px] font-mono text-slate-600 leading-none">
                  SCAN FOR<br />PORTAL LOGIN
                </div>
              </div>
            </div>

            {/* Watermark seal */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-slate-100 pointer-events-none flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-slate-200" />
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500 print:hidden">
            Tip: Click <strong>Print ID Card</strong> to print on cardstock or save as a PDF file for students and parents!
          </div>
        </div>
      </div>
    </div>
  );
}
