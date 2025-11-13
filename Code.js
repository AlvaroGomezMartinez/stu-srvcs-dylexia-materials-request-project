/**
 * @fileoverview
 * This Google Apps Script automates the sorting and appending of form response data
 * from the 'Form Responses 1' sheet to the appropriate destination sheets ('ES', 'MS', 'HS')
 * based on the 'Campus' value. It uses predefined lists of NISD campus names for elementary,
 * middle, high, and special schools to determine the correct destination. The script is intended
 * to be triggered on form submission and helps streamline the processing of dyslexia materials requests.
 */

/**
 * List of NISD elementary campus names.
 * @constant {string[]}
 */
const nisdElementaryCampusNames = [
  "Adams Hill",
  "Allen",
  "Aue",
  "Beard",
  "Behlau",
  "Blattman",
  "Boldt",
  "Boone",
  "Brauchle",
  "Braun Station",
  "Burke",
  "Cable",
  "Carlos Coon",
  "Carnahan",
  "Carson",
  "Chumbley",
  "Cody",
  "Cole",
  "Colonies North",
  "Driggers",
  "Ellison",
  "Elrod",
  "Esparza",
  "Evers",
  "Fernandez",
  "Fields",
  "Fisher",
  "Forester",
  "Franklin",
  "Galm",
  "Glass",
  "Glenn",
  "Glenoaks",
  "Hatchett",
  "Helotes",
  "Henderson",
  "Hoffmann",
  "Howsman",
  "Kallison",
  "Knowlton",
  "Krueger",
  "Kuentz",
  "Langley",
  "Leon Springs",
  "Leon Valley",
  "Lewis",
  "Lieck",
  "Linton",
  "Locke Hill",
  "Los Reyes",
  "Martin",
  "Mary Hull",
  "May",
  "McAndrew",
  "McDermott",
  "Mead",
  "Meadow Village",
  "Michael",
  "Mireles",
  "Mora",
  "Murnin",
  "Myers",
  "Nichols",
  "Northwest Crossing",
  "Oak Hills Terrace",
  "Ott",
  "Passmore",
  "Powell",
  "Raba",
  "Reed",
  "Rhodes",
  "Scarborough",
  "Scobee",
  "Steubing",
  "Thornton",
  "Timberwilde",
  "Tomlinson",
  "Valley Hi",
  "Villarreal",
  "Wanke",
  "Ward",
  "Wernli",
  "Westwood Terrace",
];

/**
 * List of NISD special schools.
 * @constant {string[]}
 */
const nisdSpecialSchools = [
  "Holmgreen Center Middle School",
  "Holmgreen Center High School",
  "Northside Alternative HS",
  "Northside Alternative MS",
  "Reddix Center",
];

/**
 * List of NISD high school campus names.
 * @constant {string[]}
 */
const nisdHighCampusNames = [
  "Agriculture Academy",
  "Brandeis",
  "Brennan",
  "CAST Teach",
  "Chavez Excel Academy",
  "Clark",
  "Communications Arts",
  "Construction Careers Academy",
  "Harlan",
  "Health Careers",
  "Holmes",
  "John Jay",
  "John Jay Early College",
  "John Jay Science and Engineering Academy",
  "Marshall",
  "Marshall Law and Medical Services",
  "NSITE",
  "O'Connor",
  "Sotomayor",
  "Stevens",
  "Taft",
  "Warren",
];

/**
 * List of NISD middle school campus names.
 * @constant {string[]}
 */
const nisdMiddleCampusNames = [
  "Bernal",
  "Briscoe",
  "Connally",
  "Folks",
  "Hector Garcia",
  "Hobby",
  "Hobby Magnet",
  "Jefferson",
  "Jones",
  "Jones Magnet",
  "Jordan",
  "Jordan Magnet",
  "Luna",
  "Neff",
  "Pease",
  "Rawlinson",
  "Rayburn",
  "Ross",
  "Rudder",
  "Stevenson",
  "Stinson",
  "Stinson Magnet",
  "Straus",
  "Vale",
  "Zachry",
  "Zachry Magnet",
];
/**
 * Sorts and appends the new form submission to 'ES', 'MS', or 'HS' sheets based on the 'Campus' value.
 * This is the primary event handler triggered automatically on form submission.
 * 
 * Process flow:
 * 1. Validates event object (falls back to processAllRows() if unavailable)
 * 2. Retrieves Source Sheet and destination sheets (ES, MS, HS)
 * 3. Locates Campus column from headers (fallback to column C if not found)
 * 4. Classifies campus using Set-based O(1) lookups
 * 5. Adds status dropdown to column K of the new row in Source Sheet
 * 6. Appends the complete form response to the appropriate destination sheet
 * 
 * The function includes error handling for missing sheets and unrecognized campus names.
 * Unrecognized campuses are silently skipped without throwing errors.
 *
 * @function
 * @param {GoogleAppsScript.Events.SheetsOnFormSubmit} e - The form submit event object containing submission data
 * @returns {void}
 */
