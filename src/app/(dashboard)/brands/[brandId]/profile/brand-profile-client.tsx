"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
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
import type { Brand, BrandProfile } from "@/lib/actions/brands";
import { updateBrandProfile } from "@/lib/actions/brands";
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
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
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
              size="sm"
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
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
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

function ToneSlider({ label, value, onChange, lowLabel, highLabel }: ToneSliderProps) {
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

interface ProfileState {
  voice_adjectives: string[];
  voice_description: string;
  tone_formality: number;
  tone_enthusiasm: number;
  tone_humor: number;
  sentence_structure: string;
  vocabulary_level: string;
  paragraph_length: string;
  preferred_pov: string;
  vocabulary: Record<string, string>[];
  power_words: string[];
  avoid_words: string[];
  do_list: string[];
  dont_list: string[];
  sample_sentences: Record<string, string>[];
}

interface BrandProfileClientProps {
  brand: Brand;
  existingProfile: BrandProfile | null;
}

export function BrandProfileClient({ brand, existingProfile }: BrandProfileClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  const defaultProfile: ProfileState = {
    voice_adjectives: [],
    voice_description: "",
    tone_formality: 5,
    tone_enthusiasm: 5,
    tone_humor: 5,
    sentence_structure: "mixed",
    vocabulary_level: "moderate",
    paragraph_length: "medium",
    preferred_pov: "second_person",
    vocabulary: [],
    power_words: [],
    avoid_words: [],
    do_list: [],
    dont_list: [],
    sample_sentences: [],
  };

  const [profile, setProfile] = React.useState<ProfileState>(() => {
    if (existingProfile) {
      return {
        voice_adjectives: existingProfile.voice_adjectives || [],
        voice_description: existingProfile.voice_description || "",
        tone_formality: existingProfile.tone_formality || 5,
        tone_enthusiasm: existingProfile.tone_enthusiasm || 5,
        tone_humor: existingProfile.tone_humor || 5,
        sentence_structure: existingProfile.sentence_structure || "mixed",
        vocabulary_level: existingProfile.vocabulary_level || "moderate",
        paragraph_length: existingProfile.paragraph_length || "medium",
        preferred_pov: existingProfile.preferred_pov || "second_person",
        vocabulary: (existingProfile.key_terminology as Record<string, string>[] | null) || [],
        power_words: existingProfile.power_words || [],
        avoid_words: existingProfile.avoid_words || [],
        do_list: existingProfile.do_list || [],
        dont_list: existingProfile.dont_list || [],
        sample_sentences: (existingProfile.sample_sentences as Record<string, string>[] | null) || [],
      };
    }
    return defaultProfile;
  });

  const [newTerm, setNewTerm] = React.useState({ term: "", definition: "", context: "" });
  const [newSample, setNewSample] = React.useState({ original: "", context: "", whyEffective: "" });

  const updateProfile = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateBrandProfile(brand.id, profile);
    setIsSaving(false);

    if (!error) {
      setHasChanges(false);
      router.refresh();
    }
  };

  const addTerminology = () => {
    if (newTerm.term.trim() && newTerm.definition.trim()) {
      updateProfile("vocabulary", [
        ...profile.vocabulary,
        { term: newTerm.term.trim(), definition: newTerm.definition.trim(), context: newTerm.context },
      ]);
      setNewTerm({ term: "", definition: "", context: "" });
    }
  };

  const removeTerminology = (index: number) => {
    updateProfile("vocabulary", profile.vocabulary.filter((_, i) => i !== index));
  };

  const addSampleSentence = () => {
    if (newSample.original.trim()) {
      updateProfile("sample_sentences", [
        ...profile.sample_sentences,
        { original: newSample.original.trim(), context: newSample.context, whyEffective: newSample.whyEffective },
      ]);
      setNewSample({ original: "", context: "", whyEffective: "" });
    }
  };

  const removeSampleSentence = (index: number) => {
    updateProfile("sample_sentences", profile.sample_sentences.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="flex justify-end">
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
                  items={profile.voice_adjectives}
                  onChange={(items) => updateProfile("voice_adjectives", items)}
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
                  value={profile.voice_description}
                  onChange={(e) => updateProfile("voice_description", e.target.value)}
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
                  <p className="text-sm text-muted-foreground">Guidelines to follow</p>
                  <EditableList
                    items={profile.do_list}
                    onChange={(items) => updateProfile("do_list", items)}
                    placeholder="Add a guideline..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <X className="size-4" />
                    Don&apos;ts
                  </Label>
                  <p className="text-sm text-muted-foreground">Things to avoid</p>
                  <EditableList
                    items={profile.dont_list}
                    onChange={(items) => updateProfile("dont_list", items)}
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
              {profile.sample_sentences.length > 0 && (
                <div className="space-y-3">
                  {profile.sample_sentences.map((sample, index) => (
                    <div key={index} className="rounded-lg border bg-muted/50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">&quot;{sample.original}&quot;</p>
                          {sample.context && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Context:</span> {sample.context}
                            </p>
                          )}
                          {sample.whyEffective && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Why it works:</span> {sample.whyEffective}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeSampleSentence(index)}>
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
                    onChange={(e) => setNewSample({ ...newSample, original: e.target.value })}
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
                      onChange={(e) => setNewSample({ ...newSample, context: e.target.value })}
                      placeholder="e.g., Homepage hero"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleWhy">Why Effective (optional)</Label>
                    <Input
                      id="sampleWhy"
                      value={newSample.whyEffective}
                      onChange={(e) => setNewSample({ ...newSample, whyEffective: e.target.value })}
                      placeholder="e.g., Creates urgency"
                    />
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={addSampleSentence}>
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
                value={profile.tone_formality}
                onChange={(v) => updateProfile("tone_formality", v)}
                lowLabel="Casual"
                highLabel="Formal"
              />
              <ToneSlider
                label="Enthusiasm"
                value={profile.tone_enthusiasm}
                onChange={(v) => updateProfile("tone_enthusiasm", v)}
                lowLabel="Reserved"
                highLabel="Enthusiastic"
              />
              <ToneSlider
                label="Humor"
                value={profile.tone_humor}
                onChange={(v) => updateProfile("tone_humor", v)}
                lowLabel="Serious"
                highLabel="Playful"
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
                    value={profile.sentence_structure}
                    onValueChange={(v) => updateProfile("sentence_structure", v)}
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
                    value={profile.vocabulary_level}
                    onValueChange={(v) => updateProfile("vocabulary_level", v)}
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
                    value={profile.paragraph_length}
                    onValueChange={(v) => updateProfile("paragraph_length", v)}
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
                    value={profile.preferred_pov}
                    onValueChange={(v) => updateProfile("preferred_pov", v)}
                  >
                    <SelectTrigger id="preferredPov" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_person">First Person (We/I)</SelectItem>
                      <SelectItem value="second_person">Second Person (You)</SelectItem>
                      <SelectItem value="third_person">Third Person (They)</SelectItem>
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
              {profile.vocabulary.length > 0 && (
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
                    {profile.vocabulary.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.term}</TableCell>
                        <TableCell>{item.definition}</TableCell>
                        <TableCell className="text-muted-foreground">{item.context || "-"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeTerminology(index)}>
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
                      onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                      placeholder="e.g., workflow automation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newDefinition">Definition</Label>
                    <Input
                      id="newDefinition"
                      value={newTerm.definition}
                      onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                      placeholder="What it means"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newContext">Context (optional)</Label>
                    <Input
                      id="newContext"
                      value={newTerm.context}
                      onChange={(e) => setNewTerm({ ...newTerm, context: e.target.value })}
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
                <CardTitle className="text-green-700 dark:text-green-400">Power Words</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">Words that resonate with your brand</p>
                <EditableChips
                  items={profile.power_words}
                  onChange={(items) => updateProfile("power_words", items)}
                  placeholder="e.g., streamline, powerful..."
                  variant="success"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">Words to Avoid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">Words that don&apos;t fit your brand</p>
                <EditableChips
                  items={profile.avoid_words}
                  onChange={(items) => updateProfile("avoid_words", items)}
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
              <CardTitle>Power Words</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Key words that capture your brand essence
              </p>
              <EditableChips
                items={profile.power_words}
                onChange={(items) => updateProfile("power_words", items)}
                placeholder="e.g., Productivity, Innovation..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
