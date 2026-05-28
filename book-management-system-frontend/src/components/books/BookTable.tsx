import {
  BookOpen,
  CheckCircle2,
  Edit3,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef } from 'react';
import { statusLabel } from '../../data/books';
import type { Book, BookStatusFilter } from '../../types/book';

type BookViewMode = 'list' | 'card';

/**
 * 图书列表面板参数。
 *
 * 组件只负责展示和触发事件，具体请求逻辑放在 App 中统一处理。
 */
type BookTableProps = {
  books: Book[];
  query: string;
  statusFilter: BookStatusFilter;
  viewMode: BookViewMode;
  onQueryChange: (query: string) => void;
  onStatusFilterChange: (statusFilter: BookStatusFilter) => void;
  onViewModeChange: (viewMode: BookViewMode) => void;
  onImportBooks: (file: File) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (bookId: number) => void;
};

/**
 * 图书列表组件。
 *
 * 支持搜索、状态筛选、列表/卡片视图切换、Excel 导入入口和行级操作。
 */
export function BookTable({
  books,
  query,
  statusFilter,
  viewMode,
  onQueryChange,
  onStatusFilterChange,
  onViewModeChange,
  onImportBooks,
  onEditBook,
  onDeleteBook,
}: BookTableProps) {
  // 文件选择框隐藏在按钮后面，点击“导入”时通过 ref 触发。
  const importInputRef = useRef<HTMLInputElement>(null);

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
        <div className="view-switch" aria-label="图书视图切换">
          <button
            className={viewMode === 'list' ? 'active' : ''}
            type="button"
            title="列表布局"
            aria-label="列表布局"
            aria-pressed={viewMode === 'list'}
            onClick={() => onViewModeChange('list')}
          >
            <List size={18} aria-hidden="true" />
          </button>
          <button
            className={viewMode === 'card' ? 'active' : ''}
            type="button"
            title="卡片布局"
            aria-label="卡片布局"
            aria-pressed={viewMode === 'card'}
            onClick={() => onViewModeChange('card')}
          >
            <LayoutGrid size={18} aria-hidden="true" />
          </button>
        </div>
        <button
          className="import-button"
          type="button"
          title="导入 Excel"
          onClick={() => importInputRef.current?.click()}
        >
          <Upload size={18} aria-hidden="true" />
          导入
        </button>
        <input
          ref={importInputRef}
          className="sr-only"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              onImportBooks(file);
            }

            event.target.value = '';
          }}
        />
      </div>

      <div className="books-scroll">
        {viewMode === 'list' ? (
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
                  <td>{renderStatus(book)}</td>
                  <td>{renderActions(book, onEditBook, onDeleteBook)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="book-card-grid">
            {books.map((book) => (
              <article className="book-card" key={book.id}>
                <div className="book-card-header">
                  <div>
                    <h3>{book.title}</h3>
                    <p>{book.author}</p>
                  </div>
                  {renderStatus(book)}
                </div>
                <dl className="book-meta">
                  <div>
                    <dt>分类</dt>
                    <dd>{book.category}</dd>
                  </div>
                  <div>
                    <dt>ISBN</dt>
                    <dd>{book.isbn}</dd>
                  </div>
                  <div>
                    <dt>馆藏位置</dt>
                    <dd>
                      <MapPin size={15} aria-hidden="true" />
                      {book.location}
                    </dd>
                  </div>
                </dl>
                <div className="book-card-actions">
                  {renderActions(book, onEditBook, onDeleteBook)}
                </div>
              </article>
            ))}
          </div>
        )}
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

/**
 * 渲染图书状态。
 *
 * 已借出状态下附带借阅人和到期日。
 */
function renderStatus(book: Book) {
  return (
    <>
      <span className={`status-pill ${book.status}`}>
        <CheckCircle2 size={14} aria-hidden="true" />
        {statusLabel[book.status]}
      </span>
      {book.borrower && (
        <small className="borrower">
          {book.borrower} · {book.dueDate}
        </small>
      )}
    </>
  );
}

/**
 * 渲染编辑/删除操作按钮。
 */
function renderActions(
  book: Book,
  onEditBook: (book: Book) => void,
  onDeleteBook: (bookId: number) => void,
) {
  return (
    <div className="row-actions">
      <button
        type="button"
        aria-label={`编辑 ${book.title}`}
        title="编辑"
        onClick={() => onEditBook(book)}
      >
        <Edit3 size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label={`删除 ${book.title}`}
        title="删除"
        onClick={() => onDeleteBook(book.id)}
      >
        <Trash2 size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
