# InsightFacade Frontend Usage Guide

This is a React TypeScript frontend for the InsightFacade project that provides a user interface for managing and querying UBC course sections datasets.

## Prerequisites

- Node.js (version 24)
- The InsightFacade backend server running on `http://localhost:3000`

## Installation

If you haven't already installed dependencies:

```bash
cd frontend
npm install
```

## Running the Application

### Step 1: Start the Backend Server

First, make sure your backend server is running:

```bash
# From the server directory
cd server
npm run dev
```

The server should be running on `http://localhost:3000`.

### Step 2: Start the Frontend

In a separate terminal, start the React frontend:

```bash
# From the frontend directory
cd frontend
npm start
```

The frontend will open in your browser at `http://localhost:3001`.

## Features

### 1. Add Dataset

- **Purpose**: Upload a ZIP file containing course sections data
- **How to use**:
  1. Navigate to the "Add Dataset" tab
  2. Enter a unique dataset ID (must not contain underscores or be only whitespace)
  3. Select a ZIP file containing course sections
  4. Click "Add Dataset"
- **Success**: You'll see a message showing all currently added datasets

### 2. Remove Dataset

- **Purpose**: Remove a previously added dataset
- **How to use**:
  1. Navigate to the "Remove Dataset" tab
  2. Enter the ID of the dataset you want to remove
  3. Click "Remove Dataset"
- **Success**: You'll see a confirmation message

### 3. List Datasets

- **Purpose**: View all currently added datasets
- **How to use**:
  1. Navigate to the "List Datasets" tab
  2. Click "Refresh Dataset List"
- **Display**: Shows a table with dataset ID, kind (sections), and number of rows

### 4. Perform Query

- **Purpose**: Execute queries on added datasets
- **How to use**:
  1. Navigate to the "Perform Query" tab
  2. Enter your query in JSON format (or click "Load Example" for a template)
  3. Click "Execute Query"
- **Results**: Query results will be displayed in a table below the query input

#### Example Query

```json
{
	"WHERE": {
		"GT": {
			"courses_avg": 97
		}
	},
	"OPTIONS": {
		"COLUMNS": ["courses_dept", "courses_id", "courses_avg"],
		"ORDER": "courses_avg"
	}
}
```

This query finds all course sections with an average grade greater than 97 and displays the department, course ID, and average.

## Query Format

Queries follow the EBNF specification from the InsightFacade project:

- **WHERE**: Filter conditions (GT, LT, EQ, IS, AND, OR, NOT)
- **OPTIONS**: Display options
  - **COLUMNS**: Fields to display
  - **ORDER**: Field to sort by (optional)
- **TRANSFORMATIONS**: Grouping and aggregations (optional)

## Available Fields for Sections

- `courses_dept`: Department offering the course
- `courses_id`: Course number
- `courses_avg`: Average grade
- `courses_instructor`: Instructor name
- `courses_title`: Course title
- `courses_pass`: Number of students who passed
- `courses_fail`: Number of students who failed
- `courses_audit`: Number of students who audited
- `courses_uuid`: Unique identifier for the section
- `courses_year`: Year the section was offered

## Troubleshooting

### Connection Issues

If you see network errors:

1. Ensure the backend server is running on `http://localhost:3000`
2. Check that CORS is enabled on the backend (it should be by default)
3. Verify both frontend and backend are running

### Dataset Upload Issues

If dataset upload fails:

1. Ensure the ZIP file is properly formatted
2. Check that the dataset ID doesn't already exist
3. Verify the ID doesn't contain underscores

### Query Errors

Common query errors:

- **Invalid JSON**: Check your JSON syntax
- **Dataset not found**: Ensure you've added a dataset with the ID referenced in your query
- **Invalid query structure**: Verify your query follows the correct format
- **Result too large**: Query returned more than 5000 results

## Development

To build for production:

```bash
npm run build
```

To run tests:

```bash
npm test
```

## Architecture

- **API Service** (`src/services/api.ts`): Handles all HTTP requests to the backend
- **Types** (`src/services/types.ts`): TypeScript interfaces and types
- **Components** (`src/components/`): React components for each feature
  - `AddDataset.tsx`: Upload datasets
  - `RemoveDataset.tsx`: Delete datasets
  - `ListDatasets.tsx`: View all datasets
  - `PerformQuery.tsx`: Execute queries
- **App.tsx**: Main application with tab navigation
