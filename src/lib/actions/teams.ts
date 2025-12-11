"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables, TablesInsert } from "@/types/database";

export type Team = Tables<"teams">;
export type TeamMember = Tables<"team_members">;

// Get current user's teams
export async function getUserTeams() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("team_members")
    .select(`
      team_id,
      role,
      joined_at,
      teams (
        id,
        name,
        slug,
        plan,
        owner_id,
        settings,
        created_at
      )
    `)
    .eq("user_id", user.id);

  if (error) return { data: null, error: error.message };

  return {
    data: data.map(tm => ({
      ...tm.teams,
      role: tm.role,
      joined_at: tm.joined_at
    })),
    error: null
  };
}

// Get a specific team by ID
export async function getTeam(teamId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// Get team members
export async function getTeamMembers(teamId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select(`
      id,
      role,
      joined_at,
      invited_at,
      profiles (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq("team_id", teamId);

  if (error) return { data: null, error: error.message };

  return {
    data: data.map(tm => ({
      id: tm.id,
      role: tm.role,
      joined_at: tm.joined_at,
      invited_at: tm.invited_at,
      user: tm.profiles
    })),
    error: null
  };
}

// Create a new team
export async function createTeam(input: { name: string; slug: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Use admin client to bypass RLS for initial team creation
  const adminClient = createAdminClient();

  // First, ensure user has a profile (trigger may not have fired)
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingProfile) {
    // Create profile if it doesn't exist
    await adminClient.from("profiles").insert({
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      avatar_url: user.user_metadata?.avatar_url || null,
    });
  }

  // Create the team using admin client to bypass RLS
  const { data: team, error: teamError } = await adminClient
    .from("teams")
    .insert({
      name: input.name,
      slug: input.slug,
      owner_id: user.id,
    })
    .select()
    .single();

  if (teamError) return { data: null, error: teamError.message };

  // Add user as owner member
  const { error: memberError } = await adminClient
    .from("team_members")
    .insert({
      team_id: team.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) return { data: null, error: memberError.message };

  // Update user's default team
  await adminClient
    .from("profiles")
    .update({ default_team_id: team.id })
    .eq("id", user.id);

  revalidatePath("/brands");
  return { data: team, error: null };
}

// Update a team
export async function updateTeam(teamId: string, input: Partial<TablesInsert<"teams">>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teams")
    .update(input)
    .eq("id", teamId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath("/team/settings");
  return { data, error: null };
}

// Delete a team (owner only)
export async function deleteTeam(teamId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/brands");
  return { success: true, error: null };
}

// Update member role
export async function updateMemberRole(memberId: string, role: "admin" | "editor" | "viewer") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("id", memberId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/team");
  return { success: true, error: null };
}

// Remove a team member
export async function removeMember(memberId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/team");
  return { success: true, error: null };
}

// Get or create default team for user (for onboarding)
export async function getOrCreateDefaultTeam() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Check if user has any teams
  const { data: teams } = await getUserTeams();

  if (teams && teams.length > 0) {
    return { data: teams[0], error: null };
  }

  // Create a personal team
  const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const slug = `${fullName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  return createTeam({
    name: `${fullName}'s Team`,
    slug,
  });
}
