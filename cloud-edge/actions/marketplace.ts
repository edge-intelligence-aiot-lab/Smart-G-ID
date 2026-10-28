"use server";

import { adminDb } from "@/lib/firebaseAdmin";
import {
  Farmer,
  ListingWithProfile,
  LivestockProfile,
  MarketplaceListing,
} from "@/types/database";

/**
 * Sanitizes Firestore documents into plain JSON objects to satisfy
 * Next.js Server Action serialization constraints.
 */
function sanitizeDoc<T>(data: any): T {
  if (!data) return data;
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (value && typeof value === "object") {
      // Check for Firestore Timestamp
      if (typeof value.toDate === "function") {
        sanitized[key] = value.toDate().toISOString();
      } else if (value instanceof Date) {
        sanitized[key] = value.toISOString();
      }
    }
  }

  return sanitized as T;
}

/**
 * Server Action: Fetches all active/available marketplace listings
 * and joins each listing with its corresponding LivestockProfile and Farmer records.
 */
export async function getAvailableListings(): Promise<ListingWithProfile[]> {
  try {
    // 1. Fetch available marketplace listings with resilient fallback timeout
    const fetchPromise = adminDb
      .collection("Marketplace_Listings")
      .where("Status", "==", "Available")
      .get();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore fetch timeout")), 2500)
    );

    const listingsSnapshot = await Promise.race([fetchPromise, timeoutPromise]);

    if (listingsSnapshot.empty) {
      return [];
    }

    const listings: MarketplaceListing[] = listingsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return sanitizeDoc<MarketplaceListing>({
        ListingID: doc.id,
        RFID_TagID: data.RFID_TagID,
        Price: Number(data.Price),
        Status: data.Status,
        ListedDate: data.ListedDate || new Date().toISOString(),
      });
    });

    // 2. Extract unique RFID tags and Farmer IDs for batched/concurrent lookups
    const rfidTags = Array.from(new Set(listings.map((l) => l.RFID_TagID)));

    // 3. Concurrently fetch all corresponding Livestock Profiles
    const profilePromises = rfidTags.map(async (rfid) => {
      const doc = await adminDb.collection("Livestock_Profiles").doc(rfid).get();
      if (!doc.exists) return null;
      return sanitizeDoc<LivestockProfile>(doc.data());
    });

    const rawProfiles = await Promise.all(profilePromises);
    const profileMap = new Map<string, LivestockProfile>();

    rawProfiles.forEach((profile) => {
      if (profile && profile.RFID_TagID) {
        profileMap.set(profile.RFID_TagID, profile);
      }
    });

    // 4. Concurrently fetch unique Farmer profiles
    const farmerIds = Array.from(
      new Set(
        Array.from(profileMap.values())
          .map((p) => p.FarmerID)
          .filter(Boolean)
      )
    );

    const farmerPromises = farmerIds.map(async (farmerId) => {
      const doc = await adminDb.collection("Farmers").doc(farmerId).get();
      if (!doc.exists) return null;
      return sanitizeDoc<Farmer>(doc.data());
    });

    const rawFarmers = await Promise.all(farmerPromises);
    const farmerMap = new Map<string, Farmer>();

    rawFarmers.forEach((farmer) => {
      if (farmer && farmer.FarmerID) {
        farmerMap.set(farmer.FarmerID, farmer);
      }
    });

    // 5. Join MarketplaceListing + LivestockProfile + Farmer
    const joinedListings: ListingWithProfile[] = listings.map((listing) => {
      const profile = profileMap.get(listing.RFID_TagID) || null;
      const farmer = profile?.FarmerID ? farmerMap.get(profile.FarmerID) || null : null;

      return {
        ...listing,
        profile,
        farmer,
      };
    });

    return joinedListings;
  } catch (error) {
    console.warn("Firestore connection not ready or credentials not configured. Serving local fallback listings for dev preview.", error);
    // Graceful fallback for initial UI development preview
    return [
      {
        ListingID: "LIST-101",
        RFID_TagID: "RFID-982-0004128",
        Price: 320,
        Status: "Available",
        ListedDate: new Date().toISOString(),
        profile: {
          RFID_TagID: "RFID-982-0004128",
          FarmerID: "FARMER-001",
          GoatName: "Titan (Demo)",
          Breed: "Boer Fullblood",
          Weight: 54.2,
          Sex: "Buck",
          Birthdate: "2024-03-15",
          ImageFile: "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80",
          GalleryImages: [
            "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1533318087102-b3ceba202058?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1200&q=80"
          ],
          DateRecorded: new Date().toISOString(),
          sync_status: true,
          DeviceID: "ESP32-S3-GATEWAY-A",
        },
        farmer: {
          FarmerID: "FARMER-001",
          FullName: "Mateo Alvarez",
          ContactNumber: "+63 917 555 0192",
          FarmLocation: "Batangas Highland Pastures, PH",
        },
      },
      {
        ListingID: "LIST-102",
        RFID_TagID: "RFID-982-0007891",
        Price: 245,
        Status: "Available",
        ListedDate: new Date().toISOString(),
        profile: {
          RFID_TagID: "RFID-982-0007891",
          FarmerID: "FARMER-001",
          GoatName: "Amber (Demo)",
          Breed: "Anglo-Nubian",
          Weight: 38.6,
          Sex: "Doe",
          Birthdate: "2024-06-20",
          ImageFile: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
          GalleryImages: [
            "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80"
          ],
          DateRecorded: new Date().toISOString(),
          sync_status: true,
          DeviceID: "ESP32-S3-GATEWAY-A",
        },
        farmer: {
          FarmerID: "FARMER-001",
          FullName: "Mateo Alvarez",
          ContactNumber: "+63 917 555 0192",
          FarmLocation: "Batangas Highland Pastures, PH",
        },
      },
      {
        ListingID: "LIST-103",
        RFID_TagID: "RFID-982-0003450",
        Price: 285,
        Status: "Available",
        ListedDate: new Date().toISOString(),
        profile: {
          RFID_TagID: "RFID-982-0003450",
          FarmerID: "FARMER-001",
          GoatName: "Zephyr (Demo)",
          Breed: "Kalahari Red Cross",
          Weight: 44.8,
          Sex: "Buck",
          Birthdate: "2024-04-10",
          ImageFile: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&w=800&q=80",
          GalleryImages: [
            "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80"
          ],
          DateRecorded: new Date().toISOString(),
          sync_status: true,
          DeviceID: "ESP32-S3-GATEWAY-B",
        },
        farmer: {
          FarmerID: "FARMER-001",
          FullName: "Mateo Alvarez",
          ContactNumber: "+63 917 555 0192",
          FarmLocation: "Batangas Highland Pastures, PH",
        },
      },
    ];
  }
}

