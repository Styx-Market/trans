'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { useRecordingStore } from '@/lib/store/recordingStore'
import { transcribeAudio } from '@/lib/services/transcription'

export default function TranscribingPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const { getRecording, updateRecording } = useRecordingStore()
    const recording = getRecording(id)

    const [status, setStatus] = useState('Chuẩn bị...')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (!recording) {
            router.push('/history')
            return
        }

        if (recording.transcription) {
            // Already transcribed
            router.push(`/transcription/${id}`)
            return
        }

        // Start transcription
        processTranscription()
    }, [recording, id, router])

    const processTranscription = async () => {
        if (!recording || !recording.blob) return

        try {
            setStatus('Đang chuyển đổi âm thanh...')
            setProgress(10)

            //  Real OpenAI API call
            const result = await transcribeAudio(recording.blob)

            setProgress(70)
            setStatus('Phát hiện người nói...')

            // Wait a bit for UX
            await new Promise(resolve => setTimeout(resolve, 1000))

            setProgress(90)
            setStatus('Hoàn tất...')

            // Update recording with transcription
            updateRecording(id, {
                transcription: {
                    text: result.text,
                    segments: result.segments,
                    speakerCount: new Set(result.segments.map(s => s.speaker)).size,
                    duration: recording.duration,
                }
            })

            setProgress(100)

            // Navigate to result
            setTimeout(() => {
                router.push(`/transcription/${id}`)
            }, 500)

        } catch (error) {
            console.error('Transcription failed:', error)
            setStatus('Lỗi khi chuyển đổi')

            setTimeout(() => {
                const retry = confirm('Chuyển đổi thất bại. Bạn có muốn thử lại?')
                if (retry) {
                    setStatus('Chuẩn bị...')
                    setProgress(0)
                    processTranscription()
                } else {
                    router.push('/history')
                }
            }, 1000)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="glass p-12 rounded-3xl max-w-md w-full text-center space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-wise-amber-500/20 flex items-center justify-center animate-pulse">
                            <Sparkles className="w-12 h-12 text-wise-amber-500" />
                        </div>
                        <Loader2 className="w-8 h-8 text-wise-amber-500 absolute -right-2 -bottom-2 animate-spin" />
                    </div>
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Chuyển Đổi Bằng AI
                    </h1>
                    <p className="text-wise-purple-300">
                        Powered by OpenAI Whisper
                    </p>
                </div>

                {/* Status */}
                <div className="space-y-3">
                    <div className="text-white font-medium">{status}</div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-wise-purple-900/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-wise-amber-500 to-wise-purple-500 transition-all duration-500 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="text-wise-purple-400 text-sm">{progress}%</div>
                </div>

                {/* Info */}
                <div className="text-sm text-gray-400 space-y-1">
                    <p>✨ Chuyển đổi giọng nói thành văn bản</p>
                    <p>🎭 Phát hiện người nói tự động</p>
                    <p>🇻🇳 Tối ưu cho tiếng Việt</p>
                </div>
            </div>
        </div>
    )
}
