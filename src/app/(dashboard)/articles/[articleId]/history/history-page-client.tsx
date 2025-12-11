"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Eye,
  RotateCcw,
  ChevronRight,
  User,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react";

import type { ArticleWithBrand, ArticleStatus } from "@/lib/actions/articles";
import { restoreArticleVersion } from "@/lib/actions/articles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ArticleVersionWithProfile {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  content: string | null;
  content_html: string | null;
  status: string;
  change_summary: string | null;
  changed_by: string;
  created_at: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

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

function DiffView({
  oldContent,
  newContent,
}: {
  oldContent: string;
  newContent: string;
}) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Before</h4>
        <div className="rounded-lg border bg-red-50/50 p-4 dark:bg-red-950/20">
          <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
            {oldLines.slice(0, 20).join("\n")}
            {oldLines.length > 20 && "\n..."}
          </pre>
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">After</h4>
        <div className="rounded-lg border bg-green-50/50 p-4 dark:bg-green-950/20">
          <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
            {newLines.slice(0, 20).join("\n")}
            {newLines.length > 20 && "\n..."}
          </pre>
        </div>
      </div>
    </div>
  );
}

interface HistoryPageClientProps {
  article: ArticleWithBrand;
  versions: ArticleVersionWithProfile[];
}

export function HistoryPageClient({ article, versions }: HistoryPageClientProps) {
  const router = useRouter();
  const [selectedVersion, setSelectedVersion] = React.useState<ArticleVersionWithProfile | null>(
    null
  );
  const [showRestoreDialog, setShowRestoreDialog] = React.useState(false);
  const [showViewDialog, setShowViewDialog] = React.useState(false);
  const [expandedDiff, setExpandedDiff] = React.useState<string | null>(null);
  const [isRestoring, setIsRestoring] = React.useState(false);

  function handleView(version: ArticleVersionWithProfile) {
    setSelectedVersion(version);
    setShowViewDialog(true);
  }

  function handleRestore(version: ArticleVersionWithProfile) {
    setSelectedVersion(version);
    setShowRestoreDialog(true);
  }

  async function confirmRestore() {
    if (!selectedVersion) return;

    setIsRestoring(true);
    const { error } = await restoreArticleVersion(article.id, selectedVersion.id);
    setIsRestoring(false);

    if (!error) {
      setShowRestoreDialog(false);
      router.refresh();
    }
  }

  function toggleDiff(versionId: string) {
    setExpandedDiff(expandedDiff === versionId ? null : versionId);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Version History</h2>
              <p className="text-sm text-muted-foreground">
                Track changes and restore previous versions
              </p>
            </div>
            <Badge variant="outline" className="tabular-nums">
              {versions.length} versions
            </Badge>
          </div>

          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <p className="text-muted-foreground">No version history yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Versions are created when you save changes to the article.
              </p>
            </div>
          ) : (
            <div className="relative space-y-4">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

              {versions.map((version, index) => {
                const isLatest = index === 0;
                const previousVersion = versions[index + 1];
                const isDiffExpanded = expandedDiff === version.id;

                return (
                  <div key={version.id} className="relative pl-14">
                    <div
                      className={cn(
                        "absolute left-4 top-4 flex size-5 items-center justify-center rounded-full border-2 bg-background",
                        isLatest ? "border-primary" : "border-muted-foreground/30"
                      )}
                    >
                      {isLatest && (
                        <div className="size-2 rounded-full bg-primary" />
                      )}
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">
                                Version {version.version_number}
                              </CardTitle>
                              {isLatest && (
                                <Badge variant="default" className="text-xs">
                                  Current
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  statusConfig[version.status].className
                                )}
                              >
                                {statusConfig[version.status].label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {version.change_summary || "No description"}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(version)}
                            >
                              <Eye className="size-3.5" />
                              View
                            </Button>
                            {!isLatest && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestore(version)}
                              >
                                <RotateCcw className="size-3.5" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <User className="size-3.5" />
                            {version.profiles?.full_name || "Unknown User"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" />
                            {version.created_at ? format(new Date(version.created_at), "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FileText className="size-3.5" />
                            {version.content?.split(/\s+/).filter(Boolean).length ?? 0}{" "}
                            words
                          </span>
                        </div>

                        {previousVersion && (
                          <>
                            <Separator />
                            <button
                              onClick={() => toggleDiff(version.id)}
                              className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground"
                            >
                              <span className="flex items-center gap-2">
                                <ArrowRight className="size-3.5" />
                                Changes from version {previousVersion.version_number}
                              </span>
                              <ChevronRight
                                className={cn(
                                  "size-4 transition-transform",
                                  isDiffExpanded && "rotate-90"
                                )}
                              />
                            </button>

                            {isDiffExpanded && (
                              <DiffView
                                oldContent={previousVersion.content ?? ""}
                                newContent={version.content ?? ""}
                              />
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.version_number} - {selectedVersion?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion?.created_at &&
                format(
                  new Date(selectedVersion.created_at),
                  "MMMM d, yyyy 'at' h:mm a"
                )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="prose prose-sm max-w-none p-4 dark:prose-invert">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {selectedVersion?.content}
              </pre>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            {selectedVersion && versions[0]?.id !== selectedVersion.id && (
              <Button
                onClick={() => {
                  setShowViewDialog(false);
                  setShowRestoreDialog(true);
                }}
              >
                <RotateCcw className="size-4" />
                Restore This Version
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version {selectedVersion?.version_number}?</DialogTitle>
            <DialogDescription>
              This will create a new version with the content from version{" "}
              {selectedVersion?.version_number}. The current version will be preserved in
              the history.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">{selectedVersion?.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedVersion?.change_summary || "No description"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)} disabled={isRestoring}>
              Cancel
            </Button>
            <Button onClick={confirmRestore} disabled={isRestoring}>
              {isRestoring ? (
                "Restoring..."
              ) : (
                <>
                  <RotateCcw className="size-4" />
                  Restore Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
