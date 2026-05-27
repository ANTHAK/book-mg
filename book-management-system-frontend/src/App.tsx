import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { BookEditor } from './components/books/BookEditor';
import { BookTable } from './components/books/BookTable';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { StatsGrid } from './components/stats/StatsGrid';
import { API_BASE_URL } from './config/api';
import { emptyBook, initialBooks } from './data/books';
import type { AuthMode, AuthResponse, SessionUser } from './types/auth';
import type { Book, BookDraft, BookStatusFilter } from './types/book';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [user, setUser] = useState<SessionUser | null>(null);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookStatusFilter>('all');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [draftBook, setDraftBook] = useState<BookDraft>(emptyBook);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return books.filter((book) => {
      const matchesStatus =
        statusFilter === 'all' || book.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [book.title, book.author, book.category, book.isbn, book.location]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [books, query, statusFilter]);

  const stats = useMemo(
    () => ({
      total: books.length,
      available: books.filter((book) => book.status === 'available').length,
      borrowed: books.filter((book) => book.status === 'borrowed').length,
      archived: books.filter((book) => book.status === 'archived').length,
    }),
    [books],
  );

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as AuthResponse;

      if (!response.ok) {
        const message = Array.isArray(payload.message)
          ? payload.message.join('；')
          : payload.message || '认证失败，请检查邮箱和密码';
        throw new Error(message);
      }

      if (authMode === 'register' && !payload.session) {
        setAuthMessage('注册成功。当前 Supabase 开启了邮箱确认，请验证邮箱后登录。');
        setAuthMode('login');
        return;
      }

      setUser(payload.user ?? { id: email, email });
      setAuthMessage('');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : '请求失败');
    } finally {
      setAuthLoading(false);
    }
  };

  const startCreateBook = () => {
    setEditingBook(null);
    setDraftBook(emptyBook);
  };

  const startEditBook = (book: Book) => {
    setEditingBook(book);
    setDraftBook({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      location: book.location,
      status: book.status,
      borrower: book.borrower ?? '',
      dueDate: book.dueDate ?? '',
    });
  };

  const saveBook = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingBook) {
      setBooks((currentBooks) =>
        currentBooks.map((book) =>
          book.id === editingBook.id ? { ...book, ...draftBook } : book,
        ),
      );
      setEditingBook(null);
    } else {
      setBooks((currentBooks) => [
        { id: Date.now(), ...draftBook },
        ...currentBooks,
      ]);
    }

    setDraftBook(emptyBook);
  };

  const deleteBook = (bookId: number) => {
    setBooks((currentBooks) => currentBooks.filter((book) => book.id !== bookId));
  };

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

  return (
    <main className="app-shell">
      <Sidebar onLogout={() => setUser(null)} />

      <section className="workspace">
        <Topbar user={user} onCreateBook={startCreateBook} />
        <StatsGrid stats={stats} />

        <section className="management-layout" id="books">
          <BookTable
            books={filteredBooks}
            query={query}
            statusFilter={statusFilter}
            onQueryChange={setQuery}
            onStatusFilterChange={setStatusFilter}
            onEditBook={startEditBook}
            onDeleteBook={deleteBook}
          />
          <BookEditor
            editingBook={editingBook}
            draftBook={draftBook}
            onDraftBookChange={setDraftBook}
            onCreateBook={startCreateBook}
            onSubmit={saveBook}
          />
        </section>
      </section>
    </main>
  );
}

export default App;
