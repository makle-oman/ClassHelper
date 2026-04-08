/**
 * 认证模块 API
 */
import { request } from './request';
import { type TeacherInfo } from './token';

/** 登录响应 */
interface LoginResult {
  token: string;
  teacher: TeacherInfo;
}

/** 注册响应 */
interface RegisterResult {
  token: string;
  teacher: TeacherInfo;
}

/** 教师登录 */
export function login(phone: string, password: string) {
  return request<LoginResult>('/auth/login', { phone, password }, { skipAuth: true });
}

/** 教师注册 */
export function register(phone: string, password: string, name: string, subject?: string) {
  return request<RegisterResult>('/auth/register', { phone, password, name, subject }, { skipAuth: true });
}
