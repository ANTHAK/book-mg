import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { ListBooksQueryDto } from './dto/list-books-query.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * 图书 HTTP 控制器。
 *
 * 这里只处理路由、参数解析和 Swagger 文档，具体业务逻辑交给 BooksService。
 */
@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  /**
   * 图书列表接口。
   *
   * 支持 query 模糊搜索和 status 状态筛选。
   */
  @Get()
  @ApiOperation({ summary: 'List books' })
  @ApiOkResponse({ description: 'Books returned successfully.' })
  findAll(@Query() queryDto: ListBooksQueryDto) {
    return this.booksService.findAll(queryDto);
  }

  /**
   * 图书详情接口。
   *
   * ParseIntPipe 会把非法 id 转成 400。
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get book detail' })
  @ApiOkResponse({ description: 'Book returned successfully.' })
  @ApiNotFoundResponse({ description: 'Book not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  /**
   * 新增图书接口。
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a book' })
  @ApiCreatedResponse({ description: 'Book created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid book payload.' })
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  /**
   * 修改图书接口。
   *
   * 使用 PATCH 允许前端只提交发生变化的字段。
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a book' })
  @ApiOkResponse({ description: 'Book updated successfully.' })
  @ApiNotFoundResponse({ description: 'Book not found.' })
  @ApiBadRequestResponse({ description: 'Invalid book payload.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(id, updateBookDto);
  }

  /**
   * 删除图书接口。
   *
   * 成功删除时返回 204 No Content。
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a book' })
  @ApiNoContentResponse({ description: 'Book deleted successfully.' })
  @ApiNotFoundResponse({ description: 'Book not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
