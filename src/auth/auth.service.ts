import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly auth: any;

  constructor(private prisma: PrismaService) {
    const isProd = process.env.NODE_ENV === 'production';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      baseURL:
        process.env.BETTER_AUTH_URL ??
        `http://localhost:${process.env.PORT ?? 3000}`,
      database: prismaAdapter(this.prisma, { provider: 'postgresql' }),
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
        // Kakao: clientSecret 불필요 (REST API 키만 사용)
        kakao: {
          clientId: process.env.KAKAO_CLIENT_ID!,
          clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
        },
        naver: {
          clientId: process.env.NAVER_CLIENT_ID!,
          clientSecret: process.env.NAVER_CLIENT_SECRET!,
        },
      },
      advanced: {
        // 프로덕션 환경에서 dejavlog.com ↔ api.dejavlog.com 세션 쿠키 공유
        crossSubDomainCookies: {
          enabled: isProd,
          domain: '.dejavlog.com',
        },
      },
      trustedOrigins: [process.env.ALLOWED_ORIGIN ?? 'http://localhost:1234'],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.auth = betterAuth(config as any);
  }
}
