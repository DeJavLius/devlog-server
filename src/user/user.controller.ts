import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

const AVATAR_MAX_BYTES = 8 * 1024 * 1024;
const AVATAR_MIME_RE = /^image\/(jpeg|png|webp|gif)$/;

function resolveAvatarDir(): string {
  const base = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
  const target = join(base, 'avatars');
  mkdirSync(target, { recursive: true });
  return target;
}

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getMe(@Req() req: any) {
    if (!req.user) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.userService.getMe(req.user.id);
  }

  @Patch('me')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    if (!req.user) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.userService.updateMe(req.user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, resolveAvatarDir()),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filename: (req: any, file, cb) => {
          const userId = req.user?.id ?? 'anon';
          const ext = extname(file.originalname).toLowerCase() || '.jpg';
          cb(null, `${userId}-${Date.now()}${ext}`);
        },
      }),
      limits: { fileSize: AVATAR_MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!AVATAR_MIME_RE.test(file.mimetype)) {
          return cb(
            new BadRequestException(
              '지원하지 않는 이미지 형식입니다. (jpeg, png, webp, gif)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!req.user) throw new UnauthorizedException('로그인이 필요합니다.');
    if (!file) throw new BadRequestException('이미지 파일이 필요합니다.');
    return this.userService.uploadAvatar(req.user.id, file.filename);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteMe(@Req() req: any) {
    if (!req.user) throw new UnauthorizedException('로그인이 필요합니다.');
    await this.userService.deleteMe(req.user.id);
    return { message: '탈퇴 처리 완료' };
  }

  @Get('me/comments')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getMyComments(@Req() req: any) {
    if (!req.user) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.userService.getMyComments(req.user.id);
  }
}
