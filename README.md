# Playwright Automation Homework

This repository contains a Playwright TypeScript automation project for UI and API testing.

The project covers:

- eBay UI automation scenario
- Swagger Petstore API automation scenario
- Playwright HTML report
- GitHub Actions pipelines

## Tech Stack

- Playwright
- TypeScript
- Node.js
- GitHub Actions

## Test Coverage

### UI Automation: eBay

The UI tests cover the required eBay shopping flow:

- Open <https://www.ebay.com/>
- Search for headphones
- Filter results by Sony
- Set price range from 50 to 200
- Select the third item from the filtered list
- Add the item to cart
- Start guest checkout
- Proceed as far as possible without completing payment
- Return to cart
- Remove the item from cart

The scenario is split into multiple tests:

- Search test
- Filter test
- Full cart and checkout flow test

UI tests are configured for:

- Google Chrome
- Firefox

### API Automation: Swagger Petstore

The API test covers the required Petstore flow:

- Create 4 pets with status `available`
- Place multiple orders for each created pet
- Delete all created orders
- Delete all created pets
- Verify deleted resources cannot be retrieved and return `404`

Base URL:

```text
https://petstore.swagger.io/v2/
```

DELETE requests include the required API key:

```text
special-key
```

Retry logic is implemented for DELETE requests because the assignment notes that DELETE endpoints may be unstable.

## Key Files

| Path | Purpose |
| --- | --- |
| `tests/ebayCheckoutFlow.spec.ts` | UI tests |
| `tests/api/petstore.api.spec.ts` | API test |
| `pages/` | Page Object classes for UI tests |
| `test-data/` | Test data |
| `utils/` | Shared helper methods |
| `.github/workflows/api-tests.yml` | Automatic API test pipeline |
| `.github/workflows/ui-tests-manual.yml` | Manual UI test pipeline |

## Prerequisites

Install Node.js before running the project.

Recommended version:

```text
Node.js 20+
```

## Installation

Clone the repository:

```bash
git clone https://github.com/IrinaMozharova/ovoko-playwright-homework.git
cd ovoko-playwright-homework
```

Install dependencies:

```bash
npm ci
```

Install Playwright browsers:

```bash
npx playwright install
```

If Google Chrome is not installed locally, install it with:

```bash
npx playwright install chrome
```

## Running Tests Locally

Run all tests:

```bash
npm test
```

Run only API tests:

```bash
npm run test:api
```

Run UI tests on both configured browsers:

```bash
npm run test:ui
```

Run UI tests only on Google Chrome:

```bash
npm run test:ui:chrome
```

Run UI tests only on Firefox:

```bash
npm run test:ui:firefox
```

## Test Report

The project uses the Playwright HTML report.

Open the latest report:

```bash
npm run report
```

The report is generated in:

```text
playwright-report/
```

## GitHub Actions Pipelines

The project includes two GitHub Actions workflows.

### API Test Pipeline

Workflow file:

```text
.github/workflows/api-tests.yml
```

The API pipeline runs automatically on:

- Push to `main`
- Pull request to `main`
- Manual workflow run

The pipeline:

1. Checks out the repository
2. Sets up Node.js
3. Installs dependencies with `npm ci`
4. Runs API tests with `npm run test:api`
5. Uploads the Playwright HTML report as an artifact

### Manual UI Test Pipeline

Workflow file:

```text
.github/workflows/ui-tests-manual.yml
```

The UI pipeline is manual only. It does not run automatically on push or pull request.

It can be started from GitHub:

```text
Actions -> Playwright UI Tests Manual -> Run workflow
```

The workflow allows selecting:

- Google Chrome
- Firefox
- All browsers

The manual UI workflow:

1. Checks out the repository
2. Sets up Node.js
3. Installs dependencies with `npm ci`
4. Installs Playwright browsers
5. Runs the selected UI tests
6. Uploads the Playwright HTML report and test artifacts

## Why UI Tests Are Manual in GitHub Actions

The UI tests use the real public eBay website.

In cloud CI environments, eBay may show CAPTCHA or security verification pages. This can block the test flow even when the test code is correct.

For this reason:

- API tests run automatically on push and pull request
- UI tests are available in GitHub Actions as a manual workflow
- UI tests can also be run locally using the commands above

## Notes and Assumptions

- UI tests run against the real eBay website
- eBay content, filters, product availability, prices, and checkout behavior may change
- eBay may show CAPTCHA or security verification
- The checkout flow stops before clicking Confirm and Pay
- API tests run against the public Swagger Petstore demo API
- Swagger Petstore data may be affected by other users because it is a shared public service
- DELETE requests use retry logic because the assignment notes that DELETE endpoints may fail

## Additional API Test Cases Not Automated

The implemented API test covers the main required scenario: creating pets, creating orders for those pets, deleting all created resources, and verifying that deleted resources return `404`.

Additional scenarios that could be tested include:

### Pet Scenarios

- Create a pet with missing required fields
- Create a pet with an invalid status
- Create a pet with duplicate ID
- Get a pet using an invalid ID format, for example a string instead of a number
- Search pets by status `pending`
- Search pets by status `sold`
- Search pets using an invalid status
- Delete a non-existing pet
- Delete the same pet twice and verify the second response

### Order Scenarios

- Create an order for a non-existing pet
- Create an order with missing `petId`
- Create an order with invalid status
- Create an order with quantity `0`
- Create an order with invalid `shipDate`
- Get an order using an invalid ID format
- Get a non-existing order by ID
- Delete a non-existing order
- Delete the same order twice and verify the second response

### Authorization Scenarios

- Delete pet without an API key
- Delete pet with an invalid API key
- Delete order without an API key
- Delete order with an invalid API key

