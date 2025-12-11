"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Loader2 } from "lucide-react";

import { getBrands, getProfile, getUserTeams, setDefaultTeam } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Brand {
  id: string;
  name: string;
  website_url: string | null;
  industry: string | null;
  status: string;
  description: string | null;
}

export default function BrandsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load brands on mount
  React.useEffect(() => {
    async function loadBrands() {
      let teamId: string | null = null;

      const { data: profile } = await getProfile();
      teamId = profile?.default_team_id || null;

      // If no default team, try to get from user's teams
      if (!teamId) {
        const { data: teams } = await getUserTeams();
        if (teams && teams.length > 0) {
          teamId = teams[0].id;
          await setDefaultTeam(teamId);
        }
      }

      if (!teamId) {
        setIsLoading(false);
        return;
      }

      const { data: brandsData } = await getBrands(teamId);
      if (brandsData) {
        setBrands(brandsData);
      }
      setIsLoading(false);
    }
    loadBrands();
  }, []);

  const filteredBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return brands;

    const query = searchQuery.toLowerCase();
    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(query) ||
        brand.industry?.toLowerCase().includes(query) ||
        brand.website_url?.toLowerCase().includes(query)
    );
  }, [searchQuery, brands]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600",
    crawling: "bg-blue-500/10 text-blue-600",
    ready: "bg-green-500/10 text-green-600",
    error: "bg-red-500/10 text-red-600",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage your brand profiles and voice settings
          </p>
        </div>

        <Button asChild>
          <Link href="/brands/new">
            <Plus className="size-4" />
            Create Brand
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredBrands.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">
            {brands.length === 0 ? "No brands yet" : "No brands found"}
          </p>
          {brands.length === 0 && (
            <Button asChild className="mt-4">
              <Link href="/brands/new">Create your first brand</Link>
            </Button>
          )}
          {searchQuery && brands.length > 0 && (
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => (
            <Link key={brand.id} href={`/brands/${brand.id}`}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{brand.name}</h3>
                      {brand.industry && (
                        <p className="text-sm text-muted-foreground">
                          {brand.industry}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={statusColors[brand.status] || ""}
                    >
                      {brand.status}
                    </Badge>
                  </div>
                  {brand.website_url && (
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {brand.website_url}
                    </p>
                  )}
                  {brand.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {brand.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
