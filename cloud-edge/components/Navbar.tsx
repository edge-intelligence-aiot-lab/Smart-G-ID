"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getContactInteractions } from "@/lib/storage";

export function Navbar() {
  const [inquiryCount, setInquiryCount] = useState<number>(0);

  useEffect(() => {
    // Initial read
    const items = getContactInteractions();
    setInquiryCount(items.length);

    // Event listener for real-time updates when contact is revealed
    const handleUpdate = () => {
      const updated = getContactInteractions();
      setInquiryCount(updated.length);
    };

    window.addEventListener("smart-gid-inquiry-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("smart-gid-inquiry-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo & Directory Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Smart<span className="text-teal-600">G-ID</span>
            </span>
          </Link>
          <span className="hidden sm:inline-block text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded">
            Livestock Directory
          </span>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2.5">
          {/* Farmer Registration Portal
          <Link
            href="/register"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-teal-600 bg-white hover:bg-teal-50/50 text-gray-700 hover:text-teal-700 text-xs sm:text-sm font-medium transition-all shadow-xs"
          >
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Farmer Register</span>
          </Link> */}

          {/* Inquiry / Contacted Listings Link */}
          <Link
            href="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-teal-600 bg-white hover:bg-teal-50/50 text-gray-700 hover:text-teal-700 text-xs sm:text-sm font-medium transition-all shadow-xs"
          >
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Inquiries</span>
            {inquiryCount > 0 && (
              <span className="bg-teal-600 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                {inquiryCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
