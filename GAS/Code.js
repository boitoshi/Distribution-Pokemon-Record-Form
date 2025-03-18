// 共通のヘッダー設定
function getHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "3600"
  };
}

// CORS用のプリフライトリクエスト対応
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(getHeaders());
}

// POSTリクエスト対応
function doPost(e) {
  try {
    // POSTリクエストのデータを取得
    const data = JSON.parse(e.postData.contents);
    
    // データを保存する関数を呼び出し
    const result = savePokemonData(data);
    
    // 成功レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(getHeaders());
  } catch (error) {
    // エラーが発生した場合のレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: `エラーが発生しました: ${error.message}`
    }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(getHeaders());
  }
}

// GETリクエスト対応
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "GET request received"
  }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(getHeaders());
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
