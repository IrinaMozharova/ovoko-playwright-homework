import type { Locator, Page } from '@playwright/test';
import { textToFlexibleRegExp } from '../utils/textUtils';

export class CartPage {
  constructor(private readonly page: Page) {}

  get emptyCartMessage(): Locator {
    return this.page.getByText("You don't have any items in your cart.", {
      exact: true,
    });
  }

  get checkoutButton(): Locator {
    return this.page.getByRole('button', { name: 'Go to checkout' });
  }

  cartItemTitle(productName: string): Locator {
    return this.page.getByRole('link', {
      name: textToFlexibleRegExp(productName),
    });
  }

  async goToCheckout(): Promise<void> {
    console.info('[CartPage] Proceeding to checkout');

    await this.checkoutButton.click();

    console.info('[CartPage] Checkout flow was started');
  }

  async removeOnlyItem(): Promise<void> {
    console.info('[CartPage] Removing item from cart');

    const removeButton = this.page.getByRole('button', { name: /^Remove -/i }).first();

    await removeButton.waitFor({ state: 'visible' });
    await removeButton.click();

    console.info('[CartPage] Item was removed from cart');
  }
}
