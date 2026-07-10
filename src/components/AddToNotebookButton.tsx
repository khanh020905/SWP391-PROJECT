"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  word: string;
  definition?: string;
  example?: string;
  pos?: string;
  source?: 'reading' | 'listening' | 'dictionary' | 'flashcard';
  variant?: 'icon' | 'button' | 'dropdown';
  className?: string;
}

export default function AddToNotebookButton({ word, definition, example, pos, source = 'dictionary', variant = 'button', className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    if (variant === 'dropdown' && openDropdown && folders.length === 0) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const token = session?.access_token || "";
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        } else {
          headers["x-mock-user-id"] = "usr_2";
        }
        
        fetch('/api/notebook/folders', { headers })
        .then(r => r.json())
        .then(d => {
          if (d.data) setFolders(d.data);
        });
      }).catch((err) => {
        console.warn("Failed to retrieve Supabase session for AddToNotebookButton:", err);
      });
    }
  }, [variant, openDropdown]);

  const handleSave = async (folderId?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        headers["x-mock-user-id"] = "usr_2";
      }

      const res = await fetch('/api/notebook', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          word, definition, example, pos, source, folder_id: folderId
        })
      });
      if (res.ok) setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setOpenDropdown(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button onClick={() => handleSave()} disabled={loading || saved} className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${saved ? 'text-green-500' : 'text-slate-400'} ${className}`}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => variant === 'dropdown' ? setOpenDropdown(!openDropdown) : handleSave()}
        disabled={loading || saved}
        className={`flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-70 ${className}`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-green-400" /> : <Plus className="w-4 h-4" />}
        <span>{saved ? 'Đã lưu' : 'Lưu vào sổ tay'}</span>
      </button>
      
      {openDropdown && (
        <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50">
          <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn thư mục</div>
          <button onClick={() => handleSave()} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors">
            -- Chưa phân loại --
          </button>
          {folders.map(f => (
            <button key={f.id} onClick={() => handleSave(f.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors truncate">
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
