"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DEFAULT_ROOM_SLUG } from "@/lib/constants";

function getField(formData, field) {
  return String(formData.get(field) || "").trim();
}

export async function joinDefaultRoomAction() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("join_default_room", {
    p_room_slug: DEFAULT_ROOM_SLUG
  });

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function updateProfileAction(formData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const displayName = getField(formData, "displayName");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    phone: user.phone || null,
    avatar_url: user.user_metadata?.avatar_url || null
  });

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function createMatchAction(formData) {
  const supabase = await createServerSupabaseClient();
  const teamA = getField(formData, "teamA");
  const teamB = getField(formData, "teamB");
  const matchDate = getField(formData, "matchDate");

  const { error } = await supabase.rpc("create_match", {
    p_room_slug: DEFAULT_ROOM_SLUG,
    p_team_a: teamA,
    p_team_b: teamB,
    p_match_date: matchDate
  });

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function settleMatchAction(formData) {
  const supabase = await createServerSupabaseClient();
  const matchId = getField(formData, "matchId");
  const actualWinner = getField(formData, "actualWinner");

  const { error } = await supabase.rpc("settle_match", {
    p_match_id: matchId,
    p_actual_winner: actualWinner
  });

  if (error) {
    redirect(`/dashboard?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export async function savePredictionAction(payload) {
  const supabase = await createServerSupabaseClient();
  const { matchId, predictedTeam } = payload;

  const { error } = await supabase.rpc("save_prediction", {
    p_match_id: matchId,
    p_predicted_team: predictedTeam
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { error: null };
}
