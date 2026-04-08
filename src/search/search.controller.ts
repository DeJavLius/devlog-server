import { Controller, Get, Post, Query } from '@nestjs/common'
import { SearchService } from './search.service'
import { SearchSyncService } from './search-sync.service'
import { SearchQueryDto } from './dto/search-query.dto'

@Controller('search')
export class SearchController {
  constructor(
    private searchService: SearchService,
    private syncService: SearchSyncService,
  ) {}

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query)
  }

  /** webhook 배포 후 호출 — 증분 동기화 */
  @Post('sync')
  sync() {
    return this.syncService.syncAll()
  }
}
