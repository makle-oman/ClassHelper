import { router } from 'expo-router';
import {
  API_BASE_URL,
  REQUEST_TIMEOUT,
  SUCCESS_CODE,
  type ApiResponse,
} from './config';
import { clearAuth, getToken } from './token';
import { showFeedback } from '../feedback';

export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

interface RequestOptions {
  skipAuth?: boolean;
  timeout?: number;
  silent?: boolean;
}

export async function request<T = unknown>(
  url: string,
  data?: Record<string, unknown>,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, timeout = REQUEST_TIMEOUT, silent = false } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      if (response.status === 401) {
        await clearAuth();
        router.replace('/(auth)/login');

        if (!silent) {
          showFeedback({
            title: '登录已过期',
            message: '请重新登录后继续操作',
            tone: 'error',
          });
        }

        throw new ApiError(401, '登录已过期，请重新登录');
      }

      throw new ApiError(response.status, `服务器异常 (${response.status})`);
    }

    const result: ApiResponse<T> = await response.json();

    if (result.code !== SUCCESS_CODE) {
      const error = new ApiError(result.code, result.message || '操作失败');

      if (!silent) {
        showFeedback({
          title: '操作失败',
          message: error.message,
          tone: 'error',
        });
      }

      throw error;
    }

    return result.data;
  } catch (error: unknown) {
    clearTimeout(timer);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      const message = '请求超时，请检查网络后重试';

      if (!silent) {
        showFeedback({
          title: '网络异常',
          message,
          tone: 'error',
        });
      }

      throw new ApiError(-1, message);
    }

    const message = '网络连接失败，请检查网络设置';

    if (!silent) {
      showFeedback({
        title: '网络异常',
        message,
        tone: 'error',
      });
    }

    throw new ApiError(-2, message);
  }
}
