# Receptie - Invoice to Goods Reception Application

A comprehensive web application for processing and managing goods reception invoices from multiple suppliers. Built with vanilla JavaScript, HTML5, and CSS3, featuring IndexedDB persistence and advanced invoice management capabilities.

## 🚀 Current Status

**✅ FULLY FUNCTIONAL** - All core features implemented and working
- Invoice processing for 4 suppliers (Avon, Outlet, Argint, Cosmetic)
- Complete invoice history management with search and filtering
- Automatic data persistence using IndexedDB
- Real-time auto-save functionality
- CSV export capabilities
- Inventory integration ready

## ✨ Key Features

### 📋 Invoice Processing
- **Multi-Supplier Support**: Process invoices from Avon, Outlet, Argint, and Cosmetic suppliers
- **Bulk Text Processing**: Paste invoice text directly from PDFs, emails, or documents
- **Automatic Parsing**: Intelligent extraction of product details, quantities, and prices
- **Real-time Validation**: Immediate feedback on processing status and errors

### 💾 Data Persistence
- **IndexedDB Storage**: Robust local database for invoice history
- **Auto-save**: Automatic saving of all form changes with debounced updates
- **Local Storage**: Persistent textarea content across browser sessions
- **Duplicate Prevention**: Smart handling of existing invoices with automatic updates

### 📚 Invoice History Management
- **Complete History Viewer**: Searchable table of all processed invoices
- **Advanced Filtering**: Filter by supplier, date, and search terms
- **Invoice Loading**: Restore any previous invoice for editing or reference
- **Data Management**: Delete individual invoices or clear entire history

### 📊 Export & Integration
- **CSV Export**: Download invoice data in spreadsheet format
- **Inventory Ready**: Direct integration with inventory management systems
- **Print Support**: Professional invoice layout for printing

## 🛠️ Technical Architecture

### Frontend Stack
- **HTML5**: Semantic markup with Bootstrap 5 styling
- **CSS3**: Custom styling with responsive design
- **Vanilla JavaScript**: No framework dependencies, pure ES6+ code

### Core Modules
- **`core.js`**: Main application logic and initialization
- **`db-manager.js`**: IndexedDB operations and data persistence
- **`history-viewer.js`**: Complete invoice history management system
- **`table-manager.js`**: Dynamic table operations and auto-save
- **`invoice-parsers.js`**: Supplier-specific invoice parsing logic
- **`csv-exporter.js`**: Data export functionality
- **`inventory-manager.js`**: Inventory system integration

### Database Schema
```javascript
{
  id: auto-increment,
  supplier: string,           // Avon, Outlet, Argint, Cosmetic
  date: string,               // YYYY-MM-DD format
  timestamp: string,          // ISO timestamp
  invoiceNumber: string,      // Invoice identifier
  invoiceDate: string,        // Invoice date
  products: array,            // Complete product details
  totalQuantity: number,      // Calculated totals
  totalValue: number          // Calculated values
}
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser with IndexedDB support (Chrome 23+, Firefox 16+, Safari 10+)
- No additional software installation required

### Installation
1. Clone or download the repository
2. Open `index.html` in your web browser
3. Start processing invoices immediately

### Usage
1. **Select Supplier**: Choose from Avon, Outlet, Argint, or Cosmetic
2. **Paste Invoice**: Copy invoice text and paste into the textarea
3. **Process**: Click "Procesează" to automatically parse and populate the form
4. **Review**: Verify all details are correctly extracted
5. **Save**: Data is automatically saved as you work
6. **Export**: Download CSV or send to inventory as needed

## 📱 Browser Compatibility

- **Chrome**: 23+ (Full support)
- **Firefox**: 16+ (Full support)
- **Safari**: 10+ (Full support)
- **Edge**: 12+ (Full support)

## 🔧 Recent Updates

### Latest Features (Current)
- ✅ **Auto-save functionality** with 500ms debouncing
- ✅ **Comprehensive error handling** for all database operations
- ✅ **Invoice loading from history** with full data restoration
- ✅ **Real-time filtering and search** in history viewer
- ✅ **Toast notifications** for user feedback
- ✅ **Robust duplicate prevention** logic

### Performance Improvements
- Efficient IndexedDB operations with proper indexing
- Debounced auto-save to prevent excessive database writes
- Optimized table rendering and updates
- Memory-efficient history management

