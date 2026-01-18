# Backend Documentation

## Overview

The backend is a NestJS application that provides a RESTful API for managing bookmarks, groups, and tabs. It uses TypeORM for database operations with SQLite as the database engine, and implements validation using class-validator.

## Tech Stack

- **Framework**: NestJS 11
- **Language**: TypeScript
- **ORM**: TypeORM 0.3
- **Database**: SQLite 3
- **Validation**: class-validator, class-transformer
- **UUID**: uuid v10

## Project Structure

```
backend/
├── src/
│   ├── bookmarks/           # Bookmark module
│   │   ├── bookmarks.controller.ts
│   │   ├── bookmarks.service.ts
│   │   ├── bookmarks.module.ts
│   │   └── dto/
│   │       ├── create-bookmark.dto.ts
│   │       └── update-bookmark.dto.ts
│   ├── groups/              # Group module
│   │   ├── groups.controller.ts
│   │   ├── groups.service.ts
│   │   ├── groups.module.ts
│   │   └── dto/
│   │       ├── create-group.dto.ts
│   │       └── update-group.dto.ts
│   ├── tabs/                # Tab module
│   │   ├── tabs.controller.ts
│   │   ├── tabs.service.ts
│   │   ├── tabs.module.ts
│   │   └── dto/
│   │       ├── create-tab.dto.ts
│   │       └── update-tab.dto.ts
│   ├── entities/            # TypeORM entities
│   │   ├── bookmark.entity.ts
│   │   ├── group.entity.ts
│   │   └── tab.entity.ts
│   ├── common/              # Shared utilities
│   │   └── validators/
│   │       └── is-valid-url.validator.ts
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   ├── app.service.ts       # Root service
│   └── main.ts              # Application entry point
├── test/                    # E2E tests
├── deploy/                  # Deployment configurations
└── requests.http            # API testing file
```

## Modules

### App Module
- **Location**: `src/app.module.ts`
- **Purpose**: Root module that imports all feature modules
- **Configuration**:
  - TypeORM configuration with SQLite
  - Entity registration
  - Module imports (BookmarksModule, GroupsModule, TabsModule)

### Bookmarks Module
- **Location**: `src/bookmarks/bookmarks.module.ts`
- **Dependencies**: TypeORM repositories for Bookmark, Group, Tab
- **Exports**: BookmarksController, BookmarksService
- **Features**: CRUD operations for bookmarks with group and tab relationships

### Groups Module
- **Location**: `src/groups/groups.module.ts`
- **Dependencies**: TypeORM repositories for Group, Bookmark
- **Exports**: GroupsController, GroupsService
- **Features**: CRUD operations for groups, bookmark assignment

### Tabs Module
- **Location**: `src/tabs/tabs.module.ts`
- **Dependencies**: TypeORM repositories for Tab, Group, Bookmark
- **Exports**: TabsController, TabsService
- **Features**: CRUD operations for tabs with cascade deletion

## Entities

### Bookmark Entity
- **Location**: `src/entities/bookmark.entity.ts`
- **Table**: `bookmarks`
- **Fields**:
  - `id` (string, UUID, Primary Key)
  - `name` (string, 255 chars)
  - `url` (text)
  - `tabId` (string, nullable, for backward compatibility)
  - `createdAt` (Date, auto-generated)
  - `updatedAt` (Date, auto-generated)
- **Relationships**:
  - Many-to-Many with `Tab` (via `bookmark_tabs` junction table)
  - Many-to-Many with `Group` (via `bookmark_groups` junction table)
  - Many-to-One with `Tab` (via `tabId`, backward compatibility)

### Group Entity
- **Location**: `src/entities/group.entity.ts`
- **Table**: `groups`
- **Fields**:
  - `id` (string, UUID, Primary Key)
  - `name` (string, 255 chars)
  - `color` (string, 50 chars)
  - `tabId` (string, nullable)
  - `createdAt` (Date, auto-generated)
  - `updatedAt` (Date, auto-generated)
- **Relationships**:
  - Many-to-One with `Tab` (via `tabId`)
  - Many-to-Many with `Bookmark` (via `bookmark_groups` junction table)

### Tab Entity
- **Location**: `src/entities/tab.entity.ts`
- **Table**: `tabs`
- **Fields**:
  - `id` (string, UUID, Primary Key)
  - `name` (string, 255 chars, unique)
  - `color` (string, nullable, 50 chars)
  - `createdAt` (Date, auto-generated)
  - `updatedAt` (Date, auto-generated)
