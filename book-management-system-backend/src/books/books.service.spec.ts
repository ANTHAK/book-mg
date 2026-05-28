import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { BooksService } from './books.service';
import { BookStatus } from './dto/create-book.dto';

// 模拟 Supabase 返回的数据库记录，字段命名保持数据库的 snake_case。
const bookRecord = {
  id: 1,
  title: 'Clean Architecture',
  author: 'Robert C. Martin',
  category: '架构设计',
  isbn: '978-0134494166',
  location: 'A区-03-08',
  status: BookStatus.Borrowed,
  borrower: '李明',
  due_date: '2026-06-12',
};

// 通用数据库错误对象，单测中按需覆盖 code。
const databaseError = {
  message: 'database failed',
  details: '',
  hint: '',
  code: 'XX000',
};

describe('BooksService', () => {
  let service: BooksService;
  let supabaseServiceMock: { getClient: jest.Mock };
  let clientMock: { from: jest.Mock };

  beforeEach(async () => {
    // 每个用例都重新创建 mock，避免链式调用记录互相污染。
    clientMock = { from: jest.fn() };
    supabaseServiceMock = { getClient: jest.fn(() => clientMock) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: SupabaseService, useValue: supabaseServiceMock },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    jest.clearAllMocks();
  });

  it('lists books and maps database fields to API fields', async () => {
    // 验证列表查询会拼接筛选条件，并把 due_date 转成 dueDate。
    const builder = createListBuilder({ data: [bookRecord], error: null });
    clientMock.from.mockReturnValue(builder);

    const result = await service.findAll({
      query: 'Clean',
      status: BookStatus.Borrowed,
    });

    expect(clientMock.from).toHaveBeenCalledWith('books');
    expect(builder.eq).toHaveBeenCalledWith('status', BookStatus.Borrowed);
    expect(builder.or).toHaveBeenCalledWith(
      'title.ilike.%Clean%,author.ilike.%Clean%,category.ilike.%Clean%,isbn.ilike.%Clean%,location.ilike.%Clean%',
    );
    expect(result).toEqual([
      {
        id: 1,
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        category: '架构设计',
        isbn: '978-0134494166',
        location: 'A区-03-08',
        status: BookStatus.Borrowed,
        borrower: '李明',
        dueDate: '2026-06-12',
      },
    ]);
  });

  it('throws InternalServerErrorException when list query fails', async () => {
    // 普通数据库错误不直接暴露给客户端。
    clientMock.from.mockReturnValue(
      createListBuilder({ data: null, error: databaseError }),
    );

    await expect(service.findAll({})).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('returns one book by id', async () => {
    // 详情接口应返回单条记录，并完成字段映射。
    clientMock.from.mockReturnValue(
      createSingleBuilder({ data: bookRecord, error: null }),
    );

    const result = await service.findOne(1);

    expect(result.id).toBe(1);
    expect(result.dueDate).toBe('2026-06-12');
  });

  it('throws NotFoundException when book is missing', async () => {
    // Supabase PGRST116 表示 single 查询没有记录，应转换为 404。
    clientMock.from.mockReturnValue(
      createSingleBuilder({
        data: null,
        error: { ...databaseError, code: 'PGRST116' },
      }),
    );

    await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
  });

  it('creates a book', async () => {
    // 新增前会 trim 文本，并把 dueDate 转成数据库字段 due_date。
    const builder = createInsertBuilder({ data: bookRecord, error: null });
    clientMock.from.mockReturnValue(builder);

    const result = await service.create({
      title: ' Clean Architecture ',
      author: ' Robert C. Martin ',
      category: '架构设计',
      isbn: '978-0134494166',
      location: 'A区-03-08',
      status: BookStatus.Borrowed,
      borrower: ' 李明 ',
      dueDate: '2026-06-12',
    });

    expect(builder.insert).toHaveBeenCalledWith({
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      category: '架构设计',
      isbn: '978-0134494166',
      location: 'A区-03-08',
      status: BookStatus.Borrowed,
      borrower: '李明',
      due_date: '2026-06-12',
    });
    expect(result.id).toBe(1);
  });

  it('requires borrower and dueDate for borrowed books', async () => {
    // 已借出的图书必须带借阅人和到期日，避免产生不完整借阅记录。
    await expect(
      service.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        category: '架构设计',
        isbn: '978-0134494166',
        location: 'A区-03-08',
        status: BookStatus.Borrowed,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws ForbiddenException when database denies write permission', async () => {
    // Supabase RLS 权限错误 42501 应返回 403，便于前端展示明确提示。
    clientMock.from.mockReturnValue(
      createInsertBuilder({
        data: null,
        error: { ...databaseError, code: '42501' },
      }),
    );

    await expect(
      service.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        category: '架构设计',
        isbn: '978-0134494166',
        location: 'A区-03-08',
        status: BookStatus.Available,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates a book', async () => {
    // 修改前先读取当前记录，再合并 PATCH 字段，避免未提交字段被清空。
    const findBuilder = createSingleBuilder({ data: bookRecord, error: null });
    const updateBuilder = createUpdateBuilder({
      data: { ...bookRecord, status: BookStatus.Available, borrower: null, due_date: null },
      error: null,
    });
    clientMock.from.mockReturnValueOnce(findBuilder).mockReturnValueOnce(updateBuilder);

    const result = await service.update(1, { status: BookStatus.Available });

    expect(updateBuilder.update).toHaveBeenCalledWith({
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      category: '架构设计',
      isbn: '978-0134494166',
      location: 'A区-03-08',
      status: BookStatus.Available,
      borrower: null,
      due_date: null,
    });
    expect(result.status).toBe(BookStatus.Available);
    expect(result.borrower).toBeUndefined();
  });

  it('deletes a book after confirming it exists', async () => {
    // 删除前先确认记录存在，这样缺失记录能稳定返回 404。
    const findBuilder = createSingleBuilder({ data: bookRecord, error: null });
    const deleteBuilder = createDeleteBuilder({ error: null });
    clientMock.from.mockReturnValueOnce(findBuilder).mockReturnValueOnce(deleteBuilder);

    await expect(service.remove(1)).resolves.toBeUndefined();

    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 1);
  });
});

// 构造 Supabase 列表查询的链式 builder，并让 await builder 返回指定结果。
function createListBuilder(result: unknown) {
  const builder = {
    select: jest.fn(),
    order: jest.fn(),
    eq: jest.fn(),
    or: jest.fn(),
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  };
  builder.select.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.or.mockReturnValue(builder);
  return builder;
}

// 构造 Supabase `.single()` 查询 builder。
function createSingleBuilder(result: unknown) {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.single.mockResolvedValue(result);
  return builder;
}

// 构造 Supabase insert 链式 builder。
function createInsertBuilder(result: unknown) {
  const builder = {
    insert: jest.fn(),
    select: jest.fn(),
    single: jest.fn(),
  };
  builder.insert.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.single.mockResolvedValue(result);
  return builder;
}

// 构造 Supabase update 链式 builder。
function createUpdateBuilder(result: unknown) {
  const builder = {
    update: jest.fn(),
    eq: jest.fn(),
    select: jest.fn(),
    single: jest.fn(),
  };
  builder.update.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.single.mockResolvedValue(result);
  return builder;
}

// 构造 Supabase delete 链式 builder。
function createDeleteBuilder(result: unknown) {
  const builder = {
    delete: jest.fn(),
    eq: jest.fn(),
  };
  builder.delete.mockReturnValue(builder);
  builder.eq.mockResolvedValue(result);
  return builder;
}
