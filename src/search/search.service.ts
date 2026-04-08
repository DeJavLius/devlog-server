import { Injectable, BadRequestException } from '@nestjs/common'
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
    const { title, body, category, tags, mode = 'or', page = 1, limit = 10 } = dto
    const offset = (page - 1) * limit
    const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []

    // 제공된 필드 조건만 수집
    const params: unknown[] = []
    const conditions: string[] = []
    const scoreExprs: string[] = []

    await this.prisma.$executeRawUnsafe(`SET pg_trgm.similarity_threshold = 0.15`)

    if (title) {
      params.push(title)
      const idx = params.length
      conditions.push(`(title % $${idx} OR title ILIKE '%' || $${idx} || '%')`)
      scoreExprs.push(`similarity(title, $${idx}) * 4.0`)
    }

    if (body) {
      params.push(body)
      const idx = params.length
      conditions.push(`(body % $${idx} OR body ILIKE '%' || $${idx} || '%')`)
      scoreExprs.push(`similarity(body, $${idx}) * 1.0`)
    }

    if (category) {
      params.push(category)
      const idx = params.length
      conditions.push(`(category ILIKE '%' || $${idx} || '%')`)
      scoreExprs.push(`CASE WHEN category ILIKE '%' || $${idx} || '%' THEN 2.0 ELSE 0.0 END`)
    }

    if (tagList.length > 0) {
      // 태그는 개별 완전 일치 OR 조합
      const tagConditions = tagList.map((tag) => {
        params.push(tag)
        return `$${params.length} = ANY(tags)`
      })
      conditions.push(`(${tagConditions.join(' OR ')})`)
      // 스코어: 일치 태그 수 × 2.0
      scoreExprs.push(
        `(${tagList
          .map((_, i) => {
            const pIdx = params.length - tagList.length + 1 + i
            return `CASE WHEN $${pIdx} = ANY(tags) THEN 2.0 ELSE 0.0 END`
          })
          .join(' + ')})`,
      )
    }

    if (conditions.length === 0) {
      throw new BadRequestException('검색 조건을 하나 이상 입력해주세요.')
    }

    const joiner = mode === 'and' ? ' AND ' : ' OR '
    const whereClause = conditions.join(joiner)
    const scoreClause = scoreExprs.length > 0 ? scoreExprs.join(' + ') : '0'

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
        (${scoreClause}) AS score
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
      results: rows.map((r) => ({ ...r, score: Number(r.score) })),
    }
  }
}
