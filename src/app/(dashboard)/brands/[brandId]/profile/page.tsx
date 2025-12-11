import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBrand, getBrandProfile } from "@/lib/actions/brands";
import { Button } from "@/components/ui/button";
import { BrandProfileClient } from "./brand-profile-client";

interface BrandProfilePageProps {
  params: Promise<{ brandId: string }>;
}

export default async function BrandProfilePage({ params }: BrandProfilePageProps) {
  const { brandId } = await params;

  const [brandResult, profileResult] = await Promise.all([
    getBrand(brandId),
    getBrandProfile(brandId),
  ]);

  if (brandResult.error || !brandResult.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/brands/${brandId}`}>
              <ArrowLeft className="size-4" />
              Back to {brandResult.data.name}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Brand Profile</h1>
          <p className="text-muted-foreground">
            Define the voice, tone, and style for {brandResult.data.name}
          </p>
        </div>
      </div>

      <BrandProfileClient
        brand={brandResult.data}
        existingProfile={profileResult.data}
      />
    </div>
  );
}
