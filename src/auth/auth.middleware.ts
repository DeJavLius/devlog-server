import { Injectable, NestMiddleware } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async use(req: any, _res: any, next: () => void) {
    try {
      const session = await this.authService.auth.api.getSession({
        headers: new Headers(req.headers as Record<string, string>),
      });
      req.user = session?.user ?? null;
    } catch {
      req.user = null;
    }
    next();
  }
}
