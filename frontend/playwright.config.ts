import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    /* Use dedicated test port (5174) to avoid conflicts with Docker frontend (5173) */
    baseURL: 'http://localhost:5174',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Run tests headless (without opening browser) */
    headless: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Disable service workers to prevent caching of resources */
        serviceWorkers: 'block',
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        /* Disable service workers to prevent caching of resources */
        serviceWorkers: 'block',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        /* Disable service workers to prevent caching of resources */
        serviceWorkers: 'block',
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',
  
  /* Snapshot directory for visual comparisons */
  snapshotDir: './e2e/snapshots',

  /* Run your local dev server before starting the tests */
  webServer: {
    /**
     * Always build fresh before running e2e tests to ensure latest code is tested.
     * This prevents issues with stale cache or outdated builds.
     * Use dedicated test port (5174) to avoid conflicts with Docker frontend (5173).
     * 
     * Build process:
     * 1. Clear dist folder and build the application with --emptyOutDir flag
     * 2. Preview the built application
     * 
     * Note: Using build-only ensures fresh build without type-check for faster e2e test startup.
     * The --emptyOutDir flag ensures Vite clears the dist folder before building.
     */
    command: 'npm run build-only -- --emptyOutDir && npm run preview -- --port 5174',
    port: 5174,
    /**
     * Always start a fresh server for e2e tests to ensure environment variables
     * are properly set. This prevents reusing a server that was started without mocks.
     */
    reuseExistingServer: false,
    /**
     * Set environment variables to force mock API usage for e2e tests.
     * This ensures tests don't depend on the backend being available.
     * Note: VITE_API_BASE_URL is intentionally not set, so the mock API will be used.
     */
    env: {
      VITE_USE_MOCK_API: 'true',
      // Explicitly unset VITE_API_BASE_URL by not including it in env
      // This ensures the mock API is used (see bookmarkApi.ts and groupApi.ts)
    },
  },
})
