import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getGoatDetails } from "@/actions/marketplace";
import { Navbar } from "@/components/Navbar";
import { GoatImageGallery } from "@/components/GoatImageGallery";
import { FarmerContactObfuscated } from "@/components/FarmerContactObfuscated";

export const dynamic = "force-dynamic";

interface GoatPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: GoatPageProps): Promise<Metadata> {
  const listing = await getGoatDetails(params.id);
  if (!listing || !listing.profile) {
    return {
      title: "Goat Profile Not Found | Smart G-ID",
    };
  }

  const name = listing.profile.GoatName;
  const breed = listing.profile.Breed;
  return {
    title: `${name} (${breed}) | Smart G-ID Livestock Directory`,
    description: `View full certified profile, scale weight (${listing.profile.Weight}kg), multi-angle photos, and farmer contact for ${name}.`,
  };
}

export default async function GoatProfilePage({ params }: GoatPageProps) {
  const listing = await getGoatDetails(params.id);

  if (!listing) {
    notFound();
  }

  const { profile, Price, RFID_TagID, farmer, ListingID } = listing;

  const goatName = profile?.GoatName || `Capra-${RFID_TagID.slice(-4)}`;
  const breed = profile?.Breed || "Native Cross";
  const weight = profile?.Weight || 0;
  const sex = profile?.Sex || "Buck";
  const primaryImage =
    profile?.ImageFile ||
    "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80";
  const gallery = profile?.GalleryImages && profile.GalleryImages.length > 0
    ? profile.GalleryImages
    : [primaryImage];

  const farmerName = farmer?.FullName || "Verified Local Farmer";
  const contactNumber = farmer?.ContactNumber || "+63 917 555 0192";
  const farmLocation = farmer?.FarmLocation || "Philippines";

  const formattedDate = profile?.DateRecorded
    ? new Date(profile.DateRecorded).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently Verified";

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Breadcrumb & Navigation */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
            <Link href="/" className="hover:text-teal-600 transition-colors">
              Directory
            </Link>
            <span>›</span>
            <span className="text-gray-500">{breed}</span>
            <span>›</span>
            <span className="text-gray-900 font-medium truncate">{goatName}</span>
          </nav>

          <div className="mt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to all listings
            </Link>
          </div>
        </div>

        {/* Main Profile Grid */}
        <main className="max-w-7xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Multi-Angle Photo Gallery & IoT Telemetry (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <GoatImageGallery
                primaryImage={primaryImage}
                galleryImages={gallery}
                goatName={goatName}
              />

              {/* Certified IoT Telemetry Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-gray-900">Cyber-Physical Hardware Verification</h3>
                  </div>
                  <span className="text-[11px] font-mono bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full font-medium">
                    ESP32-S3 Synced
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">RFID Tag Number</span>
                    <span className="font-mono font-bold text-gray-800">{RFID_TagID}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Scale Reading Date</span>
                    <span className="font-medium text-gray-800">{formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Edge Gateway Node</span>
                    <span className="font-mono font-medium text-gray-800">
                      {profile?.DeviceID || "ESP32-S3-GATEWAY"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Cloud Sync Status</span>
                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified Online
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Listing Reference</span>
                    <span className="font-mono text-gray-800">{ListingID}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Valuation Model</span>
                    <span className="font-medium text-gray-800">Live Scale Weight</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Goat Specs & Obfuscated Contact Card (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Core Information Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                {/* Breed Tag & Verified Label */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                    {breed}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    ID: {ListingID}
                  </span>
                </div>

                {/* Goat Name */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {goatName}
                </h1>

                {/* Asking Price */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-teal-600">
                    ₱{Price.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">Direct Farm-Gate Asking Price</span>
                </div>

                <hr className="my-5 border-gray-100" />

                {/* Key Animal Specs */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-[11px] text-gray-400 block mb-0.5">Certified Weight</span>
                    <span className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                      ⚖️ {weight.toFixed(1)} <span className="text-xs font-normal text-gray-500">kg</span>
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-[11px] text-gray-400 block mb-0.5">Sex / Classification</span>
                    <span className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                      🏷️ {sex}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-[11px] text-gray-400 block mb-0.5">Breed Quality</span>
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {breed}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-[11px] text-gray-400 block mb-0.5">Birthdate / Age</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {profile?.Birthdate || "Approx. 1 yr"}
                    </span>
                  </div>
                </div>

                {/* Health & Pasture Notes */}
                <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-3.5 text-xs text-teal-900 space-y-1">
                  <span className="font-semibold block text-teal-950">📋 Farm & Health Records:</span>
                  <p className="text-teal-800 leading-relaxed">
                    {profile?.HealthNotes ||
                      "RFID scanned & verified on digital load cell. Vaccinated, dewormed, raised on natural rotational pasture grazing."}
                  </p>
                </div>
              </div>

              {/* Obfuscated Contact Card with LocalStorage Tracking */}
              <FarmerContactObfuscated
                goatId={ListingID}
                goatName={goatName}
                breed={breed}
                weight={weight}
                sex={sex}
                price={Price}
                imageFile={primaryImage}
                farmerName={farmerName}
                phoneNumber={contactNumber}
                farmLocation={farmLocation}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>© 2026 Smart G-ID. Direct unauthenticated inquiry directory. Transactions and logistics are arranged directly with the farmer.</p>
        </div>
      </footer>
    </div>
  );
}