- **Constraints**: Unique name constraint

## Controllers

### Bookmarks Controller
- **Location**: `src/bookmarks/bookmarks.controller.ts`
- **Base Path**: `/bookmarks`
- **Endpoints**:
  - `GET /bookmarks?tabId=xxx` - Get all bookmarks (optionally filtered by tab)
  - `POST /bookmarks` - Create new bookmark
  - `PUT /bookmarks/:id` - Update bookmark
  - `DELETE /bookmarks/:id` - Delete bookmark
  - `DELETE /bookmarks/all` - Delete all bookmarks
- **Response Format**: Returns bookmark with `tabIds` and `groupIds` arrays

### Groups Controller
- **Location**: `src/groups/groups.controller.ts`
- **Base Path**: `/groups`
- **Endpoints**:
  - `GET /groups?tabId=xxx` - Get all groups (optionally filtered by tab)
  - `POST /groups` - Create new group
  - `PUT /groups/:id` - Update group
  - `DELETE /groups/:id` - Delete group
  - `DELETE /groups/all` - Delete all groups
  - `POST /groups/:groupId/bookmarks/:bookmarkId` - Add bookmark to group
  - `DELETE /groups/:groupId/bookmarks/:bookmarkId` - Remove bookmark from group

### Tabs Controller
- **Location**: `src/tabs/tabs.controller.ts`
- **Base Path**: `/tabs`
- **Endpoints**:
  - `GET /tabs` - Get all tabs
  - `GET /tabs/:id` - Get single tab
  - `POST /tabs` - Create new tab
  - `PUT /tabs/:id` - Update tab
  - `DELETE /tabs/:id` - Delete tab (cascades to groups and bookmarks)
  - `DELETE /tabs/all` - Delete all tabs

## Services

### Bookmarks Service
- **Location**: `src/bookmarks/bookmarks.service.ts`
- **Methods**:
  - `findAll(tabId?)`: Query bookmarks with optional tab filter, includes relations
  - `findOne(id)`: Get single bookmark with relations
  - `create(dto)`: Create bookmark with tab and group relationships
  - `update(id, dto)`: Update bookmark and relationships
  - `remove(id)`: Delete bookmark
  - `removeAll()`: Delete all bookmarks
- **Features**:
  - Supports both `tabId` (backward compatibility) and `tabIds` (multiple tabs)
  - Handles many-to-many relationships with tabs and groups
  - Uses UUID for IDs

### Groups Service
- **Location**: `src/groups/groups.service.ts`
- **Methods**:
  - `findAll(tabId?)`: Get groups with optional tab filter
  - `findOne(id)`: Get single group with bookmarks
  - `create(dto)`: Create new group
  - `update(id, dto)`: Update group
  - `remove(id)`: Delete group
  - `addBookmarkToGroup(groupId, bookmarkId)`: Assign bookmark to group
  - `removeBookmarkFromGroup(groupId, bookmarkId)`: Unassign bookmark from group
  - `removeAll()`: Delete all groups (cleans up relationships)
- **Features**:
  - Manages many-to-many relationship with bookmarks
  - Prevents duplicate assignments

### Tabs Service
- **Location**: `src/tabs/tabs.service.ts`
- **Methods**:
  - `findAll()`: Get all tabs ordered by creation date
  - `findOne(id)`: Get single tab
  - `findByName(name)`: Find tab by name (for uniqueness check)
  - `create(dto)`: Create new tab (validates unique name)
  - `update(id, dto)`: Update tab (validates unique name)
  - `remove(id)`: Delete tab with cascade deletion of groups and bookmarks
  - `removeAll()`: Delete all tabs and related data
- **Features**:
  - Unique name constraint validation
  - Cascade deletion: deleting a tab removes associated groups and bookmarks
  - Cleans up many-to-many relationships before deletion

## Data Transfer Objects (DTOs)

### CreateBookmarkDto
- **Location**: `src/bookmarks/dto/create-bookmark.dto.ts`
- **Fields**:
  - `name` (string, required)
  - `url` (string, required, validated as URL)
  - `tabId` (string, optional, backward compatibility)
  - `tabIds` (string[], optional, multiple tabs)
  - `groupIds` (string[], optional)

