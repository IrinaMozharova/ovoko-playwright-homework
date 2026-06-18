import type { Locator, Page } from '@playwright/test';
import { normalizeProductName } from '../utils/textUtils';

export class ItemPage {
  constructor(private readonly page: Page) {}

  get title(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get addToCartButton(): Locator {
    return this.page.getByTestId('x-atc-action').getByTestId('ux-call-to-action');
  }

  get addedToCartMessage(): Locator {
    return this.page.getByText('Added to cart', { exact: true });
  }

  get seeInCartLink(): Locator {
    return this.page.getByRole('link', { name: 'See in cart' });
  }

  async getTitleText(): Promise<string> {
    console.info('[ItemPage] Reading product title');

    await this.title.waitFor({ state: 'visible' });

    const titleText = await this.title.innerText();
    const normalizedTitle = normalizeProductName(titleText);

    console.info(`[ItemPage] Product title: "${normalizedTitle}"`);

    return normalizedTitle;
  }

  async addToCart(): Promise<void> {
    console.info('[ItemPage] Adding product to cart');

    await this.addToCartButton.waitFor({ state: 'visible' });
    await this.addToCartButton.click();

    console.info('[ItemPage] Product was added to cart');
  }

  async openCart(): Promise<void> {
    console.info('[ItemPage] Opening cart from added-to-cart confirmation');

    await this.seeInCartLink.waitFor({ state: 'visible' });
    await this.seeInCartLink.click();

    console.info('[ItemPage] Cart was opened from item page');
  }
}
