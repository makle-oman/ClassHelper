/**
 * 作业模块 API
 */
import { request } from './request';

export interface HomeworkInfo {
  id: number;
  class_id: number;
  class_name: string | null;
  subject: string;
  content: string;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface HomeworkListResult {
  list: HomeworkInfo[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HomeworkDetail extends HomeworkInfo {
  records: {
    id: number;
    student_id: number;
    student_name: string | null;
    student_no: string | null;
    status: '已交' | '未交' | '迟交';
    grade: string | null;
  }[];
}

export interface HomeworkStats {
  homework_id: number;
  total: number;
  submitted: number;
  late: number;
  not_submitted: number;
  completion_rate: number;
}

/** 获取作业列表 */
export function list(class_id: number, page = 1, pageSize = 20) {
  return request<HomeworkListResult>('/homework/list', { class_id, page, pageSize });
}

/** 发布作业 */
export function create(data: {
  class_id: number;
  subject: string;
  content: string;
  deadline: string;
}) {
  return request<HomeworkInfo>('/homework/create', data);
}

/** 更新作业 */
export function update(data: {
  id: number;
  subject?: string;
  content?: string;
  deadline?: string;
}) {
  return request<HomeworkInfo>('/homework/update', data);
}

/** 删除作业 */
export function remove(id: number) {
  return request<null>('/homework/delete', { id });
}

/** 获取作业详情 */
export function detail(id: number) {
  return request<HomeworkDetail>('/homework/detail', { id });
}

/** 批量更新提交状态 */
export function recordSave(data: {
  homework_id: number;
  items: { student_id: number; status: '已交' | '未交' | '迟交'; grade?: string }[];
}) {
  return request<null>('/homework/record-save', data);
}

/** 作业完成率统计 */
export function stats(homework_id: number) {
  return request<HomeworkStats>('/homework/stats', { homework_id });
}
