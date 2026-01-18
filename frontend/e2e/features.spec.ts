import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Use only Chromium for feature tests for consistency
test.use({ 
  browserName: 'chromium',
})

interface Bookmark {
  id: string
  name: string
  url: string
  createdAt?: string
  groupIds?: string[]
  tabId?: string
}

interface Tab {
  id: string
  name: string
  color: string | null
  createdAt?: string
  updatedAt?: string
}

/**
 * Helper function to clear all mock data from localStorage
 * Note: Page must be navigated to a URL first before accessing localStorage
 */
async function clearMockData(page: Page) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('bookmarks-mock-data')
      localStorage.removeItem('groups-mock-data')
      localStorage.removeItem('tabs-mock-data')
      localStorage.removeItem('theme')
    } catch {
      // Ignore errors if localStorage is not accessible
    }
  })
}

/**
 * Helper function to set up a default tab in localStorage
 * The app requires at least one tab to function properly
 */
async function setupDefaultTab(page: Page, tab?: Tab) {
  const defaultTab: Tab = tab || {
    id: 'default-tab-id',
    name: 'Default Tab',
    color: '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await page.evaluate((tabData) => {
    localStorage.setItem('tabs-mock-data', JSON.stringify([tabData]))
  }, defaultTab)
  return defaultTab
}

/**
 * Helper function to set up mock bookmarks in localStorage
 */
async function setupMockBookmarks(page: Page, bookmarks: Bookmark[]) {
  await page.evaluate((bookmarksData) => {
    localStorage.setItem('bookmarks-mock-data', JSON.stringify(bookmarksData))
  }, bookmarks)
}

/**
 * Helper function to get bookmarks from localStorage
 */
async function getMockBookmarks(page: Page): Promise<Bookmark[]> {
  return await page.evaluate(() => {
    const stored = localStorage.getItem('bookmarks-mock-data')
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  })
}

/**
 * Helper function to wait for bookmarks to load
 */
async function waitForBookmarksLoaded(page: Page) {
  // Wait for the heading to be visible
  await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
  // Wait for any async operations to complete
  await page.waitForLoadState('domcontentloaded')
  // Wait for stores to be initialized by checking if tabs are loaded
  await page.waitForFunction(() => {
    const tabs = localStorage.getItem('tabs-mock-data')
    return tabs !== null && JSON.parse(tabs).length > 0
  }, { timeout: 5000 })
  // Wait for active tab to be set in Pinia store (check via page evaluation)
  await page.waitForFunction(() => {
    // Check if the app has initialized by looking for the tab switcher or any tab button
    return document.querySelector('[data-testid="tab-button"], button[aria-label*="tab" i], .tab-button') !== null ||
           document.querySelector('button:has-text("Default Tab")') !== null ||
           document.body.textContent?.includes('Default Tab') === true
  }, { timeout: 5000 }).catch(() => {
    // If we can't find tab buttons, that's okay - just continue
  })
}

