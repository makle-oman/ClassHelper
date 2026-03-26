/**
 * 学生模块 API
 */
import { request } from './request';

export interface StudentInfo {
  id: number;
  student_no: string;
  name: string;
  gender: '男' | '女';
  birth_date: string | null;
  class_id: number;
  parent_name: string | null;
  parent_phone: string | null;
  created_at: string;
}

/** 获取班级学生列表 */
export function list(class_id: number) {
  return request<StudentInfo[]>('/student/list', { class_id });
}

/** 添加学生 */
export function create(data: {
  class_id: number;
  name: string;
  student_no: string;
  gender: '男' | '女';
  parent_name?: string;
  parent_phone?: string;
}) {
  return request<StudentInfo>('/student/create', data);
}

/** 更新学生 */
export function update(data: {
  id: number;
  name?: string;
  student_no?: string;
  gender?: '男' | '女';
  parent_name?: string;
  parent_phone?: string;
}) {
  return request<StudentInfo>('/student/update', data);
}

/** 删除学生 */
export function remove(id: number) {
  return request<null>('/student/delete', { id });
}
