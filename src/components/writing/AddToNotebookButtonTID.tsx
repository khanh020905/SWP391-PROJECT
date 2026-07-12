"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookPlus, Check, Loader2, FolderPlus } from "lucide-react";

interface Folder {
  id: string;
  name: string;
  user_notebook?: { count: number }[];
}

interface Props {
  word: string;
  definition?: string;
  example?: string;
  source?: string;
  pos?: string;
  category?: string;
  frequency?: number;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "text" | "full";
  dropdownPosition?: "up" | "down";
  dropdownAlign?: "left" | "center" | "right";
  className?: string;
}

export default function AddToNotebookButton({
  word,
  definition = "",
  example = "",
  source = "flashcard",
  pos = "",
  category = "",
  frequency = 0,
  size = "md",
  variant = "icon",
  dropdownPosition = "up",
  dropdownAlign = "left",
  className = "",
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "added" | "error">("idle");
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const duplicateRef = useRef<HTMLDivElement>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const folderPickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setShowFolderPicker(false);
        setShowNewFolderInput(false);
      }
    };
    if (showFolderPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFolderPicker]);

  // Close duplicate confirm on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (duplicateRef.current && !duplicateRef.current.contains(e.target as Node)) {
        setShowDuplicateConfirm(false);
      }
    };
    if (showDuplicateConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDuplicateConfirm]);

  const fetchFolders = async () => {
    setFoldersLoading(true);
    try {
      const res = await fetch("/api/notebook/folders");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    } finally {
      setFoldersLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || createFolderLoading) return;
    setCreateFolderLoading(true);
    try {
      const res = await fetch("/api/notebook/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(prev => [data.folder, ...prev]);
        setSelectedFolderId(data.folder.id);
        setNewFolderName("");
        setShowNewFolderInput(false);
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const saveWord = async (force = false) => {
    const res = await fetch("/api/notebook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word,
        definition,
        example,
        source,
        pos,
        category,
        frequency,
        folder_id: selectedFolderId || undefined,
        force,
      }),
    });
    return res;
  };

  const handleForceAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDuplicateConfirm(false);
    setShowFolderPicker(false);
    setStatus("loading");
    try {
      const res = await saveWord(true);
      if (res.ok) {
        setStatus("added");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === "loading" || status === "added") return;

    // If "full" variant, show folder picker first
    if (variant === "full" && !showFolderPicker) {
      setShowFolderPicker(true);
      fetchFolders();
      return;
    }

    setStatus("loading");
    try {
      const res = await saveWord(false);

      if (res.ok) {
        setStatus("added");
        setShowFolderPicker(false);
        setTimeout(() => setStatus("idle"), 2000);
      } else if (res.status === 409) {
        setStatus("idle");
        setShowFolderPicker(false);
        setShowDuplicateConfirm(true);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizeMap = { sm: 14, md: 16, lg: 18 };

  if (variant === "full") {
    return (
      <div className="relative" ref={folderPickerRef}>
        <button
          onClick={handleAdd}
          disabled={status === "loading"}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${status === "added"
              ? "bg-herb-100 text-herb-700 border border-herb-200"
              : status === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-white text-slate-900 border border-slate-400 hover:bg-herb-50 hover:text-herb-700 hover:border-herb-300"
            } ${className}`}
        >
          {status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : status === "added" ? (
            <Check size={16} />
          ) : (
            <BookPlus size={16} />
          )}
          {status === "added" ? "Đã lưu" : status === "error" ? "Lỗi" : showFolderPicker ? "Chọn thư mục..." : "Lưu vào sổ"}
        </button>

        {/* Folder Picker Dropdown */}
        {showFolderPicker && (
          <div className={`absolute ${dropdownPosition === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${dropdownAlign === 'left' ? 'left-0' :
              dropdownAlign === 'center' ? 'left-1/2 -translate-x-1/2' :
                'right-0'
            } w-72 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl shadow-slate-900/10 p-3 z-[200]`}>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">
              Chọn thư mục
            </p>

            {foldersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-herb-500" />
              </div>
            ) : folders.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto mb-3">
                {/* "No folder" option */}
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedFolderId === null
                      ? "bg-herb-50 text-herb-700"
                      : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <span className="text-slate-400">📁</span> Không có thư mục
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${selectedFolderId === folder.id
                        ? "bg-herb-50 text-herb-700"
                        : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>📂 {folder.name}</span>
                    <span className="text-[10px] text-slate-400 font-black">
                      {folder.user_notebook?.[0]?.count ?? 0} từ
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-sm text-slate-400 font-medium">
                Chưa có thư mục nào
              </p>
            )}

            {/* New folder input */}
            {showNewFolderInput ? (
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  placeholder="Tên thư mục mới..."
                  autoFocus
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-herb-400 font-medium"
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={createFolderLoading || !newFolderName.trim()}
                  className="px-3 py-2 bg-herb-600 text-white rounded-xl text-xs font-black hover:bg-herb-700 transition-all disabled:opacity-50"
                >
                  {createFolderLoading ? <Loader2 size={14} className="animate-spin" /> : "Tạo"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-herb-600 hover:bg-herb-50 transition-all border border-dashed border-herb-200"
              >
                <FolderPlus size={16} /> Tạo thư mục mới
              </button>
            )}

            {/* Confirm save */}
            <div className="border-t border-slate-100 pt-3 mt-3">
              {showDuplicateConfirm ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Từ này đã có trong sổ. Thêm lại?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleForceAdd}
                      className="flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all text-white" style={{ background: '#4d6228' }}
                    >
                      Thêm lại
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDuplicateConfirm(false); setShowFolderPicker(false); }}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all"
                    >
                      Thôi
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setStatus("loading");
                    try {
                      const res = await saveWord(false);
                      if (res.ok) {
                        setStatus("added");
                        setShowFolderPicker(false);
                        setTimeout(() => setStatus("idle"), 2000);
                      } else if (res.status === 409) {
                        setStatus("idle");
                        setShowDuplicateConfirm(true);
                      } else {
                        setStatus("error");
                        setTimeout(() => setStatus("idle"), 2000);
                      }
                    } catch {
                      setStatus("error");
                      setTimeout(() => setStatus("idle"), 2000);
                    }
                  }}
                  className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg text-white" style={{ background: '#4d6228' }}
                >
                  Xác nhận lưu
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex" ref={duplicateRef}>
      <button
        onClick={handleAdd}
        disabled={status === "loading"}
        className={`${sizeMap[size]} rounded-xl flex items-center justify-center transition-all border ${status === "added"
            ? "bg-herb-100 text-herb-600 border-herb-200"
            : status === "error"
              ? "bg-red-50 text-red-500 border-red-200"
              : showDuplicateConfirm
                ? "bg-amber-50 text-amber-500 border-amber-300"
                : "bg-white/80 text-slate-400 border-slate-200 hover:bg-herb-50 hover:text-herb-600 hover:border-herb-200 shadow-sm"
          } ${className}`}
        title={
          status === "added"
            ? "Đã lưu vào sổ từ vựng"
            : status === "error"
              ? "Lỗi! Thử lại sau"
              : "Thêm vào sổ từ vựng"
        }
      >
        {status === "loading" ? (
          <Loader2 size={iconSizeMap[size]} className="animate-spin" />
        ) : status === "added" ? (
          <Check size={iconSizeMap[size]} />
        ) : (
          <BookPlus size={iconSizeMap[size]} />
        )}
      </button>

      {showDuplicateConfirm && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-white text-slate-900 border-2 border-amber-300 rounded-2xl shadow-xl shadow-amber-900/10 p-3 z-[200]">
          <p className="text-[11px] font-bold text-amber-700 mb-2.5 leading-snug">
            Từ này đã có trong sổ. Thêm lại không?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleForceAdd}
              className="flex-1 py-2 bg-herb-600 text-white rounded-xl font-black text-[11px] hover:bg-herb-700 transition-all"
            >
              Thêm lại
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDuplicateConfirm(false); }}
              className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[11px] hover:bg-slate-200 transition-all"
            >
              Thôi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
