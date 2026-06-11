import { useState, useEffect } from 'react';
import { X, Plus, Check, Play, ChevronRight, Bookmark } from 'lucide-react';
import { useSaveVocab } from '@/hooks/useSaveVocab';
import { Link } from '@/i18n/navigation';
import { supabase } from '@/lib/supabaseClient';

export interface VocabSavePopupProps {
  word: string;
  ipa?: string;
  definition?: string;
  translation?: string;
  example?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function VocabSavePopup({
  word,
  ipa: initialIpa,
  definition: initialDefinition,
  translation,
  example: initialExample,
  audioUrl: initialAudioUrl,
  partOfSpeech: initialPartOfSpeech,
  onClose,
  position
}: VocabSavePopupProps) {
  const { collections, isLoading, isSaved, saveWord } = useSaveVocab();
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning', showLink?: boolean } | null>(null);
  const [user, setUser] = useState<any>(null);

  const [ipa, setIpa] = useState(initialIpa);
  const [definition, setDefinition] = useState(initialDefinition);
  const [example, setExample] = useState(initialExample);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [partOfSpeech, setPartOfSpeech] = useState(initialPartOfSpeech);
  const [, setIsLookingUp] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    // If we don't have definition or ipa, try to fetch it
    if (!definition && !ipa) {
      setIsLookingUp(true);
      fetch(`/api/student/vocabulary/lookup?word=${encodeURIComponent(word)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.vocabularies && data.vocabularies.length > 0) {
             const bestMatch = data.vocabularies[0];
             if (!definition && bestMatch.definition) setDefinition(bestMatch.definition);
             if (!ipa && bestMatch.ipa) setIpa(bestMatch.ipa);
             if (!example && bestMatch.exampleSentence) setExample(bestMatch.exampleSentence);
             if (!partOfSpeech && bestMatch.partOfSpeech) setPartOfSpeech(bestMatch.partOfSpeech);
          } else {
            // Fallback to dictionaryapi.dev if lookup fails or has no data
            return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
              .then(res => res.json())
              .then(dictData => {
                if (dictData && dictData.length > 0) {
                  const entry = dictData[0];
                  const newIpa = entry.phonetic || (entry.phonetics && entry.phonetics.find((p: any) => p.text)?.text);
                  const newAudio = (entry.phonetics && entry.phonetics.find((p: any) => p.audio)?.audio);
                  if (!ipa && newIpa) setIpa(newIpa);
                  if (!audioUrl && newAudio) setAudioUrl(newAudio);
                  
                  const meaning = entry.meanings?.[0];
                  if (meaning) {
                    if (!partOfSpeech) setPartOfSpeech(meaning.partOfSpeech);
                    const def = meaning.definitions?.[0];
                    if (def) {
                      if (!definition) setDefinition(def.definition);
                      if (!example && def.example) setExample(def.example);
                    }
                  }
                }
              });
          }
        })
        .catch(console.warn)
        .finally(() => setIsLookingUp(false));
    }
  }, [word, definition, ipa, example, audioUrl, partOfSpeech]);

  const handlePlayAudio = () => {
    if (audioUrl) {
      new Audio(audioUrl).play();
    } else {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning', showLink = false) => {
    setToast({ message, type, showLink });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Đăng nhập để lưu từ vựng', 'warning');
      return;
    }

    setIsSaving(true);
    const result = await saveWord({
      word,
      ipa,
      definition: definition || '',
      translation: translation || '',
      exampleSentence: example,
      partOfSpeech: partOfSpeech || 'noun'
    }, selectedCollection || null);
    setIsSaving(false);

    if (result === 'saved') {
      showToast(`Đã lưu '${word}' vào sổ từ vựng`, 'success', true);
    } else if (result === 'duplicate') {
      showToast('Từ này đã có trong sổ từ vựng', 'warning', true);
    } else {
      showToast('Lỗi khi lưu từ vựng', 'error');
    }
  };

  const alreadySaved = isSaved(word);

  return (
    <>
      <div 
        className="fixed z-[9999] bg-[#1a1a1a] text-white rounded-xl shadow-2xl w-80 border border-gray-700 overflow-hidden font-sans"
        style={{ left: Math.min(position.x, window.innerWidth - 330), top: Math.min(position.y, window.innerHeight - 400) }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-2 pr-6">
            <span className="font-bold text-xl text-[#E9B53A] truncate">{word}</span>
            {ipa && <span className="text-gray-400 font-mono text-sm">[{ipa}]</span>}
            <button 
              onClick={handlePlayAudio}
              className="text-blue-400 hover:text-blue-300 p-1 rounded-full bg-blue-400/10 transition-colors flex-shrink-0"
              title="Nghe phát âm"
            >
              <Play size={14} className="fill-current" />
            </button>
          </div>
          {partOfSpeech && (
            <div className="text-gray-400 italic text-xs mt-1">{partOfSpeech}</div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3 text-sm max-h-60 overflow-y-auto">
          {definition && (
            <div>
              <span className="text-gray-500 font-bold text-xs uppercase mr-2">Def:</span>
              <span className="text-gray-200">{definition}</span>
            </div>
          )}
          {translation && (
            <div>
              <span className="text-gray-500 font-bold text-xs uppercase mr-2">Vi:</span>
              <span className="text-green-400 font-medium">{translation}</span>
            </div>
          )}
          {example && (
            <div>
              <span className="text-gray-500 font-bold text-xs uppercase mr-2">Ex:</span>
              <span className="text-gray-400 italic">"{example}"</span>
            </div>
          )}
          {!definition && !translation && (
            <div className="text-gray-500 italic text-center py-2">Không có dữ liệu chi tiết</div>
          )}
        </div>

        {/* Footer / Save Action */}
        <div className="p-4 border-t border-gray-700 bg-[#222]">
          {!user ? (
             <div className="text-center text-gray-400 text-sm py-2">
               Đăng nhập để lưu từ vựng
             </div>
          ) : alreadySaved ? (
             <div className="flex items-center justify-center gap-2 text-green-500 font-bold py-2 bg-green-500/10 rounded-lg">
               <Check size={16} /> Đã lưu trong sổ
             </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-medium">Lưu vào collection:</label>
                <select 
                  className="w-full bg-[#111] border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 transition-colors"
                  value={selectedCollection}
                  onChange={e => setSelectedCollection(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Mặc định (Tất cả) --</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg font-medium text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <><Plus size={16} /> Lưu vào sổ</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Local Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg z-[10000] flex items-center gap-3 animate-in slide-in-from-bottom-5 text-sm font-medium border
          ${toast.type === 'success' ? 'bg-green-900/90 text-green-100 border-green-800' : 
            toast.type === 'warning' ? 'bg-yellow-900/90 text-yellow-100 border-yellow-800' : 
            'bg-red-900/90 text-red-100 border-red-800'}
        `}>
          {toast.type === 'success' ? <Check size={16} className="text-green-400" /> : <Bookmark size={16} className="text-yellow-400" />}
          <span>{toast.message}</span>
          {toast.showLink && (
            <Link href="/vocab-grammar" className="ml-2 text-white hover:underline flex items-center gap-0.5 whitespace-nowrap bg-white/10 px-2 py-1 rounded-md transition-colors">
              Xem sổ <ChevronRight size={14} />
            </Link>
          )}
        </div>
      )}
    </>
  );
}
