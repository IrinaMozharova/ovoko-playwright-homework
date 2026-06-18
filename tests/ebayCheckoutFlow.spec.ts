import { test, expect, type Page } from '@playwright/test';
import { CartPage } from '../pages/cartPage';
import { CheckoutPage } from '../pages/checkoutPage';
import { ItemPage } from '../pages/itemPage';
import { MainPage } from '../pages/mainPage';
import { assertNoEbayCaptcha } from '../utils/assertNoEbayCaptcha';
import { customerAddress, ebaySearchData, paymentCard } from '../test-data/ebayTestData';

test.describe('eBay guest shopping flow', () => {

  test.beforeEach(async ({ page }) => {
    const mainPage = new MainPage(page);

    await mainPage.open();
    await mainPage.closeCookiesBanner();
  });

  test('guest can search for headphones', async ({ page }) => {
    const mainPage = new MainPage(page);

    await test.step('Search for headphones', async () => {
      await mainPage.searchFor(ebaySearchData.searchTerm);
    });

    await test.step('Verify search results are displayed', async () => {
      await expect(mainPage.searchResults).toBeVisible();
      await expect(mainPage.resultsHeading(ebaySearchData.searchTerm)).toBeVisible();
      await expect(mainPage.resultsHeading(ebaySearchData.searchTerm)).toContainText(
        ebaySearchData.searchTerm
      );
    });
  });

  test('guest can filter headphones by Sony brand and 50-200 price range', async ({ page }) => {
    const mainPage = new MainPage(page);

    await test.step('Search for headphones', async () => {
      await mainPage.searchFor(ebaySearchData.searchTerm);
    });

    await test.step('Apply Sony brand filter', async () => {
      await mainPage.filterByBrand(ebaySearchData.brandName);

      await mainPage.expandAppliedFiltersIfNeeded();

      await expect(mainPage.appliedBrandFilter(ebaySearchData.brandName)).toBeVisible();
    });

    await test.step('Apply price range filter', async () => {
      await mainPage.filterByPrice(ebaySearchData.minPrice, ebaySearchData.maxPrice);

      await mainPage.expandAppliedFiltersIfNeeded();

      await expect(
        mainPage.appliedPriceFilter(ebaySearchData.minPrice, ebaySearchData.maxPrice)
      ).toBeVisible();

      await expect(mainPage.appliedBrandFilter(ebaySearchData.brandName)).toBeVisible();
      
    });
  });

  test('guest can add third filtered Sony headphones item to cart, reach checkout, and remove it', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const mainPage = new MainPage(page);

    let itemPageTab: Page;
    let selectedProductName = '';

    await test.step('Search for headphones and apply filters', async () => {
      await mainPage.searchFor(ebaySearchData.searchTerm);
      
      await mainPage.filterByBrand(ebaySearchData.brandName);
      
      await mainPage.filterByPrice(ebaySearchData.minPrice, ebaySearchData.maxPrice);
    });

    await test.step('Open the third filtered product', async () => {
      const searchResultProductName = await mainPage.getProductNameByPosition(
        ebaySearchData.productPosition
      );

      itemPageTab = await mainPage.openProductByPosition(ebaySearchData.productPosition);

      const itemPage = new ItemPage(itemPageTab);

      selectedProductName = await itemPage.getTitleText();

      await expect(itemPage.title).toBeVisible();

      console.info(
        `[Test] Product selected from search results: "${searchResultProductName}"`
      );
      console.info(`[Test] Product title from item page: "${selectedProductName}"`);
    });

    await test.step('Add selected product to cart', async () => {
      const itemPage = new ItemPage(itemPageTab);

      await itemPage.addToCart();
      await expect(itemPage.addedToCartMessage).toBeVisible();

      await itemPage.openCart();

      //note:after adding to cart, eBay often show a CAPTCHA page, which blocks the test flow
      await assertNoEbayCaptcha(itemPageTab);

    });

    await test.step('Verify selected product is visible in cart', async () => {
      const cartPage = new CartPage(itemPageTab);

      await expect(cartPage.cartItemTitle(selectedProductName)).toBeVisible();
    });

    await test.step('Proceed to checkout as guest', async () => {
      const cartPage = new CartPage(itemPageTab);
      const checkoutPage = new CheckoutPage(itemPageTab);

      await cartPage.goToCheckout();

      await checkoutPage.continueAsGuest();

      await expect(checkoutPage.itemTitle(selectedProductName)).toBeVisible();
    });

    await test.step('Fill shipping address and payment card details', async () => {
      const checkoutPage = new CheckoutPage(itemPageTab);

      await checkoutPage.fillShippingAddress(customerAddress);

      await checkoutPage.addPaymentCard(paymentCard);
      await checkoutPage.cancelCurrencySelectionIfPresent();

      await expect(checkoutPage.confirmAndPayButton).toBeVisible();
      await expect(checkoutPage.confirmAndPayButton).toBeEnabled();

      console.info(
        '[Test] Checkout reached as far as possible without clicking Confirm and Pay'
      );
    });

    await test.step('Return to cart', async () => {
      const mainPageInProductTab = new MainPage(itemPageTab);
      const cartPage = new CartPage(itemPageTab);

      await mainPageInProductTab.openHomePage();
      await mainPageInProductTab.openCart();

      await expect(cartPage.cartItemTitle(selectedProductName)).toBeVisible();
    });

    await test.step('Remove item from cart', async () => {
      const cartPage = new CartPage(itemPageTab);

      await cartPage.removeOnlyItem();

      await expect(cartPage.emptyCartMessage).toBeVisible();
      await expect(cartPage.cartItemTitle(selectedProductName)).toBeHidden();
    });
  });
});
