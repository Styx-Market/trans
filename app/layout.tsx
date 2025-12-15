import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
    title: 'Wise Man - Vietnamese Audio Transcription',
    description: 'Trí tuệ từ lời nói - Ghi âm, chuyển đổi và lưu giữ tri thức',
    keywords: ['transcription', 'vietnamese', 'audio', 'AI', 'speech-to-text'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="vi">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
