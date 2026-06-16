"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const FOLDER_COLORS = [
  { color: '#5D6B2D', deep: '#46531F' },
  { color: '#E08A2C', deep: '#C2693B' },
  { color: '#3B82F6', deep: '#2563EB' },
  { color: '#10B981', deep: '#059669' },
  { color: '#EC4899', deep: '#DB2777' },
  { color: '#8B5CF6', deep: '#7C3AED' },
];

interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  pos?: string;
  folder_id: string;
  created_at: string;
}

interface Folder {
  id: string;
  name: string;
  created_at: string;
  word_count?: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';
  return token
    ? { Authorization: `Bearer ${token}` }
    : { 'x-mock-user-id': 'usr_2' };
}

export default function FolderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params?.id as string;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addWord, setAddWord] = useState('');
  const [addDef, setAddDef] = useState('');
  const [addExample, setAddExample] = useState('');
  const [addPos, setAddPos] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [renamingFolder, setRenamingFolder] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const [folderRes, wordsRes] = await Promise.all([
        fetch('/api/notebook/folders', { headers }),
        fetch(`/api/notebook?folder_id=${folderId}`, { headers }),
      ]);
      const folderData = await folderRes.json();
      const wordsData = await wordsRes.json();

      if (folderData.data) {
        const found = folderData.data.find((f: Folder) => f.id === folderId);
        setFolder(found || null);
        setRenameValue(found?.name || '');
      }
      if (wordsData.data) setWords(wordsData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleAddWord(e: React.FormEvent) {
    e.preventDefault();
    if (!addWord.trim() || !addDef.trim()) { setAddError('Vui lòng nhập từ và nghĩa.'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/notebook', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: addWord.trim(),
          definition: addDef.trim(),
          example: addExample.trim() || undefined,
          pos: addPos.trim() || undefined,
          folder_id: folderId,
        }),
      });
      if (res.status === 409) { setAddError('Từ này đã tồn tại trong sổ của bạn.'); setAddLoading(false); return; }
      if (!res.ok) { setAddError('Thêm từ thất bại. Vui lòng thử lại.'); setAddLoading(false); return; }
      setAddWord(''); setAddDef(''); setAddExample(''); setAddPos('');
      setShowAddForm(false);
      await fetchAll();
    } catch (e) {
      setAddError('Đã xảy ra lỗi.');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteWord(wordId: string) {
    if (!confirm('Xoá từ này khỏi sổ tay?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/notebook?id=${wordId}`, { method: 'DELETE', headers });
      setWords(prev => prev.filter(w => w.id !== wordId));
    } catch (e) { console.error(e); }
  }

  async function handleRenameFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!renameValue.trim()) return;
    setRenameLoading(true);
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/notebook/folders', {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: folderId, name: renameValue.trim() }),
      });
      setFolder(prev => prev ? { ...prev, name: renameValue.trim() } : prev);
      setRenamingFolder(false);
    } catch (e) { console.error(e); } finally { setRenameLoading(false); }
  }

  async function handleDeleteFolder() {
    if (!confirm(`Xoá thư mục "${folder?.name}"? Các từ trong thư mục sẽ không bị xoá mà sẽ được chuyển ra ngoài.`)) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/notebook/folders?id=${folderId}`, { method: 'DELETE', headers });
      router.back();
    } catch (e) { console.error(e); }
  }

  const folderColor = FOLDER_COLORS[0];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1B1E13', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,.1)', borderTopColor: '#5D6B2D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!folder) return (
    <div style={{ minHeight: '100vh', background: '#1B1E13', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F3F1E6', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
        <div style={{ fontSize: '20px', fontWeight: '800' }}>Không tìm thấy thư mục</div>
        <button onClick={() => router.back()} style={{ marginTop: '20px', background: '#5D6B2D', border: 'none', borderRadius: '12px', color: '#FFF8EB', padding: '10px 20px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', cursor: 'pointer' }}>Quay lại</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#1B1E13', fontFamily: 'Nunito, sans-serif', color: '#F3F1E6', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Top Back Button */}
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#8a8f72', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: '13px', padding: '0', marginBottom: '24px' }} data-hover="color:#C9CFAE;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Tất cả thư mục
        </button>

        {/* Header Card */}
        <div style={{ background: '#242A18', border: '1px solid rgba(255,255,255,.07)', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#7E875F', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '4px' }}>BỘ TỪ CỦA BẠN</div>
              
              {renamingFolder ? (
                <form onSubmit={handleRenameFolder} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '8px', color: '#F3F1E6', fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: '24px', padding: '4px 10px', outline: 'none', width: '200px' }}
                  />
                  <button type="submit" disabled={renameLoading} style={{ background: '#5D6B2D', border: 'none', borderRadius: '8px', color: '#FFF8EB', padding: '6px 12px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>Lưu</button>
                  <button type="button" onClick={() => setRenamingFolder(false)} style={{ background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '8px', color: '#a8ae8c', padding: '6px 12px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>Huỷ</button>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: '28px', margin: 0, color: '#F3F1E6', lineHeight: '1.2' }}>{folder.name}</h1>
                  <button onClick={() => setRenamingFolder(true)} title="Đổi tên" style={{ background: 'none', border: 'none', color: '#7E875F', cursor: 'pointer', padding: '4px', display: 'flex' }} data-hover="color:#F3F1E6;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              )}
              
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#7E875F', marginTop: '2px' }}>{words.length} từ vựng</div>
            </div>
          </div>
          
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F6C453', border: 'none', borderRadius: '12px', padding: '12px 20px', fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: '15px', color: '#2A3114', cursor: 'pointer', boxShadow: '0 4px 0 #D5A021' }} onClick={() => router.push(`/practice/vocabulary?folder=${folderId}`)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            Luyện Flashcard
          </button>
        </div>

        {/* Action Bar (Add word) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button
            onClick={() => { setShowAddForm(true); setTimeout(() => document.getElementById('add-word-input')?.focus(), 50); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', padding: '8px 16px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: '13px', color: '#a8ae8c', cursor: 'pointer' }}
            data-hover="background:rgba(255,255,255,.1);color:#F3F1E6;"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Thêm từ mới
          </button>
        </div>

        {/* Add word form */}
        {showAddForm && (
          <form onSubmit={handleAddWord} style={{ background: '#242A18', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: '16px', margin: '0 0 18px', color: '#F3F1E6' }}>Thêm từ mới vào thư mục</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#7E875F', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.08em' }}>Từ vựng *</label>
                <input
                  id="add-word-input"
                  value={addWord}
                  onChange={e => setAddWord(e.target.value)}
                  placeholder="e.g. ubiquitous"
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', color: '#F3F1E6', fontFamily: 'Nunito, sans-serif', fontWeight: '700', fontSize: '15px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#7E875F', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.08em' }}>Nghĩa *</label>
                <input
                  value={addDef}
                  onChange={e => setAddDef(e.target.value)}
                  placeholder="e.g. có mặt khắp nơi"
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', color: '#F3F1E6', fontFamily: 'Nunito, sans-serif', fontWeight: '700', fontSize: '15px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#7E875F', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.08em' }}>Ví dụ</label>
                <input
                  value={addExample}
                  onChange={e => setAddExample(e.target.value)}
                  placeholder="e.g. Technology has become ubiquitous."
                  style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', color: '#F3F1E6', fontFamily: 'Nunito, sans-serif', fontWeight: '700', fontSize: '15px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#7E875F', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.08em' }}>Loại từ</label>
                <select
                  value={addPos}
                  onChange={e => setAddPos(e.target.value)}
                  style={{ width: '100%', background: '#2A3119', border: '1px solid rgba(255,255,255,.12)', borderRadius: '10px', color: addPos ? '#F3F1E6' : '#7E875F', fontFamily: 'Nunito, sans-serif', fontWeight: '700', fontSize: '15px', padding: '10px 14px', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">-- Chọn loại từ --</option>
                  <option value="noun">Danh từ (noun)</option>
                  <option value="verb">Động từ (verb)</option>
                  <option value="adjective">Tính từ (adjective)</option>
                  <option value="adverb">Trạng từ (adverb)</option>
                  <option value="phrase">Cụm từ (phrase)</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            {addError && <div style={{ color: '#FF6B6B', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>{addError}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={addLoading} style={{ background: '#5D6B2D', border: 'none', borderRadius: '12px', color: '#FFF8EB', padding: '11px 22px', fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: '14px', cursor: 'pointer', boxShadow: '0 3px 0 #46531F' }}>
                {addLoading ? 'Đang lưu...' : 'Lưu từ'}
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setAddError(''); }} style={{ background: 'rgba(255,255,255,.07)', border: 'none', borderRadius: '12px', color: '#a8ae8c', padding: '11px 18px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>Huỷ</button>
            </div>
          </form>
        )}

        {/* Empty state */}
        {words.length === 0 && !showAddForm && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#7E875F' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>📚</div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: '#a8ae8c' }}>Thư mục trống</div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>Thêm từ vựng đầu tiên vào đây.</div>
            <button
              onClick={() => { setShowAddForm(true); setTimeout(() => document.getElementById('add-word-input')?.focus(), 50); }}
              style={{ background: '#5D6B2D', border: 'none', borderRadius: '14px', color: '#FFF8EB', padding: '12px 24px', fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 0 #46531F' }}
            >
              + Thêm từ đầu tiên
            </button>
          </div>
        )}

        {/* Word List - Full width items */}
        {words.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {words.map((w) => (
              <div key={w.id} style={{ background: '#242A18', border: '1px solid rgba(255,255,255,.05)', borderRadius: '20px', padding: '20px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: '20px', color: '#F3F1E6' }}>{w.word}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const u = new SpeechSynthesisUtterance(w.word);
                        u.lang = 'en-US';
                        window.speechSynthesis.speak(u);
                      }} 
                      title="Nghe"
                      style={{ background: 'none', border: 'none', color: '#8a8f72', cursor: 'pointer', padding: '4px', display: 'flex' }}
                      data-hover="color:#C9CFAE;"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </button>
                    {w.pos && (
                      <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(93,107,45,.3)', color: '#a8c45a', borderRadius: '6px', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.06em', marginLeft: '6px' }}>{w.pos}</span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#a8ae8c', lineHeight: '1.5' }}>{w.definition}</div>
                  
                  {w.example && (
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#7E875F', marginTop: '6px', fontStyle: 'italic', lineHeight: '1.5' }}>"{w.example}"</div>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button title="Chuyển thư mục" style={{ background: 'none', border: 'none', color: '#7E875F', padding: '8px', cursor: 'pointer', display: 'flex' }} data-hover="color:#F3F1E6;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteWord(w.id)}
                    title="Xoá từ" 
                    style={{ background: 'none', border: 'none', color: '#7E875F', padding: '8px', cursor: 'pointer', display: 'flex' }} 
                    data-hover="color:#FF8080;"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete folder */}
        {words.length > 0 && (
          <div style={{ marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#7E875F', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.1em' }}>Vùng nguy hiểm</div>
            <button onClick={handleDeleteFolder} style={{ background: 'none', border: '1px solid rgba(255,80,80,.3)', borderRadius: '12px', color: '#FF8080', padding: '10px 18px', fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }} data-hover="background:rgba(255,80,80,.1);">
              Xoá thư mục này
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