### UpdateBookmarkDto
- **Location**: `src/bookmarks/dto/update-bookmark.dto.ts`
- **Fields**: All fields optional (same as CreateBookmarkDto)

### CreateGroupDto
- **Location**: `src/groups/dto/create-group.dto.ts`
- **Fields**:
  - `name` (string, required)
  - `color` (string, required)
  - `tabId` (string, optional)

### UpdateGroupDto
- **Location**: `src/groups/dto/update-group.dto.ts`
- **Fields**: All fields optional (same as CreateGroupDto)

### CreateTabDto
- **Location**: `src/tabs/dto/create-tab.dto.ts`
- **Fields**:
  - `name` (string, required)
  - `color` (string, optional)

### UpdateTabDto
- **Location**: `src/tabs/dto/update-tab.dto.ts`
- **Fields**: All fields optional (same as CreateTabDto)

## Validation

### Custom Validators

#### IsValidUrl Validator
- **Location**: `src/common/validators/is-valid-url.validator.ts`
- **Purpose**: Validates that a string is a valid URL
- **Usage**: Applied to `url` fields in bookmark DTOs
- **Implementation**: Uses JavaScript `URL` constructor for validation

### Global Validation Pipe
- **Location**: `src/main.ts`
- **Configuration**:
  - `whitelist: true` - Strips non-whitelisted properties
  - `forbidNonWhitelisted: true` - Throws error for non-whitelisted properties
  - `transform: true` - Automatically transforms payloads to DTO instances

## Database Configuration

### TypeORM Setup
- **Location**: `src/app.module.ts`
- **Database**: SQLite
- **Database Path**: `process.env.DATABASE_PATH || 'bookmarks.db'`
- **Synchronize**: `true` (auto-sync schema in development)
- **Entities**: Bookmark, Group, Tab

### Database Schema
- **Junction Tables**:
  - `bookmark_tabs`: Many-to-many between bookmarks and tabs
  - `bookmark_groups`: Many-to-many between bookmarks and groups
- **Auto-generated Fields**: `createdAt`, `updatedAt` timestamps

## Application Bootstrap

### Main Entry Point
- **Location**: `src/main.ts`
- **Configuration**:
  - CORS enabled for frontend communication
  - Global validation pipe
  - Port: `process.env.PORT ?? 3000`
  - Frontend URL: `process.env.FRONTEND_URL || '*'`

### CORS Configuration
- Allows all origins in development (`*`)
- Methods: GET, POST, PUT, DELETE
- Headers: Content-Type, Authorization

## Error Handling

### HTTP Status Codes
- `200 OK`: Successful GET, PUT requests
- `201 Created`: Successful POST requests
- `204 No Content`: Successful DELETE requests
- `400 Bad Request`: Validation errors
- `404 Not Found`: Resource not found
- `409 Conflict`: Unique constraint violation (e.g., duplicate tab name)

### Exception Types
- `NotFoundException`: Resource not found
- `ConflictException`: Unique constraint violation
- Validation errors: Automatically handled by ValidationPipe

## Development

### Running the Application
```bash
npm run start          # Start application
npm run start:dev      # Start in watch mode
npm run start:debug    # Start in debug mode
npm run start:prod     # Start production build
```

### Testing
```bash
npm run test           # Run unit tests
npm run test:watch     # Watch mode
npm run test:cov       # With coverage
npm run test:e2e       # Run E2E tests
```

### Code Quality
```bash
npm run lint           # Run ESLint
npm run format         # Format with Prettier
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `FRONTEND_URL`: Allowed CORS origin (default: `*`)
- `DATABASE_PATH`: SQLite database file path (default: `bookmarks.db`)

## API Testing

### HTTP Requests File
- **Location**: `backend/requests.http`
- **Purpose**: Pre-configured HTTP requests for testing API endpoints
- **Usage**: Use with REST Client extension in VS Code or similar tools

## Key Features

1. **RESTful API**: Standard HTTP methods and status codes
2. **Type Safety**: Full TypeScript coverage with DTOs
3. **Validation**: Request validation using class-validator
4. **Relationships**: Complex many-to-many and one-to-many relationships
5. **Cascade Deletion**: Automatic cleanup of related entities
6. **Backward Compatibility**: Supports both `tabId` and `tabIds` for bookmarks
7. **UUID Generation**: Automatic UUID generation for entity IDs
8. **Timestamps**: Auto-generated created/updated timestamps
