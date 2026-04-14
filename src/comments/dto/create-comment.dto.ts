import { IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  postId: string;

  @IsString()
  @Length(1, 1000)
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}
