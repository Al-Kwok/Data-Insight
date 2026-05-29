# REST API Compliance Report

## Overview
The InsightFacade server is now a fully REST-compliant API with proper versioning, resource naming, HTTP methods, status codes, and statelessness.

## REST Principles Compliance

### ✅ 1. API Versioning
**Requirement:** APIs should be versioned to allow for future changes without breaking existing clients.

**Implementation:**
- All endpoints are prefixed with `/api/v1/`
- Version constant: `const API_VERSION = "/api/v1"`
- Allows for future versions (e.g., `/api/v2/`) without breaking existing clients

**Example:**
```
/api/v1/datasets/:id/:kind
/api/v1/datasets/:id
/api/v1/datasets
/api/v1/queries
```

### ✅ 2. Resource Naming (Nouns, Not Verbs)
**Requirement:** URLs should represent resources (nouns), not actions (verbs). HTTP methods provide the verbs.

**Implementation:**
- ✅ `/datasets` - Collection of datasets (noun)
- ✅ `/datasets/:id` - Specific dataset resource (noun)
- ✅ `/queries` - Query resource (noun, not "performQuery" or "executeQuery")

**Before (Non-RESTful):**
```
❌ /dataset/:id/:kind    (singular for collection)
❌ /query                (could be confused as singular)
```

**After (RESTful):**
```
✅ /api/v1/datasets/:id/:kind
✅ /api/v1/queries
```

### ✅ 3. HTTP Methods (Verbs)
**Requirement:** Use appropriate HTTP methods for CRUD operations.

**Implementation:**

| Operation | Method | Endpoint | Purpose |
|-----------|--------|----------|---------|
| Create | PUT | `/api/v1/datasets/:id/:kind` | Add a new dataset |
| Read | GET | `/api/v1/datasets` | List all datasets |
| Delete | DELETE | `/api/v1/datasets/:id` | Remove a dataset |
| Query | POST | `/api/v1/queries` | Execute a query |

**Rationale:**
- **PUT** for datasets: Used because the client specifies the ID (idempotent)
- **GET** for listing: Standard retrieval operation
- **DELETE** for removal: Standard deletion operation
- **POST** for queries: Creates a query execution (not idempotent)

### ✅ 4. HTTP Status Codes
**Requirement:** Use appropriate HTTP status codes to indicate request outcomes.

**Implementation:**

#### Success Codes:
- **200 OK** - Successful GET, DELETE operations
- **201 Created** - Successful PUT (dataset creation)

#### Client Error Codes:
- **400 Bad Request** - Invalid input, validation errors
- **404 Not Found** - Resource not found

#### Server Error Codes:
- **500 Internal Server Error** - Unexpected server errors

**Examples:**

```typescript
// 201 Created - New resource created
PUT /api/v1/datasets/courses/sections
→ 201 { result: ["courses"] }

// 200 OK - Successful retrieval
GET /api/v1/datasets
→ 200 { result: [...] }

// 404 Not Found - Dataset doesn't exist
DELETE /api/v1/datasets/nonexistent
→ 404 { error: "Dataset with id 'nonexistent' not found" }

// 400 Bad Request - Invalid input
PUT /api/v1/datasets/invalid_id/sections
→ 400 { error: "Dataset ID cannot contain underscores" }
```

### ✅ 5. Statelessness
**Requirement:** Each request must contain all information needed to process it. Server should not maintain session state.

**Implementation:**
- ❌ No session management
- ❌ No cookies for authentication
- ❌ No server-side session storage
- ✅ Each request is independent
- ✅ Server state (datasets) is persisted to disk, not in session
- ✅ CORS enabled for cross-origin requests

**Evidence:**
```typescript
// Each request contains all needed information
PUT /api/v1/datasets/courses/sections
{
  content: "base64_encoded_zip_data"
}

// No session ID, no auth tokens (stateless)
```

### ✅ 6. Consistent Response Format
**Requirement:** API responses should follow a consistent structure.

**Implementation:**

**Success Response:**
```json
{
  "result": <data>
}
```

**Error Response:**
```json
{
  "error": "<error message>"
}
```

**Examples:**
```typescript
// Success
{ result: ["courses", "sections"] }
{ result: [{ id: "courses", kind: "sections", numRows: 64612 }] }

// Error
{ error: "Dataset with id 'test' not found" }
{ error: "Invalid dataset kind. Must be 'sections' or 'rooms'" }
```

