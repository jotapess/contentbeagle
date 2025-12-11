"use client";

import * as React from "react";
import Link from "next/link";
import {
  UserPlus,
  Settings,
  MoreHorizontal,
  Crown,
  Shield,
  Pencil,
  Eye,
  UserMinus,
  Loader2,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  getUserTeams,
  getTeam,
  getTeamMembers,
  updateMemberRole,
  removeMember,
} from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type MemberRole = "owner" | "admin" | "editor" | "viewer";

interface TeamMemberWithUser {
  id: string;
  role: MemberRole;
  joined_at: string;
  invited_at: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string;
  settings: unknown;
  created_at: string | null;
  updated_at: string | null;
}

const roleConfig: Record<
  MemberRole,
  { label: string; icon: React.ElementType; className: string }
> = {
  owner: {
    label: "Owner",
    icon: Crown,
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  editor: {
    label: "Editor",
    icon: Pencil,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const planConfig: Record<string, { label: string; className: string }> = {
  free: {
    label: "Free",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  pro: {
    label: "Pro",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  enterprise: {
    label: "Enterprise",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function MemberRow({
  member,
  isCurrentUser,
  canManage,
  onChangeRole,
  onRemove,
}: {
  member: TeamMemberWithUser;
  isCurrentUser: boolean;
  canManage: boolean;
  onChangeRole: (member: TeamMemberWithUser) => void;
  onRemove: (member: TeamMemberWithUser) => void;
}) {
  const roleInfo = roleConfig[member.role];
  const RoleIcon = roleInfo.icon;
  const user = member.user;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage
              src={user?.avatar_url ?? undefined}
              alt={user?.full_name ?? "User"}
            />
            <AvatarFallback>{getInitials(user?.full_name ?? null)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {user?.full_name || user?.email?.split("@")[0] || "Unknown"}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-muted-foreground">(you)</span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("gap-1", roleInfo.className)}>
          <RoleIcon className="size-3" />
          {roleInfo.label}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(member.joined_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {canManage && member.role !== "owner" && !isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onChangeRole(member)}>
                <Shield className="size-4" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemove(member)}
                className="text-red-600 focus:text-red-600"
              >
                <UserMinus className="size-4" />
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = React.useState<TeamMemberWithUser[]>([]);
  const [team, setTeam] = React.useState<Team | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [roleDialogMember, setRoleDialogMember] =
    React.useState<TeamMemberWithUser | null>(null);
  const [removeDialogMember, setRemoveDialogMember] =
    React.useState<TeamMemberWithUser | null>(null);
  const [selectedRole, setSelectedRole] =
    React.useState<MemberRole>("editor");
  const [isSaving, setIsSaving] = React.useState(false);

  // Load team and members
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Get user's teams
      const teamsResult = await getUserTeams();
      if (!teamsResult.data || teamsResult.data.length === 0) {
        setIsLoading(false);
        return;
      }

      // Use the first team (default team)
      const currentTeam = teamsResult.data[0];
      const teamResult = await getTeam(currentTeam.id);
      if (teamResult.data) {
        setTeam(teamResult.data);
      }

      // Get team members
      const membersResult = await getTeamMembers(currentTeam.id);
      if (membersResult.data) {
        setMembers(membersResult.data as unknown as TeamMemberWithUser[]);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  const currentMember = members.find((m) => m.user?.id === user?.id);
  const isOwnerOrAdmin =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  const plan = team ? planConfig[team.plan] || planConfig.free : planConfig.free;

  async function handleRoleChange() {
    if (!roleDialogMember) return;

    setIsSaving(true);
    const result = await updateMemberRole(
      roleDialogMember.id,
      selectedRole as "admin" | "editor" | "viewer"
    );

    if (result.success) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === roleDialogMember.id ? { ...m, role: selectedRole } : m
        )
      );
    }

    setIsSaving(false);
    setRoleDialogMember(null);
  }

  async function handleRemoveMember() {
    if (!removeDialogMember) return;

    setIsSaving(true);
    const result = await removeMember(removeDialogMember.id);

    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.id !== removeDialogMember.id));
    }

    setIsSaving(false);
    setRemoveDialogMember(null);
  }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {team.name}
              </h1>
              <Badge variant="outline" className={cn("text-xs", plan.className)}>
                {plan.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Manage your team members and their roles
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/team/settings">
              <Settings className="size-4" />
              Team Settings
            </Link>
          </Button>
          {isOwnerOrAdmin && (
            <Button asChild>
              <Link href="/team/invite">
                <UserPlus className="size-4" />
                Invite Member
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-3xl">{members.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {members.filter((m) => m.role === "owner" || m.role === "admin")
                .length}{" "}
              with admin access
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Role</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              {currentMember && (
                <>
                  {React.createElement(roleConfig[currentMember.role].icon, {
                    className: "size-6",
                  })}
                  {roleConfig[currentMember.role].label}
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {currentMember?.role === "owner" || currentMember?.role === "admin"
                ? "Full team management access"
                : currentMember?.role === "editor"
                  ? "Can create and edit content"
                  : "View-only access"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plan</CardDescription>
            <CardTitle className="text-3xl capitalize">
              {team.plan}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href="/team/settings">Upgrade plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isCurrentUser={member.user?.id === user?.id}
                  canManage={isOwnerOrAdmin}
                  onChangeRole={(m) => {
                    setSelectedRole(m.role);
                    setRoleDialogMember(m);
                  }}
                  onRemove={setRemoveDialogMember}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!roleDialogMember}
        onOpenChange={(open) => !open && setRoleDialogMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {roleDialogMember?.user?.full_name || roleDialogMember?.user?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as MemberRole)}
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
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Role Permissions:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {selectedRole === "admin" && (
                  <>
                    <li>Manage team members and settings</li>
                    <li>Create and edit all content</li>
                    <li>Access all brands and articles</li>
                  </>
                )}
                {selectedRole === "editor" && (
                  <>
                    <li>Create and edit content</li>
                    <li>Access assigned brands and articles</li>
                    <li>Cannot manage team settings</li>
                  </>
                )}
                {selectedRole === "viewer" && (
                  <>
                    <li>View-only access to content</li>
                    <li>Cannot create or edit</li>
                    <li>Cannot manage team settings</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!removeDialogMember}
        onOpenChange={(open) => !open && setRemoveDialogMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>{removeDialogMember?.user?.full_name || removeDialogMember?.user?.email}</strong> from the
              team? They will lose access to all team resources.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogMember(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
