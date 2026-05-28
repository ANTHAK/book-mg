import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { BookStatus, CreateBookDto } from './dto/create-book.dto';
import { ListBooksQueryDto } from './dto/list-books-query.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * Supabase `books` 表的数据库字段结构。
 *
 * 数据库使用 snake_case，服务层会转换成前端友好的 camelCase。
 */
type BookRecord = {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn: string;
  location: string;
  status: BookStatus;
  borrower: string | null;
  due_date: string | null;
};

/**
 * API 返回给前端的图书结构。
 */
export type BookResponse = {
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

/**
 * 图书业务服务。
 *
 * 负责访问 Supabase、字段格式转换和数据库错误映射。
 */
@Injectable()
export class BooksService {
  private readonly tableName = 'books';

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 图书列表：
   * - 支持按状态筛选
   * - 支持对书名、作者、分类、ISBN、馆藏位置做模糊搜索
   */
  async findAll(queryDto: ListBooksQueryDto): Promise<BookResponse[]> {
    let request = this.supabaseService
      .getClient()
      .from(this.tableName)
      .select('*')
      .order('id', { ascending: false });

    if (queryDto.status) {
      request = request.eq('status', queryDto.status);
    }

    const search = queryDto.query?.trim();
    if (search) {
      const pattern = `%${this.escapeLikePattern(search)}%`;
      request = request.or(
        [
          `title.ilike.${pattern}`,
          `author.ilike.${pattern}`,
          `category.ilike.${pattern}`,
          `isbn.ilike.${pattern}`,
          `location.ilike.${pattern}`,
        ].join(','),
      );
    }

    const { data, error } = await request;
    this.throwIfDatabaseError(error);

    return (data ?? []).map((book) => this.toResponse(book as BookRecord));
  }

  /**
   * 图书详情。
   *
   * Supabase `.single()` 查不到数据时会返回 PGRST116，这里转换为 404。
   */
  async findOne(id: number): Promise<BookResponse> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (this.isMissingRow(error)) {
      throw new NotFoundException(`Book #${id} not found`);
    }
    this.throwIfDatabaseError(error);

    return this.toResponse(data as BookRecord);
  }

  /**
   * 新增图书。
   *
   * 入库前会统一清理空白字符，并把前端驼峰字段转换为数据库下划线字段。
   */
  async create(createBookDto: CreateBookDto): Promise<BookResponse> {
    const payload = this.toRecord(createBookDto);
    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .insert(payload)
      .select('*')
      .single();

    this.throwIfDatabaseError(error);

    return this.toResponse(data as BookRecord);
  }

  /**
   * 修改图书。
   *
   * 先读取当前记录，再和传入字段合并，保证 PATCH 只传部分字段时不会覆盖其它字段。
   */
  async update(
    id: number,
    updateBookDto: UpdateBookDto,
  ): Promise<BookResponse> {
    const current = await this.findOne(id);
    const payload = this.toRecord({ ...current, ...updateBookDto });

    const { data, error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    this.throwIfDatabaseError(error);

    return this.toResponse(data as BookRecord);
  }

  /**
   * 删除图书。
   *
   * 删除前先确认记录存在，这样可以稳定地向客户端返回 404。
   */
  async remove(id: number): Promise<void> {
    await this.findOne(id);

    const { error } = await this.supabaseService
      .getClient()
      .from(this.tableName)
      .delete()
      .eq('id', id);

    this.throwIfDatabaseError(error);
  }

  /**
   * 将 API 入参转换为 Supabase `books` 表字段。
   */
  private toRecord(book: CreateBookDto): Omit<BookRecord, 'id'> {
    if (book.status === BookStatus.Borrowed && (!book.borrower || !book.dueDate)) {
      throw new BadRequestException('Borrowed books require borrower and dueDate');
    }

    return {
      title: book.title.trim(),
      author: book.author.trim(),
      category: book.category.trim(),
      isbn: book.isbn.trim(),
      location: book.location.trim(),
      status: book.status,
      borrower:
        book.status === BookStatus.Borrowed ? book.borrower?.trim() || null : null,
      due_date:
        book.status === BookStatus.Borrowed ? book.dueDate?.trim() || null : null,
    };
  }

  /**
   * 将 Supabase 返回的数据库记录转换为前端使用的字段格式。
   */
  private toResponse(record: BookRecord): BookResponse {
    return {
      id: record.id,
      title: record.title,
      author: record.author,
      category: record.category,
      isbn: record.isbn,
      location: record.location,
      status: record.status,
      borrower: record.borrower ?? undefined,
      dueDate: record.due_date ?? undefined,
    };
  }

  /**
   * 隐藏数据库内部错误，仅向接口调用方暴露稳定、可理解的异常。
   */
  private throwIfDatabaseError(error: PostgrestError | null): void {
    if (!error) {
      return;
    }

    if (error.code === '23505') {
      throw new BadRequestException('Book ISBN already exists');
    }

    if (error.code === '42501') {
      throw new ForbiddenException('Book database permission denied');
    }

    throw new InternalServerErrorException('Book database request failed');
  }

  /**
   * 判断 Supabase `.single()` 是否因为查不到记录而失败。
   */
  private isMissingRow(error: PostgrestError | null): boolean {
    return error?.code === 'PGRST116';
  }

  /**
   * 转义 Supabase ilike 查询里的通配符，避免用户输入 `%`、`_` 改变搜索语义。
   */
  private escapeLikePattern(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  }
}
