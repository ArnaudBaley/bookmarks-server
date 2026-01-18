# Use Cases Documentation

## Overview

This document describes all user-facing features and use cases of the bookmarks application. The application provides a comprehensive bookmark management system with organization through tabs and groups, theme customization, and data import/export capabilities.

## Core Use Cases

### 1. Bookmark Management

#### 1.1 Create Bookmark
**User Story**: As a user, I want to create a new bookmark so I can save URLs for later access.

**Steps**:
1. Click the "+" icon at the top of the page
2. Fill in the bookmark form:
   - Enter a name for the bookmark
   - Enter a valid URL
3. Optionally assign to groups and tabs
4. Click "Save" or press Enter

**Validation**:
- Name cannot be empty
- URL must be a valid URL format
- URL is automatically normalized (adds `https://` if protocol is missing)

**Alternative**: Drag and drop a URL from the browser address bar or a link on a webpage directly onto the bookmarks page to automatically create a bookmark.

#### 1.2 View Bookmarks
**User Story**: As a user, I want to view all my bookmarks so I can find and access saved URLs.

**Features**:
- Bookmarks are displayed as cards
- Each card shows:
  - A generic icon (clickable to open URL)
  - Bookmark name
  - Delete button
- Bookmarks can be organized by:
  - Tabs (filtered view)
  - Groups (within tabs)
  - Ungrouped section

#### 1.3 Edit Bookmark
**User Story**: As a user, I want to edit an existing bookmark to update its name, URL, or organization.

**Steps**:
1. Click the edit button on a bookmark card
2. Modify the name, URL, or group/tab assignments
3. Click "Save" to apply changes
4. Click "Cancel" or press Escape to discard changes

**Features**:
- Form is pre-filled with existing bookmark data
- Can change group assignments
- Can change tab assignments
- Validation applies same rules as creation

#### 1.4 Delete Bookmark
**User Story**: As a user, I want to delete a bookmark that I no longer need.

**Steps**:
1. Click the delete button (trash icon) on a bookmark card
2. Bookmark is immediately removed

**Note**: No confirmation dialog is required for bookmark deletion.

#### 1.5 Open Bookmark
**User Story**: As a user, I want to open a bookmark URL in a new browser tab.

**Steps**:
1. Click the bookmark icon on a bookmark card
2. URL opens in a new browser tab

### 2. Tab Organization

#### 2.1 Create Tab
**User Story**: As a user, I want to create tabs to organize my bookmarks into different categories.

**Steps**:
1. Click the "+" button in the tab switcher
2. Enter a tab name (must be unique)
3. Optionally select a color for the tab
4. Click "Save"

**Validation**:
- Tab name must be unique
- Tab name cannot be empty

**Features**:
- Color can be selected via color picker or palette buttons
- New tab becomes active if it's the first tab created

#### 2.2 Switch Between Tabs
**User Story**: As a user, I want to switch between tabs to view different sets of bookmarks.

**Steps**:
1. Click on a tab in the tab switcher
2. The view updates to show only bookmarks and groups for that tab

**Features**:
- Active tab is visually highlighted
- Bookmarks and groups are filtered by active tab
- Tab state persists during session

**Planned Feature**: Keyboard shortcut `Ctrl+Shift` to switch to next tab.

#### 2.3 Edit Tab
**User Story**: As a user, I want to edit a tab's name or color.

**Steps**:
1. Click the edit button on a tab
2. Modify the name or color
3. Click "Save" to apply changes
4. Click "Cancel" to discard changes

**Validation**:
- Name must remain unique if changed

#### 2.4 Delete Tab
**User Story**: As a user, I want to delete a tab and all its associated data.

**Steps**:
1. Click the delete button on a tab
2. Confirm deletion in the dialog
3. Tab and all associated groups and bookmarks are deleted

**Cascade Behavior**:
- Deleting a tab removes:
  - All groups in that tab
  - All bookmarks in that tab
  - All bookmark-group relationships

**Fallback**: If the deleted tab was active, the application automatically switches to the first available tab.

