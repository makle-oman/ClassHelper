/**
 * 请假模块 API
 */
import { request } from './request';

export interface LeaveInfo {
  id: number;
  student_id: number;
  parent_id: number | null;
  class_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: '待审批' | '已批准' | '已拒绝';
  teacher_id: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: number;
    name: string;
    student_no: string;
  };
  parent?: {
    id: number;
    name: string;
    relationship: string;
  };
}

/** 获取请假列表 */
export function list(class_id: number, status?: string) {
  const data: Record<string, unknown> = { class_id };
  if (status) data.status = status;
  return request<LeaveInfo[]>('/leave/list', data);
}

/** 创建请假申请 */
export function create(data: {
  student_id: number;
  class_id: number;
  parent_id?: number;
  start_date: string;
  end_date: string;
  reason: string;
}) {
  return request<LeaveInfo>('/leave/create', data);
}

/** 获取请假详情 */
export function detail(id: number) {
  return request<LeaveInfo>('/leave/detail', { id });
}

/** 批准请假 */
export function approve(id: number) {
  return request<LeaveInfo>('/leave/approve', { id });
}

/** 拒绝请假 */
export function reject(id: number) {
  return request<LeaveInfo>('/leave/reject', { id });
}
