"use client";

import React, { useState, useEffect, use } from "react";
import { Link } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import TranslationExercise, { DichCauExerciseData } from "@/components/writing/TranslationExercise";
import { useRouter } from "@/i18n/navigation";

import { supabase } from "@/lib/supabase";

export default function DichCauPage({ params }: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = use(params);
  const router = useRouter();

  const [exercise, setExercise] = useState<DichCauExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadExercise() {
      try {
        console.log('Current URL param (exerciseId):', exerciseId);

        // 1. Fetch topic
        const { data: topic, error: topicErr } = await supabase
          .from('topics')
          .select('*')
          .eq('id', exerciseId)
          .single();

        if (topicErr || !topic) throw new Error("Topic not found");

        // 2. Fetch sentences
        const { data: sentences, error: sentErr } = await supabase
          .from('writing_practice_sentences')
          .select('*')
          .eq('topic_id', exerciseId)
          .order('id', { ascending: true });

        if (sentErr || !sentences) throw new Error("Sentences not found");

        // 3. Parse metadata
        let band_target = "Bước 1";
        let exercise_id = topic.id;
        let order_index = 0;
        let enName = "";
        try {
          const meta = JSON.parse(topic.description);
          band_target = meta.band_target || "Bước 1";
          exercise_id = meta.exercise_id || topic.id;
          order_index = meta.order_index || 0;
          enName = meta.en || "";
        } catch (e) {
          // fallback
        }

        // 4. Map structure
        const mappedExercise: DichCauExerciseData = {
          id: topic.id,
          exercise_id: exercise_id,
          title: topic.name,
          band_target: band_target,
          topic: {
            en: enName || topic.name,
            question: "",
            taskType: "Collocation"
          },
          sentences: sentences.map((s: any) => ({
            vi: s.vi_content,
            answer: s.en_content,
            explanation: s.explanation || { vocabulary: [], grammar: [], tips: "" }
          })),
          is_published: true,
          order_index: order_index
        };

        setExercise(mappedExercise);
      } catch (err) {
        console.error("Failed to load exercise from Supabase:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
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
