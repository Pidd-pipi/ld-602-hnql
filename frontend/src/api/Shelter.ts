import { mockData } from "../mocks/seedData";
import { get } from "../utils/request";
import type { Shelter } from "../types/Shelter";

const endpoint = "/api/shelter";

export async function listShelter(): Promise<Shelter[]> {
  try {
    return await get<Shelter[]>(endpoint);
  } catch {
    return [...(mockData.shelter as unknown as Shelter[])];
  }
}
