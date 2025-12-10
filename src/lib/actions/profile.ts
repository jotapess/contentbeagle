"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables, TablesUpdate } from "@/types/database";

export type Profile = Tables<"profiles">;

// Get current user's profile
export async function getProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      teams:default_team_id (
        id,
        name,
        slug
      )
    `)
    .eq("id", user.id)
    .single();

  if (error) return { data: null, error: error.message };

  return {
    data: {
      ...data,
      default_team: data.teams
    },
    error: null
  };
}

// Update current user's profile
export async function updateProfile(input: TablesUpdate<"profiles">) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath("/settings");
  return { data, error: null };
}

// Set default team for user
export async function setDefaultTeam(teamId: string) {
  return updateProfile({ default_team_id: teamId });
}

// Update user preferences
export async function updatePreferences(preferences: Record<string, unknown>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Get current preferences
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .single();

  const currentPrefs = (profile?.preferences as Record<string, unknown>) || {};
  const newPrefs = { ...currentPrefs, ...preferences };

  return updateProfile({ preferences: newPrefs });
}
