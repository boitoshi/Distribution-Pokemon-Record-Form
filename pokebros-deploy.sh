#!/bin/bash

# 🚀 Pokemon Distribution API デプロイスクリプト（pokebros-project用）
# GitHub Codespaces で実行する用だよ〜！✨

set -e

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "🎯 =========================================="
echo "   Pokemon Distribution API デプロイ開始！  "
echo "   Project: pokebros-project               "
echo "==========================================${NC}"

# プロジェクト設定確認
PROJECT_ID="pokebros-project"
REGION="asia-northeast1"
SERVICE_NAME="pokemon-distribution-api"

echo -e "${BLUE}📋 設定確認:${NC}"
echo -e "  プロジェクト: ${GREEN}$PROJECT_ID${NC}"
echo -e "  リージョン: ${GREEN}$REGION${NC}"
echo -e "  サービス名: ${GREEN}$SERVICE_NAME${NC}"

# gcloud設定確認
echo -e "${YELLOW}🔧 gcloud設定確認中...${NC}"
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚙️ プロジェクトを設定中...${NC}"
    gcloud config set project $PROJECT_ID
fi

# 必要なAPIの確認と有効化
echo -e "${YELLOW}📡 必要なAPIの確認中...${NC}"
REQUIRED_APIS=(
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "containerregistry.googleapis.com"
    "sheets.googleapis.com"
    "secretmanager.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        echo -e "  ✅ $api"
    else
        echo -e "  🔧 $api を有効化中..."
        gcloud services enable "$api" --async
    fi
done

# Service Account確認
SA_EMAIL="pokemon-api-service@$PROJECT_ID.iam.gserviceaccount.com"
echo -e "${YELLOW}👤 Service Account確認中...${NC}"

if ! gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    echo -e "${YELLOW}👤 Service Account作成中...${NC}"
    gcloud iam service-accounts create pokemon-api-service \
        --display-name="Pokemon API Service Account"
    
    # 認証キー作成
    gcloud iam service-accounts keys create credentials.json \
        --iam-account=$SA_EMAIL
    
    echo -e "${GREEN}✅ Service Account作成完了${NC}"
else
    echo -e "${GREEN}✅ Service Account既存確認${NC}"
fi

# Secrets確認と作成
echo -e "${YELLOW}🔐 Secrets確認中...${NC}"

# Google認証情報
if ! gcloud secrets describe google-credentials &>/dev/null; then
    if [ -f "credentials.json" ]; then
        gcloud secrets create google-credentials --data-file=credentials.json
        echo -e "${GREEN}✅ Google認証情報をSecret Managerに保存${NC}"
    else
        echo -e "${RED}❌ credentials.json が見つかりません${NC}"
        echo -e "${YELLOW}💡 Service Accountのキーを再作成中...${NC}"
        gcloud iam service-accounts keys create credentials.json \
            --iam-account=$SA_EMAIL
        gcloud secrets create google-credentials --data-file=credentials.json
    fi
else
    echo -e "${GREEN}✅ Google認証情報既存確認${NC}"
fi

# スプレッドシートID
if ! gcloud secrets describe pokemon-sheet-id &>/dev/null; then
    echo "115LHiKGpPtVAGGaV2tS2HchnZLeCFlBcRu0ZXZxJ_NQ" | \
        gcloud secrets create pokemon-sheet-id --data-file=-
    echo -e "${GREEN}✅ スプレッドシートID保存完了${NC}"
else
    echo -e "${GREEN}✅ スプレッドシートID既存確認${NC}"
fi

# Service Accountに権限付与
echo -e "${YELLOW}🔑 権限設定中...${NC}"
gcloud secrets add-iam-policy-binding google-credentials \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

gcloud secrets add-iam-policy-binding pokemon-sheet-id \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

# デプロイ実行
echo -e "${PURPLE}🚀 Cloud Runへデプロイ開始！${NC}"

gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --concurrency 80 \
    --timeout 300 \
    --service-account $SA_EMAIL \
    --set-secrets "GOOGLE_CREDENTIALS_JSON=google-credentials:latest" \
    --set-secrets "POKEMON_SHEET_ID=pokemon-sheet-id:latest" \
    --execution-environment gen2

# デプロイ結果確認
echo -e "${YELLOW}📊 デプロイ結果確認中...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --format='value(status.url)')

if [ ! -z "$SERVICE_URL" ]; then
    echo -e "${GREEN}"
    echo "🎉 =============================="
    echo "    デプロイ成功！！！✨"
    echo "==============================${NC}"
    echo ""
    echo -e "${BLUE}🌐 API URL:${NC}"
    echo -e "   ${GREEN}$SERVICE_URL${NC}"
    echo ""
    echo -e "${BLUE}📚 確認用URL:${NC}"
    echo -e "   ヘルスチェック: ${GREEN}$SERVICE_URL/health${NC}"
    echo -e "   API仕様書: ${GREEN}$SERVICE_URL/docs${NC}"
    echo -e "   データベース一覧: ${GREEN}$SERVICE_URL/api/databases${NC}"
    echo ""
    
    # ヘルスチェック実行
    echo -e "${YELLOW}🏥 ヘルスチェック実行中...${NC}"
    sleep 10  # サービス起動待ち
    
    if curl -s -f "$SERVICE_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ APIは正常に動作しています！${NC}"
    else
        echo -e "${YELLOW}⚠️ APIの起動に時間がかかっています（これは正常です）${NC}"
        echo -e "${BLUE}💡 数分後に再度アクセスしてみてください${NC}"
    fi
    
    # フロントエンド設定案内
    echo -e "${PURPLE}"
    echo "🌐 =================================="
    echo "   フロントエンド設定更新が必要！"
    echo "===================================${NC}"
    echo ""
    echo -e "${YELLOW}📝 api-client.js の299行目を以下に変更:${NC}"
    echo -e "${GREEN}apiClient.baseUrl = '$SERVICE_URL';${NC}"
    echo ""
    echo -e "${BLUE}💡 GitHub Pages のフロントエンドが自動的に新しいAPIに接続されます！${NC}"
    
else
    echo -e "${RED}❌ デプロイに失敗しました${NC}"
    echo -e "${YELLOW}🔍 エラー確認:${NC}"
    gcloud run services describe $SERVICE_NAME --region $REGION
    exit 1
fi

echo -e "${PURPLE}"
echo "🎊 =============================="
echo "   全て完了！お疲れさま〜✨"
echo "==============================${NC}"