### 3. Group Organization

#### 3.1 Create Group
**User Story**: As a user, I want to create groups within a tab to further organize my bookmarks.

**Steps**:
1. Click the "+" button to add a group
2. Enter a group name
3. Select a color for the group
4. Optionally assign to a specific tab
5. Click "Save"

**Features**:
- Color can be selected via color picker or palette buttons
- Group is automatically assigned to the active tab if not specified

#### 3.2 View Groups
**User Story**: As a user, I want to see my groups and the bookmarks they contain.

**Features**:
- Groups are displayed as collapsible sections
- Each group shows:
  - Group name
  - Color indicator
  - Count of bookmarks in the group
  - List of bookmarks (when expanded)
- Groups can be collapsed or expanded
- Empty groups show an empty state message

#### 3.3 Edit Group
**User Story**: As a user, I want to edit a group's name or color.

**Steps**:
1. Click the edit button on a group
2. Modify the name or color
3. Click "Save" to apply changes
4. Click "Cancel" to discard changes

#### 3.4 Delete Group
**User Story**: As a user, I want to delete a group that I no longer need.

**Steps**:
1. Click the delete button on a group
2. Group is removed
3. Bookmarks in the group become ungrouped (not deleted)

**Note**: Deleting a group does not delete the bookmarks; they move to the ungrouped section.

#### 3.5 Assign Bookmark to Group
**User Story**: As a user, I want to assign a bookmark to a group to organize it.

**Methods**:
1. **During Creation/Edit**: Select groups in the bookmark form
2. **Drag and Drop**: Drag a bookmark card into a group (planned feature)
3. **Group Actions**: Use group-specific actions to add bookmarks

**Features**:
- A bookmark can belong to multiple groups
- A bookmark can belong to groups in different tabs

#### 3.6 Remove Bookmark from Group
**User Story**: As a user, I want to remove a bookmark from a group.

**Steps**:
1. Edit the bookmark
2. Deselect the group from the group list
3. Save changes

**Result**: Bookmark moves to the ungrouped section of the current tab.

#### 3.7 Collapse/Expand Groups
**User Story**: As a user, I want to collapse or expand groups to manage screen space.

**Steps**:
1. Click the collapse/expand button on a group header
2. Group toggles between collapsed and expanded states

**Planned Feature**: Global collapse/expand all groups including ungrouped section.

### 4. Drag and Drop

#### 4.1 Create Bookmark by Dragging URL
**User Story**: As a user, I want to drag a URL from my browser and drop it on the bookmarks page to quickly create a bookmark.

**Steps**:
1. Drag a URL from:
   - Browser address bar
   - A link on a webpage
   - Any text containing a URL
2. Drop it anywhere on the bookmarks page
3. Bookmark is automatically created with:
   - URL extracted and normalized
   - Name auto-generated from URL domain

**Features**:
- Visual feedback during drag (ring highlight around page)
- Automatic URL normalization (adds `https://` if missing)
- URL validation before creation
- Supports multiple drag data formats (text/uri-list, text/plain, URL, text/html)

### 5. Theme Management

#### 5.1 Toggle Theme
**User Story**: As a user, I want to switch between light and dark themes for better viewing comfort.

**Steps**:
1. Click the theme toggle button (sun/moon icon) at the top of the page
2. Theme switches between light and dark

**Features**:
- Theme preference is saved in localStorage
- Persists across page reloads
- Falls back to system preference on first visit
- Applies theme immediately on page load

#### 5.2 System Theme Detection
**User Story**: As a user, I want the application to respect my system theme preference.

**Behavior**:
- On first visit, application detects system theme preference
- Uses system preference if no stored preference exists
- User can override system preference with manual toggle

### 6. Export and Import

#### 6.1 Export Bookmarks
**User Story**: As a user, I want to export my bookmarks data to back it up or transfer it.

**Steps**:
1. Click the settings icon
2. Click "Export" in the export/import modal
3. JSON file is downloaded containing:
   - All bookmarks
   - All groups
   - All tabs
   - All relationships

