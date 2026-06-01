import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  collection,
  writeBatch,
  getDocFromServer
} from "firebase/firestore";

// User's provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASd916xba2C7RfJSNifeuv_gzuQDp-ohU",
  authDomain: "gen-lang-client-0824386898.firebaseapp.com",
  projectId: "gen-lang-client-0824386898",
  storageBucket: "gen-lang-client-0824386898.firebasestorage.app",
  messagingSenderId: "560498468072",
  appId: "1:560498468072:web:cfb3c65432f7296cc3d55d"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Operational Types as per SKILL.md specs
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global error handler specified in SKILL.md
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'local-session', // simplified session context since we are using local employee-db login
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection function as mandated by SKILL.md
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Attempt standard connection test doc lookup
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
    return true;
  } catch (error) {
    console.warn("Firebase offline or initial connection test:", error);
    return false;
  }
}

// Helper to sanitize object data for Firebase (removes undefined attributes)
function sanitizeData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        res[key] = sanitizeData(obj[key]);
      }
    }
    return res;
  }
  return obj;
}

/**
 * Loads a collection from Firestore helper
 */
export async function loadCollectionFromFirebase(collectionName: string): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      items.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

/**
 * Saves or updates a document in Firestore
 */
export async function saveDocToFirebase(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    const clean = sanitizeData(data);
    await setDoc(doc(db, collectionName, docId), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
  }
}

/**
 * Deletes a document from Firestore
 */
export async function deleteDocFromFirebase(collectionName: string, docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
  }
}

/**
 * Batch upload/sync local data to Firebase collections
 */
export async function syncCollectionToFirebase(collectionName: string, localData: any[]): Promise<void> {
  if (!localData || localData.length === 0) return;
  try {
    const batch = writeBatch(db);
    localData.forEach((item) => {
      // Use clean IDs for docs
      const docId = item.id || item.uid;
      if (docId) {
        const clean = sanitizeData(item);
        const ref = doc(db, collectionName, docId);
        batch.set(ref, clean, { merge: true });
      }
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/batch-sync`);
  }
}

/**
 * Sync / Pull all collections from Firestore to localStorage
 */
export async function syncAllFromFirebase(): Promise<void> {
  try {
    console.log("Starting full database pull from Firebase...");
    const users = await loadCollectionFromFirebase("users");
    const tasks = await loadCollectionFromFirebase("tasks");
    const attendance = await loadCollectionFromFirebase("attendance");
    const breaks = await loadCollectionFromFirebase("breaks");
    const expenses = await loadCollectionFromFirebase("expenses");
    const notifications = await loadCollectionFromFirebase("notifications");

    if (users.length > 0) localStorage.setItem("pl_users", JSON.stringify(users));
    if (tasks.length > 0) localStorage.setItem("pl_tasks", JSON.stringify(tasks));
    if (attendance.length > 0) localStorage.setItem("pl_attendance", JSON.stringify(attendance));
    if (breaks.length > 0) localStorage.setItem("pl_breaks", JSON.stringify(breaks));
    if (expenses.length > 0) localStorage.setItem("pl_expenses", JSON.stringify(expenses));
    if (notifications.length > 0) localStorage.setItem("pl_notifications", JSON.stringify(notifications));

    window.dispatchEvent(new Event("storage"));
    console.log("Full pull completed. Local storage successfully updated from Firebase Firestore.");
  } catch (error) {
    console.error("Error drawing database from Firebase:", error);
    throw error;
  }
}

/**
 * Sync / Push all local data from localStorage up to Firestore
 */
export async function syncAllToFirebase(): Promise<void> {
  try {
    console.log("Pushing/migrating local databases up to Firebase Firestore...");
    const users = JSON.parse(localStorage.getItem("pl_users") || "[]");
    const tasks = JSON.parse(localStorage.getItem("pl_tasks") || "[]");
    const attendance = JSON.parse(localStorage.getItem("pl_attendance") || "[]");
    const breaks = JSON.parse(localStorage.getItem("pl_breaks") || "[]");
    const expenses = JSON.parse(localStorage.getItem("pl_expenses") || "[]");
    const notifications = JSON.parse(localStorage.getItem("pl_notifications") || "[]");

    if (users.length > 0) await syncCollectionToFirebase("users", users);
    if (tasks.length > 0) await syncCollectionToFirebase("tasks", tasks);
    if (attendance.length > 0) await syncCollectionToFirebase("attendance", attendance);
    if (breaks.length > 0) await syncCollectionToFirebase("breaks", breaks);
    if (expenses.length > 0) await syncCollectionToFirebase("expenses", expenses);
    if (notifications.length > 0) await syncCollectionToFirebase("notifications", notifications);

    console.log("Local database successfully synced/pushed up to Firebase Firestore!");
  } catch (error) {
    console.error("Error writing full local state to Firebase:", error);
    throw error;
  }
}

// Memory cache to track incremental changes
const cache: { [key: string]: any[] } = {
  users: [],
  tasks: [],
  attendance: [],
  breaks: [],
  expenses: [],
  notifications: []
};

const keyMapping: { [key: string]: string } = {
  users: 'pl_users',
  tasks: 'pl_tasks',
  attendance: 'pl_attendance',
  breaks: 'pl_breaks',
  expenses: 'pl_expenses',
  notifications: 'pl_notifications'
};

// Initializes the tracking cache from local storage values
export function initSyncCache(): void {
  Object.keys(keyMapping).forEach((table) => {
    const localKey = keyMapping[table];
    cache[table] = JSON.parse(localStorage.getItem(localKey) || '[]');
  });
}

// Scans local database arrays and writes changes (creates, updates, deletes) to Firebase Firestore
export async function syncLocalChangesToFirebase(): Promise<void> {
  for (const table of Object.keys(keyMapping)) {
    const localKey = keyMapping[table];
    const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
    const cachedList = cache[table] || [];

    // Identify primary key field
    const getId = (item: any) => (item.id || item.uid || '') as string;

    const localMap = new Map<string, any>(localList.map((item: any) => [getId(item), item]));
    const cachedMap = new Map<string, any>(cachedList.map((item: any) => [getId(item), item]));

    // Find items to add or update
    for (const [id, item] of localMap.entries()) {
      if (!id) continue;
      const cachedItem = cachedMap.get(id);
      if (!cachedItem || JSON.stringify(item) !== JSON.stringify(cachedItem)) {
        await saveDocToFirebase(table, id, item);
      }
    }

    // Find items to delete
    for (const id of cachedMap.keys()) {
      if (!id) continue;
      if (!localMap.has(id)) {
        await deleteDocFromFirebase(table, id);
      }
    }

    // Progress the memory cache forward
    cache[table] = localList;
  }
}
