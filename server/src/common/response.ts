export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export function success<T = null>(data: T = null as T, message = '操作成功'): ApiResponse<T> {
  return { code: 200, message, data };
}

export function fail(message = '操作失败', code = 0): ApiResponse {
  return { code, message, data: null };
}
