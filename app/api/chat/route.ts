import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as { messages?: ChatMessage[] };
    if (!messages?.length || messages.some((message) => !message.content?.trim())) {
      return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is missing. Add it to .env.local and restart the server." }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const history = messages.slice(0, -1).map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] }));
    const chat = model.startChat({ history, generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return NextResponse.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Gemini request failed", error);
    return NextResponse.json({ error: "Gemini could not complete that request. Please try again." }, { status: 500 });
  }
}