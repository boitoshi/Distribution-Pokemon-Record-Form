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

## 項目名の変更・追加手順

### 項目名の管理場所

このプロジェクトでは、項目名が以下の8箇所で管理されています：

#### 1. フロントエンド側
- **`index.html`** - HTMLフォームの入力フィールド
- **`script.js`** - `formatFormData()`関数内の項目名マッピング
- **`api-client.js`** - `formatFormDataForApi()`関数内の項目名変換

#### 2. バックエンド側
- **`api/main.py`** - Pydanticモデルとスプレッドシートヘッダー定義
- **`GAS/Code.js`** - Google Apps Scriptのヘッダー定義

#### 3. データ移行・テスト
- **`migration/gas-to-api.py`** - GASからAPIへの移行時の項目名変換
- **`tests/test_api.py`** - テストデータの項目名
- **`pokemon_data.json`** - 参照データ（ポケモン名など）

### 新しい項目を追加する手順

例：「持っているリボンの数」（`ribbonCount`）フィールドを追加する場合

#### Step 1: フロントエンド側の修正

```html
<!-- index.html -->
<div class="form-group">
    <label for="ribbon-count">リボン数</label>
    <input type="number" id="ribbon-count" name="ribbon-count" min="0" max="10">
</div>
```

```javascript
// script.js の formatFormData() 関数内に追加
ribbonCount: parseInt(form.elements['ribbon-count'].value) || 0,
```

```javascript
// api-client.js の formatFormDataForApi() 関数内に追加
ribbonCount: parseInt(formData['ribbon-count']) || 0,
```

#### Step 2: バックエンド側の修正

```python
# api/main.py の PokemonData クラスに追加
class PokemonData(BaseModel):
    # ... 既存のフィールド
    ribbonCount: int = 0
```

```python
# api/main.py の headers 配列に追加
headers = [
    "管理ID", "ポケモン名", "色違い", "全国図鑑No", "世代", "ゲーム", "配信イベント名",
    "配信方法", "配信場所", "配信開始日", "配信終了日",
    "おやめい", "ID", "出会った場所", "ボール",
    "レベル", "せいべつ", "とくせい", "せいかく", "キョダイマックス", "テラスタイプ",
    "持ち物", "技1", "技2", "技3", "技4",
    "リボン1", "リボン2", "リボン3", "リボン数", "その他特記事項", "タイムスタンプ"  # 追加
]
```

```python
# api/main.py の row_data 配列に追加
row_data = [
    # ... 既存のデータ
    data.ribbonCount,  # 追加
    data.otherInfo,
    data.timestamp,
]
```

#### Step 3: GAS側の修正（必要に応じて）

```javascript
// GAS/Code.js の expectedHeaders 配列に追加
const expectedHeaders = [
    "管理ID", "ポケモン名", "全国図鑑No", "世代", "ゲーム", "配信イベント名",
    "配信方法", "配信場所", "配信開始日", "配信終了日",
    "レベル", "せいべつ", "とくせい", "せいかく", "キョダイマックス", "テラスタイプ",
    "持ち物", "技1", "技2", "技3", "技4",
    "リボン1", "リボン2", "リボン3", "リボン数", "その他特記事項", "タイムスタンプ"  // 追加
];
```

#### Step 4: データ移行ツールの修正

```python
# migration/gas-to-api.py の transform_data() 関数内に追加
api_data = {
    # ... 既存のマッピング
    'ribbonCount': int(record.get('リボン数', 0)),  # 追加
    'otherInfo': record.get('その他特記事項', ''),
    'timestamp': record.get('タイムスタンプ', datetime.now().isoformat())
}
```

#### Step 5: テストの更新

```python
# tests/test_api.py のテストデータに追加
test_data = {
    "id": "08M01",
    "name": {"ja": "ピカチュウ"},
    # ... 既存のデータ
    "ribbonCount": 3,  # 追加
}
```

### 既存項目名を変更する手順

例：「せいかく」→「personality」に変更する場合

#### Step 1: 影響範囲の確認

```bash
# 変更対象の項目名を検索
grep -r "せいかく" .
grep -r "nature" .
```

#### Step 2: 各ファイルでの一括変更

```bash
# 上記の8箇所のファイルで以下を実行
# HTML: name="nature" → name="personality"
# JavaScript: nature → personality
# Python: nature → personality
# スプレッドシート: "せいかく" → "性格"
```

#### Step 3: データベースの移行

```bash
# 既存データがある場合は移行スクリプトを実行
uv run python migration/gas-to-api.py \
  --credentials credentials.json \
  --source-sheet-id "your_sheet_id" \
  --api-url "http://localhost:8000" \
  --backup
```

#### Step 4: テストの実行

```bash
# 全テストを実行して破綻がないか確認
make test

# 型チェック
make mypy

# リントチェック
make lint
```

### 項目名変更のチェックリスト

- [ ] `index.html` - フォーム要素の`name`属性とラベル
- [ ] `script.js` - `formatFormData()`関数内の項目参照
- [ ] `api-client.js` - `formatFormDataForApi()`関数内の項目マッピング
- [ ] `api/main.py` - Pydanticモデルのフィールド名
- [ ] `api/main.py` - `headers`配列の日本語ヘッダー名
- [ ] `api/main.py` - `row_data`配列の項目順序
- [ ] `GAS/Code.js` - `expectedHeaders`配列の日本語ヘッダー名
- [ ] `migration/gas-to-api.py` - `transform_data()`関数の項目マッピング
- [ ] `tests/test_api.py` - テストデータの項目名
- [ ] データベースの移行実行
- [ ] テストの実行と確認

### 注意事項

1. **データの整合性**: 既存データがある場合は、必ずバックアップを取ってから変更する
2. **型の一貫性**: 新しい項目の型が一貫していることを確認する
3. **必須項目の扱い**: 必須項目を追加する場合は、既存データのデフォルト値を設定する
4. **配列データ**: `moves`や`ribbons`のような配列データは、個別カラムとして展開される

## 今後の拡張

- [ ] 認証機能の追加
- [ ] データ分析ダッシュボード
- [ ] WebSocket（リアルタイム更新）
- [ ] GraphQL API
- [ ] 自動バックアップ機能

## ライセンス

このプロジェクトは個人使用を目的としています。