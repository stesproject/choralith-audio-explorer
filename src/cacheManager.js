/**
 * Cache manager for audio file metadata using IndexedDB
 */

const DB_NAME = "ChoralithAudioCache";
const DB_VERSION = 1;
const STORE_NAME = "folderCache";

/**
 * Open IndexedDB connection
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "folderPath" });
            }
        };
    });
}

/**
 * Generate a cache key from folder path
 */
function getCacheKey(folderPath) {
    return folderPath;
}

/**
 * Get cached data for a folder
 */
export async function getCachedTracks(folderPath) {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const key = getCacheKey(folderPath);

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                if (result && result.tracks && result.fileStats) {
                    resolve({
                        tracks: result.tracks,
                        fileStats: result.fileStats,
                        cachedAt: result.cachedAt,
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error getting cached tracks:", error);
        return null;
    }
}

/**
 * Save scanned tracks to cache
 */
export async function cacheTracks(folderPath, tracks, fileStats) {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const key = getCacheKey(folderPath);

        const data = {
            folderPath: key,
            tracks,
            fileStats,
            cachedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error caching tracks:", error);
    }
}

/**
 * Clear cache for a specific folder
 */
export async function clearFolderCache(folderPath) {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const key = getCacheKey(folderPath);

        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error clearing cache:", error);
    }
}

/**
 * Clear all cache
 */
export async function clearAllCache() {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("Error clearing all cache:", error);
    }
}
