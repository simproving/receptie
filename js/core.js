// Core application variables and initialization
let isCreatingRow = false;  // Flag to prevent multiple row creations
let currentAvonProducts = null;

// Core utility functions
function getStorageKey() {
    const now = new Date();
    return `avon-temp-${now.toISOString().replace(/[:.]/g, '-')}`;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSupplierRadios();
    initializeTableEventListeners();
    initializeTextareaPersistence();
    loadLastProcessedInvoice();
    
    // Initialize history viewer
    HistoryViewer.init();
    
    // Initial row numbering
    TableManager.renumberRows();
});

// Initialize supplier radio button functionality
function initializeSupplierRadios() {
    const supplierRadios = document.querySelectorAll('input[name="supplier"]');
    const supplierField = document.querySelector('.document-info tr:last-child td:nth-child(4) input');
    
    supplierRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Clear the table when switching suppliers to prevent auto-saving to wrong supplier
            clearTableForSupplierChange();
            
            if (this.value === 'Avon') {
                supplierField.value = 'SC AVON COSMETICS SRL';
            } else if (this.value === 'Outlet') {
                supplierField.value = '';
            } else if (this.value === 'Argint') {
                supplierField.value = '';
            } else if (this.value === 'Cosmetic') {
                supplierField.value = '';
            } else if (this.value === 'Table') {
                supplierField.value = '';
            }
            
            // Don't auto-save immediately after supplier change since table is cleared
            // Auto-save will happen when user starts entering new data
        });
    });
}

// Clear table when switching suppliers to prevent auto-saving to wrong supplier
function clearTableForSupplierChange() {
    try {
        // Clear all existing product rows
        const rows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
        rows.forEach(row => row.remove());
        
        // Clear invoice fields
        const invoiceNumberInput = document.querySelector('.document-info tr:last-child td:nth-child(2) input');
        const invoiceDateInput = document.querySelector('.document-info tr:last-child td:nth-child(3) input');
        
        if (invoiceNumberInput) {
            invoiceNumberInput.value = '';
        }
        if (invoiceDateInput) {
            invoiceDateInput.value = '';
        }
        
        // Reset totals
        const totalCantitateElement = document.getElementById('totalCantitate');
        const totalValoareElement = document.getElementById('totalValoare');
        
        if (totalCantitateElement) {
            totalCantitateElement.value = '0.00';
        }
        if (totalValoareElement) {
            totalValoareElement.value = '0.00';
        }
        
        // Renumber rows and recalculate totals
        TableManager.renumberRows();
        TableManager.recalculateTotals();
        
        console.log('Table cleared for supplier change');
    } catch (error) {
        console.error('Error clearing table for supplier change:', error);
    }
}

// Initialize textarea persistence functionality
function initializeTextareaPersistence() {
    const textarea = document.getElementById('bulkInput');
    
    // Load saved content when page loads
    LocalStorageManager.loadTextareaContent();
    
    // Save content to local storage when textarea changes
    textarea.addEventListener('input', function() {
        LocalStorageManager.saveTextareaContent(this.value);
    });
    
    // Save content when textarea loses focus
    textarea.addEventListener('blur', function() {
        LocalStorageManager.saveTextareaContent(this.value);
    });
}

// Initialize table event listeners
function initializeTableEventListeners() {
    // Setup event listeners for all existing rows
    const rows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
    rows.forEach(row => {
        TableManager.setupRowEventListeners(row);
    });

    // Setup event listeners for the empty row
    const emptyRow = document.getElementById('emptyRow');
    TableManager.setupRowEventListeners(emptyRow);
    emptyRow.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', TableManager.checkEmptyRow);
    });

    // Setup auto-save for document info fields
    initializeDocumentInfoAutoSave();

    // Setup auto-save for total row inputs
    TableManager.setupTotalRowEventListeners();
}

// Initialize auto-save for document info fields
function initializeDocumentInfoAutoSave() {
    const documentInfoInputs = document.querySelectorAll('.document-info input');
    
    documentInfoInputs.forEach(input => {
        // Add blur event listener for auto-save
        input.addEventListener('blur', function() {
            // Small delay to ensure the value is updated
            setTimeout(() => {
                TableManager.autoSaveInvoice();
            }, 100);
        });
    });
}

// Function to save invoice data to IndexedDB
async function saveInvoiceToDatabase(supplierName) {
    try {
        // Get current invoice data
        const invoiceNumber = document.querySelector('.document-info tr:last-child td:nth-child(2) input').value;
        const invoiceDate = document.querySelector('.document-info tr:last-child td:nth-child(3) input').value;
        const products = await getCurrentProducts();
        const totalQuantity = parseFloat(document.getElementById('totalCantitate').value || '0');
        const totalValue = parseFloat(document.getElementById('totalValoare').value || '0');
        const numberOfRows = products.length;
        
        // Check for duplicates using multiple criteria
        const duplicateInvoice = await checkForDuplicateInvoice(
            supplierName, 
            invoiceNumber, 
            invoiceDate, 
            numberOfRows, 
            totalQuantity, 
            totalValue
        );
        
        if (duplicateInvoice) {
            console.log('Duplicate invoice detected, updating existing invoice with ID:', duplicateInvoice.id);
            
            // Automatically update existing invoice
            const updatedData = {
                date: new Date().toISOString().split('T')[0],
                invoiceDate: invoiceDate,
                products: products,
                totalQuantity: totalQuantity,
                totalValue: totalValue
            };
            
            const result = await DBManager.updateInvoice(duplicateInvoice.id, updatedData);
            console.log('Invoice updated in database with ID:', result);
            return { action: 'updated', id: result };
        }
        
        const invoiceData = {
            invoiceNumber,
            invoiceDate,
            products,
            totalQuantity: totalQuantity,
            totalValue: totalValue
        };
        
        // Save new invoice to IndexedDB
        const result = await DBManager.saveInvoice(supplierName, invoiceData);
        console.log('New invoice saved to database with ID:', result);
        
        return { action: 'saved', id: result };
    } catch (error) {
        console.error('Error saving invoice to database:', error);
        throw error;
    }
}

