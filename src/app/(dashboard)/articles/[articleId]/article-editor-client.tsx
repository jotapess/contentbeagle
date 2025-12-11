"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Globe,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Building2,
  Loader2,
} from "lucide-react";

import type { ArticleWithBrand, ArticleStatus } from "@/lib/actions/articles";
import { updateArticleContent, transitionArticleStatus } from "@/lib/actions/articles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/articles";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const workflowSteps: { status: ArticleStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "editing", label: "Editing" },
  { status: "seo_review", label: "SEO Review" },
  { status: "cross_linking", label: "Cross-linking" },
  { status: "humanizing", label: "Humanizing" },
  { status: "polished", label: "Polished" },
  { status: "approved", label: "Approved" },
  { status: "published", label: "Published" },
];

const statusConfig: Record<ArticleStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  editing: {
    label: "Editing",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  seo_review: {
    label: "SEO Review",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  cross_linking: {
    label: "Cross-linking",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  humanizing: {
    label: "Humanizing",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  polished: {
    label: "Polished",
    className: "bg-teal-100 text-teal-700 border-teal-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  published: {
    label: "Published",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

function getStepState(
  currentStatus: ArticleStatus,
  stepStatus: ArticleStatus
): "completed" | "current" | "upcoming" {
  const currentIndex = workflowSteps.findIndex((s) => s.status === currentStatus);
  const stepIndex = workflowSteps.findIndex((s) => s.status === stepStatus);

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

interface ArticleEditorClientProps {
  article: ArticleWithBrand;
}

export function ArticleEditorClient({ article }: ArticleEditorClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [title, setTitle] = React.useState(article.title);
  const [content, setContent] = React.useState(article.content ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ArticleStatus>(article.status);

  const wordCount = React.useMemo(() => {
    return content.split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readingTime = React.useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const hasChanges = title !== article.title || content !== (article.content ?? "");

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateArticleContent(article.id, {
      title,
      content,
      changeSummary: "Content updated",
    });
    setIsSaving(false);

    if (!error) {
      router.refresh();
    }
  };

  const handleTransition = async (toStatus: ArticleStatus) => {
    setIsTransitioning(true);
    const { error } = await transitionArticleStatus(article.id, toStatus);
    setIsTransitioning(false);

    if (!error) {
      setCurrentStatus(toStatus);
      router.refresh();
    }
  };

  const getNextStatus = (): ArticleStatus | null => {
    const currentIndex = workflowSteps.findIndex((s) => s.status === currentStatus);
    if (currentIndex < workflowSteps.length - 1) {
      return workflowSteps[currentIndex + 1].status;
    }
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-6 py-4">
          <Label htmlFor="title" className="sr-only">
            Article Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
            placeholder="Article title..."
          />
        </div>

        <div className="flex-1 overflow-auto p-4">
          <Label htmlFor="content" className="sr-only">
            Article Content
          </Label>
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your article..."
            className="h-full"
          />
        </div>

        <div className="flex items-center justify-between border-t px-6 py-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {hasChanges && (
              <span className="text-amber-600">Unsaved changes</span>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {sidebarOpen ? (
                    <PanelRightClose className="size-5" />
                  ) : (
                    <PanelRightOpen className="size-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {sidebarOpen ? "Close sidebar" : "Open sidebar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {sidebarOpen && (
        <aside className="w-80 shrink-0 overflow-y-auto border-l bg-muted/30">
          <div className="space-y-6 p-6">
            <section>
              <h3 className="mb-4 text-sm font-semibold">Article Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      statusConfig[currentStatus].className
                    )}
                  >
                    {statusConfig[currentStatus].label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Brand</span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <Building2 className="size-3.5" />
                    {article.brand?.name ?? "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Word Count</span>
                  <span className="text-sm tabular-nums">
                    {wordCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reading Time</span>
                  <span className="text-sm">{readingTime} min</span>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="mb-4 text-sm font-semibold">Workflow Status</h3>
              <div className="space-y-1">
                {workflowSteps.map((step, index) => {
                  const state = getStepState(currentStatus, step.status);
                  return (
                    <div key={step.status} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                          state === "completed" &&
                            "bg-primary text-primary-foreground",
                          state === "current" &&
                            "border-2 border-primary bg-primary/10 text-primary",
                          state === "upcoming" &&
                            "border border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          state === "completed" && "text-muted-foreground",
                          state === "current" && "font-medium",
                          state === "upcoming" && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </span>
                      {state === "current" && (
                        <ChevronRight className="ml-auto size-4 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                {nextStatus && nextStatus !== "published" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleTransition(nextStatus)}
                    disabled={isTransitioning}
                  >
                    {isTransitioning ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Move to {statusConfig[nextStatus].label}
                  </Button>
                )}
                {(currentStatus === "approved" || currentStatus === "polished") && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => handleTransition("published")}
                    disabled={isTransitioning}
                  >
                    {isTransitioning ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Globe className="size-4" />
                    )}
                    Publish
                  </Button>
                )}
              </div>
            </section>
          </div>
        </aside>
      )}
    </div>
  );
}