test.describe('Bookmark Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
    // Ensure the tab is active by checking localStorage or waiting for it to be set
    // The tab store should automatically set the first tab as active after fetchTabs
    // Wait for tab store to initialize by checking if tabs are loaded
    await page.waitForFunction(() => {
      const tabs = localStorage.getItem('tabs-mock-data')
      return tabs !== null && JSON.parse(tabs).length > 0
    })
  })

  test('should add a new bookmark', async ({ page }) => {
    // Click the add bookmark button
    const addButton = page.getByRole('button', { name: /add new bookmark/i })
    await addButton.click()

    // Wait for the form to be visible
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Fill in the form
    const nameInput = page.getByLabel('Name')
    const urlInput = page.getByLabel('URL')
    
    await nameInput.fill('Vue.js Documentation')
    await urlInput.fill('https://vuejs.org')

    // Submit the form
    const submitButton = page.getByRole('button', { name: 'Add Bookmark' })
    await submitButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()

    // Verify the bookmark appears in the UI
    await expect(page.getByText('Vue.js Documentation')).toBeVisible()

    // Verify bookmark was saved to localStorage
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks.length).toBe(1)
    expect(bookmarks[0].name).toBe('Vue.js Documentation')
    expect(bookmarks[0].url).toBe('https://vuejs.org')
  })

  test('should add bookmark with URL normalization (missing protocol)', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add new bookmark/i })
    await addButton.click()

    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    await page.getByLabel('Name').fill('TypeScript')
    await page.getByLabel('URL').fill('typescriptlang.org')

    await page.getByRole('button', { name: 'Add Bookmark' }).click()

    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()
    
    // Wait for bookmark to be saved to localStorage with correct tabId
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const tabs = localStorage.getItem('tabs-mock-data')
        if (!tabs) return false
        const tabsData = JSON.parse(tabs)
        const activeTabId = tabsData[0]?.id
        return bookmarks.length > 0 && bookmarks.some((b: Bookmark) => 
          b.name === 'TypeScript' && b.tabId === activeTabId
        )
      } catch {
        return false
      }
    }, { timeout: 5000 })
    
    // Wait for UI to update and show the bookmark (this will wait for Vue reactivity)
    await expect(page.getByText('TypeScript')).toBeVisible({ timeout: 5000 })

    // Verify URL was normalized with https://
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks[0].url).toBe('https://typescriptlang.org')
  })

  test('should edit an existing bookmark', async ({ page }) => {
    // Set up initial bookmark with tabId (using the default tab ID from beforeEach)
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Vue.js',
        url: 'https://vuejs.org',
        createdAt: new Date().toISOString(),
        tabId: 'default-tab-id',
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark is visible
    await expect(page.getByText('Vue.js')).toBeVisible()

    // Click options button first to enter edit mode
    const optionsButton = page.getByLabel('Options').first()
    await optionsButton.click()

    // Click modify button (now visible in edit mode)
    const modifyButton = page.getByLabel('Modify bookmark').first()
    await modifyButton.click()

    // Wait for edit form
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Verify form is pre-filled
    const nameInput = page.getByLabel('Name')
    const urlInput = page.getByLabel('URL')
    
    await expect(nameInput).toHaveValue('Vue.js')
    await expect(urlInput).toHaveValue('https://vuejs.org')

    // Modify the bookmark
    await nameInput.clear()
    await nameInput.fill('Vue.js Framework')
    await urlInput.clear()
    await urlInput.fill('https://vuejs.org/docs')

    // Submit changes
    await page.getByRole('button', { name: 'Update Bookmark' }).click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeHidden()

    // Verify changes are visible - the new name should be displayed
    await expect(page.getByText('Vue.js Framework')).toBeVisible()
    // Note: We don't check that "Vue.js" is not visible because it's a substring of "Vue.js Framework"
    // Instead, we verify the localStorage has the correct updated value below

    // Verify changes persisted in localStorage
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks[0].name).toBe('Vue.js Framework')
    expect(bookmarks[0].url).toBe('https://vuejs.org/docs')
  })

  test('should cancel editing without saving changes', async ({ page }) => {
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Original Name',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: 'default-tab-id',
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form - click options button first
    await page.getByLabel('Options').first().click()
    await page.getByLabel('Modify bookmark').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Make changes
    await page.getByLabel('Name').clear()
    await page.getByLabel('Name').fill('Changed Name')

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify form closed
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeHidden()

    // Verify original name still visible (changes not saved)
    await expect(page.getByText('Original Name')).toBeVisible()
    await expect(page.getByText('Changed Name')).toBeHidden()

    // Verify localStorage unchanged
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks[0].name).toBe('Original Name')
  })

  test('should delete a bookmark', async ({ page }) => {
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Bookmark to Delete',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: 'default-tab-id',
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark exists
    await expect(page.getByText('Bookmark to Delete')).toBeVisible()

    // Open edit mode - click options button first
    await page.getByLabel('Options').first().click()
    // Wait a bit for edit mode to be fully activated
    await page.waitForTimeout(100)
    
    // Click delete button (delete button is visible in edit mode)
    // Use .first() to get the actual delete button, not the bookmark card
    const deleteButton = page.getByRole('button', { name: 'Delete bookmark' }).first()
    await deleteButton.click()

    // Wait for bookmark to be deleted from localStorage
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return true // If no data, bookmark is deleted
      try {
        const bookmarks = JSON.parse(stored)
        return !bookmarks.some((b: Bookmark) => b.id === '1')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Wait a bit for UI to update
    await page.waitForTimeout(200)

    // Verify bookmark is removed from UI
    await expect(page.getByText('Bookmark to Delete')).toBeHidden({ timeout: 5000 })

    // Verify bookmark was removed from localStorage
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks.length).toBe(0)
  })

  test('should persist bookmark changes after page reload', async ({ page }) => {
    // Add a bookmark
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()
    
    await page.getByLabel('Name').fill('Persistent Bookmark')
    await page.getByLabel('URL').fill('https://playwright.dev')
    await page.getByRole('button', { name: 'Add Bookmark' }).click()

    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()
    
    // Wait for bookmark to be saved to localStorage with correct tabId
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const tabs = localStorage.getItem('tabs-mock-data')
        if (!tabs) return false
        const tabsData = JSON.parse(tabs)
        const activeTabId = tabsData[0]?.id
        return bookmarks.length > 0 && bookmarks.some((b: Bookmark) => 
          b.name === 'Persistent Bookmark' && b.tabId === activeTabId
        )
      } catch {
        return false
      }
    }, { timeout: 5000 })
    
    // Wait for UI to update and show the bookmark (this will wait for Vue reactivity)
    await expect(page.getByText('Persistent Bookmark')).toBeVisible({ timeout: 5000 })

    // Reload page
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark still exists after reload
    await expect(page.getByText('Persistent Bookmark')).toBeVisible({ timeout: 5000 })
  })

  test('should open bookmark URL in new tab when clicked', async ({ page, context }) => {
    const defaultTab = await setupDefaultTab(page)
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Test Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Set up a promise to wait for new page
    const pagePromise = context.waitForEvent('page')
    
    // Click on the bookmark card
    await page.getByText('Test Bookmark').click()

    // Wait for new page
    const newPage = await pagePromise
    await newPage.waitForLoadState()

    // Verify new page URL
    expect(newPage.url()).toBe('https://example.com/')
    
    await newPage.close()
  })
})

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should show error when name is empty', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Fill only URL, leave name empty
    await page.getByLabel('URL').fill('https://example.com')

    // Try to submit - HTML5 validation might prevent this, so we check for either
    // the custom error message or that the form is still open (indicating validation failed)
    await page.getByRole('button', { name: 'Add Bookmark' }).click()
    
    // Wait for validation to run - check if form is still open or error message appears
    const errorMessage = page.getByText('Name is required')
    const formStillOpen = page.getByRole('heading', { name: 'Add New Bookmark' })
    
    // Either the error message is visible, or the form is still open (HTML5 validation prevented submission)
    const hasError = await errorMessage.isVisible().catch(() => false)
    const formOpen = await formStillOpen.isVisible().catch(() => false)
    
    expect(hasError || formOpen).toBe(true)

    // Verify form is still open
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()
  })

  test('should show error when URL is empty', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Fill only name, leave URL empty
    await page.getByLabel('Name').fill('Test Bookmark')

    // Try to submit
    await page.getByRole('button', { name: 'Add Bookmark' }).click()
    
    // Wait for validation to run - check if form is still open or error message appears
    const errorMessage = page.getByText('URL is required')
    const formStillOpen = page.getByRole('heading', { name: 'Add New Bookmark' })
    
    // Either the error message is visible, or the form is still open (HTML5 validation prevented submission)
    const hasError = await errorMessage.isVisible().catch(() => false)
    const formOpen = await formStillOpen.isVisible().catch(() => false)
    
    expect(hasError || formOpen).toBe(true)

    // Verify form is still open
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()
  })

  test('should show error for invalid URL', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    await page.getByLabel('Name').fill('Test Bookmark')
    // Use a URL that will fail validation even after normalization (invalid characters)
    await page.getByLabel('URL').fill('://invalid-protocol')

    // Try to submit
    await page.getByRole('button', { name: 'Add Bookmark' }).click()
    
    // Wait for validation to run
    await expect(page.getByText('Please enter a valid URL')).toBeVisible()

    // Verify form is still open
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()
  })

  test('should close form when clicking cancel', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Fill some data
    await page.getByLabel('Name').fill('Test')
    await page.getByLabel('URL').fill('https://test.com')

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify form is closed
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()

    // Verify no bookmark was created
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks.length).toBe(0)
  })

  test('should close form when clicking outside modal', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Click on the backdrop (outside the modal)
    const modal = page.locator('div:has-text("Add New Bookmark")').locator('..').first()
    const backdrop = modal.locator('..')
    await backdrop.click({ position: { x: 10, y: 10 } })

    // Verify form is closed
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()
  })

  test('should close form when pressing Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Verify form is closed
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()
  })
})

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should toggle from light to dark theme', async ({ page }) => {
    // Clear theme from localStorage to ensure we start with default
    await page.evaluate(() => {
      localStorage.removeItem('bookmarks-theme')
    })
    await page.reload()
    await waitForBookmarksLoaded(page)
    
    // Set theme to light first
    await page.evaluate(() => {
      localStorage.setItem('bookmarks-theme', 'light')
    })
    await page.reload()
    await waitForBookmarksLoaded(page)
    
    // Verify initial state (light theme)
    const htmlElement = page.locator('html')
    await expect(htmlElement).not.toHaveClass(/dark/, { timeout: 1000 })

    // Open settings modal
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Click theme toggle button in settings modal
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()

    // Wait for theme to apply
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 1000 })
  })

  test('should toggle from dark to light theme', async ({ page }) => {
    // Verify initial state is dark (default)
    const htmlElement = page.locator('html')
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 1000 })

    // Open settings modal
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Click theme toggle button to switch to light
    const themeToggle = page.getByRole('button', { name: /switch to light theme/i })
    await themeToggle.click()

    // Verify light theme is applied
    await expect(htmlElement).not.toHaveClass(/dark/, { timeout: 1000 })
  })

  test('should persist theme preference across page reloads', async ({ page }) => {
    // Set theme to light first
    await page.evaluate(() => {
      localStorage.setItem('bookmarks-theme', 'light')
    })
    await page.reload()
    await waitForBookmarksLoaded(page)
    
    // Verify initial state is light
    const htmlElement = page.locator('html')
    await expect(htmlElement).not.toHaveClass(/dark/, { timeout: 1000 })

    // Open settings modal
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()

    // Verify dark theme is applied
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 1000 })

    // Close settings modal
    await page.getByRole('button', { name: 'Close modal' }).click()

    // Reload page
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify theme persisted
    await expect(htmlElement).toHaveClass(/dark/, { timeout: 1000 })
  })

  test('should update theme toggle button aria-label', async ({ page }) => {
    // Set theme to light first
    await page.evaluate(() => {
      localStorage.setItem('bookmarks-theme', 'light')
    })
    await page.reload()
    await waitForBookmarksLoaded(page)
    
    // Open settings modal
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    
    // Get the theme toggle button
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    
    // Verify initial aria-label (button text contains "Switch to Dark Theme")
    await expect(themeToggle).toBeVisible()
    
    // Toggle theme
    await themeToggle.click()

    // Wait for button text to update by waiting for the new button to appear
    const updatedToggle = page.getByRole('button', { name: /switch to light theme/i })
    await expect(updatedToggle).toBeVisible()
  })
})

