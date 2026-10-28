"use client";

import React, { useState } from "react";

interface GoatImageGalleryProps {
  primaryImage: string;
  galleryImages?: string[];
  goatName: string;
}

export function GoatImageGallery({
  primaryImage,
  galleryImages,
  goatName,
}: GoatImageGalleryProps) {
  // Consolidate images into a unique list
  const allImages = Array.from(
    new Set([primaryImage, ...(galleryImages || [])].filter(Boolean))
  );

  const [activeImage, setActiveImage] = useState<string>(allImages[0] || primaryImage);

  return (
    <div className="space-y-3">
      {/* Active Main View */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-xs">
        <img
          src={activeImage}
          alt={`${goatName} view`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Multi-angle indicator pill */}
        {allImages.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {allImages.indexOf(activeImage) + 1} of {allImages.length} angles
          </span>
        )}
      </div>

      {/* Multi-Angle Thumbnails */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {allImages.map((img, idx) => {
            const isSelected = img === activeImage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-teal-600 ring-2 ring-teal-600/30 shadow-xs"
                    : "border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`${goatName} angle ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
