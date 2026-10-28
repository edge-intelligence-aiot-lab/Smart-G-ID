import React, { Suspense } from "react";
import { getAvailableListings } from "@/actions/marketplace";
import { MarketplaceListings } from "@/components/MarketplaceListings";
import { MarketplaceGridSkeleton } from "@/components/SkeletonLoader";

import { Navbar } from "@/components/Navbar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function MarketplaceFeed() {
  const listings = await getAvailableListings();
  return <MarketplaceListings initialListings={listings} />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative h-48 sm:h-60 md:h-72 flex items-center">
            <img
              src="https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1600&q=80"
              alt="Farm pasture"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative z-10 px-6 sm:px-12 max-w-xl text-white">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
                Direct Livestock Contact.<br />Verified Weights & Breeds.
              </h1>
              <p className="text-white/85 text-xs sm:text-sm mt-2 max-w-md">
                Find certified goats directly from local farmers. Call or text farmers directly with zero middlemen or hidden markup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-5 pb-2">
        <nav className="text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-1.5">
          <a href="/" className="hover:text-teal-600">Home</a>
          <span>›</span>
          <span className="text-gray-700 font-medium">Public Livestock Directory</span>
        </nav>
      </div>

      {/* Main Directory: Sidebar Filters + Listings Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        <Suspense fallback={<MarketplaceGridSkeleton />}>
          <MarketplaceFeed />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs sm:text-sm text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">Smart G-ID • Cyber-Physical Livestock Valuation & Directory</p>
          <p>
            This site is a 100% public livestock listing directory. All transactions and logistics are arranged directly between buyers and farmers.
          </p>
        </div>
      </footer>
    </div>
  );
}
