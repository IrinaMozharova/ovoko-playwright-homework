import type { Page } from '@playwright/test';

export async function assertNoEbayCaptcha(page: Page): Promise<void> {
  console.info('[Security Check] Verifying that eBay CAPTCHA page is not displayed');

  const isCaptchaUrl = /\/splashui\/captcha/i.test(page.url());

  const isCaptchaTextVisible = await page
    .getByText(/Please verify yourself to continue|Please verify yourself/i)
    .first()
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (isCaptchaUrl || isCaptchaTextVisible) {
    const screenshotPath = `test-results/ebay-captcha-${Date.now()}.png`;

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    throw new Error(
      `eBay CAPTCHA/Security Measure page appeared. Test cannot continue automatically. Screenshot: ${screenshotPath}`
    );
  }

  console.info('[Security Check] CAPTCHA page was not detected');
}