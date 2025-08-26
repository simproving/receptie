// Invoice parsing functionality for different suppliers
const InvoiceParsers = {
    
    parseAndUpdateTable: function() {
        const text = document.getElementById('bulkInput').value;
        const statusElement = document.getElementById('processingStatus');
        
        // Hide the "Trimite la inventar" button when starting new processing
        document.getElementById('sendToInventory').style.display = 'none';
        currentAvonProducts = null;
        
        if (!text.trim()) {
            statusElement.textContent = 'Nu a fost introdus text pentru procesare.';
            statusElement.className = 'text-danger';
            return;
        }
        
        statusElement.textContent = 'Procesare...';
        statusElement.className = 'text-info';
        
        // Clear invoice fields before processing
        document.querySelector('.document-info tr:last-child td:nth-child(2) input').value = '';
        document.querySelector('.document-info tr:last-child td:nth-child(3) input').value = '';
        
        // Use setTimeout to allow the UI to update before heavy processing
        setTimeout(() => {
            try {
                var lines = text.split('\n');
                
                // Clear existing rows except the empty row and total row
                const rows = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)');
                rows.forEach(row => row.remove());
                
                // Check which supplier is selected
                const isAvon = document.getElementById('avonSupplier').checked;
                const isOutlet = document.getElementById('outletSupplier').checked;
                const isArgint = document.getElementById('argintSupplier').checked;
                const isCosmetic = document.getElementById('cosmeticSupplier').checked;
                
                let supplierName = '';
                if (isAvon) {
                    supplierName = 'Avon';
                    this.parseAvonInvoice(lines.filter(line => line.trim() !== ''));
                } else if (isOutlet) {
                    supplierName = 'Outlet';
                    this.parseOutletInvoice(lines.filter(line => line.trim() !== ''));
                } else if (isArgint) {
                    supplierName = 'Argint';
                    this.parseArgintInvoice(lines.filter(line => line.trim() !== ''));
                } else if (isCosmetic) {
                    supplierName = 'Cosmetic';
                    this.parseCosmeticInvoice(lines.map(line => 
                        line.trim().includes('Adăugat cu cost') ? '' : line
                    ));
                }
                
                // Renumber rows and recalculate totals
                TableManager.renumberRows();
                TableManager.recalculateTotals();
                
                // Get the invoice number and date from the form
                const invoiceNumber = document.querySelector('.document-info tr:last-child td:nth-child(2) input').value;
                const invoiceDate = document.querySelector('.document-info tr:last-child td:nth-child(3) input').value;
                
                // Set the page title
                const title = `Receptie-${supplierName}-${invoiceDate}-${invoiceNumber}`;
                document.title = title;
                
                const productCount = document.querySelectorAll('#itemsTable tr:not(.total-row):not(#emptyRow)').length;
                statusElement.textContent = `Procesare completă: ${productCount} produse importate.`;
                statusElement.className = 'text-success';
            } catch (error) {
                console.error('Error parsing input:', error);
                statusElement.textContent = 'Eroare la procesare. Verifică consola pentru detalii.';
                statusElement.className = 'text-danger';
            }
        }, 50);
    },

    parseAvonInvoice: function(lines) {
        console.log(`Processing Avon invoice with ${lines.length} lines`);
        
        // Avon is always duplicated, so we only process the first half
        let truncatedLines = lines.slice(0, Math.ceil(lines.length / 2));
        
        // Define regex patterns
        // Allow negative quantity for Avon
        const produsPattern = /(\d{1,3})\s(\d{4}-\d)\s(-?\d{1,3})\s(.*?)\s(-?\d{1,3}\.\d{1,2})\s(-?\d{1,5}\.\d{1,2})/;
        
        // Extract invoice number and date from specific lines
        let invoiceNumber = '';
        let invoiceDate = '';
        
        // Get invoice number from line 16 (index 15)
        if (truncatedLines.length > 15) {
            const line16 = truncatedLines[15];
            const numbers = line16.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                invoiceNumber = numbers[numbers.length - 1];
                console.log(`Found invoice number: ${invoiceNumber}`);
            }
        }
        
        // Get date from line 17 (index 16)
        if (truncatedLines.length > 16) {
            const line17 = truncatedLines[16];
            const numbers = line17.match(/\d+/g);
            if (numbers && numbers.length > 0) {
                invoiceDate = numbers[numbers.length - 1];
                console.log(`Found invoice date: ${invoiceDate}`);
            }
        }
        
        // Update invoice fields if found
        if (invoiceNumber) {
            document.querySelector('.document-info tr:last-child td:nth-child(2) input').value = invoiceNumber;
        }
        if (invoiceDate) {
            document.querySelector('.document-info tr:last-child td:nth-child(3) input').value = invoiceDate;
        }
        
        // Keep track of how many products we found
        let productCount = 0;
        
        // Array to store all products before processing
        const products = [];
        
        // First pass: collect all products
        truncatedLines.forEach(line => {
            const match = line.match(produsPattern);
            if (match) {
                const [_, nrCrt, cod, bucati, nume, pretUnitar, pretTotal] = match;
                products.push({
                    nume: cod.replace("-", "").trim() + " " + nume.trim(),
                    bucati: bucati,
                    pretUnitar: pretUnitar,
                    pretTotal: pretTotal
                });
                productCount++;
            }
        });

        // Store products temporarily
        currentAvonProducts = {
            invoiceNumber,
            invoiceDate,
            products,
            timestamp: new Date().toISOString()
        };

        // Show the "Trimite la inventar" button
        document.getElementById('sendToInventory').style.display = 'inline-block';
        
        // Second pass: create rows
        products.forEach(product => {
            TableManager.addProductRow(product.nume, product.bucati, product.pretUnitar, product.pretTotal);
        });
        
        console.log(`Found ${productCount} products in Avon invoice`);
    },
    
    parseOutletInvoice: function(lines) {
        console.log(`Processing Outlet invoice with ${lines.length} lines`);

        // Extract invoice number and date from first two lines
        let invoiceNumber = '';
        let invoiceDate = '';
        
        // For Outlet, invoice number is in line 1
        if (lines.length > 0) {
            // Extract numeric part that usually follows FACTURA REF51060
            const line1 = lines[0];
            const invoiceMatch = line1.match(/FACTURA (REF\d+)/i);
            if (invoiceMatch && invoiceMatch[1]) {
                invoiceNumber = invoiceMatch[1];
                console.log(`Found invoice number: ${invoiceNumber}`);
            }
        }
        
        // For Outlet, date is in line 2
        if (lines.length > 1) {
            const line2 = lines[1];
            // Look for date pattern in various formats
            const dateMatch = line2.match(/(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/);
            if (dateMatch && dateMatch[1]) {
                invoiceDate = dateMatch[1];
                console.log(`Found invoice date: ${invoiceDate}`);
            }
        }
        
        // Update invoice fields if found
        if (invoiceNumber) {
            document.querySelector('.document-info tr:last-child td:nth-child(2) input').value = invoiceNumber;
        }
        if (invoiceDate) {
            document.querySelector('.document-info tr:last-child td:nth-child(3) input').value = invoiceDate;
        }

        // print the processed lines
        console.log("Lines: \n");
        console.log(lines);
        
        // Keep track of how many products we found
        let productCount = 0;
        
        // Join all lines with spaces and process the combined text
        var combinedText = lines.join(' ');

        // we just replace all whitespace with one space
        combinedText.replace(/\s+/g, ' ').trim();
        console.log("Normalized text: " + combinedText);

        // For Outlet, we use a different pattern that matches their invoice format
        const produsPattern = /\d{1,3} (\(.*?)(pcs|buc)\s(\d+)\s(\d+\.\d+)\s/g;
        const matches = combinedText.matchAll(produsPattern);
        
        for (const match of matches) {
            // Skip lines that likely aren't products (too short product name)
            const [_, nume, b, bucati, pretUnitar] = match;
            if (nume.trim().length > 3) {
                TableManager.addProductRow(nume.trim(), bucati, pretUnitar);
                productCount++;
            }
        }
        
        console.log(`Found ${productCount} products in Outlet invoice`);
    },
    
    parseArgintInvoice: function(lines) {
        console.log(`Processing Argint invoice with ${lines.length} lines`);
        
        // Extract invoice number and date
        let invoiceNumber = '';
        let invoiceDate = '';
        
        // search until we find Data: 28/03/2025
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("Data:")) {
                invoiceDate = lines[i];
                // match the date format \d{1,2}\/\d{1,2}\/\d{2,4}
                invoiceDate = invoiceDate.match(/Data: (\d{1,2}\/\d{1,2}\/\d{2,4})/)[1];
                break;
            }
        }

        // search until we find Telefon:Nr: 2584        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("Telefon:Nr:")) {
                // regex Telefon:Nr: \d{4}
                invoiceNumber = lines[i].match(/Telefon:Nr: (\d{4})/)[1];
                break;
            }
        }

        // Update invoice fields if found
        if (invoiceNumber) {
            document.querySelector('.document-info tr:last-child td:nth-child(2) input').value = invoiceNumber;
        }
        if (invoiceDate) {
            document.querySelector('.document-info tr:last-child td:nth-child(3) input').value = invoiceDate;
        }
        
        // Process lines to look for product entries
        const produsPattern = /(0\d{7,9}\s.*?\s*[A-Z]+)\sbuc\s(-*\d+)\s(\d+\.\d+)/g;
        
        let productCount = 0;
        
        // Process each line for products
        lines.forEach(line => {
            const matches = line.matchAll(produsPattern);
            for (const match of matches) {
                const [_, nume, bucati, pretUnitar] = match;
                TableManager.addProductRow(nume.trim(), bucati, pretUnitar);
                productCount++;
            }
        });
        
        console.log(`Found ${productCount} products in Argint invoice`);
    },

    parseCosmeticInvoice: function(lines) {
        console.log(`Processing Cosmetic invoice with ${lines.length} lines`);

        // Extract invoice number and date from specific lines
        let invoiceNumber = '';
        let invoiceDate = '';

        // Look for invoice number and date in the lines
        // Pattern: "Numărul comenzii: 4448513014" and "Data comenzii: 19.08.2025"
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Look for order number pattern
            const orderNumberMatch = line.match(/Numărul comenzii:\s*(\d+)/i);
            if (orderNumberMatch && orderNumberMatch[1] && !invoiceNumber) {
                invoiceNumber = orderNumberMatch[1];
                console.log(`Found invoice number: ${invoiceNumber}`);
            }

            // Look for order date pattern
            const orderDateMatch = line.match(/Data comenzii:\s*(\d{1,2}\.\d{1,2}\.\d{2,4})/i);
            if (orderDateMatch && orderDateMatch[1] && !invoiceDate) {
                invoiceDate = orderDateMatch[1];
                console.log(`Found invoice date: ${invoiceDate}`);
            }
        }

        // Update invoice fields if found
        console.log(`Final invoice number: "${invoiceNumber}", date: "${invoiceDate}"`);
        if (invoiceNumber) {
            const invoiceNumberField = document.querySelector('.document-info tr:last-child td:nth-child(2) input');
            if (invoiceNumberField) {
                invoiceNumberField.value = invoiceNumber;
                console.log(`Set invoice number field to: ${invoiceNumber}`);
            } else {
                console.log('Invoice number field not found');
            }
        }
        if (invoiceDate) {
            const invoiceDateField = document.querySelector('.document-info tr:last-child td:nth-child(3) input');
            if (invoiceDateField) {
                invoiceDateField.value = invoiceDate;
                console.log(`Set invoice date field to: ${invoiceDate}`);
            } else {
                console.log('Invoice date field not found');
            }
        }

        // Keep track of how many products we found
        let productCount = 0;

        // Array to store all products before processing
        const products = [];

        // Process cosmetic invoice format
        // Products are separated by empty lines, each product block contains:
        // - Product name (appears twice, potentially multi-line)
        // - 5-digit code
        // - BP value, LEI value, quantity line, etc.

        let i = 0;
        while (i < lines.length) {
            // Skip empty lines and find the start of a product block
            if (lines[i].trim() === '') {
                i++;
                continue;
            }

            // Skip header lines and registration fees
            if (lines[i].trim().startsWith('Produsele') || 
                lines[i].trim().includes('Taxă de înregistrare')) {
                i++;
                continue;
            }

            // Collect all lines until the next empty line (one product block)
            let productBlock = [];

            while (i < lines.length && lines[i].trim() !== '') {
                productBlock.push(lines[i]);
                i++;
            }

            // Process the product block if it's not empty
            if (productBlock.length > 0) {
                // Join all lines in the block to process as one string
                const blockText = productBlock.join(' ');

                // Find the 5-digit code that signals the end of the product name
                const codeMatch = blockText.match(/(\d{5})/);
                if (codeMatch) {
                    const codeIndex = blockText.indexOf(codeMatch[1]);

                    // Extract text from start until the 5-digit code
                    const textUntilCode = blockText.substring(0, codeIndex).trim();

                    // Since the product name appears twice, take the first half
                    const words = textUntilCode.split(/\s+/);
                    const halfLength = Math.ceil(words.length / 2);
                    const productName = words.slice(0, halfLength).join(' ').trim();

                    // Extract quantity using regex
                    const quantityMatch = blockText.match(/Cantitate:\s*(\d+)/);
                    const quantity = quantityMatch ? quantityMatch[1] : '';

                    // Only add product if we found a valid product name and quantity (skip if quantity is 0)
                    if (productName && quantity && quantity !== '0') {
                        products.push({
                            nume: productName,
                            bucati: quantity,
                            pretUnitar: '', // leave empty as requested
                            pretTotal: ''   // leave empty as requested
                        });
                        productCount++;
                    }
                }
            }
        }

        // Second pass: create rows
        products.forEach(product => {
            TableManager.addProductRow(product.nume, product.bucati, product.pretUnitar, product.pretTotal);
        });

        console.log(`Found ${productCount} products in Cosmetic invoice`);
    }
};

// Global function for backwards compatibility with inline event handlers
function parseAndUpdateTable() {
    InvoiceParsers.parseAndUpdateTable();
}
