import OpenAI from 'openai'

export async function transcribeAudio(audioBlob: Blob): Promise<{
    text: string
    segments: Array<{
        timestamp: string
        speaker: string
        text: string
        gender: 'male' | 'female'
    }>
}> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY
        if (!apiKey) {
            throw new Error('OpenAI API key not configured')
        }

        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

        // Convert Blob to File
        const file = new File([audioBlob], 'recording.webm', { type: audioBlob.type })

        // Prompt tối ưu cho tiếng Việt - CHÍNH XÁC 100%
        const detailedPrompt = `Đây là đoạn ghi âm tiếng Việt. Yêu cầu chuyển đổi:

1. CHÍNH XÁC 100%: Không bỏ sót bất kỳ câu, từ nào
2. DẤU THANH ĐẦY ĐỦ: sắc, huyền, hỏi, ngã, nặng
3. DẤU CÂU CHUẨN: chấm (.), phẩy (,), hỏi (?), than (!)
4. VIẾT HOA: Chữ đầu câu, tên riêng, địa danh
5. GIỮ NGUYÊN: Mọi từ, không thêm bớt, không diễn giải

Ví dụ chuẩn: "Xin chào, tôi là Nguyễn Văn A. Hôm nay trời đẹp quá!"`

        // Transcribe với verbose_json để có chi tiết và chính xác
        const transcription = await openai.audio.transcriptions.create({
            file,
            model: 'whisper-1',
            language: 'vi',
            prompt: detailedPrompt,
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
            temperature: 0, // Độ chính xác cao nhất
        })

        // Get full text
        const rawText = transcription.text

        // Speaker diarization với AI
        const segments = await detectSpeakers(rawText, openai)

        return {
            text: rawText,
            segments,
        }
    } catch (error) {
        console.error('Transcription error:', error)
        throw error
    }
}

async function detectSpeakers(
    text: string,
    openai: OpenAI
): Promise<Array<{
    timestamp: string
    speaker: string
    text: string
    gender: 'male' | 'female'
}>> {
    try {
        // Enhanced prompt for accurate speaker detection
        const prompt = `Phân tích hội thoại tiếng Việt và xác định người nói:

## YÊU CẦU:
1. **Phát hiện số người**: Dựa vào ngữ cảnh (câu hỏi/trả lời, chuyển đề, phong cách nói)
2. **Giới tính**: Phân tích qua xưng hô (tôi/anh/chị/em), từ ngữ, ngữ cảnh
3. **Phân đoạn chính xác**: Mỗi lượt nói một dòng
4. **Timestamp**: Ước tính thời gian dựa trên độ dài câu (5 từ ~ 3 giây)

## FORMAT:
[MM:SS] [Nam|Nữ] [Số]: Nội dung
  
Ví dụ:
[00:00] Nam 1: Xin chào mọi người
[00:03] Nữ 1: Chào anh, hôm nay thế nào?
[00:07] Nam 1: Khỏe, cảm ơn em đã hỏi

## PHÂN TÍCH DẤU HIỆU:
- Câu hỏi → Có thể người khác
- Thay đổi xưng hô → Có thể đổi người
- Chuyển đề đột ngột → Có thể đổi người

Văn bản:
${text}

QUAN TRỌNG: Chỉ trả về format chuẩn, mỗi câu một dòng!`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `Bạn là chuyên gia phân tích hội thoại tiếng Việt với khả năng:
- Nhận diện người nói qua ngữ cảnh
- Phân biệt giới tính qua cách xưng hô và từ ngữ
- Phân đoạn chính xác nội dung theo người nói
Trả lời ngắn gọn, chính xác theo format yêu cầu.`,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.2, // Low temp for consistency
        })

        const result = response.choices[0].message.content || text

        // Parse result into segments
        const lines = result.split('\n').filter((line) => line.trim())
        const segments: Array<{
            timestamp: string
            speaker: string
            text: string
            gender: 'male' | 'female'
        }> = []

        lines.forEach((line) => {
            // Match format: [00:00] Nam 1: Text
            const match = line.match(/\[(\d{2}:\d{2})\]\s*(Nam|Nữ)\s*(\d+):\s*(.+)/)
            if (match) {
                const [, timestamp, genderText, speakerNum, text] = match
                segments.push({
                    timestamp,
                    speaker: `${genderText} ${speakerNum}`,
                    text: text.trim(),
                    gender: genderText === 'Nam' ? 'male' : 'female',
                })
            }
        })

        // Fallback if parsing fails
        if (segments.length === 0) {
            return [
                {
                    timestamp: '00:00',
                    speaker: 'Nam 1',
                    text: text,
                    gender: 'male',
                },
            ]
        }

        return segments
    } catch (error) {
        console.error('Speaker detection error:', error)
        // Fallback: return text as single segment
        return [
            {
                timestamp: '00:00',
                speaker: 'Nam 1',
                text: text,
                gender: 'male',
            },
        ]
    }
}

// Generate AI summary
export async function generateSummary(text: string): Promise<string> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY
        if (!apiKey) throw new Error('API key missing')

        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Bạn là trợ lý AI chuyên tóm tắt nội dung. Hãy tóm tắt ngắn gọn, súc tích các ý chính.',
                },
                {
                    role: 'user',
                    content: `Tóm tắt nội dung sau thành 2-3 câu ngắn gọn:\n\n${text}`,
                },
            ],
            temperature: 0.5,
            max_tokens: 200,
        })

        return response.choices[0].message.content || 'Không thể tạo tóm tắt'
    } catch (error) {
        console.error('Summary error:', error)
        return 'Lỗi khi tạo tóm tắt'
    }
}

// Suggest labels based on content
export async function suggestLabels(text: string): Promise<string[]> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY
        if (!apiKey) throw new Error('API key missing')

        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Phân tích nội dung và đề xuất 3-5 nhãn (tags) phù hợp. Chỉ trả về danh sách các từ khóa, cách nhau bởi dấu phẩy.',
                },
                {
                    role: 'user',
                    content: text,
                },
            ],
            temperature: 0.3,
            max_tokens: 50,
        })

        const result = response.choices[0].message.content || ''
        return result.split(',').map((l) => l.trim()).filter(Boolean)
    } catch (error) {
        console.error('Label suggestion error:', error)
        return []
    }
}