function sortAndAppendByCampus(e) {
  // If no event object (manual execution), fall back to processing all rows
  if (!e || !e.values) {
    console.log("No event object found, processing manually");
    processAllRows();
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Form Responses 1");
  if (!sourceSheet) return;

  // Get headers to find campus column index dynamically
  // This allows the form structure to change without breaking the script
  var headers = sourceSheet
    .getRange(1, 1, 1, sourceSheet.getLastColumn())
    .getValues()[0];
  var campusColIdx = headers.indexOf("Campus");
  if (campusColIdx === -1) campusColIdx = 2; // Fallback to column C (index 2) if Campus column not found

  // Prepare destination sheets
  var esSheet = ss.getSheetByName("ES");
  var msSheet = ss.getSheetByName("MS");
  var hsSheet = ss.getSheetByName("HS");
  if (!esSheet || !msSheet || !hsSheet) return;

  // Build optimized campus lookup sets for O(1) classification
  // Using Sets instead of arrays provides constant-time lookups vs linear search
  var campusLookup = buildCampusLookupSets();

  // Process only the new submission from the event
  var newRow = e.values;
  var campus = newRow[campusColIdx];

  // Calculate the row index where the new submission is in the Source Sheet
  // The new submission is at the last row of the Source Sheet (1-indexed)
  var newRowIndex = sourceSheet.getLastRow();

  // Add status dropdown to column K of the new row in Source Sheet
  // This enables task management tracking for the submission
  addStatusDropdown(sourceSheet, newRowIndex);

  // Route to appropriate destination sheet using Set-based O(1) lookups
  if (campusLookup.esSet.has(campus)) {
    appendRows(esSheet, [newRow]);
  } else if (campusLookup.msSet.has(campus) || campusLookup.msSpecial.has(campus)) {
    appendRows(msSheet, [newRow]);
  } else if (campusLookup.hsSet.has(campus)) {
    appendRows(hsSheet, [newRow]);
  }
  // If campus not found, skip (no action needed)
}

/**
 * Fallback function to process all rows when no event object is available (manual execution).
 * This function is used for recovery operations and processing historical data.
 * 
 * Process flow:
 * 1. Retrieves all data from Source Sheet ("Form Responses 1")
 * 2. Locates Campus and Timestamp columns from headers (with fallback indices)
 * 3. Builds a Set of existing timestamps from all destination sheets for O(1) duplicate detection
 * 4. Iterates through all Source Sheet rows (skipping header)
 * 5. Skips rows with timestamps that already exist in destination sheets
 * 6. Classifies new rows by campus type using Set-based lookups
 * 7. Collects rows for batch processing by destination sheet
 * 8. Performs batch append operations to destination sheets (single API call per sheet)
 * 9. Adds status dropdown to column K for each newly processed row in Source Sheet
 * 10. Logs count of processed rows to console
 * 
 * The duplicate detection mechanism ensures data integrity during manual processing
 * and prevents duplicate entries when recovering from errors or processing backlog.
 *
 * @function
 * @returns {void}
 */
function processAllRows() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Form Responses 1");
  if (!sourceSheet) return;
  var data = sourceSheet.getDataRange().getValues();
  if (data.length < 2) return; // No data
  var headers = data[0];
  var campusColIdx = headers.indexOf("Campus");
  var timestampColIdx = headers.indexOf("Timestamp");
  if (campusColIdx === -1) campusColIdx = 2; // fallback to column C (index 2)
  if (timestampColIdx === -1) timestampColIdx = 0; // fallback to column A (index 0)

  // Prepare destination sheets
  var esSheet = ss.getSheetByName("ES");
  var msSheet = ss.getSheetByName("MS");
  var hsSheet = ss.getSheetByName("HS");
  if (!esSheet || !msSheet || !hsSheet) return;

  // Build Set of existing timestamps for O(1) duplicate detection
  // This prevents re-processing rows that have already been routed to destination sheets
  var existingTimestamps = new Set();
  [esSheet, msSheet, hsSheet].forEach(function (sheet) {
    if (sheet.getLastRow() > 0) {
      var existingData = sheet.getDataRange().getValues();
      for (var i = 0; i < existingData.length; i++) {
        var timestamp = existingData[i][timestampColIdx];
        if (timestamp) {
          // Convert to string for consistent comparison (handles Date objects)
          existingTimestamps.add(timestamp.toString());
        }
      }
    }
  });

  // Build optimized campus lookup sets for O(1) classification
  var campusLookup = buildCampusLookupSets();

  // Collect rows for each sheet (only new ones)
  // Batch collection enables single API call per destination sheet
  var esRows = [];
  var msRows = [];
  var hsRows = [];
  var newRowIndices = []; // Track row indices of newly processed rows for status dropdown addition

  // For each row (skip header at index 0)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var timestamp = row[timestampColIdx];
    var campus = row[campusColIdx];

    // Skip if this timestamp already exists in destination sheets (duplicate prevention)
    if (existingTimestamps.has(timestamp.toString())) {
      continue;
    }

    // Track the row index in Source Sheet (i + 1 because sheet rows are 1-indexed, array is 0-indexed)
    var sourceRowIndex = i + 1;
    newRowIndices.push(sourceRowIndex);

    // Route using Set-based O(1) lookups for optimal performance
    if (campusLookup.esSet.has(campus)) {
      esRows.push(row);
    } else if (campusLookup.msSet.has(campus) || campusLookup.msSpecial.has(campus)) {
      msRows.push(row);
    } else if (campusLookup.hsSet.has(campus)) {
      hsRows.push(row);
    }
    // If campus not found in any set, skip without error (graceful handling)
  }

  // Batch append to destination sheets first (single setValues() call per sheet)
  // This is significantly faster than individual appendRow() calls
  appendRows(esSheet, esRows);
  appendRows(msSheet, msRows);
  appendRows(hsSheet, hsRows);

  // Add status dropdowns to column K for all newly processed rows in Source Sheet
  // Note: Data validation API requires individual calls per cell (cannot be batched)
  for (var j = 0; j < newRowIndices.length; j++) {
    addStatusDropdown(sourceSheet, newRowIndices[j]);
  }

  console.log(
    "Processed " + (esRows.length + msRows.length + hsRows.length) + " new rows"
  );
}

