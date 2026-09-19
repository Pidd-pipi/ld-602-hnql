import { mockData } from "../mocks/seedData";
import { get } from "../utils/request";
import type { ReleaseRecord } from "../types/ReleaseRecord";

const endpoint = "/api/release-record";

export async function listRecentReleases(warehouseId?: number, limit = 10): Promise<ReleaseRecord[]> {
  const params = new URLSearchParams();
  if (warehouseId) params.set("warehouseId", String(warehouseId));
  params.set("limit", String(limit));
  try {
    return await get<ReleaseRecord[]>(`${endpoint}/recent?${params.toString()}`);
  } catch {
    return [...(mockData.releaseRecord as unknown as ReleaseRecord[])];
  }
}
