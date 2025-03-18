function doGet() {
  return HtmlService.createHtmlOutputFromFile('index');
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
    data.ability,
    data.nature,
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

function getPokemonData() {
  const url = 'https://raw.githubusercontent.com/boitoshi/JSON-conversion-spreadsheet/refs/heads/main/pokemon_data.json'; // JSONファイルのURL
  const response = UrlFetchApp.fetch(url);
  return JSON.parse(response.getContentText());
}
