import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly auth: any;

  constructor(private prisma: PrismaService) {
    // betterAuth의 복잡한 조건부 타입 추론을 우회
    const config = {
      database: prismaAdapter(this.prisma, { provider: 'postgresql' }),
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
      trustedOrigins: [process.env.ALLOWED_ORIGIN ?? 'http://localhost:4321'],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.auth = betterAuth(config as any);
  }
}
