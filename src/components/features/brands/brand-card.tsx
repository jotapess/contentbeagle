"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, FileText, Globe } from "lucide-react";

import type { Brand } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrandCardProps {
  brand: Brand;
  articleCount?: number;
}

const statusConfig: Record<
  Brand["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  crawling: {
    label: "Crawling",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  analyzing: {
    label: "Analyzing",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  ready: {
    label: "Ready",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function BrandCard({ brand, articleCount = 0 }: BrandCardProps) {
  const status = statusConfig[brand.status];

  return (
    <Link href={`/brands/${brand.id}`} className="group block">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="pt-0">
          <div className="flex items-start gap-4">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={`${brand.name} logo`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Building2 className="size-6 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold group-hover:text-primary">
                  {brand.name}
                </h3>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 text-xs", status.className)}
                >
                  {status.label}
                </Badge>
              </div>

              {brand.websiteUrl && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Globe className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {brand.websiteUrl.replace(/^https?:\/\//, "")}
                  </span>
                </div>
              )}

              {brand.industry && (
                <Badge variant="secondary" className="mt-2 text-xs font-normal">
                  {brand.industry}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="size-4" />
            <span>
              {articleCount} {articleCount === 1 ? "article" : "articles"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
