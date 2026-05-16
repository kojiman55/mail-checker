import { GoogleGenerativeAI } from "@google/generative-ai";
import { ReviewIssue } from "../types";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function reviewEmail(
  text: string,
  language: "ja" | "en"
): Promise<{ correctedText: string; issues: ReviewIssue[]; summary: string }> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = language === "ja" ? buildJaPrompt(text) : buildEnPrompt(text);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Gemini returned unexpected format");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    correctedText: parsed.correctedText ?? text,
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    summary: parsed.summary ?? "",
  };
}

function buildJaPrompt(text: string): string {
  return `以下のビジネスメールを添削してください。

【チェック観点】
1. 敬語の正確さ（尊敬語・謙譲語・丁寧語の使い分け、二重敬語の検出）
2. 主語と動詞の対応（相手の動作に謙譲語を使っていないか等）
3. 定型表現の適切さ（書き出し・締めの慣用句）
4. 冗長表現（「〜させていただく」多用、重複表現）
5. 文体の統一（です・ます調の混在）
6. 全体の印象・失礼な表現がないか

以下のJSON形式のみで返してください（説明文は不要）：
{
  "correctedText": "添削後の全文",
  "issues": [
    {"type": "error", "original": "問題の表現", "suggestion": "修正案", "reason": "指摘理由"}
  ],
  "summary": "総評（2〜3文）"
}

typeの値: "error"=明確な誤り / "warning"=改善推奨 / "info"=参考情報

メール本文:
${text}`;
}

function buildEnPrompt(text: string): string {
  return `以下の英文ビジネスメールを添削してください。

【チェック観点】
1. 文法・スペル・句読点の誤り
2. トーンと丁寧さ（"Hey"・"ASAP"等のカジュアル表現の検出）
3. 明確さと簡潔さ（冗長な文・曖昧な表現）
4. ビジネスメール定型表現の適切さ（書き出し・締め）
5. 全体的なプロフェッショナリズムと礼儀

以下のJSON形式のみで返してください（説明文は不要）：
{
  "correctedText": "添削後の英文全文（英語のまま）",
  "issues": [
    {"type": "error", "original": "問題の表現", "suggestion": "修正案（英語）", "reason": "指摘理由（日本語）"}
  ],
  "summary": "総評（日本語、2〜3文）"
}

typeの値: "error"=明確な誤り / "warning"=改善推奨 / "info"=参考情報

メール本文:
${text}`;
}
