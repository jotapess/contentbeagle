"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Loader2,
  Mic,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Type,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getBrandById, getBrandProfile } from "@/lib/mock-data";
import type { BrandProfile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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

interface EditableChipsProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  variant?: "default" | "success" | "destructive";
}

function EditableChips({
  items,
  onChange,
  placeholder = "Add item...",
  variant = "default",
}: EditableChipsProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleAdd = () => {
    const value = inputValue.trim();
    if (value && !items.includes(value)) {
      onChange([...items, value]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const variantClasses = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge
            key={index}
            variant="secondary"
            className={cn("gap-1 pr-1", variantClasses[variant])}
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="ml-1 rounded-full p-0.5 hover:bg-black/10"
            >
              <X className="size-3" />
              <span className="sr-only">Remove {item}</span>
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

interface EditableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

function EditableList({ items, onChange, placeholder }: EditableListProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleAdd = () => {
    const value = inputValue.trim();
    if (value && !items.includes(value)) {
      onChange([...items, value]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2"
          >
            <span className="text-sm">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => handleRemove(index)}
            >
              <Trash2 className="size-4 text-muted-foreground" />
              <span className="sr-only">Remove</span>
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

interface ToneSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}

function ToneSlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: ToneSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium">{value}/10</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={1}
        max={10}
        step={1}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export default function BrandProfilePage() {
  const params = useParams();
  const brandId = params.brandId as string;

  const brand = getBrandById(brandId);
  const existingProfile = getBrandProfile(brandId);

  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  const defaultProfile: Omit<BrandProfile, "id" | "brandId" | "createdAt"> = {
    version: 1,
    isActive: true,
    voiceAdjectives: [],
    voiceDescription: "",
    toneFormality: 5,
    toneEnthusiasm: 5,
    toneHumor: 5,
    toneConfidence: 5,
    toneEmpathy: 5,
    sentenceStructure: "mixed",
    vocabularyLevel: "moderate",
    paragraphLength: "medium",
    preferredPov: "second_person",
    keyTerminology: [],
    powerWords: [],
    avoidWords: [],
    brandedPhrases: [],
    coreThemes: [],
    valuePropositions: [],
    painPointsAddressed: [],
    doList: [],
    dontList: [],
    sampleSentences: [],
    confidenceScore: null,
    sourcePagesCount: 0,
  };

  const [profile, setProfile] = React.useState<
    Omit<BrandProfile, "id" | "brandId" | "createdAt">
  >(existingProfile ? { ...existingProfile } : defaultProfile);

  const [newTerm, setNewTerm] = React.useState({ term: "", definition: "", context: "" });
  const [newSample, setNewSample] = React.useState({ original: "", context: "", whyEffective: "" });

  const updateProfile = <K extends keyof typeof profile>(
    key: K,
    value: (typeof profile)[K]
  ) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const addTerminology = () => {
    if (newTerm.term.trim() && newTerm.definition.trim()) {
      updateProfile("keyTerminology", [
        ...profile.keyTerminology,
        { ...newTerm, term: newTerm.term.trim(), definition: newTerm.definition.trim() },
      ]);
      setNewTerm({ term: "", definition: "", context: "" });
    }
  };

  const removeTerminology = (index: number) => {
    updateProfile(
      "keyTerminology",
      profile.keyTerminology.filter((_, i) => i !== index)
    );
  };

  const addSampleSentence = () => {
    if (newSample.original.trim()) {
      updateProfile("sampleSentences", [
        ...profile.sampleSentences,
        { ...newSample, original: newSample.original.trim() },
      ]);
      setNewSample({ original: "", context: "", whyEffective: "" });
    }
  };

  const removeSampleSentence = (index: number) => {
    updateProfile(
      "sampleSentences",
      profile.sampleSentences.filter((_, i) => i !== index)
    );
  };

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Brand not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/brands">Back to Brands</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/brands/${brandId}`}>
              <ArrowLeft className="size-4" />
              Back to {brand.name}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Brand Profile</h1>
          <p className="text-muted-foreground">
            Define the voice, tone, and style for {brand.name}
          </p>
        </div>

        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="size-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="voice" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="voice" className="gap-2">
            <Mic className="size-4" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="tone" className="gap-2">
            <SlidersHorizontal className="size-4" />
            Tone
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-2">
            <Type className="size-4" />
            Style
          </TabsTrigger>
          <TabsTrigger value="terminology" className="gap-2">
            <Sparkles className="size-4" />
            Terminology
          </TabsTrigger>
          <TabsTrigger value="themes" className="gap-2">
            <Target className="size-4" />
            Themes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Characteristics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Voice Adjectives</Label>
                <p className="text-sm text-muted-foreground">
                  Words that describe how your brand sounds
                </p>
                <EditableChips
                  items={profile.voiceAdjectives}
                  onChange={(items) => updateProfile("voiceAdjectives", items)}
                  placeholder="e.g., Professional, Friendly..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voiceDescription">Voice Description</Label>
                <p className="text-sm text-muted-foreground">
                  A detailed description of your brand voice
                </p>
                <Textarea
                  id="voiceDescription"
                  value={profile.voiceDescription || ""}
                  onChange={(e) =>
                    updateProfile("voiceDescription", e.target.value)
                  }
                  placeholder="Describe how your brand communicates with its audience..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Writing Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Check className="size-4" />
                    Do&apos;s
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Guidelines to follow
                  </p>
                  <EditableList
                    items={profile.doList}
                    onChange={(items) => updateProfile("doList", items)}
                    placeholder="Add a guideline..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <X className="size-4" />
                    Don&apos;ts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Things to avoid
                  </p>
                  <EditableList
                    items={profile.dontList}
                    onChange={(items) => updateProfile("dontList", items)}
                    placeholder="Add something to avoid..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample Sentences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.sampleSentences.length > 0 && (
                <div className="space-y-3">
                  {profile.sampleSentences.map((sample, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-muted/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">&quot;{sample.original}&quot;</p>
                          {sample.context && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Context:</span>{" "}
                              {sample.context}
                            </p>
                          )}
                          {sample.whyEffective && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Why it works:</span>{" "}
                              {sample.whyEffective}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeSampleSentence(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="newSample">New Sample Sentence</Label>
                  <Textarea
                    id="newSample"
                    value={newSample.original}
                    onChange={(e) =>
                      setNewSample({ ...newSample, original: e.target.value })
                    }
                    placeholder="Enter a sample sentence..."
                    rows={2}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sampleContext">Context (optional)</Label>
                    <Input
                      id="sampleContext"
                      value={newSample.context}
                      onChange={(e) =>
                        setNewSample({ ...newSample, context: e.target.value })
                      }
                      placeholder="e.g., Homepage hero"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleWhy">Why Effective (optional)</Label>
                    <Input
                      id="sampleWhy"
                      value={newSample.whyEffective}
                      onChange={(e) =>
                        setNewSample({
                          ...newSample,
                          whyEffective: e.target.value,
                        })
                      }
                      placeholder="e.g., Creates urgency"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSampleSentence}
                >
                  <Plus className="size-4" />
                  Add Sample
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tone Scales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <ToneSlider
                label="Formality"
                value={profile.toneFormality}
                onChange={(v) => updateProfile("toneFormality", v)}
                lowLabel="Casual"
                highLabel="Formal"
              />
              <ToneSlider
                label="Enthusiasm"
                value={profile.toneEnthusiasm}
                onChange={(v) => updateProfile("toneEnthusiasm", v)}
                lowLabel="Reserved"
                highLabel="Enthusiastic"
              />
              <ToneSlider
                label="Humor"
                value={profile.toneHumor}
                onChange={(v) => updateProfile("toneHumor", v)}
                lowLabel="Serious"
                highLabel="Playful"
              />
              <ToneSlider
                label="Confidence"
                value={profile.toneConfidence}
                onChange={(v) => updateProfile("toneConfidence", v)}
                lowLabel="Humble"
                highLabel="Confident"
              />
              <ToneSlider
                label="Empathy"
                value={profile.toneEmpathy}
                onChange={(v) => updateProfile("toneEmpathy", v)}
                lowLabel="Neutral"
                highLabel="Empathetic"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Writing Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sentenceStructure">Sentence Structure</Label>
                  <Select
                    value={profile.sentenceStructure}
                    onValueChange={(v) =>
                      updateProfile(
                        "sentenceStructure",
                        v as "short" | "mixed" | "long"
                      )
                    }
                  >
                    <SelectTrigger id="sentenceStructure" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short sentences</SelectItem>
                      <SelectItem value="mixed">Mixed lengths</SelectItem>
                      <SelectItem value="long">Longer sentences</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vocabularyLevel">Vocabulary Level</Label>
                  <Select
                    value={profile.vocabularyLevel}
                    onValueChange={(v) =>
                      updateProfile(
                        "vocabularyLevel",
                        v as "simple" | "moderate" | "advanced" | "technical"
                      )
                    }
                  >
                    <SelectTrigger id="vocabularyLevel" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paragraphLength">Paragraph Length</Label>
                  <Select
                    value={profile.paragraphLength}
                    onValueChange={(v) =>
                      updateProfile(
                        "paragraphLength",
                        v as "short" | "medium" | "long"
                      )
                    }
                  >
                    <SelectTrigger id="paragraphLength" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                      <SelectItem value="medium">Medium (3-4 sentences)</SelectItem>
                      <SelectItem value="long">Long (5+ sentences)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredPov">Point of View</Label>
                  <Select
                    value={profile.preferredPov}
                    onValueChange={(v) =>
                      updateProfile(
                        "preferredPov",
                        v as
                          | "first_person"
                          | "second_person"
                          | "third_person"
                          | "mixed"
                      )
                    }
                  >
                    <SelectTrigger id="preferredPov" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_person">
                        First Person (We/I)
                      </SelectItem>
                      <SelectItem value="second_person">
                        Second Person (You)
                      </SelectItem>
                      <SelectItem value="third_person">
                        Third Person (They)
                      </SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terminology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Terminology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.keyTerminology.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Definition</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.keyTerminology.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.term}</TableCell>
                        <TableCell>{item.definition}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.context || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeTerminology(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="rounded-lg border p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="newTerm">Term</Label>
                    <Input
                      id="newTerm"
                      value={newTerm.term}
                      onChange={(e) =>
                        setNewTerm({ ...newTerm, term: e.target.value })
                      }
                      placeholder="e.g., workflow automation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newDefinition">Definition</Label>
                    <Input
                      id="newDefinition"
                      value={newTerm.definition}
                      onChange={(e) =>
                        setNewTerm({ ...newTerm, definition: e.target.value })
                      }
                      placeholder="What it means"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newContext">Context (optional)</Label>
                    <Input
                      id="newContext"
                      value={newTerm.context}
                      onChange={(e) =>
                        setNewTerm({ ...newTerm, context: e.target.value })
                      }
                      placeholder="When to use"
                    />
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={addTerminology}>
                  <Plus className="size-4" />
                  Add Term
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-400">
                  Power Words
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Words that resonate with your brand
                </p>
                <EditableChips
                  items={profile.powerWords}
                  onChange={(items) => updateProfile("powerWords", items)}
                  placeholder="e.g., streamline, powerful..."
                  variant="success"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">
                  Words to Avoid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Words that don&apos;t fit your brand
                </p>
                <EditableChips
                  items={profile.avoidWords}
                  onChange={(items) => updateProfile("avoidWords", items)}
                  placeholder="e.g., cheap, basic..."
                  variant="destructive"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Core Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Main topics and themes your content focuses on
              </p>
              <EditableChips
                items={profile.coreThemes}
                onChange={(items) => updateProfile("coreThemes", items)}
                placeholder="e.g., Productivity, Innovation..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Value Propositions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Key benefits and value you offer
              </p>
              <EditableList
                items={profile.valuePropositions}
                onChange={(items) => updateProfile("valuePropositions", items)}
                placeholder="e.g., Save 10+ hours per week"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pain Points Addressed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Problems your product/service solves
              </p>
              <EditableList
                items={profile.painPointsAddressed}
                onChange={(items) => updateProfile("painPointsAddressed", items)}
                placeholder="e.g., Manual data entry"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
