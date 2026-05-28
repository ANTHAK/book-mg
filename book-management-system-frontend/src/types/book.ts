/**
 * 图书状态枚举，与后端 DTO 和数据库 check 约束保持一致。
 */
export type BookStatus = 'available' | 'borrowed' | 'archived';

/**
 * 前端展示用图书模型。
 */
export type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn: string;
  location: string;
  status: BookStatus;
  borrower?: string;
  dueDate?: string;
};

/**
 * 表单草稿数据。
 *
 * 新增/编辑时 id 由后端或原记录提供，因此草稿里不包含 id。
 */
export type BookDraft = Omit<Book, 'id'>;

/**
 * 列表筛选状态，all 只在前端使用，不会提交给后端。
 */
export type BookStatusFilter = BookStatus | 'all';

/**
 * 统计卡片展示的数据。
 */
export type BookStats = {
  total: number;
  available: number;
  borrowed: number;
  archived: number;
};
