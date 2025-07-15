# 配信ポケモンデータ管理システム

## 概要
Python FastAPIとGoogle Sheets APIを使用して、配信ポケモンのデータを入力・管理するためのWebアプリケーションです。
フロントエンドのフォームから入力されたデータは、バックエンドAPIを経由してGoogle スプレッドシートに自動保存されます。

## 主な機能
- **ポケモンデータ入力**: 基本情報、配信詳細、ステータス、技、リボンなどの包括的な入力
- **動的フォーム**: 世代選択に応じたゲーム一覧表示、キョダイマックス・テラスタイプフィールドの表示切替
- **リアルタイムバリデーション**: 必須項目チェック、データ型検証、重複チェック
- **JSONプレビュー**: 送信前のデータ確認とクリップボードコピー
- **自動保存**: Google Sheets APIを使用したスプレッドシートへの自動保存
- **エラーハンドリング**: リトライ機能付きの堅牢なAPI通信
- **レスポンシブデザイン**: モバイル対応のUIデザイン

## 技術スタック
- **フロントエンド**: Vanilla JavaScript/HTML/CSS（ビルドプロセス不要）
- **バックエンド**: Python FastAPI
- **データベース**: Google Sheets（Google Sheets API経由）
- **認証**: Google Service Account
- **パッケージ管理**: uv
- **テスト**: pytest
- **コード品質**: ruff, black, mypy

## 🚀 クイックスタート

### 1. 依存関係のインストール
```bash
# 開発環境のセットアップ
make dev

# または直接uvを使用
uv sync --dev
```

### 2. Google Service Account設定
1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. **Google Sheets API**を有効化
3. **Service Account**を作成してJSONキーをダウンロード
4. プロジェクトルートに`credentials.json`として保存

### 3. Spreadsheet準備
1. 新しいGoogle Spreadsheetを作成
2. Service Accountのメールアドレス（`credentials.json`の`client_email`）にSpreadsheetの**編集権限**を付与
3. SpreadsheetのIDを環境変数で設定（オプション）:
   ```bash
   export POKEMON_SHEET_ID="your_spreadsheet_id_here"
   ```

### 4. アプリケーション起動

#### ローカル開発
```bash
# APIサーバーを起動
make run

# または直接uvicornを使用
uv run uvicorn api.main:app --reload --port 8000
```

#### 本番デプロイ（Google Cloud Run）
```bash
# Cloud Runにデプロイ
gcloud builds submit --config cloudbuild.yaml

# 詳細手順は DEPLOYMENT.md を参照
```

### 5. フロントエンド使用
1. `index.html`をブラウザで開く
2. フォームにポケモンデータを入力
3. 「JSONプレビュー」でデータ確認（オプション）
4. 「JSON送信」でSpreadsheetに保存

## 📁 プロジェクト構造

### アクティブファイル
```
├── index.html              # メインHTMLフォーム
├── script.js               # フォーム処理・バリデーション
├── style.css               # レスポンシブスタイリング
├── api-client.js           # API通信・リトライ機能
├── pokemon_data.json       # ポケモンマスターデータ
├── api/
│   ├── main.py            # FastAPI サーバー
│   ├── __init__.py        # パッケージ初期化
│   └── README.md          # API仕様書
├── tests/
│   ├── test_api.py        # APIテストケース
│   └── __init__.py        # テストパッケージ初期化
├── migration/
│   └── gas-to-api.py      # GAS移行用スクリプト
├── pyproject.toml         # Python依存関係・ツール設定
├── uv.lock                # 依存関係ロックファイル
├── Makefile               # 開発タスク自動化
├── CLAUDE.md              # Claude Code用プロジェクトガイド
├── TESTING.md             # テスト手順書
└── PROJECT_STRUCTURE.md   # 詳細なプロジェクト構造説明
```

### レガシーファイル
```
legacy/
├── gas/                   # 旧Google Apps Script実装（非推奨）
│   ├── Code.js
│   └── appsscript.json
├── vercel.json            # Vercelデプロイ設定（未使用）
└── README.md              # レガシーファイル説明
```

## 🔧 開発タスク

