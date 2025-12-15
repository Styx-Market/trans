'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Camera, Upload, Trash2, Users, History as HistoryIcon } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'faces' | 'history'>('faces')
    const [newFaceName, setNewFaceName] = useState('')
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [isCameraOn, setIsCameraOn] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const { adminFaces, addAdminFace, removeAdminFace, sessions } = useAuthStore()

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                streamRef.current = stream
                setIsCameraOn(true)
            }
        } catch (err) {
            alert('Không thể mở camera')
        }
    }

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const video = videoRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL('image/jpeg').split(',')[1]
        setCapturedImage(imageData)

        // Stop camera
        streamRef.current?.getTracks().forEach(track => track.stop())
        setIsCameraOn(false)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            setCapturedImage(base64)
        }
        reader.readAsDataURL(file)
    }

    const saveFace = () => {
        if (!capturedImage || !newFaceName.trim()) {
            alert('Vui lòng nhập tên và chụp ảnh')
            return
        }

        const face = {
            id: uuidv4(),
            name: newFaceName.trim(),
            image: capturedImage,
            createdAt: new Date(),
        }

        addAdminFace(face)
        setCapturedImage(null)
        setNewFaceName('')
        alert(`Đã thêm khuôn mặt: ${face.name}`)
    }

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="text-white hover:text-wise-amber-500 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                <div className="w-6" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('faces')}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${activeTab === 'faces'
                            ? 'bg-wise-amber-500 text-white'
                            : 'glass text-wise-purple-300 hover:text-white'
                        }`}
                >
                    <Users className="w-5 h-5 inline mr-2" />
                    Khuôn Mặt ({adminFaces.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${activeTab === 'history'
                            ? 'bg-wise-amber-500 text-white'
                            : 'glass text-wise-purple-300 hover:text-white'
                        }`}
                >
                    <HistoryIcon className="w-5 h-5 inline mr-2" />
                    Lịch Sử ({sessions.length})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'faces' ? (
                <div className="space-y-8">
                    {/* Add Face */}
                    <div className="glass p-8 rounded-3xl">
                        <h2 className="text-xl font-bold text-white mb-6">Thêm Khuôn Mặt Admin</h2>

                        <div className="space-y-6">
                            {/* Name Input */}
                            <input
                                type="text"
                                value={newFaceName}
                                onChange={(e) => setNewFaceName(e.target.value)}
                                placeholder="Nhập tên (VD: Nguyễn Văn A)"
                                className="w-full px-4 py-3 bg-wise-purple-900/50 border border-wise-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-wise-amber-500"
                            />

                            {/* Camera/Upload */}
                            <div className="grid grid-cols-2 gap-4">
                                {!isCameraOn && !capturedImage && (
                                    <>
                                        <button onClick={startCamera} className="btn-primary">
                                            <Camera className="w-5 h-5" />
                                            Chụp Ảnh
                                        </button>
                                        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                                            <Upload className="w-5 h-5" />
                                            Tải Ảnh Lên
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Camera View */}
                            {isCameraOn && (
                                <div className="space-y-4">
                                    <video ref={videoRef} autoPlay className="w-full rounded-xl" />
                                    <button onClick={capturePhoto} className="btn-primary w-full">
                                        Chụp
                                    </button>
                                </div>
                            )}

                            {/* Preview */}
                            {capturedImage && (
                                <div className="space-y-4">
                                    <img
                                        src={`data:image/jpeg;base64,${capturedImage}`}
                                        alt="Preview"
                                        className="w-full rounded-xl"
                                    />
                                    <div className="flex gap-4">
                                        <button onClick={() => setCapturedImage(null)} className="btn-secondary flex-1">
                                            Chụp Lại
                                        </button>
                                        <button onClick={saveFace} className="btn-primary flex-1">
                                            Lưu
                                        </button>
                                    </div>
                                </div>
                            )}

                            <canvas ref={canvasRef} className="hidden" />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Face List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {adminFaces.map((face) => (
                            <div key={face.id} className="glass p-6 rounded-2xl">
                                <img
                                    src={`data:image/jpeg;base64,${face.image}`}
                                    alt={face.name}
                                    className="w-full aspect-square object-cover rounded-xl mb-4"
                                />
                                <div className="space-y-2">
                                    <h3 className="text-white font-semibold">{face.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        {format(new Date(face.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </p>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Xóa khuôn mặt: ${face.name}?`)) {
                                                removeAdminFace(face.id)
                                            }
                                        }}
                                        className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Session History */}
                    {sessions.length === 0 ? (
                        <div className="glass p-12 rounded-3xl text-center">
                            <p className="text-gray-400">Chưa có phiên đăng nhập</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="glass p-6 rounded-2xl">
                                <div className="flex items-start gap-4">
                                    <img
                                        src={`data:image/jpeg;base64,${session.loginImage}`}
                                        alt="Login"
                                        className="w-24 h-24 rounded-xl object-cover"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-white font-semibold text-lg">{session.faceName}</h3>
                                            <span
                                                className={`px-3 py-1 rounded-lg text-sm font-medium ${session.confidence >= 90
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : session.confidence >= 70
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-red-500/20 text-red-400'
                                                    }`}
                                            >
                                                {session.confidence}%
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400">{session.message}</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-gray-400">
                                                🌐 IP: <span className="text-white">{session.ip}</span>
                                            </div>
                                            <div className="text-gray-400">
                                                📍 GPS: <span className="text-white">{session.location}</span>
                                            </div>
                                            <div className="text-gray-400 col-span-2">
                                                🕐 {format(new Date(session.loginAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                                                {session.logoutAt && ` - ${format(new Date(session.logoutAt), 'HH:mm:ss')}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
