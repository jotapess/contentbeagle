import { notFound } from "next/navigation";
import { getArticle, getArticleVersions } from "@/lib/actions/articles";
import { HistoryPageClient } from "./history-page-client";

interface HistoryPageProps {
  params: Promise<{ articleId: string }>;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { articleId } = await params;
  const [articleResult, versionsResult] = await Promise.all([
    getArticle(articleId),
    getArticleVersions(articleId),
  ]);

  if (articleResult.error || !articleResult.data) {
    notFound();
  }

  return (
    <HistoryPageClient
      article={articleResult.data}
      versions={versionsResult.data || []}
    />
  );
}
