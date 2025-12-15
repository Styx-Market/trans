'use client'

import { useState, useRef } from 'react'
import { Upload as UploadIcon, ArrowLeft, File, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRecordingStore } from '@/lib/store/recordingStore'
import { v4 as uuidv4 } from 'uuid'

export default function UploadPage() {
    const router = useRouter()
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { addRecording } = useRecordingStore()

    const supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
    const formatLabels = 'MP3, WAV, M4A, AAC, MP4, MOV, AVI'

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileSelect(files[0])
        }
    }

    const handleFileSelect = (file: File) => {
        if (supportedFormats.some(format => file.type.includes(format.split('/')[1]))) {
            setSelectedFile(file)
        } else {
            alert(`Định dạng không được hỗ trợ. Vui lòng chọn: ${formatLabels}`)
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0])
        }
    }

    const uploadFile = async () => {
        if (!selectedFile) return

        setIsUploading(true)

        try {
            // Create audio URL from file
            const url = URL.createObjectURL(selectedFile)

            // Get audio duration
            const audio = new Audio(url)
            await new Promise((resolve) => {
                audio.onloadedmetadata = resolve
            })

            const recordingId = uuidv4()
            const recording = {
                id: recordingId,
                name: selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
                uri: url,
                blob: selectedFile,
                duration: Math.floor(audio.duration),
                date: new Date(),
                labels: ['Tải lên'],
            }

            addRecording(recording)

            // Navigate to transcription directly
            router.push(`/transcribing/${recordingId}`)

        } catch (error) {
            console.error('Upload error:', error)
            setIsUploading(false)
            alert('Lỗi khi tải file. Vui lòng thử lại.')
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <Link href="/" className="text-white hover:text-wise-amber-500 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Tải File Lên</h1>
                <div className="w-6" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                {/* Upload Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`glass w-full max-w-2xl rounded-3xl p-12 transition-all ${isDragging ? 'border-4 border-wise-amber-500 bg-wise-amber-500/10' : 'border-2 border-wise-purple-500/30'
                        }`}
                >
                    {!selectedFile ? (
                        <div className="text-center space-y-6">
                            {/* Icon */}
                            <div className="flex justify-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-wise-purple-600 to-wise-purple-800 flex items-center justify-center">
                                    <UploadIcon className="w-16 h-16 text-wise-amber-500" />
                                </div>
                            </div>

                            {/* Text */}
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-white">
                                    {isDragging ? 'Thả file vào đây' : 'Kéo thả file vào đây'}
                                </h2>
                                <p className="text-wise-purple-300">
                                    hoặc
                                </p>
                            </div>

                            {/* Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-8 py-4 bg-wise-amber-500 hover:bg-wise-amber-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Chọn File
                            </button>

                            {/* Info */}
                            <div className="glass p-4 rounded-xl">
                                <p className="text-sm text-gray-400">
                                    <strong className="text-white">Định dạng hỗ trợ:</strong>
                                    <br />
                                    {formatLabels}
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*,video/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Selected File */}
                            <div className="flex items-center justify-between glass p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <File className="w-6 h-6 text-wise-amber-500" />
                                    <div>
                                        <div className="text-white font-medium">{selectedFile.name}</div>
                                        <div className="text-sm text-gray-400">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="p-2 hover:bg-wise-purple-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedFile(null)}
                                    className="flex-1 px-6 py-3 bg-wise-purple-700 hover:bg-wise-purple-600 text-white rounded-xl transition-colors font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={uploadFile}
                                    disabled={isUploading}
                                    className="flex-1 px-6 py-3 bg-wise-amber-500 hover:bg-wise-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? 'Đang xử lý...' : '🤖 Chuyển Văn Bản'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl">
                    <div className="text-center">
                        <div className="text-2xl mb-1">🎵</div>
                        <div className="text-sm text-gray-400">Hỗ trợ audio</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-1">🎬</div>
                        <div className="text-sm text-gray-400">Hỗ trợ video</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-1">⚡</div>
                        <div className="text-sm text-gray-400">Xử lý nhanh</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
