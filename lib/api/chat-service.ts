/*
IMPORTANT NOTICE: DO NOT REMOVE
./src/api/chat-service.ts
If the user wants to use AI to generate text, answer questions, or analyze images you can use the functions defined in this file to communicate with the OpenAI and Grok APIs.
*/
import { AIMessage, AIRequestOptions, AIResponse } from "../types/ai";
import { getOpenAIClient } from "./openai";
import { getGrokClient } from "./grok";

/**
 * Get a text response from OpenAI
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getOpenAITextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const client = getOpenAIClient();
    const defaultModel = "gpt-4o"; //accepts images as well, use this for image analysis

    const response = await client.chat.completions.create({
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from OpenAI
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getOpenAIChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getOpenAITextResponse([{ role: "user", content: prompt }]);
};

/**
 * Get a text response from Grok
 * @param messages - The messages to send to the AI
 * @param options - The options for the request
 * @returns The response from the AI
 */
export const getGrokTextResponse = async (messages: AIMessage[], options?: AIRequestOptions): Promise<AIResponse> => {
  try {
    const client = getGrokClient();
    const defaultModel = "grok-3-beta";

    const response = await client.chat.completions.create({
      model: options?.model || defaultModel,
      messages: messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens || 2048,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("Grok API Error:", error);
    throw error;
  }
};

/**
 * Get a simple chat response from Grok
 * @param prompt - The prompt to send to the AI
 * @returns The response from the AI
 */
export const getGrokChatResponse = async (prompt: string): Promise<AIResponse> => {
  return await getGrokTextResponse([{ role: "user", content: prompt }]);
};

/**
 * Phân tích số người nói trong văn bản transcription
 * @param transcriptionText - Văn bản đã được chuyển đổi từ ghi âm
 * @param duration - Thời lượng ghi âm (giây)
 * @returns Thông tin về số người nói và phân đoạn
 */
export interface SpeakerAnalysis {
  speakerCount: number;
  speakers: {
    id: string;
    label: string;
    gender: "male" | "female" | "unknown";
    genderReason?: string;
    segments: {
      text: string;
      startTime: string;
    }[];
  }[];
  formattedText: string;
}

/**
 * So sánh khuôn mặt để xác thực đăng nhập
 * @param capturedFaceBase64 - Ảnh khuôn mặt vừa chụp (base64)
 * @param storedFaceBase64 - Ảnh khuôn mặt đã lưu (base64)
 * @returns Kết quả so sánh
 */
export interface FaceCompareResult {
  isMatch: boolean;
  confidence: number;
  message: string;
}

export const compareFaces = async (
  capturedFaceBase64: string,
  storedFaceBase64: string
): Promise<FaceCompareResult> => {
  try {
    const response = await getOpenAITextResponse([
      {
        role: "system",
        content: `You are an expert facial recognition system. Your task is to compare two face images and determine if they are the SAME PERSON.

IMPORTANT GUIDELINES:
1. Focus on PERMANENT facial features that don't change with lighting, angle, or expression:
   - Face shape (oval, round, square, heart, oblong)
   - Eye shape and spacing (wide-set, close-set, almond, round)
   - Nose shape and size (bridge width, nostril shape, tip)
   - Mouth shape and lip fullness
   - Eyebrow shape and position
   - Chin shape and jawline
   - Ear shape and size (if visible)
   - Distinctive features (moles, birthmarks, dimples)

2. BE TOLERANT of:
   - Different lighting conditions (indoor/outdoor, flash/no flash)
   - Different angles (up to 45 degrees left/right, up/down)
   - Different expressions (smiling, neutral, serious)
   - Different image quality or resolution
   - Hair style changes
   - Glasses on/off
   - Makeup differences

3. For matching decision:
   - If 5+ key facial features match strongly → isMatch: true
   - If core structure (eyes, nose, mouth triangle) matches → likely same person
   - Consider overall face proportions and geometry`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Compare these two face images carefully. The first image is a LIVE capture from camera, the second is a STORED reference photo.

Analyze and compare:
1. Face shape and structure
2. Eyes (shape, size, spacing, color if visible)
3. Nose (bridge, width, tip shape)
4. Mouth and lips
5. Eyebrows
6. Any distinctive features

Return JSON format ONLY:
{
  "isMatch": true/false,
  "confidence": 0-100,
  "message": "Explanation in Vietnamese about why they match or don't match"
}

Be GENEROUS with matching - real face recognition systems allow for some variation. If the overall person looks the same, return isMatch: true with appropriate confidence.`
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${capturedFaceBase64}` }
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${storedFaceBase64}` }
          }
        ] as any
      }
    ], { temperature: 0.1, maxTokens: 500 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as FaceCompareResult;
      // Boost confidence slightly for better UX if it's a match
      if (result.isMatch && result.confidence < 85) {
        result.confidence = Math.min(result.confidence + 10, 95);
      }
      return result;
    }

    return {
      isMatch: false,
      confidence: 0,
      message: "Không thể phân tích khuôn mặt"
    };
  } catch (error) {
    console.error("Face comparison error:", error);
    return {
      isMatch: false,
      confidence: 0,
      message: "Lỗi khi so sánh khuôn mặt"
    };
  }
};

/**
 * Phát hiện và cắt khuôn mặt từ ảnh
 * @param imageBase64 - Ảnh gốc (base64)
 * @returns Thông tin về khuôn mặt
 */
export interface FaceDetectionResult {
  hasFace: boolean;
  faceCount: number;
  gender?: "male" | "female" | "unknown";
  message: string;
}

export const detectFace = async (imageBase64: string): Promise<FaceDetectionResult> => {
  try {
    const response = await getOpenAITextResponse([
      {
        role: "system",
        content: "You are a face detection expert. Analyze images to detect faces and determine gender."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Detect faces in this image. Return JSON: {\"hasFace\": boolean, \"faceCount\": number, \"gender\": \"male\"|\"female\"|\"unknown\", \"message\": \"description in Vietnamese\"}"
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ] as any
      }
    ], { temperature: 0.1 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as FaceDetectionResult;
    }

    return {
      hasFace: false,
      faceCount: 0,
      message: "Không thể phát hiện khuôn mặt"
    };
  } catch (error) {
    console.error("Face detection error:", error);
    return {
      hasFace: false,
      faceCount: 0,
      message: "Lỗi khi phát hiện khuôn mặt"
    };
  }
};

/**
 * Phân tích chi tiết đặc điểm khuôn mặt để lưu trữ
 * @param imageBase64 - Ảnh khuôn mặt (base64)
 * @returns Đặc điểm chi tiết của khuôn mặt
 */
export interface FaceFeatures {
  faceShape: string;
  eyeShape: string;
  eyeSpacing: string;
  noseShape: string;
  noseSize: string;
  lipShape: string;
  eyebrowShape: string;
  chinShape: string;
  jawline: string;
  distinctiveFeatures: string[];
  skinTone: string;
  facialHair?: string;
  estimatedAge: string;
  additionalNotes: string;
}

export const analyzeFaceFeatures = async (imageBase64: string): Promise<FaceFeatures | null> => {
  try {
    const response = await getOpenAITextResponse([
      {
        role: "system",
        content: `You are an expert facial feature analyst. Your task is to analyze a face image and extract detailed, PERMANENT facial features that can be used for identification.

Focus on features that remain consistent regardless of:
- Lighting conditions
- Camera angle (within reason)
- Facial expression
- Makeup or accessories

Be very specific and detailed in your analysis.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this face image and extract detailed facial features. Be VERY specific and detailed.

Return JSON format ONLY:
{
  "faceShape": "oval/round/square/heart/oblong/diamond",
  "eyeShape": "almond/round/hooded/monolid/downturned/upturned",
  "eyeSpacing": "wide-set/average/close-set",
  "noseShape": "straight/curved/roman/button/hawk/snub",
  "noseSize": "small/medium/large",
  "lipShape": "thin/medium/full/heart-shaped/bow-shaped",
  "eyebrowShape": "arched/straight/curved/s-shaped/thick/thin/bushy",
  "chinShape": "pointed/round/square/cleft",
  "jawline": "sharp/soft/square/round/v-shaped",
  "distinctiveFeatures": ["list any moles, dimples, scars, birthmarks, freckles with their location"],
  "skinTone": "very fair/fair/light/medium/olive/tan/brown/dark",
  "facialHair": "none/light stubble/heavy stubble/mustache/beard/goatee/full beard" (if applicable),
  "estimatedAge": "teenager/young adult (20-30)/adult (30-45)/middle-aged (45-60)/mature (60+)",
  "additionalNotes": "any other distinctive features like face symmetry, unique bone structure, prominent features etc."
}`
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          }
        ] as any
      }
    ], { temperature: 0.1, maxTokens: 800 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as FaceFeatures;
    }

    return null;
  } catch (error) {
    console.error("Face feature analysis error:", error);
    return null;
  }
};

/**
 * So sánh khuôn mặt dựa trên đặc điểm đã lưu
 * @param capturedFaceBase64 - Ảnh khuôn mặt vừa chụp
 * @param storedFaceBase64 - Ảnh khuôn mặt đã lưu
 * @param storedFeatures - Đặc điểm khuôn mặt đã phân tích trước đó
 */
export const compareFacesWithFeatures = async (
  capturedFaceBase64: string,
  storedFaceBase64: string,
  storedFeatures?: FaceFeatures
): Promise<FaceCompareResult> => {
  try {
    let featuresPrompt = "";
    if (storedFeatures) {
      featuresPrompt = `

STORED FACE FEATURES (analyzed previously - use this as PRIMARY reference):
- Face shape: ${storedFeatures.faceShape}
- Eye shape: ${storedFeatures.eyeShape}, spacing: ${storedFeatures.eyeSpacing}
- Nose: ${storedFeatures.noseShape}, size: ${storedFeatures.noseSize}
- Lips: ${storedFeatures.lipShape}
- Eyebrows: ${storedFeatures.eyebrowShape}
- Chin: ${storedFeatures.chinShape}
- Jawline: ${storedFeatures.jawline}
- Distinctive features: ${storedFeatures.distinctiveFeatures?.join(", ") || "none noted"}
- Skin tone: ${storedFeatures.skinTone}
- Facial hair: ${storedFeatures.facialHair || "none"}
- Age range: ${storedFeatures.estimatedAge}
- Additional notes: ${storedFeatures.additionalNotes}

IMPORTANT: These features are the GROUND TRUTH. Compare the LIVE captured image primarily against these stored features.`;
    }

    const response = await getOpenAITextResponse([
      {
        role: "system",
        content: `You are an expert facial recognition system designed to be GENEROUS and FORGIVING in matching faces.

YOUR PRIMARY GOAL: Verify if the LIVE captured face belongs to the same person as the STORED reference. You should LEAN TOWARD MATCHING when the core features align.

KEY PRINCIPLES:
1. Focus on PERMANENT structural features that don't change:
   - Overall face shape and proportions
   - Eye shape, size, and relative position
   - Nose bridge and overall structure
   - Mouth shape and lip fullness
   - Eyebrow shape
   - Jawline and chin structure

2. BE VERY TOLERANT of these variations:
   - Different lighting (indoor/outdoor, shadows, brightness)
   - Different camera angles (up to 45 degrees)
   - Different expressions (smiling vs neutral)
   - Different image quality or resolution
   - Slight distance differences from camera
   - Hair style changes
   - Glasses on/off
   - Makeup differences
   - Minor skin condition changes

3. MATCHING DECISION RULES:
   - If overall face proportions look similar → MATCH (confidence 70+)
   - If 4+ key features match → MATCH (confidence 75+)
   - If eyes + nose + mouth triangle matches → MATCH (confidence 80+)
   - If the person LOOKS LIKE the same individual → MATCH
   - Only return isMatch: false if faces are CLEARLY different people

BIAS TOWARD MATCHING: When uncertain, prefer to match with moderate confidence rather than reject.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Compare these two face images. Image 1 is LIVE capture (just taken), Image 2 is STORED reference.${featuresPrompt}

TASK: Determine if these are the SAME PERSON.

Analysis steps:
1. Compare overall face shape
2. Compare eyes (shape, spacing)
3. Compare nose structure
4. Compare mouth/lips
5. Compare jawline/chin
6. Look for matching distinctive features

Return JSON format ONLY:
{
  "isMatch": true/false,
  "confidence": 0-100,
  "matchedFeatures": ["list features that match"],
  "differentFeatures": ["list features that differ significantly"],
  "message": "Brief explanation in Vietnamese"
}

REMEMBER: Be GENEROUS. Real face recognition allows for significant variation. If unsure but looks similar, return isMatch: true with confidence 65-75.`
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${capturedFaceBase64}` }
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${storedFaceBase64}` }
          }
        ] as any
      }
    ], { temperature: 0.1, maxTokens: 600 });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      // Boost confidence for better UX if it's a close match
      let finalConfidence = result.confidence;
      if (result.isMatch) {
        if (finalConfidence < 70) finalConfidence = 70;
        if (finalConfidence < 85) finalConfidence = Math.min(finalConfidence + 10, 95);
      }
      return {
        isMatch: result.isMatch,
        confidence: finalConfidence,
        message: result.message
      };
    }

    return {
      isMatch: false,
      confidence: 0,
      message: "Không thể phân tích khuôn mặt"
    };
  } catch (error) {
    console.error("Face comparison error:", error);
    return {
      isMatch: false,
      confidence: 0,
      message: "Lỗi khi so sánh khuôn mặt"
    };
  }
};

export const analyzeSpeakers = async (transcriptionText: string, duration: number): Promise<SpeakerAnalysis> => {
  try {
    const prompt = `Phân tích đoạn văn bản tiếng Việt sau được chuyển đổi từ ghi âm cuộc trò chuyện.

**NHIỆM VỤ CHÍNH:**

1. **XÁC ĐỊNH SỐ NGƯỜI NÓI** - RẤT QUAN TRỌNG:

   **DẤU HIỆU CÓ NHIỀU NGƯỜI NÓI:**
   - Có câu hỏi và câu trả lời (hỏi-đáp)
   - Có đối thoại qua lại giữa các bên
   - Có các cách xưng hô khác nhau (anh/em, chị/em, tôi/bạn)
   - Có sự thay đổi chủ đề hoặc góc nhìn
   - Có các từ như "ừ", "vâng", "được", "à" xen kẽ
   - Nội dung có tính chất trao đổi, thảo luận

   **DẤU HIỆU CHỈ CÓ 1 NGƯỜI NÓI:**
   - Văn bản liên tục, không có đối thoại
   - Chỉ có một góc nhìn, một cách xưng hô
   - Nội dung độc thoại, kể chuyện, thuyết trình
   - Không có dấu hiệu phản hồi từ người khác

2. **PHÂN CHIA VĂN BẢN** theo từng người nói:
   - Mỗi lượt nói là một segment
   - Xác định ai nói câu nào dựa trên ngữ cảnh

3. **XÁC ĐỊNH GIỚI TÍNH** cho từng người:

   **NAM (male):**
   - Tự xưng: "anh", "tao", "tớ", "ông", "bố", "ba"
   - Được gọi: "anh", "ông", "chú", "bác", "cậu"
   - Nói về: "vợ tôi", "bạn gái", "cô ấy" (người yêu)

   **NỮ (female):**
   - Tự xưng: "chị", "em", "tôi" (nữ), "mình", "mẹ", "má"
   - Được gọi: "chị", "cô", "bà", "dì", "em gái"
   - Nói về: "chồng tôi", "bạn trai", "anh ấy" (người yêu)

   **QUY TẮC:**
   - Người A gọi B là "anh" → B là NAM
   - Người A gọi B là "chị" → B là NỮ
   - Người A tự xưng "anh" với B → A là NAM
   - Người A tự xưng "chị" với B → A là NỮ

**VĂN BẢN CẦN PHÂN TÍCH:**
"${transcriptionText}"

**THỜI LƯỢNG GHI ÂM:** ${duration} giây

**TRẢ VỀ JSON:**
{
  "speakerCount": <số người nói - ít nhất là 1>,
  "speakers": [
    {
      "id": "speaker_1",
      "label": "Tên hoặc vai trò (VD: Anh Nam, Chị bán hàng, Người 1)",
      "gender": "male" | "female" | "unknown",
      "genderReason": "Lý do: tự xưng là anh, được gọi là chị...",
      "segments": [
        {"text": "câu người này nói", "startTime": "00:00"}
      ]
    }
  ],
  "formattedText": "[Người 1 - Nam]: câu 1... [Người 2 - Nữ]: câu 2..."
}

**LƯU Ý QUAN TRỌNG:**
- Đọc KỸ văn bản để xác định CHÍNH XÁC có bao nhiêu người
- Nếu có đối thoại qua lại → chắc chắn có ít nhất 2 người
- Xác định giới tính dựa trên cách xưng hô trong văn bản`;

    const response = await getOpenAITextResponse([
      {
        role: "system",
        content: `Bạn là chuyên gia phân tích hội thoại tiếng Việt.

NHIỆM VỤ QUAN TRỌNG NHẤT:
1. Xác định CHÍNH XÁC số người nói trong cuộc hội thoại
2. Xác định GIỚI TÍNH của từng người dựa trên cách xưng hô

QUY TẮC XÁC ĐỊNH SỐ NGƯỜI:
- Nếu có hỏi-đáp, đối thoại → ít nhất 2 người
- Nếu có "anh" nói với "em" → 2 người
- Nếu chỉ độc thoại, kể chuyện → 1 người

QUY TẮC GIỚI TÍNH:
- "anh", "ông", "chú" = NAM
- "chị", "cô", "bà" = NỮ
- Người nói về vợ/bạn gái = NAM
- Người nói về chồng/bạn trai = NỮ

Trả về JSON hợp lệ.`
      },
      { role: "user", content: prompt }
    ], { temperature: 0.2, maxTokens: 2048 });

    // Parse JSON từ response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as SpeakerAnalysis;
      // Đảm bảo speakerCount khớp với số speakers
      if (result.speakers && result.speakers.length > 0) {
        result.speakerCount = result.speakers.length;
      }
      return result;
    }

    // Fallback nếu không parse được
    return {
      speakerCount: 1,
      speakers: [{
        id: "speaker_1",
        label: "Người nói",
        gender: "unknown",
        segments: [{ text: transcriptionText, startTime: "00:00" }]
      }],
      formattedText: transcriptionText
    };
  } catch (error) {
    console.error("Speaker analysis error:", error);
    // Fallback
    return {
      speakerCount: 1,
      speakers: [{
        id: "speaker_1",
        label: "Người nói",
        gender: "unknown",
        segments: [{ text: transcriptionText, startTime: "00:00" }]
      }],
      formattedText: transcriptionText
    };
  }
};
