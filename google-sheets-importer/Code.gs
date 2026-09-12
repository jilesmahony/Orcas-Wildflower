/* ============================================================
   ONE-CLICK CSV IMPORTER + PHOTO UPLOADER
   Adds a "Product Catalog" menu to this Google Sheet with:
   - "Import CSV (replace all)..." — bulk-replace the whole catalog
   - "Add Product Photo..." — upload a photo for one product without
     ever leaving this Sheet or touching GitHub

   Setup instructions are in START-HERE.md — this file plus
   ImportDialog.html and AddPhotoDialog.html all get pasted into
   the Sheet's Apps Script editor (Extensions → Apps Script).
   ============================================================ */

// One-time setup: get your own free Client ID at
// https://api.imgur.com/oauth2/addclient (choose "Anonymous usage
// without user authorization") and paste it here. This is not a
// secret password — it's fine for it to live in this file.
const IMGUR_CLIENT_ID = "PASTE_YOUR_IMGUR_CLIENT_ID_HERE";

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Product Catalog")
    .addItem("Import CSV (replace all)...", "showImportDialog")
    .addItem("Add Product Photo...", "showAddPhotoDialog")
    .addToUi();
}

function showImportDialog() {
  const html = HtmlService.createHtmlOutputFromFile("ImportDialog")
    .setWidth(440)
    .setHeight(280);
  SpreadsheetApp.getUi().showModalDialog(html, "Import Product CSV");
}

function showAddPhotoDialog() {
  const html = HtmlService.createHtmlOutputFromFile("AddPhotoDialog")
    .setWidth(440)
    .setHeight(340);
  SpreadsheetApp.getUi().showModalDialog(html, "Add Product Photo");
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

/* Called from AddPhotoDialog.html when it first opens, to fill the
   product dropdown with whatever's currently in the sheet. */
function getProductList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h).trim().toLowerCase());
  const idCol = headers.indexOf("id");
  const nameCol = headers.indexOf("name");
  if (idCol === -1 || nameCol === -1) {
    throw new Error("Couldn't find 'id' and 'name' columns in row 1.");
  }
  return data.slice(1)
    .filter((row) => row[idCol])
    .map((row) => ({ id: row[idCol], name: row[nameCol] }));
}

/* Called from AddPhotoDialog.html once a photo is chosen and a
   product is picked. Uploads the photo to imgur (free, reliable
   image hosting made for exactly this) and writes the resulting
   link into that product's "images" column. */
function uploadProductPhoto(productId, base64Data, mimeType) {
  if (IMGUR_CLIENT_ID === "PASTE_YOUR_IMGUR_CLIENT_ID_HERE") {
    throw new Error("Imgur isn't set up yet — see START-HERE.md to get a free Client ID and paste it into Code.gs.");
  }

  const response = UrlFetchApp.fetch("https://api.imgur.com/3/image", {
    method: "post",
    headers: { Authorization: "Client-ID " + IMGUR_CLIENT_ID },
    payload: { image: base64Data, type: "base64" },
    muteHttpExceptions: true,
  });
  const result = JSON.parse(response.getContentText());
  if (!result.success) {
    throw new Error("Imgur upload failed: " + (result.data && result.data.error));
  }
  const imageUrl = result.data.link;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map((h) => String(h).trim().toLowerCase());
  const idCol = headers.indexOf("id");
  const imagesCol = headers.indexOf("images");
  if (idCol === -1 || imagesCol === -1) {
    throw new Error("Couldn't find 'id' and 'images' columns in row 1.");
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(productId)) {
      const existing = String(data[i][imagesCol] || "").trim();
      const updated = existing ? existing + "|" + imageUrl : imageUrl;
      sheet.getRange(i + 1, imagesCol + 1).setValue(updated);
      return { productName: data[i][headers.indexOf("name")], imageUrl: imageUrl };
    }
  }
  throw new Error("Couldn't find a product with that ID.");
}
