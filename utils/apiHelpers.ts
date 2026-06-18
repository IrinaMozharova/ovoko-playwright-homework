import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { petstoreConfig } from '../test-data/petstoreTestData';

export async function deleteResourceWithRetries(
  request: APIRequestContext,
  path: string,
  resourceName: string,
  maxAttempts = 3
): Promise<void> {
  let lastResponse: APIResponse | undefined;
  let lastResponseBody = '';
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.info(`[API] Deleting ${resourceName}. Attempt ${attempt}/${maxAttempts}`);

    try {
      const response = await request.delete(path, {
        headers: {
          api_key: petstoreConfig.apiKey,
        },
        failOnStatusCode: false,
        timeout: 15_000,
      });

      lastResponse = response;
      lastResponseBody = await response.text().catch(() => '');

      const status = response.status();

      if (status === 200 || status === 404) {
        console.info(`[API] Delete ${resourceName} finished with status ${status}`);
        return;
      }

      console.warn(
        [
          `[API] Delete ${resourceName} returned unexpected status ${status}`,
          `URL: ${response.url()}`,
          `Response body: ${lastResponseBody}`,
        ].join('\n')
      );
    } catch (error) {
      lastError = error;
      console.warn(`[API] Delete ${resourceName} failed: ${String(error)}`);
    }

    await wait(1000 * attempt);
  }

  throw new Error(
    [
      `Failed to delete ${resourceName} after ${maxAttempts} attempts.`,
      `Last URL: ${lastResponse?.url() ?? 'no response'}`,
      `Last status: ${lastResponse?.status() ?? 'no response'}`,
      `Last response body: ${lastResponseBody || 'empty'}`,
      `Last error: ${lastError ? String(lastError) : 'none'}`,
    ].join('\n')
  );
}

export async function expectResourceNotFoundWithRetries(
  request: APIRequestContext,
  path: string,
  resourceName: string,
  maxAttempts = 3
): Promise<void> {
  let lastResponse: APIResponse | undefined;
  let lastResponseBody = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.info(
      `[API] Verifying ${resourceName} cannot be retrieved. Attempt ${attempt}/${maxAttempts}`
    );

    const response = await request.get(path, {
      failOnStatusCode: false,
      timeout: 15_000,
    });

    lastResponse = response;
    lastResponseBody = await response.text().catch(() => '');

    const status = response.status();

    if (status === 404) {
      console.info(`[API] ${resourceName} cannot be retrieved. Status: 404`);
      return;
    }

    console.warn(
      [
        `[API] Expected 404 for ${resourceName}, but received ${status}`,
        `URL: ${response.url()}`,
        `Response body: ${lastResponseBody}`,
      ].join('\n')
    );

    await wait(1000 * attempt);
  }

  expect(
    lastResponse?.status(),
    [
      `${resourceName} should not be retrievable after deletion.`,
      `Expected status: 404`,
      `Last URL: ${lastResponse?.url() ?? 'no response'}`,
      `Last response body: ${lastResponseBody || 'empty'}`,
    ].join('\n')
  ).toBe(404);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}