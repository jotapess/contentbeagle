/**
 * Brand Context Loader
 *
 * Fetches brand profile data and transforms it into the format
 * needed for content generation prompts.
 */

import { createClient } from '@/lib/supabase/server';
import type { BrandVoice } from './prompts/content-generation';

export interface BrandContext {
  brandId: string;
  brandName: string;
  brandVoice: BrandVoice;
  targetAudience?: string;
}

/**
 * Load brand context for content generation
 */
export async function loadBrandContext(brandId: string): Promise<BrandContext | null> {
  const supabase = await createClient();

  // Fetch brand with its profile
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select(`
      id,
      name,
      target_audience,
      brand_profiles (
        voice_description,
        voice_adjectives,
        tone_formality,
        tone_enthusiasm,
        tone_humor,
        vocabulary_level,
        power_words,
        avoid_words,
        do_list,
        dont_list
      )
    `)
    .eq('id', brandId)
    .single();

  if (brandError || !brand) {
    console.error('Error loading brand:', brandError);
    return null;
  }

  // Get the latest brand profile (profiles are versioned)
  const profile = Array.isArray(brand.brand_profiles)
    ? brand.brand_profiles[0]
    : brand.brand_profiles;

  const brandVoice: BrandVoice = {};

  if (profile) {
    // Map database columns to BrandVoice interface
    if (profile.voice_description) brandVoice.tone = profile.voice_description;
    if (profile.tone_formality !== null) brandVoice.formality = profile.tone_formality;
    if (profile.tone_enthusiasm !== null) brandVoice.enthusiasm = profile.tone_enthusiasm;
    if (profile.tone_humor !== null) brandVoice.humor = profile.tone_humor;
    if (profile.voice_adjectives) brandVoice.vocabulary = profile.voice_adjectives;
    if (profile.power_words) brandVoice.powerWords = profile.power_words;
    if (profile.avoid_words) brandVoice.avoidTerms = profile.avoid_words;
    if (profile.do_list) brandVoice.doList = profile.do_list;
    if (profile.dont_list) brandVoice.dontList = profile.dont_list;
  }

  return {
    brandId: brand.id,
    brandName: brand.name,
    brandVoice,
    targetAudience: brand.target_audience || undefined,
  };
}
