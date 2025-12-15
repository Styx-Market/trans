'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { compareFaces, getUserIP, getUserLocation, getDeviceInfo } from '@/lib/services/faceRecognition'
import { v4 as uuidv4 } from 'uuid'

export default function LoginPage() {
    const router = useRouter()
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [isCameraOn, setIsCameraOn] = useState(false)
    const [status, setStatus] = useState('Nhấn để bắt đầu')
    const [stream, setStream] = useState<MediaStream | null>(null)

    const { adminFaces, addSession, login } = useAuthStore()

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 }
            })

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                setStream(mediaStream)
                setIsCameraOn(true)
                setStatus('Đặt mặt vào khung hình')
            }
        } catch (err) {
            console.error('Camera error:', err)
            alert('Không thể mở camera. Vui lòng cấp quyền.')
        }
    }

    const captureAndVerify = async () => {
        if (!videoRef.current || !canvasRef.current) return
        if (adminFaces.length === 0) {
            alert('Chưa có khuôn mặt admin. Vui lòng thêm trong Admin.')
            return
        }

        setIsLoading(true)
        setStatus('Đang nhận diện...')

        try {
            // Capture image
            const canvas = canvasRef.current
            const video = videoRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(video, 0, 0)

            const capturedImage = canvas.toDataURL('image/jpeg').split(',')[1]

            // Compare with each admin face
            let bestMatch = { match: false, confidence: 0, message: '', faceId: '', faceName: '' }

            for (const face of adminFaces) {
                setStatus(`Đang so sánh với ${face.name}...`)
                const result = await compareFaces(capturedImage, face.image, face.name)

                if (result.match && result.confidence > bestMatch.confidence) {
                    bestMatch = {
                        ...result,
                        faceId: face.id,
                        faceName: face.name,
                    }
                }
            }

            if (bestMatch.match) {
                // Get location data
                const [ip, location] = await Promise.all([
                    getUserIP(),
                    getUserLocation(),
                ])

                // Create session
                const session = {
                    id: uuidv4(),
                    faceId: bestMatch.faceId,
                    faceName: bestMatch.faceName,
                    loginImage: capturedImage,
                    confidence: bestMatch.confidence,
                    message: bestMatch.message,
                    ip,
                    location,
                    device: getDeviceInfo(),
                    loginAt: new Date(),
                }

                addSession(session)
                login(bestMatch.faceName)

                setStatus(`✅ Xin chào, ${bestMatch.faceName}! (${bestMatch.confidence}% chính xác)`)

                // Stop camera
                stream?.getTracks().forEach(track => track.stop())

                setTimeout(() => {
                    router.push('/')
                }, 2000)
            } else {
                setStatus('❌ Không nhận diện được. Thử lại!')
                setIsLoading(false)
            }

        } catch (error) {
            console.error('Verification error:', error)
            setStatus('Lỗi khi xác thực')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-2xl w-full space-y-8">
                {/* Title */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-wise-amber-500 to-wise-purple-500 bg-clip-text text-transparent animate-pulse">
                        WISE MAN
                    </h1>
                    <p className="text-wise-purple-300">Face Recognition Login</p>
                </div>

                {/* Camera View */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {!isCameraOn && (
                            <div className="absolute inset-0 flex items-center justify-center bg-wise-purple-900/50">
                                <Lock className="w-24 h-24 text-wise-amber-500 opacity-50" />
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="text-center">
                        <p className="text-white font-medium">{status}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {!isCameraOn ? (
                            <button
                                onClick={startCamera}
                                className="flex-1 btn-primary"
                            >
                                <Camera className="w-5 h-5" />
                                Bật Camera
                            </button>
                        ) : (
                            <button
                                onClick={captureAndVerify}
                                disabled={isLoading}
                                className="flex-1 btn-primary disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Đang xác thực...
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-5 h-5" />
                                        Xác Thực Khuôn Mặt
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-sm text-gray-400 text-center space-y-1">
                        <p>🎭 Sử dụng AI để nhận diện khuôn mặt</p>
                        <p>📍 Lưu IP và vị trí để bảo mật</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