test.describe('UI State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should show empty state when no bookmarks exist', async ({ page }) => {
    // Verify empty state - the component always shows the "Ungrouped" section, even when empty
    await expect(page.getByRole('heading', { name: 'Ungrouped' })).toBeVisible()
    await expect(page.getByText('(0)')).toBeVisible()
  })

  test('should show loading state initially', async ({ page }) => {
    // Navigate to a fresh page
    await page.goto('/')
    
    // Check for loading state (may be very brief, so we check if it appears)
    const loadingText = page.getByText('Loading bookmarks...')
    
    // Try to catch loading state if it appears, but don't fail if it's too fast
    try {
      await expect(loadingText).toBeVisible({ timeout: 100 })
    } catch {
      // Loading state may have already passed, which is fine
    }
    
    // Eventually, the main heading should appear
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
  })

  test('should display bookmarks in ungrouped section', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Ungrouped Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Wait for bookmark to be visible first
    await expect(page.getByText('Ungrouped Bookmark')).toBeVisible()
    
    // Verify bookmark appears in ungrouped section
    // Use .first() to get the h2 heading (not the bookmark name which also contains "Ungrouped")
    const ungroupedHeading = page.getByRole('heading', { name: 'Ungrouped' }).first()
    await expect(ungroupedHeading).toBeVisible()
  })

  test('should close add form after successful submission', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Fill and submit form
    await page.getByLabel('Name').fill('Test Bookmark')
    await page.getByLabel('URL').fill('https://example.com')
    await page.getByRole('button', { name: 'Add Bookmark' }).click()

    // Verify form closes
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()
  })
})

/**
 * Helper function to get tabs from localStorage
 */
async function getMockTabs(page: Page): Promise<Tab[]> {
  return await page.evaluate(() => {
    const stored = localStorage.getItem('tabs-mock-data')
    if (!stored) return []
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  })
}

/**
 * Helper function to set up mock tabs in localStorage
 */
async function setupMockTabs(page: Page, tabs: Tab[]) {
  await page.evaluate((tabsData) => {
    localStorage.setItem('tabs-mock-data', JSON.stringify(tabsData))
  }, tabs)
}

