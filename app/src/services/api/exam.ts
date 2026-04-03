/**
 * 考试模块 API
 */
import { request } from './request';

export interface ExamInfo {
  id: number;
  name: string;
  subject: string;
  date: string;
  full_score: number;
  class_id: number;
  teacher_id: number;
  score_count?: number;
  created_at: string;
}

export interface ExamDetail extends ExamInfo {
  students: {
    student_id: number;
    student_name: string;
    student_no: string;
    score: number | null;
  }[];
}

/** 获取考试列表 */
export function list(class_id: number) {
  return request<ExamInfo[]>('/exam/list', { class_id });
}

/** 创建考试 */
export function create(data: {
  name: string;
  subject: string;
  date: string;
  full_score?: number;
  class_id: number;
}) {
  return request<ExamInfo>('/exam/create', data);
}

/** 更新考试 */
export function update(data: {
  id: number;
  name?: string;
  subject?: string;
  date?: string;
  full_score?: number;
}) {
  return request<ExamInfo>('/exam/update', data);
}

/** 删除考试 */
export function remove(id: number) {
  return request<null>('/exam/delete', { id });
}

/** 获取考试详情 */
export function detail(id: number) {
  return request<ExamDetail>('/exam/detail', { id });
}