// Enhanced duplicate detection function
async function checkForDuplicateInvoice(supplierName, invoiceNumber, invoiceDate, numberOfRows, totalQuantity, totalValue) {
    try {
        // Get all invoices for this supplier
        const existingInvoices = await DBManager.getInvoicesBySupplier(supplierName);
        
        // Check for exact duplicates using multiple criteria
        for (const invoice of existingInvoices) {
            let matchCount = 0;
            let totalCriteria = 0;
            
            // Check invoice number (if both have values)
            if (invoiceNumber && invoiceNumber.trim() && invoice.invoiceNumber && invoice.invoiceNumber.trim()) {
                totalCriteria++;
                if (invoiceNumber.trim() === invoice.invoiceNumber.trim()) {
                    matchCount++;
                }
            }
            
            // Check invoice date (if both have values)
            if (invoiceDate && invoiceDate.trim() && invoice.invoiceDate && invoice.invoiceDate.trim()) {
                totalCriteria++;
                if (invoiceDate.trim() === invoice.invoiceDate.trim()) {
                    matchCount++;
                }
            }
            
            // Check number of rows
            totalCriteria++;
            if (numberOfRows === (invoice.products ? invoice.products.length : 0)) {
                matchCount++;
            }
            
            // Check total quantity (with small tolerance for floating point differences)
            totalCriteria++;
            if (Math.abs(totalQuantity - (invoice.totalQuantity || 0)) < 0.01) {
                matchCount++;
            }
            
            // Check total value (with small tolerance for floating point differences)
            totalCriteria++;
            if (Math.abs(totalValue - (invoice.totalValue || 0)) < 0.01) {
                matchCount++;
            }
            
            // Consider it a duplicate if most criteria match
            // For invoices with number and date: need at least 4/5 matches
            // For invoices without number or date: need at least 3/3 matches for the remaining criteria
            const requiredMatches = totalCriteria >= 4 ? Math.ceil(totalCriteria * 0.8) : totalCriteria;
            
            if (matchCount >= requiredMatches && matchCount >= 3) {
                console.log(`Duplicate detected: ${matchCount}/${totalCriteria} criteria matched for invoice ID ${invoice.id}`);
                return invoice;
            }
        }
        
        return null; // No duplicate found
    } catch (error) {
        console.error('Error checking for duplicate invoice:', error);
        return null; // On error, assume no duplicate to avoid blocking saves
    }
}

// Helper function to get current products from table
async function getCurrentProducts() {
    const productRows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
    const products = [];
    
    productRows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 12) {
            const product = {
                name: cells[1].querySelector('input, textarea')?.value || '',
                symbol: cells[2].textContent || '',
                unit: cells[3].textContent || '',
                quantity: cells[4].querySelector('input')?.value || '',
                priceWithoutVAT: cells[5].querySelector('input')?.value || '',
                valueWithoutVAT: cells[6].querySelector('input')?.value || '',
                deductibleVAT: cells[7].querySelector('input')?.value || '',
                valueWithVAT: cells[8].querySelector('input')?.value || '',
                sellingPrice: cells[9].querySelector('input')?.value || '',
                valueAtSellingPrice: cells[10].querySelector('input')?.value || '',
                commercialMarkup: cells[11].querySelector('input')?.value || ''
            };
            
            // Debug logging
            console.log(`Product ${index + 1}:`, product);
            
            products.push(product);
        }
    });
    
    return products;
}

// Load the last processed invoice into the table
async function loadLastProcessedInvoice() {
    try {
        const invoices = await DBManager.getAllInvoices();
        
        if (invoices.length > 0) {
            // Sort by timestamp (newest first) and get the most recent
            invoices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const lastInvoice = invoices[0];
            
            // Load the last invoice into the form
            await loadInvoiceToForm(lastInvoice.id);
            
            console.log('Last processed invoice loaded:', lastInvoice.invoiceNumber);
        }
    } catch (error) {
        console.error('Error loading last processed invoice:', error);
        // Don't show error to user - this is a background operation
    }
}

// Load a specific invoice into the form by ID
async function loadInvoiceToForm(invoiceId) {
    try {
        const invoices = await DBManager.getAllInvoices();
        const invoice = invoices.find(inv => inv.id === invoiceId);
        
        if (!invoice) {
            console.error('Invoice not found with ID:', invoiceId);
            return false;
        }
        
        // Set supplier radio button
        const supplierRadios = document.querySelectorAll('input[name="supplier"]');
        supplierRadios.forEach(radio => {
            if (radio.value === invoice.supplier) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        });
        
        // Set invoice fields
        document.querySelector('.document-info tr:last-child td:nth-child(2) input').value = invoice.invoiceNumber || '';
        document.querySelector('.document-info tr:last-child td:nth-child(3) input').value = invoice.invoiceDate || '';
        
        // Clear existing rows
        const rows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
        rows.forEach(row => row.remove());
        
        // Add product rows
        if (invoice.products) {
            invoice.products.forEach(product => {
                TableManager.loadProductRow(product);
            });
        }
        
        // Renumber rows and recalculate totals
        TableManager.renumberRows();
        TableManager.recalculateTotals();
        
        console.log('Invoice loaded into form:', invoice.invoiceNumber);
        return true;
        
    } catch (error) {
        console.error('Error loading invoice to form:', error);
        return false;
    }
}