/**
 * Server Action: Fetches complete individual details for a specific goat profile
 * by ListingID or RFID_TagID, joining profile, multi-angle images, scale weights, and farmer details.
 */
export async function getGoatDetails(id: string): Promise<ListingWithProfile | null> {
  const normalizedId = decodeURIComponent(id).trim();

  try {
    // 1. Check if ID directly matches Marketplace_Listings document
    const listingRef = adminDb.collection("Marketplace_Listings").doc(normalizedId);
    const listingSnap = await Promise.race([
      listingRef.get(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore lookup timeout")), 2500)
      ),
    ]);

    let listingData: MarketplaceListing | null = null;
    let rfidTag = normalizedId;

    if (listingSnap.exists) {
      const data = listingSnap.data()!;
      listingData = sanitizeDoc<MarketplaceListing>({
        ListingID: listingSnap.id,
        RFID_TagID: data.RFID_TagID,
        Price: Number(data.Price),
        Status: data.Status,
        ListedDate: data.ListedDate || new Date().toISOString(),
      });
      rfidTag = listingData.RFID_TagID;
    } else {
      // 2. Alternatively check if normalizedId is an RFID_TagID in Marketplace_Listings
      const querySnap = await adminDb
        .collection("Marketplace_Listings")
        .where("RFID_TagID", "==", normalizedId)
        .limit(1)
        .get();

      if (!querySnap.empty) {
        const doc = querySnap.docs[0];
        const data = doc.data();
        listingData = sanitizeDoc<MarketplaceListing>({
          ListingID: doc.id,
          RFID_TagID: data.RFID_TagID,
          Price: Number(data.Price),
          Status: data.Status,
          ListedDate: data.ListedDate || new Date().toISOString(),
        });
        rfidTag = listingData.RFID_TagID;
      }
    }

    // 3. Fetch corresponding LivestockProfile
    const profileDoc = await adminDb.collection("Livestock_Profiles").doc(rfidTag).get();
    const profile = profileDoc.exists ? sanitizeDoc<LivestockProfile>(profileDoc.data()) : null;

    // 4. Fetch Farmer details
    let farmer: Farmer | null = null;
    const farmerId = profile?.FarmerID;
    if (farmerId) {
      const farmerDoc = await adminDb.collection("Farmers").doc(farmerId).get();
      if (farmerDoc.exists) {
        farmer = sanitizeDoc<Farmer>(farmerDoc.data());
      }
    }

    if (listingData || profile) {
      return {
        ListingID: listingData?.ListingID || `LIST-${rfidTag.slice(-4)}`,
        RFID_TagID: rfidTag,
        Price: listingData?.Price || 300,
        Status: listingData?.Status || "Available",
        ListedDate: listingData?.ListedDate || new Date().toISOString(),
        profile,
        farmer,
      };
    }
  } catch (error) {
    console.warn("Firestore lookup failed or offline. Checking fallback listings:", error);
  }

  // Fallback to sample listings for dev preview
  const allListings = await getAvailableListings();
  const found = allListings.find(
    (l) =>
      l.ListingID.toLowerCase() === normalizedId.toLowerCase() ||
      l.RFID_TagID.toLowerCase() === normalizedId.toLowerCase() ||
      (l.profile?.GoatName &&
        l.profile.GoatName.toLowerCase().replace(/[^a-z0-9]/g, "").includes(
          normalizedId.toLowerCase().replace(/[^a-z0-9]/g, "")
        ))
  );

  return found || null;
}

