"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";

export type Article = Tables<"articles">;
export type ArticleVersion = Tables<"article_versions">;
export type ArticleStatus = Article["status"];

export type ArticleWithBrand = Article & {
  brand?: { id: string; name: string; logo_url: string | null } | null;
};

// Get all articles for a team
export async function getArticles(teamId: string, options?: {
  status?: ArticleStatus;
  brandId?: string;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select(`
      *,
      brands (
        id,
        name,
        logo_url
      )
    `)
    .eq("team_id", teamId)
    .order("updated_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.brandId) {
    query = query.eq("brand_id", options.brandId);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };

  return {
    data: data.map(article => ({
      ...article,
      brand: article.brands
    })),
    error: null
  };
}

// Get a single article by ID
export async function getArticle(articleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(`
      *,
      brands (
        id,
        name,
        logo_url,
        website_url
      )
    `)
    .eq("id", articleId)
    .single();

  if (error) return { data: null, error: error.message };

  return {
    data: {
      ...data,
      brand: data.brands
    },
    error: null
  };
}

// Create a new article
export async function createArticle(input: {
  teamId: string;
  brandId: string;
  title: string;
  inputType?: "bullets" | "draft" | "research" | "topic_only";
  originalInput?: string;
  targetAudience?: string;
  targetLength?: string;
  callToAction?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("articles")
    .insert({
      team_id: input.teamId,
      brand_id: input.brandId,
      title: input.title,
      input_type: input.inputType,
      original_input: input.originalInput,
      target_audience: input.targetAudience,
      target_length: input.targetLength,
      call_to_action: input.callToAction,
      created_by: user.id,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Create initial workflow log entry
  await supabase.from("article_workflow_log").insert({
    article_id: data.id,
    to_status: "draft",
    transitioned_by: user.id,
    notes: "Article created",
  });

  revalidatePath("/articles");
  return { data, error: null };
}

// Update an article
export async function updateArticle(articleId: string, input: TablesUpdate<"articles">) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .update(input)
    .eq("id", articleId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath(`/articles/${articleId}`);
  revalidatePath("/articles");
  return { data, error: null };
}

// Update article content with auto-versioning
export async function updateArticleContent(articleId: string, input: {
  title?: string;
  content?: string;
  contentHtml?: string;
  changeSummary?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Get current article
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .single();

  if (!article) return { data: null, error: "Article not found" };

  // Get latest version number
  const { data: versions } = await supabase
    .from("article_versions")
    .select("version_number")
    .eq("article_id", articleId)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version_number || 0) + 1;

  // Create version snapshot
  await supabase.from("article_versions").insert({
    article_id: articleId,
    version_number: nextVersion,
    title: input.title || article.title,
    content: input.content || article.content,
    content_html: input.contentHtml || article.content_html,
    status: article.status,
    change_summary: input.changeSummary || "Content updated",
    changed_by: user.id,
  });

  // Update the article
  const { data, error } = await supabase
    .from("articles")
    .update({
      title: input.title,
      content: input.content,
      content_html: input.contentHtml,
      word_count: input.content ? input.content.split(/\s+/).length : null,
      reading_time_minutes: input.content ? Math.ceil(input.content.split(/\s+/).length / 200) : null,
    })
    .eq("id", articleId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath(`/articles/${articleId}`);
  return { data, error: null };
}

// Transition article status
export async function transitionArticleStatus(
  articleId: string,
  toStatus: ArticleStatus,
  notes?: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Get current status
  const { data: article } = await supabase
    .from("articles")
    .select("status")
    .eq("id", articleId)
    .single();

  if (!article) return { data: null, error: "Article not found" };

  // Log the transition
  await supabase.from("article_workflow_log").insert({
    article_id: articleId,
    from_status: article.status,
    to_status: toStatus,
    transitioned_by: user.id,
    notes,
  });

  // Update status
  const { data, error } = await supabase
    .from("articles")
    .update({ status: toStatus })
    .eq("id", articleId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  revalidatePath(`/articles/${articleId}`);
  revalidatePath("/articles");
  return { data, error: null };
}

// Get article versions
export async function getArticleVersions(articleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("article_versions")
    .select("*")
    .eq("article_id", articleId)
    .order("version_number", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// Get article workflow log
export async function getArticleWorkflowLog(articleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("article_workflow_log")
    .select(`
      *,
      profiles:transitioned_by (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

// Delete an article
export async function deleteArticle(articleId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/articles");
  return { success: true, error: null };
}

// Restore article to a previous version
export async function restoreArticleVersion(articleId: string, versionId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  // Get the version to restore
  const { data: version } = await supabase
    .from("article_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (!version) return { data: null, error: "Version not found" };

  // Update article with version content
  return updateArticleContent(articleId, {
    title: version.title,
    content: version.content || undefined,
    contentHtml: version.content_html || undefined,
    changeSummary: `Restored to version ${version.version_number}`,
  });
}
