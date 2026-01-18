# Architecture Documentation

## System Overview

The bookmarks application follows a client-server architecture with a clear separation between frontend and backend. The frontend is a Vue 3 Single Page Application (SPA) that communicates with a NestJS REST API backend. Data is persisted in a SQLite database using TypeORM.

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client Browser"]
        UI[Vue 3 Frontend]
        Store[Pinia Stores]
        API_Service[API Services]
    end
    
    subgraph Server["Backend Server"]
        Controller[NestJS Controllers]
        Service[Business Logic Services]
        ORM[TypeORM]
    end
    
    subgraph Data["Data Layer"]
        DB[(SQLite Database)]
    end
    
    UI --> Store
    Store --> API_Service
    API_Service -->|HTTP REST| Controller
    Controller --> Service
    Service --> ORM
    ORM --> DB
```

## Component Architecture

### Frontend Component Hierarchy

```mermaid
graph TD
    App[App.vue<br/>Root Component]
    Router[RouterView]
    HomeView[HomeView.vue<br/>Main Page]
    
    subgraph Components["Reusable Components"]
        TabSwitcher[TabSwitcher]
        GroupCard[GroupCard]
        BookmarkCard[BookmarkCard]
        Forms[Forms<br/>Add/Edit]
        Modals[Modals<br/>Settings/Export]
        ThemeToggle[ThemeToggle]
    end
    
    App --> Router
    Router --> HomeView
    HomeView --> TabSwitcher
    HomeView --> GroupCard
    HomeView --> BookmarkCard
    HomeView --> Forms
    HomeView --> Modals
    HomeView --> ThemeToggle
    GroupCard --> BookmarkCard
```

## Data Flow

### Creating a Bookmark

```mermaid
sequenceDiagram
    participant User
    participant Component as AddBookmarkForm
    participant Store as BookmarkStore
    participant API as BookmarkAPI
    participant Backend as NestJS Backend
    participant DB as SQLite
    
    User->>Component: Fill form & submit
    Component->>Store: addBookmark(data)
    Store->>API: createBookmark(data)
    API->>Backend: POST /bookmarks
    Backend->>Backend: Validate DTO
    Backend->>DB: Save bookmark
    DB-->>Backend: Bookmark saved
    Backend-->>API: 200 OK + bookmark
    API-->>Store: Bookmark object
    Store->>Store: Update state
    Store-->>Component: State updated
    Component->>User: Show success / close form
```

### Fetching Bookmarks

```mermaid
sequenceDiagram
    participant Component as HomeView
    participant Store as BookmarkStore
    participant API as BookmarkAPI
    participant Backend as NestJS Backend
    participant DB as SQLite
    
    Component->>Store: fetchBookmarks(tabId)
    Store->>Store: Set loading = true
    Store->>API: getAllBookmarks(tabId)
    API->>Backend: GET /bookmarks?tabId=xxx
    Backend->>DB: Query with relations
    DB-->>Backend: Bookmarks + groups + tabs
    Backend-->>API: 200 OK + array
    API-->>Store: Bookmark[]
    Store->>Store: Update bookmarks array
    Store->>Store: Set loading = false
    Store-->>Component: Reactive update
    Component->>Component: Render bookmarks
```

## State Management Flow

### Pinia Store Architecture

```mermaid
graph LR
    subgraph Stores["Pinia Stores"]
        BookmarkStore[Bookmark Store]
        GroupStore[Group Store]
        TabStore[Tab Store]
        ThemeStore[Theme Store]
    end
    
    subgraph Services["API Services"]
        BookmarkAPI[Bookmark API]
        GroupAPI[Group API]
        TabAPI[Tab API]
    end
    
    subgraph Backend["Backend"]
        BookmarkController[Bookmark Controller]
        GroupController[Group Controller]
        TabController[Tab Controller]
    end
    
    BookmarkStore --> BookmarkAPI
    GroupStore --> GroupAPI
    TabStore --> TabAPI
    
    BookmarkAPI --> BookmarkController
    GroupAPI --> GroupController
    TabAPI --> TabController
    
    BookmarkStore -.->|Uses| TabStore
    GroupStore -.->|Uses| TabStore
    GroupStore -.->|Uses| BookmarkStore
