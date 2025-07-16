#!/bin/bash

# 🔍 認証情報デバッグスクリプト

set -e

PROJECT_ID="pokebros-project"
SA_EMAIL="pokemon-api-service@$PROJECT_ID.iam.gserviceaccount.com"
SERVICE_NAME="pokemon-api"
REGION="asia-northeast1"

echo "🔍 認証情報デバッグ開始..."

# 1. 現在の認証情報確認
echo "🔑 現在の認証情報確認..."
echo "--- Google Credentials (最初の10行) ---"
gcloud secrets versions access latest --secret="google-credentials" | head -10

echo ""
echo "--- スプレッドシートID ---"
gcloud secrets versions access latest --secret="pokemon-sheet-id"

# 2. Service Account のキーを再生成
echo ""
echo "🔄 Service Account キーを再生成..."
gcloud iam service-accounts keys create credentials-new.json \
    --iam-account=$SA_EMAIL

echo "✅ 新しいキーファイル作成完了"

# 3. Secret Manager を更新
echo "🔒 Secret Manager を更新..."
gcloud secrets versions add google-credentials --data-file=credentials-new.json

echo "✅ Secret Manager 更新完了"

# 4. Cloud Run サービスを再デプロイ（確実に新しいSecretを使用）
echo "🚀 Cloud Run サービス再デプロイ..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --service-account $SA_EMAIL \
    --set-secrets "GOOGLE_CREDENTIALS_JSON=google-credentials:latest" \
    --set-secrets "POKEMON_SHEET_ID=pokemon-sheet-id:latest" \
    --execution-environment gen2 \
    --quiet

echo "✅ 再デプロイ完了"

# 5. 少し待ってからテスト
echo "⏳ サービス起動待ち..."
sleep 15

# 6. テストデータ送信
echo "🧪 テストデータ送信..."
API_URL="https://pokemon-api-509206780612.asia-northeast1.run.app"

TEST_DATA='{
  "id": "09T03",
  "name": {"ja": "ピカチュウ"},
  "shiny": "",
  "dex_no": "0025",
  "generation": 9,
  "game": "スカーレット・バイオレット",
  "event_name": "認証再設定テスト",
  "distribution": {
    "method": "API経由",
    "location": "再設定テスト",
    "start_date": "2025-07-16",
    "end_date": null
  },
  "ot_name": "再設定テスト",
  "trainer_id": "99999",
  "met_location": "すてきなばしょ",
  "ball": "プレシャスボール",
  "level": 50,
  "ability": "せいでんき",
  "nature": "ようき",
  "gender": "♂",
  "gigantamax": "",
  "terastallize": "でんき",
  "moves": ["10まんボルト"],
  "held_item": "なし",
  "ribbons": ["再設定テストリボン"],
  "other_info": "認証情報再設定後のテストデータ",
  "timestamp": "'$(date -Iseconds)'"
}'

RESPONSE=$(curl -s -X POST "$API_URL/api/pokemon/data" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📥 レスポンス:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "🎉 認証修正成功！APIは正常に動作しています！"
    echo ""
    echo "🌐 次のステップ:"
    echo "1. Google Sheets でデータが追加されているか確認"
    echo "2. フロントエンドとの連携テスト"
else
    echo ""
    echo "❌ まだ問題があります"
    echo "🔍 最新のエラーログを確認:"
    echo 'gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pokemon-api AND severity>=ERROR" --limit=3 --format="value(timestamp,textPayload)"'
fi

# 7. 不要なファイルを削除
rm -f credentials-new.json
