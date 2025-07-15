#!/usr/bin/env python3
"""
GAS（Google Apps Script）からAPIへのデータ移行ツール
既存のGoogle SheetsのデータをPython APIに移行する
"""

import argparse
import json
import logging
import time
from datetime import datetime

import gspread
import requests
from oauth2client.service_account import ServiceAccountCredentials

# ログ設定
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class GasToApiMigrator:
    def __init__(
        self, credentials_path, source_sheet_id, api_base_url, database_name="pokemon"
    ):
        """
        初期化

        Args:
            credentials_path: Google認証情報のパス
            source_sheet_id: 移行元のスプレッドシートID
            api_base_url: 移行先のAPIのベースURL
            database_name: 移行先のデータベース名
        """
        self.credentials_path = credentials_path
        self.source_sheet_id = source_sheet_id
        self.api_base_url = api_base_url
        self.database_name = database_name

        # Google Sheets クライアントを初期化
        self.gc = self._init_google_sheets()

    def _init_google_sheets(self):
        """Google Sheets クライアントを初期化"""
        try:
            scope = [
                "https://spreadsheets.google.com/feeds",
                "https://www.googleapis.com/auth/drive",
            ]
            creds = ServiceAccountCredentials.from_json_keyfile_name(
                self.credentials_path, scope
            )
            return gspread.authorize(creds)
        except Exception as e:
            logger.error(f"Google Sheets認証エラー: {e}")
            raise

    def get_source_data(self, sheet_name="Sheet1"):
        """
        移行元スプレッドシートからデータを取得

        Args:
            sheet_name: シート名

        Returns:
            list: レコードのリスト
        """
        try:
            spreadsheet = self.gc.open_by_key(self.source_sheet_id)
            sheet = spreadsheet.worksheet(sheet_name)

            # 全データを取得
            records = sheet.get_all_records()
            logger.info(f"取得したレコード数: {len(records)}")

            return records
        except Exception as e:
            logger.error(f"データ取得エラー: {e}")
            raise

    def transform_data(self, record):
        """
        GAS形式からAPI形式にデータを変換

        Args:
            record: GAS形式のレコード

        Returns:
            dict: API形式のデータ
        """
        try:
            # 技リストの構築
            moves = []
            for i in range(1, 5):
                move = record.get(f"技{i}", "").strip()
                if move:
                    moves.append(move)

            # リボンリストの構築
            ribbons = []
            for i in range(1, 4):
                ribbon = record.get(f"リボン{i}", "").strip()
                if ribbon:
                    ribbons.append(ribbon)

            # API形式に変換
            api_data = {
                "id": record.get("管理ID", ""),
                "name": {"ja": record.get("ポケモン名", "")},
                "shiny": record.get("色違い", ""),
                "dexNo": str(record.get("全国図鑑No", "")).zfill(4),
                "generation": int(record.get("世代", 0)),
                "game": record.get("ゲーム", ""),
                "eventName": record.get("配信イベント名", ""),
                "distribution": {
                    "method": record.get("配信方法", ""),
                    "location": record.get("配信場所", ""),
                    "startDate": record.get("配信開始日", ""),
                    "endDate": record.get("配信終了日", "") or None,
                },
                "otName": record.get("おやめい", ""),
                "trainerId": record.get("ID", ""),
                "metLocation": record.get("出会った場所", ""),
                "ball": record.get("ボール", ""),
                "level": int(record.get("レベル", 1)),
                "ability": record.get("とくせい", ""),
                "nature": record.get("せいかく", ""),
                "gender": record.get("せいべつ", ""),
                "gigantamax": record.get("キョダイマックス", ""),
                "terastallize": record.get("テラスタイプ", ""),
                "moves": moves,
                "heldItem": record.get("持ち物", ""),
                "ribbons": ribbons,
                "otherInfo": record.get("その他特記事項", ""),
                "timestamp": record.get("タイムスタンプ", datetime.now().isoformat()),
            }

            return api_data

        except Exception as e:
            logger.error(f"データ変換エラー: {e}")
            logger.error(f"レコード: {record}")
            raise

    def send_to_api(self, data):
        """
        変換されたデータをAPIに送信

        Args:
            data: API形式のデータ

        Returns:
            dict: APIからのレスポンス
        """
        try:
            url = f"{self.api_base_url}/api/{self.database_name}/data"
            headers = {"Content-Type": "application/json"}

            response = requests.post(url, json=data, headers=headers, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"API送信エラー: {response.status_code}")
                logger.error(f"レスポンス: {response.text}")
                return None

        except Exception as e:
            logger.error(f"API送信エラー: {e}")
            return None

    def migrate_all_data(self, sheet_name="Sheet1", batch_size=10, delay=1):
        """
        全データを移行

        Args:
            sheet_name: 移行元のシート名
            batch_size: バッチサイズ
            delay: リクエスト間の待機時間（秒）

        Returns:
            dict: 移行結果のサマリー
        """
        logger.info("データ移行を開始します...")

        # 移行元データを取得
        source_data = self.get_source_data(sheet_name)

        if not source_data:
            logger.warning("移行するデータがありません")
            return {"success": 0, "errors": 0, "total": 0}

        success_count = 0
        error_count = 0
        error_details = []

        # バッチ処理
        for i in range(0, len(source_data), batch_size):
            batch = source_data[i : i + batch_size]
            logger.info(
                f"バッチ {i//batch_size + 1} を処理中... ({i+1}-{min(i+batch_size, len(source_data))}/{len(source_data)})"
            )

            for record in batch:
                try:
                    # データ変換
                    api_data = self.transform_data(record)

                    # API送信
                    result = self.send_to_api(api_data)

                    if result and result.get("success"):
                        success_count += 1
                        logger.info(f"成功: {api_data['id']}")
                    else:
                        error_count += 1
                        error_msg = f"失敗: {api_data['id']} - {result.get('message', '不明なエラー') if result else 'API送信失敗'}"
                        logger.error(error_msg)
                        error_details.append(error_msg)

                    # 待機
                    time.sleep(delay)

                except Exception as e:
                    error_count += 1
                    error_msg = f"処理エラー: {record.get('管理ID', 'ID不明')} - {str(e)}"
                    logger.error(error_msg)
                    error_details.append(error_msg)

        # 結果サマリー
        result_summary = {
            "success": success_count,
            "errors": error_count,
            "total": len(source_data),
            "error_details": error_details,
        }

        logger.info(
            f"移行完了: 成功 {success_count}, 失敗 {error_count}, 合計 {len(source_data)}"
        )

        return result_summary

    def validate_api_connection(self):
        """API接続を検証"""
        try:
            url = f"{self.api_base_url}/health"
            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                logger.info("API接続テスト成功")
                return True
            else:
                logger.error(f"API接続テスト失敗: {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"API接続テストエラー: {e}")
            return False

    def backup_source_data(self, output_file="backup_data.json"):
        """移行元データをバックアップ"""
        try:
            source_data = self.get_source_data()

            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(source_data, f, ensure_ascii=False, indent=2)

            logger.info(f"バックアップ完了: {output_file}")
            return True

        except Exception as e:
            logger.error(f"バックアップエラー: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description="GAS to API データ移行ツール")
    parser.add_argument("--credentials", required=True, help="Google認証情報ファイルのパス")
    parser.add_argument("--source-sheet-id", required=True, help="移行元スプレッドシートID")
    parser.add_argument("--api-url", required=True, help="移行先APIのベースURL")
    parser.add_argument("--database", default="pokemon", help="移行先データベース名")
    parser.add_argument("--sheet-name", default="Sheet1", help="移行元シート名")
    parser.add_argument("--batch-size", type=int, default=10, help="バッチサイズ")
    parser.add_argument("--delay", type=float, default=1, help="リクエスト間の待機時間（秒）")
    parser.add_argument("--backup", action="store_true", help="移行前にバックアップを作成")
    parser.add_argument("--dry-run", action="store_true", help="実際の移行を行わずテストのみ実行")

    args = parser.parse_args()

    # 移行ツールを初期化
    migrator = GasToApiMigrator(
        credentials_path=args.credentials,
        source_sheet_id=args.source_sheet_id,
        api_base_url=args.api_url,
        database_name=args.database,
    )

    # API接続テスト
    if not migrator.validate_api_connection():
        logger.error("API接続テストに失敗しました。URLを確認してください。")
        return

    # バックアップ作成
    if args.backup and not migrator.backup_source_data():
        logger.error("バックアップに失敗しました。")
        return

    # ドライランの場合はデータ変換のテストのみ実行
    if args.dry_run:
        logger.info("ドライラン実行中...")
        source_data = migrator.get_source_data(args.sheet_name)
        if source_data:
            test_record = source_data[0]
            try:
                api_data = migrator.transform_data(test_record)
                logger.info("データ変換テスト成功")
                logger.info(
                    f"変換例: {json.dumps(api_data, ensure_ascii=False, indent=2)}"
                )
            except Exception as e:
                logger.error(f"データ変換テストエラー: {e}")
        return

    # 実際の移行を実行
    result = migrator.migrate_all_data(
        sheet_name=args.sheet_name, batch_size=args.batch_size, delay=args.delay
    )

    # 結果を表示
    print("\n" + "=" * 50)
    print("移行結果サマリー")
    print("=" * 50)
    print(f"成功: {result['success']}")
    print(f"失敗: {result['errors']}")
    print(f"合計: {result['total']}")

    if result["error_details"]:
        print("\nエラー詳細:")
        for error in result["error_details"]:
            print(f"  - {error}")


if __name__ == "__main__":
    main()