**Export Format**: JSON file with complete application state

#### 6.2 Import Bookmarks
**User Story**: As a user, I want to import bookmarks from a previously exported file or browser bookmarks.

**Import Types**:

**JSON Import**:
1. Click the settings icon
2. Click "Import" in the export/import modal
3. Select "JSON" as import type
4. Select a JSON file from previous export
5. Data is imported and replaces current data

**Warning**: JSON import replaces all existing data. Consider exporting first as backup.

**HTML Import (Browser Bookmarks)**:
1. Click the settings icon
2. Click "Import" in the export/import modal
3. Select "HTML (Browser Bookmarks)" as import type
4. Select an HTML file exported from your browser
5. A new tab is created with the imported bookmarks
6. Existing data is preserved

**Features**:
- HTML import preserves existing data by creating a new tab
- Supports browser bookmark HTML format (Netscape format)
- Automatically creates groups from bookmark folders
- Tab name is derived from the HTML filename

**Validation**:
- JSON: File must be valid JSON and match expected data structure
- HTML: File must be valid HTML bookmark format

### 7. Color Customization

#### 7.1 Set Tab Color
**User Story**: As a user, I want to assign colors to tabs for visual organization.

**Methods**:
1. **Color Picker**: Click color picker and select custom color
2. **Palette Buttons**: Click predefined color from palette

**Available**: When creating or editing a tab

#### 7.2 Set Group Color
**User Story**: As a user, I want to assign colors to groups for visual distinction.

**Methods**:
1. **Color Picker**: Click color picker and select custom color
2. **Palette Buttons**: Click predefined color from palette

**Available**: When creating or editing a group

**Purpose**: Visual organization and quick identification of groups

### 8. Search Functionality

#### 8.1 Search Tabs and Bookmarks
**User Story**: As a user, I want to quickly search for tabs and bookmarks without manually browsing.

**Steps**:
1. Press `Ctrl+K` (or `Cmd+K` on Mac) to open the search modal
2. Type a search query (searches tab names and bookmark names)
3. Use arrow keys to navigate results:
   - `Arrow Down`: Move to next result
   - `Arrow Up`: Move to previous result
4. Press `Enter` to select a result:
   - If a bookmark: Opens in a new browser tab
   - If a tab: Navigates to that tab
5. Press `Escape` to close the search modal

**Features**:
- Real-time search as you type
- Searches across all tabs and bookmarks
- Visual indicators distinguish tabs from bookmarks
- Keyboard-only navigation supported
- Click on results as alternative to keyboard navigation

**Alternative Access**:
- Click the "CTRL+K" button at the top of the page

### 9. Duplicate Operations

#### 9.1 Duplicate Bookmark
**User Story**: As a user, I want to duplicate a bookmark to create a copy with a different name or URL.

**Steps**:
1. Click the edit button on a bookmark card
2. Click the duplicate button in the edit form
3. A new bookmark is created with the same properties
4. The new bookmark can be edited immediately

**Features**:
- Creates an exact copy of the bookmark
- Preserves all group and tab assignments
- New bookmark appears in the same location as the original

#### 9.2 Duplicate Group
**User Story**: As a user, I want to duplicate a group along with its bookmarks to create a similar group structure.

**Steps**:
1. Click the edit button on a group
2. Click the duplicate button in the edit form
3. A new group is created with the same name (with "copy" suffix if needed)
4. All bookmarks in the original group are duplicated and assigned to the new group

**Features**:
- Creates a new group with the same name and color
- Automatically generates unique name if duplicate exists (adds "copy" or "copy N")
- Duplicates all bookmarks from the original group
- New group appears in the same tab

#### 9.3 Duplicate Tab
**User Story**: As a user, I want to duplicate an entire tab with all its groups and bookmarks.

**Steps**:
1. Click the edit button on a tab
2. Click the duplicate button in the edit form
3. A new tab is created with a unique name
4. All groups from the original tab are duplicated
5. All bookmarks are duplicated and assigned to the corresponding new groups
6. Application navigates to the newly created tab

