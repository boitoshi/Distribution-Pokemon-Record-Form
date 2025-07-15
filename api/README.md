# ポケモン配信データ管理API

Google Sheets APIを使用した配信ポケモンデータの管理システム

## セットアップ

### 1. Google Sheets API認証設定

#### A. Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. 「API とサービス」→「ライブラリ」で以下のAPIを有効化:
   - Google Sheets API
   - Google Drive API
4. 「認証情報」→「認証情報を作成」→「サービスアカウント」
5. サービスアカウントキーをJSONでダウンロード

#### B. スプレッドシート設定
1. Google Sheetsで新しいスプレッドシートを作成
2. サービスアカウントのメールアドレスに編集権限を付与
3. スプレッドシートのIDをメモ（URLの`/d/`と`/edit`の間）

### 2. 環境変数設定

#### ローカル開発用
```bash
# .env ファイルを作成
POKEMON_SHEET_ID=your_sheet_id_here
GOOGLE_CREDENTIALS_PATH=credentials.json
```

#### Vercel用
```bash
# Vercel環境変数
POKEMON_SHEET_ID=your_sheet_id_here
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

### 3. ローカル開発

```bash
# 依存関係をインストール
pip install -r requirements.txt

# サーバー起動
uvicorn main:app --reload

# APIドキュメント確認
http://localhost:8000/docs
```

### 4. Vercelデプロイ

```bash
# Vercel CLIインストール
npm install -g vercel

# デプロイ
vercel --prod
```

## API仕様

### エンドポイント

#### データ作成
- `POST /api/{db_name}/data`
- Body: PokemonDataオブジェクト

#### データ取得
- `GET /api/{db_name}/data`
- Query: `limit`, `offset`

#### 単一データ取得
- `GET /api/{db_name}/data/{item_id}`

#### データ削除
- `DELETE /api/{db_name}/data/{item_id}`

#### データベース一覧
- `GET /api/databases`

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

## データベース設定

複数のデータベース（スプレッドシート）を使用する場合、`main.py`の`DATABASES`設定を変更:

```python
DATABASES = {
    "pokemon": {
        "sheet_id": "pokemon_sheet_id",
        "sheet_name": "Sheet1"
    },
    "cards": {
        "sheet_id": "cards_sheet_id",
        "sheet_name": "Sheet1"
    }
}
```

## トラブルシューティング

### 認証エラー
- サービスアカウントのメールアドレスにスプレッドシートの共有権限があるか確認
- 認証情報ファイルのパスが正しいか確認

### API エラー
- Google Sheets API, Google Drive APIが有効化されているか確認
- スプレッドシートIDが正しいか確認

### デプロイエラー
- Vercelの環境変数が正しく設定されているか確認
- requirements.txtの依存関係を確認