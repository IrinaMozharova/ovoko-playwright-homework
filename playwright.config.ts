import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],
  ],

  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      use: {
        baseURL: 'https://petstore.swagger.io/v2/',
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
    },
    {
      name: 'Google Chrome',
      testIgnore: /.*\.api\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
    {
      name: 'Firefox',
      testIgnore: /.*\.api\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
      },
    },
  ],
});