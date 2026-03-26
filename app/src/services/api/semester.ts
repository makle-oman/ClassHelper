/**
 * 学期模块 API
 */
import { request } from './request';

export interface SemesterInfo {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  weeks_count: number;
  current_week: number | null;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
}

/** 获取学期列表 */
export function list() {
  return request<SemesterInfo[]>('/semester/list');
}

/** 创建学期 */
export function create(data: {
  name: string;
  start_date: string;
  end_date: string;
  weeks_count: number;
  set_as_current?: boolean;
}) {
  return request<SemesterInfo>('/semester/create', data);
}

/** 更新学期 */
export function update(data: {
  id: number;
  name?: string;
  start_date?: string;
  end_date?: string;
  weeks_count?: number;
}) {
  return request<SemesterInfo>('/semester/update', data);
}

/** 设为当前学期 */
export function setActive(id: number) {
  return request<SemesterInfo>('/semester/set-active', { id });
}

/** 归档学期 */
export function archive(id: number) {
  return request<null>('/semester/archive', { id });
}

/** 删除学期 */
export function remove(id: number) {
  return request<null>('/semester/delete', { id });
}
