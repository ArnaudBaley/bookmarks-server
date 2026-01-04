import { test, expect } from '@playwright/test'

// Use only Chromium for snapshot tests for consistency and speed
test.use({ 
  browserName: 'chromium',
})

test.describe('UI Snapshots', () => {
  test('capture homepage snapshot - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the main content to be visible
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
    })
  })

  test('capture homepage snapshot - dark theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the main content to be visible
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
    
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    })
  })

  test('capture homepage with bookmarks - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Clear any existing bookmarks and add test bookmarks via localStorage (mock API)
    await page.evaluate(() => {
      localStorage.removeItem('bookmarks-mock-data')
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
    await page.waitForLoadState('load')
    
    // Wait for the main content to be visible
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
    
    // Wait for bookmarks to be visible - look for at least one modify button
    await expect(page.getByRole('button', { name: /modify bookmark/i }).first()).toBeVisible()
    
    // Capture full page screenshot
    await expect(page).toHaveScreenshot('homepage-with-bookmarks-light.png', {
      fullPage: true,
    })
  })

  test('capture add bookmark form - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the main content
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
    
    // Open the add bookmark form
    const addButton = page.getByRole('button', { name: /add new bookmark/i })
    await addButton.click()
    
    // Wait for form to be visible - look for the form heading
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Add New Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('add-bookmark-form-light.png')
  })

  test('capture add bookmark form - dark theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the main content
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
    
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Open the add bookmark form
    const addButton = page.getByRole('button', { name: /add new bookmark/i })
    await addButton.click()
    
    // Wait for form to be visible - look for the form heading
    await expect(page.getByRole('heading', { name: 'Add New Bookmark' })).toBeVisible()
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Add New Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('add-bookmark-form-dark.png')
  })

  test('capture edit bookmark form - light theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Clear any existing bookmarks and add a test bookmark via localStorage (mock API)
    await page.evaluate(() => {
      localStorage.removeItem('bookmarks-mock-data')
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
    await page.waitForLoadState('load')
    
    // Wait for bookmark to be visible - use getByLabel for more specific targeting
    await expect(page.getByLabel('Modify bookmark').first()).toBeVisible()
    
    // Click the modify button - use getByLabel for more specific targeting
    const modifyButton = page.getByLabel('Modify bookmark').first()
    await modifyButton.click()
    
    // Wait for edit form to be visible - look for the form heading
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Edit Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('edit-bookmark-form-light.png')
  })

  test('capture edit bookmark form - dark theme', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    
    // Wait for the main content
    await expect(page.getByRole('heading', { name: 'My Bookmarks' })).toBeVisible()
    
    // Switch to dark theme
    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await themeToggle.click()
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Clear any existing bookmarks and add a test bookmark via localStorage (mock API)
    await page.evaluate(() => {
      localStorage.removeItem('bookmarks-mock-data')
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
    await page.waitForLoadState('load')
    
    // Wait for bookmark to be visible - use getByLabel for more specific targeting
    await expect(page.getByLabel('Modify bookmark').first()).toBeVisible()
    
    // Click the modify button - use getByLabel for more specific targeting
    const modifyButton = page.getByLabel('Modify bookmark').first()
    await modifyButton.click()
    
    // Wait for edit form to be visible - look for the form heading
    await expect(page.getByRole('heading', { name: 'Edit Bookmark' })).toBeVisible()
    
    // Capture screenshot of the form - use the modal container
    const form = page.locator('div:has-text("Edit Bookmark")').locator('..').first()
    await expect(form).toHaveScreenshot('edit-bookmark-form-dark.png')
  })
})

