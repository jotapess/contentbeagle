"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  History,
  Eye,
  RotateCcw,
  ChevronRight,
  User,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react";

import type { ArticleVersion, ArticleStatus } from "@/types";
import { getArticleById, mockUsers } from "@/lib/mock-data";
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

const mockVersions: ArticleVersion[] = [
  {
    id: "version-5",
    articleId: "article-1",
    versionNumber: 5,
    title: "10 Ways to Automate Your Business Workflows in 2024",
    content: `# 10 Ways to Automate Your Business Workflows in 2024

Running a business means juggling countless tasks every day. But what if you could hand off the repetitive stuff to technology? Here are ten proven ways to automate your workflows and reclaim your time.

## 1. Email Marketing Automation

Stop manually sending every email. Set up automated sequences that nurture leads and engage customers while you focus on strategy.

## 2. CRM Data Sync

Keep your customer data consistent across all platforms automatically. No more manual updates or data entry errors.`,
    status: "published",
    changeSummary: "Published final version with SEO improvements",
    changedBy: "user-1",
    createdAt: "2024-02-15T10:00:00Z",
  },
  {
    id: "version-4",
    articleId: "article-1",
    versionNumber: 4,
    title: "10 Ways to Automate Your Business Workflows in 2024",
    content: `# 10 Ways to Automate Your Business Workflows in 2024

Running a business means juggling countless tasks every day. But what if you could hand off the repetitive stuff to technology? Here are ten proven ways to automate your workflows and reclaim your time.

## 1. Email Marketing Automation

Stop manually sending every email. Set up automated sequences that nurture leads.

## 2. CRM Data Sync

Keep your customer data consistent across all platforms.`,
    status: "approved",
    changeSummary: "Applied humanization and removed AI patterns",
    changedBy: "user-2",
    createdAt: "2024-02-14T16:30:00Z",
  },
  {
    id: "version-3",
    articleId: "article-1",
    versionNumber: 3,
    title: "10 Ways to Automate Your Business Workflows in 2024",
    content: `# 10 Ways to Automate Your Business Workflows in 2024

Running a business means delving into countless tasks every day. But what if you could leverage technology to hand off the repetitive stuff? Here are ten robust ways to automate your workflows.

## 1. Email Marketing Automation

Let's delve into email automation. Stop manually sending every email.

## 2. CRM Data Sync

It's important to note that keeping your customer data consistent is crucial.`,
    status: "humanizing",
    changeSummary: "Added internal links and cross-references",
    changedBy: "user-1",
    createdAt: "2024-02-13T11:00:00Z",
  },
  {
    id: "version-2",
    articleId: "article-1",
    versionNumber: 2,
    title: "10 Ways to Automate Your Business Workflows",
    content: `# 10 Ways to Automate Your Business Workflows

Running a business means delving into countless tasks every day. Here are ten robust ways to automate your workflows.

## 1. Email Marketing Automation

Let's delve into email automation.

## 2. CRM Data Sync

It's important to note that keeping your customer data consistent is crucial.`,
    status: "seo_review",
    changeSummary: "Initial content generation completed",
    changedBy: "user-1",
    createdAt: "2024-02-12T14:00:00Z",
  },
  {
    id: "version-1",
    articleId: "article-1",
    versionNumber: 1,
    title: "Untitled Article",
    content: `- Email automation
- CRM sync
- Invoice generation
- Social media scheduling
- Report generation`,
    status: "draft",
    changeSummary: "Created article from bullet points",
    changedBy: "user-1",
    createdAt: "2024-02-10T10:00:00Z",
  },
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

function getUserName(userId: string): string {
  const user = mockUsers.find((u) => u.id === userId);
  return user?.fullName ?? "Unknown User";
}

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

export default function HistoryPage() {
  const params = useParams<{ articleId: string }>();
  const article = getArticleById(params.articleId);

  const [selectedVersion, setSelectedVersion] = React.useState<ArticleVersion | null>(
    null
  );
  const [showRestoreDialog, setShowRestoreDialog] = React.useState(false);
  const [showViewDialog, setShowViewDialog] = React.useState(false);
  const [expandedDiff, setExpandedDiff] = React.useState<string | null>(null);

  if (!article) {
    return null;
  }

  const currentVersion = mockVersions[0];

  function handleView(version: ArticleVersion) {
    setSelectedVersion(version);
    setShowViewDialog(true);
  }

  function handleRestore(version: ArticleVersion) {
    setSelectedVersion(version);
    setShowRestoreDialog(true);
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
              {mockVersions.length} versions
            </Badge>
          </div>

          <div className="relative space-y-4">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

            {mockVersions.map((version, index) => {
              const isLatest = index === 0;
              const previousVersion = mockVersions[index + 1];
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
                              Version {version.versionNumber}
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
                            {version.changeSummary}
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
                          {getUserName(version.changedBy)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          {format(new Date(version.createdAt), "MMM d, yyyy 'at' h:mm a")}
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
                              Changes from version {previousVersion.versionNumber}
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
        </div>
      </div>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.versionNumber} - {selectedVersion?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedVersion &&
                format(
                  new Date(selectedVersion.createdAt),
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
            {selectedVersion && selectedVersion.id !== mockVersions[0].id && (
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
            <DialogTitle>Restore Version {selectedVersion?.versionNumber}?</DialogTitle>
            <DialogDescription>
              This will create a new version with the content from version{" "}
              {selectedVersion?.versionNumber}. The current version will be preserved in
              the history.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">{selectedVersion?.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedVersion?.changeSummary}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowRestoreDialog(false);
              }}
            >
              <RotateCcw className="size-4" />
              Restore Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
