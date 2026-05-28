import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';

/**
 * 修改图书 DTO。
 *
 * 继承 CreateBookDto 的全部字段和校验规则，但把字段都变为可选，适配 PATCH。
 */
export class UpdateBookDto extends PartialType(CreateBookDto) {}
