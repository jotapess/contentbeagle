"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Send,
  Clock,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";

import type { TeamMember } from "@/types";
import { currentTeam } from "@/lib/mock-data";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PendingInvite {
  id: string;
  email: string;
  role: TeamMember["role"];
  sentAt: string;
  expiresAt: string;
}

const mockPendingInvites: PendingInvite[] = [
  {
    id: "invite-1",
    email: "sarah@example.com",
    role: "editor",
    sentAt: "2024-03-08T10:00:00Z",
    expiresAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "invite-2",
    email: "david@example.com",
    role: "viewer",
    sentAt: "2024-03-10T14:00:00Z",
    expiresAt: "2024-03-17T14:00:00Z",
  },
];

const roleDescriptions: Record<TeamMember["role"], string> = {
  owner: "Full control over the team",
  admin: "Can manage team members and all content",
  editor: "Can create and edit content",
  viewer: "Can only view content",
};

export default function InviteMemberPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<TeamMember["role"]>("editor");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [inviteSent, setInviteSent] = React.useState(false);
  const [pendingInvites, setPendingInvites] =
    React.useState<PendingInvite[]>(mockPendingInvites);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newInvite: PendingInvite = {
      id: `invite-${Date.now()}`,
      email,
      role,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    setPendingInvites((prev) => [newInvite, ...prev]);
    setIsSubmitting(false);
    setInviteSent(true);

    setTimeout(() => {
      setInviteSent(false);
      setEmail("");
    }, 3000);
  }

  async function handleResendInvite(inviteId: string) {
    const invite = pendingInvites.find((i) => i.id === inviteId);
    if (!invite) return;

    setPendingInvites((prev) =>
      prev.map((i) =>
        i.id === inviteId
          ? {
              ...i,
              sentAt: new Date().toISOString(),
              expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
            }
          : i
      )
    );
  }

  function handleCancelInvite(inviteId: string) {
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
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
          <h1 className="text-2xl font-bold tracking-tight">Invite Member</h1>
          <p className="text-muted-foreground">
            Invite someone to join {currentTeam.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Invitation</CardTitle>
            <CardDescription>
              Enter the email address of the person you want to invite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as TeamMember["role"])}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[role]}
                </p>
              </div>

              {inviteSent ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-950/50 dark:text-green-400">
                  <CheckCircle className="size-4" />
                  <span className="text-sm font-medium">
                    Invitation sent successfully!
                  </span>
                </div>
              ) : (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isValidEmail || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations waiting to be accepted
                </CardDescription>
              </div>
              <Badge variant="secondary">{pendingInvites.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingInvites.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                <Mail className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No pending invitations
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInvites.map((invite) => {
                  const expiresIn = Math.ceil(
                    (new Date(invite.expiresAt).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{invite.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {invite.role}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            Expires in {expiresIn} day{expiresIn !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(invite.id)}
                        >
                          Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-red-600"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <X className="size-4" />
                          <span className="sr-only">Cancel invitation</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">Role Permissions</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Admin</p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    <li>Manage team members</li>
                    <li>Access team settings</li>
                    <li>Create and edit all content</li>
                    <li>Manage API keys</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Editor</p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    <li>Create and edit content</li>
                    <li>Manage assigned brands</li>
                    <li>Generate articles</li>
                    <li>View usage analytics</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Viewer</p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    <li>View all content</li>
                    <li>Export articles</li>
                    <li>View analytics</li>
                    <li>No editing access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
