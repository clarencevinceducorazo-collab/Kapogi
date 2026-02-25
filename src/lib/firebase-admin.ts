import admin from 'firebase-admin';

// Ensure the app is only initialized once
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase environment variables are not set. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // The .env file stores newlines as `\n` characters. We need to replace them back.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("❌ Firebase Admin SDK initialization error:", error.message);
    // Re-throwing the error is important so serverless functions fail fast
    // if the config is wrong.
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
