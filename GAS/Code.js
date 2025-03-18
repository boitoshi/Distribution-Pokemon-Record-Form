const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "3600"
};

// スプレッドシートIDをスクリプトプロパティから取得
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

// CORS用のプリフライトリクエスト対応
function doOptions(e) {
  return createJsonResponse('');
}

// POSTリクエスト対応
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = savePokemonData(data);
    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: `エラーが発生しました: ${error.message}`
    });
  }
}

// GETリクエスト対応
function doGet(e) {
  return createJsonResponse({
    success: true,
    message: "GET request received"
  });
}

// JSONレスポンスを作成する共通関数
function createJsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  for (const key in HEADERS) {
    output.setHeader(key, HEADERS[key]);
  }
  return output;
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