```

## Backend Architecture

### NestJS Module Structure

```mermaid
graph TB
    AppModule[App Module<br/>Root Module]
    
    subgraph FeatureModules["Feature Modules"]
        BookmarksModule[Bookmarks Module]
        GroupsModule[Groups Module]
        TabsModule[Tabs Module]
    end
    
    subgraph Shared["Shared Resources"]
        TypeORM[TypeORM Module]
        Entities[Entities<br/>Bookmark, Group, Tab]
    end
    
    AppModule --> BookmarksModule
    AppModule --> GroupsModule
    AppModule --> TabsModule
    AppModule --> TypeORM
    
    BookmarksModule --> Entities
    GroupsModule --> Entities
    TabsModule --> Entities
    TypeORM --> Entities
```

### Request Processing Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller as NestJS Controller
    participant Service as Business Service
    participant Repository as TypeORM Repository
    participant DB as SQLite
    
    Client->>Controller: HTTP Request
    Controller->>Controller: Validate DTO
    Controller->>Service: Call service method
    Service->>Repository: Query/Update
    Repository->>DB: SQL Query
    DB-->>Repository: Result
    Repository-->>Service: Entity/Entities
    Service-->>Controller: Return data
    Controller->>Controller: Format response
    Controller-->>Client: HTTP Response
```

## Entity Relationships

### Database Relationships

```mermaid
erDiagram
    TAB ||--o{ GROUP : "has"
    TAB ||--o{ BOOKMARK : "belongs to"
    GROUP ||--o{ BOOKMARK : "contains"
    
    TAB {
        string id PK
        string name UK
        string color
        datetime createdAt
        datetime updatedAt
    }
    
    GROUP {
        string id PK
        string name
        string color
        string tabId FK
        datetime createdAt
        datetime updatedAt
    }
    
    BOOKMARK {
        string id PK
        string name
        text url
        string tabId FK
        datetime createdAt
        datetime updatedAt
    }
    
    BOOKMARK_TABS {
        string bookmark_id FK
        string tab_id FK
    }
    
    BOOKMARK_GROUPS {
        string bookmark_id FK
        string group_id FK
    }
    
    BOOKMARK ||--o{ BOOKMARK_TABS : "many-to-many"
    TAB ||--o{ BOOKMARK_TABS : "many-to-many"
    BOOKMARK ||--o{ BOOKMARK_GROUPS : "many-to-many"
    GROUP ||--o{ BOOKMARK_GROUPS : "many-to-many"
```

## API Service Pattern

### Factory Pattern for API Services

```mermaid
graph TB
    subgraph Frontend["Frontend"]
        Store[Pinia Store]
        Interface[IBookmarkApi Interface]
        Factory[API Factory]
        MockAPI[Mock Implementation]
        HttpAPI[HTTP Implementation]
    end
    
    subgraph Backend["Backend"]
        REST[REST API]
    end
    
    Store --> Interface
    Interface --> Factory
    Factory -->|VITE_USE_MOCK_API=true| MockAPI
    Factory -->|VITE_USE_MOCK_API=false| HttpAPI
    HttpAPI --> REST
    MockAPI -.->|No network| Store
```

## Data Persistence

### TypeORM Configuration

```mermaid
graph LR
    AppModule[App Module]
    TypeOrmModule[TypeORM Module]
    Config[Configuration]
    Entities[Entity Classes]
    DB[(SQLite DB)]
    
    AppModule --> TypeOrmModule
    TypeOrmModule --> Config
    Config --> Entities
    Entities -->|Synchronize| DB
    DB -->|Query Results| Entities
```

## Frontend-Backend Communication

### HTTP Request/Response Cycle

```mermaid
graph LR
    subgraph Frontend["Frontend"]
        Component[Vue Component]
        Store[Pinia Store]
        Service[API Service]
        HTTP[HTTP Client]
    end
    
    subgraph Network["Network"]
        Request[HTTP Request]
        Response[HTTP Response]
    end
    
    subgraph Backend["Backend"]
        Controller[Controller]
        Service2[Service]
        Repository[Repository]
        DB[(Database)]
    end
    
    Component --> Store
    Store --> Service
    Service --> HTTP
    HTTP --> Request
    Request --> Controller
    Controller --> Service2
    Service2 --> Repository
    Repository --> DB
    DB --> Repository
    Repository --> Service2
    Service2 --> Controller
    Controller --> Response
    Response --> HTTP
    HTTP --> Service
    Service --> Store
    Store --> Component
```

## Key Architectural Decisions

### 1. Separation of Concerns

- **Frontend**: Handles UI, user interactions, and client-side state
- **Backend**: Handles business logic, data validation, and persistence
- **Clear API Contract**: RESTful API with well-defined endpoints

