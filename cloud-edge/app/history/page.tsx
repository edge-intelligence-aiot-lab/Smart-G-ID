"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ContactInteraction } from "@/types/database";
import {
  getContactInteractions,
  removeContactInteraction,
  clearContactInteractions,
} from "@/lib/storage";

export default function InquiryHistoryPage() {
  const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInteractions(getContactInteractions());

    const handleUpdate = () => {
      setInteractions(getContactInteractions());
    };

    window.addEventListener("smart-gid-inquiry-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("smart-gid-inquiry-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleRemove = (goatId: string) => {
    removeContactInteraction(goatId);
    setInteractions(getContactInteractions());
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your contacted listings history?")) {
      clearContactInteractions();
      setInteractions([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Breadcrumb & Navigation */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
            <Link href="/" className="hover:text-teal-600 transition-colors">
              Home
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Contacted Listings</span>
          </nav>
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 pb-16">
          {/* Header Row */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                  Inquiry History
                </span>
                <span className="text-xs text-gray-400 font-medium">Unauthenticated Session</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Contacted Listings
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Track goats and farmers you have previously contacted. Saved locally in your browser so you never lose a farmer’s phone number.
              </p>
            </div>

            {mounted && interactions.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-3.5 py-2 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl border border-red-200 transition-colors"
                >
                  Clear All History
                </button>
              </div>
            )}
          </div>

          {!mounted ? (
            /* Loading Skeleton */
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse flex gap-5">
                  <div className="w-28 h-28 bg-gray-200 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : interactions.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg mx-auto my-8">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No contacted listings yet
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                When you click <strong>“Show Contact Number”</strong> on any goat profile, the farmer’s contact information and livestock details will be automatically recorded here.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
              >
                <span>Browse Livestock Directory</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          ) : (
            /* Interaction List */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <span>
                  Showing <strong>{interactions.length}</strong> contacted livestock profile{interactions.length !== 1 ? "s" : ""}
                </span>
                <span>Sorted by most recent inquiry</span>
              </div>

              {interactions.map((item) => {
                const cleanPhone = item.phoneNumber.replace(/[^0-9+]/g, "");
                const formattedTime = new Date(item.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={item.goatId}
                    className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-4 min-w-0">
                      {item.imageFile ? (
                        <Link href={`/goat/${item.goatId}`} className="shrink-0">
                          <img
                            src={item.imageFile}
                            alt={item.goatName}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-100 hover:opacity-90 transition-opacity"
                          />
                        </Link>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold shrink-0">
                          Goat
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            {item.breed || "Livestock"}
                          </span>
                          {item.weight && (
                            <span className="text-xs text-gray-500 font-medium">
                              ⚖️ {item.weight} kg
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/goat/${item.goatId}`}
                          className="hover:text-teal-700 transition-colors block"
                        >
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                            {item.goatName}
                          </h3>
                        </Link>

                        <div className="text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-800">{item.farmerName}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-gray-500">📍 {item.farmLocation || "Philippines"}</span>
                          {item.price && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="font-bold text-teal-600">₱{item.price.toLocaleString()}</span>
                            </>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-400 flex items-center gap-1 pt-0.5">
                          <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Contact revealed on {formattedTime}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Phone Actions & Dismiss */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      {/* Direct Phone Number Pill */}
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 block">
                          Farmer Number
                        </span>
                        <span className="font-mono text-sm sm:text-base font-bold text-gray-900">
                          {item.phoneNumber}
                        </span>
                      </div>

                      {/* Call & SMS Buttons */}
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="flex items-center gap-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>Call</span>
                        </a>

                        <a
                          href={`sms:${cleanPhone}`}
                          className="flex items-center gap-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span>SMS</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleRemove(item.goatId)}
                          title="Remove from history"
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>© 2026 Smart G-ID • Client-side local storage tracking for direct livestock inquiries.</p>
        </div>
      </footer>
    </div>
  );
}
