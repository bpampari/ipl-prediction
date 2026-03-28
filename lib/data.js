import { DEFAULT_ROOM_SLUG } from "@/lib/constants";
import { formatDateLabel, formatJoinedAt } from "@/lib/format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDashboardData(userId) {
  const supabase = await createServerSupabaseClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, name, slug, max_players")
    .eq("slug", DEFAULT_ROOM_SLUG)
    .maybeSingle();

  if (!room) {
    return {
      room: null,
      membership: null,
      memberCount: 0,
      currentProfile: null,
      currentStanding: null,
      standings: [],
      matches: [],
      members: [],
      predictionsByMatch: {},
      predictionsForMatch: {},
      settledCount: 0
    };
  }

  const [{ data: membership }, { data: memberRows }, { data: profiles }, { data: matches }, { data: currentProfile }] =
    await Promise.all([
      supabase
        .from("room_members")
        .select("room_id, user_id, role, joined_at")
        .eq("room_id", room.id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("room_members")
        .select("room_id, user_id, role, joined_at")
        .eq("room_id", room.id)
        .order("joined_at", { ascending: true }),
      supabase.from("profiles").select("id, display_name, phone, avatar_url"),
      supabase
        .from("matches")
        .select("id, room_id, team_a, team_b, match_date, actual_winner, settled_at, created_at")
        .eq("room_id", room.id)
        .order("match_date", { ascending: true }),
      supabase.from("profiles").select("id, display_name, phone, avatar_url").eq("id", userId).maybeSingle()
    ]);

  const matchIds = (matches || []).map((match) => match.id);
  const { data: predictionRows } = matchIds.length
    ? await supabase
        .from("predictions")
        .select("id, match_id, user_id, predicted_team, stake, points_delta, created_at")
        .in("match_id", matchIds)
    : { data: [] };

  const predictions = (predictionRows || []).map((prediction) => ({
    ...prediction,
    points_delta: prediction.points_delta === null ? null : Number(prediction.points_delta)
  }));

  const profilesById = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
  const members = (memberRows || []).map((member) => ({
    ...member,
    displayName:
      profilesById[member.user_id]?.display_name ||
      profilesById[member.user_id]?.phone ||
      "Player",
    joinedLabel: formatJoinedAt(member.joined_at)
  }));

  const matchesWithLabels = (matches || []).map((match) => ({
    ...match,
    match_date_label: formatDateLabel(match.match_date)
  }));

  const predictionsByMatch = {};
  const predictionsForMatch = {};

  predictions.forEach((prediction) => {
    predictionsForMatch[prediction.match_id] = predictionsForMatch[prediction.match_id] || [];
    predictionsForMatch[prediction.match_id].push(prediction);

    if (prediction.user_id === userId) {
      predictionsByMatch[prediction.match_id] = prediction;
    }
  });

  const standings = members
    .map((member) => {
      const memberPredictions = predictions.filter((prediction) => prediction.user_id === member.user_id);
      const settledPredictions = memberPredictions.filter((prediction) => typeof prediction.points_delta === "number");
      const correctPicks = settledPredictions.filter((prediction) => {
        const match = matchesWithLabels.find((entry) => entry.id === prediction.match_id);
        return match?.actual_winner && prediction.predicted_team === match.actual_winner;
      }).length;

      return {
        userId: member.user_id,
        displayName: member.displayName,
        points: settledPredictions.reduce((sum, prediction) => sum + Number(prediction.points_delta || 0), 0),
        correctPicks,
        playedMatches: settledPredictions.length
      };
    })
    .sort((left, right) => right.points - left.points || right.correctPicks - left.correctPicks || left.displayName.localeCompare(right.displayName));

  const currentStanding = standings.find((entry) => entry.userId === userId) || null;

  return {
    room,
    membership,
    memberCount: members.length,
    currentProfile,
    currentStanding,
    standings,
    matches: matchesWithLabels,
    members,
    predictionsByMatch,
    predictionsForMatch,
    settledCount: matchesWithLabels.filter((match) => Boolean(match.settled_at)).length
  };
}
