"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import type { APIProvider, UserAPIKey } from "@/types";
import { mockAPIKeys } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface ProviderConfig {
  id: APIProvider;
  name: string;
  description: string;
  icon: string;
  docsUrl: string;
  keyPrefix?: string;
}

const providers: ProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o for content generation and analysis",
    icon: "O",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude for advanced content writing",
    icon: "A",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPrefix: "sk-ant-",
  },
  {
    id: "google",
    name: "Google AI",
    description: "Gemini for research and analysis",
    icon: "G",
    docsUrl: "https://aistudio.google.com/app/apikey",
    keyPrefix: "AIza",
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    description: "Web scraping for brand analysis",
    icon: "F",
    docsUrl: "https://firecrawl.dev/dashboard",
    keyPrefix: "fc-",
  },
  {
    id: "dataforseo",
    name: "DataForSEO",
    description: "SEO data and keyword research",
    icon: "D",
    docsUrl: "https://app.dataforseo.com/api-access",
  },
];

function maskApiKey(key: string, prefix?: string): string {
  if (prefix && key.startsWith(prefix)) {
    return `${prefix}...${key.slice(-4)}`;
  }
  return `...${key.slice(-4)}`;
}

function ProviderCard({
  provider,
  apiKey,
  onAddKey,
  onRemoveKey,
}: {
  provider: ProviderConfig;
  apiKey: UserAPIKey | undefined;
  onAddKey: (provider: ProviderConfig) => void;
  onRemoveKey: (apiKey: UserAPIKey) => void;
}) {
  const isConnected = !!apiKey && apiKey.isActive;
  const hasError = apiKey?.lastError;

  return (
    <Card
      className={cn(
        "transition-colors",
        isConnected
          ? "border-green-200 dark:border-green-900"
          : hasError
            ? "border-red-200 dark:border-red-900"
            : ""
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg text-lg font-bold",
                isConnected
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {provider.icon}
            </div>
            <div>
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <CardDescription className="text-xs">
                {provider.description}
              </CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-400">
              <Check className="size-3" />
              Connected
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className={cn(hasError && "bg-red-100 text-red-700")}
            >
              {hasError ? "Error" : "Not connected"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiKey && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted p-2">
              <code className="text-sm">
                {maskApiKey(
                  `${provider.keyPrefix || ""}mock-key`,
                  provider.keyPrefix
                )}
              </code>
              {apiKey.lastUsedAt && (
                <span className="text-xs text-muted-foreground">
                  Last used:{" "}
                  {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {hasError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {apiKey.lastError}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onAddKey(provider)}
              >
                <RefreshCw className="size-4" />
                Update Key
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-100 hover:text-red-700"
                onClick={() => onRemoveKey(apiKey)}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAddKey(provider)}
              >
                <Plus className="size-4" />
                Add Key
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                  Get Key
                </a>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = React.useState<UserAPIKey[]>(mockAPIKeys);
  const [dialogProvider, setDialogProvider] =
    React.useState<ProviderConfig | null>(null);
  const [keyInput, setKeyInput] = React.useState("");
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<
    "success" | "error" | null
  >(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [removeKey, setRemoveKey] = React.useState<UserAPIKey | null>(null);
  const [isRemoving, setIsRemoving] = React.useState(false);

  function getApiKeyForProvider(providerId: APIProvider): UserAPIKey | undefined {
    return apiKeys.find((k) => k.providerId === providerId);
  }

  async function handleTestConnection() {
    if (!keyInput.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const isValid = keyInput.length > 10;
    setTestResult(isValid ? "success" : "error");
    setIsTesting(false);
  }

  async function handleSaveKey() {
    if (!dialogProvider || !keyInput.trim()) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const existingIndex = apiKeys.findIndex(
      (k) => k.providerId === dialogProvider.id
    );

    if (existingIndex >= 0) {
      setApiKeys((prev) =>
        prev.map((k, i) =>
          i === existingIndex
            ? { ...k, isActive: true, lastError: null, lastUsedAt: null }
            : k
        )
      );
    } else {
      const newKey: UserAPIKey = {
        id: `key-${Date.now()}`,
        teamId: "team-1",
        providerId: dialogProvider.id,
        config: {},
        isActive: true,
        lastUsedAt: null,
        lastError: null,
        createdAt: new Date().toISOString(),
      };
      setApiKeys((prev) => [...prev, newKey]);
    }

    setIsSaving(false);
    setDialogProvider(null);
    setKeyInput("");
    setTestResult(null);
  }

  async function handleRemoveKey() {
    if (!removeKey) return;

    setIsRemoving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setApiKeys((prev) => prev.filter((k) => k.id !== removeKey.id));
    setIsRemoving(false);
    setRemoveKey(null);
  }

  const connectedCount = apiKeys.filter((k) => k.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Settings</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for AI providers and services
          </p>
        </div>
      </div>

      <Alert>
        <Key className="size-4" />
        <AlertTitle>Your API keys are encrypted</AlertTitle>
        <AlertDescription>
          All API keys are encrypted at rest and never exposed in the UI. Only
          the last 4 characters are shown for identification.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
        <div className="flex-1">
          <p className="font-medium">
            {connectedCount} of {providers.length} providers connected
          </p>
          <p className="text-sm text-muted-foreground">
            Connect providers to enable AI features
          </p>
        </div>
        <div className="flex gap-1">
          {providers.map((p) => {
            const isConnected = apiKeys.some(
              (k) => k.providerId === p.id && k.isActive
            );
            return (
              <div
                key={p.id}
                className={cn(
                  "size-3 rounded-full",
                  isConnected ? "bg-green-500" : "bg-gray-300"
                )}
                title={`${p.name}: ${isConnected ? "Connected" : "Not connected"}`}
              />
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            apiKey={getApiKeyForProvider(provider.id)}
            onAddKey={setDialogProvider}
            onRemoveKey={setRemoveKey}
          />
        ))}
      </div>

      <Dialog
        open={!!dialogProvider}
        onOpenChange={(open) => {
          if (!open) {
            setDialogProvider(null);
            setKeyInput("");
            setTestResult(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {getApiKeyForProvider(dialogProvider?.id as APIProvider)
                ? "Update"
                : "Add"}{" "}
              {dialogProvider?.name} API Key
            </DialogTitle>
            <DialogDescription>
              Enter your {dialogProvider?.name} API key to enable integration.
              <a
                href={dialogProvider?.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                Get your key
              </a>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder={
                  dialogProvider?.keyPrefix
                    ? `${dialogProvider.keyPrefix}...`
                    : "Enter your API key"
                }
              />
            </div>

            {testResult === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-950/50 dark:text-green-400">
                <Check className="size-4" />
                <span className="text-sm font-medium">
                  Connection successful!
                </span>
              </div>
            )}

            {testResult === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                <X className="size-4" />
                <span className="text-sm font-medium">
                  Connection failed. Please check your API key.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!keyInput.trim() || isTesting}
              className="sm:mr-auto"
            >
              {isTesting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDialogProvider(null);
                setKeyInput("");
                setTestResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveKey}
              disabled={!keyInput.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeKey} onOpenChange={(open) => !open && setRemoveKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this{" "}
              {providers.find((p) => p.id === removeKey?.providerId)?.name} API
              key? Features using this provider will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveKey(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveKey}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
