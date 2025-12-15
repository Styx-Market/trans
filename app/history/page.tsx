'use client'

import { useState } from 'react'
import { ArrowLeft, Search, Play, Pause, Trash2, CheckSquare, Square, X } from 'lucide-react'
import Link from 'next/link'
import { useRecordingStore, Recording } from '@/lib/store/recordingStore'
import { formatDistance } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function HistoryPage() {
    const { recordings, deleteRecording, deleteRecordings, searchRecordings } = useRecordingStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

    // Selection mode
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const displayRecordings = searchQuery ? searchRecordings(searchQuery) : recordings

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const togglePlay = (recording: Recording) => {
        if (playingId === recording.id) {
            audioElement?.pause()
            setPlayingId(null)
        } else {
            if (audioElement) {
                audioElement.pause()
            }
            const audio = new Audio(recording.uri)
            audio.onended = () => setPlayingId(null)
            audio.play()
            setAudioElement(audio)
            setPlayingId(recording.id)
        }
    }

    const handleLongPress = (id: string) => {
        setIsSelectionMode(true)
        setSelectedIds(new Set([id]))
    }

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)

        if (newSelected.size === 0) {
            setIsSelectionMode(false)
        }
    }

    const selectAll = () => {
        setSelectedIds(new Set(displayRecordings.map(r => r.id)))
    }

    const deselectAll = () => {
        setSelectedIds(new Set())
        setIsSelectionMode(false)
    }

    const deleteSelected = () => {
        if (selectedIds.size === 0) return

        const confirmed = confirm(`Xóa ${selectedIds.size} ghi âm đã chọn?`)
        if (confirmed) {
            deleteRecordings(Array.from(selectedIds))
            setSelectedIds(new Set())
            setIsSelectionMode(false)
        }
    }

    const deleteSingle = (id: string, name: string) => {
        const confirmed = confirm(`Xóa ghi âm "${name}"?`)
        if (confirmed) {
            deleteRecording(id)
            const newSelected = new Set(selectedIds)
            newSelected.delete(id)
            setSelectedIds(newSelected)
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-wise-gradient backdrop-blur-lg border-b border-wise-purple-500/20 z-10">
                <div className="flex items-center justify-between p-6">
                    <Link href="/" className="text-white hover:text-wise-amber-500 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Lịch Sử</h1>
                    <div className="text-sm text-wise-purple-300">
                        {recordings.length} ghi âm
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-wise-purple-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, nhãn hoặc nội dung..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 glass rounded-xl text-white placeholder-wise-purple-400 border border-wise-purple-500/30 focus:border-wise-amber-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Selection Mode Actions */}
                {isSelectionMode && (
                    <div className="px-6 pb-4 flex items-center gap-3">
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 bg-wise-purple-700 hover:bg-wise-purple-600 text-white rounded-lg transition-colors text-sm"
                        >
                            Chọn Tất Cả
                        </button>
                        <button
                            onClick={deselectAll}
                            className="px-4 py-2 bg-wise-purple-700 hover:bg-wise-purple-600 text-white rounded-lg transition-colors text-sm"
                        >
                            Bỏ Chọn
                        </button>
                        <div className="flex-1" />
                        <div className="text-wise-amber-500 font-medium">
                            {selectedIds.size} đã chọn
                        </div>
                        <button
                            onClick={deleteSelected}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Xóa ({selectedIds.size})
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
                {displayRecordings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-32 h-32 rounded-full bg-wise-purple-900/30 flex items-center justify-center mb-6">
                            <Search className="w-16 h-16 text-wise-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            {searchQuery ? 'Không tìm thấy' : 'Chưa có ghi âm'}
                        </h3>
                        <p className="text-gray-400">
                            {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu ghi âm hoặc tải file lên'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {displayRecordings.map((recording) => (
                            <div
                                key={recording.id}
                                onClick={() => isSelectionMode && toggleSelection(recording.id)}
                                onContextMenu={(e) => {
                                    e.preventDefault()
                                    handleLongPress(recording.id)
                                }}
                                className={`glass p-6 rounded-2xl transition-all cursor-pointer hover:bg-wise-purple-800/30 ${isSelectionMode ? 'border-2' : 'border'
                                    } ${selectedIds.has(recording.id)
                                        ? 'border-wise-amber-500 bg-wise-amber-500/10'
                                        : 'border-wise-purple-500/30'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Selection Checkbox */}
                                    {isSelectionMode && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleSelection(recording.id)
                                            }}
                                            className="mt-1"
                                        >
                                            {selectedIds.has(recording.id) ? (
                                                <CheckSquare className="w-6 h-6 text-wise-amber-500" />
                                            ) : (
                                                <Square className="w-6 h-6 text-wise-purple-400" />
                                            )}
                                        </button>
                                    )}

                                    {/* Play Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            togglePlay(recording)
                                        }}
                                        className="p-3 rounded-full bg-wise-amber-500 hover:bg-wise-amber-600 transition-colors flex-shrink-0"
                                    >
                                        {playingId === recording.id ? (
                                            <Pause className="w-5 h-5 text-white" />
                                        ) : (
                                            <Play className="w-5 h-5 text-white" />
                                        )}
                                    </button>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold text-lg mb-1 truncate">
                                            {recording.name}
                                        </h3>

                                        <div className="flex items-center gap-3 text-sm text-wise-purple-300 mb-2">
                                            <span>{formatDuration(recording.duration)}</span>
                                            <span>•</span>
                                            <span>
                                                {formatDistance(new Date(recording.date), new Date(), {
                                                    addSuffix: true,
                                                    locale: vi,
                                                })}
                                            </span>
                                        </div>

                                        {/* Labels */}
                                        {recording.labels.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {recording.labels.map((label) => (
                                                    <span
                                                        key={label}
                                                        className="px-2 py-1 bg-wise-purple-700 text-wise-amber-400 text-xs rounded-lg"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Transcription Preview */}
                                        {recording.transcription && (
                                            <p className="text-sm text-gray-400 line-clamp-2">
                                                {recording.transcription.text}
                                            </p>
                                        )}

                                        {/* Transcription Button */}
                                        {!isSelectionMode && (
                                            <div className="mt-3">
                                                {recording.transcription ? (
                                                    <Link
                                                        href={`/transcription/${recording.id}`}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-wise-amber-500 hover:bg-wise-amber-600 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        📝 Xem Kết Quả
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={`/transcribing/${recording.id}`}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-wise-amber-500 to-wise-purple-500 hover:from-wise-amber-600 hover:to-wise-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg"
                                                    >
                                                        🤖 Chuyển Văn Bản
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete Button */}
                                    {!isSelectionMode && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteSingle(recording.id, recording.name)
                                            }}
                                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
