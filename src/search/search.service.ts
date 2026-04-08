import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SearchQueryDto } from './dto/search-query.dto'
import { SearchResponseDto } from './dto/search-result.dto'

interface RawPostRow {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  publishedAt: Date
  score: unknown
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchQueryDto): Promise<SearchResponseDto> {
    const { q, category, tags, page = 1, limit = 10 } = dto
    const offset = (page - 1) * limit
    const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []

    await this.prisma.$executeRawUnsafe(
      `SET pg_trgm.similarity_threshold = 0.15`,
    )

    const params: unknown[] = [q]
    const filters: string[] = [
      `(
        title % $1
        OR description % $1
        OR body % $1
        OR $1 = ANY(tags)
        OR title ILIKE '%' || $1 || '%'
        OR description ILIKE '%' || $1 || '%'
      )`,
    ]

    if (category) {
      params.push(category)
      filters.push(`category = $${params.length}`)
    }
    if (tagList.length > 0) {
      params.push(tagList)
      filters.push(`tags && $${params.length}::text[]`)
    }

    const whereClause = filters.join(' AND ')

    const limitIdx = params.length + 1
    const offsetIdx = params.length + 2
    params.push(limit, offset)

    const rows = await this.prisma.$queryRawUnsafe<RawPostRow[]>(
      `
      SELECT
        id,
        title,
        description,
        category,
        tags,
        "publishedAt",
        (
          similarity(title, $1)       * 4.0 +
          similarity(description, $1) * 2.0 +
          similarity(body, $1)        * 1.0 +
          CASE WHEN $1 = ANY(tags) THEN 2.0 ELSE 0.0 END
        ) AS score
      FROM posts
      WHERE ${whereClause}
      ORDER BY score DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `,
      ...params,
    )

    const countParams = params.slice(0, params.length - 2)
    const countRows = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) AS count FROM posts WHERE ${whereClause}`,
      ...countParams,
    )

    return {
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
      results: rows.map((r) => ({
        ...r,
        score: Number(r.score),
      })),
    }
  }
}
