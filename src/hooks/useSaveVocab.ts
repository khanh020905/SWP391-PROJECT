import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface VocabPayload {
  word: string;
  ipa?: string;
  definition: string;
  translation: string;
  exampleSentence?: string;
  partOfSpeech?: string;
}

export interface VocabCollection {
  id: string;
  name: string;
  description?: string;
}

export function useSaveVocab() {
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<VocabCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const token = session.access_token;
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [vocabRes, collectionsRes] = await Promise.all([
          fetch('/api/student/vocabulary', { headers }),
          fetch('/api/student/vocabulary/collections', { headers })
        ]);

        if (mounted) {
          if (vocabRes.ok) {
            const vocabData = await vocabRes.json();
            if (vocabData.vocabularies) {
              const words = vocabData.vocabularies.map((v: any) => v.word.toLowerCase());
              setSavedWords(new Set(words));
            }
          }

          if (collectionsRes.ok) {
            const collectionsData = await collectionsRes.json();
            if (collectionsData.collections) {
              setCollections(collectionsData.collections);
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading vocab data:", error);
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const isSaved = useCallback((word: string) => {
    return savedWords.has(word.toLowerCase());
  }, [savedWords]);

  const saveWord = useCallback(async (payload: VocabPayload, collectionId?: string | null): Promise<'saved' | 'duplicate' | 'error'> => {
    if (isSaved(payload.word)) {
      return 'duplicate';
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return 'error';
      }

      const token = session.access_token;
      const res = await fetch('/api/student/vocabulary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...payload,
          collectionId: collectionId || null
        })
      });

      if (!res.ok) {
        if (res.status === 409) return 'duplicate';
        return 'error';
      }

      // Optimistic update
      setSavedWords(prev => {
        const next = new Set(prev);
        next.add(payload.word.toLowerCase());
        return next;
      });

      return 'saved';
    } catch (error) {
      console.error("Error saving word:", error);
      return 'error';
    }
  }, [isSaved]);

  return {
    savedWords,
    collections,
    isLoading,
    isSaved,
    saveWord
  };
}