### よく使うコマンド
```bash
make help       # 利用可能なコマンド一覧
make dev        # 開発環境セットアップ
make run        # APIサーバー起動
make test       # テスト実行
make lint       # コード品質チェック
make format     # コードフォーマット
make check      # 全チェック（CI/コミット前）
make clean      # 一時ファイル削除
```

### 開発ワークフロー
1. **機能開発**
   ```bash
   make dev      # 依存関係更新
   make run      # サーバー起動
   # 開発作業
   make check    # コード品質確認
   ```

2. **テスト実行**
   ```bash
   make test     # 単体テスト
   # ブラウザでindex.htmlを開いて結合テスト
   ```

3. **コミット前**
   ```bash
   make check    # lint + format + mypy + test
   git add .
   git commit -m "feat: 新機能追加"
   ```

## 📋 フォーム項目カスタマイズ

### 新しい項目の追加手順

1. **HTMLフォーム更新** (`index.html`)
   ```html
   <div class="form-group">
       <label for="new-field">新項目</label>
       <input type="text" id="new-field" name="new-field">
   </div>
   ```

2. **Spreadsheetヘッダー更新** (`api/main.py:179-211`)
   ```python
   headers = [
       "管理ID",
       "ポケモン名",
       # ... 既存項目
       "新項目",  # 追加
       "タイムスタンプ",
   ]
   ```

3. **データマッピング更新** (`api/main.py:223-255`)
   ```python
   row_data = [
       data.id,
       data.name.ja,
       # ... 既存データ
       data.new_field or "",  # 追加
       data.timestamp,
   ]
   ```

4. **Pydanticモデル更新** (`api/main.py:116-140`)
   ```python
   class PokemonData(BaseModel):
       # ... 既存フィールド
       new_field: Optional[str] = ""  # 追加
   ```

5. **フロントエンド処理更新** (`script.js:formatFormData()`)
   ```javascript
   return {
       // ... 既存データ
       newField: form.elements['new-field'].value,  // 追加
   };
   ```

### 世代固有フィールドの追加
1. **HTML**: `generation-fields`内に条件表示フィールドを追加
2. **JavaScript**: `updateGenerationSpecificFields()`関数を更新
3. **バックエンド**: 対応する世代の条件分岐を追加

## ✅ バリデーション設定

### フロントエンドバリデーション (`script.js`)

#### 必須項目チェック
```javascript
// formatFormData()内
const requiredFields = form.querySelectorAll('[required]');
requiredFields.forEach(field => {
    if (!field.value) {
        isValid = false;
        field.style.borderColor = '#f44336';
    }
});
```

#### カスタムバリデーション追加
```javascript
// 例: IDフォーマットチェック
function validateId(id) {
    const pattern = /^\d{2}[MTLE]\d{2}$/;
    return pattern.test(id);
}

// formatFormData()内に追加
if (!validateId(form.elements['id'].value)) {
    alert('管理IDの形式が正しくありません（例: 08M01）');
    return null;
}
```

### バックエンドバリデーション (`api/main.py`)

#### Pydanticによる型検証
```python
class PokemonData(BaseModel):
    id: str = Field(..., min_length=5, max_length=5, pattern=r'^\d{2}[MTLE]\d{2}$')
    level: int = Field(..., ge=1, le=100)
    generation: int = Field(..., ge=1, le=9)
```

#### カスタムバリデーター
```python
from pydantic import validator

class PokemonData(BaseModel):
    # ... フィールド定義
    
    @validator('dexNo')
    def validate_dex_no(cls, v):
        if not v.isdigit() or int(v) < 1 or int(v) > 1010:
            raise ValueError('全国図鑑Noは1-1010の範囲で入力してください')
        return v.zfill(4)
```

## 🔌 API仕様

### エンドポイント一覧
- `GET /` - API情報
- `GET /health` - ヘルスチェック
- `GET /api/databases` - 利用可能なデータベース一覧
- `POST /api/{db_name}/data` - データ作成
- `GET /api/{db_name}/data` - データ一覧取得（ページネーション対応）
- `GET /api/{db_name}/data/{id}` - 特定データ取得
- `DELETE /api/{db_name}/data/{id}` - データ削除

