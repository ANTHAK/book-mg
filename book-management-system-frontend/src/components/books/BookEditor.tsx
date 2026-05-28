import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import type { Book, BookDraft, BookStatus } from '../../types/book';

type BookEditorProps = {
  editingBook: Book | null;
  draftBook: BookDraft;
  onDraftBookChange: (draftBook: BookDraft) => void;
  onCreateBook: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSaving?: boolean;
};

/**
 * 图书编辑表单。
 *
 * editingBook 有值时表示编辑模式，否则为新增模式。
 */
export function BookEditor({
  editingBook,
  draftBook,
  onDraftBookChange,
  onCreateBook,
  onSubmit,
  isSaving = false,
}: BookEditorProps) {
  return (
    <form className="editor-panel" onSubmit={onSubmit}>
      <div className="panel-heading">
        <h2>{editingBook ? '编辑图书' : '新增图书'}</h2>
        {editingBook && (
          <button className="text-button" type="button" onClick={onCreateBook}>
            新建
          </button>
        )}
      </div>
      <label>
        书名
        <input
          value={draftBook.title}
          onChange={(event) =>
            onDraftBookChange({ ...draftBook, title: event.target.value })
          }
          required
        />
      </label>
      <label>
        作者
        <input
          value={draftBook.author}
          onChange={(event) =>
            onDraftBookChange({ ...draftBook, author: event.target.value })
          }
          required
        />
      </label>
      <label>
        分类
        <input
          value={draftBook.category}
          onChange={(event) =>
            onDraftBookChange({ ...draftBook, category: event.target.value })
          }
          required
        />
      </label>
      <label>
        ISBN
        <input
          value={draftBook.isbn}
          onChange={(event) =>
            onDraftBookChange({ ...draftBook, isbn: event.target.value })
          }
          required
        />
      </label>
      <label>
        馆藏位置
        <input
          value={draftBook.location}
          onChange={(event) =>
            onDraftBookChange({ ...draftBook, location: event.target.value })
          }
          required
        />
      </label>
      <label>
        状态
        <select
          value={draftBook.status}
          onChange={(event) =>
            onDraftBookChange({
              ...draftBook,
              status: event.target.value as BookStatus,
            })
          }
        >
          <option value="available">可借阅</option>
          <option value="borrowed">已借出</option>
          <option value="archived">已归档</option>
        </select>
      </label>
      {draftBook.status === 'borrowed' && (
        <div className="inline-fields">
          <label>
            借阅人
            <input
              value={draftBook.borrower}
              onChange={(event) =>
                onDraftBookChange({
                  ...draftBook,
                  borrower: event.target.value,
                })
              }
              required
            />
          </label>
          <label>
            到期日
            <input
              type="date"
              value={draftBook.dueDate}
              onChange={(event) =>
                onDraftBookChange({ ...draftBook, dueDate: event.target.value })
              }
              required
            />
          </label>
        </div>
      )}
      <button className="primary-button" type="submit" disabled={isSaving}>
        <Plus size={18} aria-hidden="true" />
        {isSaving ? '保存中' : editingBook ? '保存修改' : '添加图书'}
      </button>
    </form>
  );
}
