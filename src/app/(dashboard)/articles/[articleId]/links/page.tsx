import { notFound } from "next/navigation";
import { getArticle } from "@/lib/actions/articles";
import { LinksPageClient } from "./links-page-client";

interface LinksPageProps {
  params: Promise<{ articleId: string }>;
}

export default async function LinksPage({ params }: LinksPageProps) {
  const { articleId } = await params;
  const { data: article, error } = await getArticle(articleId);

  if (error || !article) {
    notFound();
  }

  return <LinksPageClient article={article} />;
}
