import * as admin from 'firebase-admin';
import { config } from '../config';
import path from 'path';
import { existsSync } from 'fs';

// Initialize Firebase Admin SDK
let firebaseAdmin: admin.app.App | null = null;

export function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  // Use the same service account as Firestore
  const serviceAccountPath = config.credentials?.serviceAccountPath || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let credential: admin.credential.Credential;

  if (serviceAccountPath) {
    // Resolve the path - handle both relative and absolute paths
    let resolvedPath = serviceAccountPath;
    
    if (!path.isAbsolute(resolvedPath)) {
      // Resolve relative to the backend directory
      const backendDir = path.resolve(__dirname, '../..');
      resolvedPath = path.resolve(backendDir, resolvedPath);
    }
    
    if (existsSync(resolvedPath)) {
      credential = admin.credential.cert(resolvedPath);
      console.log(`[Firebase Admin] Using service account: ${resolvedPath}`);
    } else {
      console.warn(`[Firebase Admin] Service account file not found: ${resolvedPath}`);
      console.warn(`[Firebase Admin] Falling back to default credentials`);
      credential = admin.credential.applicationDefault();
    }
  } else {
    // Use default credentials (for GCP environments)
    credential = admin.credential.applicationDefault();
    console.log(`[Firebase Admin] Using default credentials`);
  }

  firebaseAdmin = admin.initializeApp({
    credential,
    projectId: config.gcp.projectId,
  });

  console.log(`[Firebase Admin] Initialized with project: ${config.gcp.projectId}`);
  return firebaseAdmin;
}

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
}

export function getAuth(): admin.auth.Auth {
  return getFirebaseAdmin().auth();
}
