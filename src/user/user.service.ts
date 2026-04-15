import { Injectable, NotFoundException } from '@nestjs/common';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

function avatarDir(): string {
  const base = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  return join(base, 'avatars');
}

function avatarPublicUrl(filename: string): string {
  const base = process.env.BETTER_AUTH_URL ?? '';
  return `${base}/uploads/avatars/${filename}`;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        nickname: true,
        image: true,
        createdAt: true,
        accounts: { select: { providerId: true }, take: 1 },
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const { accounts, ...rest } = user;
    return { ...rest, provider: accounts[0]?.providerId ?? null };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, name: true, email: true, nickname: true, image: true },
    });
  }

  async uploadAvatar(userId: string, filename: string) {
    // 이전 아바타 파일 정리 (userId-로 시작하는 파일 중 새 파일 외 삭제)
    try {
      const dir = avatarDir();
      for (const name of readdirSync(dir)) {
        if (name.startsWith(`${userId}-`) && name !== filename) {
          try {
            unlinkSync(join(dir, name));
          } catch {
            // 파일이 이미 없을 수 있으니 무시
          }
        }
      }
    } catch {
      // 디렉터리가 비어있거나 접근 불가한 경우 무시
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { image: avatarPublicUrl(filename) },
      select: { id: true, name: true, email: true, nickname: true, image: true },
    });
  }

  async deleteMe(userId: string) {
    // Cascade: Comment, Account, Session도 함께 삭제 (onDelete: Cascade 설정)
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async getMyComments(userId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, postId: true, content: true, createdAt: true },
    });

    const postIds = [...new Set(comments.map((c) => c.postId))];
    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true, title: true },
    });
    const postMap = Object.fromEntries(posts.map((p) => [p.id, p.title]));

    return comments.map((c) => ({ ...c, postTitle: postMap[c.postId] ?? c.postId }));
  }
}
