"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  X,
  Play,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Shield,
  Lock,
} from "lucide-react";

import {
  getUserTeams,
  getAIRule,
  updateTeamAIRule,
  deleteTeamAIRule,
} from "@/lib/actions";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

type PatternCategory =
  | "phrase_replacement"
  | "sentence_structure"
  | "word_variety"
  | "transition_words"
  | "punctuation"
  | "paragraph_flow"
  | "tone_adjustment"
  | "custom";

type PatternType = "regex" | "exact" | "semantic" | "ai_detection";
type PatternSeverity = "low" | "medium" | "high";

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

interface AIRule {
  id: string;
  name: string;
  description: string | null;
  category: string;
  pattern_type: string;
  pattern: string | null;
  replacement_options: string[] | null;
  severity: string;
  is_active: boolean;
  is_global: boolean;
  created_at: string | null;
}

export default function EditAIRulePage() {
  const params = useParams<{ ruleId: string }>();
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [teamId, setTeamId] = React.useState<string | null>(null);
  const [rule, setRule] = React.useState<AIRule | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

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

  // Load rule data
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Get user's team
      const teamsResult = await getUserTeams();
      if (!teamsResult.data || teamsResult.data.length === 0) {
        setIsLoading(false);
        return;
      }

      const currentTeamId = teamsResult.data[0].id;
      setTeamId(currentTeamId);

      // Get rule
      const ruleResult = await getAIRule(params.ruleId, currentTeamId);
      if (ruleResult.data) {
        const r = ruleResult.data;
        setRule(r);
        setName(r.name || "");
        setDescription(r.description || "");
        setCategory((r.category as PatternCategory) || "word_variety");
        setPatternType((r.pattern_type as PatternType) || "regex");
        setPattern(r.pattern || "");
        setReplacementOptions(r.replacement_options?.length ? r.replacement_options : [""]);
        setSeverity((r.severity as PatternSeverity) || "medium");
      }

      setIsLoading(false);
    }

    loadData();
  }, [params.ruleId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Rule not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/ai-rules">Back to AI Rules</Link>
        </Button>
      </div>
    );
  }

  const isGlobal = rule.is_global;
  const isEditable = !isGlobal;

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
      setTestError(error instanceof Error ? error.message : "Invalid pattern");
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
    if (!isEditable || !teamId || !rule) return;

    setIsSubmitting(true);

    const result = await updateTeamAIRule(rule.id, teamId, {
      name,
      description,
      pattern,
      replacement_options: replacementOptions.filter((o) => o.trim()),
      severity,
    });

    setIsSubmitting(false);

    if (!result.error) {
      router.push("/ai-rules");
    }
  }

  async function handleDelete() {
    if (!teamId || !rule) return;

    setIsDeleting(true);

    const result = await deleteTeamAIRule(rule.id, teamId);

    setIsDeleting(false);

    if (result.data) {
      router.push("/ai-rules");
    }
  }

  const isValid =
    name.trim() && pattern.trim() && replacementOptions.some((opt) => opt.trim());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/ai-rules">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to AI Rules</span>
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {isGlobal ? "View Rule" : "Edit Rule"}
            </h1>
            {isGlobal && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="size-3" />
                Global
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isGlobal
              ? "This is a global rule that cannot be edited"
              : "Update your custom pattern rule"}
          </p>
        </div>
      </div>

      {isGlobal && (
        <Alert>
          <Lock className="size-4" />
          <AlertTitle>Read-only Rule</AlertTitle>
          <AlertDescription>
            Global rules are managed by ContentBeagle and cannot be modified.
            You can create a custom rule based on this pattern if you need
            different behavior.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rule Details</CardTitle>
                <CardDescription>
                  {isGlobal
                    ? "Basic information about this rule"
                    : "Update the basic information"}
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
                    disabled={isGlobal}
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
                    disabled={isGlobal}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={category}
                      onValueChange={(v) => setCategory(v as PatternCategory)}
                      disabled={isGlobal}
                    >
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
                          onClick={() => !isGlobal && setSeverity(opt.value)}
                          disabled={isGlobal}
                          className={cn(
                            "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                            severity === opt.value
                              ? opt.className
                              : "bg-muted",
                            isGlobal
                              ? "cursor-not-allowed opacity-60"
                              : "hover:bg-muted/80"
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
                  {isGlobal
                    ? "How this rule matches content"
                    : "Define how the rule matches content"}
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
                        onClick={() => !isGlobal && setPatternType(opt.value)}
                        disabled={isGlobal}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          patternType === opt.value
                            ? "border-primary bg-primary/5"
                            : "",
                          isGlobal ? "cursor-not-allowed" : "hover:bg-muted"
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
                      disabled={isGlobal}
                    />
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Replacement Options</Label>
                    {isEditable && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addReplacementOption}
                      >
                        <Plus className="size-4" />
                        Add Option
                      </Button>
                    )}
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
                          disabled={isGlobal}
                        />
                        {isEditable && replacementOptions.length > 1 && (
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
                </div>
              </CardContent>
            </Card>

            {isEditable && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="size-4" />
                        Delete Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Rule</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete &ldquo;{rule.name}
                          &rdquo;? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Pattern</CardTitle>
                <CardDescription>
                  Enter sample text to test the pattern
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-text">Sample Text</Label>
                  <Textarea
                    id="test-text"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="Paste or type text to test the pattern against..."
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
                      No matches found. Try different sample text.
                    </p>
                  )}
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rule Summary</span>
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
                      {patternTypeOptions.find((p) => p.value === patternType)
                        ?.label}
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
                    {rule.created_at && (
                      <p>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        {new Date(rule.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/ai-rules">
              {isGlobal ? "Back" : "Cancel"}
            </Link>
          </Button>
          {isEditable && (
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
