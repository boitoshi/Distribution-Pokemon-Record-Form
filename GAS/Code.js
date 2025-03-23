function doPost(e) {
  // eがnullまたはundefinedの場合をチェック
  if (!e || !e.postData || !e.postData.contents) {
    console.error("Error: postData is null or undefined");
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: "No post data received." })).setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetName = "Sheet1"; // 適切なシート名を指定してください
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`シート名「${sheetName}」が見つかりません。`);
    }

    // ヘッダー行の存在を確認し、なければ作成する
    let headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const expectedHeaders = [
        "管理ID", "ポケモン名", "全国図鑑No", "世代", "ゲーム", "配信イベント名",
        "配信方法", "配信場所", "配信開始日", "配信終了日",
        "レベル", "せいべつ", "とくせい", "せいかく", "キョダイマックス", "テラスタイプ",
        "持ち物", "技1", "技2", "技3", "技4",
        "リボン1", "リボン2", "リボン3", "その他特記事項", "タイムスタンプ"
    ];
    let headerMismatch = false;
    if (headerRow.length !== expectedHeaders.length) {
        headerMismatch = true;
    } else {
        for (let i = 0; i < expectedHeaders.length; i++) {
            if (headerRow[i] !== expectedHeaders[i]) {
                headerMismatch = true;
                break;
            }
        }
    }

    if (headerMismatch) {
        sheet.clear(); // ヘッダーが不一致の場合、シートをクリアしてヘッダーを書き込む
        sheet.appendRow(expectedHeaders);
    }

    const rowData = [
        data.id,
        data.name.ja,
        data.dexNo,
        data.generation,
        data.game,
        data.eventName,
        data.distribution.method,
        data.distribution.location,
        data.distribution.startDate,
        data.distribution.endDate,
        data.level,
        data.gender,
        data.ability,
        data.nature,
        data.gigantamax,
        data.terastallize,
        data.moves[0], data.moves[1], data.moves[2], data.moves[3],
        data.heldItem,
        data.ribbons[0], data.ribbons[1], data.ribbons[2],
        data.otherInfo,
        data.timestamp
    ];

    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: "データを正常に処理しました。" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}
