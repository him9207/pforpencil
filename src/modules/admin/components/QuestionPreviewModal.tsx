import React from 'react';
import { Eye, X } from 'lucide-react';
import { Question } from '../../../types';
import QuestionRenderer from '../../activities/QuestionRenderer';

interface Props {
  question: Question | null;
  onClose: () => void;
}

const typeLabel = (type?: string) => ({
  multiple_choice: 'Multiple Choice', radio_single: 'Single Choice', fill_blank: 'Fill in the Blank',
  open_box: 'Fill in the Blank', true_false: 'True / False', image_choice: 'Image Choice', image_mcq: 'Image + MCQ',
  select_objects: 'Select Objects', drag_and_drop: 'Drag & Drop', match_making: 'Matching', ordering: 'Ordering',
  sorting: 'Sorting', number_line: 'Number Line', clock: 'Clock', data_graph: 'Data / Graph',
  word_problem: 'Word Problem', interactive: 'Interactive'
} as Record<string, string>)[type || ''] || (type || 'Question').replace(/_/g, ' ');

export default function QuestionPreviewModal({ question, onClose }: Props) {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-stone-50 rounded-3xl shadow-2xl border border-stone-200" onMouseDown={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950 text-white rounded-t-3xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Eye className="w-4 h-4" /> Live Student Interactive Preview
            </div>
            <div className="text-[11px] text-stone-300 mt-0.5">
              <span className="font-mono text-white font-semibold">{question.id}</span> · {typeLabel(question.type)} · {question.difficulty} · {question.grade || 'Preschool'}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition cursor-pointer" 
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <QuestionRenderer 
            question={question} 
            interactive={true} 
            showExplanation={true} 
          />
        </div>
      </div>
    </div>
  );
}

