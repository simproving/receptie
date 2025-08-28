// Database Manager for IndexedDB operations and local storage
const DBManager = {
    dbName: 'ReceptieDB',
    dbVersion: 1,
    storeName: 'invoices',
    db: null,

    // Initialize the database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Error opening database:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    
                    // Create indexes for efficient querying
                    store.createIndex('supplier', 'supplier', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    
                    console.log('Object store created successfully');
                }
            };
        });
    },

    // Save invoice data to IndexedDB
    async saveInvoice(supplierName, invoiceData) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const invoiceRecord = {
                supplier: supplierName,
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                timestamp: new Date().toISOString(),
                invoiceNumber: invoiceData.invoiceNumber || '',
                invoiceDate: invoiceData.invoiceDate || '',
                products: invoiceData.products || [],
                totalQuantity: invoiceData.totalQuantity || 0,
                totalValue: invoiceData.totalValue || 0
            };
            
            const request = store.add(invoiceRecord);
            
            request.onsuccess = () => {
                console.log('Invoice saved successfully with ID:', request.result);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Error saving invoice:', request.error);
                reject(request.error);
            };
        });
    },

    // Get all invoices
    async getAllInvoices() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Error getting invoices:', request.error);
                reject(request.error);
            };
        });
    },

    // Get invoices by supplier
    async getInvoicesBySupplier(supplier) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('supplier');
            const request = index.getAll(supplier);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Error getting invoices by supplier:', request.error);
                reject(request.error);
            };
        });
    },

    // Get invoices by date
    async getInvoicesByDate(date) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('date');
            const request = index.getAll(date);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Error getting invoices by date:', request.error);
                reject(request.error);
            };
        });
    },

    // Check if invoice with same number already exists
    async checkInvoiceExists(invoiceNumber, supplier) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const existingInvoice = request.result.find(invoice => 
                    invoice.invoiceNumber === invoiceNumber && 
                    invoice.supplier === supplier
                );
                resolve(existingInvoice || null);
            };
            
            request.onerror = () => {
                console.error('Error checking invoice existence:', request.error);
                reject(request.error);
            };
        });
    },

    // Update existing invoice instead of creating duplicate
    async updateInvoice(invoiceId, updatedData) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // First get the existing invoice
            const getRequest = store.get(invoiceId);
            
            getRequest.onsuccess = () => {
                const existingInvoice = getRequest.result;
                if (!existingInvoice) {
                    reject(new Error('Invoice not found'));
                    return;
                }
                
                // Update with new data while preserving the original ID and timestamp
                const updatedInvoice = {
                    ...existingInvoice,
                    ...updatedData,
                    id: existingInvoice.id, // Preserve original ID
                    timestamp: new Date().toISOString() // Update timestamp
                };
                
                // Put the updated invoice
                const putRequest = store.put(updatedInvoice);
                
                putRequest.onsuccess = () => {
                    console.log('Invoice updated successfully');
                    resolve(putRequest.result);
                };
                
                putRequest.onerror = () => {
                    console.error('Error updating invoice:', putRequest.error);
                    reject(putRequest.error);
                };
            };
            
            getRequest.onerror = () => {
                console.error('Error getting invoice for update:', getRequest.error);
                reject(getRequest.error);
            };
        });
    },

    // Delete invoice by ID
    async deleteInvoice(id) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('Invoice deleted successfully');
                resolve();
            };
            
            request.onerror = () => {
                console.error('Error deleting invoice:', request.error);
                reject(request.error);
            };
        });
    },

    // Clear all invoices
    async clearAllInvoices() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('All invoices cleared successfully');
                resolve();
            };
            
            request.onerror = () => {
                console.error('Error clearing invoices:', request.error);
                reject(request.error);
            };
        });
    }
};

// Local Storage Manager for textarea content
const LocalStorageManager = {
    textareaKey: 'bulkInputContent',
    
    // Save textarea content to local storage
    saveTextareaContent(content) {
        try {
            localStorage.setItem(this.textareaKey, content);
            console.log('Textarea content saved to local storage');
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    },
    
    // Load textarea content from local storage
    loadTextareaContent() {
        try {
            const content = localStorage.getItem(this.textareaKey);
            if (content) {
                document.getElementById('bulkInput').value = content;
                console.log('Textarea content loaded from local storage');
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
        }
    },
    
    // Clear textarea content from local storage
    clearTextareaContent() {
        try {
            localStorage.removeItem(this.textareaKey);
            console.log('Textarea content cleared from local storage');
        } catch (error) {
            console.error('Error clearing local storage:', error);
        }
    }
};
