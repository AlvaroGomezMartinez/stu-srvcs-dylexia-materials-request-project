# Requirements Document

## Introduction

This document specifies the requirements for the Campus-Based Form Routing System, a Google Apps Script automation that processes dyslexia materials request forms in the Northside Independent School District (NISD). The system automatically categorizes and distributes form responses from a central collection sheet to campus-type-specific destination sheets based on the submitter's campus selection.

## Glossary

- **Form Routing System**: The Google Apps Script automation that processes and distributes form responses
- **Source Sheet**: The "Form Responses 1" sheet where Google Form submissions are initially collected
- **Destination Sheets**: The three target sheets ("ES", "MS", "HS") where responses are distributed based on campus type
- **Campus**: A school location within NISD selected by the form submitter
- **Campus Type**: The educational level category (Elementary, Middle School, or High School) that a campus belongs to
- **Form Submission Event**: The trigger event that occurs when a user submits the Google Form
- **Timestamp**: The date and time value automatically recorded when a form is submitted
- **Batch Processing**: The operation of appending multiple rows to a sheet in a single API call

## Requirements

### Requirement 1

**User Story:** As a district administrator, I want form responses to be automatically sorted by campus type, so that I can quickly process requests for each educational level without manual categorization.

#### Acceptance Criteria

1. WHEN a form submission occurs, THE Form Routing System SHALL retrieve the campus value from the submission data
2. THE Form Routing System SHALL categorize the campus into one of three types: Elementary, Middle School, or High School
3. WHEN the campus type is determined, THE Form Routing System SHALL append the complete form response to the corresponding Destination Sheet
4. THE Form Routing System SHALL complete the routing operation within 10 seconds of form submission

### Requirement 2

**User Story:** As a district administrator, I want the system to recognize all NISD campuses accurately, so that every form submission is routed to the correct destination.

#### Acceptance Criteria

1. THE Form Routing System SHALL maintain a complete list of all 85 NISD elementary campus names
2. THE Form Routing System SHALL maintain a complete list of all 26 NISD middle school campus names
3. THE Form Routing System SHALL maintain a complete list of all 22 NISD high school campus names
4. THE Form Routing System SHALL categorize special schools (Holmgreen Center Middle School, Northside Alternative MS) as Middle School type
5. THE Form Routing System SHALL categorize special schools (Holmgreen Center High School, Northside Alternative HS, Reddix Center) as High School type

### Requirement 3

**User Story:** As a district administrator, I want the system to handle edge cases gracefully, so that the automation continues working even when unexpected conditions occur.

#### Acceptance Criteria

1. IF the Source Sheet does not exist, THEN THE Form Routing System SHALL terminate without error
2. IF any Destination Sheet does not exist, THEN THE Form Routing System SHALL terminate without error
3. IF the Campus column is not found in the headers, THEN THE Form Routing System SHALL use column C (index 2) as the campus location
4. IF a campus value does not match any known campus name, THEN THE Form Routing System SHALL skip that submission without appending it to any Destination Sheet
5. IF the form submission event object is not available, THEN THE Form Routing System SHALL invoke the manual processing fallback

### Requirement 4

**User Story:** As a district administrator, I want to manually process all form responses when needed, so that I can recover from errors or process historical data without duplicating entries.

#### Acceptance Criteria

1. WHEN the Form Routing System is executed manually without an event object, THE Form Routing System SHALL process all rows from the Source Sheet
2. THE Form Routing System SHALL collect existing timestamps from all Destination Sheets before processing
3. WHEN processing rows manually, THE Form Routing System SHALL skip any row whose timestamp already exists in a Destination Sheet
4. THE Form Routing System SHALL log the count of newly processed rows to the console
5. IF the Timestamp column is not found in the headers, THEN THE Form Routing System SHALL use column A (index 0) as the timestamp location

### Requirement 5

**User Story:** As a district administrator, I want the system to perform efficiently with large datasets, so that form processing does not slow down or timeout.

#### Acceptance Criteria

1. THE Form Routing System SHALL use Set data structures for campus name lookups to achieve O(1) lookup time
2. THE Form Routing System SHALL append multiple rows to a Destination Sheet in a single batch operation
3. WHEN processing manually, THE Form Routing System SHALL collect all rows for each Destination Sheet before performing batch append operations
4. THE Form Routing System SHALL minimize the number of API calls to the Spreadsheet service
5. THE Form Routing System SHALL complete manual processing of 1000 rows within 60 seconds

### Requirement 6

**User Story:** As a district administrator, I want the system to preserve all form data accurately, so that no information is lost during the routing process.

#### Acceptance Criteria

1. THE Form Routing System SHALL append the complete row data from the Source Sheet to the Destination Sheet
2. THE Form Routing System SHALL preserve the original column order when appending to Destination Sheets
3. THE Form Routing System SHALL preserve all data types (text, numbers, dates) without conversion
4. THE Form Routing System SHALL append rows starting at the next available row in each Destination Sheet
5. THE Form Routing System SHALL not modify or delete data in the Source Sheet

### Requirement 7

**User Story:** As a district administrator, I want each form submission to include a task management status dropdown, so that I can track the processing status of each request.

#### Acceptance Criteria

1. WHEN a form submission is received, THE Form Routing System SHALL add a data validation dropdown list to column K of the new row in the Source Sheet
2. THE Form Routing System SHALL configure the dropdown list with three options: "Approved", "Denied", "Processed"
3. THE Form Routing System SHALL set the dropdown to allow only values from the specified list
4. THE Form Routing System SHALL leave the dropdown cell empty by default without pre-selecting a value
5. THE Form Routing System SHALL apply the dropdown validation only to the newly submitted row without affecting existing rows
