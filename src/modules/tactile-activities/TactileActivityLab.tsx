import React, { useState, useMemo } from 'react';
import { AnyTactileActivity, GradeLevel, SubjectCategory } from './types';
import { SAMPLE_TACTILE_ACTIVITIES } from './data/sampleActivities';
import DragDropSortEngine from './components/DragDropSortEngine';
import PhonicsBuilderEngine from './components/PhonicsBuilderEngine';
import TimelineSequenceEngine from './components/TimelineSequenceEngine';
import LineConnectEngine from './components/LineConnectEngine';
import CanvasTracingEngine from './components/CanvasTracingEngine';
import FeedingCareEngine from './components/FeedingCareEngine';
import MemoryMatchEngine from './components/MemoryMatchEngine';
import BalloonPopEngine from './components/BalloonPopEngine';
import { sounds } from '../../utils/audio';
import { 
  Sparkles, 
  Gamepad2, 
  Layers, 
  CheckCircle2, 
  ArrowLeft, 
  Volume2, 
  BookOpen, 
  Search,
  X,
  Trophy,
  Play
} from 'lucide-react';

interface TactileActivityLabProps {
  onClose?: () => void;
  isModal?: boolean;
  studentGrade?: string;
}

const normalizeGradeKey = (g?: string): string => {
  if (!g) return 'all';
  const clean = g.toLowerCase().replace(/[\s-]+/g, '_');
  if (clean.includes('preschool') || clean.includes('pre_k')) return 'preschool';
  if (clean.includes('foundation') || clean.includes('prep') || clean.includes('reception')) return 'foundation';
  if (clean.includes('kg') || clean.includes('kindergarten')) return 'kindergarten';
  if (clean.includes('1') || clean.includes('grade_1')) return 'grade_1';
  if (clean.includes('2') || clean.includes('grade_2')) return 'grade_2';
  if (clean.includes('3') || clean.includes('grade_3')) return 'grade_3';
  if (clean.includes('4') || clean.includes('grade_4')) return 'grade_4';
  if (clean.includes('5') || clean.includes('grade_5')) return 'grade_5';
  if (clean.includes('6') || clean.includes('grade_6')) return 'grade_6';
  return clean;
};

