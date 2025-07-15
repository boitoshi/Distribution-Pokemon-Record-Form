# Google Cloud Run デプロイ手順

## 🚀 前提条件

1. **Google Cloud Project**を作成済み
2. **Google Cloud CLI**をインストール済み
3. **Docker**をインストール済み
4. **課金を有効化**（無料枠内で使用）

## 📋 初回セットアップ

### 1. Google Cloud CLIの認証
```bash
# Google Cloudにログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# Application Default Credentialsを設定
gcloud auth application-default login
```

### 2. 必要なAPIを有効化
```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Google Sheets API（既に有効化済みの場合はスキップ）
gcloud services enable sheets.googleapis.com
```

### 3. Service Accountの設定
```bash
# Service Accountを作成
gcloud iam service-accounts create pokemon-api-service \
    --display-name="Pokemon API Service Account"

# Google Sheets APIの権限を付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:pokemon-api-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/editor"
```

## 🛠 デプロイ方法

### 方法1: Cloud Build を使用（推奨）

```bash
# Cloud Buildでデプロイ
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _POKEMON_SHEET_ID=115LHiKGpPtVAGGaV2tS2HchnZLeCFlBcRu0ZXZxJ_NQ
```

### 方法2: 手動デプロイ

```bash
# 1. Dockerイメージをビルド
docker build -t gcr.io/YOUR_PROJECT_ID/pokemon-api .

# 2. Container Registryにプッシュ
docker push gcr.io/YOUR_PROJECT_ID/pokemon-api

# 3. Cloud Runにデプロイ
gcloud run deploy pokemon-api \
  --image gcr.io/YOUR_PROJECT_ID/pokemon-api \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars POKEMON_SHEET_ID=115LHiKGpPtVAGGaV2tS2HchnZLeCFlBcRu0ZXZxJ_NQ
```

## 🔧 デプロイ後の設定

### 1. Cloud Run URLを取得
```bash
# デプロイされたサービスのURLを確認
gcloud run services describe pokemon-api \
  --region asia-northeast1 \
  --format 'value(status.url)'
```

### 2. フロントエンドのURLを更新
`api-client.js`の299行目を実際のCloud Run URLに更新：

```javascript
// 実際のCloud Run URLに変更
apiClient.baseUrl = 'https://pokemon-api-xxxxx-an.a.run.app';
```

### 3. GitHub Pagesで公開
1. GitHubリポジトリの**Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main / root
4. **Save**

## 🔄 継続的デプロイ

### GitHub Actionsを使用した自動デプロイ

`.github/workflows/deploy.yml`を作成：

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]
  
jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - id: 'auth'
      uses: 'google-github-actions/auth@v1'
      with:
        credentials_json: '${{ secrets.GCP_SA_KEY }}'
    
    - name: 'Set up Cloud SDK'
      uses: 'google-github-actions/setup-gcloud@v1'
    
    - name: 'Deploy to Cloud Run'
      run: |
        gcloud builds submit --config cloudbuild.yaml \
          --substitutions _POKEMON_SHEET_ID=${{ secrets.POKEMON_SHEET_ID }}
```

**GitHub Secrets設定**:
- `GCP_SA_KEY`: Service AccountのJSONキー
- `POKEMON_SHEET_ID`: SpreadsheetのID

## 📊 費用の確認

```bash
# 現在の使用量を確認
gcloud run services describe pokemon-api \
  --region asia-northeast1 \
  --format 'table(status.latestReadyRevisionName,status.traffic[].latestRevision,status.traffic[].percent)'

# 課金情報の確認
gcloud billing accounts list
```

## 🚨 トラブルシューティング

### よくある問題

1. **認証エラー**
   ```bash
   # Service Accountの権限を確認
   gcloud projects get-iam-policy YOUR_PROJECT_ID
   ```

2. **メモリ不足**
   ```bash
   # メモリを増やす
   gcloud run services update pokemon-api \
     --region asia-northeast1 \
     --memory 2Gi
   ```

3. **冷えたサービスの起動が遅い**
   ```bash
   # 最小インスタンス数を設定
   gcloud run services update pokemon-api \
     --region asia-northeast1 \
     --min-instances 1
   ```

### ログの確認
```bash
# リアルタイムログ
gcloud run services logs tail pokemon-api --region asia-northeast1

# 過去のログ
gcloud run services logs read pokemon-api --region asia-northeast1 --limit 50
```

## 🔒 セキュリティ

### 環境変数の管理
```bash
# 機密情報を Secret Manager で管理
gcloud secrets create pokemon-sheet-id --data-file=-

# Secret ManagerからCloud Runに設定
gcloud run services update pokemon-api \
  --region asia-northeast1 \
  --set-secrets POKEMON_SHEET_ID=pokemon-sheet-id:latest
```

## 📈 パフォーマンス最適化

### 本番環境向け設定
```bash
# CPU使用率ベースのスケーリング
gcloud run services update pokemon-api \
  --region asia-northeast1 \
  --cpu-throttling \
  --concurrency 80 \
  --timeout 300
```

## 🎯 完成後のURL例

- **フロントエンド**: `https://username.github.io/Distribution-Pokemon-Record-Form/`
- **API**: `https://pokemon-api-xxxxx-an.a.run.app`

これで**完全無料**でグローバルアクセス可能なポケモンフォームが完成します！