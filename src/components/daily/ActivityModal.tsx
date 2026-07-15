'use client';
import React from 'react';
import VocabularyActivity from './activities/VocabularyActivity';
import GrammarActivity from './activities/GrammarActivity';
import DictationActivity from './activities/DictationActivity';
import TranslationActivity from './activities/TranslationActivity';
import MiniTestActivity from './activities/MiniTestActivity';

interface ActivityModalProps {
  activity: any;
  onComplete: (result: {
    itemIds: string[];
    results: any[];
    xpEarned: number;
  }) => void;
  onClose: () => void;
}

export function ActivityModal({ activity, onComplete, onClose }: ActivityModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease_both]">
      <div className="bg-[#FBF8EF] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200/80 sticky top-0 bg-[#FBF8EF]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activity.icon}</span>
            <div>
              <h2 className="font-black text-slate-800 text-lg leading-tight">{activity.title}</h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">+{activity.xp} XP khi hoàn thành</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 text-3xl font-light hover:scale-105 active:scale-95 transition-all"
          >
            ×
          </button>
        </div>

        {/* Content wrapper */}
        <div className="p-6">
          {activity.type === 'vocabulary' && (
            <VocabularyActivity activity={activity} onComplete={onComplete} />
          )}
          {activity.type === 'grammar' && (
            <GrammarActivity activity={activity} onComplete={onComplete} />
          )}
          {activity.type === 'dictation' && (
            <DictationActivity activity={activity} onComplete={onComplete} />
          )}
          {activity.type === 'translation' && (
            <TranslationActivity activity={activity} onComplete={onComplete} />
          )}
          {activity.type === 'mini_test' && (
            <MiniTestActivity activity={activity} onComplete={onComplete} />
          )}
        </div>
      </div>
    </div>
  );
}
