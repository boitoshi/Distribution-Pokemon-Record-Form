# Python 3.12のスリムイメージを使用
FROM python:3.12-slim

# 環境変数の設定
ENV PYTHONUNBUFFERED=1 \
    LANG=C.UTF-8

# 作業ディレクトリを設定
WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential curl \
 && rm -rf /var/lib/apt/lists/*

# 依存関係
COPY pyproject.toml uv.lock ./
RUN pip install uv \
 && uv sync --frozen --no-dev

# 依存関係をインストール（本番環境用）
RUN uv sync --frozen --no-dev

# アプリケーションコードをコピー
COPY api/ ./api/

# Cloud Run default port
EXPOSE 8080

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
