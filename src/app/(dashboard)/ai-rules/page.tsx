import { redirect } from "next/navigation";
import { getCombinedRulesForDisplay } from "@/lib/actions/ai-rules";
import { getProfile } from "@/lib/actions/profile";
import { AIRulesClient } from "./ai-rules-client";

export default async function AIRulesPage() {
  const { data: profile } = await getProfile();
  const teamId = profile?.default_team_id;

  if (!teamId) {
    redirect("/onboarding");
  }

  const { data: rules, error } = await getCombinedRulesForDisplay(teamId);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Error loading AI rules: {error}</p>
      </div>
    );
  }

  return <AIRulesClient rules={rules || []} teamId={teamId} />;
}
