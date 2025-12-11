"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Calendar,
  Loader2,
  AlertTriangle,
  LogOut,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  getUserTeams,
  getTeam,
  getTeamMembers,
  updateTeam,
  deleteTeam,
  removeMember,
} from "@/lib/actions";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Team {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string;
  created_at: string | null;
}

const planFeatures: Record<
  string,
  { name: string; price: string; features: string[] }
> = {
  free: {
    name: "Free",
    price: "$0/month",
    features: [
      "1 team member",
      "2 brands",
      "10 articles/month",
      "Basic AI rules",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    price: "$49/month",
    features: [
      "5 team members",
      "10 brands",
      "100 articles/month",
      "Custom AI rules",
      "Priority support",
      "API access",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited team members",
      "Unlimited brands",
      "Unlimited articles",
      "Advanced AI rules",
      "Dedicated support",
      "Custom integrations",
      "SSO/SAML",
    ],
  },
};

export default function TeamSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = React.useState<Team | null>(null);
  const [teamName, setTeamName] = React.useState("");
  const [originalName, setOriginalName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [currentMemberId, setCurrentMemberId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      const teamsResult = await getUserTeams();
      if (!teamsResult.data || teamsResult.data.length === 0) {
        setIsLoading(false);
        return;
      }

      const currentTeam = teamsResult.data[0];
      const teamResult = await getTeam(currentTeam.id);
      if (teamResult.data) {
        setTeam(teamResult.data);
        setTeamName(teamResult.data.name);
        setOriginalName(teamResult.data.name);
        setIsOwner(teamResult.data.owner_id === user?.id);
      }

      // Get current member ID for leave team functionality
      const membersResult = await getTeamMembers(currentTeam.id);
      if (membersResult.data) {
        const members = membersResult.data as unknown as Array<{
          id: string;
          user: { id: string } | null;
        }>;
        const currentMember = members.find(
          (m) => m.user?.id === user?.id
        );
        if (currentMember) {
          setCurrentMemberId(currentMember.id);
        }
      }

      setIsLoading(false);
    }

    if (user) {
      loadData();
    }
  }, [user]);

  const currentPlan = team ? planFeatures[team.plan] || planFeatures.free : planFeatures.free;

  async function handleSaveChanges() {
    if (!team) return;

    setIsSaving(true);
    const result = await updateTeam(team.id, { name: teamName });

    if (result.data) {
      setOriginalName(teamName);
      setTeam({ ...team, name: teamName });
    }

    setIsSaving(false);
  }

  async function handleLeaveTeam() {
    if (!currentMemberId) return;

    setIsLeaving(true);
    const result = await removeMember(currentMemberId);

    if (result.success) {
      router.push("/onboarding");
    }

    setIsLeaving(false);
  }

  async function handleDeleteTeam() {
    if (!team) return;

    setIsDeleting(true);
    const result = await deleteTeam(team.id);

    if (result.success) {
      router.push("/onboarding");
    }

    setIsDeleting(false);
  }

  const canDelete = team && deleteConfirmation.toLowerCase() === team.name.toLowerCase();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No team found</p>
        <Button asChild>
          <Link href="/onboarding">Create a Team</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/team">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Team</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Settings</h1>
          <p className="text-muted-foreground">
            Manage your team&apos;s settings and subscription
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5" />
                Team Information
              </CardTitle>
              <CardDescription>
                Basic information about your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-slug">Team Slug</Label>
                <Input
                  id="team-slug"
                  value={team.slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs. Contact support to change.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Created</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  {team.created_at
                    ? new Date(team.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving || teamName === originalName}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Subscription
              </CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{currentPlan.name}</span>
                    <Badge variant="secondary">{currentPlan.price}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your current plan
                  </p>
                </div>
                {team.plan !== "enterprise" && (
                  <Button>
                    <Sparkles className="size-4" />
                    Upgrade
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Plan Features:</p>
                <ul className="space-y-1">
                  {currentPlan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="size-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {team.plan !== "free" && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Next billing date
                    </span>
                    <span className="font-medium">January 15, 2025</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Manage Billing
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="size-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isOwner && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Leave Team</p>
                    <p className="text-sm text-muted-foreground">
                      Remove yourself from this team
                    </p>
                  </div>
                  <Dialog
                    open={showLeaveDialog}
                    onOpenChange={setShowLeaveDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <LogOut className="size-4" />
                        Leave Team
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Leave Team</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to leave {team.name}? You
                          will lose access to all team resources.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowLeaveDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleLeaveTeam}
                          disabled={isLeaving}
                        >
                          {isLeaving ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Leaving...
                            </>
                          ) : (
                            "Leave Team"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {isOwner && (
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
                  <div>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      Delete Team
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this team and all its data
                    </p>
                  </div>
                  <Dialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="size-4" />
                        Delete Team
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Team</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently
                          delete the team, all brands, articles, and remove all
                          team members.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
                          <p className="font-medium">
                            This will delete:
                          </p>
                          <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>All brands and brand profiles</li>
                            <li>All articles and content</li>
                            <li>All custom AI rules</li>
                            <li>Team member access</li>
                            <li>Usage history and analytics</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm">
                            Type <strong>{team.name}</strong> to confirm
                          </Label>
                          <Input
                            id="confirm"
                            value={deleteConfirmation}
                            onChange={(e) =>
                              setDeleteConfirmation(e.target.value)
                            }
                            placeholder={team.name}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteDialog(false);
                            setDeleteConfirmation("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteTeam}
                          disabled={!canDelete || isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete Team"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>
                Get more features with a higher plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(planFeatures).map(([key, plan]) => {
                const isCurrent = key === team.plan;
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border p-4 transition-colors",
                      isCurrent
                        ? "border-primary bg-primary/5"
                        : "hover:border-muted-foreground/25"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.price}
                        </p>
                      </div>
                      {isCurrent ? (
                        <Badge>Current</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant={key === "enterprise" ? "outline" : "default"}
                        >
                          {key === "enterprise" ? "Contact Sales" : "Upgrade"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Get support for your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
              <Button variant="outline" className="w-full">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
