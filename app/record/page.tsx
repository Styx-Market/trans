'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, ArrowLeft, FileText, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRecordingStore } from '@/lib/store/recordingStore'
import { v4 as uuidv4 } from 'uuid'

type RecordingState = 'idle' | 'recording' | 'paused' | 'completed'

export default function RecordPage() {
    const router = useRouter()
    const [state, setState] = useState<RecordingState>('idle')
    const [duration, setDuration] = useState(0)
    const [audioURL, setAudioURL] = useState<string | null>(null)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const { addRecording } = useRecordingStore()

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setDuration(prev => prev + 1)
        }, 1000)
    }

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1, // Mono - giảm tiếng ồn
                    sampleRate: 44100, // High quality
                    sampleSize: 16,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true, // Tự động cân bằng âm lượng
                }
            })
            streamRef.current = stream

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000, // 128kbps
            })
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
                setAudioBlob(blob)
                setState('completed')
                stopTimer()
            }

            mediaRecorder.start()
            setState('recording')
            startTimer()
        } catch (err) {
            console.error('Error accessing microphone:', err)
            alert('Không thể truy cập microphone. Vui lòng cấp quyền.')
        }
    }

    const pauseRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.pause()
            setState('paused')
            stopTimer()
        }
    }

    const resumeRecording = () => {
        if (mediaRecorderRef.current && state === 'paused') {
            mediaRecorderRef.current.resume()
            setState('recording')
            startTimer()
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }

    const resetRecording = () => {
        setAudioURL(null)
        setAudioBlob(null)
        setDuration(0)
        setState('idle')
        chunksRef.current = []
    }

    const saveRecording = () => {
        if (audioBlob && audioURL) {
            const recordingId = uuidv4()
            const recording = {
                id: recordingId,
                name: `Ghi âm ${new Date().toLocaleString('vi-VN')}`,
                uri: audioURL,
                blob: audioBlob,
                duration,
                date: new Date(),
                labels: [],
            }

            addRecording(recording)
            router.push(`/transcribing/${recordingId}`)
        }
    }

    useEffect(() => {
        return () => {
            stopTimer()
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    return (
        <div className="min-h-screen flex flex-col">
            {/* Recording Indicator Bar */}
            {state === 'recording' && (
                <div className="bg-red-600 text-white text-center py-2 text-sm font-medium animate-pulse">
                    🔴 Đang ghi âm · {formatTime(duration)}
                </div>
            )}

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
                    <div className="text-6xl md:text-7xl font-mono font-bold text-white mb-2 tabular-nums">
                        {formatTime(duration)}
                    </div>
                    <div className="text-wise-purple-300 text-lg">
                        {state === 'idle' && 'Sẵn sàng ghi âm'}
                        {state === 'recording' && 'Đang ghi âm...'}
                        {state === 'paused' && 'Đã tạm dừng'}
                        {state === 'completed' && 'Hoàn thành'}
                    </div>
                </div>

                {/* Recording Indicator Animation */}
                {state === 'recording' && (
                    <div className="mb-12 relative">
                        <div className="w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center absolute inset-0 animate-ping" />
                        <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center relative">
                            <div className="w-24 h-24 rounded-full bg-red-500/40 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-red-500 animate-pulse" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls - Three State Logic */}
                <div className="flex gap-6 mb-12 items-center">
                    {state === 'idle' && (
                        <button
                            onClick={startRecording}
                            className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-2xl shadow-red-500/50 flex items-center justify-center group hover:scale-110"
                        >
                            <Mic className="w-10 h-10 text-white" />
                        </button>
                    )}

                    {state === 'recording' && (
                        <button
                            onClick={pauseRecording}
                            className="w-20 h-20 rounded-full bg-wise-amber-500 hover:bg-wise-amber-600 transition-all shadow-lg flex items-center justify-center"
                            title="Dừng"
                        >
                            <Pause className="w-8 h-8 text-white" />
                        </button>
                    )}

                    {state === 'paused' && (
                        <>
                            <button
                                onClick={resumeRecording}
                                className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 transition-all shadow-lg flex items-center justify-center"
                                title="Tiếp Tục Ghi"
                            >
                                <Play className="w-8 h-8 text-white" />
                            </button>

                            <button
                                onClick={stopRecording}
                                className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-2xl shadow-red-500/50 flex items-center justify-center"
                                title="Kết Thúc Ghi Âm"
                            >
                                <Square className="w-10 h-10 text-white fill-white" />
                            </button>
                        </>
                    )}
                </div>

                {/* State Labels */}
                {state === 'recording' && (
                    <div className="text-wise-amber-400 font-medium">
                        Nhấn để Dừng
                    </div>
                )}
                {state === 'paused' && (
                    <div className="text-white font-medium text-center">
                        <div className="text-green-400 mb-1">Tiếp Tục Ghi</div>
                        <div className="text-red-400">Kết Thúc Ghi Âm</div>
                    </div>
                )}

                {/* Completed State - Playback */}
                {state === 'completed' && audioURL && (
                    <div className="glass p-8 rounded-3xl w-full max-w-md space-y-6">
                        <h3 className="text-white font-semibold text-xl text-center mb-4">
                            Nghe Lại Ghi Âm
                        </h3>

                        <audio
                            src={audioURL}
                            controls
                            className="w-full rounded-xl"
                            style={{ filter: 'hue-rotate(250deg) saturate(1.5)' }}
                        />

                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={resetRecording}
                                className="px-4 py-3 bg-wise-purple-700 hover:bg-wise-purple-600 text-white rounded-xl transition-colors flex flex-col items-center gap-1"
                            >
                                <RotateCcw className="w-5 h-5" />
                                <span className="text-xs">Ghi Lại</span>
                            </button>

                            <button
                                onClick={saveRecording}
                                className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors flex flex-col items-center gap-1 col-span-2"
                            >
                                <span className="text-sm font-medium">Lưu Ghi Âm</span>
                            </button>
                        </div>

                        <button
                            onClick={saveRecording}
                            className="w-full px-4 py-3 bg-wise-amber-500 hover:bg-wise-amber-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <FileText className="w-5 h-5" />
                            <span className="font-medium">Chuyển Văn Bản</span>
                        </button>
                    </div>
                )}

                {/* Instructions */}
                {state === 'idle' && (
                    <div className="text-center text-gray-400 max-w-md space-y-3">
                        <p className="text-sm">
                            Nhấn nút microphone để bắt đầu ghi âm
                        </p>
                        <div className="text-xs space-y-1 text-gray-500">
                            <p>💡 Bạn có thể tạm dừng và tiếp tục ghi bất cứ lúc nào</p>
                            <p>🎯 Không giới hạn thời gian ghi âm</p>
                            <p>🎙️ Chất lượng cao với noise suppression</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
