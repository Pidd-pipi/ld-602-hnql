import { mockData } from "../mocks/seedData";
import { get, post } from "../utils/request";
import type { DispatchOrder } from "../types/DispatchOrder";

const endpoint = "/api/dispatch-order";

export interface DispatchLineForm {
  batchId: number;
  quantity: number;
}

export interface DispatchCreateForm {
  sourceWarehouseId: number;
  shelterId: number;
  priority: string;
  lines: DispatchLineForm[];
}

export async function listDispatchOrder(): Promise<DispatchOrder[]> {
  try {
    return await get<DispatchOrder[]>(endpoint);
  } catch {
    return [...(mockData.dispatchOrder as unknown as DispatchOrder[])];
  }
}

export function createDispatchOrder(payload: DispatchCreateForm): Promise<DispatchOrder> {
  return post<DispatchOrder>(endpoint, payload);
}

export function approveDispatchOrder(id: number, reason: string): Promise<DispatchOrder> {
  return post<DispatchOrder>(`${endpoint}/${id}/approve`, { reason });
}

export function rejectDispatchOrder(id: number, reason: string): Promise<DispatchOrder> {
  return post<DispatchOrder>(`${endpoint}/${id}/reject`, { reason });
}
