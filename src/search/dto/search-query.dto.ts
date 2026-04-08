import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  body?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  tags?: string // comma-separated

  @IsOptional()
  @IsIn(['or', 'and'])
  mode?: 'or' | 'and' = 'or'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10
}
