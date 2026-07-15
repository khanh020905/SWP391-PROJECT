import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { logStudyMinutes } from "@/lib/studentProgressDb";

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
    const { activityId, itemIds, itemType, results, xpEarned } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // 1. Insert/upsert into daily_progress for each item
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      const progressRows = itemIds.map((itemId: any, i: number) => ({
        user_id: userId,
        date: today,
        activity_id: activityId,
        item_id: String(itemId),
        item_type: itemType,
        result: results?.[i] || {},
        completed: true
      }));

      const { error: progressError } = await supabaseAdmin
        .from('daily_progress')
        .upsert(progressRows, { onConflict: 'user_id,date,item_id' });

      if (progressError) throw progressError;
    }

    // 2. Fetch the current study plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('study_plans')
      .select('tasks, completed_count, xp_earned')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (planError) throw planError;

    if (plan && Array.isArray(plan.tasks)) {
      const updatedTasks = plan.tasks.map((t: any) => {
        if (t.id === activityId) {
          return { ...t, completed: true };
        }
        return t;
      });

      // After updating completion state, check if we should unlock mini_test.
      // mini_test unlocks when all other tasks (which are not mini_test) are completed.
      const allOthersCompleted = updatedTasks
        .filter((t: any) => t.type !== 'mini_test')
        .every((t: any) => t.completed);

      const finalTasks = updatedTasks.map((t: any) => {
        if (t.type === 'mini_test') {
          return { ...t, locked: !allOthersCompleted };
        }
        return t;
      });

      const newCompletedCount = finalTasks.filter((t: any) => t.completed).length;

      const { error: updateError } = await supabaseAdmin
        .from('study_plans')
        .update({
          tasks: finalTasks,
          completed_count: newCompletedCount,
          xp_earned: (plan.xp_earned || 0) + (xpEarned || 0)
        })
        .eq('user_id', userId)
        .eq('date', today);

      if (updateError) throw updateError;
    }

    // 3. Update study minutes and streak
    try {
      await logStudyMinutes(userId, xpEarned || 10, itemType);
    } catch (err) {
      console.warn("Could not log study minutes:", err);
    }

    // 4. Log into practice_history
    const correctCount = Array.isArray(results) ? results.filter((r: any) => r?.correct || r?.isCorrect || r?.status === 'correct').length : 0;
    const totalCount = Array.isArray(results) ? results.length : 0;

    const { error: historyError } = await supabaseAdmin
      .from('practice_history')
      .insert({
        user_id: userId,
        category: itemType,
        test_id: activityId,
        test_name: `Daily ${itemType.toUpperCase()} - ${new Date().toLocaleDateString()}`,
        score: correctCount,
        total: totalCount,
        metadata: { date: new Date().toISOString(), xp: xpEarned }
      });

    if (historyError) {
      console.warn("Could not insert practice_history record:", historyError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error completing daily activity:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
