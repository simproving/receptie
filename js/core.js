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
    
    // Initial row numbering
    TableManager.renumberRows();
});

// Initialize supplier radio button functionality
function initializeSupplierRadios() {
    const supplierRadios = document.querySelectorAll('input[name="supplier"]');
    const supplierField = document.querySelector('.document-info tr:last-child td:nth-child(4) input');
    
    supplierRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'Avon') {
                supplierField.value = 'SC AVON COSMETICS SRL';
            } else if (this.value === 'Outlet') {
                supplierField.value = '';
            } else if (this.value === 'Argint') {
                supplierField.value = '';
            }
        });
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
}
