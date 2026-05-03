import type { StoredImageAssetMeta, ImageAssetKind } from "./image-session-types";

const DB_NAME = "easyportal-image-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

export type StoredImageAsset = StoredImageAssetMeta & {
  blob: Blob;
};

function openImageAssetDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
        store.createIndex("kind", "kind", { unique: false });
      }
    };
  });
}

export async function saveImageAsset(params: {
  id: string;
  sessionId: string;
  kind: ImageAssetKind;
  mimeType: string;
  blob: Blob;
  width?: number;
  height?: number;
}): Promise<void> {
  const db = await openImageAssetDb();

  const asset: StoredImageAsset = {
    id: params.id,
    sessionId: params.sessionId,
    kind: params.kind,
    mimeType: params.mimeType,
    blob: params.blob,
    width: params.width,
    height: params.height ?? 0,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(asset);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getImageAsset(id: string): Promise<StoredImageAsset | null> {
  const db = await openImageAssetDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve((request.result as StoredImageAsset | undefined) ?? null);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteImageAsset(id: string): Promise<void> {
  const db = await openImageAssetDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAssetsBySessionId(sessionId: string): Promise<StoredImageAsset[]> {
  const db = await openImageAssetDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index("sessionId");
    const request = index.getAll(sessionId);

    request.onsuccess = () => {
      resolve((request.result as StoredImageAsset[]) ?? []);
    };

    request.onerror = () => reject(request.error);
  });
}