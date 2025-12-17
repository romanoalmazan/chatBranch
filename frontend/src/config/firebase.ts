import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Debug: Log configuration status (without exposing sensitive values)
console.log('[Firebase Config] Loading configuration...');
console.log('[Firebase Config] API Key:', firebaseConfig.apiKey ? '✓ Set' : '✗ Missing');
console.log('[Firebase Config] Auth Domain:', firebaseConfig.authDomain || '✗ Missing');
console.log('[Firebase Config] Project ID:', firebaseConfig.projectId || '✗ Missing');
console.log('[Firebase Config] Storage Bucket:', firebaseConfig.storageBucket || '✗ Missing');
console.log('[Firebase Config] Messaging Sender ID:', firebaseConfig.messagingSenderId || '✗ Missing');
console.log('[Firebase Config] App ID:', firebaseConfig.appId ? '✓ Set' : '✗ Missing');

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('[Firebase Config] ERROR: Firebase configuration is incomplete!');
  console.error('[Firebase Config] Missing values:', {
    apiKey: !firebaseConfig.apiKey,
    authDomain: !firebaseConfig.authDomain,
    projectId: !firebaseConfig.projectId,
    storageBucket: !firebaseConfig.storageBucket,
    messagingSenderId: !firebaseConfig.messagingSenderId,
    appId: !firebaseConfig.appId,
  });
  console.error('[Firebase Config] Make sure all VITE_FIREBASE_* variables are set in your .env file');
  console.error('[Firebase Config] Note: Vite requires a restart after changing .env files');
}

// Initialize Firebase (only if not already initialized)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Export Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export default app;
