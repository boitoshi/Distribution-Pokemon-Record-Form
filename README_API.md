# ポケモン配信データ管理API

Google Sheets APIを使用した配信ポケモンデータの管理システム（Python FastAPI + uv）

## 特徴

- 🚀 **完全無料**: Google Sheets + Vercel Functionsで0円運用
- 🔄 **リトライ機能**: 指数バックオフによる堅牢な送信
- 📊 **複数データベース**: 複数スプレッドシートの管理
- 🛠️ **uv管理**: 高速なパッケージ管理とプロジェクト管理
- 🔗 **API連携**: Vue/React/WordPressとの簡単連携

## セットアップ

### 1. uvのインストール

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. プロジェクトセットアップ

```bash
# 依存関係のインストール
uv sync

# 開発環境の依存関係も含める
uv sync --dev
```

### 3. Google Sheets API設定

#### A. Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. 以下のAPIを有効化:
   - Google Sheets API
   - Google Drive API
4. サービスアカウントを作成してJSONキーをダウンロード

#### B. スプレッドシート設定
1. Google Sheetsで新しいスプレッドシートを作成
2. サービスアカウントのメールアドレスに編集権限を付与
3. スプレッドシートのIDをメモ

### 4. 環境変数設定

```bash
# .env ファイルを作成
cat > .env << EOF
POKEMON_SHEET_ID=your_sheet_id_here
GOOGLE_CREDENTIALS_PATH=credentials.json
EOF
```

## 開発

### ローカル開発サーバー起動

```bash
# APIサーバー起動
uv run start-api

# または直接実行
uv run uvicorn api.main:app --reload
```

### コード品質チェック

```bash
# フォーマット
uv run black .

# リント
uv run ruff check .

# 型チェック（将来的に追加予定）
# uv run mypy .
```

### テスト実行

```bash
# テスト実行
uv run pytest

# カバレッジ付きテスト
uv run pytest --cov=api
```

## データ移行

### 既存のGASデータをAPIに移行

```bash
# ドライラン（実際の移行は行わない）
uv run python migration/gas-to-api.py \
  --credentials credentials.json \
  --source-sheet-id "your_gas_sheet_id" \
  --api-url "http://localhost:8000" \
  --dry-run

# 実際の移行実行
uv run python migration/gas-to-api.py \
  --credentials credentials.json \
  --source-sheet-id "your_gas_sheet_id" \
  --api-url "http://localhost:8000" \
  --backup
```

### 移行オプション

- `--backup`: 移行前にバックアップを作成
- `--batch-size 10`: バッチサイズを指定
- `--delay 1`: リクエスト間の待機時間（秒）
- `--dry-run`: テストのみ実行

## デプロイ

### Vercel Functions

```bash
# Vercel CLIインストール
npm install -g vercel

# プロジェクトのデプロイ
vercel --prod

# 環境変数設定
vercel env add POKEMON_SHEET_ID production
vercel env add GOOGLE_CREDENTIALS_JSON production
```

### 環境変数（Vercel）

```bash
POKEMON_SHEET_ID=your_sheet_id_here
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

## API仕様

### 基本エンドポイント

```
GET  /                      # API情報
GET  /health               # ヘルスチェック  
GET  /api/databases        # データベース一覧
```

### データ操作

```
POST   /api/{db}/data           # データ作成
GET    /api/{db}/data           # データ取得
GET    /api/{db}/data/{id}      # 単一データ取得
DELETE /api/{db}/data/{id}      # データ削除
```

### 使用例

```python
import requests

# データ作成
data = {
    "id": "08M01",
    "name": {"ja": "ピカチュウ"},
    "dexNo": "0025",
    "generation": 8,
    "game": "ソード・シールド",
    "eventName": "ポケモン映画2021",
    "distribution": {
        "method": "シリアルコード",
        "location": "映画館",
        "startDate": "2021-07-01",
        "endDate": "2021-08-31"
    },
    "level": 25
}

response = requests.post("http://localhost:8000/api/pokemon/data", json=data)
print(response.json())
```

## フロントエンド連携

### Vue.js

```javascript
// composables/useApi.js
import { ref } from 'vue'

export function useApi() {
  const baseUrl = 'https://your-api.vercel.app'
  
  const createPokemon = async (data) => {
    const response = await fetch(`${baseUrl}/api/pokemon/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
  
  return { createPokemon }
}
```

### React

```javascript
// hooks/useApi.js
import { useState, useCallback } from 'react'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const baseUrl = 'https://your-api.vercel.app'
  
  const createPokemon = useCallback(async (data) => {
    setLoading(true)
    try {
      const response = await fetch(`${baseUrl}/api/pokemon/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { createPokemon, loading }
}
```

### WordPress

```php
// functions.php
function fetch_pokemon_data() {
    $response = wp_remote_get('https://your-api.vercel.app/api/pokemon/data');
    
    if (is_wp_error($response)) {
        return false;
    }
    
    $body = wp_remote_retrieve_body($response);
    return json_decode($body, true);
}

// ショートコード
add_shortcode('pokemon_list', function() {
    $pokemon_data = fetch_pokemon_data();
    if (!$pokemon_data) {
        return 'データの取得に失敗しました';
    }
    
    $output = '<ul>';
    foreach ($pokemon_data['data'] as $pokemon) {
        $output .= sprintf('<li>%s (ID: %s)</li>', 
            $pokemon['ポケモン名'], $pokemon['管理ID']);
    }
    $output .= '</ul>';
    
    return $output;
});
```

## 複数データベース設定

```python
# api/main.py
DATABASES = {
    "pokemon": {
        "sheet_id": os.getenv("POKEMON_SHEET_ID"),
        "sheet_name": "Sheet1"
    },
    "cards": {
        "sheet_id": os.getenv("CARDS_SHEET_ID"),
        "sheet_name": "Sheet1"
    },
    "games": {
        "sheet_id": os.getenv("GAMES_SHEET_ID"),
        "sheet_name": "Sheet1"
    }
}
```

## トラブルシューティング

### よくある問題

1. **認証エラー**
   - サービスアカウントのメール権限を確認
   - 認証ファイルのパスを確認

2. **API接続エラー**
   - Google Sheets API, Google Drive APIの有効化を確認
   - スプレッドシートIDの確認

3. **Vercelデプロイエラー**
   - 環境変数の設定を確認
   - vercel.jsonの設定を確認

### ログ確認

```bash
# APIサーバーのログ
uv run uvicorn api.main:app --log-level debug

# 移行ツールのログ
uv run python migration/gas-to-api.py --credentials credentials.json --source-sheet-id "id" --api-url "url" --dry-run
```

## 今後の拡張

- [ ] 認証機能の追加
- [ ] データ分析ダッシュボード
- [ ] WebSocket（リアルタイム更新）
- [ ] GraphQL API
- [ ] 自動バックアップ機能

## ライセンス

このプロジェクトは個人使用を目的としています。