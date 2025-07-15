# Makefile for Pokemon Distribution API

.PHONY: install dev test lint format mypy clean run help

# デフォルトのヘルプ
help:
	@echo "利用可能なコマンド:"
	@echo "  install    - 本番依存関係をインストール"
	@echo "  dev        - 開発依存関係を含めてインストール"
	@echo "  test       - テストを実行"
	@echo "  lint       - ruffでリントを実行"
	@echo "  format     - blackとruffでフォーマット"
	@echo "  mypy       - mypyで型チェック"
	@echo "  clean      - 一時ファイルを削除"
	@echo "  run        - 開発サーバーを起動"
	@echo "  check      - 全チェック（lint, format, mypy, test）"

# 依存関係のインストール
install:
	uv sync

# 開発依存関係を含めてインストール
dev:
	uv sync --dev

# テストの実行
test:
	uv run pytest

# リントの実行
lint:
	uv run ruff check .

# フォーマットの実行
format:
	uv run black .
	uv run ruff check --fix .

# 型チェック
mypy:
	uv run mypy .

# 一時ファイルの削除
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +

# 開発サーバーの起動
run:
	uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# データ移行ツール
migrate:
	uv run python migration/gas-to-api.py

# 全チェック
check: lint mypy test