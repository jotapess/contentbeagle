import { notFound } from "next/navigation";
import { getArticle } from "@/lib/actions/articles";
import { ArticleEditorClient } from "./article-editor-client";

interface ArticleEditorPageProps {
  params: Promise<{ articleId: string }>;
}

export default async function ArticleEditorPage({ params }: ArticleEditorPageProps) {
  const { articleId } = await params;
  const { data: article, error } = await getArticle(articleId);

  if (error || !article) {
    notFound();
  }

  return <ArticleEditorClient article={article} />;
}
