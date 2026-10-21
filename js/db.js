const DB_NAME = 'LabBookingDB';
const DB_VERSION = 1;

/** @type {IDBDatabase | null} */
let dbInstance = null;

/**
 * Initializes and returns the IndexedDB instance.
 * @returns {Promise<IDBDatabase>}
 */
export async function getDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('rooms')) {
        db.createObjectStore('rooms', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bookings')) {
        const bookingStore = db.createObjectStore('bookings', { keyPath: 'id' });
        bookingStore.createIndex('room_id', 'room_id', { unique: false });
        bookingStore.createIndex('booking_date', 'booking_date', { unique: false });
        bookingStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB Error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Helper to perform a transaction
 * @param {string} storeName 
 * @param {'readonly' | 'readwrite'} mode 
 * @returns {Promise<IDBObjectStore>}
 */
async function getStore(storeName, mode = 'readonly') {
  const db = await getDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

export const db = {
  async getAll(storeName) {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getById(storeName, id) {
    const store = await getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, item) {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, id) {
    const store = await getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  async count(storeName) {
      const store = await getStore(storeName);
      return new Promise((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
      });
  }
};

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