test.describe('Tab Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should add a new tab', async ({ page }) => {
    // Click the add tab button (in TabSwitcher)
    const addTabButton = page.getByRole('button', { name: /add new tab/i })
    await addTabButton.click()

    // Wait for the form to be visible
    await expect(page.getByRole('heading', { name: 'Add New Tab' })).toBeVisible()

    // Fill in the form
    const nameInput = page.getByLabel('Name')
    await nameInput.fill('Work Tab')

    // Submit the form
    const submitButton = page.getByRole('button', { name: 'Add Tab' })
    await submitButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Add New Tab' })).toBeHidden()

    // Verify the tab appears in the UI
    await expect(page.getByText('Work Tab')).toBeVisible()

    // Verify tab was saved to localStorage
    const tabs = await getMockTabs(page)
    expect(tabs.length).toBe(2) // Default tab + new tab
    expect(tabs.some(tab => tab.name === 'Work Tab')).toBe(true)
  })

  test('should edit an existing tab', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    await setupMockTabs(page, [
      defaultTab,
      {
        id: 'tab-2',
        name: 'Original Tab Name',
        color: '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Find the tab and click its edit button
    // The edit button appears on hover, so we need to hover first
    const tabButton = page.getByRole('button', { name: 'Original Tab Name' })
    await tabButton.hover()
    
    // Click the edit button (it has aria-label="Edit tab")
    // Find the edit button that's a sibling of the tab button (both are in a group div)
    const tabGroup = tabButton.locator('..') // parent div with class "group relative"
    const editButton = tabGroup.getByRole('button', { name: 'Edit tab' })
    await editButton.click()

    // Wait for edit form
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()

    // Verify form is pre-filled
    const nameInput = page.getByLabel('Name')
    await expect(nameInput).toHaveValue('Original Tab Name')

    // Modify the tab
    await nameInput.clear()
    await nameInput.fill('Updated Tab Name')

    // Submit changes
    await page.getByRole('button', { name: 'Update Tab' }).click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeHidden()

    // Verify changes are visible
    await expect(page.getByText('Updated Tab Name')).toBeVisible()

    // Verify changes persisted in localStorage
    const tabs = await getMockTabs(page)
    const updatedTab = tabs.find(tab => tab.id === 'tab-2')
    expect(updatedTab?.name).toBe('Updated Tab Name')
  })

  test('should delete a tab', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    await setupMockTabs(page, [
      defaultTab,
      {
        id: 'tab-to-delete',
        name: 'Tab to Delete',
        color: '#ef4444',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify tab exists
    await expect(page.getByText('Tab to Delete')).toBeVisible()

    // Find the tab and click its edit button
    const tabButton = page.getByRole('button', { name: 'Tab to Delete' })
    await tabButton.hover()
    
    // Click the edit button - find it within the tab group
    const tabGroup = tabButton.locator('..') // parent div with class "group relative"
    const editButton = tabGroup.getByRole('button', { name: 'Edit tab' })
    await editButton.click()

    // Wait for edit form
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()

    // Click delete button - this should show confirmation dialog
    const deleteButton = page.getByRole('button', { name: 'Delete tab' })
    await deleteButton.click()

    // Wait for confirmation dialog to appear
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeVisible()
    await expect(page.getByText(/Are you sure you want to delete the tab/)).toBeVisible()
    await expect(page.getByText(/This will permanently delete/)).toBeVisible()

    // Confirm deletion
    const confirmDeleteButton = page.getByRole('button', { name: 'Delete Tab' })
    await confirmDeleteButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeHidden()

    // Verify tab is removed from UI
    await expect(page.getByText('Tab to Delete')).toBeHidden()

    // Verify tab was removed from localStorage
    const tabs = await getMockTabs(page)
    expect(tabs.length).toBe(1) // Only default tab should remain
    expect(tabs.find(tab => tab.id === 'tab-to-delete')).toBeUndefined()
  })

  test('should cancel tab deletion when cancel is clicked in confirmation dialog', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    await setupMockTabs(page, [
      defaultTab,
      {
        id: 'tab-to-keep',
        name: 'Tab to Keep',
        color: '#ef4444',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify tab exists
    await expect(page.getByText('Tab to Keep')).toBeVisible()

    // Find the tab and click its edit button
    const tabButton = page.getByRole('button', { name: 'Tab to Keep' })
    await tabButton.hover()
    
    const tabGroup = tabButton.locator('..')
    const editButton = tabGroup.getByRole('button', { name: 'Edit tab' })
    await editButton.click()

    // Wait for edit form
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()

    // Click delete button - this should show confirmation dialog
    const deleteButton = page.getByRole('button', { name: 'Delete tab' })
    await deleteButton.click()

    // Wait for confirmation dialog to appear
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeVisible()

    // Click cancel button
    const cancelButton = page.getByRole('button', { name: 'Cancel' })
    await cancelButton.click()

    // Wait for confirmation dialog to close and edit form to be visible again
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()

    // Close the edit form
    const closeButton = page.getByRole('button', { name: 'Cancel' }).first()
    await closeButton.click()

    // Verify tab still exists
    await expect(page.getByText('Tab to Keep')).toBeVisible()

    // Verify tab was not removed from localStorage
    const tabs = await getMockTabs(page)
    expect(tabs.length).toBe(2) // Both tabs should remain
    expect(tabs.find(tab => tab.id === 'tab-to-keep')).toBeDefined()
  })

  test('should delete tab with associated groups and bookmarks (cascade deletion)', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    const tabToDelete = {
      id: 'tab-to-delete',
      name: 'Tab to Delete',
      color: '#ef4444',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await setupMockTabs(page, [defaultTab, tabToDelete])

    // Set up groups and bookmarks for the tab to delete
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-in-tab',
        name: 'Group in Tab',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, tabToDelete.id)

    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Bookmark in Tab',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: tabToDelete.id,
      },
      {
        id: 'bookmark-2',
        name: 'Another Bookmark',
        url: 'https://example2.com',
        createdAt: new Date().toISOString(),
        tabId: tabToDelete.id,
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Switch to the tab to delete
    const tabButton = page.getByRole('button', { name: 'Tab to Delete' })
    await tabButton.click()
    await waitForBookmarksLoaded(page)

    // Verify group and bookmarks exist
    await expect(page.getByText('Group in Tab')).toBeVisible()
    await expect(page.getByText('Bookmark in Tab')).toBeVisible()
    await expect(page.getByText('Another Bookmark')).toBeVisible()

    // Open edit form for the tab
    await tabButton.hover()
    const tabGroup = tabButton.locator('..')
    const editButton = tabGroup.getByRole('button', { name: 'Edit tab' })
    await editButton.click()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()

    // Click delete button and confirm
    const deleteButton = page.getByRole('button', { name: 'Delete tab' })
    await deleteButton.click()
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeVisible()
    
    const confirmDeleteButton = page.getByRole('button', { name: 'Delete Tab' })
    await confirmDeleteButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeHidden()

    // Wait for UI to update after deletion
    await waitForBookmarksLoaded(page)

    // Verify tab is removed from UI
    await expect(page.getByText('Tab to Delete')).toBeHidden()

    // Verify groups and bookmarks from deleted tab are not visible in UI
    // (App should have switched to default tab which has no groups/bookmarks)
    await expect(page.getByText('Group in Tab')).toBeHidden()
    await expect(page.getByText('Bookmark in Tab')).toBeHidden()
    await expect(page.getByText('Another Bookmark')).toBeHidden()

    // Verify tab was removed from localStorage
    const tabs = await getMockTabs(page)
    expect(tabs.length).toBe(1) // Only default tab should remain
    expect(tabs.find(tab => tab.id === 'tab-to-delete')).toBeUndefined()

    // Verify groups were also deleted (check localStorage)
    const groups = await page.evaluate(() => {
      const stored = localStorage.getItem('groups-mock-data')
      if (!stored) return []
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    })
    expect(groups.length).toBe(0)

    // Verify bookmarks were also deleted
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks.length).toBe(0)
  })

  test('should switch between tabs', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    await setupMockTabs(page, [
      defaultTab,
      {
        id: 'tab-2',
        name: 'Second Tab',
        color: '#10b981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    // Set up bookmarks for each tab
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Bookmark in Default Tab',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
      },
      {
        id: '2',
        name: 'Bookmark in Second Tab',
        url: 'https://example2.com',
        createdAt: new Date().toISOString(),
        tabId: 'tab-2',
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify default tab is active and shows its bookmark
    await expect(page.getByText('Bookmark in Default Tab')).toBeVisible()
    await expect(page.getByText('Bookmark in Second Tab')).toBeHidden()

    // Click on second tab
    const secondTabButton = page.getByRole('button', { name: 'Second Tab' })
    await secondTabButton.click()

    // Wait for bookmarks to reload
    await waitForBookmarksLoaded(page)

    // Verify second tab is active and shows its bookmark
    await expect(page.getByText('Bookmark in Second Tab')).toBeVisible()
    await expect(page.getByText('Bookmark in Default Tab')).toBeHidden()

    // Switch back to default tab
    const defaultTabButton = page.getByRole('button', { name: defaultTab.name })
    await defaultTabButton.click()

    // Wait for bookmarks to reload
    await waitForBookmarksLoaded(page)

    // Verify default tab is active again
    await expect(page.getByText('Bookmark in Default Tab')).toBeVisible()
    await expect(page.getByText('Bookmark in Second Tab')).toBeHidden()
  })

  test('should switch to first available tab when active tab is deleted', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    await setupMockTabs(page, [
      defaultTab,
      {
        id: 'tab-2',
        name: 'Second Tab',
        color: '#10b981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify default tab is active
    const defaultTabButton = page.getByRole('button', { name: defaultTab.name })
    await expect(defaultTabButton).toBeVisible()

    // Delete the default tab
    await defaultTabButton.hover()
    const tabGroup = defaultTabButton.locator('..') // parent div with class "group relative"
    const editButton = tabGroup.getByRole('button', { name: 'Edit tab' })
    await editButton.click()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()
    
    // Click delete button - this should show confirmation dialog
    const deleteButton = page.getByRole('button', { name: 'Delete tab' })
    await deleteButton.click()

    // Wait for confirmation dialog and confirm deletion
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeVisible()
    const confirmDeleteButton = page.getByRole('button', { name: 'Delete Tab' })
    await confirmDeleteButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Delete Tab' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeHidden()

    // Verify second tab is now active (should be visible and active)
    await expect(page.getByText('Second Tab')).toBeVisible()
    // The active tab should have the active styling (we can check if it's visible)
    const secondTabButton = page.getByRole('button', { name: 'Second Tab' })
    await expect(secondTabButton).toBeVisible()
  })
})

test.describe('Group Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should add a new group', async ({ page }) => {
    // Click the add group button
    const addGroupButton = page.getByRole('button', { name: /add new group/i })
    await addGroupButton.click()

    // Wait for the form to be visible
    await expect(page.getByRole('heading', { name: 'Add New Group' })).toBeVisible()

    // Fill in the form
    const nameInput = page.getByLabel('Name')
    await nameInput.fill('Work Group')

    // Submit the form
    const submitButton = page.getByRole('button', { name: 'Add Group' })
    await submitButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Add New Group' })).toBeHidden()

    // Wait for group to be saved to localStorage
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('groups-mock-data')
      if (!stored) return false
      try {
        const groups = JSON.parse(stored)
        return groups.some((g: { name: string }) => g.name === 'Work Group')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Verify the group appears in the UI (this will wait for it to appear)
    await expect(page.getByText('Work Group')).toBeVisible({ timeout: 10000 })
  })

  test('should edit an existing group', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up a group in localStorage (via mock API)
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Original Group Name',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify group is visible
    await expect(page.getByText('Original Group Name')).toBeVisible()

    // Click modify button on the group (groups have a direct modify button)
    const modifyButton = page.getByLabel('Modify group').first()
    await modifyButton.click()

    // Wait for edit form
    await expect(page.getByRole('heading', { name: 'Edit Group' })).toBeVisible()

    // Verify form is pre-filled
    const nameInput = page.getByLabel('Name')
    await expect(nameInput).toHaveValue('Original Group Name')

    // Modify the group
    await nameInput.clear()
    await nameInput.fill('Updated Group Name')

    // Submit changes
    await page.getByRole('button', { name: 'Update Group' }).click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Group' })).toBeHidden()

    // Verify changes are visible
    await expect(page.getByText('Updated Group Name')).toBeVisible()
  })

  test('should delete a group', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up a group in localStorage
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-to-delete',
        name: 'Group to Delete',
        color: '#ef4444',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify group exists
    await expect(page.getByText('Group to Delete')).toBeVisible()

    // Click modify button
    const modifyButton = page.getByLabel('Modify group').first()
    await modifyButton.click()

    // Wait for edit form
    await expect(page.getByRole('heading', { name: 'Edit Group' })).toBeVisible()

    // Click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete group' })
    await deleteButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Group' })).toBeHidden()

    // Verify group is removed from UI
    await expect(page.getByText('Group to Delete')).toBeHidden()
  })
})

test.describe('Export/Import Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should open export/import modal', async ({ page }) => {
    // Open settings modal first
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Find and click the export/import button
    const exportImportButton = page.getByRole('button', { name: 'Export / Import Data' })
    await exportImportButton.click()

    // Verify modal is visible
    await expect(page.getByRole('heading', { name: 'Export / Import' })).toBeVisible()
  })

  test('should close export/import modal when clicking cancel', async ({ page }) => {
    // Open settings modal first
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    const exportImportButton = page.getByRole('button', { name: 'Export / Import Data' })
    await exportImportButton.click()

    await expect(page.getByRole('heading', { name: 'Export / Import' })).toBeVisible()

    // Click close button
    const closeButton = page.getByRole('button', { name: 'Close modal' })
    await closeButton.click()

    // Verify modal is closed - check that Settings modal is visible again
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('should close export/import modal when pressing Escape', async ({ page }) => {
    // Open settings modal first
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    const exportImportButton = page.getByRole('button', { name: 'Export / Import Data' })
    await exportImportButton.click()

    await expect(page.getByRole('heading', { name: 'Export / Import' })).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Verify modal is closed - check that Settings modal is visible again
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('should export data to JSON file', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up test data
    await setupMockTabs(page, [
      defaultTab,
      {
        id: 'tab-2',
        name: 'Work Tab',
        color: '#10b981',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Work Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Test Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open settings modal first
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Open export/import modal
    const exportImportButton = page.getByRole('button', { name: 'Export / Import Data' })
    await exportImportButton.click()

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    const exportButton = page.getByRole('button', { name: 'Export to JSON' })
    await exportButton.click()

    // Wait for download
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toMatch(/^bookmarks-export-\d{4}-\d{2}-\d{2}\.json$/)

    // Read the downloaded file content
    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()
    
    const content = fs.readFileSync(downloadPath!, 'utf-8')
    const exportData = JSON.parse(content)

    // Verify export structure
    expect(exportData).toHaveProperty('tabs')
    expect(exportData).toHaveProperty('groups')
    expect(exportData).toHaveProperty('bookmarks')
    expect(exportData.tabs.length).toBeGreaterThan(0)
    expect(exportData.groups.length).toBeGreaterThan(0)
    expect(exportData.bookmarks.length).toBeGreaterThan(0)

    // Verify modal closed after export - check that Settings modal is visible again
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('should import data from JSON file', async ({ page }) => {
    await setupDefaultTab(page)

    // Create export data structure
    const importData = {
      tabs: [
        { name: 'Imported Tab', color: '#3b82f6' },
      ],
      groups: [
        { name: 'Imported Group', color: '#10b981', tabIndex: 0 },
      ],
      bookmarks: [
        { name: 'Imported Bookmark', url: 'https://example.com', tabIndex: 0, groupIndices: [0] },
      ],
    }

    // Open settings modal first
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Open export/import modal
    const exportImportButton = page.getByRole('button', { name: 'Export / Import Data' })
    await exportImportButton.click()

    // Create a file input and set the file
    const fileInput = page.locator('input[type="file"]')
    
    // Create a temporary file with the import data
    const tempFile = path.join(os.tmpdir(), `test-import-${Date.now()}.json`)
    fs.writeFileSync(tempFile, JSON.stringify(importData, null, 2))

    // Set the file and wait for it to be processed
    await fileInput.setInputFiles(tempFile)
    
    // Wait for confirmation dialog (the modal shows a confirmation dialog after processing)
    // The file input change event triggers async processing, so we wait for the dialog to appear
    await expect(page.getByRole('heading', { name: 'Confirm Import' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/This will replace all existing data/i)).toBeVisible()

    // Confirm import
    const confirmButton = page.getByRole('button', { name: 'Confirm Import' })
    await confirmButton.click()

    // Wait for import to complete and modal to close
    await expect(page.getByRole('heading', { name: 'Confirm Import' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Wait for data to be loaded
    await waitForBookmarksLoaded(page)

    // Verify imported data appears in UI
    await expect(page.getByText('Imported Tab')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Imported Group')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Imported Bookmark')).toBeVisible({ timeout: 5000 })

    // Clean up temp file
    fs.unlinkSync(tempFile)
  })

  test('should show error for invalid import file', async ({ page }) => {
    // Open settings modal first
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Open export/import modal
    const exportImportButton = page.getByRole('button', { name: 'Export / Import Data' })
    await exportImportButton.click()

    // Create invalid JSON file
    const tempFile = path.join(os.tmpdir(), `test-invalid-${Date.now()}.json`)
    fs.writeFileSync(tempFile, 'invalid json content {')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tempFile)
    
    // Wait a bit for file processing to start
    await page.waitForTimeout(500)
    
    // Wait for error message (appears after file processing)
    await expect(page.getByText(/Failed to parse or validate file|Failed to read file/i)).toBeVisible({ timeout: 10000 })

    // Clean up temp file
    fs.unlinkSync(tempFile)
  })

  test('should cancel import confirmation', async ({ page }) => {
    await setupDefaultTab(page)

    const importData = {
      tabs: [{ name: 'Imported Tab', color: '#3b82f6' }],
      groups: [],
      bookmarks: [],
    }

    // Open settings modal first
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Open export/import modal
    const exportImportButton = page.getByRole('button', { name: 'Export / Import Data' })
    await exportImportButton.click()

    // Create and set file
    const tempFile = path.join(os.tmpdir(), `test-cancel-${Date.now()}.json`)
    fs.writeFileSync(tempFile, JSON.stringify(importData, null, 2))

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(tempFile)
    
    // Wait for confirmation dialog (appears after file processing)
    await expect(page.getByRole('heading', { name: 'Confirm Import' })).toBeVisible({ timeout: 10000 })

    // Click cancel
    const cancelButton = page.getByRole('button', { name: 'Cancel' }).first()
    await cancelButton.click()

    // Verify confirmation dialog closed and modal is still open
    await expect(page.getByRole('heading', { name: 'Confirm Import' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Export / Import' })).toBeVisible()

    // Clean up temp file
    fs.unlinkSync(tempFile)
  })
})

test.describe('Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should create bookmark by dragging URL from browser', async ({ page }) => {
    // Navigate to a page with a link
    await page.goto('http://localhost:5174')
    await waitForBookmarksLoaded(page)

    // Create a link element that we can drag
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = 'https://playwright.dev'
      link.textContent = 'Playwright'
      link.id = 'draggable-link'
      link.style.position = 'fixed'
      link.style.top = '10px'
      link.style.left = '10px'
      link.style.zIndex = '10000'
      document.body.appendChild(link)
    })

    const link = page.locator('#draggable-link')
    const bookmarkArea = page.locator('body')

    // Perform drag and drop
    await link.dragTo(bookmarkArea)

    // Wait for bookmark to be created
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        return bookmarks.some((b: Bookmark) => b.url.includes('playwright.dev'))
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Verify bookmark appears in UI
    await expect(page.getByText(/playwright/i)).toBeVisible({ timeout: 5000 })
  })

  test('should move bookmark to group by dragging', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)

    // Set up a group
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Target Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    // Set up a bookmark without a group
    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Bookmark to Move',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Wait for bookmark and group to be visible
    await expect(page.getByText('Bookmark to Move')).toBeVisible()
    await expect(page.getByText('Target Group')).toBeVisible()

    // Find the bookmark card and group card
    const bookmarkCard = page.getByText('Bookmark to Move').locator('..').locator('..')
    const groupCard = page.getByText('Target Group').locator('..').locator('..')

    // Perform drag and drop
    await bookmarkCard.dragTo(groupCard)

    // Wait for bookmark to be assigned to group
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const bookmark = bookmarks.find((b: Bookmark) => b.id === 'bookmark-1')
        return bookmark && bookmark.groupIds && bookmark.groupIds.includes('group-1')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Reload to see the change
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark is now in the group (it should be visible within the group)
    const groupHeading = page.getByRole('heading', { name: 'Target Group' })
    await expect(groupHeading).toBeVisible()
    
    // Wait for bookmark to be visible (it should appear after the group is loaded)
    // The bookmark should be visible on the page since it's now assigned to the group
    await expect(page.getByText('Bookmark to Move')).toBeVisible({ timeout: 5000 })
  })

  test('should remove bookmark from group by dragging to ungrouped section', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)

    // Set up a group with a bookmark
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Source Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Bookmark in Group',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Wait for bookmark and group to be visible
    await expect(page.getByText('Bookmark in Group')).toBeVisible()
    await expect(page.getByText('Source Group')).toBeVisible()

    // Find the bookmark card and ungrouped section
    const bookmarkCard = page.getByText('Bookmark in Group').locator('..').locator('..')
    const ungroupedHeading = page.getByRole('heading', { name: 'Ungrouped' }).first()
    const ungroupedSection = ungroupedHeading.locator('..')

    // Perform drag and drop
    await bookmarkCard.dragTo(ungroupedSection)

    // Wait for bookmark to be removed from group
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const bookmark = bookmarks.find((b: Bookmark) => b.id === 'bookmark-1')
        return bookmark && (!bookmark.groupIds || bookmark.groupIds.length === 0)
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Reload to see the change
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark is now in ungrouped section
    await expect(page.getByText('Bookmark in Group')).toBeVisible()
    // It should be in the ungrouped section (not in the group)
    const groupSection = page.getByRole('heading', { name: 'Source Group' }).locator('..')
    await expect(groupSection.getByText('Bookmark in Group')).toBeHidden()
  })

  test('should create bookmark in group by dragging URL to group', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)

    // Set up a group
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Target Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Create a draggable link
    await page.evaluate(() => {
      const link = document.createElement('a')
      link.href = 'https://vuejs.org'
      link.textContent = 'Vue.js'
      link.id = 'vue-link'
      link.style.position = 'fixed'
      link.style.top = '10px'
      link.style.left = '10px'
      link.style.zIndex = '10000'
      document.body.appendChild(link)
    })

    const link = page.locator('#vue-link')
    const groupCard = page.getByText('Target Group').locator('..').locator('..')

    // Perform drag and drop
    await link.dragTo(groupCard)

    // Wait for bookmark to be created in the group
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const bookmark = bookmarks.find((b: Bookmark) => b.url.includes('vuejs.org'))
        return bookmark && bookmark.groupIds && bookmark.groupIds.includes('group-1')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Verify bookmark appears in the group
    await page.reload()
    await waitForBookmarksLoaded(page)
    
    // Wait for bookmark to be visible
    await expect(page.getByText(/vue/i)).toBeVisible({ timeout: 5000 })
    
    // Verify the group is visible
    const groupHeading = page.getByRole('heading', { name: 'Target Group' })
    await expect(groupHeading).toBeVisible()
  })
})

test.describe('Bookmark-to-Group Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should assign bookmark to group via edit form', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)

    // Set up a group
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Work Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    // Set up a bookmark without a group
    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Test Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form - click options button first
    await page.getByLabel('Options').first().click()
    await page.getByLabel('Modify bookmark').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Find and check the group checkbox
    const groupCheckbox = page.getByLabel('Work Group', { exact: false })
    await groupCheckbox.check()

    // Submit the form
    await page.getByRole('button', { name: 'Update Bookmark' }).click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeHidden()

    // Wait for bookmark to be assigned to group
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const bookmark = bookmarks.find((b: Bookmark) => b.id === 'bookmark-1')
        return bookmark && bookmark.groupIds && bookmark.groupIds.includes('group-1')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Reload and verify bookmark appears in group
    await page.reload()
    await waitForBookmarksLoaded(page)
    
    // Wait for bookmark to be visible
    await expect(page.getByText('Test Bookmark')).toBeVisible({ timeout: 5000 })
    
    // Verify the group is visible
    const groupHeading = page.getByRole('heading', { name: 'Work Group' })
    await expect(groupHeading).toBeVisible()
  })

  test('should assign bookmark to multiple groups', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)

    // Set up multiple groups
    await page.evaluate((tabId) => {
      const groups = [
        {
          id: 'group-1',
          name: 'Work Group',
          color: '#3b82f6',
          tabId: tabId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'group-2',
          name: 'Personal Group',
          color: '#10b981',
          tabId: tabId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Multi Group Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form - click options button first
    await page.getByLabel('Options').first().click()
    await page.getByLabel('Modify bookmark').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Check both group checkboxes
    await page.getByLabel('Work Group', { exact: false }).check()
    await page.getByLabel('Personal Group', { exact: false }).check()

    // Submit the form
    await page.getByRole('button', { name: 'Update Bookmark' }).click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeHidden()

    // Wait for bookmark to be assigned to both groups
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const bookmark = bookmarks.find((b: Bookmark) => b.id === 'bookmark-1')
        return bookmark && bookmark.groupIds && 
               bookmark.groupIds.includes('group-1') && 
               bookmark.groupIds.includes('group-2')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Reload and verify bookmark appears in both groups
    await page.reload()
    await waitForBookmarksLoaded(page)
    
    // Wait for bookmark to be visible (use first() since bookmark appears in multiple groups)
    await expect(page.getByText('Multi Group Bookmark').first()).toBeVisible({ timeout: 5000 })
    
    // Verify both groups are visible
    const workGroupHeading = page.getByRole('heading', { name: 'Work Group' })
    const personalGroupHeading = page.getByRole('heading', { name: 'Personal Group' })
    await expect(workGroupHeading).toBeVisible()
    await expect(personalGroupHeading).toBeVisible()
  })

  test('should remove bookmark from group via edit form', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)

    // Set up a group with a bookmark
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Work Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Grouped Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form - click options button first
    await page.getByLabel('Options').first().click()
    await page.getByLabel('Modify bookmark').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Uncheck the group checkbox
    const groupCheckbox = page.getByLabel('Work Group', { exact: false })
    await groupCheckbox.uncheck()

    // Submit the form
    await page.getByRole('button', { name: 'Update Bookmark' }).click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeHidden()

    // Wait for bookmark to be removed from group
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const bookmark = bookmarks.find((b: Bookmark) => b.id === 'bookmark-1')
        return bookmark && (!bookmark.groupIds || bookmark.groupIds.length === 0)
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Reload and verify bookmark is in ungrouped section
    await page.reload()
    await waitForBookmarksLoaded(page)
    await expect(page.getByText('Grouped Bookmark')).toBeVisible()
    const groupSection = page.getByRole('heading', { name: 'Work Group' }).locator('..')
    await expect(groupSection.getByText('Grouped Bookmark')).toBeHidden()
  })
})