**Features**:
- Creates a complete copy of the tab structure
- Preserves group hierarchy and colors
- Maintains bookmark-to-group relationships
- Automatically generates unique tab name
- All relationships are properly mapped to new entities

### 10. Keyboard Navigation

#### 10.1 Form Navigation
**User Story**: As a user, I want to use keyboard shortcuts for common actions.

**Current Shortcuts**:
- `Ctrl+K` (or `Cmd+K` on Mac): Open search modal
- `Escape`: Close modal/form
- `Enter`: Submit form (when focused on input)
- `Arrow Keys` (in SearchModal): Navigate search results

**Planned Shortcuts**:
- `Ctrl+Shift`: Switch to next tab

### 11. Empty States

#### 11.1 No Bookmarks
**User Story**: As a user, I want to see a helpful message when I have no bookmarks.

**Display**: Empty state message encouraging user to add their first bookmark

#### 11.2 Empty Group
**User Story**: As a user, I want to see a message when a group has no bookmarks.

**Display**: Empty state message within the group indicating no bookmarks

### 12. Data Persistence

#### 12.1 Automatic Save
**User Story**: As a user, I want my changes to be automatically saved.

**Behavior**:
- All create, update, and delete operations are immediately persisted
- Data is saved to backend database
- Changes persist across page reloads
- No manual save action required

#### 12.2 Loading States
**User Story**: As a user, I want visual feedback when data is being loaded or saved.

**Features**:
- Loading indicators during API calls
- Disabled buttons during operations
- Error messages if operations fail

## User Workflows

### Workflow 1: Organizing Bookmarks by Project
1. Create a new tab named "Project A"
2. Create groups within the tab: "Frontend", "Backend", "Documentation"
3. Add bookmarks and assign them to appropriate groups
4. Switch between tabs to view different projects

### Workflow 2: Quick Bookmark Creation
1. Browse the web and find useful resources
2. Drag URLs from browser address bar directly onto bookmarks page
3. Bookmarks are created automatically with auto-generated names
4. Later, edit bookmarks to assign to groups or rename

### Workflow 3: Data Backup and Migration
1. Export current bookmarks data to JSON file
2. Store backup file securely
3. When needed, import backup to restore data
4. Or import into a different instance of the application

### Workflow 5: Import Browser Bookmarks
1. Export bookmarks from your browser as HTML file
2. Open settings in the bookmarks application
3. Select "HTML (Browser Bookmarks)" import type
4. Select the exported HTML file
5. A new tab is created with all imported bookmarks and folders
6. Existing data remains intact

### Workflow 6: Duplicate Tab Structure
1. Create a tab with groups and bookmarks as a template
2. Edit the tab and click duplicate
3. A new tab is created with all groups and bookmarks copied
4. Modify the duplicated tab as needed

### Workflow 4: Theme Customization
1. Application detects system theme preference
2. User can toggle to preferred theme
3. Preference is saved and persists across sessions
4. Theme applies immediately without page reload

## Planned Features

Based on `frontend/TODO.md`, the following features are planned:

1. **Enhanced Bookmark Editing**: Edit bookmark with tab and group selection UI showing nested structure
2. **Group/Tab Management**: Copy or move groups between tabs
3. **Keyboard Shortcuts**: `Ctrl+Shift` to switch tabs
4. **Manual Sorting**: User-defined sort order for sections
5. **Global Collapse/Expand**: Fold/unfold all groups including ungrouped section

## Error Scenarios

### Invalid URL
- **Scenario**: User enters invalid URL
- **Behavior**: Form shows validation error, prevents submission

### Duplicate Tab Name
- **Scenario**: User tries to create tab with existing name
- **Behavior**: Backend returns error, frontend displays error message

### Network Error
- **Scenario**: Backend is unavailable
- **Behavior**: Error message displayed, user can retry operation

### Empty Form Submission
- **Scenario**: User tries to submit form with empty required fields
- **Behavior**: Validation errors displayed, form not submitted
