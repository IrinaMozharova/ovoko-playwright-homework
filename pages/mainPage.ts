import type { Locator, Page } from '@playwright/test';
import { escapeRegExp, normalizeProductName } from '../utils/textUtils';

const EBAY_HOME_URL = 'https://www.ebay.com/';

export class MainPage {
  constructor(private readonly page: Page) { }

  get searchInput(): Locator {
    return this.page.getByRole('combobox', { name: 'Search for anything' });
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get searchResults(): Locator {
    return this.page.locator('ul.srp-results');
  }

  get cartLink(): Locator {
    return this.page.locator('a[href*="cart.ebay.com"]').filter({
      has: this.page.locator('.gh-cart__icon'),
    });
  }

  resultsHeading(searchTerm: string): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: new RegExp(`results for\\s+${escapeRegExp(searchTerm)}`, 'i'),
    });
  }

  appliedBrandFilter(brandName: string): Locator {
    return this.page.getByRole('link', {
      name: new RegExp(`^${escapeRegExp(brandName)}\\s*Remove filter$`, 'i'),
    });
  }

  appliedPriceFilter(minPrice: string, maxPrice: string): Locator {
    return this.page.getByRole('link', {
      name: new RegExp(
        `${escapeRegExp(minPrice)}.*${escapeRegExp(maxPrice)}.*Remove filter`,
        'i'
      ),
    });
  }

  async open(): Promise<void> {
    console.info('[MainPage] Opening eBay home page');

    await this.page.goto(EBAY_HOME_URL);
    await this.searchInput.waitFor({ state: 'visible' });

    console.info('[MainPage] eBay home page is opened');
  }

  async closeCookiesBanner(): Promise<void> {
  console.info('[MainPage] Checking if cookies banner is visible');

  const closeButton = this.page.locator('#gdpr-banner-decline-x');

  const isCookieBannerVisible = await closeButton
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (!isCookieBannerVisible) {
    console.info('[MainPage] Cookies banner was not displayed');
    return;
  }

  await closeButton.click();

  console.info('[MainPage] Cookies banner was closed');
}

  async searchFor(searchTerm: string): Promise<void> {
    console.info(`[MainPage] Searching for "${searchTerm}"`);

    await this.searchInput.fill(searchTerm);

    await Promise.all([
      this.page.waitForURL(/sch\/i\.html/i),
      this.searchButton.click(),
    ]);
    await this.waitForSearchResultsReady();

    console.info(`[MainPage] Search results for "${searchTerm}" are displayed`);
  }

  async filterByBrand(brandName: string): Promise<void> {
    console.info(`[MainPage] Applying brand filter: "${brandName}"`);

    const seeAllBrandButton = this.page.getByRole('button', {
      name: /see all.*brand.*opens dialog/i,
    });

    await seeAllBrandButton.waitFor({ state: 'visible' });
    await seeAllBrandButton.click();

    await this.page.getByRole('textbox', { name: 'Brand search' }).fill(brandName);

    await this.page
      .getByRole('checkbox', {
        name: new RegExp(`^${escapeRegExp(brandName)}\\s+\\(`, 'i'),
      })
      .check();

    await this.page.getByRole('button', { name: 'Apply' }).click();
    await this.waitForSearchResultsReady();

    console.info(`[MainPage] Brand filter "${brandName}" was applied`);
  }

  async filterByPrice(minPrice: string, maxPrice: string): Promise<void> {
    console.info(`[MainPage] Applying price filter: ${minPrice} - ${maxPrice}`);

    const minimumPriceInput = this.page.getByRole('textbox', { name: /Minimum value/i });
    const maximumPriceInput = this.page.getByRole('textbox', { name: /Maximum Value in \$/i });

    await minimumPriceInput.fill(minPrice);
    await maximumPriceInput.click();
    await maximumPriceInput.fill('');
    await maximumPriceInput.pressSequentially(maxPrice);

    const enteredMaxPrice = await maximumPriceInput.inputValue();

    if (enteredMaxPrice !== maxPrice) {
      throw new Error(`Expected max price input to contain "${maxPrice}", got "${enteredMaxPrice}"`);
    }

    await maximumPriceInput.press('Enter');
    await this.waitForSearchResultsReady();

    console.info(`[MainPage] Price filter ${minPrice} - ${maxPrice} was submitted`);
  }

  async expandAppliedFiltersIfNeeded(): Promise<void> {
    console.info('[MainPage] Checking if applied filters section should be expanded');

    const filtersButton = this.page.getByRole('button', {
      name: /\d+\s+filters?\s+applied/i,
    });

    const isVisible = await filtersButton
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (!isVisible) {
      console.info('[MainPage] Applied filters section is already visible or not expandable');
      return;
    }

    await filtersButton.click();

    console.info('[MainPage] Applied filters section was expanded');
  }

  async getProductNameByPosition(position: number): Promise<string> {
    console.info(`[MainPage] Reading product name at position ${position}`);

    const productTitle = this.productTitleByPosition(position);

    await this.waitForSearchResultsReady();

    const titleText = await productTitle.innerText();
    const normalizedTitle = normalizeProductName(titleText);

    console.info(`[MainPage] Product at position ${position}: "${normalizedTitle}"`);

    return normalizedTitle;
  }

  async openProductByPosition(position: number): Promise<Page> {
    console.info(`[MainPage] Opening product at position ${position}`);

    const productLink = this.productLinkByPosition(position);

    await this.waitForSearchResultsReady();

    const productPagePromise = 
      this.page.waitForEvent('popup');

    await productLink.click();

    const productPage = await productPagePromise;

    console.info(`[MainPage] Product page at position ${position} was opened`);

    return productPage;
  }

  async openHomePage(): Promise<void> {
    console.info('[MainPage] Opening eBay home page from header');

    await this.page.getByRole('link', { name: 'eBay Home' }).click();
    await this.searchInput.waitFor({ state: 'visible' });

    console.info('[MainPage] eBay home page from header is opened');
  }

  async openCart(): Promise<void> {
    console.info('[MainPage] Opening cart');

    await this.cartLink.waitFor({ state: 'visible' });
    await this.cartLink.click();

    console.info('[MainPage] Cart was opened');
  }

  private productTitleByPosition(position: number): Locator {
    return this.productByPosition(position).getByRole('heading', { level: 3 });
  }

  private productLinkByPosition(position: number): Locator {
    return this.productByPosition(position)
      .getByRole('link')
      .filter({ has: this.page.getByRole('heading', { level: 3 }) })
      .first();
  }

  private productByPosition(position: number): Locator {
    return this.page
      .locator('ul.srp-results')
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('heading', { level: 3 }) })
      .nth(position - 1);
  }

  private async waitForSearchResultsReady(): Promise<void> {
    await this.page.locator('[data-testid="page_mask"]').waitFor({
      state: 'hidden',
      timeout: 30000,
    });
  }
}
