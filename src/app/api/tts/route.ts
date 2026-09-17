import { NextRequest, NextResponse } from "next/server";

const EDGE_VOICE_MAP: Record<string, string> = {
  nova: "en-US-JennyNeural",
  alloy: "en-US-AriaNeural",
  echo: "en-US-GuyNeural",
  fable: "en-US-SaraNeural",
  onyx: "en-US-DavisNeural",
  shimmer: "en-US-AmberNeural",
};

async function generateWithEdgeTTS(text: string, voice: string): Promise<Buffer> {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tts = new MsEdgeTTS();
  const edgeVoice = EDGE_VOICE_MAP[voice] || "en-US-JennyNeural";
  await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  tts.close();
  return Buffer.concat(chunks);
}

async function generateWithOpenAI(text: string, voice: string): Promise<Buffer> {
  const OpenAI = (await import("openai")).default;

  if (process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice as "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer",
      input: text,
      response_format: "mp3",
    });
    return Buffer.from(await response.arrayBuffer());
  }

  if (process.env.AZURE_OPENAI_API_KEY) {
    const { AzureOpenAI } = await import("openai");
    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: "2025-04-01-preview",
      deployment: process.env.AZURE_OPENAI_TTS_DEPLOYMENT || "tts",
    });
    const response = await client.audio.speech.create({
      model: "tts-1",
      voice: voice as "nova" | "alloy" | "echo" | "fable" | "onyx" | "shimmer",
      input: text,
      response_format: "mp3",
    });
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("no-openai-key");
}

export async function POST(req: NextRequest) {
  const { text, voice = "nova", provider } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    let audioBuffer: Buffer;

    if (provider === "openai" && (process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY)) {
      audioBuffer = await generateWithOpenAI(text, voice);
    } else {
      audioBuffer = await generateWithEdgeTTS(text, voice);
    }

    const base64 = audioBuffer.toString("base64");
    return NextResponse.json({
      audio: `data:audio/mp3;base64,${base64}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("TTS generation failed:", message);
    return NextResponse.json(
      { error: `TTS failed: ${message}` },
      { status: 500 },
    );
  }
}
