import { Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { SearchSyncService } from './search-sync.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [SearchService, SearchSyncService],
})
export class SearchModule {}
