/* ============================================================
   ONE-CLICK CSV IMPORTER
   Adds a "Product Catalog" menu to this Google Sheet with an
   "Import CSV (replace all)..." button. Picking a CSV file
   completely replaces everything in this sheet with the file's
   contents — no manual copy/pasting of columns needed.

   Setup instructions are in the main README — this file plus
   ImportDialog.html both get pasted into the Sheet's Apps Script
   editor (Extensions → Apps Script).
   ============================================================ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Product Catalog")
    .addItem("Import CSV (replace all)...", "showImportDialog")
    .addToUi();
}

function showImportDialog() {
  const html = HtmlService.createHtmlOutputFromFile("ImportDialog")
    .setWidth(440)
    .setHeight(280);
  SpreadsheetApp.getUi().showModalDialog(html, "Import Product CSV");
}

/* Called from ImportDialog.html once a file is chosen. Replaces every
   cell in the active sheet with the CSV's contents. */
function importCsvData(csvText) {
  const data = Utilities.parseCsv(csvText);
  if (!data || !data.length) {
    throw new Error("That file didn't look like a valid CSV.");
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  return data.length - 1; // number of products imported (minus the header row)
}
