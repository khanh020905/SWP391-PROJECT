-- Create topics table if not exists (in case it wasn't created yet)
CREATE TABLE IF NOT EXISTS public.topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL DEFAULT 'writing_translation',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to topics
CREATE POLICY "Allow public read access to topics" 
  ON public.topics FOR SELECT 
  USING (true);

-- Create writing_practice_sentences table
CREATE TABLE IF NOT EXISTS public.writing_practice_sentences (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id         UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  vi_content       TEXT NOT NULL,
  en_content       TEXT NOT NULL,
  explanation      JSONB NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for writing_practice_sentences
ALTER TABLE public.writing_practice_sentences ENABLE ROW LEVEL SECURITY;

-- Allow public read access to writing_practice_sentences
CREATE POLICY "Allow public read access to writing_practice_sentences" 
  ON public.writing_practice_sentences FOR SELECT 
  USING (true);

-- Insert seed data for topics
INSERT INTO public.topics (id, name, description, category) VALUES
  ('44a5bdf3-85f0-4a81-9b62-9e902b485d45', 'Education', 'Luyện dịch các cấu trúc thông dụng về giáo dục và học tập.', 'writing_translation'),
  ('66c5d1e2-9b2f-410a-8c73-aa77bb28e21a', 'Environment', 'Luyện dịch các mẫu câu về biến đổi khí hậu và môi trường sống.', 'writing_translation')
ON CONFLICT (id) DO NOTHING;

-- Insert seed data for writing_practice_sentences
INSERT INTO public.writing_practice_sentences (topic_id, vi_content, en_content, explanation, difficulty_level) VALUES
  -- Education Sentences
  (
    '44a5bdf3-85f0-4a81-9b62-9e902b485d45',
    'Chương trình học đại học nên tập trung nhiều hơn vào các kỹ năng thực hành hơn là lý thuyết thuần túy.',
    'University curricula should focus more on practical skills rather than pure theory.',
    '{
      "vocabulary": [
        {"term": "University curricula", "meaning": "Chương trình học đại học (số nhiều của curriculum)"},
        {"term": "Pure theory", "meaning": "Lý thuyết thuần túy"}
      ],
      "grammar": [
        {"structure": "focus on something", "usage": "tập trung vào cái gì đó"},
        {"structure": "rather than", "usage": "hơn là, thay vì"}
      ],
      "tips": "Sử dụng Curricula thay vì Syllabus vì Syllabus thường chỉ đề cập đến đề cương của một môn học cụ thể."
    }',
    'medium'
  ),
  (
    '44a5bdf3-85f0-4a81-9b62-9e902b485d45',
    'Việc tự học đóng vai trò quan trọng trong sự phát triển học thuật của học sinh.',
    'Self-study plays an important role in the academic development of students.',
    '{
      "vocabulary": [
        {"term": "Self-study", "meaning": "Việc tự học"},
        {"term": "Academic development", "meaning": "Sự phát triển học thuật"}
      ],
      "grammar": [
        {"structure": "play an important role in something", "usage": "đóng vai trò quan trọng trong việc gì"}
      ],
      "tips": "Bạn có thể thay thế \"plays an important role\" bằng \"plays a vital role\" hoặc \"is of paramount importance\" để tăng điểm từ vựng (Lexical Resource)."
    }',
    'easy'
  ),
  (
    '44a5bdf3-85f0-4a81-9b62-9e902b485d45',
    'Việc áp dụng công nghệ vào giáo dục đã cách mạng hóa phương pháp giảng dạy truyền thống.',
    'The integration of technology into education has revolutionized traditional teaching methods.',
    '{
      "vocabulary": [
        {"term": "Integration", "meaning": "Sự tích hợp/áp dụng"},
        {"term": "Revolutionize", "meaning": "Cách mạng hóa (làm thay đổi hoàn toàn)"},
        {"term": "Traditional teaching methods", "meaning": "Phương pháp giảng dạy truyền thống"}
      ],
      "grammar": [
        {"structure": "The integration of A into B", "usage": "Sự tích hợp/áp dụng A vào B"},
        {"structure": "Present Perfect Tense", "usage": "Dùng thì hiện tại hoàn thành để diễn tả sự việc đã bắt đầu và vẫn còn tác động đến hiện tại"}
      ],
      "tips": "Hãy chú ý chia động từ số ít \"has\" phù hợp với danh từ chính \"The integration\"."
    }',
    'hard'
  ),

  -- Environment Sentences
  (
    '66c5d1e2-9b2f-410a-8c73-aa77bb28e21a',
    'Chính phủ cần ban hành các điều luật nghiêm khắc hơn để hạn chế lượng khí thải carbon từ các nhà máy.',
    'Governments need to enact stricter laws to curb carbon emissions from factories.',
    '{
      "vocabulary": [
        {"term": "Enact laws", "meaning": "Ban hành luật lệ"},
        {"term": "Curb", "meaning": "Hạn chế, giảm thiểu"},
        {"term": "Carbon emissions", "meaning": "Lượng khí thải carbon"}
      ],
      "grammar": [
        {"structure": "need to do something", "usage": "cần làm gì đó"},
        {"structure": "to do something (Infinitive of purpose)", "usage": "để làm mục đích gì đó"}
      ],
      "tips": "Thay vì dùng từ thông dụng như \"reduce\" hay \"limit\", hãy dùng động từ học thuật \"curb\" để câu văn tự nhiên và trang trọng hơn."
    }',
    'medium'
  ),
  (
    '66c5d1e2-9b2f-410a-8c73-aa77bb28e21a',
    'Nguồn năng lượng tái tạo là giải pháp lâu dài tốt nhất cho cuộc khủng hoảng năng lượng toàn cầu.',
    'Renewable energy sources are the best long-term solution to the global energy crisis.',
    '{
      "vocabulary": [
        {"term": "Renewable energy sources", "meaning": "Nguồn năng lượng tái tạo (như gió, mặt trời)"},
        {"term": "Long-term solution", "meaning": "Giải pháp lâu dài"},
        {"term": "Global energy crisis", "meaning": "Cuộc khủng hoảng năng lượng toàn cầu"}
      ],
      "grammar": [
        {"structure": "solution to something", "usage": "giải pháp cho vấn đề gì (lưu ý dùng giới từ \"to\")"}
      ],
      "tips": "Rất nhiều người nhầm giới từ đi sau solution thành \"for\", hãy ghi nhớ cụm \"solution to a problem\"."
    }',
    'easy'
  ),
  (
    '66c5d1e2-9b2f-410a-8c73-aa77bb28e21a',
    'Sự suy thoái môi trường nhanh chóng đe dọa sự sinh tồn của nhiều loài sinh vật trên Trái Đất.',
    'The rapid environmental degradation threatens the survival of numerous species on Earth.',
    '{
      "vocabulary": [
        {"term": "Environmental degradation", "meaning": "Sự suy thoái môi trường"},
        {"term": "Threaten", "meaning": "Đe dọa"},
        {"term": "Numerous species", "meaning": "Nhiều loài sinh vật"}
      ],
      "grammar": [
        {"structure": "threaten someone/something", "usage": "đe dọa ai/cái gì"},
        {"structure": "survival of", "usage": "sự sinh tồn của"}
      ],
      "tips": "Dùng \"numerous\" thay cho \"many\" và \"degradation\" để miêu tả quá trình chất lượng môi trường đi xuống."
    }',
    'hard'
  );
