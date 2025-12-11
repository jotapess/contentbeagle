import { notFound } from "next/navigation";
import { getArticle } from "@/lib/actions/articles";
import { HumanizePageClient } from "./humanize-page-client";

interface HumanizePageProps {
  params: Promise<{ articleId: string }>;
}

export default async function HumanizePage({ params }: HumanizePageProps) {
  const { articleId } = await params;
  const { data: article, error } = await getArticle(articleId);

  if (error || !article) {
    notFound();
  }

  return <HumanizePageClient article={article} />;
}
