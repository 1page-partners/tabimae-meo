export type ReplyStyle = 'formal' | 'warm' | 'concise'

export type Review = {
  id: string
  author: string
  rating: number
  date: string
  title: string
  text: string
  replied: boolean
  reply: string | null
  language: 'ja' | 'en'
}