export default function TactileActivityLab({ onClose, isModal = false, studentGrade }: TactileActivityLabProps) {
  const [selectedActivity, setSelectedActivity] = useState<AnyTactileActivity | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedActivityIds, setCompletedActivityIds] = useState<string[]>([]);

  const normalizedStudentGrade = useMemo(() => normalizeGradeKey(studentGrade), [studentGrade]);

  // Filter activities scoped automatically to the student's grade
  const filteredActivities = useMemo(() => {
    return SAMPLE_TACTILE_ACTIVITIES.filter((act) => {
      // If student grade is specified, strictly scope to student grade (with natural pairing for preschool/foundation/kindergarten)
      if (normalizedStudentGrade !== 'all') {
        const actGrade = act.gradeLevel;
        if (normalizedStudentGrade === 'preschool') {
          if (actGrade !== 'preschool' && actGrade !== 'foundation') return false;
        } else if (normalizedStudentGrade === 'foundation' || normalizedStudentGrade === 'kindergarten') {
          if (actGrade !== 'foundation' && actGrade !== 'kindergarten' && actGrade !== 'preschool') return false;
        } else if (actGrade !== normalizedStudentGrade) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.topic.toLowerCase().includes(q) ||
          act.instruction.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [normalizedStudentGrade, searchQuery]);

  const handleSelectActivity = (act: AnyTactileActivity) => {
    sounds.click();
    setSelectedActivity(act);
  };

  const handleActivityComplete = (score: number) => {
    if (selectedActivity) {
      setCompletedActivityIds((prev) => [...new Set([...prev, selectedActivity.id])]);
    }
  };

  const getMechanicName = (type: string) => {
    switch (type) {
      case 'drag_drop_sort': return 'Drag & Drop Sorter';
      case 'phonics_builder': return 'Phonics Word Builder';
      case 'timeline_sequence': return 'Timeline Sequencer';
      case 'line_connect': return 'Matching & Pairs';
      case 'canvas_tracing': return 'Precision Canvas Tracing';
      case 'feeding_game': return 'Feed & Care Adventure';
      case 'memory_match': return 'Memory Match Concentration';
      case 'balloon_pop': return 'Balloon Pop Carnival';
      default: return 'Interactive Activity';
    }
  };

  const formatGradeLabel = (g: string) => {
    if (g === 'preschool') return 'Preschool';
    if (g === 'foundation') return 'Foundation';
    if (g === 'kindergarten') return 'Kindergarten';
    if (g === 'grade_1') return 'Grade 1';
    if (g === 'grade_2') return 'Grade 2';
    if (g === 'grade_3') return 'Grade 3';
    if (g === 'grade_4') return 'Grade 4';
    if (g === 'grade_5') return 'Grade 5';
    if (g === 'grade_6') return 'Grade 6';
    return g.replace('_', ' ');
  };

  return (
    <div className={`bg-[#f8faff] text-slate-900 ${isModal ? 'p-4 sm:p-6 rounded-3xl max-w-5xl mx-auto' : 'p-2 sm:p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e1e6f1]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <span>{studentGrade ? `${studentGrade} Interactive Activities` : 'Interactive Activities'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500 font-normal">Hands-On Practice</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#10246f] mt-0.5 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-blue-600" />
            <span>Interactive Activities</span>
          </h2>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main View: Either Activity Runner or Activity Browser */}
      {selectedActivity ? (
        /* PLAY STAGE ACTIVE */
        <div className="pt-4 space-y-4 animate-in fade-in duration-200">
          {/* Top navigation breadcrumb */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e1e6f1] shadow-2xs">
            <button
              type="button"
              onClick={() => {
                sounds.click();
                setSelectedActivity(null);
              }}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Activities</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="font-bold text-[#10246f]">{getMechanicName(selectedActivity.type)}</span>
              {completedActivityIds.includes(selectedActivity.id) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Completed
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Activity Info Banner */}
          <div className="bg-white border border-[#e1e6f1] rounded-2xl p-4 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedActivity.icon}</span>
              <div>
                <h3 className="text-base font-black text-[#10246f]">{selectedActivity.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="uppercase font-bold text-blue-700">{selectedActivity.subject}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatGradeLabel(selectedActivity.gradeLevel)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedActivity.topic}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              👉 {selectedActivity.instruction}
            </p>
          </div>

          {/* Dedicated Engine Renderer based on activity archetype */}
          <div className="bg-white border border-[#e1e6f1] rounded-3xl p-4 sm:p-6 shadow-xs">
            {selectedActivity.type === 'drag_drop_sort' && (
              <DragDropSortEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
            {selectedActivity.type === 'phonics_builder' && (
              <PhonicsBuilderEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
            {selectedActivity.type === 'timeline_sequence' && (
              <TimelineSequenceEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
            {selectedActivity.type === 'line_connect' && (
              <LineConnectEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
            {selectedActivity.type === 'canvas_tracing' && (
              <CanvasTracingEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
            {selectedActivity.type === 'feeding_game' && (
              <FeedingCareEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
            {selectedActivity.type === 'memory_match' && (
              <MemoryMatchEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
            {selectedActivity.type === 'balloon_pop' && (
              <BalloonPopEngine activity={selectedActivity} onComplete={handleActivityComplete} />
            )}
          </div>
        </div>
      ) : (
        /* ACTIVITY BROWSER */
        <div className="pt-4 space-y-4">
          {/* Quick Search */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#e1e6f1] text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Activity Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredActivities.map((act) => {
              const isCompleted = completedActivityIds.includes(act.id);

              return (
                <div
                  key={act.id}
                  onClick={() => handleSelectActivity(act)}
                  className="bg-white border border-[#e1e6f1] hover:border-blue-400 rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer shadow-2xs hover:shadow-sm hover:scale-[1.01] select-none group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl p-2 rounded-xl bg-blue-50 border border-blue-100 group-hover:scale-105 transition-transform">
                        {act.icon}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {getMechanicName(act.type)}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-[#10246f] group-hover:text-blue-600 transition-colors">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {act.instruction}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {act.topic}
                    </span>
                    <span className="font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Play</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredActivities.length === 0 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#e1e6f1] text-xs text-slate-500">
              No interactive activities match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
