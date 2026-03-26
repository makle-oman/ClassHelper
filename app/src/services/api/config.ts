/**
 * API 配置常量
 */

// 开发环境用本机地址，生产环境替换为服务器地址
// 手机真机调试时需改为电脑局域网 IP（如 192.168.x.x:3000）
// Web 端开发可直接用 localhost
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api'
  : 'https://your-server.com/api';

/** 请求超时时间（毫秒） */
export const REQUEST_TIMEOUT = 15000;

/** 统一响应结构 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/** 业务成功码 */
export const SUCCESS_CODE = 200;
