'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Pause, Sparkles, Tag, Plus, X, Volume2 } from 'lucide-react'
import Link from 'next/link'
import { useRecordingStore } from '@/lib/store/recordingStore'
import { generateSummary, suggestLabels } from '@/lib/services/transcription'

export default function TranscriptionPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const { getRecording, updateRecording } = useRecordingStore()
    const recording = getRecording(id)

    const [isPlaying, setIsPlaying] = useState(false)
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
    const [summary, setSummary] = useState<string>('')
    const [isLoadingSummary, setIsLoadingSummary] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [newLabel, setNewLabel] = useState('')
    const [suggestedLabels, setSuggestedLabels] = useState<string[]>([])

    useEffect(() => {
        if (!recording) {
            router.push('/history')
            return
        }

        // Load suggested labels
        if (recording.transcription?.text) {
            suggestLabels(recording.transcription.text).then(setSuggestedLabels)
        }
    }, [recording, router])

    if (!recording || !recording.transcription) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-white text-xl mb-2">Không tìm thấy bản ghi</div>
                    <Link href="/history" className="text-wise-amber-500">
                        Quay lại lịch sử
                    </Link>
                </div>
            </div>
        )
    }

    const togglePlay = () => {
        if (isPlaying) {
            audio?.pause()
            setIsPlaying(false)
        } else {
            if (!audio) {
                const newAudio = new Audio(recording.uri)
                newAudio.onended = () => setIsPlaying(false)
                setAudio(newAudio)
                newAudio.play()
            } else {
                audio.play()
            }
            setIsPlaying(true)
        }
    }

    const generateAISummary = async () => {
        setIsLoadingSummary(true)
        try {
            const summaryText = await generateSummary(recording.transcription!.text)
            setSummary(summaryText)
        } catch (error) {
            alert('Lỗi khi tạo tóm tắt')
        } finally {
            setIsLoadingSummary(false)
        }
    }

    const speakSummary = () => {
        if (isSpeaking) {
            speechSynthesis.cancel()
            setIsSpeaking(false)
        } else {
            const utterance = new SpeechSynthesisUtterance(summary || recording.transcription!.text)
            utterance.lang = 'vi-VN'
            utterance.rate = 0.9
            utterance.onend = () => setIsSpeaking(false)
            speechSynthesis.speak(utterance)
            setIsSpeaking(true)
        }
    }

    const addLabel = (label: string) => {
        if (label && !recording.labels.includes(label)) {
            updateRecording(id, {
                labels: [...recording.labels, label],
            })
        }
        setNewLabel('')
    }

    const removeLabel = (label: string) => {
        updateRecording(id, {
            labels: recording.labels.filter((l) => l !== label),
        })
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-wise-gradient backdrop-blur-lg border-b border-wise-purple-500/20 z-10">
                <div className="flex items-center justify-between p-6">
                    <Link href="/history" className="text-white hover:text-wise-amber-500 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Văn Bản</h1>
                    <div className="w-6" />
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Recording Info Card */}
                <div className="glass p-6 rounded-2xl">
                    <h2 className="text-white font-semibold text-xl mb-4">{recording.name}</h2>

                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={togglePlay}
                            className="p-4 rounded-full bg-wise-amber-500 hover:bg-wise-amber-600 transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 text-white" />
                            ) : (
                                <Play className="w-6 h-6 text-white" />
                            )}
                        </button>

                        <div>
                            <div className="text-white font-medium">
                                {formatDuration(recording.duration)}
                            </div>
                            <div className="text-sm text-gray-400">
                                {new Date(recording.date).toLocaleString('vi-VN')}
                            </div>
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            {recording.labels.map((label) => (
                                <span
                                    key={label}
                                    className="px-3 py-1 bg-wise-purple-700 text-wise-amber-400 text-sm rounded-lg flex items-center gap-2"
                                >
                                    {label}
                                    <button
                                        onClick={() => removeLabel(label)}
                                        className="hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add Label */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addLabel(newLabel)}
                                placeholder="Thêm nhãn..."
                                className="flex-1 px-4 py-2 glass rounded-lg text-white placeholder-wise-purple-400 border border-wise-purple-500/30 focus:border-wise-amber-500 focus:outline-none"
                            />
                            <button
                                onClick={() => addLabel(newLabel)}
                                className="px-4 py-2 bg-wise-amber-500 hover:bg-wise-amber-600 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Suggested Labels */}
                        {suggestedLabels.length > 0 && (
                            <div>
                                <div className="text-sm text-gray-400 mb-2">Gợi ý từ AI:</div>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedLabels.map((label) => (
                                        <button
                                            key={label}
                                            onClick={() => addLabel(label)}
                                            className="px-3 py-1 bg-wise-purple-800/50 hover:bg-wise-purple-700 text-wise-purple-300 text-sm rounded-lg transition-colors"
                                        >
                                            + {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Summary */}
                <div className="glass p-6 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-wise-amber-500" />
                            Tóm Tắt AI
                        </h3>
                        <div className="flex gap-2">
                            {summary && (
                                <button
                                    onClick={speakSummary}
                                    className="px-4 py-2 bg-wise-purple-700 hover:bg-wise-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Volume2 className="w-4 h-4" />
                                    {isSpeaking ? 'Dừng' : 'Nghe'}
                                </button>
                            )}
                            <button
                                onClick={generateAISummary}
                                disabled={isLoadingSummary}
                                className="px-4 py-2 bg-wise-amber-500 hover:bg-wise-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isLoadingSummary ? 'Đang tạo...' : summary ? 'Tạo Lại' : 'Tạo Tóm Tắt'}
                            </button>
                        </div>
                    </div>

                    {summary && (
                        <p className="text-wise-purple-200 leading-relaxed">{summary}</p>
                    )}
                </div>

                {/* Transcription Segments */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold text-lg">Nội Dung Chi Tiết</h3>
                        {recording.transcription && (
                            <div className="flex gap-2 text-sm">
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
                                    👨 Nam: {recording.transcription.segments.filter(s => s.gender === 'male').length}
                                </span>
                                <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-lg">
                                    👩 Nữ: {recording.transcription.segments.filter(s => s.gender === 'female').length}
                                </span>
                                {recording.transcription.segments.some(s => s.gender === 'unknown') && (
                                    <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg">
                                        👤 Unknown: {recording.transcription.segments.filter(s => s.gender === 'unknown').length}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {recording.transcription.segments.map((segment, index) => {
                        const getBorderColor = () => {
                            if (segment.gender === 'male') return 'border-blue-500 bg-blue-500/5'
                            if (segment.gender === 'female') return 'border-pink-500 bg-pink-500/5'
                            return 'border-gray-500 bg-gray-500/5'
                        }

                        const getIconBg = () => {
                            if (segment.gender === 'male') return 'bg-blue-500/20'
                            if (segment.gender === 'female') return 'bg-pink-500/20'
                            return 'bg-gray-500/20'
                        }

                        const getIcon = () => {
                            if (segment.gender === 'male') return '👨'
                            if (segment.gender === 'female') return '👩'
                            return '👤'
                        }

                        const getTextColor = () => {
                            if (segment.gender === 'male') return 'text-blue-400'
                            if (segment.gender === 'female') return 'text-pink-400'
                            return 'text-gray-400'
                        }

                        return (
                            <div
                                key={index}
                                className={`glass p-6 rounded-2xl border-l-4 ${getBorderColor()}`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBg()}`}>
                                        <span className="text-xl">{getIcon()}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className={`font-semibold ${getTextColor()}`}>
                                            {segment.speaker}
                                        </div>
                                        <div className="text-sm text-gray-400">Đoạn {index + 1}</div>
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        {segment.genderReason && (
                                            <div
                                                className="px-2 py-1 bg-wise-purple-900/50 text-xs text-wise-purple-300 rounded-lg cursor-help"
                                                title={segment.genderReason}
                                            >
                                                💡 {segment.genderReason.substring(0, 30)}...
                                            </div>
                                        )}
                                        <div className="px-3 py-1 bg-wise-purple-800 text-wise-purple-300 text-sm rounded-lg">
                                            {segment.timestamp}
                                        </div>
                                    </div>
                                </div>

                                <p className="text-white leading-relaxed">{segment.text}</p>
                            </div>
                        )
                    })}
                </div>

                {/* Full Text */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-white font-semibold mb-4">Văn Bản Đầy Đủ</h3>
                    <p className="text-wise-purple-200 leading-relaxed whitespace-pre-wrap">
                        {recording.transcription.text}
                    </p>
                </div>
            </div>
        </div>
    )
}
