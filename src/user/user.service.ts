import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

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

  async deleteMe(userId: string) {
    // Cascade: Comment, Account, Session도 함께 삭제 (onDelete: Cascade 설정)
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async getMyComments(userId: string) {
    return this.prisma.comment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, postId: true, content: true, createdAt: true },
    });
  }
}
