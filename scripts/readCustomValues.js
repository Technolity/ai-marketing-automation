/**
 * Script to read Custom Values Excel file and extract mappings
 * Run with: node scripts/readCustomValues.js
 */

const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const filePath = path.join(__dirname, '../store/Custom Values.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('=== EXCEL FILE STRUCTURE ===\n');
console.log('Sheet Names:', workbook.SheetNames);
console.log('\n');

// Process each sheet
workbook.SheetNames.forEach(sheetName => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SHEET: ${sheetName}`);
    console.log('='.repeat(60));

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let currentSection = '';

    data.forEach((row, index) => {
        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => !cell)) return;

        // Check if this is a section header (single cell with content, usually bold)
        if (row.length === 1 || (row[0] && !row[1] && !row[2])) {
            if (row[0] && typeof row[0] === 'string' && row[0].trim()) {
                currentSection = row[0].trim();
                console.log(`\n--- ${currentSection} ---`);
            }
            return;
        }

        // Check if this is a header row
        if (row[0] === 'Name' || row[0] === 'Custom Value Name' || row.includes('Key')) {
            console.log(`[Headers: ${row.filter(c => c).join(' | ')}]`);
            return;
        }

        // Data row - print name and key
        const name = row[0];
        const key = row[1];

        if (name && key) {
            console.log(`  "${name}" => "${key}"`);
        } else if (name) {
            // Might be a section header
            console.log(`\n--- ${name} ---`);
        }
    });
});

console.log('\n\n=== END OF EXTRACTION ===');
