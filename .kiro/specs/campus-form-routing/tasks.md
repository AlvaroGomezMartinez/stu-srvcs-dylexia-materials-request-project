# Implementation Plan

- [x] 1. Create status dropdown helper function
  - Implement addStatusDropdown(sheet, rowIndex) function in Code.js
  - Create data validation rule with SpreadsheetApp.newDataValidation()
  - Configure rule to require values from list: ["Approved", "Denied", "Processed"]
  - Set rule to reject invalid input (setAllowInvalid(false))
  - Apply validation to column K (index 11) at specified row
  - Leave cell value empty by default
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Integrate status dropdown into event-driven mode
  - Modify sortAndAppendByCampus(e) function to add status dropdown after routing
  - Calculate the row index where the new submission will be appended in Source Sheet
  - Call addStatusDropdown() with Source Sheet and calculated row index
  - Ensure dropdown is added before or after the append operation to Destination Sheet
  - _Requirements: 7.1, 7.5_

- [x] 3. Integrate status dropdown into manual processing mode
  - Modify processAllRows() function to add status dropdowns for new rows
  - Track row indices of newly processed rows in Source Sheet
  - After duplicate detection, add status dropdown to each new row in Source Sheet
  - Ensure dropdowns are only added to rows that don't already have them
  - _Requirements: 7.1, 7.5_

- [x] 4. Verify campus classification logic
  - Review existing campus constant arrays for completeness
  - Verify nisdElementaryCampusNames contains all 85 elementary campuses
  - Verify nisdMiddleCampusNames contains all 26 middle school campuses
  - Verify nisdHighCampusNames contains all 22 high school campuses
  - Verify nisdSpecialSchools contains all 5 special schools
  - Confirm special school routing logic in Set construction
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Validate error handling and fallback mechanisms
  - Review sheet existence checks in sortAndAppendByCampus()
  - Review sheet existence checks in processAllRows()
  - Verify column index fallback logic (Campus to index 2, Timestamp to index 0)
  - Verify event object null check and processAllRows() invocation
  - Confirm unrecognized campus names are skipped without errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Optimize batch operations and performance
  - Review appendRows() implementation for batch efficiency
  - Verify Set-based campus lookups are used instead of array searches
  - Confirm single setValues() call per destination sheet
  - Review duplicate detection Set construction in processAllRows()
  - Ensure minimal API calls throughout execution flow
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Document code with JSDoc comments
  - Add JSDoc comment for addStatusDropdown() function
  - Update JSDoc for sortAndAppendByCampus() to mention status dropdown
  - Update JSDoc for processAllRows() to mention status dropdown
  - Ensure all parameters and return types are documented
  - Add inline comments for complex logic sections
  - _Requirements: All_
