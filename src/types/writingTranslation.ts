export interface Topic {
  id: string;
  name: string;
  description?: string;
  category: string;
  created_at?: string;
}

export interface VocabularyNote {
  term: string;
  meaning: string;
}

export interface GrammarPoint {
  structure: string;
  usage: string;
}

export interface TranslationExplanation {
  vocabulary: VocabularyNote[];
  grammar: GrammarPoint[];
  tips?: string;
}

export interface WritingPracticeSentence {
  id: string;
  topic_id: string;
  vi_content: string;
  en_content: string;
  explanation: TranslationExplanation;
  difficulty_level: 'easy' | 'medium' | 'hard';
  created_at?: string;
}
