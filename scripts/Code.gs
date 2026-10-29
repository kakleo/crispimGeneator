/**
 * Tour Proposal Generator - Google Apps Script Web App (Single Tab Version)
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet (which only has 1 tab where each row is a proposal).
 * 2. In Google Sheets top menu: Extensions > Apps Script
 * 3. Replace all code in Code.gs with this script
 * 4. Click Deploy > New deployment
 * 5. Select type: "Web app" (gear icon)
 * 6. Set Description: "Tour Proposal Single Tab API"
 * 7. Set Execute as: "Me"
 * 8. Set Who has access: "Anyone"
 * 9. Click Deploy, authorize permissions, and copy the Web app URL
 * 10. Paste into your .env file:
 *     GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Get the first / active sheet (the single tab)
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    if (!data || data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ proposals: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Row 1: Header column names (normalized to lowercase and trimmed)
    const headers = data[0].map(function(h) {
      return String(h || '').trim();
    });

    const proposals = [];
    for (var i = 1; i < data.length; i++) {
      const row = data[i];
      const rowObj = {};
      var hasContent = false;

      for (var j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (!header) continue;

        var val = row[j];
        if (val === undefined || val === null) {
          val = '';
        }

        // Format Date instances to clean strings
        if (val instanceof Date) {
          val = val.toISOString().split('T')[0];
        }

        rowObj[header] = val;
        if (String(val).trim() !== '') {
          hasContent = true;
        }
      }

      if (hasContent && rowObj['proposal_id']) {
        proposals.push(rowObj);
      }
    }

    const output = {
      proposals: proposals,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    const errorOutput = {
      error: err.message || String(err),
      stack: err.stack || ''
    };
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
