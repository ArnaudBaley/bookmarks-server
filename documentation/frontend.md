# Frontend Documentation

## Overview

The frontend is a Vue 3 application built with TypeScript, providing a modern, reactive user interface for managing bookmarks. It uses a component-based architecture with Pinia for state management and communicates with the backend via REST API.

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite 7
- **Testing**: 
  - Vitest (unit tests)
  - Playwright (E2E tests)
  - Storybook (component catalog)

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable Vue components
│   │   ├── AddBookmarkForm/
│   │   ├── BookmarkCard/
│   │   ├── EditBookmarkForm/
│   │   ├── AddGroupForm/
│   │   ├── GroupCard/
│   │   ├── EditGroupForm/
│   │   ├── AddTabForm/
│   │   ├── TabSwitcher/
│   │   ├── EditTabForm/
│   │   ├── SettingsModal/
│   │   ├── ExportImportModal/
│   │   ├── SearchModal/
│   │   └── ThemeToggle/
│   ├── stores/              # Pinia stores for state management
│   │   ├── bookmark/
│   │   ├── group/
│   │   ├── tab/
│   │   └── theme/
│   ├── services/            # API service layer
│   │   ├── bookmarkApi/
│   │   ├── groupApi/
│   │   └── tabApi/
│   ├── types/               # TypeScript type definitions
│   │   ├── bookmark.ts
│   │   ├── group.ts
│   │   └── tab.ts
│   ├── views/               # Page-level components
│   │   └── HomeView.vue
│   ├── router/              # Vue Router configuration
│   │   └── index.ts
│   ├── assets/              # Static assets
│   ├── App.vue              # Root component
│   └── main.ts              # Application entry point
├── e2e/                     # End-to-end tests
├── .storybook/              # Storybook configuration
└── deploy/                  # Deployment configurations
```

## Key Components

### Bookmark Components

#### BookmarkCard
- **Location**: `src/components/BookmarkCard/BookmarkCard.vue`
- **Purpose**: Displays a single bookmark with name, URL, and delete button
- **Features**: 
  - Clickable icon to open URL in new tab
  - Delete functionality
  - Visual feedback on interactions

#### AddBookmarkForm
- **Location**: `src/components/AddBookmarkForm/AddBookmarkForm.vue`
- **Purpose**: Form to create new bookmarks
- **Features**:
  - Name and URL input fields
  - URL validation
  - Form submission handling

#### EditBookmarkForm
- **Location**: `src/components/EditBookmarkForm/EditBookmarkForm.vue`
- **Purpose**: Form to edit existing bookmarks
- **Features**:
  - Pre-filled form with existing bookmark data
  - Update and cancel actions
  - Duplicate bookmark functionality
  - Tab and group assignment with nested UI

### Group Components

#### GroupCard
- **Location**: `src/components/GroupCard/GroupCard.vue`
- **Purpose**: Displays a group with its bookmarks
- **Features**:
  - Collapsible/expandable groups
  - Color-coded display
  - Bookmark list within group

#### AddGroupForm / EditGroupForm
- **Location**: `src/components/AddGroupForm/`, `src/components/EditGroupForm/`
- **Purpose**: Create and edit groups
- **Features**:
  - Name and color selection
  - Color picker and palette buttons
  - Duplicate group functionality (EditGroupForm)

### Tab Components

#### TabSwitcher
- **Location**: `src/components/TabSwitcher/TabSwitcher.vue`
- **Purpose**: Display and switch between tabs
- **Features**:
  - Tab navigation
  - Active tab highlighting
  - Add/Edit/Delete tab actions

#### AddTabForm / EditTabForm
- **Location**: `src/components/AddTabForm/`, `src/components/EditTabForm/`
- **Purpose**: Create and edit tabs
- **Features**:
  - Name and color selection
  - Unique name validation
  - Duplicate tab functionality (EditTabForm)

### Utility Components

#### SettingsModal
- **Location**: `src/components/SettingsModal/SettingsModal.vue`
- **Purpose**: Application settings and actions
- **Features**:
  - Export/Import functionality access
  - Theme toggle access

#### ExportImportModal
- **Location**: `src/components/ExportImportModal/ExportImportModal.vue`
- **Purpose**: Export and import bookmarks data
- **Features**:
  - JSON export/import (replaces all data)
  - HTML import from browser bookmarks (creates new tab, preserves existing data)
  - File upload/download
  - Import type selection (JSON or HTML)

#### SearchModal
- **Location**: `src/components/SearchModal/SearchModal.vue`
- **Purpose**: Search tabs and bookmarks across the application
- **Features**:
  - Real-time search as you type
  - Searches both tab names and bookmark names
  - Keyboard navigation (Arrow keys to navigate, Enter to select)
  - Opens bookmarks in new tab when selected
  - Navigates to tabs when selected
  - Accessible via Ctrl+K (or Cmd+K on Mac) keyboard shortcut
  - Visual indicators for tabs vs bookmarks

#### ThemeToggle
- **Location**: `src/components/ThemeToggle/ThemeToggle.vue`
- **Purpose**: Toggle between light and dark themes
- **Features**:
  - Theme persistence in localStorage
  - System preference detection

## State Management (Pinia Stores)

### Bookmark Store
- **Location**: `src/stores/bookmark/bookmark.ts`
- **State**:
  - `bookmarks`: Array of all bookmarks
  - `loading`: Loading state
  - `error`: Error message
- **Computed**:
  - `filteredBookmarks`: Bookmarks filtered by active tab
  - `bookmarksCount`: Total bookmark count
- **Actions**:
  - `fetchBookmarks(tabId?)`: Fetch bookmarks from API
  - `addBookmark(data)`: Create new bookmark
  - `updateBookmark(id, data)`: Update existing bookmark
  - `removeBookmark(id)`: Delete bookmark
  - `getBookmarksByGroup(groupId)`: Get bookmarks in a group
  - `getUngroupedBookmarks()`: Get bookmarks without groups

### Group Store
- **Location**: `src/stores/group/group.ts`
- **State**:
  - `groups`: Array of all groups
  - `loading`: Loading state
  - `error`: Error message
- **Computed**:
  - `filteredGroups`: Groups filtered by active tab
  - `groupsCount`: Total group count
- **Actions**:
  - `fetchGroups(tabId?)`: Fetch groups from API
  - `addGroup(data)`: Create new group
  - `updateGroup(id, data)`: Update existing group
  - `removeGroup(id)`: Delete group
  - `addBookmarkToGroup(groupId, bookmarkId)`: Assign bookmark to group
  - `removeBookmarkFromGroup(groupId, bookmarkId)`: Remove bookmark from group

### Tab Store
- **Location**: `src/stores/tab/tab.ts`
- **State**:
  - `tabs`: Array of all tabs
  - `activeTabId`: Currently active tab ID
  - `loading`: Loading state
  - `error`: Error message
- **Computed**:
  - `activeTab`: Currently active tab object
  - `tabsCount`: Total tab count
- **Actions**:
  - `fetchTabs()`: Fetch all tabs from API
  - `addTab(data)`: Create new tab
  - `updateTab(id, data)`: Update existing tab
  - `removeTab(id)`: Delete tab (switches to first available if active)
  - `setActiveTab(id)`: Set active tab

### Theme Store
- **Location**: `src/stores/theme/theme.ts`
- **State**:
  - `theme`: Current theme ('light' | 'dark')
- **Actions**:
  - `setTheme(theme)`: Set theme and persist to localStorage
  - `toggleTheme()`: Toggle between light and dark
- **Features**:
  - Persists theme preference in localStorage
  - Falls back to system preference if no stored preference
  - Applies theme class to document root

## Services (API Layer)

### Service Architecture

The API services use a factory pattern to support both mock and HTTP implementations:

- **Interface**: `IBookmarkApi`, `IGroupApi`, `ITabApi` - Define contract
- **Mock Implementation**: For development/testing without backend
- **HTTP Implementation**: Real API communication
- **Factory**: Selects implementation based on environment variables

### Bookmark API Service
- **Location**: `src/services/bookmarkApi/`
- **Files**:
  - `bookmarkApi.interface.ts`: Interface definition
  - `bookmarkApi.ts`: Factory and exports
  - `bookmarkApi.http.ts`: HTTP implementation
  - `bookmarkApi.mock.ts`: Mock implementation
- **Methods**:
  - `getAllBookmarks(tabId?)`: Fetch all bookmarks
  - `createBookmark(data)`: Create bookmark
  - `updateBookmark(id, data)`: Update bookmark
  - `deleteBookmark(id)`: Delete bookmark
  - `deleteAllBookmarks()`: Delete all bookmarks

### Group API Service
- **Location**: `src/services/groupApi/`
- **Methods**:
  - `getAllGroups(tabId?)`: Fetch all groups
  - `createGroup(data)`: Create group
  - `updateGroup(id, data)`: Update group
  - `deleteGroup(id)`: Delete group
  - `addBookmarkToGroup(groupId, bookmarkId)`: Assign bookmark
  - `removeBookmarkFromGroup(groupId, bookmarkId)`: Unassign bookmark

### Tab API Service
- **Location**: `src/services/tabApi/`
- **Methods**:
  - `getAllTabs()`: Fetch all tabs
  - `createTab(data)`: Create tab
  - `updateTab(id, data)`: Update tab
  - `deleteTab(id)`: Delete tab

## Routing

- **Location**: `src/router/index.ts`
- **Routes**:
  - `/`: Home view (default)
  - `/tab/:tabName`: Home view with specific tab (for URL-based navigation)
- **Configuration**: Uses Vue Router with HTML5 history mode

## Styling

### Tailwind CSS
- **Configuration**: `tailwind.config.ts`
- **Usage**: Utility-first CSS framework
- **Theme System**: Supports dark mode via `dark:` prefix
- **Customization**: Color palette, spacing, typography

### Theme System
- Dark mode support via `dark` class on document root
- Theme toggle persists preference
- System preference detection on first load

## Keyboard Shortcuts

The application supports keyboard shortcuts for improved productivity:

- **Ctrl+K (or Cmd+K on Mac)**: Open search modal to quickly find tabs and bookmarks
- **Escape**: Close modals, forms, or dialogs
- **Enter**: Submit forms when focused on input fields
- **Arrow Keys (in SearchModal)**: Navigate search results
  - **Arrow Down**: Move to next result
  - **Arrow Up**: Move to previous result
  - **Enter**: Select highlighted result

### Keyboard Shortcut Implementation

- **Location**: `src/composables/useKeyboardShortcut.ts`
- **Purpose**: Reusable composable for managing keyboard shortcuts
- **Features**:
  - Supports Ctrl/Cmd, Shift, Alt, and Meta modifiers
  - Cross-platform support (Windows/Linux Ctrl, Mac Cmd)
  - Prevents default behavior when needed

## Drag and Drop

The application supports drag-and-drop functionality for creating bookmarks:

- **Location**: `src/App.vue`, `src/views/HomeView.vue`
- **Features**:
  - Drop URLs from browser address bar
  - Drop links from web pages
  - Automatic URL normalization (adds https:// if missing)
  - URL validation
  - Visual feedback during drag (ring highlight)
  - Automatic name extraction from URL
  - Move bookmarks between groups by dragging
  - Remove bookmarks from groups by dragging to ungrouped section

## Testing

### Unit Tests
- **Framework**: Vitest
- **Location**: Component `.spec.ts` files
- **Coverage**: Components, stores, services

### E2E Tests
- **Framework**: Playwright
- **Location**: `e2e/features.spec.ts`
- **Coverage**: Full user workflows, cross-browser testing
- **Browsers**: Chromium, Firefox, WebKit

### Storybook
- **Purpose**: Component catalog and visual testing
- **Location**: `.storybook/`
- **Usage**: `npm run storybook`

## Environment Variables

- `VITE_API_BASE_URL`: Backend API URL (default: `http://localhost:3000`)
- `VITE_USE_MOCK_API`: Force mock API mode (default: `false`)

## Development

### Running the Application
```bash
npm run dev          # Start development server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test:unit              # Run unit tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage
npm run test:e2e               # Run E2E tests
npm run storybook              # Start Storybook
```

### Code Quality
```bash
npm run lint        # Run ESLint
npm run format      # Format with Prettier
npm run type-check  # TypeScript type checking
```

## Key Features

1. **Reactive State Management**: Pinia stores with computed properties
2. **Type Safety**: Full TypeScript coverage
3. **Component Reusability**: Modular component architecture
4. **API Abstraction**: Mock/HTTP implementations for flexible development
5. **Theme Support**: Light/dark mode with persistence
6. **Drag & Drop**: Intuitive bookmark creation and organization
7. **Form Validation**: Client-side validation with error handling
8. **Responsive Design**: Tailwind CSS for responsive layouts
9. **Search Functionality**: Quick search with Ctrl+K keyboard shortcut
10. **Duplicate Operations**: Duplicate bookmarks, groups, and tabs with unique name generation
11. **HTML Import**: Import browser bookmarks from HTML files
12. **Keyboard Navigation**: Full keyboard support for accessibility and productivity
