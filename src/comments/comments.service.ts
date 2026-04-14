import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /** HTML 태그 및 script/style 내용 제거 (XSS 방지) */
  private stripHtml(text: string): string {
    return text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  async findByPost(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateCommentDto) {
    const content = this.stripHtml(dto.content);
    if (!content) throw new BadRequestException('내용을 입력해주세요.');

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { parentId: true },
      });
      if (!parent) throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
      if (parent.parentId !== null)
        throw new BadRequestException('대댓글에는 답글을 달 수 없습니다.');
    }

    return this.prisma.comment.create({
      data: { postId: dto.postId, content, userId, parentId: dto.parentId },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.userId !== userId)
      throw new NotFoundException('권한이 없습니다.');
    return this.prisma.comment.delete({ where: { id } });
  }
}
