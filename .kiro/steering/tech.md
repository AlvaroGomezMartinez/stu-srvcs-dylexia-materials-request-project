---
inclusion: always
---

# Technology Stack

## Platform
- **Google Apps Script**: Server-side JavaScript platform for Google Workspace automation
- **Project Type**: Bound script (attached to Google Sheets)
- **Runtime**: V8 JavaScript engine
- **Timezone**: America/Chicago

## Development Tools
- **clasp**: Command-line tool for Google Apps Script development
- **File Extensions**: `.js`, `.gs` for scripts; `.html` for web apps; `.json` for manifests

## Project Structure
- Single-file architecture with `Code.js` containing all functionality
- Configuration managed through `appsscript.json`
- Deployment managed via `.clasp.json`

## Common Commands

### Development
```bash
# Push local changes to Google Apps Script
clasp push

# Pull remote changes from Google Apps Script  
clasp pull

# Open the script in the Apps Script editor
clasp open

# Deploy the script
clasp deploy
```

### Testing
- Testing is done directly in the Google Apps Script editor
- Use `console.log()` for debugging (viewable in Apps Script execution logs)
- Test triggers manually before setting up automated form submission triggers

## Key Dependencies
- Google Sheets API (built-in)
- SpreadsheetApp service for sheet manipulation
- No external libraries or npm dependencies

## Deployment & Triggers
- **Active Trigger**: Form submission trigger on `sortAndAppendByCampus()` function
- **Trigger Event**: "From spreadsheet - On form submit" event from bound Google Form
- **Deployment**: Uses HEAD deployment for real-time execution
- **Execution**: Automatic processing when new form responses are submitted

## Security & Access
- **Environment**: District intranet (behind firewall)
- **Authentication**: Requires NISD Google Workspace login
- **Data Access**: Spreadsheet responses and form only accessible when logged in to the district network
- **Devlopment Constraints**: Testing and debuggin limited to authenticated district sessions