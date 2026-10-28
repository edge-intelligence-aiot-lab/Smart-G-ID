"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GoatSex } from "@/types/database";
import { isGoatContactRevealed, saveContactInteraction } from "@/lib/storage";

interface FarmerContactObfuscatedProps {
  goatId: string;
  goatName: string;
  breed?: string;
  weight?: number;
  sex?: GoatSex;
  price?: number;
  imageFile?: string;
  farmerName: string;
  phoneNumber: string;
  farmLocation?: string;
}

export function FarmerContactObfuscated({
  goatId,
  goatName,
  breed,
  weight,
  sex,
  price,
  imageFile,
  farmerName,
  phoneNumber,
  farmLocation,
}: FarmerContactObfuscatedProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isGoatContactRevealed(goatId)) {
      setRevealed(true);
    }
  }, [goatId]);

  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, "");

  const handleReveal = () => {
    setRevealed(true);
    saveContactInteraction({
      goatId,
      goatName,
      breed,
      weight,
      sex,
      price,
      imageFile,
      farmerName,
      phoneNumber,
      farmLocation,
      timestamp: new Date().toISOString(),
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy phone number:", err);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-200/80 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
            {farmerName.charAt(0) || "F"}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{farmerName}</h4>
            <p className="text-xs text-gray-500">📍 {farmLocation || "Philippines"}</p>
          </div>
        </div>
        <span className="text-[11px] font-medium bg-white text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full">
          Verified Farmer
        </span>
      </div>

      {!revealed ? (
        <div className="mt-4 space-y-3">
          {/* Obfuscated number preview */}
          <div className="bg-white/90 border border-dashed border-teal-300 rounded-xl p-3 text-center">
            <span className="font-mono text-sm tracking-widest text-gray-400 select-none">
              {phoneNumber.slice(0, 7)} ••• ••••
            </span>
          </div>

          {/* Primary Reveal CTA */}
          <button
            type="button"
            onClick={handleReveal}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>Show Contact Number</span>
          </button>
          <p className="text-[11px] text-gray-500 text-center">
            Revealing logs this farmer to your unauthenticated <strong>Contacted Listings</strong> history.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 animate-fadeIn">
          {/* Revealed Number Display */}
          <div className="bg-white border border-teal-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                Direct Contact
              </p>
              <p className="font-mono text-base font-bold text-gray-900">{phoneNumber}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-200 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Action Call & SMS buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>Call Farmer</span>
            </a>
            <a
              href={`sms:${cleanPhone}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>Send SMS</span>
            </a>
          </div>

          {/* Feedback note with link to history */}
          <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved to your inquiry history
            </span>
            <Link href="/history" className="font-semibold underline hover:text-emerald-900">
              View History →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
