// Invoice History Viewer Module
const HistoryViewer = {
    isVisible: false,
    
    // Initialize the history viewer
    init() {
        this.createHistoryModal();
        this.setupEventListeners();
    },
    
    // Create the history modal HTML
    createHistoryModal() {
        const modalHTML = `
            <div id="historyModal" class="modal fade" tabindex="-1" aria-labelledby="historyModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="historyModalLabel">Istoricul Facturilor</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Search and Filter Controls -->
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="supplierFilter" class="form-label">Furnizor:</label>
                                    <select class="form-select" id="supplierFilter">
                                        <option value="">Toti furnizorii</option>
                                        <option value="Avon">Avon</option>
                                        <option value="Outlet">Outlet</option>
                                        <option value="Argint">Argint</option>
                                        <option value="Cosmetic">Cosmetic</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="dateFilter" class="form-label">Data:</label>
                                    <input type="date" class="form-select" id="dateFilter">
                                </div>
                                <div class="col-md-4">
                                    <label for="searchFilter" class="form-label">Căutare:</label>
                                    <input type="text" class="form-control" id="searchFilter" placeholder="Număr factură, produse...">
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <button type="button" class="btn btn-primary" onclick="HistoryViewer.refreshHistory()">
                                        <i class="bi bi-arrow-clockwise"></i> Actualizează
                                    </button>
                                    <button type="button" class="btn btn-danger" onclick="HistoryViewer.clearAllHistory()">
                                        <i class="bi bi-trash"></i> Șterge tot istoricul
                                    </button>
                                </div>
                                <div class="col-md-6 text-end">
                                    <span id="invoiceCount" class="badge bg-secondary">0 facturi</span>
                                </div>
                            </div>
                            
                            <!-- History Table -->
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>Data</th>
                                            <th>Furnizor</th>
                                            <th>Nr. Factură</th>
                                            <th>Data Factură</th>
                                            <th>Produse</th>
                                            <th>Total Cantitate</th>
                                            <th>Total Valoare</th>
                                            <th>Acțiuni</th>
                                        </tr>
                                    </thead>
                                    <tbody id="historyTableBody">
                                        <!-- Invoice rows will be populated here -->
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- No Results Message -->
                            <div id="noResultsMessage" class="text-center text-muted py-4" style="display: none;">
                                <i class="bi bi-inbox fs-1"></i>
                                <p class="mt-2">Nu s-au găsit facturi care să corespundă criteriilor de căutare.</p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Închide</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Invoice Detail Modal -->
            <div id="invoiceDetailModal" class="modal fade" tabindex="-1" aria-labelledby="invoiceDetailModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="invoiceDetailModalLabel">Detalii Factură</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="invoiceDetailBody">
                            <!-- Invoice details will be populated here -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="HistoryViewer.loadInvoiceToForm()">Încarcă în formular</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Închide</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body if it doesn't exist
        if (!document.getElementById('historyModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Filter change events
        document.getElementById('supplierFilter')?.addEventListener('change', () => this.filterHistory());
        document.getElementById('dateFilter')?.addEventListener('change', () => this.filterHistory());
        document.getElementById('searchFilter')?.addEventListener('input', () => this.filterHistory());
    },
    
    // Show the history modal
    async show() {
        if (!this.isVisible) {
            this.isVisible = true;
            await this.refreshHistory();
            const modal = new bootstrap.Modal(document.getElementById('historyModal'));
            modal.show();
            
            // Hide modal when closed
            document.getElementById('historyModal').addEventListener('hidden.bs.modal', () => {
                this.isVisible = false;
            });
        }
    },
    
    // Refresh the history data
    async refreshHistory() {
        try {
            const invoices = await DBManager.getAllInvoices();
            this.displayInvoices(invoices);
            this.updateInvoiceCount(invoices.length);
        } catch (error) {
            console.error('Error refreshing history:', error);
            this.showError('Eroare la încărcarea istoricului: ' + error.message);
        }
    },
    
    // Display invoices in the table
    displayInvoices(invoices) {
        const tbody = document.getElementById('historyTableBody');
        const noResultsMessage = document.getElementById('noResultsMessage');
        
        if (!tbody) return;
        
        if (invoices.length === 0) {
            tbody.innerHTML = '';
            noResultsMessage.style.display = 'block';
            return;
        }
        
        noResultsMessage.style.display = 'none';
        
        // Sort invoices by date (newest first)
        invoices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        tbody.innerHTML = invoices.map(invoice => `
            <tr data-invoice-id="${invoice.id}">
                <td>${this.formatDate(invoice.date)}</td>
                <td><span class="badge bg-primary">${invoice.supplier}</span></td>
                <td>${invoice.invoiceNumber || '-'}</td>
                <td>${invoice.invoiceDate || '-'}</td>
                <td>${invoice.products ? invoice.products.length : 0} produse</td>
                <td>${invoice.totalQuantity || 0}</td>
                <td>${this.formatCurrency(invoice.totalValue || 0)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="HistoryViewer.viewInvoiceDetails(${invoice.id})">
                        <i class="bi bi-eye"></i> Vezi
                    </button>
                    <button class="btn btn-sm btn-outline-success" onclick="HistoryViewer.loadInvoiceToForm(${invoice.id})">
                        <i class="bi bi-arrow-clockwise"></i> Încarcă
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="HistoryViewer.deleteInvoice(${invoice.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    // Filter history based on current filters
    async filterHistory() {
        const supplierFilter = document.getElementById('supplierFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        
        try {
            let invoices = await DBManager.getAllInvoices();
            
            // Apply filters
            invoices = invoices.filter(invoice => {
                // Supplier filter
                if (supplierFilter && invoice.supplier !== supplierFilter) return false;
                
                // Date filter
                if (dateFilter && invoice.date !== dateFilter) return false;
                
                // Search filter
                if (searchFilter) {
                    const searchText = `${invoice.invoiceNumber} ${invoice.invoiceDate} ${invoice.supplier}`.toLowerCase();
                    const productNames = invoice.products ? invoice.products.map(p => p.name).join(' ').toLowerCase() : '';
                    if (!searchText.includes(searchFilter) && !productNames.includes(searchFilter)) {
                        return false;
                    }
                }
                
                return true;
            });
            
            this.displayInvoices(invoices);
            this.updateInvoiceCount(invoices.length);
        } catch (error) {
            console.error('Error filtering history:', error);
        }
    },
    
    // View invoice details
    async viewInvoiceDetails(invoiceId) {
        try {
            const invoices = await DBManager.getAllInvoices();
            const invoice = invoices.find(inv => inv.id === invoiceId);
            
            if (!invoice) {
                this.showError('Factura nu a fost găsită.');
                return;
            }
            
            this.displayInvoiceDetails(invoice);
            const modal = new bootstrap.Modal(document.getElementById('invoiceDetailModal'));
            modal.show();
        } catch (error) {
            console.error('Error viewing invoice details:', error);
            this.showError('Eroare la afișarea detaliilor facturii.');
        }
    },
    
    // Display invoice details in modal
    displayInvoiceDetails(invoice) {
        const detailBody = document.getElementById('invoiceDetailBody');
        
        const productsHTML = invoice.products ? invoice.products.map(product => `
            <tr>
                <td>${product.name || '-'}</td>
                <td>${product.quantity || '-'}</td>
                <td>${this.formatCurrency(product.priceWithoutVAT || 0)}</td>
                <td>${this.formatCurrency(product.valueWithoutVAT || 0)}</td>
                <td>${this.formatCurrency(product.valueWithVAT || 0)}</td>
            </tr>
        `).join('') : '';
        
        detailBody.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Furnizor:</strong> ${invoice.supplier}
                </div>
                <div class="col-md-6">
                    <strong>Data procesare:</strong> ${this.formatDate(invoice.date)}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Număr factură:</strong> ${invoice.invoiceNumber || '-'}
                </div>
                <div class="col-md-6">
                    <strong>Data factură:</strong> ${invoice.invoiceDate || '-'}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Total cantitate:</strong> ${invoice.totalQuantity || 0}
                </div>
                <div class="col-md-6">
                    <strong>Total valoare:</strong> ${this.formatCurrency(invoice.totalValue || 0)}
                </div>
            </div>
            
            <h6 class="mt-4">Produse:</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Denumire</th>
                            <th>Cantitate</th>
                            <th>Preț fără TVA</th>
                            <th>Valoare fără TVA</th>
                            <th>Valoare cu TVA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsHTML}
                    </tbody>
                </table>
            </div>
        `;
        
        // Store current invoice for loading
        this.currentInvoice = invoice;
    },
    
    // Load invoice into the main form
    async loadInvoiceToForm(invoiceId) {
        try {
            console.log('Starting to load invoice with ID:', invoiceId);
            const invoices = await DBManager.getAllInvoices();
            console.log('Retrieved invoices:', invoices.length);
            
            const invoice = invoices.find(inv => inv.id === invoiceId);
            console.log('Found invoice:', invoice ? invoice.id : 'not found');
            
            if (!invoice) {
                this.showError('Factura nu a fost găsită.');
                return;
            }
            
            console.log('Invoice data:', {
                id: invoice.id,
                supplier: invoice.supplier,
                invoiceNumber: invoice.invoiceNumber,
                productsCount: invoice.products ? invoice.products.length : 0
            });
            
            // Set supplier radio button
            try {
                const supplierRadios = document.querySelectorAll('input[name="supplier"]');
                supplierRadios.forEach(radio => {
                    if (radio.value === invoice.supplier) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                });
            } catch (supplierError) {
                console.error('Error setting supplier:', supplierError);
                // Continue execution even if supplier setting fails
            }
            
            // Set invoice fields
            try {
                const invoiceNumberInput = document.querySelector('.document-info tr:last-child td:nth-child(2) input');
                const invoiceDateInput = document.querySelector('.document-info tr:last-child td:nth-child(3) input');
                
                if (invoiceNumberInput) {
                    invoiceNumberInput.value = invoice.invoiceNumber || '';
                }
                if (invoiceDateInput) {
                    invoiceDateInput.value = invoice.invoiceDate || '';
                }
            } catch (fieldError) {
                console.error('Error setting invoice fields:', fieldError);
                // Continue execution even if field setting fails
            }
            
            // Clear existing rows
            try {
                const rows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
                rows.forEach(row => row.remove());
            } catch (clearError) {
                console.error('Error clearing existing rows:', clearError);
                // Continue execution even if row clearing fails
            }
            
            // Add product rows
            if (invoice.products) {
                console.log('Loading products:', invoice.products.length);
                invoice.products.forEach((product, index) => {
                    try {
                        console.log(`Loading product ${index}:`, product);
                        TableManager.loadProductRow(product);
                        console.log(`Product ${index} loaded successfully`);
                    } catch (productError) {
                        console.error(`Error loading product ${index}:`, productError);
                        console.error('Product data:', product);
                        // Continue loading other products even if one fails
                    }
                });
            } else {
                console.log('No products found in invoice');
            }
            
            // Renumber rows and recalculate totals
            try {
                TableManager.renumberRows();
                TableManager.recalculateTotals();
            } catch (calculationError) {
                console.error('Error during row operations:', calculationError);
                // Continue execution even if calculations fail
            }
            
            // Close modals safely
            try {
                const detailModal = bootstrap.Modal.getInstance(document.getElementById('invoiceDetailModal'));
                if (detailModal) {
                    detailModal.hide();
                }
                const historyModal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
                if (historyModal) {
                    historyModal.hide();
                }
            } catch (modalError) {
                console.warn('Modal closing warning:', modalError);
                // Continue execution even if modal closing fails
            }
            
            // Show success message
            console.log('Invoice loading completed successfully');
            this.showSuccess('Factura a fost încărcată cu succes în formular!');
            
        } catch (error) {
            console.error('Error loading invoice to form:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                invoiceId: invoiceId
            });
            this.showError('Eroare la încărcarea facturii în formular: ' + error.message);
        }
    },
    
    // Delete an invoice
    async deleteInvoice(invoiceId) {
        if (confirm('Sigur doriți să ștergeți această factură din istoric?')) {
            try {
                await DBManager.deleteInvoice(invoiceId);
                await this.refreshHistory();
                this.showSuccess('Factura a fost ștearsă cu succes!');
            } catch (error) {
                console.error('Error deleting invoice:', error);
                this.showError('Eroare la ștergerea facturii.');
            }
        }
    },
    
    // Clear all history
    async clearAllHistory() {
        if (confirm('Sigur doriți să ștergeți tot istoricul? Această acțiune nu poate fi anulată!')) {
            try {
                await DBManager.clearAllInvoices();
                await this.refreshHistory();
                this.showSuccess('Tot istoricul a fost șters cu succes!');
            } catch (error) {
                console.error('Error clearing history:', error);
                this.showError('Eroare la ștergerea istoricului.');
            }
        }
    },
    
    // Update invoice count display
    updateInvoiceCount(count) {
        const countElement = document.getElementById('invoiceCount');
        if (countElement) {
            countElement.textContent = `${count} factur${count === 1 ? 'ă' : 'i'}`;
        }
    },
    
    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ro-RO');
    },
    
    // Format currency for display
    formatCurrency(amount) {
        if (amount === 0 || !amount) return '0.00';
        return parseFloat(amount).toFixed(2) + ' LEI';
    },
    
    // Show success message
    showSuccess(message) {
        this.showToast(message, 'success');
    },
    
    // Show error message
    showError(message) {
        this.showToast(message, 'error');
    },
    
    // Show toast notification
    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());
        
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            `;
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            border-radius: 4px;
            padding: 12px 16px;
            margin-bottom: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        // Add icon
        const icon = document.createElement('span');
        icon.innerHTML = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
        icon.style.fontSize = '16px';
        icon.style.fontWeight = 'bold';
        
        // Add message
        const messageText = document.createElement('span');
        messageText.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: inherit;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            margin-left: auto;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.7;
        `;
        closeBtn.onclick = () => this.removeToast(toast);
        
        // Assemble toast
        toast.appendChild(icon);
        toast.appendChild(messageText);
        toast.appendChild(closeBtn);
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            this.removeToast(toast);
        }, 5000);
    },
    
    // Remove toast with animation
    removeToast(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Global function for backwards compatibility
function showInvoiceHistory() {
    HistoryViewer.show();
}
