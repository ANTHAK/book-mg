import type { BookDraft, BookStatus } from '../types/book';

type ImportRow = Record<string, unknown>;
type RawBookDraft = Partial<Record<keyof BookDraft, string>>;

/**
 * Excel/CSV 表头映射。
 *
 * 同时支持中文表头和英文接口字段，便于用户直接手动维护模板。
 */
const headerMap: Record<string, keyof BookDraft> = {
  title: 'title',
  书名: 'title',
  图书: 'title',
  author: 'author',
  作者: 'author',
  category: 'category',
  分类: 'category',
  isbn: 'isbn',
  ISBN: 'isbn',
  location: 'location',
  馆藏位置: 'location',
  位置: 'location',
  status: 'status',
  状态: 'status',
  borrower: 'borrower',
  借阅人: 'borrower',
  dueDate: 'dueDate',
  due_date: 'dueDate',
  到期日: 'dueDate',
};

/**
 * 导入文件里的状态映射。
 *
 * 用户可以填中文状态，也可以直接填后端枚举值。
 */
const statusMap: Record<string, BookStatus> = {
  available: 'available',
  可借阅: 'available',
  可借: 'available',
  borrowed: 'borrowed',
  已借出: 'borrowed',
  借出: 'borrowed',
  archived: 'archived',
  已归档: 'archived',
  归档: 'archived',
};

/**
 * 解析导入文件。
 *
 * xlsx 体积较大，因此在用户真正点击导入时动态加载，不放进首屏 bundle。
 */
export async function parseBookImportFile(file: File): Promise<BookDraft[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('导入文件没有可读取的工作表');
  }

  const rows = XLSX.utils.sheet_to_json<ImportRow>(workbook.Sheets[firstSheetName], {
    defval: '',
  });

  const books = rows
    .map((row, index) => toBookDraft(row, index + 2))
    .filter((book): book is BookDraft => Boolean(book));

  if (books.length === 0) {
    throw new Error('导入文件没有有效图书数据');
  }

  return books;
}

/**
 * 将 Excel 的一行原始数据转换为前端新增图书 DTO。
 */
function toBookDraft(row: ImportRow, rowNumber: number): BookDraft | null {
  const book: RawBookDraft = {};

  Object.entries(row).forEach(([rawHeader, value]) => {
    const field = headerMap[rawHeader.trim()];

    if (!field) {
      return;
    }

    book[field] = normalizeCell(value);
  });

  if (!hasAnyValue(book)) {
    return null;
  }

  const status = normalizeStatus(book.status);
  if (!status) {
    throw new Error(`第 ${rowNumber} 行状态无效，请使用 available/borrowed/archived 或中文状态`);
  }

  const draft: BookDraft = {
    title: requireText(book.title, rowNumber, '书名'),
    author: requireText(book.author, rowNumber, '作者'),
    category: requireText(book.category, rowNumber, '分类'),
    isbn: requireText(book.isbn, rowNumber, 'ISBN'),
    location: requireText(book.location, rowNumber, '馆藏位置'),
    status,
    borrower: book.borrower?.trim() ?? '',
    dueDate: book.dueDate?.trim() ?? '',
  };

  if (draft.status === 'borrowed' && (!draft.borrower || !draft.dueDate)) {
    throw new Error(`第 ${rowNumber} 行已借出图书需要填写借阅人和到期日`);
  }

  return draft;
}

/**
 * 统一单元格文本：
 * - 日期转成 yyyy-mm-dd
 * - 其它类型转成去空格字符串
 */
function normalizeCell(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? '').trim();
}

/**
 * 把导入文件中的状态文本转换为系统枚举。
 *
 * 状态为空时默认当作“可借阅”。
 */
function normalizeStatus(value: string | undefined): BookStatus | null {
  const normalized = value?.trim();

  if (!normalized) {
    return 'available';
  }

  return statusMap[normalized] ?? null;
}

/**
 * 判断一行是否完全为空，空行会被忽略。
 */
function hasAnyValue(book: RawBookDraft): boolean {
  return Object.values(book).some((value) => value?.trim());
}

/**
 * 校验必填字段，错误消息携带 Excel 行号，方便用户定位。
 */
function requireText(
  value: string | undefined,
  rowNumber: number,
  label: string,
): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`第 ${rowNumber} 行缺少${label}`);
  }

  return normalized;
}
