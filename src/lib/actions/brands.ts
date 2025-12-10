"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Brand = Tables<"brands">;
export type BrandProfile = Tables<"brand_profiles">;
export type BrandWithProfile = Brand & { brand_profile?: BrandProfile | null };

// Get all brands for a team
export async function getBrands(teamId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brands")
    .select(`
      *,
      brand_profiles (*)
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };

  return {
    data: data.map(brand => ({
      ...brand,
      brand_profile: brand.brand_profiles?.[0] || null
    })),
    error: null
  };
}

// Get a single brand by ID
export async function getBrand(brandId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brands")
    .select(`
      *,
      brand_profiles (*),
      brand_competitors (*)
    `)
    .eq("id", brandId)
    .single();

  if (error) return { data: null, error: error.message };

  return {
    data: {
      ...data,
      brand_profile: data.brand_profiles?.find((p: BrandProfile) => p.is_active) || data.brand_profiles?.[0] || null,
      competitors: data.brand_competitors || []
    },
    error: null
  };
}

// Create a new brand
export async function createBrand(input: {
  teamId: string;
  name: string;
  websiteUrl?: string;
  description?: string;
  industry?: string;
  targetAudience?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("brands")
    .insert({
      team_id: input.teamId,
      name: input.name,
      website_url: input.websiteUrl,
      description: input.description,
      industry: input.industry,
      target_audience: input.targetAudience,
      created_by: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath("/brands");
  return { data, error: null };
}

// Update a brand
export async function updateBrand(brandId: string, input: TablesUpdate<"brands">) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brands")
    .update(input)
    .eq("id", brandId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath(`/brands/${brandId}`);
  revalidatePath("/brands");
  return { data, error: null };
}

// Delete a brand
export async function deleteBrand(brandId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", brandId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/brands");
  return { success: true, error: null };
}

// Get or create brand profile
export async function getBrandProfile(brandId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Update brand profile
export async function updateBrandProfile(
  brandId: string,
  input: TablesUpdate<"brand_profiles">
) {
  const supabase = await createClient();

  // Check if profile exists
  const { data: existing } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("brand_profiles")
      .update(input)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath(`/brands/${brandId}/profile`);
    return { data, error: null };
  } else {
    // Create new
    const { data, error } = await supabase
      .from("brand_profiles")
      .insert({
        brand_id: brandId,
        ...input,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    revalidatePath(`/brands/${brandId}/profile`);
    return { data, error: null };
  }
}

// Get crawled pages for a brand
export async function getCrawledPages(brandId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("crawled_pages")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("crawled_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// Update brand status
export async function updateBrandStatus(brandId: string, status: Brand["status"]) {
  return updateBrand(brandId, { status });
}
