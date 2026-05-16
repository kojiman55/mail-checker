export interface ReviewRequest {
  text: string;
  language: "ja" | "en";
}

export interface ReviewIssue {
  type: "error" | "warning" | "info";
  original: string;
  suggestion: string;
  reason: string;
}

export interface ReviewResponse {
  status: "success" | "error";
  correctedText?: string;
  issues?: ReviewIssue[];
  summary?: string;
  message?: string;
}
