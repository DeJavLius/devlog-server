import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'

@Injectable()
export class SearchSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchSyncService.name)
  private readonly contentPath: string

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.contentPath =
      this.config.get<string>('CONTENT_PATH') ??
      path.resolve(process.cwd(), '../devlog/src/content/blog')
  }

  async onApplicationBootstrap() {
    await this.setupSearchExtensions()
    await this.syncAll()
  }

  /** pg_trgm 확장 + GIN 인덱스 초기화 (멱등) */
  private async setupSearchExtensions() {
    try {
      await this.prisma.$executeRawUnsafe(
        `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
      )
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS posts_title_trgm_idx ON posts USING GIN (title gin_trgm_ops)`,
      )
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS posts_description_trgm_idx ON posts USING GIN (description gin_trgm_ops)`,
      )
      await this.prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS posts_body_trgm_idx ON posts USING GIN (body gin_trgm_ops)`,
      )
      this.logger.log('pg_trgm extensions and indexes ready')
    } catch (err) {
      this.logger.warn(`Failed to setup search extensions: ${err.message}`)
    }
  }

  /** 전체 마크다운 동기화 */
  async syncAll(): Promise<{ synced: number; skipped: number }> {
    if (!fs.existsSync(this.contentPath)) {
      this.logger.warn(`Content path not found: ${this.contentPath}`)
      return { synced: 0, skipped: 0 }
    }

    const files = this.collectMarkdownFiles(this.contentPath)
    let synced = 0
    let skipped = 0

    for (const file of files) {
      const changed = await this.syncFile(file)
      if (changed) synced++
      else skipped++
    }

    this.logger.log(`Sync complete — synced: ${synced}, skipped: ${skipped}`)
    return { synced, skipped }
  }

  /** 단일 파일 동기화. 변경된 경우 true 반환 */
  private async syncFile(filePath: string): Promise<boolean> {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data: fm, content: body } = matter(raw)

    if (fm.draft === true) return false

    const slug = this.filePathToSlug(filePath)
    const publishedAt: Date = fm.date ? new Date(fm.date) : new Date(0)
    const fileMtime = fs.statSync(filePath).mtime

    const existing = await this.prisma.post.findUnique({ where: { id: slug } })
    if (existing && existing.updatedAt >= fileMtime) return false

    const plainBody = this.stripMarkdown(body)

    await this.prisma.post.upsert({
      where: { id: slug },
      create: {
        id: slug,
        title: fm.title ?? '',
        description: fm.description ?? '',
        body: plainBody,
        category: fm.category ?? '',
        tags: fm.tags ?? [],
        series: fm.series ?? null,
        publishedAt,
      },
      update: {
        title: fm.title ?? '',
        description: fm.description ?? '',
        body: plainBody,
        category: fm.category ?? '',
        tags: fm.tags ?? [],
        series: fm.series ?? null,
        publishedAt,
      },
    })

    return true
  }

  /** contentPath 기준 상대 slug 생성 */
  private filePathToSlug(filePath: string): string {
    const rel = path.relative(this.contentPath, filePath)
    return rel
      .replace(/\\/g, '/')
      .replace(/\/(index)?\.(md|mdx)$/, '')
      .replace(/\.(md|mdx)$/, '')
  }

  /** 디렉토리 재귀 탐색 */
  private collectMarkdownFiles(dir: string): string[] {
    const results: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...this.collectMarkdownFiles(full))
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        results.push(full)
      }
    }
    return results
  }

  /** 마크다운 → 순수 텍스트 변환 */
  private stripMarkdown(md: string): string {
    return md
      .replace(/```[\s\S]*?```/g, '') // fenced code blocks
      .replace(/`[^`\n]+`/g, '') // inline code
      .replace(/^#{1,6}\s+/gm, '') // headings
      .replace(/\*\*([^*\n]+)\*\*/g, '$1') // bold
      .replace(/\*([^*\n]+)\*/g, '$1') // italic
      .replace(/~~([^~\n]+)~~/g, '$1') // strikethrough
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links
      .replace(/^[\s]*[-*+]\s+/gm, '') // unordered list
      .replace(/^\s*\d+\.\s+/gm, '') // ordered list
      .replace(/^>\s+/gm, '') // blockquotes
      .replace(/^[-*_]{3,}\s*$/gm, '') // horizontal rules
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
}
