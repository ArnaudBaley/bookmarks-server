import { test, expect } from '@playwright/test'

// Use only Chromium for snapshot tests for consistency and speed
test.use({ 
  browserName: 'chromium',
})

test.describe('UI Snapshots', () => {
  test('capture homepage snapshot - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for the main content to be visible
    await page.waitForSelector('h1:has-text("My Bookmarks")', { timeout: 5000 })
    await page.waitForTimeout(500)
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
    })
  })

  test('capture homepage snapshot - dark theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for the main content to be visible
    await page.waitForSelector('h1:has-text("My Bookmarks")', { timeout: 5000 })
    
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()
    await page.waitForTimeout(500) // Wait for theme transition
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    })
  })

  test('capture homepage with bookmarks - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Add some test bookmarks via localStorage (mock API)
    await page.evaluate(() => {
      const bookmarks = [
        {
          id: '1',
          name: 'Vue.js',
          url: 'https://vuejs.org',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'TypeScript',
          url: 'https://www.typescriptlang.org',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Playwright',
          url: 'https://playwright.dev',
          createdAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(bookmarks))
    })
    
    // Reload to show bookmarks
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Wait for bookmarks to be visible - look for the modify button which indicates a bookmark card
    await page.waitForSelector('button[aria-label="Modify bookmark"]', { timeout: 5000 })
    await page.waitForTimeout(500)
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage-with-bookmarks-light.png', {
      fullPage: true,
    })
  })

  test('capture add bookmark form - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for the main content
    await page.waitForSelector('h1:has-text("My Bookmarks")', { timeout: 5000 })
    
    // Open the add bookmark form
    const addButton = page.getByRole('button', { name: /add new bookmark/i })
    await addButton.click()
    
    // Wait for form to be visible - look for the form heading
    await page.waitForSelector('h2:has-text("Add New Bookmark")', { timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Add New Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('add-bookmark-form-light.png')
  })

  test('capture add bookmark form - dark theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for the main content
    await page.waitForSelector('h1:has-text("My Bookmarks")', { timeout: 5000 })
    
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()
    await page.waitForTimeout(500)
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Open the add bookmark form
    const addButton = page.getByRole('button', { name: /add new bookmark/i })
    await addButton.click()
    
    // Wait for form to be visible - look for the form heading
    await page.waitForSelector('h2:has-text("Add New Bookmark")', { timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Add New Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('add-bookmark-form-dark.png')
  })

  test('capture edit bookmark form - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Add a test bookmark via localStorage (mock API)
    await page.evaluate(() => {
      const bookmarks = [
        {
          id: '1',
          name: 'Vue.js',
          url: 'https://vuejs.org',
          createdAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(bookmarks))
    })
    
    // Reload to show bookmark
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Wait for bookmark to be visible
    await page.waitForSelector('button[aria-label="Modify bookmark"]', { timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Click the modify button
    const modifyButton = page.getByRole('button', { name: /modify bookmark/i }).first()
    await modifyButton.click()
    
    // Wait for edit form to be visible - look for the form heading
    await page.waitForSelector('h2:has-text("Edit Bookmark")', { timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Edit Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('edit-bookmark-form-light.png')
  })

  test('capture edit bookmark form - dark theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for the main content
    await page.waitForSelector('h1:has-text("My Bookmarks")', { timeout: 5000 })
    
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()
    await page.waitForTimeout(500)
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Add a test bookmark via localStorage (mock API)
    await page.evaluate(() => {
      const bookmarks = [
        {
          id: '1',
          name: 'Vue.js',
          url: 'https://vuejs.org',
          createdAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem('bookmarks-mock-data', JSON.stringify(bookmarks))
    })
    
    // Reload to show bookmark
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Wait for bookmark to be visible
    await page.waitForSelector('button[aria-label="Modify bookmark"]', { timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Click the modify button
    const modifyButton = page.getByRole('button', { name: /modify bookmark/i }).first()
    await modifyButton.click()
    
    // Wait for edit form to be visible - look for the form heading
    await page.waitForSelector('h2:has-text("Edit Bookmark")', { timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Edit Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('edit-bookmark-form-dark.png')
  })
})

