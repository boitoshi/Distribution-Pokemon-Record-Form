# テスト手順

## フォームからSpreadsheetへの連携テスト

### 1. 事前準備

#### Google Service Account設定
1. Google Cloud Console でプロジェクトを作成
2. Google Sheets API を有効化
3. Service Account を作成
4. JSONキーファイルをダウンロード
5. プロジェクトルートに `credentials.json` として保存

#### Spreadsheet準備
1. 新しいGoogle Spreadsheetを作成
2. Service Account のメールアドレスに編集権限を付与
3. SpreadsheetのIDを取得（URLの `/d/` と `/edit` の間）
4. 環境変数として設定：
   ```bash
   export POKEMON_SHEET_ID="your_spreadsheet_id_here"
   ```

### 2. 開発環境セットアップ

```bash
# 依存関係をインストール
uv sync --dev

# APIサーバーを起動
make run
# または
uv run uvicorn api.main:app --reload --port 8000
```

### 3. テスト実行

#### APIエンドポイントのテスト
```bash
# ヘルスチェック
curl -X GET "http://localhost:8000/health"

# テストデータの送信
curl -X POST "http://localhost:8000/api/pokemon/data" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "08M01",
    "name": {"ja": "ピカチュウ"},
    "shiny": "",
    "dexNo": "0025",
    "generation": 8,
    "game": "ソード, シールド",
    "eventName": "テスト配信",
    "distribution": {
      "method": "Wi-Fi",
      "location": "オンライン",
      "startDate": "2025-07-15",
      "endDate": "2025-07-31"
    },
    "otName": "テスト",
    "trainerId": "12345",
    "metLocation": "すてきなばしょ",
    "ball": "プレシャスボール",
    "level": 50,
    "ability": "せいでんき",
    "nature": "ようき",
    "gender": "♂",
    "moves": ["10まんボルト", "でんきショック"],
    "heldItem": "きのみ",
    "ribbons": ["テストリボン"],
    "otherInfo": "テストデータです"
  }'
```

#### フロントエンドテスト
1. `index.html` をブラウザで開く
2. フォームに適当なデータを入力
3. 「JSONプレビュー」ボタンでデータを確認
4. 「JSON送信」ボタンでデータを送信
5. Spreadsheetにデータが追加されることを確認

### 4. 自動テスト

```bash
# 単体テスト実行
make test

# コード品質チェック
make check
```

### 5. トラブルシューティング

#### 認証エラー
- `credentials.json` が正しく配置されているか確認
- Service Account に適切な権限が付与されているか確認
- Google Sheets API が有効化されているか確認

#### 接続エラー
- SpreadsheetのIDが正しく設定されているか確認
- Service Account がSpreadsheetにアクセス権限を持っているか確認

#### CORS エラー
- フロントエンドから API にアクセスできない場合は、`api/main.py` のCORS設定を確認

### 6. 期待される動作

1. **ヘッダー自動作成**: 初回実行時にSpreadsheetにヘッダー行が作成される
2. **データ追加**: フォームからのデータが正しい列に追加される
3. **エラーハンドリング**: 認証エラーや接続エラーが適切に処理される
4. **リトライ機能**: 一時的なエラーに対してリトライが実行される

### 7. データフロー確認

```
フォーム入力 → script.js → api-client.js → FastAPI → Google Sheets API → Spreadsheet
```

各段階で適切にデータが変換・処理されることを確認してください。