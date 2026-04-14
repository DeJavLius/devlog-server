import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionDto } from './dto/reaction.dto';

@Controller('reactions')
export class ReactionsController {
  constructor(private reactionsService: ReactionsService) {}

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findByPost(@Query('postId') postId: string, @Req() req: any) {
    const userId: string | undefined = req.user?.id;
    return this.reactionsService.findByPost(postId, userId);
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(@Body() dto: ReactionDto, @Req() req: any) {
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.reactionsService.add(userId, dto);
  }

  @Delete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remove(@Body() dto: ReactionDto, @Req() req: any) {
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
    return this.reactionsService.remove(userId, dto);
  }
}
