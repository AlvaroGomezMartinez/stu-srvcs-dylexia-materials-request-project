# Design Document

## Overview

The Campus-Based Form Routing System is a Google Apps Script automation that processes dyslexia materials request forms for NISD. The system operates as a form submission trigger that categorizes responses by campus type and distributes them to appropriate destination sheets while adding task management capabilities.

The design leverages Google Apps Script's event-driven architecture, optimized data structures for performance, and batch operations to minimize API calls. The system includes both automatic (trigger-based) and manual (fallback) processing modes.

## Architecture

### Execution Modes

**1. Automatic Mode (Event-Driven)**
- Triggered by Google Form submission events
- Processes single submission in real-time
- Uses event object to access form data directly
- Primary operational mode

**2. Manual Mode (Fallback)**
- Invoked when no event object is available
- Processes all rows from Source Sheet
- Implements duplicate detection using timestamps
- Used for recovery and historical data processing

### Data Flow

```
Google Form Submission
        ↓
Form Submission Event
        ↓
sortAndAppendByCampus(e)
        ↓
Extract Campus Value
        ↓
Campus Type Lookup (Set-based)
        ↓
Determine Destination Sheet
        ↓
Add Status Dropdown (Column K)
        ↓
Batch Append to Destination
```

### Component Structure

```
Code.js
├── Constants
│   ├── nisdElementaryCampusNames (85 campuses)
│   ├── nisdMiddleCampusNames (26 campuses)
│   ├── nisdHighCampusNames (22 campuses)
│   └── nisdSpecialSchools (5 campuses)
├── Main Functions
│   ├── sortAndAppendByCampus(e) - Event handler
│   └── processAllRows() - Manual processing
└── Helper Functions
    ├── appendRows(sheet, rows) - Batch append
    └── addStatusDropdown(sheet, row) - NEW: Add validation
```

## Components and Interfaces

### 1. Campus Classification Engine

**Purpose:** Categorize campuses into Elementary, Middle School, or High School types

**Data Structures:**
```javascript
// Set-based lookups for O(1) performance
const esSet = new Set(nisdElementaryCampusNames);
const msSet = new Set(nisdMiddleCampusNames);
const msSpecial = new Set([
  "Holmgreen Center Middle School",
  "Northside Alternative MS"
]);
const hsSpecial = new Set([
  "Holmgreen Center High School",
  "Northside Alternative HS",
  "Reddix Center"
]);
const hsSet = new Set(nisdHighCampusNames.concat(Array.from(hsSpecial)));
```

**Classification Logic:**
1. Check if campus exists in esSet → Route to "ES" sheet
2. Check if campus exists in msSet or msSpecial → Route to "MS" sheet
3. Check if campus exists in hsSet → Route to "HS" sheet
4. If no match found → Skip (no routing)

### 2. Event Handler (sortAndAppendByCampus)

**Input:** GoogleAppsScript.Events.SheetsOnFormSubmit event object

**Process:**
1. Validate event object exists
2. Access active spreadsheet
3. Retrieve Source Sheet ("Form Responses 1")
4. Extract headers and locate Campus column (fallback to index 2)
5. Retrieve Destination Sheets (ES, MS, HS)
6. Build campus classification sets
7. Extract campus value from event.values
8. Classify campus and determine destination
9. Add status dropdown to column K of new row
10. Append row to appropriate Destination Sheet

**Error Handling:**
- Return silently if Source Sheet doesn't exist
- Return silently if any Destination Sheet doesn't exist
- Fall back to processAllRows() if event object is null

### 3. Manual Processing Function (processAllRows)

**Purpose:** Process all rows when event object is unavailable

**Process:**
1. Access Source Sheet and retrieve all data
2. Extract headers and locate Campus and Timestamp columns
3. Retrieve all Destination Sheets
4. Build set of existing timestamps from all Destination Sheets
5. Iterate through Source Sheet rows (skip header)
6. For each row:
   - Check if timestamp exists in any Destination Sheet
   - If duplicate, skip
   - If new, classify campus and add to appropriate collection
7. Add status dropdowns to column K for new rows
8. Batch append collected rows to each Destination Sheet
9. Log count of processed rows

**Duplicate Detection:**
```javascript
// Collect existing timestamps
const existingTimestamps = new Set();
[esSheet, msSheet, hsSheet].forEach(sheet => {
  const data = sheet.getDataRange().getValues();
  data.forEach(row => {
    if (row[timestampColIdx]) {
      existingTimestamps.add(row[timestampColIdx].toString());
    }
  });
});

// Skip duplicates during processing
if (existingTimestamps.has(timestamp.toString())) {
  continue;
}
```

