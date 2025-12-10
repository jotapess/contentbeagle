"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { mockBrands, mockArticles } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandCard } from "@/components/features/brands/brand-card";

export default function BrandsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return mockBrands;

    const query = searchQuery.toLowerCase();
    return mockBrands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(query) ||
        brand.industry?.toLowerCase().includes(query) ||
        brand.websiteUrl?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const articleCountByBrand = React.useMemo(() => {
    const counts: Record<string, number> = {};
    mockArticles.forEach((article) => {
      counts[article.brandId] = (counts[article.brandId] || 0) + 1;
    });
    return counts;
  }, []);

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
          <p className="text-muted-foreground">No brands found</p>
          {searchQuery && (
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
            <BrandCard
              key={brand.id}
              brand={brand}
              articleCount={articleCountByBrand[brand.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
