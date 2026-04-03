/**
 * 通知模块 API
 */
import { request } from './request';

export interface NoticeInfo {
  id: number;
  title: string;
  content: string;
  type: '普通通知' | '放假通知' | '活动通知' | '紧急通知';
  class_id: number;
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

export interface NoticeDetail extends NoticeInfo {
  read_count: number;
  total_parents: number;
  unread_count: number;
}

/** 获取通知列表 */
export function list(class_id?: number) {
  return request<NoticeInfo[]>('/notice/list', class_id ? { class_id } : {});
}

/** 发布通知 */
export function create(data: {
  title: string;
  content: string;
  type?: string;
  class_id: number;
}) {
  return request<NoticeInfo>('/notice/create', data);
}

/** 更新通知 */
export function update(data: {
  id: number;
  title?: string;
  content?: string;
  type?: string;
}) {
  return request<NoticeInfo>('/notice/update', data);
}

/** 删除通知 */
export function remove(id: number) {
  return request<null>('/notice/delete', { id });
}

/** 获取通知详情 */
export function detail(id: number) {
  return request<NoticeDetail>('/notice/detail', { id });
}
