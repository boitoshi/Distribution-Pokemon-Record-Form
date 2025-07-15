"""
配信ポケモンデータ管理API
Google Sheets APIを使用してデータを管理するFastAPIサーバー
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Optional

import gspread
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from oauth2client.service_account import ServiceAccountCredentials
from pydantic import BaseModel

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ポケモン配信データ管理API",
    description="Google Sheetsを使用した配信ポケモンデータの管理システム",
    version="1.0.0",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に設定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース設定（複数シート対応）
DATABASES = {
    "pokemon": {
        "sheet_id": os.getenv("POKEMON_SHEET_ID", "115LHiKGpPtVAGGaV2tS2HchnZLeCFlBcRu0ZXZxJ_NQ"),
        "sheet_name": "Sheet1",
    },
    # 他のデータベースを追加可能
    # "cards": {
    #     "sheet_id": os.getenv("CARDS_SHEET_ID", "another_sheet_id"),
    #     "sheet_name": "Sheet1"
    # }
}


# Google Sheets認証設定
def get_google_sheets_client():
    """Google Sheets APIクライアントを取得"""
    try:
        # サービスアカウントキーファイルのパス
        creds_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")

        if os.path.exists(creds_path):
            # ファイルから認証情報を読み込み
            scope = [
                "https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive",
            ]
            creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
        else:
            # 環境変数から認証情報を読み込み（Vercel用）
            creds_json = os.getenv("GOOGLE_CREDENTIALS_JSON")
            if creds_json:
                creds_dict = json.loads(creds_json)
                scope = [
                    "https://spreadsheets.google.com/feeds",
                    "https://www.googleapis.com/auth/drive",
                ]
                creds = ServiceAccountCredentials.from_json_keyfile_dict(
                    creds_dict, scope
                )
            else:
                raise ValueError("Google認証情報が見つかりません")

        client = gspread.authorize(creds)
        return client
    except Exception as e:
        logger.error(f"Google Sheets認証エラー: {e}")
        raise HTTPException(status_code=500, detail="Google Sheets認証に失敗しました") from e


def get_sheet(db_name: str, sheet_name: str = None):
    """指定されたデータベースのシートを取得"""
    if db_name not in DATABASES:
        raise HTTPException(status_code=404, detail=f"データベース '{db_name}' が見つかりません")

    client = get_google_sheets_client()
    db_config = DATABASES[db_name]

    try:
        spreadsheet = client.open_by_key(db_config["sheet_id"])
        sheet = spreadsheet.worksheet(sheet_name or db_config["sheet_name"])
        return sheet
    except Exception as e:
        logger.error(f"シート取得エラー: {e}")
        raise HTTPException(status_code=500, detail="シートの取得に失敗しました") from e


# Pydanticモデル定義
class PokemonDistribution(BaseModel):
    method: str
    location: str
    start_date: str
    end_date: Optional[str] = None


class PokemonName(BaseModel):
    ja: str


class PokemonData(BaseModel):
    id: str
    name: PokemonName
    shiny: Optional[str] = ""
    dex_no: str
    generation: int
    game: str
    event_name: str
    distribution: PokemonDistribution
    ot_name: Optional[str] = ""
    trainer_id: Optional[str] = ""
    met_location: Optional[str] = ""
    ball: Optional[str] = ""
    level: int
    ability: Optional[str] = ""
    nature: Optional[str] = ""
    gender: Optional[str] = ""
    gigantamax: Optional[str] = ""
    terastallize: Optional[str] = ""
    moves: Optional[list[str]] = []
    held_item: Optional[str] = ""
    ribbons: Optional[list[str]] = []
    other_info: Optional[str] = ""
    timestamp: Optional[str] = None


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict[str, Any]] = None


# API エンドポイント


@app.get("/")
async def root():
    return {"message": "ポケモン配信データ管理API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/databases")
async def get_databases():
    """利用可能なデータベース一覧を取得"""
    return {"databases": list(DATABASES.keys())}


@app.post("/api/{db_name}/data", response_model=ApiResponse)
async def create_data(db_name: str, data: PokemonData):
    """データを作成"""
    try:
        sheet = get_sheet(db_name)

        # タイムスタンプを現在時刻に設定
        if not data.timestamp:
            data.timestamp = datetime.now().isoformat()

        # ヘッダー行を確認・作成
        headers = [
            "管理ID",
            "ポケモン名",
            "色違い",
            "全国図鑑No",
            "世代",
            "ゲーム",
            "配信イベント名",
            "配信方法",
            "配信場所",
            "配信開始日",
            "配信終了日",
            "おやめい",
            "ID",
            "出会った場所",
            "ボール",
            "レベル",
            "せいべつ",
            "とくせい",
            "せいかく",
            "キョダイマックス",
            "テラスタイプ",
            "持ち物",
            "技1",
            "技2",
            "技3",
            "技4",
            "リボン1",
            "リボン2",
            "リボン3",
            "その他特記事項",
            "タイムスタンプ",
        ]

        # 最初の行がヘッダーかチェック
        if sheet.row_count == 0 or sheet.row_values(1) != headers:
            if sheet.row_count > 0:
                sheet.clear()
            sheet.append_row(headers)

        # データ行を準備
        moves = data.moves or []
        ribbons = data.ribbons or []

        row_data = [
            data.id,
            data.name.ja,
            data.shiny,
            data.dex_no,
            data.generation,
            data.game,
            data.event_name,
            data.distribution.method,
            data.distribution.location,
            data.distribution.start_date,
            data.distribution.end_date or "",
            data.ot_name,
            data.trainer_id,
            data.met_location,
            data.ball,
            data.level,
            data.gender,
            data.ability,
            data.nature,
            data.gigantamax,
            data.terastallize,
            data.held_item,
            moves[0] if len(moves) > 0 else "",
            moves[1] if len(moves) > 1 else "",
            moves[2] if len(moves) > 2 else "",
            moves[3] if len(moves) > 3 else "",
            ribbons[0] if len(ribbons) > 0 else "",
            ribbons[1] if len(ribbons) > 1 else "",
            ribbons[2] if len(ribbons) > 2 else "",
            data.other_info,
            data.timestamp,
        ]

        # データを追加
        sheet.append_row(row_data)

        logger.info(f"データ作成成功: {data.id}")
        return ApiResponse(success=True, message="データが正常に保存されました")

    except Exception as e:
        logger.error(f"データ作成エラー: {e}")
        raise HTTPException(status_code=500, detail=f"データの保存に失敗しました: {str(e)}") from e


@app.get("/api/{db_name}/data")
async def get_data(db_name: str, limit: int = 100, offset: int = 0):
    """データを取得"""
    try:
        sheet = get_sheet(db_name)

        # 全データを取得
        all_records = sheet.get_all_records()

        # ページネーション
        start = offset
        end = start + limit
        records = all_records[start:end]

        return {
            "success": True,
            "data": records,
            "total": len(all_records),
            "offset": offset,
            "limit": limit,
        }

    except Exception as e:
        logger.error(f"データ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"データの取得に失敗しました: {str(e)}") from e


@app.get("/api/{db_name}/data/{item_id}")
async def get_data_by_id(db_name: str, item_id: str):
    """IDでデータを取得"""
    try:
        sheet = get_sheet(db_name)
        records = sheet.get_all_records()

        # IDで検索
        for record in records:
            if record.get("管理ID") == item_id:
                return {"success": True, "data": record}

        raise HTTPException(status_code=404, detail="データが見つかりません")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"データ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"データの取得に失敗しました: {str(e)}") from e


@app.delete("/api/{db_name}/data/{item_id}")
async def delete_data(db_name: str, item_id: str):
    """データを削除"""
    try:
        sheet = get_sheet(db_name)

        # 該当行を検索
        cell = sheet.find(item_id)
        if cell:
            sheet.delete_rows(cell.row)
            return ApiResponse(success=True, message="データが削除されました")
        else:
            raise HTTPException(status_code=404, detail="削除するデータが見つかりません")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"データ削除エラー: {e}")
        raise HTTPException(status_code=500, detail=f"データの削除に失敗しました: {str(e)}") from e


# エラーハンドラー
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {"success": False, "message": exc.detail}


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"予期しないエラー: {exc}")
    return {"success": False, "message": "内部サーバーエラーが発生しました"}


if __name__ == "__main__":
    import uvicorn
    import os

    # Cloud Run用の設定
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
