import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

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
