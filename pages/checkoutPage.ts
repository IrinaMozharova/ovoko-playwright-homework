import type { Locator, Page } from '@playwright/test';
import { textToFlexibleRegExp } from '../utils/textUtils';

type ShippingAddress = {
  email: string;
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  zipCode: string;
  phoneNumber: string;
};

type PaymentCard = {
  number: string;
  expirationDate: string;
  securityCode: string;
};

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  get confirmAndPayButton(): Locator {
    return this.page.locator('button[data-test-id="CONFIRM_AND_PAY_BUTTON"]');
  }

  get addAddressButton(): Locator {
    return this.page.locator('[data-test-id="ADD_ADDRESS_SUBMIT"]');
  }

  get addCardButton(): Locator {
    return this.page.locator('[data-test-id="ADD_CARD"]');
  }

  itemTitle(productName: string): Locator {
    return this.page.getByRole('heading', {
      level: 3,
      name: textToFlexibleRegExp(productName),
    });
  }

  async continueAsGuest(): Promise<void> {
    console.info('[CheckoutPage] Selecting guest checkout modal');

    const guestButton = this.page
      .frameLocator('iframe[title="Sign in to your account"]')
      .getByTestId('modal-gxo-link');

    await guestButton.click();

    console.info('[CheckoutPage] Continued checkout as guest');
  }

  async fillShippingAddress(address: ShippingAddress): Promise<void> {
    console.info('[CheckoutPage] Filling shipping address');

    await this.page.getByRole('textbox', { name: 'Email' }).fill(address.email);
    await this.page.getByRole('textbox', { name: 'First name' }).fill(address.firstName);
    await this.page.getByRole('textbox', { name: 'Last name' }).fill(address.lastName);

    await this.page
      .getByRole('textbox', { name: 'Street address', exact: true })
      .fill(address.streetAddress);

    await this.page.getByRole('textbox', { name: 'City' }).fill(address.city);
    await this.page.getByRole('textbox', { name: 'ZIP code' }).fill(address.zipCode);

    await this.page.getByRole('button', { name: /Country Code/i }).click();
    await this.page.getByRole('option', { name: /Lithuania \+370/i }).click();

    await this.page
      .getByRole('textbox', { name: 'Phone number (required)' })
      .fill(address.phoneNumber);

    await this.addAddressButton.waitFor({ state: 'visible' });
    await this.addAddressButton.click();

    console.info('[CheckoutPage] Shipping address was submitted');
  }

  async addPaymentCard(card: PaymentCard): Promise<void> {
    console.info('[CheckoutPage] Filling payment card details');

    await this.page.getByRole('radio', { name: /Add new card/i }).check();

    await this.page.getByRole('textbox', { name: 'Card number' }).fill(card.number);
    await this.page.getByRole('textbox', { name: 'Expiration date' }).fill(card.expirationDate);
    await this.page.getByRole('textbox', { name: 'Security code' }).fill(card.securityCode);

    await this.addCardButton.waitFor({ state: 'visible' });
    await this.addCardButton.click();

    console.info('[CheckoutPage] Payment card details were submitted');
  }

  async cancelCurrencySelectionIfPresent(): Promise<void> {
    console.info('[CheckoutPage] Checking if currency selection popup is visible');

    const isPopupVisible = await this.currencySelectionPopup
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!isPopupVisible) {
      console.info('[CheckoutPage] Currency selection popup was not displayed');
      return;
    }

    await this.currencySelectionCancelButton.click();
    await this.currencySelectionPopup.waitFor({ state: 'hidden' });

    console.info('[CheckoutPage] Currency selection popup was cancelled');
  }

  private get currencySelectionPopup(): Locator {
    return this.page
      .locator('.lightbox-dialog__window')
      .filter({ hasText: 'Select a currency for this purchase' })
      .first();
  }

  private get currencySelectionCancelButton(): Locator {
    return this.currencySelectionPopup.locator(
      '.currency-footer--buttons button.btn--secondary',
      { hasText: /^Cancel$/ }
    );
  }
}
