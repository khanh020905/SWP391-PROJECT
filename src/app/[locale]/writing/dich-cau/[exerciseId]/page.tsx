"use client";

import React, { useState, useEffect, use } from "react";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import TranslationExercise, { DichCauExerciseData } from "@/components/writing/TranslationExercise";
import { useRouter } from "@/i18n/navigation";

export default function DichCauPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = use(params);
  const router = useRouter();

  const [exercise, setExercise] = useState<DichCauExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/data/dich-cau/${exerciseId}.json`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((d) => setExercise(d.exercise))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#6A8042" }}>
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  if (notFound || !exercise || exercise.sentences.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#6A8042" }}>
        <p className="text-white font-black text-xl">Bài luyện không tìm thấy.</p>
        <Link href="/writing/translation" className="text-white/70 underline text-sm font-bold hover:text-white transition-colors">
          ← Quay lại
        </Link>
      </div>
    );
  }

  return (
    <TranslationExercise 
      exercise={exercise} 
      onBack={() => router.push('/writing/translation')} 
      storageKeyId={exerciseId} 
    />
  );
}
