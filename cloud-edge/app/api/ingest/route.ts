import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebaseAdmin";
import { HardwareIngestPayload, IngestResponse, LivestockProfile } from "@/types/database";

export const dynamic = "force-dynamic";

// Fallback image placeholder if edge device camera is offline/disconnected
const DEFAULT_LIVESTOCK_IMAGE = "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80";

/**
 * Uploads a base64 string or data URI to Firebase Storage and returns the public download URL.
 */
async function uploadBase64Image(base64Data: string, rfidTag: string): Promise<string> {
  const bucketName =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET;

  const bucket = bucketName ? adminStorage.bucket(bucketName) : adminStorage.bucket();

  // Strip possible base64 header (e.g. data:image/jpeg;base64,)
  const matches = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : "image/jpeg";
  const rawBase64 = matches ? matches[2] : base64Data;

  const buffer = Buffer.from(rawBase64, "base64");
  const fileName = `livestock_images/${rfidTag.replace(/[^a-zA-Z0-9_-]/g, "_")}_${Date.now()}.jpg`;
  const file = bucket.file(fileName);

  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        rfidTag,
        uploadedAt: new Date().toISOString(),
      },
    },
    resumable: false,
  });

  // Make public or generate standard Firebase Storage public link
  try {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  } catch (err) {
    // If public ACL is restricted by uniform bucket-level access, construct standard download URL
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Hardware Edge Authentication via API Key
    const configuredApiKey = process.env.EDGE_INGEST_API_KEY;
    const providedApiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (configuredApiKey && providedApiKey !== configuredApiKey) {
      return NextResponse.json<IngestResponse>(
        {
          success: false,
          message: "Unauthorized: Invalid edge hardware API key.",
          error: "AUTH_FAILED",
        },
        { status: 401 }
      );
    }

    // 2. Parse and Validate Ingest Payload
    const body: HardwareIngestPayload = await req.json();
    const {
      RFID_TagID,
      Weight,
      FarmerID,
      ImageFile,
      DateRecorded,
      GoatName,
      Breed,
      Sex,
      DeviceID,
    } = body;

    if (!RFID_TagID || Weight === undefined || !FarmerID) {
      return NextResponse.json<IngestResponse>(
        {
          success: false,
          message: "Bad Request: Missing mandatory fields (RFID_TagID, Weight, FarmerID).",
          error: "MISSING_REQUIRED_FIELDS",
        },
        { status: 400 }
      );
    }

    // 3. Resolve Image Storage (Direct Base64 Data URI or pre-hosted URL or Cloud Storage)
    let imageUrl = DEFAULT_LIVESTOCK_IMAGE;

    if (ImageFile) {
      if (ImageFile.startsWith("http://") || ImageFile.startsWith("https://")) {
        imageUrl = ImageFile;
      } else if (ImageFile.startsWith("data:image/")) {
        // Check if Cloud Storage is explicitly configured
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (bucketName && !bucketName.includes("your-project-id") && !bucketName.includes("smart-g-id.appspot.com")) {
          try {
            imageUrl = await uploadBase64Image(ImageFile, RFID_TagID);
          } catch (uploadError) {
            console.warn("Storage upload failed, falling back to direct Base64 string in Firestore:", uploadError);
            imageUrl = ImageFile;
          }
        } else {
          // No Storage bucket needed: Store Base64 string directly in Firestore (100% Free Tier)
          imageUrl = ImageFile;
        }
      } else {
        // Plain raw base64 without prefix: format as data URI
        imageUrl = `data:image/jpeg;base64,${ImageFile}`;
      }
    }

    // 4. Handle Offline Sync & Timestamps
    // If edge device stored this while disconnected, preserve device timestamp
    const recordedTimestamp = DateRecorded || new Date().toISOString();
    const nowIso = new Date().toISOString();

    const profileRef = adminDb.collection("Livestock_Profiles").doc(RFID_TagID);
    const existingDoc = await profileRef.get();

    const profileData: Partial<LivestockProfile> = {
      RFID_TagID,
      FarmerID,
      Weight: Number(Weight),
      ImageFile: imageUrl,
      DateRecorded: recordedTimestamp,
      sync_status: true, // Marked true since cloud ingestion succeeded
      lastSyncedAt: nowIso,
      ...(DeviceID && { DeviceID }),
    };

    // If doc doesn't exist, provide sensible defaults for domain attributes
    if (!existingDoc.exists) {
      profileData.GoatName = GoatName || `Capra-${RFID_TagID.slice(-4)}`;
      profileData.Breed = Breed || "Boer Cross";
      profileData.Sex = Sex || "Buck";
      profileData.Birthdate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } else {
      // Preserve existing profile details if edge device didn't specify
      if (GoatName) profileData.GoatName = GoatName;
      if (Breed) profileData.Breed = Breed;
      if (Sex) profileData.Sex = Sex;
    }

    // 5. Upsert to Firestore Livestock_Profiles
    await profileRef.set(profileData, { merge: true });

    // 6. Record Historical Telemetry (Subcollection for weight trajectory analytics)
    await profileRef.collection("telemetry_logs").add({
      weight: Number(Weight),
      recordedAt: recordedTimestamp,
      syncedAt: nowIso,
      deviceId: DeviceID || "ESP32-S3-GATEWAY",
    });

    return NextResponse.json<IngestResponse>(
      {
        success: true,
        message: existingDoc.exists
          ? "Livestock profile and telemetry updated successfully."
          : "New livestock profile registered and telemetry logged.",
        tagId: RFID_TagID,
        dateRecorded: recordedTimestamp,
        imageUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Hardware Ingestion API Error:", error);
    return NextResponse.json<IngestResponse>(
      {
        success: false,
        message: "Internal server error processing hardware ingestion.",
        error: error?.message || "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
