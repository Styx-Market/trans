import OpenAI from 'openai'

export async function compareFaces(
    capturedImage: string, // base64
    adminImage: string, // base64
    adminName: string
): Promise<{
    match: boolean
    confidence: number
    message: string
}> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY
        if (!apiKey) throw new Error('API key missing')

        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

        const prompt = `So sánh 2 khuôn mặt trong ảnh:

Ảnh 1: Khuôn mặt của "${adminName}" (ảnh đã lưu)
Ảnh 2: Khuôn mặt vừa chụp

YÊU CẦU:
1. Đây có phải cùng 1 người không?
2. Độ chính xác từ 0-100%
3. Lý do (đặc điểm giống nhau)

Trả về JSON:
{
  "match": true/false,
  "confidence": 0-100,
  "message": "Lý do chi tiết"
}

QUAN TRỌNG: 
- Nếu độ tương đồng >= 70% thì match = true
- Chấp nhận góc chụp, ánh sáng khác nhau
- Tập trung vào: mắt, mũi, miệng, hình mặt`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là chuyên gia nhận diện khuôn mặt. Trả về JSON format chính xác.',
                },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${adminImage}`,
                            },
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${capturedImage}`,
                            },
                        },
                    ],
                },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        })

        const result = JSON.parse(response.choices[0].message.content || '{}')

        return {
            match: result.match || false,
            confidence: result.confidence || 0,
            message: result.message || 'Không thể xác định',
        }
    } catch (error) {
        console.error('Face comparison error:', error)
        throw error
    }
}

// Get user location
export async function getUserLocation(): Promise<string> {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6)
                    const lon = position.coords.longitude.toFixed(6)
                    resolve(`${lat},${lon}`)
                },
                () => resolve('Unknown')
            )
        } else {
            resolve('Not supported')
        }
    })
}

// Get user IP
export async function getUserIP(): Promise<string> {
    try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        return data.ip
    } catch {
        return 'Unknown'
    }
}

// Get device info
export function getDeviceInfo(): string {
    return navigator.userAgent
}
