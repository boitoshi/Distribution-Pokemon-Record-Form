function doPost(e) {
  try {
    // POSTリクエストのデータを取得
    const data = JSON.parse(e.postData.contents);

    // データを保存する関数を呼び出し
    const result = savePokemonData(data);

    // 成功レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*") // CORSを許可
      .setHeader("Access-Control-Allow-Methods", "POST"); // 許可するHTTPメソッド
  } catch (error) {
    // エラーが発生した場合のレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: `エラーが発生しました: ${error.message}`
    }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*") // CORSを許可
      .setHeader("Access-Control-Allow-Methods", "POST"); // 許可するHTTPメソッド
  }
}

function savePokemonData(data) {
  // スプレッドシートのIDを指定
  const sheet = SpreadsheetApp.openById('SPREADSHEET_ID').getSheetByName('Sheet1');

  // データをスプレッドシートに追加
  sheet.appendRow([
    data.id,
    data.name.ja,
    data.dexNo,
    data.generation,
    data.game,
    data.version,
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
    data.heldItem,
    data.moves[0] || '',
    data.moves[1] || '',
    data.moves[2] || '',
    data.moves[3] || '',
    data.ribbons.join(', '),
    data.otherInfo,
    data.timestamp
  ]);

  // 成功レスポンスを返す
  return { success: true, message: 'データが正常に保存されました！' };
}