### 4. Batch Append Helper (appendRows)

**Purpose:** Optimize performance by appending multiple rows in single operation

**Signature:**
```javascript
function appendRows(sheet, rows)
```

**Parameters:**
- sheet: GoogleAppsScript.Spreadsheet.Sheet - Target sheet
- rows: Array<Array<any>> - Rows to append

**Process:**
1. Validate sheet and rows array
2. Return early if rows array is empty
3. Calculate starting row (lastRow + 1)
4. Use getRange() with dimensions matching rows array
5. Call setValues() once with all rows

**Performance Benefit:** Reduces API calls from N (one per row) to 1 (single batch)

### 5. Status Dropdown Helper (NEW)

**Purpose:** Add task management dropdown to column K of new submissions

**Signature:**
```javascript
function addStatusDropdown(sheet, rowIndex)
```

**Parameters:**
- sheet: GoogleAppsScript.Spreadsheet.Sheet - Source Sheet
- rowIndex: number - Row number to add dropdown

**Process:**
1. Create data validation rule with list constraint
2. Set allowed values: ["Approved", "Denied", "Processed"]
3. Configure to reject invalid input
4. Apply validation to cell at (rowIndex, 11) - Column K
5. Leave cell value empty (no default selection)

**Implementation:**
```javascript
function addStatusDropdown(sheet, rowIndex) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Approved', 'Denied', 'Processed'], true)
    .setAllowInvalid(false)
    .build();
  
  sheet.getRange(rowIndex, 11).setDataValidation(rule);
}
```

## Data Models

### Form Response Row

**Structure:** Array of values corresponding to form fields

**Key Columns:**
- Column A (Index 0): Timestamp - Date/time of submission
- Column C (Index 2): Campus - School name (default fallback)
- Column K (Index 10): Status - Task management dropdown (NEW)
- Variable: Campus column determined by header lookup

**Data Types:**
- Timestamp: Date object
- Campus: String
- Status: String (constrained by dropdown)
- Other fields: Mixed (String, Number, Date)

### Campus Lists

**Elementary Campuses:** Array of 85 string values
**Middle School Campuses:** Array of 26 string values
**High School Campuses:** Array of 22 string values
**Special Schools:** Array of 5 string values with specific routing rules

### Destination Sheet Structure

**Sheets:** "ES", "MS", "HS"

**Content:** Accumulated form responses filtered by campus type

**Structure:** Identical to Source Sheet (same columns, same order)

## Error Handling

### Graceful Degradation

**Missing Sheets:**
- Check existence before operations
- Return silently without throwing errors
- Prevents script failure from breaking form submissions

**Missing Columns:**
- Implement fallback column indices
- Campus: Default to column C (index 2)
- Timestamp: Default to column A (index 0)
- Ensures operation continues with reasonable assumptions

**Unrecognized Campus:**
- Skip row without appending
- No error thrown
- Allows form to continue accepting submissions

### Event Object Handling

**Missing Event Object:**
- Detect null or undefined event parameter
- Automatically invoke processAllRows() fallback
- Log fallback mode activation
- Enables manual execution and recovery

### Duplicate Prevention

**Manual Processing:**
- Build set of existing timestamps before processing
- Skip rows with matching timestamps
- Prevents duplicate entries during recovery operations
- Maintains data integrity

## Implementation Notes

### Performance Optimizations

1. **Set-based Lookups:** O(1) campus classification vs O(n) array search
2. **Batch Operations:** Single setValues() call vs multiple appendRow() calls
3. **Early Returns:** Exit immediately on missing sheets
4. **Minimal Data Reads:** Read headers once, reuse throughout execution

### Google Apps Script Constraints

1. **Execution Time Limit:** 6 minutes for trigger-based scripts
2. **API Call Quotas:** Minimize calls through batch operations
3. **Trigger Reliability:** Event object may occasionally be null
4. **V8 Runtime:** Modern JavaScript features available

### Maintenance Considerations

1. **Campus List Updates:** Add new campuses to appropriate constant arrays
2. **Special School Routing:** Update msSpecial and hsSpecial sets as needed
3. **Column Changes:** Update fallback indices if form structure changes
4. **Status Options:** Modify dropdown values in addStatusDropdown() if workflow changes

### Security and Access

1. **Execution Context:** Runs with permissions of script owner
2. **Data Access:** Limited to bound spreadsheet
3. **Network Access:** None required (all operations local to spreadsheet)
4. **Authentication:** Inherits from NISD Google Workspace login
