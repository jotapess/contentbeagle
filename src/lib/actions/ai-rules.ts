"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PatternRule } from "@/lib/ai/pattern-detector";

export interface GlobalAIRule {
  id: string;
  name: string;
  description: string | null;
  category: string;
  pattern_type: string;
  pattern: string | null;
  replacement_options: string[] | null;
  severity: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface TeamAIRule {
  id: string;
  team_id: string;
  global_rule_id: string | null;
  name: string;
  description: string | null;
  category: string;
  pattern_type: string;
  pattern: string | null;
  replacement: string | null;
  replacement_options: string[] | null;
  severity: string | null;
  is_active: boolean | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

// Combined rule type for display
export interface CombinedRule {
  id: string;
  name: string;
  description: string | null;
  category: string;
  pattern_type: string;
  pattern: string | null;
  replacement_options: string[] | null;
  severity: string;
  is_active: boolean;
  is_global: boolean;
  team_rule_id?: string; // Team override ID if exists
  created_at: string | null;
}

type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Get all global AI pattern rules
 */
export async function getGlobalAIRules(): Promise<ActionResult<GlobalAIRule[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_pattern_rules_global")
      .select("*")
      .order("category")
      .order("name");

    if (error) {
      console.error("Error fetching global AI rules:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error in getGlobalAIRules:", error);
    return { data: null, error: "Failed to fetch global AI rules" };
  }
}

/**
 * Get team-specific AI pattern rules
 */
export async function getTeamAIRules(teamId: string): Promise<ActionResult<TeamAIRule[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_pattern_rules")
      .select("*")
      .eq("team_id", teamId)
      .order("category")
      .order("name");

    if (error) {
      console.error("Error fetching team AI rules:", error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error in getTeamAIRules:", error);
    return { data: null, error: "Failed to fetch team AI rules" };
  }
}

/**
 * Get all active rules for a team (combined global + team overrides)
 * Returns rules in PatternRule format for the pattern detector
 */
export async function getActiveRulesForTeam(teamId: string): Promise<ActionResult<PatternRule[]>> {
  try {
    const supabase = await createClient();

    // Fetch both global and team rules in parallel
    const [globalResult, teamResult] = await Promise.all([
      supabase.from("ai_pattern_rules_global").select("*").eq("is_active", true),
      supabase.from("ai_pattern_rules").select("*").eq("team_id", teamId),
    ]);

    if (globalResult.error) {
      return { data: null, error: globalResult.error.message };
    }
    if (teamResult.error) {
      return { data: null, error: teamResult.error.message };
    }

    const globalRules = globalResult.data || [];
    const teamRules = teamResult.data || [];

    // Create a map of team overrides by global_rule_id
    const teamOverrides = new Map<string, TeamAIRule>();
    const customTeamRules: TeamAIRule[] = [];

    for (const rule of teamRules) {
      if (rule.global_rule_id) {
        teamOverrides.set(rule.global_rule_id, rule);
      } else {
        customTeamRules.push(rule);
      }
    }

    // Combine rules: global rules with team overrides applied
    const combinedRules: PatternRule[] = [];

    for (const globalRule of globalRules) {
      const override = teamOverrides.get(globalRule.id);

      if (override) {
        // Team has an override for this global rule
        combinedRules.push({
          id: globalRule.id,
          name: globalRule.name,
          description: globalRule.description,
          category: globalRule.category,
          pattern_type: globalRule.pattern_type as PatternRule["pattern_type"],
          pattern: globalRule.pattern,
          replacement_options: override.replacement_options || globalRule.replacement_options,
          severity: (override.severity || globalRule.severity || "medium") as PatternRule["severity"],
          is_active: override.is_active ?? true,
        });
      } else {
        // No team override, use global rule as-is
        combinedRules.push({
          id: globalRule.id,
          name: globalRule.name,
          description: globalRule.description,
          category: globalRule.category,
          pattern_type: globalRule.pattern_type as PatternRule["pattern_type"],
          pattern: globalRule.pattern,
          replacement_options: globalRule.replacement_options,
          severity: (globalRule.severity || "medium") as PatternRule["severity"],
          is_active: globalRule.is_active ?? true,
        });
      }
    }

    // Add custom team rules (not overrides)
    for (const teamRule of customTeamRules) {
      combinedRules.push({
        id: teamRule.id,
        name: teamRule.name,
        description: teamRule.description,
        category: teamRule.category,
        pattern_type: teamRule.pattern_type as PatternRule["pattern_type"],
        pattern: teamRule.pattern,
        replacement_options: teamRule.replacement_options,
        severity: (teamRule.severity || "medium") as PatternRule["severity"],
        is_active: teamRule.is_active ?? true,
      });
    }

    return { data: combinedRules, error: null };
  } catch (error) {
    console.error("Error in getActiveRulesForTeam:", error);
    return { data: null, error: "Failed to fetch active rules" };
  }
}

/**
 * Get combined rules for display (with team override status)
 */
export async function getCombinedRulesForDisplay(teamId: string): Promise<ActionResult<CombinedRule[]>> {
  try {
    const supabase = await createClient();

    // Fetch both in parallel
    const [globalResult, teamResult] = await Promise.all([
      supabase.from("ai_pattern_rules_global").select("*").order("category").order("name"),
      supabase.from("ai_pattern_rules").select("*").eq("team_id", teamId),
    ]);

    if (globalResult.error) {
      return { data: null, error: globalResult.error.message };
    }
    if (teamResult.error) {
      return { data: null, error: teamResult.error.message };
    }

    const globalRules = globalResult.data || [];
    const teamRules = teamResult.data || [];

    // Map team overrides
    const teamOverrides = new Map<string, TeamAIRule>();
    const customTeamRules: TeamAIRule[] = [];

    for (const rule of teamRules) {
      if (rule.global_rule_id) {
        teamOverrides.set(rule.global_rule_id, rule);
      } else {
        customTeamRules.push(rule);
      }
    }

    // Build combined list
    const combined: CombinedRule[] = [];

    // Global rules (with potential overrides)
    for (const global of globalRules) {
      const override = teamOverrides.get(global.id);

      combined.push({
        id: global.id,
        name: global.name,
        description: global.description,
        category: global.category,
        pattern_type: global.pattern_type,
        pattern: global.pattern,
        replacement_options: override?.replacement_options || global.replacement_options,
        severity: override?.severity || global.severity || "medium",
        is_active: override?.is_active ?? global.is_active ?? true,
        is_global: true,
        team_rule_id: override?.id,
        created_at: global.created_at,
      });
    }

    // Custom team rules
    for (const team of customTeamRules) {
      combined.push({
        id: team.id,
        name: team.name,
        description: team.description,
        category: team.category,
        pattern_type: team.pattern_type,
        pattern: team.pattern,
        replacement_options: team.replacement_options,
        severity: team.severity || "medium",
        is_active: team.is_active ?? true,
        is_global: false,
        created_at: team.created_at,
      });
    }

    return { data: combined, error: null };
  } catch (error) {
    console.error("Error in getCombinedRulesForDisplay:", error);
    return { data: null, error: "Failed to fetch combined rules" };
  }
}

/**
 * Toggle a rule's active status for a team
 * If it's a global rule, creates/updates a team override
 */
export async function toggleRuleActive(
  teamId: string,
  ruleId: string,
  isGlobal: boolean,
  newActiveState: boolean
): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    if (isGlobal) {
      // Check if team override exists
      const { data: existing } = await supabase
        .from("ai_pattern_rules")
        .select("id")
        .eq("team_id", teamId)
        .eq("global_rule_id", ruleId)
        .single();

      if (existing) {
        // Update existing override
        const { error } = await supabase
          .from("ai_pattern_rules")
          .update({ is_active: newActiveState, updated_at: new Date().toISOString() })
          .eq("id", existing.id);

        if (error) {
          return { data: null, error: error.message };
        }
      } else {
        // Create new override
        const { data: globalRule } = await supabase
          .from("ai_pattern_rules_global")
          .select("*")
          .eq("id", ruleId)
          .single();

        if (!globalRule) {
          return { data: null, error: "Global rule not found" };
        }

        const { error } = await supabase.from("ai_pattern_rules").insert({
          team_id: teamId,
          global_rule_id: ruleId,
          name: globalRule.name,
          description: globalRule.description,
          category: globalRule.category,
          pattern_type: globalRule.pattern_type,
          pattern: globalRule.pattern,
          replacement_options: globalRule.replacement_options,
          severity: globalRule.severity,
          is_active: newActiveState,
          created_by: user.id,
        });

        if (error) {
          return { data: null, error: error.message };
        }
      }
    } else {
      // Direct team rule update
      const { error } = await supabase
        .from("ai_pattern_rules")
        .update({ is_active: newActiveState, updated_at: new Date().toISOString() })
        .eq("id", ruleId)
        .eq("team_id", teamId);

      if (error) {
        return { data: null, error: error.message };
      }
    }

    revalidatePath("/ai-rules");
    return { data: true, error: null };
  } catch (error) {
    console.error("Error in toggleRuleActive:", error);
    return { data: null, error: "Failed to toggle rule" };
  }
}

/**
 * Create a custom team AI rule
 */
export async function createTeamAIRule(
  teamId: string,
  rule: {
    name: string;
    description?: string;
    category: string;
    pattern_type: "regex" | "exact";
    pattern: string;
    replacement_options?: string[];
    severity?: "low" | "medium" | "high";
  }
): Promise<ActionResult<TeamAIRule>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("ai_pattern_rules")
      .insert({
        team_id: teamId,
        name: rule.name,
        description: rule.description || null,
        category: rule.category,
        pattern_type: rule.pattern_type,
        pattern: rule.pattern,
        replacement_options: rule.replacement_options || [],
        severity: rule.severity || "medium",
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating team AI rule:", error);
      return { data: null, error: error.message };
    }

    revalidatePath("/ai-rules");
    return { data, error: null };
  } catch (error) {
    console.error("Error in createTeamAIRule:", error);
    return { data: null, error: "Failed to create AI rule" };
  }
}

