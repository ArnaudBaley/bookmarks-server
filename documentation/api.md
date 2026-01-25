# API Documentation

## Overview

The Bookmarks API is a RESTful API built with NestJS that provides endpoints for managing bookmarks, groups, and tabs. All endpoints return JSON responses and use standard HTTP status codes.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: Configured via environment variables

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Content Type

All requests and responses use `application/json` content type.

## Bookmarks API

### Get All Bookmarks

Retrieve all bookmarks, optionally filtered by tab.

**Endpoint**: `GET /bookmarks`

**Query Parameters**:
- `tabId` (optional, string): Filter bookmarks by tab ID

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-string",
    "name": "Example Bookmark",
    "url": "https://example.com",
    "tabId": "uuid-string",
    "tabIds": ["uuid-string"],
    "groupIds": ["uuid-string"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Example Request**:
```http
GET /bookmarks?tabId=123e4567-e89b-12d3-a456-426614174000
```

### Create Bookmark

Create a new bookmark.

**Endpoint**: `POST /bookmarks`

**Request Body**:
```json
{
  "name": "Example Bookmark",
  "url": "https://example.com",
  "tabId": "uuid-string",        // Optional, backward compatibility
  "tabIds": ["uuid-string"],     // Optional, multiple tabs
  "groupIds": ["uuid-string"]    // Optional, multiple groups
}
```

**Validation Rules**:
- `name`: Required, string
- `url`: Required, string, must be valid URL
- `tabId`: Optional, string (backward compatibility)
- `tabIds`: Optional, array of strings
- `groupIds`: Optional, array of strings

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Example Bookmark",
  "url": "https://example.com",
  "tabId": "uuid-string",
  "tabIds": ["uuid-string"],
  "groupIds": ["uuid-string"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
  ```json
  {
    "statusCode": 400,
    "message": ["url must be a valid URL address"],
    "error": "Bad Request"
  }
  ```

### Update Bookmark

Update an existing bookmark.

**Endpoint**: `PUT /bookmarks/:id`

**Path Parameters**:
- `id` (string): Bookmark UUID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Bookmark Name",
  "url": "https://updated-url.com",
  "tabId": "uuid-string",
  "tabIds": ["uuid-string"],
  "groupIds": ["uuid-string"]
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Updated Bookmark Name",
  "url": "https://updated-url.com",
  "tabId": "uuid-string",
  "tabIds": ["uuid-string"],
  "groupIds": ["uuid-string"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Bookmark not found
- `400 Bad Request`: Validation error

### Delete Bookmark

Delete a bookmark by ID.

**Endpoint**: `DELETE /bookmarks/:id`

**Path Parameters**:
- `id` (string): Bookmark UUID

**Response**: `204 No Content`

**Error Responses**:
- `404 Not Found`: Bookmark not found

### Delete All Bookmarks

Delete all bookmarks.

**Endpoint**: `DELETE /bookmarks/all`

**Response**: `204 No Content`

## Groups API

### Get All Groups

Retrieve all groups, optionally filtered by tab.

**Endpoint**: `GET /groups`

**Query Parameters**:
- `tabId` (optional, string): Filter groups by tab ID

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-string",
    "name": "Development",
    "color": "#3b82f6",
    "tabId": "uuid-string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Create Group

Create a new group.

**Endpoint**: `POST /groups`

**Request Body**:
```json
{
  "name": "Development",
  "color": "#3b82f6",
  "tabId": "uuid-string"  // Optional
}
```

**Validation Rules**:
- `name`: Required, string
- `color`: Required, string
- `tabId`: Optional, string

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Development",
  "color": "#3b82f6",
  "tabId": "uuid-string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Group

Update an existing group.

**Endpoint**: `PUT /groups/:id`

**Path Parameters**:
- `id` (string): Group UUID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Group Name",
  "color": "#10b981",
  "tabId": "uuid-string"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Updated Group Name",
  "color": "#10b981",
  "tabId": "uuid-string",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Delete Group

Delete a group by ID.

**Endpoint**: `DELETE /groups/:id`

**Path Parameters**:
- `id` (string): Group UUID

**Response**: `204 No Content`

**Note**: Deleting a group does not delete associated bookmarks; they become ungrouped.

### Delete All Groups

Delete all groups.

**Endpoint**: `DELETE /groups/all`

**Response**: `204 No Content`

### Add Bookmark to Group

Assign a bookmark to a group.

**Endpoint**: `POST /groups/:groupId/bookmarks/:bookmarkId`

**Path Parameters**:
- `groupId` (string): Group UUID
- `bookmarkId` (string): Bookmark UUID

**Response**: `204 No Content`

**Error Responses**:
- `404 Not Found`: Group or bookmark not found

### Remove Bookmark from Group

Remove a bookmark from a group.

**Endpoint**: `DELETE /groups/:groupId/bookmarks/:bookmarkId`

**Path Parameters**:
- `groupId` (string): Group UUID
- `bookmarkId` (string): Bookmark UUID

**Response**: `204 No Content`

**Error Responses**:
- `404 Not Found`: Group or bookmark not found

## Tabs API

### Get All Tabs

Retrieve all tabs.

**Endpoint**: `GET /tabs`

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-string",
    "name": "Work",
    "color": "#8b5cf6",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Note**: Tabs are returned ordered by creation date (oldest first).

### Get Single Tab

Retrieve a single tab by ID.

**Endpoint**: `GET /tabs/:id`

**Path Parameters**:
- `id` (string): Tab UUID

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Work",
  "color": "#8b5cf6",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Tab not found

### Create Tab

Create a new tab.

**Endpoint**: `POST /tabs`

**Request Body**:
```json
{
  "name": "Work",
  "color": "#8b5cf6"  // Optional
}
```

**Validation Rules**:
- `name`: Required, string, must be unique
- `color`: Optional, string

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Work",
  "color": "#8b5cf6",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `409 Conflict`: Tab name already exists
  ```json
  {
    "statusCode": 409,
    "message": "Tab with name \"Work\" already exists",
    "error": "Conflict"
  }
  ```

### Update Tab

Update an existing tab.

**Endpoint**: `PUT /tabs/:id`

**Path Parameters**:
- `id` (string): Tab UUID

**Request Body** (all fields optional):
```json
{
  "name": "Updated Tab Name",
  "color": "#ef4444"
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Updated Tab Name",
  "color": "#ef4444",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Tab not found
- `409 Conflict`: Tab name already exists (if name changed)

### Delete Tab

Delete a tab by ID. This operation cascades to delete all associated groups and bookmarks.

**Endpoint**: `DELETE /tabs/:id`

**Path Parameters**:
- `id` (string): Tab UUID

**Response**: `204 No Content`

**Cascade Behavior**:
- Deletes all groups in the tab
- Deletes all bookmarks in the tab
- Cleans up all many-to-many relationships

**Error Responses**:
- `404 Not Found`: Tab not found

### Delete All Tabs

Delete all tabs and all associated data.

**Endpoint**: `DELETE /tabs/all`

**Response**: `204 No Content`

**Warning**: This deletes all tabs, groups, and bookmarks in the system.

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, POST, PUT requests |
| 201 | Created | Successful POST (not currently used) |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Validation errors, malformed requests |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Unique constraint violation (e.g., duplicate tab name) |
| 500 | Internal Server Error | Server errors |

## Error Response Format

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": ["field must be a string", "url must be a valid URL address"],
  "error": "Bad Request"
}
```

For single error messages:
```json
{
  "statusCode": 404,
  "message": "Bookmark with ID abc123 not found",
  "error": "Not Found"
}
```

## Validation Rules

### URL Validation
- Must be a valid URL format
- Uses JavaScript `URL` constructor for validation
- Custom validator: `@IsValidUrl()`

### String Validation
- Uses `@IsString()` decorator
- Empty strings are not allowed for required fields

### Array Validation
- Uses `@IsArray()` and `@IsString({ each: true })` for string arrays
- Each element must be a string

## Request/Response Examples

### Complete Workflow Example

#### 1. Create a Tab
```http
POST /tabs
Content-Type: application/json

{
  "name": "Development",
  "color": "#3b82f6"
}
```

#### 2. Create a Group
```http
POST /groups
Content-Type: application/json

{
  "name": "Frontend",
  "color": "#ef4444",
  "tabId": "tab-uuid-from-step-1"
}
```

#### 3. Create a Bookmark
```http
POST /bookmarks
Content-Type: application/json

{
  "name": "Vue.js Documentation",
  "url": "https://vuejs.org",
  "tabIds": ["tab-uuid-from-step-1"],
  "groupIds": ["group-uuid-from-step-2"]
}
```

#### 4. Add Bookmark to Group (Alternative Method)
```http
POST /groups/group-uuid-from-step-2/bookmarks/bookmark-uuid-from-step-3
```

#### 5. Get All Bookmarks for Tab
```http
GET /bookmarks?tabId=tab-uuid-from-step-1
```

## Testing

### Using HTTP Requests File

The project includes a `requests.http` file for testing API endpoints:

**Location**: `documentation/requests.http`

**Usage**: 
- Use with REST Client extension in VS Code
- Or use with any HTTP client that supports `.http` files

This file contains pre-configured requests for all API endpoints, including examples for creating bookmarks, groups, tabs, and managing relationships between them.

### Example cURL Commands

```bash
# Get all bookmarks
curl http://localhost:3000/bookmarks

# Create a bookmark
curl -X POST http://localhost:3000/bookmarks \
  -H "Content-Type: application/json" \
  -d '{"name":"Example","url":"https://example.com"}'

# Update a bookmark
curl -X PUT http://localhost:3000/bookmarks/bookmark-id \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Delete a bookmark
curl -X DELETE http://localhost:3000/bookmarks/bookmark-id
```

## CORS Configuration

The API is configured to accept requests from:
- Development: All origins (`*`)
- Production: Configured via `FRONTEND_URL` environment variable

**Allowed Methods**: GET, POST, PUT, DELETE

**Allowed Headers**: Content-Type, Authorization

## Notes

1. **UUID Format**: All IDs are UUID v4 strings (36 characters)
2. **Timestamps**: All timestamps are in ISO 8601 format (UTC)
3. **Backward Compatibility**: Bookmark `tabId` field is maintained for backward compatibility alongside `tabIds`
4. **Cascade Deletion**: Deleting a tab automatically deletes associated groups and bookmarks
5. **Unique Constraints**: Tab names must be unique across all tabs
6. **Many-to-Many**: Bookmarks can belong to multiple tabs and multiple groups
