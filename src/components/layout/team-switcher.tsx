"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, PlusCircle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserTeams } from "@/lib/actions/teams";
import { getProfile, setDefaultTeam } from "@/lib/actions/profile";
import type { Json } from "@/types/database";

// Local Team interface matching what getUserTeams returns
interface Team {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string;
  settings: Json;
  created_at: string | null;
  role: string;
  joined_at: string | null;
}

interface TeamSwitcherProps {
  collapsed?: boolean;
}

function getTeamInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPlanBadgeColor(plan: Team["plan"]): string {
  switch (plan) {
    case "pro":
      return "bg-primary/10 text-primary";
    case "enterprise":
      return "bg-chart-1/10 text-chart-1";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function TeamSwitcher({ collapsed = false }: TeamSwitcherProps) {
  const router = useRouter();
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSwitching, setIsSwitching] = React.useState(false);

  // Load teams and current selection on mount
  React.useEffect(() => {
    async function loadTeams() {
      setIsLoading(true);
      try {
        const [teamsResult, profileResult] = await Promise.all([
          getUserTeams(),
          getProfile(),
        ]);

        if (teamsResult.data) {
          setTeams(teamsResult.data);

          // Find the default team or use first one
          const defaultTeamId = profileResult.data?.default_team_id;
          const defaultTeam = teamsResult.data.find(t => t.id === defaultTeamId);
          setSelectedTeam(defaultTeam || teamsResult.data[0] || null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadTeams();
  }, []);

  const handleTeamSwitch = async (team: Team) => {
    if (team.id === selectedTeam?.id) return;

    setIsSwitching(true);
    try {
      await setDefaultTeam(team.id);
      setSelectedTeam(team);
      router.refresh();
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading || !selectedTeam) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 px-2",
          collapsed && "justify-center px-0"
        )}
        disabled
      >
        <div className="size-8 rounded-md bg-muted animate-pulse" />
        {!collapsed && (
          <div className="flex flex-1 flex-col items-start gap-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-12 bg-muted rounded animate-pulse" />
          </div>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2 px-2",
            collapsed && "justify-center px-0"
          )}
          aria-label="Select team"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Avatar className="size-8 rounded-md">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${selectedTeam.slug}`}
                alt={selectedTeam.name}
              />
              <AvatarFallback className="rounded-md bg-primary/10 text-xs font-medium">
                {getTeamInitials(selectedTeam.name)}
              </AvatarFallback>
            </Avatar>
          )}
          {!collapsed && (
            <>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="truncate text-sm font-medium">
                  {selectedTeam.name}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    getPlanBadgeColor(selectedTeam.plan)
                  )}
                >
                  {selectedTeam.plan}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64"
        align={collapsed ? "center" : "start"}
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Teams
        </DropdownMenuLabel>
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onSelect={() => handleTeamSwitch(team)}
            className="gap-2 p-2"
          >
            <Avatar className="size-6 rounded-md">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${team.slug}`}
                alt={team.name}
              />
              <AvatarFallback className="rounded-md text-[10px]">
                {getTeamInitials(team.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium">{team.name}</span>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider",
                  getPlanBadgeColor(team.plan)
                )}
              >
                {team.plan}
              </span>
            </div>
            {selectedTeam.id === team.id && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 p-2"
          onSelect={() => router.push("/onboarding")}
        >
          <div className="flex size-6 items-center justify-center rounded-md border border-dashed">
            <PlusCircle className="size-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Create new team
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
