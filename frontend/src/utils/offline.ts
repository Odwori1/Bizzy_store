// Offline capability manager for Bizzy POS
class OfflineManager {
  private dbName = 'BizzyPOSOffline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for offline data
        if (!db.objectStoreNames.contains('pending_sales')) {
          const store = db.createObjectStore('pending_sales', 
            { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('pending_inventory')) {
          const store = db.createObjectStore('pending_inventory', 
            { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cached_products')) {
          const store = db.createObjectStore('cached_products', 
            { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Cache products for offline browsing
  async cacheProducts(products: any[]) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['cached_products'], 'readwrite');
    const store = transaction.objectStore('cached_products');
    
    products.forEach(product => {
      store.put({
        ...product,
        timestamp: Date.now()
      });
    });
  }

  // Get cached products
  async getCachedProducts(): Promise<any[]> {
    if (!this.db) return [];
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cached_products'], 'readonly');
      const store = transaction.objectStore('cached_products');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  // Queue sale for sync when online
  async queueSale(saleData: any) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pending_sales'], 'readwrite');
    const store = transaction.objectStore('pending_sales');
    store.add({
      ...saleData,
      timestamp: Date.now(),
      status: 'pending'
    });
  }

  // Queue inventory update for sync
  async queueInventoryUpdate(updateData: any) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pending_inventory'], 'readwrite');
    const store = transaction.objectStore('pending_inventory');
    store.add({
      ...updateData,
      timestamp: Date.now(),
      status: 'pending'
    });
  }

  // Sync pending operations when online
  async syncPendingOperations() {
    if (!this.db || !navigator.onLine) return;
    
    await this.syncPendingSales();
    await this.syncPendingInventory();
  }

  private async syncPendingSales() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pending_sales'], 'readwrite');
    const store = transaction.objectStore('pending_sales');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const sales = request.result;
      
      for (const sale of sales) {
        try {
          // TODO: Implement API call to sync sale
          console.log('Syncing sale:', sale);
          await this.removePendingSale(sale.id);
        } catch (error) {
          console.error('Failed to sync sale:', sale, error);
        }
      }
    };
  }

  private async syncPendingInventory() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pending_inventory'], 'readwrite');
    const store = transaction.objectStore('pending_inventory');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      const updates = request.result;
      
      for (const update of updates) {
        try {
          // TODO: Implement API call to sync inventory
          console.log('Syncing inventory update:', update);
          await this.removePendingInventory(update.id);
        } catch (error) {
          console.error('Failed to sync inventory:', update, error);
        }
      }
    };
  }

  private async removePendingSale(id: number) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pending_sales'], 'readwrite');
    const store = transaction.objectStore('pending_sales');
    store.delete(id);
  }

  private async removePendingInventory(id: number) {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['pending_inventory'], 'readwrite');
    const store = transaction.objectStore('pending_inventory');
    store.delete(id);
  }
}

export const offlineManager = new OfflineManager();
