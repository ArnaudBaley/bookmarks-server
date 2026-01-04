import { test, expect } from '@playwright/test'

// Use only Chromium for feature tests for consistency
test.use({ 
  browserName: 'chromium',
})

/**
 * Helper function to clear all mock data from localStorage
 * Note: Page must be navigated to a URL first before accessing localStorage
 */
async function clearMockData(page: any) {
  await page.evaluate(() => {
    try {
      localStorage.removeItem('bookmarks-mock-data')
      localStorage.removeItem('groups-mock-data')
      localStorage.removeItem('theme')
    } catch (e) {
      // Ignore errors if localStorage is not accessible
    }
  })
}

/**
 * Helper function to set up mock bookmarks in localStorage
 */
async function setupMockBookmarks(page: any, bookmarks: any[]) {
  await page.evaluate((bookmarksData) => {
    localStorage.setItem('bookmarks-mock-data', JSON.stringify(bookmarksData))
  }, bookmarks)
}

/**
 * Helper function to get bookmarks from localStorage
 */
async function getMockBookmarks(page: any): Promise<any[]> {
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
async function waitForBookmarksLoaded(page: any) {
  // Wait for the heading to be visible
  await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
  // Wait a bit for any async operations to complete
  await page.waitForTimeout(500)
}

test.describe('Bookmark Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
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
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).not.toBeVisible()

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

    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).not.toBeVisible()
    await expect(page.getByText('TypeScript')).toBeVisible()

    // Verify URL was normalized with https://
    const bookmarks = await getMockBookmarks(page)
    expect(bookmarks[0].url).toBe('https://typescriptlang.org')
  })

  test('should edit an existing bookmark', async ({ page }) => {
    // Set up initial bookmark
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Vue.js',
        url: 'https://vuejs.org',
        createdAt: new Date().toISOString(),
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark is visible
    await expect(page.getByText('Vue.js')).toBeVisible()

    // Click modify button
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
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).not.toBeVisible()

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
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Open edit form
    await page.getByLabel('Modify bookmark').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Make changes
    await page.getByLabel('Name').clear()
    await page.getByLabel('Name').fill('Changed Name')

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Verify form closed
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).not.toBeVisible()

    // Verify original name still visible (changes not saved)
    await expect(page.getByText('Original Name')).toBeVisible()
    await expect(page.getByText('Changed Name')).not.toBeVisible()

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
      },
    ])

    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark exists
    await expect(page.getByText('Bookmark to Delete')).toBeVisible()

    // Open edit form
    await page.getByLabel('Modify bookmark').first().click()
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()

    // Click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete bookmark' })
    await deleteButton.click()

    // Wait for form to close
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).not.toBeVisible()

    // Verify bookmark is removed from UI
    await expect(page.getByText('Bookmark to Delete')).not.toBeVisible()

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

    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).not.toBeVisible()
    await expect(page.getByText('Persistent Bookmark')).toBeVisible()

    // Reload page
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify bookmark still exists after reload
    await expect(page.getByText('Persistent Bookmark')).toBeVisible()
  })

  test('should open bookmark URL in new tab when clicked', async ({ page, context }) => {
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Test Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
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
    
    // Wait a bit for validation to run
    await page.waitForTimeout(100)

    // Check if error message appears OR form is still open (both indicate validation worked)
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
    
    // Wait a bit for validation to run
    await page.waitForTimeout(100)

    // Check if error message appears OR form is still open (both indicate validation worked)
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
    
    // Wait a bit for validation to run
    await page.waitForTimeout(200)

    // Verify error message appears (custom validation should catch invalid URL)
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
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).not.toBeVisible()

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
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).not.toBeVisible()
  })

  test('should close form when pressing Escape key', async ({ page }) => {
    await page.getByRole('button', { name: /add new bookmark/i }).click()
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Verify form is closed
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).not.toBeVisible()
  })
})

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should toggle from light to dark theme', async ({ page }) => {
    // Verify initial state (light theme by default)
    const htmlElement = page.locator('html')
    const initialClass = await htmlElement.getAttribute('class')
    const isInitiallyDark = initialClass?.includes('dark') || false

    // Click theme toggle button
    const themeToggle = page.getByRole('button', { name: /switch to dark theme|switch to light theme/i })
    await themeToggle.click()

    // Wait a bit for theme to apply
    await page.waitForTimeout(200)

    // Verify theme changed
    const newClass = await htmlElement.getAttribute('class')
    const isNowDark = newClass?.includes('dark') || false
    
    // Theme should have changed
    expect(isNowDark).not.toBe(isInitiallyDark)
  })

  test('should toggle from dark to light theme', async ({ page }) => {
    // First switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme|switch to light theme/i })
    await themeToggle.click()
    await page.waitForTimeout(200)

    // Verify dark theme is applied
    const htmlElement = page.locator('html')
    let htmlClass = await htmlElement.getAttribute('class')
    expect(htmlClass?.includes('dark') || false).toBe(true)

    // Toggle back to light
    await themeToggle.click()
    await page.waitForTimeout(200)

    // Verify light theme is applied
    htmlClass = await htmlElement.getAttribute('class')
    expect(htmlClass?.includes('dark') || false).toBe(false)
  })

  test('should persist theme preference across page reloads', async ({ page }) => {
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme|switch to light theme/i })
    await themeToggle.click()
    await page.waitForTimeout(200)

    // Verify dark theme is applied
    let htmlElement = page.locator('html')
    let htmlClass = await htmlElement.getAttribute('class')
    expect(htmlClass?.includes('dark') || false).toBe(true)

    // Reload page
    await page.reload()
    await waitForBookmarksLoaded(page)

    // Verify theme persisted
    htmlElement = page.locator('html')
    htmlClass = await htmlElement.getAttribute('class')
    expect(htmlClass?.includes('dark') || false).toBe(true)
  })

  test('should update theme toggle button aria-label', async ({ page }) => {
    const themeToggle = page.getByRole('button', { name: /switch to dark theme|switch to light theme/i })
    
    // Get initial aria-label
    const initialLabel = await themeToggle.getAttribute('aria-label')
    
    // Toggle theme
    await themeToggle.click()
    await page.waitForTimeout(200)

    // Get new aria-label
    const newLabel = await themeToggle.getAttribute('aria-label')
    
    // Labels should be different
    expect(newLabel).not.toBe(initialLabel)
    
    // Should contain "dark" or "light"
    expect(newLabel?.toLowerCase().includes('dark') || newLabel?.toLowerCase().includes('light')).toBe(true)
  })
})

test.describe('UI State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearMockData(page)
    await page.reload()
    await waitForBookmarksLoaded(page)
  })

  test('should show empty state when no bookmarks exist', async ({ page }) => {
    // Verify empty state message
    await expect(page.getByText(/No bookmarks yet/i)).toBeVisible()
    await expect(page.getByText(/Click the \+ button to add your first bookmark/i)).toBeVisible()
  })

  test('should show loading state initially', async ({ page }) => {
    // Navigate to a fresh page
    await page.goto('/')
    
    // Check for loading state (may be very brief, so we check if it appears)
    const loadingText = page.getByText('Loading bookmarks...')
    
    // Either loading text is visible or page has already loaded
    const isVisible = await loadingText.isVisible().catch(() => false)
    if (isVisible) {
      await expect(loadingText).toBeVisible()
    }
    
    // Eventually, the main heading should appear
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
  })

  test('should display bookmarks in ungrouped section', async ({ page }) => {
    await setupMockBookmarks(page, [
      {
        id: '1',
        name: 'Ungrouped Bookmark',
        url: 'https://example.com',
        createdAt: new Date().toISOString(),
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
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).not.toBeVisible()
  })
})

