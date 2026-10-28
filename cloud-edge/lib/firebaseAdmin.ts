import { getApps, initializeApp, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getStorage, Storage } from "firebase-admin/storage";

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Try JSON string service account key
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsedServiceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      return initializeApp({
        credential: cert(parsedServiceAccount),
        storageBucket:
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
          process.env.FIREBASE_STORAGE_BUCKET,
      });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string. Falling back to discrete variables.");
    }
  }

  // 2. Try discrete credentials
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const storageBucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (projectId && clientEmail && privateKey && !privateKey.includes("...")) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
    } catch (err) {
      console.warn(
        "Could not initialize with private key (likely invalid or placeholder). Falling back to basic project configuration."
      );
    }
  }

  // 3. Fallback to default credentials or mock for initial build/dev
  console.warn(
    "Firebase Admin SDK initialized with default credentials or project ID. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in production."
  );

  return initializeApp({
    projectId: projectId || "smart-g-id",
    storageBucket,
  });
}

const adminApp = initializeFirebaseAdmin();
const adminDb: Firestore = getFirestore(adminApp);
const adminAuth: Auth = getAuth(adminApp);
const adminStorage: Storage = getStorage(adminApp);

export { adminApp, adminDb, adminAuth, adminStorage };
