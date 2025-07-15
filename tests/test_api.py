#!/usr/bin/env python3
"""
APIのテストスクリプト
"""

from unittest.mock import Mock, patch

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health_check() -> None:
    """ヘルスチェックのテスト"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_root_endpoint() -> None:
    """ルートエンドポイントのテスト"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "ポケモン配信データ管理API"
    assert data["version"] == "1.0.0"


def test_get_databases() -> None:
    """データベース一覧取得のテスト"""
    response = client.get("/api/databases")
    assert response.status_code == 200
    data = response.json()
    assert "databases" in data
    assert "pokemon" in data["databases"]


@patch("api.main.get_google_sheets_client")
def test_create_pokemon_data_mock(mock_get_client) -> None:
    """ポケモンデータ作成のテスト（モック使用）"""
    # モックの設定
    mock_sheet = Mock()
    mock_sheet.row_count = 0
    mock_sheet.append_row = Mock()

    mock_spreadsheet = Mock()
    mock_spreadsheet.worksheet.return_value = mock_sheet

    mock_client = Mock()
    mock_client.open_by_key.return_value = mock_spreadsheet

    mock_get_client.return_value = mock_client

    # テストデータ
    test_data = {
        "id": "08M01",
        "name": {"ja": "ピカチュウ"},
        "shiny": "",
        "dexNo": "0025",
        "generation": 8,
        "game": "ソード・シールド",
        "eventName": "テストイベント",
        "distribution": {
            "method": "シリアルコード",
            "location": "テスト会場",
            "startDate": "2024-01-01",
            "endDate": "2024-01-31",
        },
        "level": 25,
        "moves": ["10まんボルト", "でんこうせっか"],
        "ribbons": ["プレミアリボン"],
    }

    # APIを呼び出し
    response = client.post("/api/pokemon/data", json=test_data)

    # 結果の検証
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "正常に保存されました" in data["message"]

    # モックが呼ばれたことを確認
    mock_client.open_by_key.assert_called_once()
    assert mock_sheet.append_row.call_count == 2  # ヘッダー行とデータ行


def test_invalid_pokemon_data() -> None:
    """無効なポケモンデータのテスト"""
    invalid_data = {"invalid_field": "invalid_value"}

    response = client.post("/api/pokemon/data", json=invalid_data)
    assert response.status_code == 422  # Validation error


def test_get_pokemon_data_mock() -> None:
    """ポケモンデータ取得のテスト（モック使用）"""
    with patch("api.main.get_google_sheets_client") as mock_get_client:
        # モックの設定
        mock_sheet = Mock()
        mock_sheet.get_all_records.return_value = [
            {"管理ID": "08M01", "ポケモン名": "ピカチュウ", "全国図鑑No": "0025", "世代": 8}
        ]

        mock_spreadsheet = Mock()
        mock_spreadsheet.worksheet.return_value = mock_sheet

        mock_client = Mock()
        mock_client.open_by_key.return_value = mock_spreadsheet

        mock_get_client.return_value = mock_client

        # APIを呼び出し
        response = client.get("/api/pokemon/data")

        # 結果の検証
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["管理ID"] == "08M01"


if __name__ == "__main__":
    print("APIテストを実行中...")

    # 基本的なテスト
    test_health_check()
    print("✅ ヘルスチェック: 成功")

    test_root_endpoint()
    print("✅ ルートエンドポイント: 成功")

    test_get_databases()
    print("✅ データベース一覧: 成功")

    test_create_pokemon_data_mock()
    print("✅ ポケモンデータ作成: 成功")

    test_invalid_pokemon_data()
    print("✅ 無効データ検証: 成功")

    test_get_pokemon_data_mock()
    print("✅ ポケモンデータ取得: 成功")

    print("\n🎉 すべてのテストが成功しました！")
