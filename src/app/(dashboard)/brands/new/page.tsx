"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Globe,
  Info,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WizardData {
  name: string;
  websiteUrl: string;
  industry: string;
  description: string;
  crawlUrl: string;
  additionalUrls: string;
}

const industries = [
  "Technology",
  "Health & Wellness",
  "Finance",
  "E-commerce",
  "Education",
  "Marketing",
  "Real Estate",
  "Travel",
  "Food & Beverage",
  "Entertainment",
  "Other",
];

const steps = [
  { id: 1, name: "Basic Info", icon: Building2 },
  { id: 2, name: "URL Discovery", icon: LinkIcon },
  { id: 3, name: "Review", icon: Check },
];

export default function NewBrandPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [data, setData] = React.useState<WizardData>({
    name: "",
    websiteUrl: "",
    industry: "",
    description: "",
    crawlUrl: "",
    additionalUrls: "",
  });

  const updateData = (field: keyof WizardData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.name.trim() !== "" && data.websiteUrl.trim() !== "";
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push("/brands");
  };

  const additionalUrlsList = data.additionalUrls
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url !== "");

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/brands")}
          className="-ml-2 mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Brands
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Brand</h1>
        <p className="text-muted-foreground">
          Set up a new brand profile to generate on-brand content
        </p>
      </div>

      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;

            return (
              <li
                key={step.id}
                className={cn(
                  "relative flex flex-1 items-center",
                  index !== steps.length - 1 && "pr-4"
                )}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 transition-colors",
                      isActive && "border-primary bg-primary text-primary-foreground",
                      isCompleted && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "border-muted-foreground/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-5" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      (isActive || isCompleted) && "text-foreground",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-[calc(50%+20px)] top-5 h-0.5 w-[calc(100%-40px)]",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Basic Information"}
            {currentStep === 2 && "URL Discovery"}
            {currentStep === 3 && "Review & Create"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Brand Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Inc."
                  value={data.name}
                  onChange={(e) => updateData("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">
                  Website URL <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={data.websiteUrl}
                    onChange={(e) => updateData("websiteUrl", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={data.industry}
                  onValueChange={(value) => updateData("industry", value)}
                >
                  <SelectTrigger id="industry" className="w-full">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your brand..."
                  value={data.description}
                  onChange={(e) => updateData("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <div className="flex gap-3">
                  <Info className="size-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">How URL Discovery Works</p>
                    <p className="mt-1">
                      We&apos;ll crawl your website to analyze your existing content
                      and extract your brand voice, tone, and style guidelines.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crawlUrl">Primary URL to Crawl</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="crawlUrl"
                    type="url"
                    placeholder={data.websiteUrl || "https://example.com/blog"}
                    value={data.crawlUrl}
                    onChange={(e) => updateData("crawlUrl", e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use your main website URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalUrls">Additional URLs (Optional)</Label>
                <Textarea
                  id="additionalUrls"
                  placeholder="https://example.com/about&#10;https://example.com/services&#10;https://example.com/blog/sample-post"
                  value={data.additionalUrls}
                  onChange={(e) => updateData("additionalUrls", e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  One URL per line. These pages will be included in the brand
                  analysis.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="font-medium">Brand Details</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="font-medium">{data.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Website</dt>
                    <dd className="font-medium">{data.websiteUrl}</dd>
                  </div>
                  {data.industry && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Industry</dt>
                      <dd className="font-medium">{data.industry}</dd>
                    </div>
                  )}
                  {data.description && (
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Description</dt>
                      <dd className="text-foreground">{data.description}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="font-medium">URLs to Crawl</h3>
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-green-600" />
                    {data.crawlUrl || data.websiteUrl}
                  </li>
                  {additionalUrlsList.map((url, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-4 text-green-600" />
                      {url}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  {1 + additionalUrlsList.length} URL
                  {additionalUrlsList.length > 0 ? "s" : ""} will be crawled
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  After creating this brand, we&apos;ll start crawling the URLs
                  and analyzing your content. This typically takes 2-5 minutes.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Create Brand
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
