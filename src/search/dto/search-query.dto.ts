import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class SearchQueryDto {
  @IsString()
  q: string

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
