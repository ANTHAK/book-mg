import { BookOpen, CheckCircle2, Edit3, Filter, Search, Trash2 } from 'lucide-react';
import { statusLabel } from '../../data/books';
import type { Book, BookStatusFilter } from '../../types/book';

type BookTableProps = {
  books: Book[];
  query: string;
  statusFilter: BookStatusFilter;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (statusFilter: BookStatusFilter) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (bookId: number) => void;
};

export function BookTable({
  books,
  query,
  statusFilter,
  onQueryChange,
  onStatusFilterChange,
  onEditBook,
  onDeleteBook,
}: BookTableProps) {
  return (
    <div className="book-panel">
      <div className="toolbar">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="搜索书名、作者、分类、ISBN"
          />
        </label>
        <label className="filter-field">
          <Filter size={18} aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as BookStatusFilter)
            }
          >
            <option value="all">全部状态</option>
            <option value="available">可借阅</option>
            <option value="borrowed">已借出</option>
            <option value="archived">已归档</option>
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>图书</th>
              <th>分类</th>
              <th>位置</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                  <small>{book.isbn}</small>
                </td>
                <td>{book.category}</td>
                <td>{book.location}</td>
                <td>
                  <span className={`status-pill ${book.status}`}>
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {statusLabel[book.status]}
                  </span>
                  {book.borrower && (
                    <small className="borrower">
                      {book.borrower} · {book.dueDate}
                    </small>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      aria-label={`编辑 ${book.title}`}
                      onClick={() => onEditBook(book)}
                    >
                      <Edit3 size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`删除 ${book.title}`}
                      onClick={() => onDeleteBook(book.id)}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {books.length === 0 && (
          <div className="empty-state">
            <BookOpen size={26} aria-hidden="true" />
            <span>没有找到匹配的图书</span>
          </div>
        )}
      </div>
    </div>
  );
}
