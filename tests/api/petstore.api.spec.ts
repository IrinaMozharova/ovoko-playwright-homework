import { test, expect } from '@playwright/test';
import {
  buildOrder,
  buildPet,
  petstoreConfig,
  type Order,
  type Pet,
} from '../../test-data/petstoreTestData';
import {
  deleteResourceWithRetries,
  expectResourceNotFoundWithRetries,
} from '../../utils/apiHelpers';

const endpoints = {
  pet: 'pet',
  petById: (petId: number) => `pet/${petId}`,
  order: 'store/order',
  orderById: (orderId: number) => `store/order/${orderId}`,
};

test.describe('Petstore API automation', () => {
  test('create pets, place orders, delete resources, and verify 404 after deletion', async ({
    request,
  }) => {
    test.setTimeout(120_000);

    const runId = Math.floor(Date.now() % 1_000_000);

    const createdPetIds: number[] = [];
    const createdOrderIds: number[] = [];

    try {
      await test.step('Create 4 pets with status available', async () => {
        for (let index = 1; index <= petstoreConfig.petsCount; index++) {
          const pet = buildPet(runId, index);

          console.info(`[API] Creating pet with ID: ${pet.id}`);

          const createPetResponse = await request.post(endpoints.pet, {
            data: pet,
            failOnStatusCode: false,
          });

          expect(createPetResponse.status()).toBe(200);

          const createdPet = (await createPetResponse.json()) as Pet;

          expect(createdPet.id).toBe(pet.id);
          expect(createdPet.name).toBe(pet.name);
          expect(createdPet.status).toBe('available');

          createdPetIds.push(pet.id);

          console.info(`[API] Pet created successfully. ID: ${pet.id}`);

          const getPetResponse = await request.get(endpoints.petById(pet.id), {
            failOnStatusCode: false,
          });

          expect(getPetResponse.status()).toBe(200);

          const retrievedPet = (await getPetResponse.json()) as Pet;

          expect(retrievedPet.id).toBe(pet.id);
          expect(retrievedPet.status).toBe('available');
        }

        expect(createdPetIds).toHaveLength(petstoreConfig.petsCount);
      });

      await test.step('Place multiple orders for each created pet', async () => {
        let orderId = 1;

        for (const petId of createdPetIds) {
          for (let orderIndex = 1; orderIndex <= petstoreConfig.ordersPerPet; orderIndex++) {
            const order = buildOrder(orderId, petId, orderIndex);

            console.info(`[API] Creating order with ID: ${order.id} for pet ID: ${petId}`);

            const createOrderResponse = await request.post(endpoints.order, {
              data: order,
              failOnStatusCode: false,
            });

            expect(createOrderResponse.status()).toBe(200);

            const createdOrder = (await createOrderResponse.json()) as Order;

            expect(createdOrder.id).toBe(order.id);
            expect(createdOrder.petId).toBe(petId);
            expect(createdOrder.status).toBe('placed');

            createdOrderIds.push(order.id);

            console.info(`[API] Order created successfully. ID: ${order.id}`);

            const getOrderResponse = await request.get(endpoints.orderById(order.id), {
              failOnStatusCode: false,
            });

            expect(getOrderResponse.status()).toBe(200);

            const retrievedOrder = (await getOrderResponse.json()) as Order;

            expect(retrievedOrder.id).toBe(order.id);
            expect(retrievedOrder.petId).toBe(petId);

            orderId++;
          }
        }

        expect(createdOrderIds).toHaveLength(
          petstoreConfig.petsCount * petstoreConfig.ordersPerPet
        );
      });
    } finally {
      await test.step('Delete all created orders', async () => {
        console.info('[API] Starting orders cleanup');

        for (const orderId of createdOrderIds) {
          await deleteResourceWithRetries(
            request,
            endpoints.orderById(orderId),
            `order ${orderId}`
          );
        }
      });

      await test.step('Delete all created pets', async () => {
        console.info('[API] Starting pets cleanup');

        for (const petId of createdPetIds) {
          await deleteResourceWithRetries(
            request,
            endpoints.petById(petId),
            `pet ${petId}`
          );
        }
      });
    }

    await test.step('Verify deleted orders cannot be retrieved', async () => {
      console.info('[API] Starting verification for deleted orders');

      for (const orderId of createdOrderIds) {
        await expectResourceNotFoundWithRetries(
          request,
          endpoints.orderById(orderId),
          `order ${orderId}`
        );
      }
    });

    await test.step('Verify deleted pets cannot be retrieved', async () => {
      console.info('[API] Starting verification for deleted pets');

      for (const petId of createdPetIds) {
        await expectResourceNotFoundWithRetries(
          request,
          endpoints.petById(petId),
          `pet ${petId}`
        );
      }
    });
  });
});