import type { Book, BookDraft, BookStatus } from '../types/book';

/**
 * 早期本地演示数据。
 *
 * 当前列表已改为接口加载，这份数据保留作开发参考或离线 fallback 扩展。
 */
export const initialBooks: Book[] = [
  {
    id: 1,
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt, David Thomas',
    category: '软件工程',
    isbn: '978-0201616224',
    location: 'A区-02-15',
    status: 'available',
  },
  {
    id: 2,
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    category: '架构设计',
    isbn: '978-0134494166',
    location: 'A区-03-08',
    status: 'borrowed',
    borrower: '李明',
    dueDate: '2026-06-12',
  },
  {
    id: 3,
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: '数据库',
    isbn: '978-1449373320',
    location: 'B区-01-06',
    status: 'available',
  },
  {
    id: 4,
    title: 'Refactoring',
    author: 'Martin Fowler',
    category: '代码质量',
    isbn: '978-0134757599',
    location: 'C区-05-12',
    status: 'archived',
  },
];

/**
 * 新增图书表单的默认空值。
 */
export const emptyBook: BookDraft = {
  title: '',
  author: '',
  category: '',
  isbn: '',
  location: '',
  status: 'available',
  borrower: '',
  dueDate: '',
};

/**
 * 图书状态中文文案。
 */
export const statusLabel: Record<BookStatus, string> = {
  available: '可借阅',
  borrowed: '已借出',
  archived: '已归档',
};
