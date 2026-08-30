import type { Collection, MediaItem } from "../types";

const DB_NAME = "svetopis-media";
const DB_VERSION = 2;
const MEDIA = "media";
const COLLECTIONS = "collections";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MEDIA)) {
        db.createObjectStore(MEDIA, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(COLLECTIONS)) {
        db.createObjectStore(COLLECTIONS, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB недоступна"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function dbGetAll(): Promise<MediaItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(MEDIA, "readonly").objectStore(MEDIA).getAll();
    req.onsuccess = () => resolve(req.result as MediaItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(item: MediaItem): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(MEDIA, "readwrite");
  tx.objectStore(MEDIA).put(item);
  await txDone(tx);
}

export async function dbDelete(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(MEDIA, "readwrite");
  tx.objectStore(MEDIA).delete(id);
  await txDone(tx);
}

export async function dbGetCollections(): Promise<Collection[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(COLLECTIONS, "readonly").objectStore(COLLECTIONS).getAll();
    req.onsuccess = () => resolve(req.result as Collection[]);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPutCollection(col: Collection): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(COLLECTIONS, "readwrite");
  tx.objectStore(COLLECTIONS).put(col);
  await txDone(tx);
}

export async function dbDeleteCollection(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(COLLECTIONS, "readwrite");
  tx.objectStore(COLLECTIONS).delete(id);
  await txDone(tx);
}