/**
 * Update a team AI rule
 */
export async function updateTeamAIRule(
  ruleId: string,
  teamId: string,
  updates: {
    name?: string;
    description?: string;
    pattern?: string;
    replacement_options?: string[];
    severity?: "low" | "medium" | "high";
  }
): Promise<ActionResult<TeamAIRule>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ai_pattern_rules")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ruleId)
      .eq("team_id", teamId)
      .select()
      .single();

    if (error) {
      console.error("Error updating team AI rule:", error);
      return { data: null, error: error.message };
    }

    revalidatePath("/ai-rules");
    revalidatePath(`/ai-rules/${ruleId}`);
    return { data, error: null };
  } catch (error) {
    console.error("Error in updateTeamAIRule:", error);
    return { data: null, error: "Failed to update AI rule" };
  }
}

/**
 * Delete a team AI rule
 */
export async function deleteTeamAIRule(ruleId: string, teamId: string): Promise<ActionResult<boolean>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("ai_pattern_rules")
      .delete()
      .eq("id", ruleId)
      .eq("team_id", teamId);

    if (error) {
      console.error("Error deleting team AI rule:", error);
      return { data: null, error: error.message };
    }

    revalidatePath("/ai-rules");
    return { data: true, error: null };
  } catch (error) {
    console.error("Error in deleteTeamAIRule:", error);
    return { data: null, error: "Failed to delete AI rule" };
  }
}

