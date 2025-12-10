"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ListChecks,
  FileText,
  Search,
  Lightbulb,
  Loader2,
} from "lucide-react";

import type { ArticleInputType } from "@/types";
import { mockBrands } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TargetLength = "short" | "medium" | "long";

interface InputTypeOption {
  value: ArticleInputType;
  label: string;
  description: string;
  icon: React.ElementType;
  placeholder: string;
}

const inputTypeOptions: InputTypeOption[] = [
  {
    value: "bullets",
    label: "Bullet Points",
    description: "Provide key points to expand into a full article",
    icon: ListChecks,
    placeholder: `- Main point or concept
- Supporting detail or fact
- Another key topic to cover
- Call to action or conclusion point`,
  },
  {
    value: "draft",
    label: "Draft Content",
    description: "Paste existing draft content to refine and improve",
    icon: FileText,
    placeholder: `Paste your rough draft here. It can be incomplete sentences, notes, or a partially written article.

The AI will enhance and expand this content while maintaining your brand voice.`,
  },
  {
    value: "research",
    label: "Research & Notes",
    description: "Provide research notes or source material to synthesize",
    icon: Search,
    placeholder: `Include research notes, statistics, quotes, or source material here.

Example:
- Study found 73% of businesses...
- Expert quote: "..."
- Key statistic: ...`,
  },
  {
    value: "topic_only",
    label: "Topic Only",
    description: "Just provide a topic and let AI generate the content",
    icon: Lightbulb,
    placeholder: `Enter your topic or title idea here.

Example: "10 Ways to Improve Customer Retention" or "The Complete Guide to Remote Team Management"`,
  },
];

const lengthOptions: { value: TargetLength; label: string; description: string }[] = [
  { value: "short", label: "Short", description: "500-1,000 words" },
  { value: "medium", label: "Medium", description: "1,000-2,000 words" },
  { value: "long", label: "Long", description: "2,000+ words" },
];

export default function NewArticlePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = React.useState(false);

  const [brandId, setBrandId] = React.useState<string>("");
  const [inputType, setInputType] = React.useState<ArticleInputType>("bullets");
  const [content, setContent] = React.useState("");
  const [targetAudience, setTargetAudience] = React.useState("");
  const [targetLength, setTargetLength] = React.useState<TargetLength>("medium");
  const [callToAction, setCallToAction] = React.useState("");

  const selectedInputType = inputTypeOptions.find((o) => o.value === inputType);
  const selectedBrand = mockBrands.find((b) => b.id === brandId);
  const readyBrands = mockBrands.filter((b) => b.status === "ready");

  const canGenerate = brandId && content.trim();

  async function handleGenerate() {
    if (!canGenerate) return;

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    router.push("/articles/article-1");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/articles" aria-label="Back to articles">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Article</h1>
          <p className="text-muted-foreground">
            Generate brand-aligned content from your input
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand & Input Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brand">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {readyBrands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBrand?.targetAudience && (
                  <p className="text-sm text-muted-foreground">
                    Target audience: {selectedBrand.targetAudience}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Input Type</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {inputTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = inputType === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setInputType(option.value)}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium leading-none">{option.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Input</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="content">
                  {selectedInputType?.label ?? "Content"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={selectedInputType?.placeholder}
                  className="min-h-[240px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  {content.length > 0
                    ? `${content.split(/\s+/).filter(Boolean).length} words`
                    : "Enter your content above"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Small business owners"
                />
                <p className="text-xs text-muted-foreground">
                  Override the brand default if needed
                </p>
              </div>

              <div className="space-y-3">
                <Label>Article Length</Label>
                <div className="space-y-2">
                  {lengthOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTargetLength(option.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                        targetLength === option.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta">Call to Action</Label>
                <Input
                  id="cta"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  placeholder="e.g., Sign up for free trial"
                />
                <p className="text-xs text-muted-foreground">
                  The desired action for readers
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            disabled={!canGenerate || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating Article...
              </>
            ) : (
              "Generate Article"
            )}
          </Button>

          {!brandId && (
            <p className="text-center text-sm text-muted-foreground">
              Select a brand to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
