export interface Farmer {
  FarmerID: string;
  FullName: string;
  ContactNumber: string;
  FarmLocation: string;
  CreatedAt?: string;
}

export type GoatSex = 'Male' | 'Female' | 'Buck' | 'Doe' | 'Wether';

export interface LivestockProfile {
  RFID_TagID: string; // Primary Key / Firestore Document ID
  FarmerID: string;
  GoatName: string;
  Breed: string;
  Weight: number; // in kilograms (kg)
  Sex: GoatSex;
  Birthdate?: string; // ISO 8601 string or YYYY-MM-DD
  ImageFile: string; // Firebase Storage URL
  DateRecorded: string; // Timestamp of scale reading (ISO 8601)
  sync_status: boolean; // true = synced to cloud, false = pending offline sync
  lastSyncedAt?: string;
  DeviceID?: string; // ESP32-S3 or Raspberry Pi Node ID
  HealthNotes?: string;
  GalleryImages?: string[]; // Multi-angle gallery images
}

export type MarketplaceStatus = 'Available' | 'Sold' | 'Pending';

export interface MarketplaceListing {
  ListingID: string;
  RFID_TagID: string;
  Price: number;
  Status: MarketplaceStatus;
  ListedDate?: string;
}

// Composite / Joined types for public directory workflows
export interface ListingWithProfile extends MarketplaceListing {
  profile: LivestockProfile | null;
  farmer: Farmer | null;
}

// Client-side local storage interaction tracking for unauthenticated buyers
export interface ContactInteraction {
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
  timestamp: string; // ISO 8601 string
}

// Payload contract received from ESP32-S3 or Raspberry Pi edge devices
export interface HardwareIngestPayload {
  RFID_TagID: string;
  Weight: number;
  FarmerID: string;
  ImageFile: string; // Raw Base64 data URI OR pre-hosted URL
  DateRecorded?: string; // Device timestamp (for offline backfill)
  GoatName?: string;
  Breed?: string;
  Sex?: GoatSex;
  DeviceID?: string;
}

// Ingest API response contract
export interface IngestResponse {
  success: boolean;
  message: string;
  tagId?: string;
  dateRecorded?: string;
  imageUrl?: string;
  error?: string;
}
