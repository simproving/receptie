// Table management functionality
const TableManager = {
    
    deleteRow: function(button) {
        const row = button.closest('tr');
        row.remove();
        this.renumberRows();
        this.recalculateTotals();
    },

    renumberRows: function() {
        const rows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
        rows.forEach((row, index) => {
            const firstCell = row.cells[0];
            const deleteButton = firstCell.querySelector('.delete-row');
            
            // Clear the cell completely first
            firstCell.innerHTML = '';
            
            // Add row number as text content
            const numSpan = document.createElement('span');
            numSpan.className = 'row-number';
            numSpan.textContent = (index + 1);
            firstCell.appendChild(numSpan);
            
            // Append delete button if it exists
            if (deleteButton) {
                firstCell.appendChild(deleteButton);
            } else {
                // Create a new delete button if it doesn't exist
                const newDeleteButton = document.createElement('button');
                newDeleteButton.type = 'button';
                newDeleteButton.className = 'delete-row';
                newDeleteButton.innerHTML = '×';
                newDeleteButton.onclick = function() { TableManager.deleteRow(this); };
                firstCell.appendChild(newDeleteButton);
            }
        });
    },

    calculateRowTotal: function(row) {
        const quantity = parseFloat(row.querySelector('td:nth-child(5) input').value) || 0;
        const unitPrice = parseFloat(row.querySelector('td:nth-child(10) input').value) || 0;
        const totalPrice = quantity * unitPrice;
        row.querySelector('td:nth-child(11) input').value = totalPrice.toFixed(2);
        this.recalculateTotals();
    },

    setupRowEventListeners: function(row) {
        const quantityInput = row.querySelector('td:nth-child(5) input');
        const unitPriceInput = row.querySelector('td:nth-child(10) input');
        
        // Remove existing event listeners if any
        quantityInput.removeEventListener('input', () => this.calculateRowTotal(row));
        unitPriceInput.removeEventListener('input', () => this.calculateRowTotal(row));
        
        // Add new event listeners
        quantityInput.addEventListener('input', () => this.calculateRowTotal(row));
        unitPriceInput.addEventListener('input', () => this.calculateRowTotal(row));
    },

    createEmptyRow: function() {
        const totalRow = document.getElementById('totalRow');
        const emptyRow = document.getElementById('emptyRow');
        const newRow = emptyRow.cloneNode(true);
        
        // Clear all input values in the new row
        newRow.querySelectorAll('input').forEach(input => {
            input.value = '';
        });
        
        // Transfer the emptyRow ID to the new row
        newRow.id = 'emptyRow';
        emptyRow.id = '';
        
        // Insert the new row before the total row
        totalRow.parentNode.insertBefore(newRow, totalRow);
        
        // Add event listeners to the new row's inputs
        newRow.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', this.checkEmptyRow);
        });

        // Setup event listeners for total calculation
        this.setupRowEventListeners(newRow);

        // Renumber rows after adding new row
        this.renumberRows();
    },

    checkEmptyRow: function(event) {
        const emptyRow = document.getElementById('emptyRow');
        const hasData = Array.from(emptyRow.querySelectorAll('input')).some(input => input.value.trim() !== '');
        
        if (hasData) {
            TableManager.createEmptyRow();
        }
    },

    recalculateTotals: function() {
        const rows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
        let totalCantitate = 0;
        let totalValoare = 0;

        rows.forEach(row => {
            const cantitate = parseFloat(row.querySelector('td:nth-child(5) input').value) || 0;
            const valoare = parseFloat(row.querySelector('td:nth-child(11) input').value) || 0;
            
            totalCantitate += cantitate;
            totalValoare += valoare;
        });

        document.getElementById('totalCantitate').value = totalCantitate.toFixed(2);
        document.getElementById('totalValoare').value = totalValoare.toFixed(2);
    },

    addProductRow: function(nume, bucati, pretUnitar, pretTotal) {
        const emptyRow = document.getElementById('emptyRow');
        
        // Create a new table row
        const newRow = document.createElement('tr');
        newRow.className = 'data-row';
        
        // Copy the cells from the empty row
        for (let i = 0; i < emptyRow.cells.length; i++) {
            const newCell = document.createElement('td');
            
            // First cell (row number) - just add a span for the number
            if (i === 0) {
                newCell.innerHTML = '';
                // Delete button is added later by renumberRows()
            } 
            // Second cell (name) - use textarea only if description is long
            else if (i === 1) {
                newCell.style.textAlign = 'left';
                let inputElement;
                
                if (nume.length > 70) {
                    inputElement = document.createElement('textarea');
                    inputElement.style.resize = 'none';
                    inputElement.style.overflow = 'hidden';
                    inputElement.style.height = '20px';
                } else {
                    inputElement = document.createElement('input');
                    inputElement.type = 'text';
                }
                
                inputElement.style.width = '100%';
                inputElement.style.border = 'none';
                inputElement.style.fontSize = '10px';
                inputElement.style.lineHeight = '1.1';
                inputElement.style.padding = '0';
                inputElement.style.margin = '0';
                inputElement.style.backgroundColor = 'transparent';
                newCell.appendChild(inputElement);
            }
            // Fixed cells (symbol and U/M)
            else if (i === 2) {
                newCell.textContent = 'b';
            }
            else if (i === 3) {
                newCell.textContent = '1';
            }
            // All other cells - add inputs
            else {
                const input = document.createElement('input');
                input.type = 'text';
                newCell.appendChild(input);
            }
            
            newRow.appendChild(newCell);
        }

        const isAvon = document.getElementById('avonSupplier').checked;
        const isOutlet = document.getElementById('outletSupplier').checked;
        const isArgint = document.getElementById('argintSupplier').checked;
        
        if (isAvon) {
            // Set the values for Avon
            newRow.querySelector('td:nth-child(2) input, td:nth-child(2) textarea').value = nume;
            newRow.querySelector('td:nth-child(5) input').value = bucati;
            newRow.querySelector('td:nth-child(10) input').value = pretUnitar;
            newRow.querySelector('td:nth-child(11) input').value = pretTotal;
        } else if (isOutlet) {
            // Calculate prices for Outlet
            pretUnitar = parseInt(pretUnitar) * 1.19 * 2;
            pretUnitar = pretUnitar.toFixed(2);

            //round pretUnitar to the nearest number divisible by 5
            pretUnitar = Math.round(pretUnitar / 5) * 5;

            pretTotal = parseInt(pretUnitar) * parseInt(bucati);
            pretTotal = pretTotal.toFixed(2);

            // Set the values
            newRow.querySelector('td:nth-child(2) input, td:nth-child(2) textarea').value = nume;
            newRow.querySelector('td:nth-child(5) input').value = bucati;
            newRow.querySelector('td:nth-child(10) input').value = pretUnitar;
            newRow.querySelector('td:nth-child(11) input').value = pretTotal;
        } else if (isArgint) {
            pretUnitar = parseFloat(pretUnitar) * 1.19 * 2;
            pretUnitar = Math.ceil(pretUnitar / 5) * 5; // Round up to nearest 5
            pretUnitar = pretUnitar.toFixed(2);

            pretTotal = parseFloat(pretUnitar) * parseFloat(bucati);
            pretTotal = pretTotal.toFixed(2);

            // Set the values
            newRow.querySelector('td:nth-child(2) input, td:nth-child(2) textarea').value = nume;
            newRow.querySelector('td:nth-child(5) input').value = bucati;
            newRow.querySelector('td:nth-child(10) input').value = pretUnitar;
            newRow.querySelector('td:nth-child(11) input').value = pretTotal;
        }
        
        // Insert before the empty row
        emptyRow.parentNode.insertBefore(newRow, emptyRow);
        
        // Setup event listeners
        this.setupRowEventListeners(newRow);
    }
};

// Global functions for backwards compatibility with inline event handlers
function deleteRow(button) {
    TableManager.deleteRow(button);
}
