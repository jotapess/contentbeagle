"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  X,
  Play,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

import type { PatternCategory, PatternType, PatternSeverity } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const categoryOptions: { value: PatternCategory; label: string }[] = [
  { value: "phrase_replacement", label: "Phrase Replacement" },
  { value: "sentence_structure", label: "Sentence Structure" },
  { value: "word_variety", label: "Word Variety" },
  { value: "transition_words", label: "Transition Words" },
  { value: "punctuation", label: "Punctuation" },
  { value: "paragraph_flow", label: "Paragraph Flow" },
  { value: "tone_adjustment", label: "Tone Adjustment" },
  { value: "custom", label: "Custom" },
];

const patternTypeOptions: { value: PatternType; label: string; description: string }[] = [
  { value: "regex", label: "Regex", description: "Regular expression pattern matching" },
  { value: "exact", label: "Exact Match", description: "Matches exact text (case-insensitive)" },
  { value: "semantic", label: "Semantic", description: "AI-powered semantic matching" },
  { value: "ai_detection", label: "AI Detection", description: "Detects AI-generated patterns" },
];

const severityOptions: { value: PatternSeverity; label: string; className: string }[] = [
  { value: "low", label: "Low", className: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "medium", label: "Medium", className: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "high", label: "High", className: "bg-red-100 text-red-700 border-red-200" },
];

interface TestMatch {
  text: string;
  index: number;
}

