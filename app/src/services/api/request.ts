/**
 * 核心请求函数
 * 统一处理：超时、Token 注入、错误码判断、网络异常
 */
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL, REQUEST_TIMEOUT, SUCCESS_CODE, type ApiResponse } from './config';
import { getToken, clearAuth } from './token';

/** 业务异常（code !== 200） */
export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** 请求配置 */
interface RequestOptions {
  /** 是否跳过 Token 注入（登录、注册接口用） */
  skipAuth?: boolean;
  /** 自定义超时（毫秒） */
  timeout?: number;
  /** 是否静默（不弹 Alert 提示） */
  silent?: boolean;
}

/**
 * 统一 POST 请求
 * @param url  接口路径，如 '/auth/login'
 * @param data 请求体
 * @param options 配置项
 * @returns data 字段的内容（已自动解包）
 */
export async function request<T = any>(
  url: string,
  data?: Record<string, any>,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, timeout = REQUEST_TIMEOUT, silent = false } = options;

  // --- 构建 Headers ---
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // --- 超时控制 ---
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

    // HTTP 状态码异常
    if (!response.ok) {
      // 401 未授权 → 清除 Token，跳转登录
      if (response.status === 401) {
        await clearAuth();
        router.replace('/(auth)/login');
        throw new ApiError(401, '登录已过期，请重新登录');
      }
      throw new ApiError(response.status, `服务器异常 (${response.status})`);
    }

    const result: ApiResponse<T> = await response.json();

    // 业务码判断
    if (result.code !== SUCCESS_CODE) {
      const error = new ApiError(result.code, result.message || '操作失败');
      if (!silent) {
        Alert.alert('提示', error.message);
      }
      throw error;
    }

    return result.data;
  } catch (err: any) {
    clearTimeout(timer);

    // 已经是 ApiError 直接抛出
    if (err instanceof ApiError) {
      throw err;
    }

    // 超时
    if (err.name === 'AbortError') {
      const msg = '请求超时，请检查网络后重试';
      if (!silent) Alert.alert('网络异常', msg);
      throw new ApiError(-1, msg);
    }

    // 网络错误（断网、DNS 等）
    const msg = '网络连接失败，请检查网络设置';
    if (!silent) Alert.alert('网络异常', msg);
    throw new ApiError(-2, msg);
  }
}