/**
 * Builds optimized Set-based campus lookup structures for O(1) classification.
 * Centralizes campus classification logic to avoid duplication and improve maintainability.
 * 
 * Sets provide constant-time O(1) lookups compared to O(n) array searches,
 * significantly improving performance when processing multiple submissions.
 * 
 * Special schools are handled separately:
 * - Middle school special campuses: Holmgreen Center MS, Northside Alternative MS
 * - High school special campuses: Holmgreen Center HS, Northside Alternative HS, Reddix Center
 * 
 * @function
 * @returns {Object} Object containing campus lookup Sets:
 *   - esSet: Elementary school campuses
 *   - msSet: Middle school campuses (regular)
 *   - msSpecial: Middle school special campuses
 *   - hsSet: High school campuses (includes special schools)
 */
function buildCampusLookupSets() {
  // Create Set from elementary campus array for O(1) lookups
  var esSet = new Set(nisdElementaryCampusNames);
  
  // Create Set from middle school campus array for O(1) lookups
  var msSet = new Set(nisdMiddleCampusNames);
  
  // Define special middle school campuses separately for clarity
  var msSpecial = new Set([
    "Holmgreen Center Middle School",
    "Northside Alternative MS",
  ]);
  
  // Build high school Set and add special campuses directly
  // This approach avoids intermediate array operations for better performance
  var hsSet = new Set(nisdHighCampusNames);
  hsSet.add("Holmgreen Center High School");
  hsSet.add("Northside Alternative HS");
  hsSet.add("Reddix Center");
  
  return {
    esSet: esSet,
    msSet: msSet,
    msSpecial: msSpecial,
    hsSet: hsSet
  };
}

/**
 * Appends multiple rows to a sheet in a single batch operation for performance.
 * Uses a single setValues() API call instead of multiple appendRow() calls,
 * reducing execution time and API quota usage.
 * 
 * Performance comparison:
 * - appendRow() for 100 rows: ~100 API calls, ~10-15 seconds
 * - setValues() for 100 rows: 1 API call, ~1-2 seconds
 * 
 * The function safely handles empty arrays and null sheets by returning early.
 * 
 * @function
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The destination sheet to append rows to
 * @param {Array<Array<any>>} rows - 2D array of row data to append (each inner array is one row)
 * @returns {void}
 */
function appendRows(sheet, rows) {
  // Early return if sheet is null or rows array is empty (nothing to append)
  if (!sheet || !rows.length) return;
  
  // Calculate starting row position (next available row after existing data)
  var startRow = sheet.getLastRow() + 1;
  
  // Append all rows in a single batch operation
  // getRange(row, column, numRows, numColumns) defines the target range
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Adds a status dropdown to column K of the specified row in the Source Sheet.
 * The dropdown provides task management capabilities for tracking request processing status.
 * 
 * Configuration:
 * - Column: K (index 11)
 * - Options: "Approved", "Denied", "Processed"
 * - Validation: Rejects invalid input (setAllowInvalid(false))
 * - Default value: Empty (no pre-selection)
 * 
 * The dropdown is applied only to the specified row without affecting existing rows.
 * This function is called after routing each form submission to maintain task tracking
 * in the Source Sheet while responses are distributed to destination sheets.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to add the dropdown to (typically Source Sheet)
 * @param {number} rowIndex - The 1-indexed row number where the dropdown should be added
 * @returns {void}
 */
function addStatusDropdown(sheet, rowIndex) {
  // Create data validation rule with list constraint
  // The second parameter (true) shows the dropdown arrow in the cell
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Approved', 'Denied', 'Processed'], true)
    .setAllowInvalid(false)  // Reject any input not in the list
    .build();
  
  // Apply validation to column K (index 11) at the specified row
  // Column K is used for status tracking across all form submissions
  sheet.getRange(rowIndex, 11).setDataValidation(rule);
}
