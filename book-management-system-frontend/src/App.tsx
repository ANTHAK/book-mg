import type { FormEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { BookEditor } from './components/books/BookEditor';
import { BookTable } from './components/books/BookTable';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { StatsGrid } from './components/stats/StatsGrid';
import { emptyBook } from './data/books';
import {
  authenticate,
  createBook,
  deleteBook as removeBook,
  getBook,
  listBooks,
  updateBook,
} from './services/api';
import { parseBookImportFile } from './services/bookImport';
import type { AuthMode, SessionUser } from './types/auth';
import type { Book, BookDraft, BookStatusFilter } from './types/book';

const AUTH_STORAGE_KEY = 'book-management-auth';

/**
 * localStorage 中保存的登录态。
 *
 * 只保存用户信息和 token，不保存密码。
 */
type StoredAuth = {
  user: SessionUser;
  accessToken?: string;
};

type BookViewMode = 'list' | 'card';
type MessageType = 'success' | 'error';

/**
 * 从 localStorage 恢复登录态。
 *
 * 如果本地数据损坏，会自动清理，避免页面一直卡在异常状态。
 */
function getStoredAuth(): StoredAuth | null {
  const rawAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawAuth) {
    return null;
  }

  try {
    const parsedAuth = JSON.parse(rawAuth) as StoredAuth;
    return parsedAuth.user?.id ? parsedAuth : null;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

/**
 * 写入登录态。
 */
function storeAuth(auth: StoredAuth) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

/**
 * 清除登录态。
 */
function clearStoredAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * 图书管理页的浮层消息。
 *
 * loading 用状态提示，错误/成功用 alert 风格消息，不占用页面布局空间。
 */
function BookMessage({
  isLoading,
  message,
  type,
}: {
  isLoading: boolean;
  message: string;
  type: MessageType;
}) {
  if (!isLoading && !message) {
    return null;
  }

  return (
    <div
      className={`app-message ${isLoading ? 'loading' : type}`}
      role={isLoading ? 'status' : 'alert'}
    >
      {isLoading ? (
        <Loader2 size={18} aria-hidden="true" />
      ) : (
        <AlertCircle size={18} aria-hidden="true" />
      )}
      <span>{isLoading ? '图书列表加载中' : message}</span>
    </div>
  );
}

function App() {
  // 认证表单状态。
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  // 用户状态会尝试从本地存储恢复，用于刷新后保持登录。
  const [user, setUser] = useState<SessionUser | null>(
    () => getStoredAuth()?.user ?? null,
  );

  // 图书列表、异步状态和页面消息。
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [bookSaving, setBookSaving] = useState(false);
  const [bookMessage, setBookMessage] = useState('');
  const [bookMessageType, setBookMessageType] = useState<MessageType>('error');

  // 列表查询条件和视图模式。
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatusFilter>('all');
  const [bookViewMode, setBookViewMode] = useState<BookViewMode>('list');

  // 右侧编辑表单状态。
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [draftBook, setDraftBook] = useState<BookDraft>(emptyBook);

  /**
   * 统计卡片数据。
   *
   * 直接基于当前列表计算，筛选后统计也会跟着当前视图变化。
   */
  const stats = useMemo(
    () => ({
      total: books.length,
      available: books.filter((book) => book.status === 'available').length,
      borrowed: books.filter((book) => book.status === 'borrowed').length,
      archived: books.filter((book) => book.status === 'archived').length,
    }),
    [books],
  );

  /**
   * 加载图书列表。
   *
   * query/statusFilter 变化时会重新生成函数，并由下面的 effect 触发请求。
   */
  const loadBooks = useCallback(async () => {
    setBooksLoading(true);
    setBookMessage('');

    try {
      const nextBooks = await listBooks({ query, status: statusFilter });
      setBooks(nextBooks);
    } catch (error) {
      setBookMessageType('error');
      setBookMessage(error instanceof Error ? error.message : '图书列表加载失败');
    } finally {
      setBooksLoading(false);
    }
  }, [query, statusFilter]);

  /**
   * 登录后加载图书列表。
   *
   * 这里加 250ms 防抖，避免用户连续输入搜索时频繁请求后端。
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadBooks();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadBooks, user]);

  /**
   * 非 loading 消息自动消失，保持页面干净。
   */
  useEffect(() => {
    if (!bookMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBookMessage('');
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [bookMessage]);

  /**
   * 登录/注册提交。
   *
   * 登录成功后持久化用户信息，实现刷新后保持登录。
   */
  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');

    try {
      const payload = await authenticate(authMode, email, password);

      if (authMode === 'register' && !payload.session) {
        setAuthMessage('注册成功。当前 Supabase 开启了邮箱确认，请验证邮箱后登录。');
        setAuthMode('login');
        return;
      }

      const nextUser = payload.user ?? { id: email, email };

      setUser(nextUser);
      storeAuth({
        user: nextUser,
        accessToken: payload.session?.access_token,
      });
      setAuthMessage('');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : '请求失败');
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * 切换到新增图书模式。
   */
  const startCreateBook = () => {
    setEditingBook(null);
    setDraftBook(emptyBook);
  };

  /**
   * 进入编辑模式。
   *
   * 点击列表里的编辑按钮时先拉取详情，确保表单使用后端最新数据。
   */
  const startEditBook = async (book: Book) => {
    setBookMessage('');

    try {
      const detail = await getBook(book.id);
      setEditingBook(detail);
      setDraftBook({
        title: detail.title,
        author: detail.author,
        category: detail.category,
        isbn: detail.isbn,
        location: detail.location,
        status: detail.status,
        borrower: detail.borrower ?? '',
        dueDate: detail.dueDate ?? '',
      });
    } catch (error) {
      setBookMessageType('error');
      setBookMessage(error instanceof Error ? error.message : '图书详情加载失败');
    }
  };

  /**
   * 保存图书表单。
   *
   * 有 editingBook 时走修改，否则走新增。
   */
  const saveBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookSaving(true);
    setBookMessage('');

    try {
      if (editingBook) {
        const updatedBook = await updateBook(editingBook.id, draftBook);
        setBooks((currentBooks) =>
          currentBooks.map((book) =>
            book.id === editingBook.id ? updatedBook : book,
          ),
        );
        setEditingBook(null);
      } else {
        const createdBook = await createBook(draftBook);
        setBooks((currentBooks) => [createdBook, ...currentBooks]);
      }

      setDraftBook(emptyBook);
      setBookMessageType('success');
      setBookMessage(editingBook ? '图书修改成功' : '图书新增成功');
    } catch (error) {
      setBookMessageType('error');
      setBookMessage(error instanceof Error ? error.message : '图书保存失败');
    } finally {
      setBookSaving(false);
    }
  };

  /**
   * 删除图书。
   */
  const handleDeleteBook = async (bookId: number) => {
    setBookMessage('');

    try {
      await removeBook(bookId);
      setBooks((currentBooks) =>
        currentBooks.filter((book) => book.id !== bookId),
      );
      setBookMessageType('success');
      setBookMessage('图书删除成功');
    } catch (error) {
      setBookMessageType('error');
      setBookMessage(error instanceof Error ? error.message : '图书删除失败');
    }
  };

  /**
   * 导入 Excel/CSV 图书。
   *
   * 解析成功后逐条调用新增接口，最后刷新列表并显示导入数量。
   */
  const handleImportBooks = async (file: File) => {
    setBooksLoading(true);
    setBookMessage('');

    try {
      const importedBooks = await parseBookImportFile(file);

      for (const book of importedBooks) {
        await createBook(book);
      }

      await loadBooks();
      setBookMessageType('success');
      setBookMessage(`导入成功：${importedBooks.length} 本图书`);
    } catch (error) {
      setBookMessageType('error');
      setBookMessage(error instanceof Error ? error.message : '图书导入失败');
    } finally {
      setBooksLoading(false);
    }
  };

  /**
   * 退出登录。
   *
   * 清理本地登录态和页面内存状态。
   */
  const handleLogout = () => {
    clearStoredAuth();
    setUser(null);
    setBooks([]);
    setEditingBook(null);
    setDraftBook(emptyBook);
    setBookMessage('');
  };

  // 未登录时只展示认证页。
  if (!user) {
    return (
      <AuthPage
        authMode={authMode}
        email={email}
        password={password}
        authLoading={authLoading}
        authMessage={authMessage}
        onAuthModeChange={setAuthMode}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleAuth}
      />
    );
  }

  // 登录后展示图书管理工作台。
  return (
    <main className="app-shell">
      <Sidebar onLogout={handleLogout} />

      <section className="workspace">
        <BookMessage
          isLoading={booksLoading}
          message={bookMessage}
          type={bookMessageType}
        />
        <Topbar user={user} onCreateBook={startCreateBook} />
        <StatsGrid stats={stats} />

        <section className="management-layout" id="books">
          <BookTable
            books={books}
            query={query}
            statusFilter={statusFilter}
            viewMode={bookViewMode}
            onQueryChange={setQuery}
            onStatusFilterChange={setStatusFilter}
            onViewModeChange={setBookViewMode}
            onImportBooks={handleImportBooks}
            onEditBook={startEditBook}
            onDeleteBook={handleDeleteBook}
          />
          <BookEditor
            editingBook={editingBook}
            draftBook={draftBook}
            onDraftBookChange={setDraftBook}
            onCreateBook={startCreateBook}
            onSubmit={saveBook}
            isSaving={bookSaving}
          />
        </section>
      </section>
    </main>
  );
}

export default App;