export default function NewAIRulePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<PatternCategory>("word_variety");
  const [patternType, setPatternType] = React.useState<PatternType>("regex");
  const [pattern, setPattern] = React.useState("");
  const [replacementOptions, setReplacementOptions] = React.useState<string[]>([""]);
  const [severity, setSeverity] = React.useState<PatternSeverity>("medium");

  const [testText, setTestText] = React.useState("");
  const [testMatches, setTestMatches] = React.useState<TestMatch[]>([]);
  const [testError, setTestError] = React.useState<string | null>(null);

  function addReplacementOption() {
    setReplacementOptions((prev) => [...prev, ""]);
  }

  function removeReplacementOption(index: number) {
    setReplacementOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateReplacementOption(index: number, value: string) {
    setReplacementOptions((prev) =>
      prev.map((opt, i) => (i === index ? value : opt))
    );
  }

  async function handleTestPattern() {
    if (!pattern.trim() || !testText.trim()) return;

    setIsTesting(true);
    setTestError(null);
    setTestMatches([]);

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (patternType === "regex") {
        const regex = new RegExp(pattern, "gi");
        const matches: TestMatch[] = [];
        let match;

        while ((match = regex.exec(testText)) !== null) {
          matches.push({ text: match[0], index: match.index });
          if (matches.length > 50) break;
        }

        setTestMatches(matches);
      } else if (patternType === "exact") {
        const lowerText = testText.toLowerCase();
        const lowerPattern = pattern.toLowerCase();
        const matches: TestMatch[] = [];
        let startIndex = 0;

        while (startIndex < lowerText.length) {
          const index = lowerText.indexOf(lowerPattern, startIndex);
          if (index === -1) break;
          matches.push({
            text: testText.slice(index, index + pattern.length),
            index,
          });
          startIndex = index + 1;
          if (matches.length > 50) break;
        }

        setTestMatches(matches);
      } else {
        setTestMatches([]);
      }
    } catch (error) {
      setTestError(
        error instanceof Error ? error.message : "Invalid pattern"
      );
    }

    setIsTesting(false);
  }

  function highlightMatches(text: string, matches: TestMatch[]): React.ReactNode {
    if (matches.length === 0) return text;

    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedMatches.forEach((match, i) => {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <mark
          key={i}
          className="rounded bg-amber-200 px-0.5 dark:bg-amber-900/50"
        >
          {match.text}
        </mark>
      );
      lastIndex = match.index + match.text.length;
    });

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push("/ai-rules");
  }

  const isValid =
    name.trim() &&
    pattern.trim() &&
    replacementOptions.some((opt) => opt.trim());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ai-rules">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to AI Rules</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create AI Rule</h1>
          <p className="text-muted-foreground">
            Define a new pattern rule for AI detection and replacement
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rule Details</CardTitle>
                <CardDescription>
                  Basic information about this rule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g., Overused "Delve"'
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what this rule detects and why it matters"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as PatternCategory)}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <div className="flex gap-2">
                      {severityOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSeverity(opt.value)}
                          className={cn(
                            "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                            severity === opt.value
                              ? opt.className
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Configuration</CardTitle>
                <CardDescription>
                  Define how the rule matches content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pattern Type</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {patternTypeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPatternType(opt.value)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          patternType === opt.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        )}
                      >
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {(patternType === "regex" || patternType === "exact") && (
                  <div className="space-y-2">
                    <Label htmlFor="pattern">
                      {patternType === "regex" ? "Regex Pattern" : "Match Text"}
                    </Label>
                    <Input
                      id="pattern"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      placeholder={
                        patternType === "regex"
                          ? "\\bdelve(s|d)?\\b"
                          : "it's important to note"
                      }
                      className="font-mono"
                    />
                    {patternType === "regex" && (
                      <p className="text-xs text-muted-foreground">
                        Use JavaScript regex syntax. The pattern will be applied
                        with global and case-insensitive flags.
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Replacement Options</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addReplacementOption}
                    >
                      <Plus className="size-4" />
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {replacementOptions.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={(e) =>
                            updateReplacementOption(i, e.target.value)
                          }
                          placeholder={
                            i === 0
                              ? "Leave empty to remove the match"
                              : "Alternative replacement"
                          }
                        />
                        {replacementOptions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeReplacementOption(i)}
                          >
                            <X className="size-4" />
                            <span className="sr-only">Remove option</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Multiple options let users choose the best replacement for
                    each context.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Pattern</CardTitle>
                <CardDescription>
                  Enter sample text to test your pattern
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-text">Sample Text</Label>
                  <Textarea
                    id="test-text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Paste or type text to test your pattern against..."
                    rows={6}
                  />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTestPattern}
                  disabled={
                    isTesting ||
                    !pattern.trim() ||
                    !testText.trim() ||
                    (patternType !== "regex" && patternType !== "exact")
                  }
                  className="w-full"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Test Pattern
                    </>
                  )}
                </Button>

                {testError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p className="text-sm">{testError}</p>
                  </div>
                )}

                {testMatches.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="size-4 text-green-600" />
                      <span className="text-sm font-medium">
                        {testMatches.length} match
                        {testMatches.length !== 1 ? "es" : ""} found
                      </span>
                    </div>

                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap text-sm">
                        {highlightMatches(testText, testMatches)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {testMatches.slice(0, 10).map((match, i) => (
                        <Badge key={i} variant="secondary">
                          &ldquo;{match.text}&rdquo;
                        </Badge>
                      ))}
                      {testMatches.length > 10 && (
                        <Badge variant="outline">
                          +{testMatches.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {!testError &&
                  testMatches.length === 0 &&
                  testText.trim() &&
                  pattern.trim() && (
                    <p className="text-sm text-muted-foreground">
                      No matches found. Try a different pattern or sample text.
                    </p>
                  )}
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rule Preview</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        severityOptions.find((s) => s.value === severity)
                          ?.className
                      )}
                    >
                      {severityOptions.find((s) => s.value === severity)?.label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {name || "Untitled rule"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Category:</span>{" "}
                      {categoryOptions.find((c) => c.value === category)?.label}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      {patternTypeOptions.find((p) => p.value === patternType)?.label}
                    </p>
                    {pattern && (
                      <p className="font-mono">
                        <span className="text-muted-foreground">Pattern:</span>{" "}
                        {pattern}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">
                        Replacements:
                      </span>{" "}
                      {replacementOptions.filter((o) => o.trim()).length ||
                        "None"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/ai-rules">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Rule"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