/**
 * Convenience Server Action: Seeds realistic mock data into Firestore
 * if the database is fresh/empty. Useful for instant verification.
 */
export async function seedInitialMarketplaceData(): Promise<{ success: boolean; count: number }> {
  try {
    const existing = await adminDb.collection("Marketplace_Listings").limit(1).get();
    if (!existing.empty) {
      return { success: true, count: 0 };
    }

    const batch = adminDb.batch();

    // 1. Seed Farmer
    const farmerRef = adminDb.collection("Farmers").doc("FARMER-001");
    batch.set(farmerRef, {
      FarmerID: "FARMER-001",
      FullName: "Mateo Alvarez",
      ContactNumber: "+63 917 555 0192",
      FarmLocation: "Batangas Highland Pastures, PH",
      CreatedAt: new Date().toISOString(),
    });

    // 2. Seed Sample Livestock Profiles
    const sampleGoats = [
      {
        RFID_TagID: "RFID-982-0004128",
        FarmerID: "FARMER-001",
        GoatName: "Titan",
        Breed: "Boer Fullblood",
        Weight: 54.2,
        Sex: "Buck" as const,
        Birthdate: "2024-03-15",
        ImageFile: "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80",
        DateRecorded: new Date().toISOString(),
        sync_status: true,
        DeviceID: "ESP32-S3-GATEWAY-A",
      },
      {
        RFID_TagID: "RFID-982-0007891",
        FarmerID: "FARMER-001",
        GoatName: "Amber",
        Breed: "Anglo-Nubian",
        Weight: 38.6,
        Sex: "Doe" as const,
        Birthdate: "2024-06-20",
        ImageFile: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
        DateRecorded: new Date().toISOString(),
        sync_status: true,
        DeviceID: "ESP32-S3-GATEWAY-A",
      },
      {
        RFID_TagID: "RFID-982-0003450",
        FarmerID: "FARMER-001",
        GoatName: "Zephyr",
        Breed: "Kalahari Red Cross",
        Weight: 44.8,
        Sex: "Buck" as const,
        Birthdate: "2024-04-10",
        ImageFile: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?auto=format&fit=crop&w=800&q=80",
        DateRecorded: new Date().toISOString(),
        sync_status: true,
        DeviceID: "ESP32-S3-GATEWAY-B",
      },
    ];

    sampleGoats.forEach((goat) => {
      const ref = adminDb.collection("Livestock_Profiles").doc(goat.RFID_TagID);
      batch.set(ref, goat);
    });

    // 3. Seed Marketplace Listings
    const sampleListings: MarketplaceListing[] = [
      {
        ListingID: "LIST-101",
        RFID_TagID: "RFID-982-0004128",
        Price: 320,
        Status: "Available",
        ListedDate: new Date().toISOString(),
      },
      {
        ListingID: "LIST-102",
        RFID_TagID: "RFID-982-0007891",
        Price: 245,
        Status: "Available",
        ListedDate: new Date().toISOString(),
      },
      {
        ListingID: "LIST-103",
        RFID_TagID: "RFID-982-0003450",
        Price: 285,
        Status: "Available",
        ListedDate: new Date().toISOString(),
      },
    ];

    sampleListings.forEach((listing) => {
      const ref = adminDb.collection("Marketplace_Listings").doc(listing.ListingID);
      batch.set(ref, listing);
    });

    await batch.commit();
    return { success: true, count: sampleListings.length };
  } catch (error) {
    console.error("Error seeding initial data:", error);
    return { success: false, count: 0 };
  }
}

/**
 * Server Action: Creates or updates a Farmer document in Firestore using
 * the authenticated user's UID as the document ID.
 */
export async function saveFarmerProfile(farmerData: Farmer): Promise<{ success: boolean; error?: string }> {
  try {
    const { FarmerID, FullName, ContactNumber, FarmLocation } = farmerData;

    if (!FarmerID || !FullName?.trim() || !ContactNumber?.trim() || !FarmLocation?.trim()) {
      return {
        success: false,
        error: "Missing mandatory farmer profile fields (ID, Full Name, Contact Number, or Location).",
      };
    }

    const docRef = adminDb.collection("Farmers").doc(FarmerID);
    await docRef.set(
      {
        FarmerID,
        FullName: FullName.trim(),
        ContactNumber: ContactNumber.trim(),
        FarmLocation: FarmLocation.trim(),
        CreatedAt: farmerData.CreatedAt || new Date().toISOString(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (err: any) {
    console.error("Error writing farmer profile via Admin SDK:", err);
    return {
      success: false,
      error: err?.message || "Failed to persist farmer profile to database.",
    };
  }
}

