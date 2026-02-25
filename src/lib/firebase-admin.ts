
import admin from 'firebase-admin';

// This function ensures initialization only happens once.
function initializeAdmin() {
  if (admin.apps.length > 0 && admin.apps[0]) {
    // If already initialized, return the existing app instance
    return admin.apps[0];
  }

  // Check for required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // This error will be caught by the API route that calls the getter
    throw new Error("Firebase environment variables are not set. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.");
  }
  
  // Initialize and return the new app instance
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      // IMPORTANT: Replace literal \n with actual newlines
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
  
  console.log("🔥 Firebase Admin SDK initialized successfully.");
  return app;
}

// Export a getter function for Firestore.
// Any API route calling this will handle initialization errors within its own try/catch block.
export function getAdminDb() {
  initializeAdmin();
  return admin.firestore();
}

// Export a getter function for Auth.
export function getAdminAuth() {
  initializeAdmin();
  return admin.auth();
}
