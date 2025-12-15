'use client'

import { Mic, Upload, Clock, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Header */}
            <div className="text-center mb-12 animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-wise-amber-500/20 px-4 py-2 rounded-full mb-6 border border-wise-amber-500/30">
                    <Sparkles className="w-4 h-4 text-wise-amber-500" />
                    <span className="text-wise-amber-500 text-sm font-medium">Powered by AI</span>
                </div>

                <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
                    🎙️ Wise Man
                </h1>

                <p className="text-2xl text-wise-amber-500 mb-2">
                    Trí tuệ từ lời nói
                </p>

                <p className="text-lg text-gray-300">
                    Ghi âm, chuyển đổi và lưu giữ tri thức
                </p>
            </div>

            {/* Main Actions */}
            <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
                {/* Record Button */}
                <Link
                    href="/record"
                    className="glass p-8 rounded-2xl hover:bg-wise-purple-800/30 transition-all group"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-red-500/20 group-hover:bg-red-500/30 transition-all">
                            <Mic className="w-8 h-8 text-red-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-white font-semibold text-lg mb-1">
                                Ghi Âm
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Ghi âm không giới hạn với pause/resume
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Upload Button */}
                <Link
                    href="/upload"
                    className="glass p-8 rounded-2xl hover:bg-wise-purple-800/30 transition-all group"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 rounded-full bg-wise-amber-500/20 group-hover:bg-wise-amber-500/30 transition-all">
                            <Upload className="w-8 h-8 text-wise-amber-500" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-white font-semibold text-lg mb-1">
                                Tải File Lên
                            </h3>
                            <p className="text-gray-400 text-sm">
                                Upload MP3, WAV, M4A để chuyển văn bản
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* History Link */}
            <Link
                href="/history"
                className="glass px-6 py-3 rounded-xl hover:bg-wise-purple-800/30 transition-all flex items-center gap-2"
            >
                <Clock className="w-5 h-5 text-wise-purple-400" />
                <span className="text-white">Xem Lịch Sử Ghi Âm</span>
            </Link>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl">
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">99%+</div>
                    <div className="text-gray-400 text-sm">Độ chính xác</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">{'<5s'}</div>
                    <div className="text-gray-400 text-sm">Thời gian xử lý</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">∞</div>
                    <div className="text-gray-400 text-sm">Không giới hạn</div>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-12 text-gray-500 text-sm">
                Made with ❤️ by Next.js • Deployed on Netlify
            </p>
        </div>
    )
}
