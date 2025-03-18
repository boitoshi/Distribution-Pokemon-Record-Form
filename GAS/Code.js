function doPost(e) {
  try {
    // POSTリクエストのデータを取得
    const data = JSON.parse(e.postData.contents);

    // データを保存する関数を呼び出し
    const result = savePokemonData(data);

    // 成功レスポンスを返す
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // エラーが発生した場合のレスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: `エラーが発生しました: ${error.message}`
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function savePokemonData(data) {
  const sheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID').getSheetByName('Sheet1');
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
  return { success: true, message: 'データが保存されました' };
}
