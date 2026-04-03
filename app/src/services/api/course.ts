/**
 * 课程表模块 API
 */
import { request } from './request';

export interface CourseInfo {
  id: number;
  class_id: number;
  semester_id: number;
  weekday: number;
  period: number;
  subject: string;
  teacher_id: number;
  room: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseWithClass extends CourseInfo {
  classEntity?: {
    id: number;
    name: string;
  };
}

/** 获取课程列表 */
export function list(semester_id: number, class_id: number) {
  return request<CourseInfo[]>('/course/list', { semester_id, class_id });
}

/** 创建课程 */
export function create(data: {
  class_id: number;
  semester_id: number;
  weekday: number;
  period: number;
  subject: string;
  room?: string;
}) {
  return request<CourseInfo>('/course/create', data);
}

/** 更新课程 */
export function update(data: {
  id: number;
  weekday?: number;
  period?: number;
  subject?: string;
  room?: string;
}) {
  return request<CourseInfo>('/course/update', data);
}

/** 删除课程 */
export function remove(id: number) {
  return request<null>('/course/delete', { id });
}

/** 获取今日我的课程 */
export function myToday(semester_id?: number) {
  return request<CourseWithClass[]>('/course/my-today', semester_id ? { semester_id } : {});
}

/** 批量创建课程 */
export function batchCreate(data: {
  class_id: number;
  semester_id: number;
  items: { weekday: number; period: number; subject: string; room?: string }[];
}) {
  return request<CourseInfo[]>('/course/batch-create', data);
}
