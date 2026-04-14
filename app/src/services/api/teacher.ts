/**
 * 教师模块 API
 */
import { request } from './request';
import { type TeacherInfo } from './token';

/** 获取个人信息 */
export function getProfile() {
  return request<TeacherInfo>('/teacher/profile');
}

/** 更新个人信息 */
export function updateProfile(data: Partial<Pick<TeacherInfo, 'name' | 'avatar' | 'school' | 'subject' | 'teaching_years'>>) {
  return request<TeacherInfo>('/teacher/update', data);
}

/** 修改密码 */
export function changePassword(oldPassword: string, newPassword: string) {
  return request<null>('/teacher/change-password', { oldPassword, newPassword });
}