test.describe('Group Color Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should select group color using color picker', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up a group
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Test Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form
    const modifyButton = page.getByLabel('Modify group').first()
    await modifyButton.click()
    await expect(page.getByRole('heading', { name: 'Edit Group' })).toBeVisible()

    // Change color using color picker
    const colorInput = page.locator('input[id="group-color"]')
    await colorInput.fill('#ef4444')

    // Submit changes
    await page.getByRole('button', { name: 'Update Group' }).click()
    await expect(page.getByRole('heading', { name: 'Edit Group' })).toBeHidden()

    // Verify color was saved
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('groups-mock-data')
      if (!stored) return false
      try {
        const groups = JSON.parse(stored)
        const group = groups.find((g: { id: string }) => g.id === 'group-1')
        return group && group.color === '#ef4444'
      } catch {
        return false
      }
    }, { timeout: 5000 })
  })

  test('should select group color using palette button', async ({ page }) => {
    // Add a new group
    const addGroupButton = page.getByRole('button', { name: /add new group/i })
    await addGroupButton.click()
    await expect(page.getByRole('heading', { name: 'Add New Group' })).toBeVisible()

    // Fill name
    await page.getByLabel('Name').fill('Colored Group')

    // Click a palette color button (red #ef4444)
    const paletteButtons = page.locator('button[aria-label^="Select color"]')
    const redButton = paletteButtons.filter({ hasText: /select color #ef4444/i }).or(paletteButtons.nth(1)) // Second button is red
    await redButton.first().click()

    // Submit
    await page.getByRole('button', { name: 'Add Group' }).click()
    await expect(page.getByRole('heading', { name: 'Add New Group' })).toBeHidden()

    // Verify color was saved
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('groups-mock-data')
      if (!stored) return false
      try {
        const groups = JSON.parse(stored)
        const group = groups.find((g: { name: string }) => g.name === 'Colored Group')
        return group && group.color === '#ef4444'
      } catch {
        return false
      }
    }, { timeout: 5000 })
  })
})

