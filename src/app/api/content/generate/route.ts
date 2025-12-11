/**
 * Content Generation API Route
 *
 * Streaming endpoint for AI content generation with brand context.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIService, getDefaultModel } from '@/lib/ai';
import { getDecryptedAPIKeys } from '@/lib/actions/api-keys';
import { loadBrandContext } from '@/lib/ai/brand-context';
import {
  buildContentGenerationPrompt,
  type InputType,
  type ArticleLength,
} from '@/lib/ai/prompts/content-generation';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface GenerateRequest {
  brandId: string;
  inputType: InputType;
  content: string;
  topic?: string;
  targetAudience?: string;
  articleLength: ArticleLength;
  cta?: string;
  seoKeywords?: string[];
  model?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[generate] Auth check:', { user: user?.id, error: authError?.message });
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: GenerateRequest = await request.json();
    console.log('[generate] Request body:', JSON.stringify(body, null, 2));
    const {
      brandId,
      inputType,
      content,
      topic,
      targetAudience,
      articleLength,
      cta,
      seoKeywords,
      model,
    } = body;

    // Validate required fields
    // For topic_only mode, content can be empty (we use topic instead)
    const effectiveContent = content || (inputType === 'topic_only' ? topic : '');
    if (!brandId || !inputType || !effectiveContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: brandId, inputType, and content (or topic for topic_only mode)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's team
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_team_id')
      .eq('id', user.id)
      .single();

    if (!profile?.default_team_id) {
      return new Response(
        JSON.stringify({ error: 'No team found' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get API keys
    const { data: apiKeys, error: keysError } = await getDecryptedAPIKeys(profile.default_team_id);
    if (keysError || !apiKeys) {
      return new Response(
        JSON.stringify({ error: keysError || 'Failed to retrieve API keys' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKeys.openai && !apiKeys.anthropic && !apiKeys.google) {
      return new Response(
        JSON.stringify({ error: 'No AI API keys configured. Please add an API key in Settings.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load brand context
    const brandContext = await loadBrandContext(brandId);
    if (!brandContext) {
      return new Response(
        JSON.stringify({ error: 'Brand not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build prompts
    const { systemPrompt, userPrompt } = buildContentGenerationPrompt({
      inputType,
      content: effectiveContent,
      topic,
      targetAudience: targetAudience || brandContext.targetAudience,
      articleLength,
      cta,
      seoKeywords,
      brandVoice: brandContext.brandVoice,
      brandName: brandContext.brandName,
    });

    // Get default model or use specified
    const selectedModel = model || getDefaultModel(apiKeys);
    if (!selectedModel) {
      return new Response(
        JSON.stringify({ error: 'No compatible AI model available' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create AI service and stream
    const aiService = createAIService(apiKeys, selectedModel);
    const result = aiService.getTextStream({
      systemPrompt,
      prompt: userPrompt,
      model: selectedModel,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Return streaming response using AI SDK helper
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Content generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
