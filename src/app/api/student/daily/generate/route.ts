import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let userId = "";

  // Developer bypass for testing in local development
  const bypassUserId = request.headers.get("x-bypass-auth-user-id");
  if (process.env.NODE_ENV === "development" && bypassUserId) {
    userId = bypassUserId;
  } else {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    userId = user.id;
  }

  try {
    // 1. Fetch latest overall band from diagnostic_results
    const { data: skillsData } = await supabaseAdmin
      .from('diagnostic_results')
      .select('reading_band, writing_band, listening_band, speaking_band, overall_band')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const latestDiagnostic = skillsData?.[0] || null;
    const currentBand = latestDiagnostic?.overall_band || 5.0;
    const date = new Date().toISOString().split('T')[0];

    // 2. Fetch current path from learning_paths
    const { data: pathData } = await supabaseAdmin
      .from('learning_paths')
      .select('id, ai_suggestion')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const currentPath = pathData?.[0] || null;

    // Map band → level filter for vocabulary
    const vocabLevel = currentBand < 5.5 ? 'B2' 
      : currentBand < 6.5 ? '6.0' 
      : currentBand < 7.0 ? '6.5' 
      : '7.0';

    // Map band → grammar lesson band
    const grammarBand = currentBand < 5.5 ? '5.0'
      : currentBand < 6.0 ? '5.5'
      : currentBand < 6.5 ? '6.0'
      : '6.5';

    // 3. Fetch already learned items from daily_progress
    const { data: learnedItems } = await supabaseAdmin
      .from('daily_progress')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'vocabulary');

    const learnedIds = learnedItems?.map(i => i.item_id) || [];

    // Query vocabulary
    let vocabQuery = supabaseAdmin
      .from('vocabulary')
      .select('id, word, phonetic, meaning, example, category')
      .eq('level', vocabLevel);

    if (learnedIds.length > 0) {
      vocabQuery = vocabQuery.not('id', 'in', `(${learnedIds.map(id => `'${id}'`).join(',')})`);
    }
    const { data: vocabItems } = await vocabQuery.limit(10);

    // 4. Grammar activity: 1 lesson matches band
    const { data: grammarLesson } = await supabaseAdmin
      .from('grammar_lessons')
      .select('lesson_id, title, band, sections')
      .eq('band', grammarBand)
      .limit(1)
      .maybeSingle();

    // 5. Dictation activity: 1 task (must have actual dictation challenges keys)
    const { data: dictationTasks } = await supabaseAdmin
      .from('listening_tasks')
      .select('id, lesson_id, lesson_name, challenges')
      .order('lesson_id', { ascending: true });

    const dictationTask = (dictationTasks || []).find(t => 
      Array.isArray(t.challenges) && 
      t.challenges.length > 0 && 
      (t.challenges[0].solution || t.challenges[0].jsonContent)
    ) || null;

    const dictationChallenges = dictationTask?.challenges?.slice(0, 5) || [];

    // 6. Translation: 1 topic from topics table
    // Query already completed translation topics to prevent duplicate
    const { data: completedTranslations } = await supabaseAdmin
      .from('daily_progress')
      .select('item_id')
      .eq('user_id', userId)
      .eq('item_type', 'translation');
    const completedTopicIds = completedTranslations?.map(i => i.item_id) || [];

    let topicQuery = supabaseAdmin
      .from('topics')
      .select('id, name, description')
      .limit(1);

    if (completedTopicIds.length > 0) {
      topicQuery = topicQuery.not('id', 'in', `(${completedTopicIds.map(id => `'${id}'`).join(',')})`);
    }
    const { data: topicList } = await topicQuery;
    const selectedTopic = topicList?.[0] || null;

    // 7. Mini test: 5 questions mixed from questions table
    const { data: testQuestions } = await supabaseAdmin
      .from('questions')
      .select('id, question_type, text, options, correct_answer')
      .in('question_type', ['multiple_choice', 'multiple-choice', 'true_false'])
      .limit(5);

    // Create activities array
    const activities = [
      {
        id: `${date}_vocab`,
        type: 'vocabulary',
        skill: 'Từ vựng',
        title: `Học ${vocabItems?.length || 10} từ vựng mới`,
        icon: '📚',
        estimatedMinutes: 15,
        xp: 20,
        completed: false,
        data: vocabItems || []
      },
      {
        id: `${date}_grammar`,
        type: 'grammar',
        skill: 'Ngữ pháp',
        title: `Ngữ pháp: ${grammarLesson?.title || "Ôn tập cấu trúc ngữ pháp"}`,
        icon: '📖',
        estimatedMinutes: 20,
        xp: 25,
        completed: false,
        data: grammarLesson || null
      },
      {
        id: `${date}_dictation`,
        type: 'dictation',
        skill: 'Listening',
        title: `Nghe chép: ${dictationTask?.lesson_name || "Bài tập nghe chính tả"}`,
        icon: '🎧',
        estimatedMinutes: 15,
        xp: 20,
        completed: false,
        data: dictationTask ? { ...dictationTask, challenges: dictationChallenges } : null
      },
      {
        id: `${date}_translation`,
        type: 'translation',
        skill: 'Writing',
        title: `Dịch câu: ${selectedTopic?.name || "Luyện dịch câu"}`,
        icon: '✍️',
        estimatedMinutes: 10,
        xp: 15,
        completed: false,
        data: selectedTopic || null
      },
      {
        id: `${date}_mini_test`,
        type: 'mini_test',
        skill: 'Kiểm tra',
        title: 'Mini Test: Ôn tập kiến thức hôm nay',
        icon: '📝',
        estimatedMinutes: 10,
        xp: 30,
        completed: false,
        locked: true,
        data: testQuestions || []
      }
    ];

    // Save into study_plans
    const { error: upsertError } = await supabaseAdmin
      .from('study_plans')
      .upsert({
        user_id: userId,
        path_id: currentPath?.id || null,
        date: date,
        tasks: activities,
        completed_count: 0,
        activity_type: 'mixed',
        xp_earned: 0
      }, { onConflict: 'user_id,date' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ activities, date });
  } catch (err: any) {
    console.error("Error generating daily plan:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
