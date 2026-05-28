import { API_BASE_URL } from '../config/api';
import type { AuthMode, AuthResponse } from '../types/auth';
import type { Book, BookDraft, BookStatusFilter } from '../types/book';

type BookListParams = {
  query: string;
  status: BookStatusFilter;
};

/**
 * 前端统一请求封装：
 * - 自动拼接后端基础地址
 * - 统一 JSON 请求头
 * - 统一把后端错误转换成 Error，方便页面 message 展示
 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as { message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join('；')
      : payload.message || '请求失败';
    throw new Error(message);
  }

  return payload as T;
}

/**
 * 调用认证接口。
 *
 * authMode 决定请求 `/auth/login` 或 `/auth/register`。
 */
export function authenticate(authMode: AuthMode, email: string, password: string) {
  return requestJson<AuthResponse>(`/auth/${authMode}`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * 获取图书列表。
 *
 * 搜索词和状态筛选通过 URLSearchParams 自动编码，避免中文 query 造成请求格式问题。
 */
export function listBooks({ query, status }: BookListParams) {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.set('query', trimmedQuery);
  }

  if (status !== 'all') {
    params.set('status', status);
  }

  const search = params.toString();
  return requestJson<Book[]>(`/books${search ? `?${search}` : ''}`);
}

/**
 * 获取单本图书详情。
 */
export function getBook(bookId: number) {
  return requestJson<Book>(`/books/${bookId}`);
}

/**
 * 新增图书。
 */
export function createBook(book: BookDraft) {
  return requestJson<Book>('/books', {
    method: 'POST',
    body: JSON.stringify(book),
  });
}

/**
 * 修改图书。
 */
export function updateBook(bookId: number, book: BookDraft) {
  return requestJson<Book>(`/books/${bookId}`, {
    method: 'PATCH',
    body: JSON.stringify(book),
  });
}

/**
 * 删除图书。
 */
export function deleteBook(bookId: number) {
  return requestJson<void>(`/books/${bookId}`, { method: 'DELETE' });
}