### 2. State Management

- **Pinia Stores**: Centralized state management for each domain (bookmark, group, tab, theme)
- **Reactive Updates**: Vue's reactivity system ensures UI updates automatically
- **Computed Properties**: Derived state (filtered bookmarks, active tab) computed reactively

### 3. API Abstraction

- **Interface Pattern**: API services implement interfaces for testability
- **Mock/HTTP Switch**: Easy switching between mock and real API for development
- **Error Handling**: Consistent error handling across all API calls

### 4. Type Safety

- **TypeScript**: Full type coverage in both frontend and backend
- **DTOs**: Data Transfer Objects ensure type-safe API communication
- **Entity Types**: TypeORM entities provide database type safety

### 5. Validation

- **Client-Side**: Form validation in Vue components
- **Server-Side**: DTO validation using class-validator
- **URL Validation**: Custom validator for URL format

### 6. Database Design

- **SQLite**: Lightweight, file-based database for simplicity
- **TypeORM**: Object-Relational Mapping for type-safe database operations
- **Relationships**: Many-to-many and one-to-many relationships properly modeled
- **Cascade Deletion**: Automatic cleanup of related entities

## Scalability Considerations

### Current Architecture

- **Single Database**: SQLite file-based database
- **No Caching**: Direct database queries
- **No Authentication**: Public API access
- **Synchronous Operations**: All operations are synchronous

### Potential Improvements

1. **Database Migration**: PostgreSQL or MySQL for production
2. **Caching Layer**: Redis for frequently accessed data
3. **Authentication**: JWT-based authentication
4. **Pagination**: For large datasets
5. **Background Jobs**: For bulk operations
6. **API Rate Limiting**: To prevent abuse

## Deployment Architecture

### Development

```mermaid
graph TB
    subgraph Dev["Development Environment"]
        FrontendDev[Frontend Dev Server<br/>Vite :5173]
        BackendDev[Backend Dev Server<br/>NestJS :3000]
        SQLiteDev[(SQLite DB<br/>bookmarks.db)]
    end
    
    FrontendDev -->|API Calls| BackendDev
    BackendDev --> SQLiteDev
```

### Production (Docker)

```mermaid
graph TB
    subgraph Docker["Docker Containers"]
        FrontendProd[Frontend Container<br/>Nginx :8080]
        BackendProd[Backend Container<br/>NestJS :3000]
        Volume[(Data Volume<br/>SQLite DB)]
    end
    
    User[User Browser] --> FrontendProd
    FrontendProd -->|API Calls| BackendProd
    BackendProd --> Volume
```

## Security Considerations

### Current State

- **CORS**: Configured to allow frontend origin
- **Input Validation**: DTO validation on all endpoints
- **No Authentication**: All endpoints are public

### Recommended Enhancements

1. **Authentication**: Implement JWT-based authentication
2. **Authorization**: Role-based access control
3. **HTTPS**: Encrypt all communications
4. **Input Sanitization**: Additional sanitization for user inputs
5. **Rate Limiting**: Prevent API abuse
6. **SQL Injection Prevention**: TypeORM provides protection, but additional validation recommended

## Testing Architecture

### Frontend Testing

- **Unit Tests**: Vitest for component and store testing
- **E2E Tests**: Playwright for end-to-end user workflows
- **Component Testing**: Storybook for visual component testing

### Backend Testing

- **Unit Tests**: Jest for service and controller testing
- **E2E Tests**: Supertest for API endpoint testing

## Error Handling Flow

```mermaid
sequenceDiagram
    participant Component
    participant Store
    participant API
    participant Backend
    
    Component->>Store: Action
    Store->>API: API Call
    API->>Backend: HTTP Request
    
    alt Success
        Backend-->>API: 200 OK + Data
        API-->>Store: Success
        Store->>Store: Update state
        Store-->>Component: Success
    else Error
        Backend-->>API: 4xx/5xx Error
        API-->>Store: Error object
        Store->>Store: Set error state
        Store-->>Component: Error message
        Component->>Component: Display error
    end
```

## Performance Considerations

1. **Lazy Loading**: Vue Router supports code splitting
2. **Reactive Updates**: Only affected components re-render
3. **Computed Properties**: Cached derived state
4. **Database Indexing**: TypeORM handles indexes for relationships
5. **No N+1 Queries**: TypeORM eager loading with relations
