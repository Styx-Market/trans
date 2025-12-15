'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Play, Pause, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RecordPage() {
    const router = useRouter()
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [duration, setDuration] = useState(0)
    const [audioURL, setAudioURL] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                const url = URL.createObjectURL(blob)
                setAudioURL(url)
            }

            mediaRecorder.start()
            setIsRecording(true)

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1)
            }, 1000)
        } catch (err) {
            console.error('Error accessing microphone:', err)
            alert('Không thể truy cập microphone. Vui lòng cấp quyền.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
            setIsRecording(false)
            setIsPaused(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume()
                timerRef.current = setInterval(() => {
                    setDuration(prev => prev + 1)
                }, 1000)
            } else {
                mediaRecorderRef.current.pause()
                if (timerRef.current) clearInterval(timerRef.current)
            }
            setIsPaused(!isPaused)
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <Link href="/" className="text-white hover:text-wise-amber-500 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Ghi Âm</h1>
                <div className="w-6" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                {/* Timer */}
                <div className="text-center mb-12">
                    <div className="text-6xl font-mono font-bold text-white mb-2">
                        {formatTime(duration)}
                    </div>
                    <div className="text-wise-purple-300">
                        {isRecording ? (isPaused ? 'Đã tạm dừng' : 'Đang ghi...') : 'Sẵn sàng'}
                    </div>
                </div>

                {/* Recording Indicator */}
                {isRecording && !isPaused && (
                    <div className="mb-8">
                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center relative">
                            <div className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center animate-pulse">
                                <div className="w-16 h-16 rounded-full bg-red-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-6 mb-12">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg shadow-red-500/50"
                        >
                            <Mic className="w-8 h-8 text-white" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={pauseRecording}
                                className="w-16 h-16 rounded-full bg-wise-amber-500 hover:bg-wise-amber-600 transition-colors flex items-center justify-center"
                            >
                                {isPaused ? (
                                    <Play className="w-6 h-6 text-white" />
                                ) : (
                                    <Pause className="w-6 h-6 text-white" />
                                )}
                            </button>

                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center shadow-lg"
                            >
                                <Square className="w-8 h-8 text-white fill-white" />
                            </button>
                        </>
                    )}
                </div>

                {/* Audio Playback */}
                {audioURL && !isRecording && (
                    <div className="glass p-6 rounded-2xl w-full max-w-md">
                        <h3 className="text-white font-semibold mb-4">Nghe Lại</h3>
                        <audio src={audioURL} controls className="w-full mb-4" />

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    // Reset for new recording
                                    setAudioURL(null)
                                    setDuration(0)
                                }}
                                className="flex-1 px-4 py-2 bg-wise-purple-700 hover:bg-wise-purple-600 text-white rounded-xl transition-colors"
                            >
                                Ghi Lại
                            </button>

                            <button
                                onClick={() => {
                                    // TODO: Navigate to transcription with audio
                                    alert('Chức năng chuyển văn bản đang được phát triển')
                                }}
                                className="flex-1 px-4 py-2 bg-wise-amber-500 hover:bg-wise-amber-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Chuyển Văn Bản
                            </button>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                {!isRecording && !audioURL && (
                    <div className="text-center text-gray-400 max-w-md">
                        <p className="text-sm">
                            Nhấn nút mic để bắt đầu ghi âm. Bạn có thể tạm dừng và tiếp tục bất cứ lúc nào.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
