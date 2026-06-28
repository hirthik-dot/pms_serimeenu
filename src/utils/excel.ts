import * as XLSX from 'xlsx';

/**
 * Utility to trigger a browser download of an Excel file from JSON data.
 * @param data Array of objects representing the rows
 * @param sheetName Name of the worksheet
 * @param filename Name of the exported file (without .xlsx extension)
 */
export function exportToExcel(data: Record<string, unknown>[], sheetName: string = 'Data', filename: string = 'export') {
  // Create a new workbook and add a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Trigger a download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
