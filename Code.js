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
  "Westwood Terrace"
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
  "Reddix Center"
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
  "Warren"
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
  "Zachry Magnet"
];
/**
 * Sorts and appends rows from 'Form Responses 1' to 'ES', 'MS', or 'HS' sheets based on the 'Campus' value in column C.
 * To be triggered on form submit.
 *
 * @function
 * @returns {void}
 */
function sortAndAppendByCampus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Form Responses 1");
  if (!sourceSheet) return;
  var data = sourceSheet.getDataRange().getValues();
  if (data.length < 2) return; // No data
  var headers = data[0];
  var campusColIdx = headers.indexOf("Campus");
  if (campusColIdx === -1) campusColIdx = 2; // fallback to column C (index 2)

  // Prepare destination sheets
  var esSheet = ss.getSheetByName("ES");
  var msSheet = ss.getSheetByName("MS");
  var hsSheet = ss.getSheetByName("HS");
  if (!esSheet || !msSheet || !hsSheet) return;

  // Build campus lookup sets for fast matching
  var esSet = new Set(nisdElementaryCampusNames);
  var msSet = new Set(nisdMiddleCampusNames);
  var msSpecial = new Set([
    "Holmgreen Center Middle School",
    "Northside Alternative MS",
  ]);
  var hsSpecial = new Set(
    nisdSpecialSchools.filter(function (s) {
      return !msSpecial.has(s);
    })
  );
  var hsSet = new Set(nisdHighCampusNames.concat(Array.from(hsSpecial)));

  // Collect rows for each sheet
  var esRows = [];
  var msRows = [];
  var hsRows = [];

  // For each row (skip header)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var campus = row[campusColIdx];
    if (esSet.has(campus)) {
      esRows.push(row);
    } else if (msSet.has(campus) || msSpecial.has(campus)) {
      msRows.push(row);
    } else if (hsSet.has(campus)) {
      hsRows.push(row);
    }
    // If campus not found, skip
  }

  // Batch append for performance
  appendRows(esSheet, esRows);
  appendRows(msSheet, msRows);
  appendRows(hsSheet, hsRows);
}

/**
 * Appends multiple rows to a sheet in a single operation for performance.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to append to.
 * @param {Array<Array<any>>} rows - The rows to append.
 */
function appendRows(sheet, rows) {
  if (!sheet || !rows.length) return;
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}
