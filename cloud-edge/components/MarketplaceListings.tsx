"use client";

import React, { useState, useTransition } from "react";
import { ListingWithProfile } from "@/types/database";
import { GoatCard } from "./GoatCard";
import { seedInitialMarketplaceData } from "@/actions/marketplace";

interface MarketplaceListingsProps {
  initialListings: ListingWithProfile[];
}

export function MarketplaceListings({ initialListings }: MarketplaceListingsProps) {
  const [listings] = useState<ListingWithProfile[]>(initialListings);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBreeds, setSelectedBreeds] = useState<Set<string>>(new Set());
  const [selectedSex, setSelectedSex] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [isPending, startTransition] = useTransition();

  // Extract unique breeds
  const allBreeds = Array.from(
    new Set(
      listings
        .map((l) => l.profile?.Breed)
        .filter((b): b is string => Boolean(b))
    )
  );

  // Extract unique sexes
  const allSexes = Array.from(
    new Set(
      listings
        .map((l) => l.profile?.Sex)
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
    )
  );

  // Filter
  const filteredListings = listings
    .filter((item) => {
      const name = item.profile?.GoatName?.toLowerCase() || "";
      const breed = item.profile?.Breed || "";
      const sex = item.profile?.Sex || "";
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !query || name.includes(query) || breed.toLowerCase().includes(query);
      const matchesBreed =
        selectedBreeds.size === 0 || selectedBreeds.has(breed);
      const matchesSex = selectedSex === "All" || sex === selectedSex;

      return matchesSearch && matchesBreed && matchesSex;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.Price - b.Price;
      if (sortBy === "price-desc") return b.Price - a.Price;
      if (sortBy === "weight-desc")
        return (b.profile?.Weight || 0) - (a.profile?.Weight || 0);
      return 0;
    });

  const toggleBreed = (breed: string) => {
    setSelectedBreeds((prev) => {
      const next = new Set(prev);
      if (next.has(breed)) {
        next.delete(breed);
      } else {
        next.add(breed);
      }
      return next;
    });
  };

  const handleSeed = () => {
    startTransition(async () => {
      const res = await seedInitialMarketplaceData();
      if (res.success && res.count > 0) {
        window.location.reload();
      }
    });
  };

  return (
    <div className="flex gap-8 mt-2">
      {/* ── Left Sidebar Filters ── */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-20 space-y-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </h3>
            <button
              onClick={() => {
                setSelectedBreeds(new Set());
                setSelectedSex("All");
                setSearchQuery("");
              }}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              Clear all
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Search within filters */}
          <div>
            <input
              type="text"
              placeholder="Search goats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Breed Filter */}
          {allBreeds.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
                Breed
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </h4>
              <div className="space-y-2">
                {allBreeds.map((breed) => (
                  <label
                    key={breed}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBreeds.has(breed)}
                      onChange={() => toggleBreed(breed)}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">
                      {breed}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {listings.filter((l) => l.profile?.Breed === breed).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <hr className="border-gray-200" />

          {/* Sex Filter */}
          {allSexes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Sex</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSex("All")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    selectedSex === "All"
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  All
                </button>
                {allSexes.map((sex) => (
                  <button
                    key={sex}
                    onClick={() => setSelectedSex(sex)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selectedSex === sex
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {sex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0">
        {/* Toolbar Row */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-900">
            <strong>{filteredListings.length}</strong>
            <span className="text-gray-500"> verified livestock profiles</span>
          </p>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-medium text-gray-900 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="popular">Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="weight-desc">Heaviest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <GoatCard key={listing.ListingID} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">
              No goats found
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Try adjusting your filters or search query. If this is your first time, seed some sample data below.
            </p>
            <button
              onClick={handleSeed}
              disabled={isPending}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isPending ? "Loading..." : "Load Sample Data"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
