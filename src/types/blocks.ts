export interface Block {
  id: number
  updated_at: string
  storage: 'url' | null
  resolver: string
  content: string
  embedding: number[] | null
}
