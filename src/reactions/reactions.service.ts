import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReactionDto } from './dto/reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async findByPost(postId: string, userId?: string) {
    const grouped = await this.prisma.reaction.groupBy({
      by: ['emoji'],
      where: { postId },
      _count: { emoji: true },
    });

    const myEmojiSet = new Set<string>();
    if (userId) {
      const mine = await this.prisma.reaction.findMany({
        where: { postId, userId },
        select: { emoji: true },
      });
      mine.forEach((r) => myEmojiSet.add(r.emoji));
    }

    return grouped.map((r) => ({
      emoji: r.emoji,
      count: r._count.emoji,
      reacted: myEmojiSet.has(r.emoji),
    }));
  }

  async add(userId: string, dto: ReactionDto) {
    await this.prisma.reaction.create({
      data: { postId: dto.postId, userId, emoji: dto.emoji },
    });
    return { action: 'added' as const };
  }

  async remove(userId: string, dto: ReactionDto) {
    await this.prisma.reaction.delete({
      where: {
        postId_userId_emoji: {
          postId: dto.postId,
          userId,
          emoji: dto.emoji,
        },
      },
    });
    return { action: 'removed' as const };
  }
}
