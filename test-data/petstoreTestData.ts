export const petstoreConfig = {
  apiKey: 'special-key',
  petsCount: 4,
  ordersPerPet: 2,
};

export type PetStatus = 'available';
export type OrderStatus = 'placed';

export type Pet = {
  id: number;
  category: {
    id: number;
    name: string;
  };
  name: string;
  photoUrls: string[];
  tags: {
    id: number;
    name: string;
  }[];
  status: PetStatus;
};

export type Order = {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: OrderStatus;
  complete: boolean;
};

export function buildPet(runId: number, index: number): Pet {
  return {
    id: runId * 10 + index,
    category: {
      id: 1,
      name: 'dogs',
    },
    name: `automation-pet-${runId}-${index}`,
    photoUrls: ['https://example.com/pet-photo.jpg'],
    tags: [
      {
        id: index,
        name: 'api-test',
      },
    ],
    status: 'available',
  };
}

export function buildOrder(orderId: number, petId: number, quantity: number): Order {
  return {
    id: orderId,
    petId,
    quantity,
    shipDate: new Date().toISOString(),
    status: 'placed',
    complete: false,
  };
}