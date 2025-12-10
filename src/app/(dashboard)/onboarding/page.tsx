"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Building2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createTeam, getUserTeams } from "@/lib/actions";

export default function OnboardingPage() {
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingTeams, setIsCheckingTeams] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Check if user already has teams
  useEffect(() => {
    const checkTeams = async () => {
      const { data: teams } = await getUserTeams();
      if (teams && teams.length > 0) {
        // User already has a team, redirect to brands
        router.push("/brands");
      } else {
        setIsCheckingTeams(false);
      }
    };
    checkTeams();
  }, [router]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setIsLoading(true);

    const { data, error } = await createTeam({
      name: teamName.trim(),
      slug: generateSlug(teamName.trim()),
    });

    if (error) {
      setError(error);
      setIsLoading(false);
      return;
    }

    // Redirect to brands page
    router.push("/brands");
  };

  if (isCheckingTeams) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to ContentBeagle</CardTitle>
          <CardDescription>
            Let&apos;s set up your workspace to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team or Company Name</Label>
              <Input
                id="teamName"
                placeholder="Acme Inc."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This will be your workspace name. You can invite team members later.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating workspace...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-2 size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
