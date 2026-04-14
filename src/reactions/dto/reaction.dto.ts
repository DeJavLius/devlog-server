import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🚀'] as const;
export type AllowedEmoji = (typeof ALLOWED_EMOJIS)[number];

export class ReactionDto {
  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsIn(ALLOWED_EMOJIS)
  emoji: string;
}
