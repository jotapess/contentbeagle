/**
 * Pattern Detection API Route
 *
 * Detects AI-generated content patterns in article content.
 * Returns matches for highlighting in the UI.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectPatterns } from "@/lib/ai/pattern-detector";
import { getActiveRulesForTeam } from "@/lib/actions/ai-rules";

export const runtime = "nodejs";

interface DetectRequest {
  articleId: string;
  content?: string; // Optional - if not provided, loads from article
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request
    const body: DetectRequest = await request.json();
    const { articleId, content: providedContent } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: "Missing articleId" },
        { status: 400 }
      );
    }

    // Get user's team
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_team_id")
      .eq("id", user.id)
      .single();

    if (!profile?.default_team_id) {
      return NextResponse.json(
        { error: "No team found" },
        { status: 400 }
      );
    }

    // Get content from article if not provided
    let content = providedContent;
    if (!content) {
      const { data: article, error: articleError } = await supabase
        .from("articles")
        .select("content, team_id")
        .eq("id", articleId)
        .single();

      if (articleError || !article) {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }

      // Verify team access
      if (article.team_id !== profile.default_team_id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      content = article.content || "";
    }

    if (!content) {
      return NextResponse.json({
        matches: [],
        totalMatches: 0,
        matchesByCategory: {},
        matchesBySeverity: {},
        aiScore: 0,
      });
    }

    // Get active rules for team
    const { data: rules, error: rulesError } = await getActiveRulesForTeam(
      profile.default_team_id
    );

    if (rulesError || !rules) {
      return NextResponse.json(
        { error: rulesError || "Failed to load rules" },
        { status: 500 }
      );
    }

    // Detect patterns
    const result = detectPatterns(content, rules);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Pattern detection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
