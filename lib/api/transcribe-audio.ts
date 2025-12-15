/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom audio transcription service that uses a custom API endpoint maintained by Vibecode.
You can use this function to transcribe audio files, and it will return the text of the audio file.
*/

import { getOpenAITextResponse } from "./chat-service";

/**
 * Transcribe an audio file
 * @param localAudioUri - The local URI of the audio file to transcribe. Obtained via the expo-av library.
 * @returns The text of the audio file
 */
export const transcribeAudio = async (localAudioUri: string) => {
  try {
    // Create FormData for the audio file
    const formData = new FormData();
    formData.append("file", {
      uri: localAudioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);
    formData.append("model", "gpt-4o-transcribe");
    formData.append("language", "vi");
    // Thêm prompt để transcribe chính xác tiếng Việt với dấu câu
    formData.append("prompt", "Đây là đoạn ghi âm tiếng Việt. Hãy chuyển đổi chính xác toàn bộ nội dung sang văn bản tiếng Việt chuẩn với đầy đủ dấu thanh (sắc, huyền, hỏi, ngã, nặng). Sử dụng dấu chấm (.) khi kết thúc câu, dấu phẩy (,) khi ngắt ý, dấu chấm hỏi (?) cho câu hỏi. Giữ nguyên mọi từ, không bỏ sót nội dung nào.");

    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    // API call to OpenAI's gpt-4o-transcribe
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const result = await response.json();
    const rawText = result.text;

    // Post-process: Correct Vietnamese text and add punctuation using AI
    const correctedText = await correctVietnameseText(rawText);
    return correctedText;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};

/**
 * Correct Vietnamese text - fix spelling, add proper punctuation
 * @param text - Raw transcription text
 * @returns Corrected Vietnamese text
 */
const correctVietnameseText = async (text: string): Promise<string> => {
  try {
    const response = await getOpenAITextResponse([
      {
        role: "system",
        content: `Bạn là chuyên gia chỉnh sửa văn bản tiếng Việt. Nhiệm vụ của bạn là:

1. SỬA LỖI CHÍNH TẢ tiếng Việt:
   - Thêm đúng dấu thanh (sắc, huyền, hỏi, ngã, nặng)
   - Sửa các từ sai chính tả thành từ đúng
   - Ví dụ: "toi" → "tôi", "ban" → "bạn", "khong" → "không"

2. THÊM DẤU CÂU phù hợp:
   - Dấu chấm (.) khi kết thúc câu hoàn chỉnh
   - Dấu phẩy (,) khi ngắt ý, liệt kê
   - Dấu chấm hỏi (?) cho câu hỏi
   - Dấu chấm than (!) cho câu cảm thán

3. VIẾT HOA đúng quy tắc:
   - Chữ cái đầu câu
   - Tên riêng

4. GIỮ NGUYÊN ý nghĩa và nội dung gốc - KHÔNG thêm bớt từ ngữ

Chỉ trả về văn bản đã được chỉnh sửa, không giải thích gì thêm.`
      },
      {
        role: "user",
        content: `Chỉnh sửa văn bản sau:\n\n${text}`
      }
    ], { temperature: 0.1, maxTokens: 4096 });

    return response.content.trim();
  } catch (error) {
    console.error("Text correction error:", error);
    // Return original text if correction fails
    return text;
  }
};
