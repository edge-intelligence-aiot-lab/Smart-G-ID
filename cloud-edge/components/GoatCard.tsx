"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ListingWithProfile } from "@/types/database";

interface GoatCardProps {
  listing: ListingWithProfile;
}

export function GoatCard({ listing }: GoatCardProps) {
  const { profile, Price, RFID_TagID, farmer, ListingID } = listing;
  const [imgSrc, setImgSrc] = useState(
    profile?.ImageFile ||
      "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80"
  );

  const farmerName = farmer?.FullName || "Verified Local Farmer";
  const location = farmer?.FarmLocation || "Philippines";

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-teal-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Livestock Image Link */}
        <Link href={`/goat/${ListingID}`} className="block relative aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer">
          <img
            src={imgSrc}
            alt={profile?.GoatName || `Goat ${RFID_TagID}`}
            onError={() =>
              setImgSrc(
                "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80"
              )
            }
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Verified RFID Tag Badge */}
          <span className="absolute top-2.5 left-2.5 bg-teal-700/90 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            RFID Verified
          </span>

          {/* Multi-angle indicator if present */}
          {profile?.GalleryImages && profile.GalleryImages.length > 1 && (
            <span className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full">
              📷 {profile.GalleryImages.length} angles
            </span>
          )}

          {/* Tag ID Pill */}
          <span className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white/90 text-[10px] font-mono px-2 py-0.5 rounded">
            {RFID_TagID}
          </span>
        </Link>

        {/* Details Container */}
        <div className="p-4">
          {/* Breed - small uppercase tag */}
          <p className="text-[11px] uppercase tracking-wider font-semibold text-teal-700 mb-0.5">
            {profile?.Breed || "Native Cross"}
          </p>

          {/* Goat Name & Asking Price */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link href={`/goat/${ListingID}`} className="hover:text-teal-700 transition-colors">
              <h3 className="text-base font-bold text-gray-900 leading-snug">
                {profile?.GoatName || "Registered Goat"}
              </h3>
            </Link>
            <span className="text-base font-extrabold text-teal-600 shrink-0">
              ₱{Price.toLocaleString()}
            </span>
          </div>

          {/* Metric Badges */}
          <div className="flex flex-wrap gap-1.5 text-xs text-gray-600 mb-3.5">
            {profile?.Weight && (
              <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">
                ⚖️ {profile.Weight.toFixed(1)} kg
              </span>
            )}
            {profile?.Sex && (
              <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">
                🏷️ {profile.Sex}
              </span>
            )}
          </div>

          {/* Farmer Info Box */}
          <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900">{farmerName}</span>
              <span className="text-gray-400">• Farmer</span>
            </div>
            <p className="text-gray-500 truncate flex items-center gap-1">
              <span>📍</span>
              <span>{location}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Primary CTA: View Profile & Reveal Contact */}
      <div className="p-4 pt-0">
        <Link
          href={`/goat/${ListingID}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm"
        >
          <span>View Profile & Contact</span>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