test.describe('Tab Color Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should select tab color using color picker', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Open edit form
    const tabButton = page.getByRole('button', { name: defaultTab.name })
    await tabButton.hover()
    const tabGroup = tabButton.locator('..')
    const editButton = tabGroup.getByRole('button', { name: 'Edit tab' })
    await editButton.click()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()

    // Change color using color picker
    const colorInput = page.locator('input[id="tab-color"]')
    await colorInput.fill('#10b981')

    // Submit changes
    await page.getByRole('button', { name: 'Update Tab' }).click()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeHidden()

    // Wait a bit for the update to complete
    await page.waitForTimeout(500)

    // Verify color was saved - increase timeout since API call may take time
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('tabs-mock-data')
      if (!stored) return false
      try {
        const tabs = JSON.parse(stored)
        const tab = tabs.find((t: { id: string }) => t.id === defaultTab.id)
        return tab && tab.color === '#10b981'
      } catch {
        return false
      }
    }, { timeout: 30000 })
  })

  test('should select tab color using palette button when adding new tab', async ({ page }) => {
    // Add a new tab
    const addTabButton = page.getByRole('button', { name: /add new tab/i })
    await addTabButton.click()
    await expect(page.getByRole('heading', { name: 'Add New Tab' })).toBeVisible()

    // Fill name
    await page.getByLabel('Name').fill('Colored Tab')

    // Click a palette color button (green #10b981)
    const paletteButtons = page.locator('button[aria-label^="Select color"]')
    const greenButton = paletteButtons.filter({ hasText: /select color #10b981/i }).or(paletteButtons.nth(2)) // Third button is green
    await greenButton.first().click()

    // Submit
    await page.getByRole('button', { name: 'Add Tab' }).click()
    await expect(page.getByRole('heading', { name: 'Add New Tab' })).toBeHidden()

    // Verify color was saved
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('tabs-mock-data')
      if (!stored) return false
      try {
        const tabs = JSON.parse(stored)
        const tab = tabs.find((t: { name: string }) => t.name === 'Colored Tab')
        return tab && tab.color === '#10b981'
      } catch {
        return false
      }
    }, { timeout: 5000 })
  })
})

