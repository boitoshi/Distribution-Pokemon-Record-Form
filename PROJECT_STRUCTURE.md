# プロジェクト構造

## 現在のアクティブなファイル

### フロントエンド
- `index.html` - メインのHTMLフォーム
- `script.js` - フォーム処理とバリデーション
- `style.css` - スタイリング
- `api-client.js` - API通信クライアント
- `pokemon_data.json` - ポケモンデータ（図鑑番号など）

### バックエンド
- `api/main.py` - FastAPI サーバー
- `api/__init__.py` - Pythonパッケージ初期化
- `api/README.md` - API仕様書

### テスト
- `tests/test_api.py` - APIテストケース
- `tests/__init__.py` - テストパッケージ初期化

### 設定・管理
- `pyproject.toml` - Python プロジェクト設定（uv管理）
- `uv.lock` - 依存関係ロックファイル
- `CLAUDE.md` - Claude Code用のプロジェクトガイド
- `Makefile` - タスク自動化
- `README.md` - プロジェクト説明
- `README_API.md` - API仕様書

### 移行スクリプト
- `migration/gas-to-api.py` - GASからAPIへの移行用スクリプト

## 非アクティブなファイル（legacy）

### legacy/
- `legacy/gas/Code.js` - 旧Google Apps Script実装
- `legacy/gas/appsscript.json` - GAS設定
- `legacy/vercel.json` - Vercelデプロイ設定（未使用）
- `legacy/README.md` - レガシーファイルの説明

## データフロー

1. **フロントエンド** (`index.html` + `script.js`)
   ↓
2. **APIクライアント** (`api-client.js`)
   ↓
3. **FastAPI サーバー** (`api/main.py`)
   ↓
4. **Google Sheets API** → **スプレッドシート**

## 開発環境セットアップ

```bash
# 依存関係をインストール
uv sync

# APIサーバーを起動
uv run uvicorn api.main:app --reload --port 8000

# フロントエンドを表示
# index.htmlをブラウザで開く
```

## 主要な技術スタック

- **フロントエンド**: Vanilla JavaScript/HTML/CSS
- **バックエンド**: Python FastAPI
- **データベース**: Google Sheets (Google Sheets API経由)
- **認証**: Google Service Account
- **パッケージ管理**: uv
- **テスト**: pytest