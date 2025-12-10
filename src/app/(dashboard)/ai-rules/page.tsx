"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Shield, User, Filter } from "lucide-react";

import type { AIPatternRule, PatternCategory, PatternSeverity } from "@/types";
import { mockAIPatternRules, currentTeam } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const categoryLabels: Record<PatternCategory, string> = {
  phrase_replacement: "Phrase Replacement",
  sentence_structure: "Sentence Structure",
  word_variety: "Word Variety",
  transition_words: "Transition Words",
  punctuation: "Punctuation",
  paragraph_flow: "Paragraph Flow",
  tone_adjustment: "Tone Adjustment",
  custom: "Custom",
};

const patternTypeLabels: Record<string, string> = {
  regex: "Regex",
  exact: "Exact Match",
  semantic: "Semantic",
  ai_detection: "AI Detection",
};

const severityConfig: Record<
  PatternSeverity,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  high: {
    label: "High",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

function RuleRow({
  rule,
  onToggle,
}: {
  rule: AIPatternRule;
  onToggle: (id: string) => void;
}) {
  const severity = severityConfig[rule.severity];

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/ai-rules/${rule.id}`}
          className="font-medium hover:underline"
        >
          {rule.name}
        </Link>
        {rule.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
            {rule.description}
          </p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {categoryLabels[rule.category]}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {patternTypeLabels[rule.patternType]}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-xs", severity.className)}>
          {severity.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Switch
          checked={rule.isActive}
          onCheckedChange={() => onToggle(rule.id)}
          aria-label={`Toggle ${rule.name}`}
        />
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/ai-rules/${rule.id}`}>
            {rule.isGlobal ? "View" : "Edit"}
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AIRulesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [rules, setRules] = React.useState<AIPatternRule[]>(mockAIPatternRules);

  const globalRules = React.useMemo(() => {
    return rules.filter((r) => r.isGlobal);
  }, [rules]);

  const customRules = React.useMemo(() => {
    return rules.filter((r) => !r.isGlobal && r.teamId === currentTeam.id);
  }, [rules]);

  const filterRules = React.useCallback(
    (ruleList: AIPatternRule[]) => {
      return ruleList.filter((rule) => {
        const matchesSearch =
          !searchQuery.trim() ||
          rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rule.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
          categoryFilter === "all" || rule.category === categoryFilter;

        return matchesSearch && matchesCategory;
      });
    },
    [searchQuery, categoryFilter]
  );

  const filteredGlobalRules = filterRules(globalRules);
  const filteredCustomRules = filterRules(customRules);

  function handleToggle(ruleId: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  }

  const activeCount = rules.filter((r) => r.isActive).length;
  const globalActiveCount = globalRules.filter((r) => r.isActive).length;
  const customActiveCount = customRules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Pattern Rules</h1>
          <p className="text-muted-foreground">
            Manage rules for detecting and replacing AI-generated patterns
          </p>
        </div>

        <Button asChild>
          <Link href="/ai-rules/new">
            <Plus className="size-4" />
            Create Rule
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rules</CardDescription>
            <CardTitle className="text-3xl">{rules.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {activeCount} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Global Rules</CardDescription>
            <CardTitle className="text-3xl">{globalRules.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {globalActiveCount} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Custom Rules</CardDescription>
            <CardTitle className="text-3xl">{customRules.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {customActiveCount} active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 size-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Global Rules</h2>
          <Badge variant="secondary">{filteredGlobalRules.length}</Badge>
        </div>

        {filteredGlobalRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
            <p className="text-muted-foreground">No global rules found</p>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="w-[80px]">Active</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGlobalRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggle}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Your Custom Rules</h2>
          <Badge variant="secondary">{filteredCustomRules.length}</Badge>
        </div>

        {filteredCustomRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
            <p className="text-muted-foreground">No custom rules yet</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/ai-rules/new">Create your first custom rule</Link>
            </Button>
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="w-[80px]">Active</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggle}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  );
}