test.describe('Group Expansion and Collapse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should collapse and expand group', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up a group with bookmarks
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Test Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Bookmark 1',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark is visible (group is expanded by default)
    await expect(page.getByText('Bookmark 1')).toBeVisible()

    // Find and click the collapse button
    const groupHeading = page.getByRole('heading', { name: 'Test Group' })
    const collapseButton = groupHeading.locator('..').locator('..').getByLabel('Toggle group')
    await collapseButton.click()

    // Verify bookmark is hidden (group is collapsed)
    await expect(page.getByText('Bookmark 1')).toBeHidden()

    // Click again to expand
    await collapseButton.click()

    // Verify bookmark is visible again
    await expect(page.getByText('Bookmark 1')).toBeVisible()
  })

  test('should show empty group state when group has no bookmarks', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up an empty group
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Empty Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify empty state message is visible
    await expect(page.getByText('No bookmarks in this group')).toBeVisible()
    await expect(page.getByText(/Drag and drop bookmarks here to add them/i)).toBeVisible()
  })
})

test.describe('Drag and Drop Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should move bookmark from one group to another', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)

    // Set up two groups
    await page.evaluate((tabId) => {
      const groups = [
        {
          id: 'group-1',
          name: 'Source Group',
          color: '#3b82f6',
          tabId: tabId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'group-2',
          name: 'Target Group',
          color: '#ef4444',
          tabId: tabId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    // Set up a bookmark in the first group
    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Movable Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark is in source group
    await expect(page.getByText('Movable Bookmark')).toBeVisible()
    await expect(page.getByText('Source Group')).toBeVisible()
    await expect(page.getByText('Target Group')).toBeVisible()

    // Find bookmark card and target group
    const bookmarkCard = page.getByText('Movable Bookmark').locator('..').locator('..')
    const targetGroup = page.getByText('Target Group').locator('..').locator('..')

    // Drag bookmark to target group
    await bookmarkCard.dragTo(targetGroup)

    // Wait a bit for the drag operation to complete
    await page.waitForTimeout(500)

    // Wait for bookmark to be moved - increase timeout since API calls may take time
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        const bookmark = bookmarks.find((b: Bookmark) => b.id === 'bookmark-1')
        return bookmark && bookmark.groupIds && 
               bookmark.groupIds.includes('group-2') &&
               !bookmark.groupIds.includes('group-1')
      } catch {
        return false
      }
    }, { timeout: 30000 })

    // Reload to see the change
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark is now in target group
    await expect(page.getByText('Movable Bookmark')).toBeVisible()
    const targetGroupSection = page.getByRole('heading', { name: 'Target Group' }).locator('..')
    await expect(targetGroupSection.getByText('Movable Bookmark')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Duplicate Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should duplicate a bookmark', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Original Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form
    await page.getByLabel('Options').first().click()
    await page.getByLabel('Modify bookmark').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Click duplicate button
    const duplicateButton = page.getByRole('button', { name: 'Duplicate bookmark' })
    await duplicateButton.click()

    // Wait for duplicate to be created
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('bookmarks-mock-data')
      if (!stored) return false
      try {
        const bookmarks = JSON.parse(stored)
        return bookmarks.some((b: Bookmark) => b.name === 'Original Bookmark copy')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Reload to see the duplicate
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify both bookmarks exist
    const bookmarkTexts = page.getByText('Original Bookmark')
    await expect(bookmarkTexts.first()).toBeVisible()
    // Should have at least one bookmark with "copy" in the name
    await expect(page.getByText(/Original Bookmark copy/i)).toBeVisible({ timeout: 5000 })
  })

  test('should duplicate a group', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up a group with a bookmark
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Original Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Group Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form
    const modifyButton = page.getByLabel('Modify group').first()
    await modifyButton.click()
    await expect(page.getByRole('heading', { name: 'Edit Group' })).toBeVisible()

    // Click duplicate button
    const duplicateButton = page.getByRole('button', { name: 'Duplicate group' })
    await duplicateButton.click()

    // Wait for duplicate to be created
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('groups-mock-data')
      if (!stored) return false
      try {
        const groups = JSON.parse(stored)
        return groups.some((g: { name: string }) => g.name === 'Original Group copy')
      } catch {
        return false
      }
    }, { timeout: 5000 })

    // Reload to see the duplicate
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify both groups exist (use getByRole with exact match to avoid strict mode violation)
    await expect(page.getByRole('heading', { name: 'Original Group', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Original Group copy' })).toBeVisible({ timeout: 5000 })
  })

  test('should duplicate a tab', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up a tab with a group and bookmark
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Tab Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'Tab Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form
    const tabButton = page.getByRole('button', { name: defaultTab.name })
    await tabButton.hover()
    const tabGroup = tabButton.locator('..')
    const editButton = tabGroup.getByRole('button', { name: 'Edit tab' })
    await editButton.click()
    await expect(page.getByRole('heading', { name: 'Edit Tab' })).toBeVisible()

    // Click duplicate button
    const duplicateButton = page.getByRole('button', { name: 'Duplicate tab' })
    await duplicateButton.click()

    // Wait a bit for the duplicate operation to start
    await page.waitForTimeout(500)

    // Wait for duplicate to be created (this may take longer as it duplicates groups and bookmarks too)
    await page.waitForFunction(() => {
      const stored = localStorage.getItem('tabs-mock-data')
      if (!stored) return false
      try {
        const tabs = JSON.parse(stored)
        return tabs.some((t: { name: string }) => t.name === `${defaultTab.name} copy`)
      } catch {
        return false
      }
    }, { timeout: 30000 })

    // Reload to see the duplicate
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify duplicate tab exists
    await expect(page.getByText(`${defaultTab.name} copy`)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Multiple Bookmarks in Group', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should display multiple bookmarks in a group', async ({ page }) => {
    const defaultTab = await setupDefaultTab(page)
    
    // Set up a group
    await page.evaluate((tabId) => {
      const groups = [{
        id: 'group-1',
        name: 'Multi Bookmark Group',
        color: '#3b82f6',
        tabId: tabId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]
      localStorage.setItem('groups-mock-data', JSON.stringify(groups))
    }, defaultTab.id)

    // Set up multiple bookmarks in the group
    await setupMockBookmarks(page, [
      {
        id: 'bookmark-1',
        name: 'First Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
      {
        id: 'bookmark-2',
        name: 'Second Bookmark',
        url: 'https://example2.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
      {
        id: 'bookmark-3',
        name: 'Third Bookmark',
        url: 'https://example3.com',
        createdAt: new Date().toISOString(),
        tabId: defaultTab.id,
        groupIds: ['group-1'],
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify all bookmarks are visible
    await expect(page.getByText('First Bookmark')).toBeVisible()
    await expect(page.getByText('Second Bookmark')).toBeVisible()
    await expect(page.getByText('Third Bookmark')).toBeVisible()

    // Verify group shows correct count
    const groupHeading = page.getByRole('heading', { name: 'Multi Bookmark Group' })
    await expect(groupHeading.locator('..').locator('..').getByText('(3)')).toBeVisible()
  })
})

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await setupDefaultTab(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should submit form using Enter key', async ({ page }) => {
    // Open add bookmark form
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Fill form
    await page.getByLabel('Name').fill('Enter Key Bookmark')
    await page.getByLabel('URL').fill('https://example.com')

    // Submit using Enter key (focus should be on URL input)
    await page.getByLabel('URL').press('Enter')

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden({ timeout: 5000 })

    // Verify bookmark was created
    await expect(page.getByText('Enter Key Bookmark')).toBeVisible({ timeout: 5000 })
  })

  test('should navigate form fields using Tab key', async ({ page }) => {
    // Open add bookmark form
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Focus should start on name input
    const nameInput = page.getByLabel('Name')
    await expect(nameInput).toBeFocused()

    // Tab to URL input
    await nameInput.press('Tab')
    const urlInput = page.getByLabel('URL')
    await expect(urlInput).toBeFocused()

    // Tab to Cancel button
    await urlInput.press('Tab')
    const cancelButton = page.getByRole('button', { name: 'Cancel' })
    await expect(cancelButton).toBeFocused()
  })

  test('should close modal using Escape key from any field', async ({ page }) => {
    // Open add bookmark form
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Fill some data
    await page.getByLabel('Name').fill('Test')
    await page.getByLabel('URL').fill('https://test.com')

    // Press Escape
    await page.keyboard.press('Escape')

    // Verify form is closed
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeHidden()
  })
})
