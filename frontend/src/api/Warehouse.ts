import { mockData } from "../mocks/seedData";
import { get } from "../utils/request";
import type { Warehouse } from "../types/Warehouse";

const endpoint = "/api/warehouse";

export async function listWarehouse(): Promise<Warehouse[]> {
  try {
    return await get<Warehouse[]>(endpoint);
  } catch {
    return [...(mockData.warehouse as unknown as Warehouse[])];
  }
}
