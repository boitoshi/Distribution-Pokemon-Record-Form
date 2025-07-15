# Legacy Files

このディレクトリには、プロジェクトの過去のバージョンや使用されなくなったファイルが保存されています。

## 構成

- `gas/` - 旧Google Apps Script実装（非推奨）
  - `Code.js` - Google Apps Script バックエンド処理
  - `appsscript.json` - GAS プロジェクト設定
- `vercel.json` - Vercel デプロイ設定（現在未使用）

## 現在の実装

現在のプロジェクトは以下の構成で動作します：

- フロントエンド: Vanilla JavaScript (index.html, script.js, style.css)
- バックエンド: Python FastAPI (api/main.py)
- データベース: Google Sheets API経由でのスプレッドシート操作

## 移行について

Google Apps Script から Python FastAPI への移行は完了しています。
このlegacyディレクトリのファイルは参考用として保持されていますが、
現在のシステムでは使用されません。