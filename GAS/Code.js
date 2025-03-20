// CORS用のプリフライトリクエスト対応
function doGet(e) {
  if (e.parameter.method === 'OPTIONS') {
    return ContentService.createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  } else {
    // GETリクエストの処理（必要に応じて実装）
    return ContentService.createTextOutput("GET request received")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// POSTリクエスト対応
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      throw new Error("リクエストデータが空です");
    }

    // JSON解析
    const data = JSON.parse(e.postData.contents);

    // データを保存
    const result = savePokemonData(data);

    // CORSヘッダーを設定してレスポンスを返す
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  } catch (error) {
    // エラー発生時もCORSヘッダーを設定してレスポンスを返す
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: `エラー: ${error.message}` }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  }
}

// スプレッドシートにデータを保存
function savePokemonData(data) {
  try {
    const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    const SHEET_NAME = PropertiesService.getScriptProperties().getProperty("SHEET_NAME");
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error("シートが見つかりません");
    }

    // データ検証（例）
    if (!data.id || !data.name || !data.dexNo) {
      throw new Error("必須データが不足しています");
    }

    const values = [[
      data.id,
      data.name.ja,
      data.dexNo,
      data.generation,
      data.game,
      data.eventName,
      data.distribution?.method || '',
      data.distribution?.location || '',
      data.distribution?.startDate || '',
      data.distribution?.endDate || '',
      data.level || '',
      data.gender || '',
      data.ability || '',
      data.nature || '',
      data.gigantamax || '',
      data.terastallize || '',
      data.heldItem || '',
      data.moves?.[0] || '',
      data.moves?.[1] || '',
      data.moves?.[2] || '',
      data.moves?.[3] || '',
      (data.ribbons || []).join(', '),
      data.otherInfo || '',
      data.timestamp || new Date().toISOString()
    ]];

    // データを追加
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, values[0].length).setValues(values);

    return { success: true, message: 'データが正常に保存されました！' };
  } catch (error) {
    return { success: false, message: `データ保存エラー: ${error.message}` };
  }
}
