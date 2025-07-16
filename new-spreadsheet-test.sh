#!/bin/bash

# 🆕 新しいスプレッドシートでテストスクリプト

echo "🆕 新しいスプレッドシートでテスト開始..."

# 1. 新しいスプレッドシートを作成する手順案内
echo "📋 手順："
echo "1. https://sheets.google.com にアクセス"
echo "2. 新しいスプレッドシートを作成"
echo "3. 以下のService Accountを編集者として共有設定に追加："
echo "   pokemon-api-service@pokebros-project.iam.gserviceaccount.com"
echo "4. 作成したスプレッドシートのURLからIDを取得"
echo "   例：https://docs.google.com/spreadsheets/d/[この部分がID]/edit"
echo ""

# 2. スプレッドシートIDの入力を求める
read -p "新しいスプレッドシートのIDを入力してください: " NEW_SHEET_ID

if [ -z "$NEW_SHEET_ID" ]; then
    echo "❌ スプレッドシートIDが入力されていません"
    exit 1
fi

echo "📊 新しいスプレッドシートID: $NEW_SHEET_ID"

# 3. Secret Manager を更新
echo "🔒 Secret Manager を更新中..."
echo "$NEW_SHEET_ID" | gcloud secrets versions add pokemon-sheet-id --data-file=-

echo "✅ Secret Manager 更新完了"

# 4. Cloud Run サービスを再起動
echo "🔄 Cloud Run サービス再起動中..."
gcloud run services update pokemon-api \
    --region asia-northeast1 \
    --update-labels "restart=$(date +%s)" \
    --quiet

echo "✅ サービス再起動完了"

# 5. 少し待ってからテスト
echo "⏳ サービス起動待ち..."
sleep 10

# 6. テストデータ送信
echo "🧪 新しいスプレッドシートでテスト..."
API_URL="https://pokemon-api-509206780612.asia-northeast1.run.app"

TEST_DATA='{
  "id": "09T04",
  "name": {"ja": "イーブイ"},
  "shiny": "",
  "dex_no": "0133",
  "generation": 9,
  "game": "スカーレット・バイオレット",
  "event_name": "新スプレッドシートテスト",
  "distribution": {
    "method": "API経由",
    "location": "新しいシート",
    "start_date": "2025-07-16",
    "end_date": null
  },
  "ot_name": "新シートテスト",
  "trainer_id": "11111",
  "met_location": "すてきなばしょ",
  "ball": "プレシャスボール",
  "level": 25,
  "ability": "にげあし",
  "nature": "おくびょう",
  "gender": "♀",
  "gigantamax": "",
  "terastallize": "ノーマル",
  "moves": ["でんこうせっか"],
  "held_item": "なし",
  "ribbons": ["新シートリボン"],
  "other_info": "新しいスプレッドシートでのテスト",
  "timestamp": "'$(date -Iseconds)'"
}'

RESPONSE=$(curl -s -X POST "$API_URL/api/pokemon/data" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📥 レスポンス:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "🎉 成功！新しいスプレッドシートで動作しました！"
    echo "🌐 新しいスプレッドシートを確認してデータが追加されているか見てください"
    echo "📊 新スプレッドシートURL: https://docs.google.com/spreadsheets/d/$NEW_SHEET_ID/edit"
else
    echo ""
    echo "❌ まだ問題があります"
    echo "🔍 最新のエラーログ:"
    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=pokemon-api AND severity>=ERROR" --limit=3 --format="value(timestamp,textPayload)"
fi
