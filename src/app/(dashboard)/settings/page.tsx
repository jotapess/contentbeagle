"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Key,
  Camera,
  Loader2,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  getUserTeams,
  getProfile,
  updateProfile,
  setDefaultTeam,
} from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

interface Team {
  id: string;
  name: string;
  slug: string;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [defaultTeamId, setDefaultTeamId] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [createdAt, setCreatedAt] = React.useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);
  const [profileSaved, setProfileSaved] = React.useState(false);
  const [passwordSaved, setPasswordSaved] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState("");

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Load teams
      const teamsResult = await getUserTeams();
      if (teamsResult.data) {
        setTeams(teamsResult.data);
      }

      // Load profile
      const profileResult = await getProfile();
      if (profileResult.data) {
        setFullName(profileResult.data.full_name || "");
        setAvatarUrl(profileResult.data.avatar_url || "");
        setDefaultTeamId(profileResult.data.default_team_id || "");
        setCreatedAt(profileResult.data.created_at);
      }

      // Set email from auth user
      if (user) {
        setEmail(user.email || "");
        // Also check user metadata for name if not in profile
        if (!profileResult.data?.full_name && user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
        if (!profileResult.data?.avatar_url && user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }
      }

      setIsLoading(false);
    }

    if (user) {
      loadData();
    }
  }, [user]);

  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;
  const canSavePassword =
    currentPassword && newPassword && confirmPassword && passwordsMatch;

  async function handleSaveProfile() {
    setIsSavingProfile(true);

    // Update profile in database
    const result = await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
    });

    // Update default team if changed
    if (defaultTeamId) {
      await setDefaultTeam(defaultTeamId);
    }

    // Also update user metadata in Supabase Auth
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
      },
    });

    setIsSavingProfile(false);
    if (!result.error) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  }

  async function handleSavePassword() {
    if (!canSavePassword) return;

    setIsSavingPassword(true);
    setPasswordError("");

    const supabase = createClient();

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError("Current password is incorrect");
      setIsSavingPassword(false);
      return;
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSavingPassword(false);

    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }

    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
  }

  function handleAvatarChange() {
    const newSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="size-20">
                    <AvatarImage src={avatarUrl} alt={fullName} />
                    <AvatarFallback className="text-lg">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -bottom-1 -right-1 size-8 rounded-full"
                    onClick={handleAvatarChange}
                  >
                    <Camera className="size-4" />
                    <span className="sr-only">Change avatar</span>
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{fullName || "Your Name"}</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={handleAvatarChange}
                  >
                    Change avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-team">Default Team</Label>
                <Select value={defaultTeamId} onValueChange={setDefaultTeamId}>
                  <SelectTrigger id="default-team">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This team will be selected by default when you log in
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                {profileSaved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="size-4" />
                    Saved
                  </span>
                )}
                <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                  {isSavingProfile ? (
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
                <Key className="size-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    <span className="sr-only">
                      {showCurrentPassword ? "Hide" : "Show"} password
                    </span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                      <span className="sr-only">
                        {showNewPassword ? "Hide" : "Show"} password
                      </span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword ? "Hide" : "Show"} password
                      </span>
                    </Button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-600">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}

              <div className="flex items-center justify-end gap-2">
                {passwordSaved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="size-4" />
                    Password updated
                  </span>
                )}
                <Button
                  onClick={handleSavePassword}
                  disabled={!canSavePassword || isSavingPassword}
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member since</p>
                <p className="font-medium">
                  {createdAt
                    ? new Date(createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Unknown"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Teams</p>
                <p className="font-medium">{teams.length}</p>
              </div>

              <Separator />

              <Button variant="outline" className="w-full" asChild>
                <a href="/settings/api-keys">Manage API Keys</a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="/settings/usage">View Usage</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/team">Team Settings</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/ai-rules">AI Rules</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="#">Help & Support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
