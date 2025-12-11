import { notFound } from "next/navigation";
import { getArticle } from "@/lib/actions/articles";
import { SEOPageClient } from "./seo-page-client";

interface SEOPageProps {
  params: Promise<{ articleId: string }>;
}

export default async function SEOPage({ params }: SEOPageProps) {
  const { articleId } = await params;
  const { data: article, error } = await getArticle(articleId);

  if (error || !article) {
    notFound();
  }

  return (
    <div className="relative left-1/2 right-1/2 w-screen -mx-[50vw] px-4 sm:px-6 lg:px-8">
      <SEOPageClient article={article} />
    </div>
  );
}
