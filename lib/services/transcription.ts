import OpenAI from 'openai'

export interface TranscriptionSegment {
    timestamp: string
    speaker: string
    text: string
    gender: 'male' | 'female' | 'unknown'
    genderReason?: string // Lý do xác định giới tính
}

export async function transcribeAudio(audioBlob: Blob): Promise<{
    text: string
    segments: TranscriptionSegment[]
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
        let rawText = transcription.text

        // Auto spell correction
        rawText = await correctVietnameseText(rawText, openai)

        // Speaker diarization với AI - enhanced
        const segments = await detectSpeakersEnhanced(rawText, openai)

        return {
            text: rawText,
            segments,
        }
    } catch (error) {
        console.error('Transcription error:', error)
        throw error
    }
}

// Sửa lỗi chính tả tự động
async function correctVietnameseText(text: string, openai: OpenAI): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `Bạn là chuyên gia chỉnh sửa văn bản tiếng Việt. Nhiệm vụ:

1. SỬA LỖI CHÍNH TẢ:
   - Thêm đúng dấu thanh: sắc, huyền, hỏi, ngã, nặng
   - Sửa từ sai: "toi" → "tôi", "ban" → "bạn", "khong" → "không"

2. THÊM DẤU CÂU:
   - Dấu chấm (.) khi kết thúc câu
   - Dấu phẩy (,) khi ngắt ý
   - Dấu hỏi (?) cho câu hỏi
   - Dấu than (!) cho cảm thán

3. VIẾT HOA:
   - Chữ đầu câu
   - Tên riêng, địa danh

4. GIỮ NGUYÊN ý nghĩa - KHÔNG thêm bớt

Chỉ trả về văn bản đã sửa, không giải thích.`
                },
                {
                    role: 'user',
                    content: `Chỉnh sửa văn bản sau:\n\n${text}`
                }
            ],
            temperature: 0.1,
        })

        return response.choices[0].message.content?.trim() || text
    } catch (error) {
        console.error('Spell correction error:', error)
        return text // Return original if fails
    }
}

// Enhanced speaker detection với gender reason
async function detectSpeakersEnhanced(
    text: string,
    openai: OpenAI
): Promise<TranscriptionSegment[]> {
    try {
        const prompt = `Phân tích hội thoại tiếng Việt - Xác định người nói và giới tính:

## NHIỆM VỤ:
1. **Số người nói**:
   - Có hỏi-đáp qua lại → ít nhất 2 người
   - Có "anh" nói với "em" → 2 người  
   - Độc thoại, kể chuyện → 1 người
   - Các từ xen kẽ "ừ", "vâng" → nhiều người

2. **Giới tính** (quan trọng!):
   - **NAM**: tự xưng "anh", "tao", "ông" | được gọi "anh", "chú"
   - **NỮ**: tự xưng "chị", "em", "mình" | được gọi "chị", "cô"
   - **UNKNOWN**: không xác định được

3. **Format** (BẮT BUỘC):
[MM:SS] [Nam|Nữ|Unknown] [Số]: Nội dung | Lý do: [lý do xác định giới tính]

Ví dụ:
[00:00] Nam 1: Xin chào mọi người | Lý do: tự xưng "tôi" (nam)
[00:03] Nữ 1: Chào anh, em khỏe | Lý do: tự xưng "em", gọi đối phương "anh"
[00:07] Unknown 1: Hôm nay thế nào? | Lý do: không đủ thông tin

## DẤU HIỆU:
- Câu hỏi/trả lời → đổi người
- Xưng hô thay đổi → đổi người
- "Ừ", "vâng", "được" → phản hồi của người khác

Văn bản:
${text}

QUAN TRỌNG: Mỗi câu một dòng theo đúng format!`

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `Bạn là chuyên gia phân tích hội thoại tiếng Việt:
- Nhận diện người nói qua ngữ cảnh, xưng hô
- Phân biệt giới tính CHÍNH XÁC qua từ ngữ
- THIÊN về xác định rõ ràng thay vì "Unknown"
- Giải thích lý do xác định giới tính
Trả lời ngắn gọn theo format.`
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.2,
        })

        const result = response.choices[0].message.content || text
        const lines = result.split('\n').filter((line) => line.trim())
        const segments: TranscriptionSegment[] = []

        lines.forEach((line) => {
            // Match: [00:00] Nam 1: Text | Lý do: reason
            const match = line.match(/\[(\d{2}:\d{2})\]\s*(Nam|Nữ|Unknown)\s*(\d+):\s*([^|]+)(?:\|\s*Lý do:\s*(.+))?/)
            if (match) {
                const [, timestamp, genderText, speakerNum, text, reason] = match

                let gender: 'male' | 'female' | 'unknown' = 'unknown'
                if (genderText === 'Nam') gender = 'male'
                else if (genderText === 'Nữ') gender = 'female'

                segments.push({
                    timestamp,
                    speaker: `${genderText} ${speakerNum}`,
                    text: text.trim(),
                    gender,
                    genderReason: reason?.trim() || 'Không có thông tin',
                })
            }
        })

        // Fallback
        if (segments.length === 0) {
            return [
                {
                    timestamp: '00:00',
                    speaker: 'Unknown 1',
                    text: text,
                    gender: 'unknown',
                    genderReason: 'Không đủ thông tin để xác định',
                },
            ]
        }

        return segments
    } catch (error) {
        console.error('Speaker detection error:', error)
        return [
            {
                timestamp: '00:00',
                speaker: 'Unknown 1',
                text: text,
                gender: 'unknown',
                genderReason: 'Lỗi khi phân tích',
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
