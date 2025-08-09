// CSV export functionality
const CSVExporter = {
    
    downloadTableAsCSV: function() {
        const table = document.querySelector('.main-table');
        const rows = table.querySelectorAll('tbody tr');
        let csv = [];

        // Get header row
        const headerCells = table.querySelectorAll('thead th');
        let headerRow = [];
        headerCells.forEach(th => {
            headerRow.push('"' + th.innerText.replace(/\n/g, ' ').replace(/"/g, '""') + '"');
        });
        csv.push(headerRow.join(','));

        // Get data rows (skip #emptyRow and .total-row)
        rows.forEach(row => {
            if (row.id === 'emptyRow' || row.classList.contains('total-row')) return;
            let rowData = [];
            for (let i = 0; i < row.cells.length; i++) {
                let cell = row.cells[i];
                let value = '';
                // For input or textarea, get value
                const input = cell.querySelector('input, textarea');
                if (input) {
                    value = input.value;
                } else {
                    value = cell.innerText;
                }
                // Escape quotes
                value = '"' + value.replace(/"/g, '""') + '"';
                rowData.push(value);
            }
            csv.push(rowData.join(','));
        });

        // Create and trigger download
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Use document title for filename if possible
        let filename = document.title ? document.title + '.csv' : 'tabel.csv';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Global function for backwards compatibility with inline event handlers
function downloadTableAsCSV() {
    CSVExporter.downloadTableAsCSV();
}
