// Inventory management functionality
const InventoryManager = {
    
    sendToInventory: function() {
        if (!currentAvonProducts) {
            alert('Nu există produse de trimis la inventar!');
            return;
        }

        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(currentAvonProducts));
        console.log(`Saved ${currentAvonProducts.products.length} products to localStorage with key: ${storageKey}`);
        
        // Clear the temporary storage and hide the button
        currentAvonProducts = null;
        document.getElementById('sendToInventory').style.display = 'none';
        
        // Show success message
        const statusElement = document.getElementById('processingStatus');
        statusElement.textContent = 'Produse trimise cu succes la inventar!';
        statusElement.className = 'text-success';
        
        // Clear the status message after 3 seconds
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'text-muted';
        }, 3000);
    }
};

// Global function for backwards compatibility with inline event handlers
function sendToInventory() {
    InventoryManager.sendToInventory();
}
