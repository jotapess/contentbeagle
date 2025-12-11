"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Construction,
} from "lucide-react";

import { getUserTeams } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InviteMemberPage() {
  const [teamName, setTeamName] = React.useState<string>("your team");

  React.useEffect(() => {
    async function loadTeam() {
      const result = await getUserTeams();
      if (result.data && result.data.length > 0) {
        setTeamName(result.data[0].name);
      }
    }
    loadTeam();
  }, []);

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
            Invite someone to join {teamName}
          </p>
        </div>
      </div>

      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Construction className="size-6" />
            </div>
            <div>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                Team invitations will be available in a future update
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The team invitation system is currently being built. This feature will allow you to:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="size-4" />
              Send email invitations to team members
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" />
              Set roles and permissions during invite
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" />
              Track pending invitations
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" />
              Resend or cancel invitations
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            In the meantime, please contact your team administrator to manually add members.
          </p>
        </CardContent>
      </Card>

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
