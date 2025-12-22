import { openDB } from 'idb';

const DB_NAME = 'hb_go_db';
const STORE_TRANSACTIONS = 'transactions';
const STORE_SETTINGS = 'settings';
const STORE_CACHE = 'cache';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
    db.createObjectStore(STORE_SETTINGS); // Key-value store
    db.createObjectStore(STORE_CACHE);    // Key-value store
  },
});

export const storageService = {
  getTransactions: async () => {
    return (await dbPromise).getAll(STORE_TRANSACTIONS);
  },

  getTransaction: async (id) => {
    return (await dbPromise).get(STORE_TRANSACTIONS, id);
  },

  saveTransaction: async (transaction) => {
    if (!transaction.id) {
        transaction.id = Date.now().toString();
    }
    await (await dbPromise).put(STORE_TRANSACTIONS, transaction);
    return transaction;
  },

  deleteTransaction: async (id) => {
    await (await dbPromise).delete(STORE_TRANSACTIONS, id);
  },

  getSettings: async () => {
    const settings = await (await dbPromise).get(STORE_SETTINGS, 'user_settings');
    const defaults = {
        defaultTag: 'mobile-import',
        ai_preference: 'local',
        local_model_choice: 'onnx-community/PaliGemma-3b-ft-en-receipts-onnx',
        auto_fallback: true
    };
    return { ...defaults, ...(settings || {}) };
  },

  saveSettings: async (settings) => {
    await (await dbPromise).put(STORE_SETTINGS, settings, 'user_settings');
  },

  saveCache: async (data) => {
    await (await dbPromise).put(STORE_CACHE, data, 'import_cache');
  },

  getCache: async () => {
    const data = await (await dbPromise).get(STORE_CACHE, 'import_cache');
    return data || { categories: [], accounts: [], payees: [] };
  },

  clearAll: async () => {
      const db = await dbPromise;
      await db.clear(STORE_TRANSACTIONS);
      await db.clear(STORE_SETTINGS);
      await db.clear(STORE_CACHE);
  },

  clearTransactions: async () => {
      const db = await dbPromise;
      await db.clear(STORE_TRANSACTIONS);
  }
};
