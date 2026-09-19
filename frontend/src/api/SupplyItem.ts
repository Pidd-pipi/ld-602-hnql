import { mockData } from "../mocks/seedData";
import { get } from "../utils/request";
import type { SupplyItem } from "../types/SupplyItem";

const endpoint = "/api/supply-item";

export async function listSupplyItem(): Promise<SupplyItem[]> {
  try {
    return await get<SupplyItem[]>(endpoint);
  } catch {
    return [...(mockData.supplyItem as unknown as SupplyItem[])];
  }
}
