import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 * @param {String} sheetName - Name of the sheet (default: 'Sheet1')
 */
export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export multiple sheets to one Excel file
 * @param {Array} sheets - Array of {name, data} objects
 * @param {String} filename - Name of the file (without extension)
 */
export const exportMultipleSheets = (sheets, filename) => {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(sheet => {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export default { exportToExcel, exportMultipleSheets };
