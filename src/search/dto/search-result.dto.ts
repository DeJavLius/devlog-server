export class SearchResultItem {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  publishedAt: Date
  score: number
}

export class SearchResponseDto {
  total: number
  page: number
  limit: number
  results: SearchResultItem[]
}
