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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazir:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-persian antialiased">{children}</body>
    </html>
  )
}