---
inclusion: always
---

# Project Structure

## Root Directory Layout

```
├── .clasp.json          # clasp configuration (deployment settings)
├── .claspignore         # Files to exclude from clasp push/pull
├── appsscript.json      # Apps Script manifest (timezone, runtime, dependencies)
├── Code.js              # Main script file with all functionality
└── .gitignore           # Version control exclusions
```

## Code Organization

### Main Script (`Code.js`)

- **Constants Section**: Campus name arrays for ES/MS/HS categorization
- **Main Function**: `sortAndAppendByCampus()` - primary automation logic
- **Helper Function**: `appendRows()` - batch sheet operations for performance

### Data Flow Architecture

1. **Source**: "Form Responses 1" sheet (Google Form submissions)
2. **Processing**: Campus-based categorization using predefined lists
3. **Destinations**: Three target sheets ("ES", "MS", "HS")

## Naming Conventions

- **Functions**: camelCase (e.g., `sortAndAppendByCampus`)
- **Constants**: camelCase with descriptive prefixes (e.g., `nisdElementaryCampusNames`)
- **Variables**: camelCase with clear, descriptive names
- **Sheet Names**: Abbreviations ("ES", "MS", "HS") or descriptive names ("Form Responses 1")

## Configuration Files

- **`.clasp.json`**: Contains script ID and file extension mappings (excluded from git)
- **`appsscript.json`**: Runtime settings, timezone, and dependency declarations
- **`.claspignore`**: Defines files excluded from Apps Script deployment

## Development Patterns

- Single-file architecture for simplicity
- Comprehensive JSDoc documentation
- Performance-optimized batch operations
- Defensive programming with null checks and fallbacks
