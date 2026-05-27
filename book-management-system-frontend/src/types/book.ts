export type BookStatus = 'available' | 'borrowed' | 'archived';

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

export type BookDraft = Omit<Book, 'id'>;

export type BookStatusFilter = BookStatus | 'all';

export type BookStats = {
  total: number;
  available: number;
  borrowed: number;
  archived: number;
};
