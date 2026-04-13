import { All, Controller, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

// better-auth 핸들러: /api/auth/** 요청을 전부 위임
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @All('*splat')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleAuth(@Req() req: any, @Res() res: any) {
    const baseURL =
      process.env.BETTER_AUTH_URL ??
      `http://localhost:${process.env.PORT ?? 3000}`;
    const response = await this.authService.auth.handler(
      new globalThis.Request(`${baseURL}${req.url}`, {
        method: req.method,
        headers: req.headers as HeadersInit,
        body:
          req.method !== 'GET' && req.method !== 'HEAD'
            ? JSON.stringify(req.body)
            : undefined,
      }),
    );

    res.status(response.status);
    response.headers.forEach((value: string, key: string) =>
      res.setHeader(key, value),
    );
    const body = await response.text();
    res.send(body);
  }
}
