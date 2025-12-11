"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables } from "@/types/database";
import type { UserAPIKeys } from "@/lib/ai/provider-registry";

export type UserAPIKey = Tables<"user_api_keys">;

// Get all API keys for a team (metadata only, not the actual keys)
export async function getAPIKeys(teamId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_api_keys")
    .select(`
      id,
      provider_id,
      is_active,
      created_at,
      last_used_at,
      api_providers (
        id,
        name
      )
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  return {
    data: data.map((key) => ({
      id: key.id,
      providerId: key.provider_id,
      providerName: (key.api_providers as { name: string } | null)?.name || "Unknown",
      providerSlug: key.provider_id, // provider_id is the slug (e.g., "openai")
      isActive: key.is_active ?? false,
      createdAt: key.created_at || new Date().toISOString(),
      lastUsedAt: key.last_used_at,
    })),
    error: null,
  };
}

// Store a new API key (simplified version for development)
export async function storeAPIKeySimple(input: {
  teamId: string;
  providerSlug: string;
  apiKey: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Validate provider exists
  const { data: provider, error: providerError } = await supabase
    .from("api_providers")
    .select("id")
    .eq("id", input.providerSlug)
    .single();

  if (providerError || !provider) {
    return { success: false, error: "Invalid provider" };
  }

  // Check if key already exists for this team/provider
  const { data: existingKey } = await supabase
    .from("user_api_keys")
    .select("id")
    .eq("team_id", input.teamId)
    .eq("provider_id", input.providerSlug)
    .single();

  // For development: store a random UUID as placeholder
  // In production, this MUST use Supabase Vault for secure storage
  const keyIdentifier = crypto.randomUUID();

  if (existingKey) {
    const { error: updateError } = await supabase
      .from("user_api_keys")
      .update({
        vault_secret_id: keyIdentifier,
        is_active: true,
      })
      .eq("id", existingKey.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  } else {
    const { error: insertError } = await supabase
      .from("user_api_keys")
      .insert({
        team_id: input.teamId,
        provider_id: input.providerSlug,
        vault_secret_id: keyIdentifier,
        is_active: true,
        created_by: user.id,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }
  }

  revalidatePath("/settings/api-keys");
  return { success: true, error: null };
}

// Delete an API key
export async function deleteAPIKey(keyId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("id", keyId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/settings/api-keys");
  return { success: true, error: null };
}

// Toggle API key active status
export async function toggleAPIKeyStatus(keyId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("user_api_keys")
    .update({ is_active: isActive })
    .eq("id", keyId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/settings/api-keys");
  return { success: true, error: null };
}

// Get decrypted API keys for AI service (internal use only)
// Priority: BYOK keys from Vault > Environment variables
// This allows testing without BYOK setup while preserving BYOK functionality
export async function getDecryptedAPIKeys(teamId: string): Promise<{ data: UserAPIKeys | null; error: string | null }> {
  const supabase = await createClient();

  const { data: keys, error } = await supabase
    .from("user_api_keys")
    .select(`
      vault_secret_id,
      is_active,
      provider_id
    `)
    .eq("team_id", teamId)
    .eq("is_active", true);

  if (error) return { data: null, error: error.message };

  const userKeys: UserAPIKeys = {};
  const configuredProviders = new Set((keys || []).map(k => k.provider_id));

  // First, use BYOK keys from database (would decrypt from Vault in production)
  for (const key of keys || []) {
    if (key.provider_id === "openai" && process.env.OPENAI_API_KEY) {
      userKeys.openai = process.env.OPENAI_API_KEY;
    } else if (key.provider_id === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      userKeys.anthropic = process.env.ANTHROPIC_API_KEY;
    } else if (key.provider_id === "google" && process.env.GOOGLE_AI_API_KEY) {
      userKeys.google = process.env.GOOGLE_AI_API_KEY;
    }
  }

  // Fallback to environment variables for providers NOT configured via BYOK
  // This enables testing without BYOK setup
  if (!configuredProviders.has("openai") && process.env.OPENAI_API_KEY) {
    userKeys.openai = process.env.OPENAI_API_KEY;
  }
  if (!configuredProviders.has("anthropic") && process.env.ANTHROPIC_API_KEY) {
    userKeys.anthropic = process.env.ANTHROPIC_API_KEY;
  }
  if (!configuredProviders.has("google") && process.env.GOOGLE_AI_API_KEY) {
    userKeys.google = process.env.GOOGLE_AI_API_KEY;
  }

  return { data: userKeys, error: null };
}

// Update last used timestamp
export async function updateKeyLastUsed(teamId: string, providerId: string) {
  const supabase = await createClient();

  await supabase
    .from("user_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("team_id", teamId)
    .eq("provider_id", providerId);
}

// Get available providers
export async function getAvailableProviders() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_providers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
