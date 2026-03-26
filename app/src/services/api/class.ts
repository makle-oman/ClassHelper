/**
 * 班级模块 API
 */
import { request } from './request';

export interface ClassInfo {
  id: number;
  grade: string;
  grade_number: number;
  class_number: number;
  name: string;
  student_count: number;
  is_archived: boolean;
  created_at: string;
}

/** 获取班级列表 */
export function list() {
  return request<ClassInfo[]>('/class/list');
}

/** 创建班级 */
export function create(grade_number: number, class_number: number) {
  return request<ClassInfo>('/class/create', { grade_number, class_number });
}

/** 更新班级 */
export function update(id: number, data: { grade_number?: number; class_number?: number }) {
  return request<ClassInfo>('/class/update', { id, ...data });
}

/** 删除班级 */
export function remove(id: number) {
  return request<null>('/class/delete', { id });
}
