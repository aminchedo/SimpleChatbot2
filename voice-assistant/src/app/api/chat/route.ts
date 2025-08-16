import { NextRequest, NextResponse } from 'next/server';

const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
const NLU_MODEL_URL = "https://api-inference.huggingface.co/models/HooshvareLab/bert-fa-zwnj-base-ner";
const PRIMARY_TTS_MODEL_URL = "https://api-inference.huggingface.co/models/hassan-k/vits-fa";
const BACKUP_TTS_MODEL_URL = "https://api-inference.huggingface.co/models/Kamtera/persian-tts-female-vits";

async function queryHuggingFace(modelUrl: string, data: any) {
  const response = await fetch(
    modelUrl,
    {
      headers: {
        "Authorization": `Bearer ${HUGGING_FACE_TOKEN}`,
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Hugging Face API error for ${modelUrl}: ${response.status} ${response.statusText}`, {error: errorText});
    throw new Error(`Failed to query model ${modelUrl}.`);
  }
  return response;
}


export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!HUGGING_FACE_TOKEN) {
        console.error("Hugging Face token is not configured.");
        return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
    }

    // 1. NLU with pars-bert
    let botResponseText = `متوجه نشدم. میشه دوباره بگی؟`; // Default response
    try {
      const nluResponse = await queryHuggingFace(NLU_MODEL_URL, { inputs: text });
      const nluResult = await nluResponse.json();

      // Find a person's name in the NLU result
      const personEntity = nluResult.find((entity: any) => entity.entity_group === 'PER');
      if (personEntity) {
        botResponseText = `سلام ${personEntity.word}! خوشبختم از آشناییت.`;
      } else {
        // Fallback response if no name is found
        botResponseText = `جالب بود. در مورد چیز دیگه‌ای صحبت کنیم؟`;
      }
    } catch (nluError) {
      console.error("NLU processing failed:", nluError);
      // If NLU fails, we can use a simple echo as a fallback
      botResponseText = `پردازش زبان به مشکل خورد. شما گفتید: "${text}"`;
    }


    // 2. Call TTS model to get audio with fallback
    const audioBlob = await generateAudioWithFallback(botResponseText);

    // 3. Convert audio blob to base64 to send as JSON
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // 4. Send response to client
    return NextResponse.json({
      text: botResponseText,
      audio: audioBase64,
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

async function generateAudioWithFallback(text: string): Promise<Blob> {
  try {
    // Try primary model first
    console.log("Attempting to use primary TTS model...");
    const primaryResponse = await queryHuggingFace(PRIMARY_TTS_MODEL_URL, { inputs: text });
    return await primaryResponse.blob();
  } catch (primaryError) {
    console.warn("Primary TTS model failed. Attempting backup model.", primaryError);
    try {
      // If primary fails, try backup model
      console.log("Attempting to use backup TTS model...");
      const backupResponse = await queryHuggingFace(BACKUP_TTS_MODEL_URL, { inputs: text });
      return await backupResponse.blob();
    } catch (backupError) {
      console.error("Backup TTS model also failed.", backupError);
      // If both fail, throw an error to be caught by the main handler
      throw new Error("Both primary and backup TTS models failed.");
    }
  }
}