### データフロー
```
フロントエンド → APIクライアント → FastAPI → Google Sheets API → Spreadsheet
    ↓              ↓               ↓            ↓
index.html → api-client.js → api/main.py → gspread → Google Sheets
```

### エラーハンドリング
- **リトライ機能**: 指数バックオフによる自動リトライ（最大3回）
- **認証エラー**: Google認証の詳細エラー表示
- **ネットワークエラー**: 接続エラーの適切な処理
- **バリデーションエラー**: フィールド別エラー表示

## 🧪 テスト

### 自動テスト実行
```bash
make test                    # 全テスト実行
uv run pytest tests/        # 直接pytest実行
uv run pytest -v            # 詳細出力
uv run pytest --cov=api     # カバレッジ付き
```

### 手動テスト
1. **API単体テスト**: `TESTING.md`のcurlコマンド実行
2. **フォーム結合テスト**: ブラウザでの実際のフォーム操作
3. **Spreadsheet確認**: データがSpreadsheetに正しく保存されているか確認

## 🚨 トラブルシューティング

### よくある問題

#### 認証エラー
- `credentials.json`が正しく配置されているか確認
- Service AccountにSpreadsheetの編集権限があるか確認
- Google Sheets APIが有効化されているか確認

#### 接続エラー
- APIサーバーが起動しているか確認 (`curl http://localhost:8000/health`)
- SpreadsheetのIDが正しく設定されているか確認
- ネットワーク接続を確認

#### CORS エラー
- フロントエンドから異なるポートのAPIにアクセスする場合は、`api/main.py`のCORS設定を確認

#### フォームバリデーション
- 必須項目が入力されているか確認
- データ形式が正しいか確認（特に管理IDのフォーマット）

### ログ確認
```bash
# APIサーバーのログ確認
make run  # コンソールにログが表示される

# ブラウザのコンソールでJavaScriptエラー確認
# F12 → Console タブ
```

## 📈 パフォーマンス最適化

### フロントエンド
- **画像最適化**: pokemon_data.jsonのサイズ最適化
- **キャッシュ**: ブラウザキャッシュの活用
- **遅延読み込み**: 大きなデータセットの場合の検討事項

### バックエンド
- **バッチ処理**: 複数データの一括処理（将来の拡張）
- **キャッシュ**: Google Sheets APIレスポンスのキャッシュ
- **非同期処理**: 大量データ処理時の非同期実装

## 🔒 セキュリティ

### 認証情報管理
- `credentials.json`は絶対にgit管理に含めない
- 本番環境では環境変数での認証情報管理を推奨
- Service Accountの権限は最小限に設定

### アクセス制御
- Spreadsheetのアクセス権限を適切に設定
- APIエンドポイントへのアクセス制限（必要に応じて）

## 📚 関連ドキュメント

- `DEPLOYMENT.md` - **Google Cloud Run デプロイ手順**
- `TESTING.md` - 詳細なテスト手順
- `PROJECT_STRUCTURE.md` - プロジェクト構造の詳細説明
- `api/README.md` - API仕様の詳細
- `CLAUDE.md` - Claude Code用の開発ガイド
- `legacy/README.md` - 旧実装に関する説明

## 🤝 コントリビューション

### 開発手順
1. **ブランチ作成**: `git checkout -b feature/new-feature`
2. **開発**: 機能実装・テスト追加
3. **品質チェック**: `make check`
4. **コミット**: `git commit -m "feat: 新機能追加"`
5. **プッシュ**: `git push origin feature/new-feature`

### コード規約
- **Python**: PEP 8準拠（black, ruffで自動整形）
- **JavaScript**: ES6+記法、関数型プログラミングを意識
- **コミットメッセージ**: Conventional Commits形式

## 📄 ライセンス
このプロジェクトは個人使用を目的としています。

## 👤 作者
- **あかブロス**
- **作成日**: 2025-03-16
- **FastAPI移行**: 2025-07-15

---

## 🔗 クイックリンク
- [Google Sheets API ドキュメント](https://developers.google.com/sheets/api)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)
- [uv ドキュメント](https://docs.astral.sh/uv/)
- [Pydantic ドキュメント](https://docs.pydantic.dev/)