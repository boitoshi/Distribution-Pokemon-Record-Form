#!/bin/bash

# 🔧 認証問題修正スクリプト

set -e

PROJECT_ID="pokebros-project"
SA_EMAIL="pokemon-api-service@$PROJECT_ID.iam.gserviceaccount.com"
SERVICE_NAME="pokemon-api"
REGION="asia-northeast1"

echo "🔧 認証問題を修正中..."

# 1. 現在のSecret確認
echo "🔍 Secret Manager 確認中..."
if gcloud secrets describe google-credentials &>/dev/null; then
    echo "✅ google-credentials 存在確認"
else
    echo "❌ google-credentials が見つかりません"
    echo "🔑 Service Account キーを再作成中..."
    
    # Service Accountキーを再作成
    gcloud iam service-accounts keys create credentials.json \
        --iam-account=$SA_EMAIL
    
    # Secret Manager に保存
    gcloud secrets create google-credentials --data-file=credentials.json
    echo "✅ google-credentials 作成完了"
fi

if gcloud secrets describe pokemon-sheet-id &>/dev/null; then
    echo "✅ pokemon-sheet-id 存在確認"
else
    echo "📊 スプレッドシートID設定中..."
    echo "115LHiKGpPtVAGGaV2tS2HchnZLeCFlBcRu0ZXZxJ_NQ" | \
        gcloud secrets create pokemon-sheet-id --data-file=-
    echo "✅ pokemon-sheet-id 作成完了"
fi

# 2. Service Account権限設定
echo "🔑 Service Account権限設定中..."

# Secret Manager アクセス権限
gcloud secrets add-iam-policy-binding google-credentials \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

gcloud secrets add-iam-policy-binding pokemon-sheet-id \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo "✅ 権限設定完了"

# 3. Cloud Run サービス更新（環境変数とSecret設定）
echo "🚀 Cloud Run サービス更新中..."

gcloud run services update $SERVICE_NAME \
    --region $REGION \
    --service-account $SA_EMAIL \
    --set-secrets "GOOGLE_CREDENTIALS_JSON=google-credentials:latest" \
    --set-secrets "POKEMON_SHEET_ID=pokemon-sheet-id:latest" \
    --quiet

echo "✅ Cloud Run サービス更新完了"

# 4. サービス再起動（新しい設定を反映）
echo "🔄 サービス再起動中..."
gcloud run services update $SERVICE_NAME \
    --region $REGION \
    --update-labels "restart=$(date +%s)" \
    --quiet

echo "✅ 再起動完了"

# 5. 動作確認
echo "🧪 動作確認中..."
sleep 10  # サービス起動待ち

API_URL="https://pokemon-api-509206780612.asia-northeast1.run.app"

# テストデータ送信
TEST_DATA='{
  "id": "09T02",
  "name": {"ja": "イーブイ"},
  "shiny": "",
  "dex_no": "0133",
  "generation": 9,
  "game": "スカーレット・バイオレット",
  "event_name": "認証テスト",
  "distribution": {
    "method": "API経由",
    "location": "修正後テスト",
    "start_date": "2025-07-16",
    "end_date": null
  },
  "ot_name": "修正テスト",
  "trainer_id": "54321",
  "met_location": "すてきなばしょ",
  "ball": "プレシャスボール",
  "level": 25,
  "ability": "にげあし",
  "nature": "おくびょう",
  "gender": "♀",
  "gigantamax": "",
  "terastallize": "ノーマル",
  "moves": ["でんこうせっか", "あまえる"],
  "held_item": "なし",
  "ribbons": ["修正テストリボン"],
  "other_info": "認証修正後のテストデータです",
  "timestamp": "'$(date -Iseconds)'"
}'

echo "📤 修正後テストデータ送信中..."
RESPONSE=$(curl -s -X POST "$API_URL/api/pokemon/data" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📥 レスポンス:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "🎉 修正成功！APIは正常に動作しています！"
else
    echo ""
    echo "❌ まだ問題があります。ログを確認してください:"
    echo "gcloud logs read --service $SERVICE_NAME --region $REGION --limit=10"
fi
