#!/bin/bash

# 🧪 Pokemon API 動作確認スクリプト

API_URL="https://pokemon-api-509206780612.asia-northeast1.run.app"

echo "🎯 Pokemon API 動作確認開始！"
echo "API URL: $API_URL"
echo ""

# 1. ヘルスチェック
echo "🏥 ヘルスチェック実行中..."
if curl -s -f "$API_URL/health" > /dev/null; then
    echo "✅ ヘルスチェック成功！"
    curl -s "$API_URL/health" | jq . 2>/dev/null || curl -s "$API_URL/health"
else
    echo "❌ ヘルスチェック失敗"
    exit 1
fi
echo ""

# 2. API情報確認
echo "📋 API情報確認中..."
curl -s "$API_URL/" | jq . 2>/dev/null || curl -s "$API_URL/"
echo ""

# 3. データベース一覧確認
echo "🗃️ データベース一覧確認中..."
curl -s "$API_URL/api/databases" | jq . 2>/dev/null || curl -s "$API_URL/api/databases"
echo ""

# 4. テストデータ送信
echo "📤 テストデータ送信中..."
TEST_DATA='{
  "id": "09T01",
  "name": {"ja": "ピカチュウ"},
  "shiny": "",
  "dex_no": "0025",
  "generation": 9,
  "game": "スカーレット・バイオレット",
  "event_name": "API動作テスト",
  "distribution": {
    "method": "API経由",
    "location": "テスト環境",
    "start_date": "2025-07-16",
    "end_date": null
  },
  "ot_name": "テスター",
  "trainer_id": "12345",
  "met_location": "すてきなばしょ",
  "ball": "プレシャスボール",
  "level": 50,
  "ability": "せいでんき",
  "nature": "ようき",
  "gender": "♂",
  "gigantamax": "",
  "terastallize": "でんき",
  "moves": ["10まんボルト", "でんきショック"],
  "held_item": "きのみ",
  "ribbons": ["テストリボン"],
  "other_info": "API動作確認用のテストデータです",
  "timestamp": "'$(date -Iseconds)'"
}'

RESPONSE=$(curl -s -X POST "$API_URL/api/pokemon/data" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📥 API レスポンス:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ テストデータ送信成功！"
    echo "🎊 APIは正常に動作しています！"
else
    echo ""
    echo "❌ テストデータ送信に問題があります"
    echo "📋 詳細を確認してください"
fi

echo ""
echo "🌐 ブラウザで確認:"
echo "  API仕様書: $API_URL/docs"
echo "  ReDoc: $API_URL/redoc"
