import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  findByPost(@Query('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(@Body() dto: CreateCommentDto, @Req() req: any) {
    // TODO: better-auth 세션 미들웨어 연동 후 req.user.id 사용
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.commentsService.create(userId, dto);
  }

  @Delete(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async remove(@Param('id') id: string, @Req() req: any) {
    // TODO: better-auth 세션 미들웨어 연동 후 req.user.id 사용
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.commentsService.remove(id, userId);
  }
}