## API Endpoint Specification

### 1. Add Dataset
```
PUT /api/v1/datasets/:id/:kind
```

**Parameters:**
- `id` (path): Dataset identifier (no underscores, not only whitespace)
- `kind` (path): Dataset type (`sections` or `rooms`)

**Request Body:**
```json
{
  "content": "<base64_encoded_zip_file>"
}
```

**Success Response (201 Created):**
```json
{
  "result": ["dataset_id_1", "dataset_id_2"]
}
```

**Error Responses:**
- `400` - Invalid ID, missing content, invalid kind, no valid data in ZIP
- `500` - Internal server error

### 2. Remove Dataset
```
DELETE /api/v1/datasets/:id
```

**Parameters:**
- `id` (path): Dataset identifier to remove

**Success Response (200 OK):**
```json
{
  "result": "removed_dataset_id"
}
```

**Error Responses:**
- `404` - Dataset not found
- `400` - Invalid ID format
- `500` - Internal server error

### 3. List Datasets
```
GET /api/v1/datasets
```

**Success Response (200 OK):**
```json
{
  "result": [
    {
      "id": "courses",
      "kind": "sections",
      "numRows": 64612
    }
  ]
}
```

**Error Responses:**
- `500` - Internal server error

### 4. Perform Query
```
POST /api/v1/queries
```

**Request Body:**
```json
{
  "WHERE": {
    "GT": { "courses_avg": 97 }
  },
  "OPTIONS": {
    "COLUMNS": ["courses_dept", "courses_id", "courses_avg"],
    "ORDER": "courses_avg"
  }
}
```

**Success Response (200 OK):**
```json
{
  "result": [
    {
      "courses_dept": "cpsc",
      "courses_id": "310",
      "courses_avg": 98.5
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid query format, result too large (>5000 results), dataset not found
- `500` - Internal server error

## REST Best Practices Checklist

- [x] **Versioning:** API endpoints include version number (`/api/v1/`)
- [x] **Nouns for Resources:** URLs use nouns (`datasets`, `queries`), not verbs
- [x] **HTTP Methods:** Proper use of GET, POST, PUT, DELETE
- [x] **Status Codes:** Appropriate HTTP status codes (200, 201, 400, 404, 500)
- [x] **Statelessness:** No session management, each request is independent
- [x] **Consistent Format:** Uniform response structure for success and errors
- [x] **CORS Support:** Cross-origin requests enabled
- [x] **Error Messages:** Clear, descriptive error messages
- [x] **Resource Hierarchies:** Proper nesting (`/datasets/:id`)
- [x] **Idempotency:** PUT operations are idempotent

## Frontend Integration

The React frontend has been updated to use the new REST endpoints:

**API Service (`frontend/src/services/api.ts`):**
```typescript
const API_BASE_URL = '/api/v1';

// Uses RESTful endpoints
PUT /api/v1/datasets/:id/:kind
DELETE /api/v1/datasets/:id
GET /api/v1/datasets
POST /api/v1/queries
```

## Testing the API

### Using curl:

```bash
# List datasets
curl http://localhost:3000/api/v1/datasets

# Add a dataset
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"content":"<base64_zip>"}' \
  http://localhost:3000/api/v1/datasets/courses/sections

# Remove a dataset
curl -X DELETE http://localhost:3000/api/v1/datasets/courses

# Perform a query
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"WHERE":{"GT":{"courses_avg":97}},"OPTIONS":{"COLUMNS":["courses_dept"]}}' \
  http://localhost:3000/api/v1/queries
```

### Using the Frontend:

Access the web interface at `http://localhost:3000` which uses the REST API through the service layer.

## Conclusion

The InsightFacade server **fully complies with REST API conventions**:

1. ✅ **Versioned** - `/api/v1/` prefix for all endpoints
2. ✅ **Resource-oriented** - Uses nouns for URLs
3. ✅ **HTTP methods** - Proper GET, PUT, DELETE, POST usage
4. ✅ **Status codes** - Appropriate HTTP status codes
5. ✅ **Stateless** - No session management
6. ✅ **Multiple endpoints** - 4 distinct REST endpoints
7. ✅ **Frontend integration** - All endpoints used by React frontend

The API is production-ready and follows industry-standard REST practices.