/**
 * Get a single rule by ID (for edit page)
 */
export async function getAIRule(
  ruleId: string,
  teamId: string
): Promise<ActionResult<CombinedRule | null>> {
  try {
    const supabase = await createClient();

    // First try team rules
    const { data: teamRule } = await supabase
      .from("ai_pattern_rules")
      .select("*")
      .eq("id", ruleId)
      .eq("team_id", teamId)
      .single();

    if (teamRule) {
      return {
        data: {
          id: teamRule.id,
          name: teamRule.name,
          description: teamRule.description,
          category: teamRule.category,
          pattern_type: teamRule.pattern_type,
          pattern: teamRule.pattern,
          replacement_options: teamRule.replacement_options,
          severity: teamRule.severity || "medium",
          is_active: teamRule.is_active ?? true,
          is_global: false,
          created_at: teamRule.created_at,
        },
        error: null,
      };
    }

    // Try global rules
    const { data: globalRule } = await supabase
      .from("ai_pattern_rules_global")
      .select("*")
      .eq("id", ruleId)
      .single();

    if (globalRule) {
      // Check for team override
      const { data: override } = await supabase
        .from("ai_pattern_rules")
        .select("*")
        .eq("global_rule_id", ruleId)
        .eq("team_id", teamId)
        .single();

      return {
        data: {
          id: globalRule.id,
          name: globalRule.name,
          description: globalRule.description,
          category: globalRule.category,
          pattern_type: globalRule.pattern_type,
          pattern: globalRule.pattern,
          replacement_options: override?.replacement_options || globalRule.replacement_options,
          severity: override?.severity || globalRule.severity || "medium",
          is_active: override?.is_active ?? globalRule.is_active ?? true,
          is_global: true,
          team_rule_id: override?.id,
          created_at: globalRule.created_at,
        },
        error: null,
      };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error("Error in getAIRule:", error);
    return { data: null, error: "Failed to fetch AI rule" };
  }
}
