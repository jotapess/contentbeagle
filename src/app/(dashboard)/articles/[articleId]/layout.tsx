"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  ChevronLeft,
  FileEdit,
  Search,
  Link2,
  Sparkles,
  History,
  Loader2,
} from "lucide-react";

import { getArticle } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Article {
  id: string;
  title: string;
}

interface ArticleLayoutProps {
  children: React.ReactNode;
}

interface NavTab {
  href: string;
  label: string;
  icon: React.ElementType;
}

export default function ArticleLayout({ children }: ArticleLayoutProps) {
  const pathname = usePathname();
  const params = useParams<{ articleId: string }>();
  const articleId = params.articleId;

  const [article, setArticle] = React.useState<Article | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadArticle() {
      setIsLoading(true);
      const result = await getArticle(articleId);
      if (result.data) {
        setArticle(result.data);
      }
      setIsLoading(false);
    }
    loadArticle();
  }, [articleId]);

  const tabs: NavTab[] = [
    { href: `/articles/${articleId}`, label: "Editor", icon: FileEdit },
    { href: `/articles/${articleId}/seo`, label: "SEO", icon: Search },
    { href: `/articles/${articleId}/links`, label: "Links", icon: Link2 },
    { href: `/articles/${articleId}/humanize`, label: "Humanize", icon: Sparkles },
    { href: `/articles/${articleId}/history`, label: "History", icon: History },
  ];

  function isActive(href: string): boolean {
    if (href === `/articles/${articleId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Article not found</p>
        <p className="mt-1 text-muted-foreground">
          The article you are looking for does not exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/articles">Back to Articles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/articles" aria-label="Back to articles">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{article.title}</h1>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link href="/articles" className="hover:text-foreground">
                    Articles
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="truncate">{article.title}</li>
              </ol>
            </nav>
          </div>
        </div>

        <nav aria-label="Article sections" className="flex gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1">{children}</div>
    </div>
  );
}
