import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { reviewEmail } from "../services/geminiApi";
import { ReviewRequest, ReviewResponse } from "../types";

const ALLOWED_ORIGINS = [
  "https://mail-checker.eggsystems.jp",
];

function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost"))
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const corsHeaders = getCorsHeaders(event.headers?.origin ?? event.headers?.Origin);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const req: ReviewRequest = JSON.parse(event.body ?? "{}");

    if (!req.text?.trim()) {
      return respond(400, { status: "error", message: "メール本文を入力してください" }, corsHeaders);
    }
    if (req.language !== "ja" && req.language !== "en") {
      return respond(400, { status: "error", message: "language は 'ja' または 'en' を指定してください" }, corsHeaders);
    }
    if (req.text.length > 5000) {
      return respond(400, { status: "error", message: "メール本文は5,000文字以内で入力してください" }, corsHeaders);
    }

    const result = await reviewEmail(req.text, req.language);
    return respond(200, { status: "success", ...result }, corsHeaders);
  } catch (err) {
    console.error("review handler error:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("503") || msg.includes("high demand") || msg.includes("Service Unavailable")) {
      return respond(503, { status: "error", message: "AIサービスが混み合っています。しばらく待ってから再試行してください。" }, corsHeaders);
    }
    return respond(500, { status: "error", message: "内部エラーが発生しました" }, corsHeaders);
  }
};

function respond(statusCode: number, body: ReviewResponse, corsHeaders: Record<string, string>): APIGatewayProxyResult {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}
