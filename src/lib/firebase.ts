import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { JournalInteraction } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use custom firestoreDatabaseId if provisioned
export const db: Firestore = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out current authenticated user
 */
export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Clean undefined values from object to prevent Firestore errors
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = sanitizeForFirestore(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        item !== null && typeof item === 'object' ? sanitizeForFirestore(item) : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Save or update an isolated interaction under /users/{userId}/interactions/{interactionId}
 */
export async function saveUserInteraction(
  userId: string,
  interaction: JournalInteraction
): Promise<void> {
  if (!userId) throw new Error('User ID is required to persist interaction.');
  if (!interaction.id) throw new Error('Interaction ID is required.');

  const interactionRef = doc(db, 'users', userId, 'interactions', interaction.id);
  const cleanData = sanitizeForFirestore({
    ...interaction,
    userId,
    updatedAt: new Date().toISOString(),
  });

  await setDoc(interactionRef, cleanData, { merge: true });
}

/**
 * Fetch all past interactions for a user, sorted by creation date descending
 */
export async function fetchUserInteractions(userId: string): Promise<JournalInteraction[]> {
  if (!userId) return [];

  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('createdAt', 'desc'));
  
  try {
    const snapshot = await getDocs(q);
    const interactions: JournalInteraction[] = [];
    snapshot.forEach((docSnap) => {
      interactions.push(docSnap.data() as JournalInteraction);
    });
    return interactions;
  } catch (error) {
    // If indexing is pending, fallback to default collection fetch
    console.warn('Error fetching with order query, falling back to base collection:', error);
    const snapshot = await getDocs(interactionsRef);
    const interactions: JournalInteraction[] = [];
    snapshot.forEach((docSnap) => {
      interactions.push(docSnap.data() as JournalInteraction);
    });
    return interactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/**
 * Delete a specific user interaction
 */
export async function deleteUserInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) return;
  const interactionRef = doc(db, 'users', userId, 'interactions', interactionId);
  await deleteDoc(interactionRef);
}

/**
 * Safely retrieve current authenticated user's Firebase ID token
 */
export async function getCurrentUserIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Error fetching Firebase ID token:', error);
    return null;
  }
}

export { onAuthStateChanged };

