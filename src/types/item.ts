export const ItemCategory = {
  VEGETABLES: "VEGETABLES",
  FRUITS: "FRUITS",
  DAIRY: "DAIRY",
  MEAT: "MEAT",
  DRINKS: "DRINKS",
  CLEANING: "CLEANING",
  OTHER: "OTHER",
} as const;

export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory];

export interface Item {
  id: number;
  name: string;
  category: ItemCategory;
  imageUrl: string | null;
  creatorId: number | null;
}

export interface CreateItemPayload {
  name: string;
  category: ItemCategory;
}

export interface UpdateItemPayload {
  name?: string;
  category?: ItemCategory;
}