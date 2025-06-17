import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const API_KEY: string = process.env.GOOGLE_API_KEY!;

if (!API_KEY) {
  console.error(
    "Erro: GOOGLE_API_KEY não está configurada no ambiente do servidor."
  );
  NextResponse.json(
    { error: "Configuração de API inválida no servidor." },
    { status: 500 }
  );
}

const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(API_KEY);
const model: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export async function POST(request: NextRequest) {
  try {
    const { promptText } = await request.json();

    if (!promptText || typeof promptText !== "string") {
      return NextResponse.json(
        { error: "Prompt de texto inválido fornecido." },
        { status: 400 }
      );
    }

    const result = await model.generateContent(promptText);
    const generatedContent = result.response.text();

    return NextResponse.json({ content: generatedContent });
  } catch (error) {
    console.error("Erro ao chamar a Gemini API via Route Handler:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar sua requisição." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Este é um endpoint para gerar conteúdo com POST.",
  });
}
