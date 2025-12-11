import { redirect } from "next/navigation";
import { getArticles } from "@/lib/actions/articles";
import { getProfile, setDefaultTeam } from "@/lib/actions/profile";
import { getUserTeams } from "@/lib/actions/teams";
import { ArticlesListClient } from "./articles-list-client";

export default async function ArticlesPage() {
  // Get user's team
  const { data: profile } = await getProfile();
  let teamId = profile?.default_team_id;

  // Fallback: get first team if no default set
  if (!teamId) {
    const { data: teams } = await getUserTeams();
    if (teams?.length) {
      teamId = teams[0].id;
      await setDefaultTeam(teamId);
    }
  }

  if (!teamId) {
    redirect("/onboarding");
  }

  // Fetch articles for the team
  const { data: articles, error } = await getArticles(teamId);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-destructive">Error loading articles: {error}</p>
      </div>
    );
  }

  return <ArticlesListClient articles={articles || []} />;
}
