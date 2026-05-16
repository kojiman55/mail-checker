# MailChecker — AIビジネスメール添削サービス

日本語・英語のビジネスメールを生成AIが自動添削するサービス。敬語・クッション言葉・文体・トーンを多角的にチェックし、指摘ポイント・修正案・総評を構造化して返す。

**デモ**: https://mail-checker.eggsystems.jp

Web（React）に加え、Flutter で iOS / Android 向けアプリも実装している。

---

## 何ができるか

- **指摘の分類表示** — 誤り（赤）・改善提案（黄）・参考情報（青）の3種類で色分けして一覧表示
- **各指摘に元の表現・修正案・理由を表示**
- **AI による総評**
- **添削後の全文を生成してコピー**
- **日本語・英語の両方に対応**（言語ごとに異なる評価基準を適用）
- **添削履歴の保存**（Cognito 認証 + Aurora MySQL）

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Webフロントエンド | React + TypeScript + Vite |
| モバイル | Flutter（iOS / Android） |
| CDN / ホスティング | CloudFront + S3（OAC） |
| バックエンド | AWS Lambda (TypeScript) / API Gateway |
| AI | Gemini API |
| 認証 | Amazon Cognito |
| DB | Aurora MySQL Serverless v2（添削履歴） |
| インフラ | AWS SAM |
| シークレット管理 | AWS Systems Manager Parameter Store |

---

## システム構成

```
メール本文入力（Web / iOS / Android）
  ↓
API Gateway（スロットリング・クォータ設定済み）
  ↓
Lambda（mail-checker-review）
  ├─ プロンプト組み立て（言語別評価基準）
  ├─ Gemini API 呼び出し
  └─ レスポンス構造化（issues / summary / correctedText）
  ↓
フロントエンド（指摘一覧・総評・添削後全文を表示）
```

---

## リポジトリ構成

```
mail-checker/
├── frontend/          # React フロントエンド（Web）
├── backend/dist/      # Lambda デプロイ用ビルド済みファイル
└── template.yaml      # AWS SAM テンプレート
```

モバイルアプリ（Flutter）のコードは別リポジトリで管理している。

---

## セットアップ

### 必要なもの

- AWS アカウント（SAM CLI セットアップ済み）
- Gemini API キー（[Google AI Studio](https://aistudio.google.com/) で取得）

### Parameter Store へのシークレット登録

```bash
aws ssm put-parameter \
  --name "/mail-checker/gemini-api-key" \
  --value "YOUR_GEMINI_API_KEY" \
  --type SecureString
```

### バックエンドのデプロイ

```bash
sam build && sam deploy --guided
```

### フロントエンドのローカル起動

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE にデプロイ済みの API Gateway URL を設定
npm install && npm run dev
```

---

## アクセス制限

API Gateway に以下の制限を設定している。

| 設定 | 値 |
|---|---|
| レート制限 | 1 req/s |
| バースト | 3 |
| 月間クォータ | 500 リクエスト |
| Lambda 同時実行数 | 2 |

---

## ライセンス

MIT License
