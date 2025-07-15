# Python 3.12のスリムイメージを使用
FROM python:3.12-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# uvをインストール
RUN pip install uv

# pyproject.tomlとuv.lockをコピー
COPY pyproject.toml uv.lock ./

# 依存関係をインストール（本番環境用）
RUN uv sync --frozen --no-dev

# アプリケーションコードをコピー
COPY api/ ./api/

# ポート8080を公開（Cloud Runのデフォルト）
EXPOSE 8080

# アプリケーションを起動
CMD ["uv", "run", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]