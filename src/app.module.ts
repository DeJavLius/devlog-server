import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { CommentsModule } from './comments/comments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReactionsModule } from './reactions/reactions.module';
import { SearchModule } from './search/search.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CommentsModule,
    ReactionsModule,
    SearchModule,
    UserModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // 모든 라우트에 세션 미들웨어 적용 (/api/auth/** 제외는 불필요 — getSession은 무해)
    consumer.apply(AuthMiddleware).forRoutes('*path');
  }
}
