"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ScoutTemplate from '@/components/ScoutTemplate';
import { supabase } from '@/lib/supabase';
import ImportVocabularyModal from '@/components/ImportVocabularyModal';

const FOLDER_COLORS = [
  { color: '#E08A2C', deep: '#C2693B' }, // Orange
  { color: '#3B82F6', deep: '#2563EB' }, // Blue
  { color: '#10B981', deep: '#059669' }, // Green
  { color: '#EC4899', deep: '#DB2777' }, // Pink
  { color: '#8B5CF6', deep: '#7C3AED' }, // Purple
];

export default function PersonalNotebookPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<any[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-mock-user-id"] = "usr_2";

      const [folderRes, wordRes] = await Promise.all([
        fetch('/api/notebook/folders', { headers }),
        fetch('/api/notebook', { headers })
      ]);
      
      const folderData = await folderRes.json();
      const wordData = await wordRes.json();
      
      if (folderData.data) {
        setFolders(folderData.data);
      }
      if (wordData.data) {
        setTotalWords(wordData.data.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNewFolder = async () => {
    const name = prompt("Nhập tên thư mục mới:");
    if (!name || !name.trim()) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["x-mock-user-id"] = "usr_2";

      const res = await fetch('/api/notebook/folders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const personalFolders = folders.map((f, i) => {
    const colorObj = FOLDER_COLORS[i % FOLDER_COLORS.length];
    return {
      name: f.name,
      date: new Date(f.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }),
      count: f.word_count || 0,
      color: colorObj.color,
      deep: colorObj.deep,
      open: () => router.push(`/practice/vocabulary/folder/${f.id}`)
    };
  });

  return (
    <>
      <ScoutTemplate 
        isPersonal={true}
        goSets={() => router.push('/practice/vocabulary')}
        personalFolderCount={folders.length}
        personalTotal={totalWords}
        personalFolders={personalFolders}
        openImportModal={() => setShowImportModal(true)}
        createNewFolder={handleCreateNewFolder}
        
        // Visual theme exactly matching reference dark mode
        appBg="#1B1E13"
        contentBg="#181B10"
        headerBg="#242A18" // Panels use this in ScoutTemplate
        headerBorder="rgba(255,255,255,.07)"
        panelBorder="rgba(255,255,255,.08)"
        nightLayerDisp="none"
        inkColor="#F3F1E6"
        ink2Color="#E7E3D2"
        titleColor="#7E875F"
      />
      {showImportModal && (
        <ImportVocabularyModal 
          onClose={() => setShowImportModal(false)}
          onImported={() => {
            setShowImportModal(false);
            fetchData();
          }}
        />
      )}
    </>
  );
}
