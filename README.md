# AI Periodic Table

An interactive web application that visualizes Appspace Intelligence features as elements in a periodic table.

## Getting Started

1. Clone the repository
2. Open `index.html` in your browser
3. No build tools or dependencies required

## Features

### Periodic Table View
- Elements are organized into 5 columns (Reactive, Retrieval, Orchestration, Validation, Models) and 4 rows (Primitives, Compositions, Deployment, Emerging)
- Click any element to view its description
- Click row or column headers to highlight entire rows/columns

### Feature Explorer
- Browse AI features in the left sidebar
- Filter features by product area (Digital Signage, Employee Comms, Space Reservation, Integration/Copilot)
- Click a feature to highlight its associated elements on the table

### Element Selection
- **Single click**: View element description
- **Double click**: Mark element orange
- **Triple click**: Mark element red
- Use multiple selection states to compare and analyze different element combinations

### Game Mode
- Click the game icon in the header to start
- Answer 5 questions in 4 minutes
- Match features to their correct elements
- Track your score and try to beat it

### Theme Toggle
- Switch between light and dark modes using the theme icon in the header
- Your preference is saved automatically

## Adding New Features

1. Create a new JSON file in the `features/` folder:
```json
{
  "title": "Feature Name",
  "description": "Short description",
  "longDescription": "Detailed description",
  "elements": ["Pr", "Ag"],
  "productAreas": ["Employee Comms"],
  "productAreaDetails": {
    "Employee Comms": "How this feature applies to Employee Comms"
  }
}
```

2. Add the filename to `features/features-list.json`

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).
