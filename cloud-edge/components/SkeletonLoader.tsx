import React from "react";

export function GoatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse flex flex-col justify-between">
      <div>
        {/* Image */}
        <div className="aspect-[4/3] bg-gray-200" />
        {/* Content */}
        <div className="p-4 space-y-2.5">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="flex gap-1.5">
            <div className="h-5 bg-gray-100 rounded w-14" />
            <div className="h-5 bg-gray-100 rounded w-10" />
          </div>
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-24" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="h-9 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="hidden lg:block w-60 shrink-0 animate-pulse space-y-6">
      <div className="h-5 bg-gray-200 rounded w-16" />
      <hr className="border-gray-200" />
      <div className="h-9 bg-gray-100 rounded-lg" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-full" />
      </div>
      <hr className="border-gray-200" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-8" />
        <div className="flex gap-2">
          <div className="h-7 bg-gray-100 rounded-lg w-12" />
          <div className="h-7 bg-gray-100 rounded-lg w-12" />
          <div className="h-7 bg-gray-100 rounded-lg w-12" />
        </div>
      </div>
    </div>
  );
}

export function MarketplaceGridSkeleton() {
  return (
    <div className="flex gap-8 mt-2">
      <SidebarSkeleton />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <GoatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
