import admin from 'firebase-admin';

// Ensure the app is only initialized once
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error("Firebase environment variables are not set. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("❌ Firebase Admin SDK initialization error:", error.message);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
