import { currentUser } from "./currentUser";

export interface ApiError extends Error {
  code?: string;
  status?: number;
}

/** 统一请求封装：注入用户头，非 2xx 解析后端 {code,message} 抛出。 */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": currentUser.id,
      "X-User-Role": currentUser.role,
      ...(options.headers ?? {})
    }
  });
  if (!res.ok) {
    let message = `请求失败（${res.status}）`;
    let code = "";
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
      if (body?.code) code = body.code;
    } catch {
      // 非 JSON 错误体，保留默认提示
    }
    const error: ApiError = new Error(message);
    error.code = code;
    error.status = res.status;
    throw error;
  }
  return (await res.json()) as T;
}

export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
