/**
 * API 统一导出
 *
 * 使用示例：
 *   import { authApi, teacherApi } from '@/src/services/api';
 *
 *   // 登录
 *   const { token, teacher } = await authApi.login('13800138000', '123456');
 *
 *   // 获取个人信息
 *   const profile = await teacherApi.getProfile();
 */

// 模块 API
export * as authApi from './auth';
export * as teacherApi from './teacher';
export * as classApi from './class';
export * as semesterApi from './semester';
export * as studentApi from './student';

// 核心工具（页面可能直接需要）
export { request, ApiError } from './request';
export { saveAuth, getToken, getTeacher, clearAuth, type TeacherInfo } from './token';
export { API_BASE_URL, type ApiResponse } from './config';
