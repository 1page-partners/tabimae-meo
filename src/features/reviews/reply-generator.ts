import type { ReplyStyle, Review } from './types'

const openings: Record<ReplyStyle, string> = { formal:'この度は当館にご宿泊いただき、貴重なご感想をお寄せくださり誠にありがとうございます。', warm:'この度は月の宿へお越しいただき、本当にありがとうございました。', concise:'ご宿泊と口コミのご投稿、ありがとうございます。' }

export function generateReplies(review: Review, style: ReplyStyle): string[] {
  if (review.language === 'en') return [
    `Dear ${review.author},\n\nThank you very much for staying with us and sharing your feedback. ${review.rating >= 4 ? 'We are delighted that you enjoyed your time at Tsuki-no-Yado.' : 'We sincerely apologize that parts of your stay did not meet your expectations.'} We hope to welcome you again in Hakone.`,
    `Thank you, ${review.author}, for your thoughtful review. Your comments are sincerely appreciated and will be shared with our team. We look forward to welcoming you back.`,
    `Dear ${review.author}, thank you for choosing Tsuki-no-Yado. ${review.rating >= 4 ? 'We are so pleased you had a memorable stay.' : 'We will use your feedback to improve our hospitality.'}`,
  ]
  const concern = review.rating <= 3 ? 'ご期待に添えない点がございましたこと、心よりお詫び申し上げます。いただいたお声をスタッフで共有し、改善に努めてまいります。' : '温かいお言葉をいただき、スタッフ一同大変嬉しく拝読いたしました。'
  return [
    `${review.author} 様\n\n${openings[style]}${concern}\n\nまた箱根へお越しの際には、ぜひお立ち寄りください。心よりお待ちしております。`,
    `${review.author} 様\n\n数ある宿の中から月の宿をお選びいただき、ありがとうございます。${concern}\n\n次回はさらに心地よい時間をお過ごしいただけるよう努めてまいります。`,
    `${review.author} 様\n\n${openings[style]}お寄せいただいたお声は、私どもにとって大切な財産です。${review.rating <= 3 ? 'より良いおもてなしにつなげてまいります。' : 'また季節を変えてお越しいただければ幸いです。'}`,
  ]
}
