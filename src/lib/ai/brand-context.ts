"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type Brand = Tables<"brands">;
type BrandProfile = Tables<"brand_profiles">;

export interface BrandContext {
  brand: Brand;
  profile: BrandProfile | null;
}

export async function loadBrandContext(brandId: string): Promise<{ data: BrandContext | null; error: string | null }> {
  const supabase = await createClient();

  // Fetch brand with active profile
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();

  if (brandError) {
    return { data: null, error: brandError.message };
  }

  // Fetch active brand profile
  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .single();

  return {
    data: {
      brand,
      profile: profile || null,
    },
    error: null,
  };
}

export function extractBrandVoice(profile: BrandProfile | null): string {
  if (!profile) {
    return "Professional, clear, and engaging";
  }

  const parts: string[] = [];

  if (profile.voice_description) {
    parts.push(profile.voice_description);
  }

  const adjectives = profile.voice_adjectives as string[] | null;
  if (adjectives && adjectives.length > 0) {
    parts.push(`Voice characteristics: ${adjectives.join(", ")}`);
  }

  if (profile.tone_formality !== null) {
    const formalityLevel = profile.tone_formality >= 7 ? "formal" : profile.tone_formality >= 4 ? "balanced" : "casual";
    parts.push(`Tone: ${formalityLevel}`);
  }

  return parts.join(". ") || "Professional and clear";
}

export function getBrandWritingRules(profile: BrandProfile | null): string[] {
  if (!profile) {
    return [
      "Use clear, concise language",
      "Maintain professional tone",
      "Include practical examples",
    ];
  }

  const rules: string[] = [];

  // From do_list and dont_list arrays
  if (profile.do_list && profile.do_list.length > 0) {
    rules.push(...profile.do_list.map((r) => `DO: ${r}`));
  }
  if (profile.dont_list && profile.dont_list.length > 0) {
    rules.push(...profile.dont_list.map((r) => `DON'T: ${r}`));
  }

  // Add vocabulary guidance
  if (profile.vocabulary_level) {
    rules.push(`Use ${profile.vocabulary_level} vocabulary level`);
  }

  // Add sentence structure guidance
  if (profile.sentence_structure) {
    rules.push(`Use ${profile.sentence_structure} sentence structure`);
  }

  return rules.length > 0 ? rules : [
    "Write clearly and engagingly",
    "Use active voice",
    "Include specific examples",
  ];
}
