import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'هوش مصنوعی فارسی - Persian AI Chatbot',
  description: 'دستیار هوشمند فارسی با قابلیت گفتگوی صوتی',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-arabic antialiased">{children}</body>
    </html>
  )
}