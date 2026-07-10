import { supabase } from "@/lib/supabase";
import { Topic, WritingPracticeSentence } from "@/types/writingTranslation";

export async function fetchTranslationTopics(): Promise<Topic[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("category", "writing_translation")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching translation topics:", error);
    throw error;
  }
  return data || [];
}

export async function fetchSentencesByTopic(topicId: string): Promise<WritingPracticeSentence[]> {
  const { data, error } = await supabase
    .from("writing_practice_sentences")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(`Error fetching sentences for topic ${topicId}:`, error);
    throw error;
  }
  return data || [];
}
