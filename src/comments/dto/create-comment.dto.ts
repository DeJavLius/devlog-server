import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  postId: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
